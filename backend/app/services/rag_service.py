import os
import uuid
import time
import datetime
from typing import List, Dict, Optional, AsyncGenerator
from pathlib import Path
import chromadb
from chromadb.config import Settings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import Chroma
from langchain.document_loaders import (
    PyPDFLoader, 
    Docx2txtLoader, 
    UnstructuredFileLoader,
    TextLoader
)
from langchain.schema import Document
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import LLMChainExtractor
from app.services.model_factory import ModelFactory
from app.models.requests import DocumentSource, CollectionInfo
import tempfile
import magic
import logging

logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self):
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={'device': 'cpu'}
        )
        
        # Initialize ChromaDB
        self.chroma_client = chromadb.PersistentClient(
            path="./chroma_db",
            settings=Settings(anonymized_telemetry=False)
        )
        
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        
        self.model_factory = ModelFactory()
        
        # Supported file types
        self.supported_types = {
            'application/pdf': '.pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
            'text/plain': '.txt',
            'text/markdown': '.md',
            'text/csv': '.csv'
        }
    
    def _get_file_extension(self, file_content: bytes) -> str:
        """Detect file type and return appropriate extension."""
        file_type = magic.from_buffer(file_content, mime=True)
        return self.supported_types.get(file_type, '.txt')
    
    def _save_temp_file(self, file_content: bytes, file_name: str) -> str:
        """Save uploaded file to temporary location."""
        temp_dir = Path("./temp_uploads")
        temp_dir.mkdir(exist_ok=True)
        
        temp_file_path = temp_dir / f"{uuid.uuid4()}_{file_name}"
        with open(temp_file_path, 'wb') as f:
            f.write(file_content)
        
        return str(temp_file_path)
    
    def _load_document(self, file_path: str, file_type: str) -> str:
        """Load document content based on file type."""
        try:
            if file_type.lower() == '.pdf':
                loader = PyPDFLoader(file_path)
            elif file_type.lower() == '.docx':
                loader = Docx2txtLoader(file_path)
            elif file_type.lower() in ['.txt', '.md', '.csv']:
                loader = TextLoader(file_path, encoding='utf-8')
            else:
                # Try unstructured loader for other formats
                loader = UnstructuredFileLoader(file_path)
            
            documents = loader.load()
            return "\n\n".join([doc.page_content for doc in documents])
            
        except Exception as e:
            logger.error(f"Error loading document {file_path}: {str(e)}")
            raise Exception(f"Failed to load document: {str(e)}")
    
    def _create_documents_with_metadata(self, text: str, file_name: str, document_id: str) -> List[Document]:
        """Split text into chunks and create documents with metadata."""
        chunks = self.text_splitter.split_text(text)
        
        documents = []
        for i, chunk in enumerate(chunks):
            doc = Document(
                page_content=chunk,
                metadata={
                    "document_id": document_id,
                    "file_name": file_name,
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                    "source": file_name
                }
            )
            documents.append(doc)
        
        return documents
    
    async def upload_document(self, file_content: bytes, file_name: str, collection_name: str = "default") -> Dict:
        """Upload and process a document for RAG."""
        start_time = time.time()
        
        try:
            # Generate document ID
            document_id = str(uuid.uuid4())
            
            # Detect file type
            file_type = self._get_file_extension(file_content)
            
            # Save to temp file
            temp_file_path = self._save_temp_file(file_content, file_name)
            
            # Load document content
            text_content = self._load_document(temp_file_path, file_type)
            
            # Split into chunks
            documents = self._create_documents_with_metadata(text_content, file_name, document_id)
            
            # Create or get collection
            collection = self.chroma_client.get_or_create_collection(
                name=collection_name,
                metadata={"description": f"Collection for {collection_name}"}
            )
            
            # Add documents to vector store
            texts = [doc.page_content for doc in documents]
            metadatas = [doc.metadata for doc in documents]
            ids = [f"{document_id}_{i}" for i in range(len(documents))]
            
            collection.add(
                documents=texts,
                metadatas=metadatas,
                ids=ids
            )
            
            # Clean up temp file
            os.remove(temp_file_path)
            
            latency_ms = (time.time() - start_time) * 1000
            
            return {
                "document_id": document_id,
                "file_name": file_name,
                "chunks_processed": len(documents),
                "collection_name": collection_name,
                "message": f"Successfully processed {len(documents)} chunks from {file_name}",
                "latency_ms": latency_ms,
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error uploading document: {str(e)}")
            raise Exception(f"Failed to upload document: {str(e)}")
    
    async def ask_question(self, question: str, collection_name: str = "default", 
                          model_provider: str = "ollama", model_name: str = "mistral:7b",
                          temperature: float = 0.7, max_tokens: Optional[int] = None,
                          top_k: int = 5, similarity_threshold: float = 0.7) -> Dict:
        """Ask a question about uploaded documents."""
        start_time = time.time()
        
        try:
            # Get collection
            collection = self.chroma_client.get_collection(name=collection_name)
            
            # Query for relevant documents
            results = collection.query(
                query_texts=[question],
                n_results=top_k,
                include=["documents", "metadatas", "distances"]
            )
            
            # Filter by similarity threshold
            relevant_chunks = []
            sources = []
            
            for i, (doc, metadata, distance) in enumerate(zip(
                results['documents'][0], 
                results['metadatas'][0], 
                results['distances'][0]
            )):
                similarity_score = 1 - distance  # Convert distance to similarity
                
                if similarity_score >= similarity_threshold:
                    relevant_chunks.append(doc)
                    sources.append({
                        "document_id": metadata.get("document_id", ""),
                        "file_name": metadata.get("file_name", ""),
                        "chunk_text": doc,
                        "similarity_score": similarity_score,
                        "chunk_index": metadata.get("chunk_index", i)
                    })
            
            if not relevant_chunks:
                return {
                    "answer": "I couldn't find any relevant information in the uploaded documents to answer your question. Please try rephrasing your question or upload more relevant documents.",
                    "question": question,
                    "sources": [],
                    "model_provider": model_provider,
                    "model_name": model_name,
                    "token_usage": None,
                    "latency_ms": (time.time() - start_time) * 1000,
                    "timestamp": datetime.datetime.utcnow().isoformat()
                }
            
            # Create context from relevant chunks
            context = "\n\n".join(relevant_chunks)
            
            # Create prompt for the model
            system_prompt = f"""You are a helpful assistant that answers questions based on the provided context from uploaded documents. 

Context from documents:
{context}

Instructions:
1. Answer the question based ONLY on the information provided in the context
2. If the answer cannot be found in the context, say so clearly
3. Be concise but comprehensive
4. Cite the source documents when possible
5. If you're unsure about something, acknowledge the uncertainty

Question: {question}"""
            
            # Get model and generate response
            model = self.model_factory.get_model(model_provider, model_name)
            
            response = await model.agenerate(
                system_prompt=system_prompt,
                user_prompt=question,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            latency_ms = (time.time() - start_time) * 1000
            
            return {
                "answer": response.content,
                "question": question,
                "sources": sources,
                "model_provider": model_provider,
                "model_name": model_name,
                "token_usage": response.token_usage,
                "latency_ms": latency_ms,
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error asking question: {str(e)}")
            raise Exception(f"Failed to process question: {str(e)}")
    
    async def ask_question_stream(self, question: str, collection_name: str = "default",
                                 model_provider: str = "ollama", model_name: str = "mistral:7b",
                                 temperature: float = 0.7, max_tokens: Optional[int] = None,
                                 top_k: int = 5, similarity_threshold: float = 0.7) -> AsyncGenerator[Dict, None]:
        """Ask a question with streaming response."""
        start_time = time.time()
        
        try:
            # Get collection
            collection = self.chroma_client.get_collection(name=collection_name)
            
            # Query for relevant documents
            results = collection.query(
                query_texts=[question],
                n_results=top_k,
                include=["documents", "metadatas", "distances"]
            )
            
            # Filter by similarity threshold
            relevant_chunks = []
            sources = []
            
            for i, (doc, metadata, distance) in enumerate(zip(
                results['documents'][0], 
                results['metadatas'][0], 
                results['distances'][0]
            )):
                similarity_score = 1 - distance
                
                if similarity_score >= similarity_threshold:
                    relevant_chunks.append(doc)
                    sources.append({
                        "document_id": metadata.get("document_id", ""),
                        "file_name": metadata.get("file_name", ""),
                        "chunk_text": doc,
                        "similarity_score": similarity_score,
                        "chunk_index": metadata.get("chunk_index", i)
                    })
            
            if not relevant_chunks:
                yield {
                    "content": "I couldn't find any relevant information in the uploaded documents to answer your question. Please try rephrasing your question or upload more relevant documents.",
                    "is_complete": True,
                    "sources": [],
                    "latency_ms": (time.time() - start_time) * 1000
                }
                return
            
            # Create context from relevant chunks
            context = "\n\n".join(relevant_chunks)
            
            # Create prompt for the model
            system_prompt = f"""You are a helpful assistant that answers questions based on the provided context from uploaded documents. 

Context from documents:
{context}

Instructions:
1. Answer the question based ONLY on the information provided in the context
2. If the answer cannot be found in the context, say so clearly
3. Be concise but comprehensive
4. Cite the source documents when possible
5. If you're unsure about something, acknowledge the uncertainty

Question: {question}"""
            
            # Get model and generate streaming response
            model = self.model_factory.get_model(model_provider, model_name)
            
            async for chunk in model.agenerate_stream(
                system_prompt=system_prompt,
                user_prompt=question,
                temperature=temperature,
                max_tokens=max_tokens
            ):
                yield {
                    "content": chunk.content,
                    "is_complete": chunk.is_complete,
                    "sources": sources if chunk.is_complete else [],
                    "latency_ms": (time.time() - start_time) * 1000 if chunk.is_complete else None
                }
                
        except Exception as e:
            logger.error(f"Error in streaming question: {str(e)}")
            yield {
                "content": f"Error: {str(e)}",
                "is_complete": True,
                "sources": [],
                "latency_ms": (time.time() - start_time) * 1000
            }
    
    def get_collections(self) -> List[CollectionInfo]:
        """Get information about all collections."""
        collections = []
        
        for collection in self.chroma_client.list_collections():
            collection_info = self.chroma_client.get_collection(collection.name)
            count = collection_info.count()
            
            # Get unique documents in collection
            documents = {}
            if count > 0:
                results = collection_info.get(limit=count)
                for metadata in results['metadatas']:
                    doc_id = metadata.get('document_id', '')
                    if doc_id not in documents:
                        documents[doc_id] = {
                            "document_id": doc_id,
                            "file_name": metadata.get('file_name', ''),
                            "chunks": 0
                        }
                    documents[doc_id]["chunks"] += 1
            
            collections.append(CollectionInfo(
                collection_name=collection.name,
                document_count=len(documents),
                total_chunks=count,
                documents=list(documents.values()),
                created_at=collection.metadata.get("created_at", ""),
                last_updated=datetime.datetime.utcnow().isoformat()
            ))
        
        return collections
    
    def delete_document(self, document_id: str, collection_name: str = "default") -> Dict:
        """Delete a document from the collection."""
        try:
            collection = self.chroma_client.get_collection(name=collection_name)
            
            # Get all chunks for this document
            results = collection.get(
                where={"document_id": document_id}
            )
            
            if not results['ids']:
                raise Exception(f"Document {document_id} not found in collection {collection_name}")
            
            # Delete the chunks
            collection.delete(ids=results['ids'])
            
            return {
                "document_id": document_id,
                "collection_name": collection_name,
                "chunks_deleted": len(results['ids']),
                "message": f"Successfully deleted document {document_id} with {len(results['ids'])} chunks",
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error deleting document: {str(e)}")
            raise Exception(f"Failed to delete document: {str(e)}")
    
    def delete_collection(self, collection_name: str) -> Dict:
        """Delete an entire collection."""
        try:
            self.chroma_client.delete_collection(name=collection_name)
            
            return {
                "collection_name": collection_name,
                "message": f"Successfully deleted collection {collection_name}",
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error deleting collection: {str(e)}")
            raise Exception(f"Failed to delete collection: {str(e)}")


# Global RAG service instance
rag_service = RAGService() 