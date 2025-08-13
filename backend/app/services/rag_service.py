import os
import uuid
import time
import datetime
from typing import List, Dict, Optional, AsyncGenerator
from pathlib import Path
import chromadb
from chromadb.config import Settings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_community.document_loaders import (
    PyPDFLoader, 
    Docx2txtLoader, 
    UnstructuredFileLoader,
    TextLoader
)
from langchain.schema import Document
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import LLMChainExtractor
from app.services.model_factory import ModelFactory
from app.services.confidence_service import ConfidenceService
from app.services.document_analytics_service import document_analytics_service
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
            chunk_size=800,
            chunk_overlap=150,
            length_function=len,
            separators=["\n\n", "\n", ". ", "! ", "? ", " ", ""]
        )
        
        self.model_factory = ModelFactory()
        self.confidence_service = ConfidenceService()
        
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
    
    def _create_documents_with_metadata(self, text: str, file_name: str, document_id: str, tags: List[str] = None) -> List[Document]:
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
                    "source": file_name,
                    "tags": ",".join(tags) if tags else ""
                }
            )
            documents.append(doc)
        
        return documents
    
    async def upload_document(self, file_content: bytes, file_name: str, collection_name: str = "default", tags: List[str] = None) -> Dict:
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
            documents = self._create_documents_with_metadata(text_content, file_name, document_id, tags or [])
            
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
            
            # Analyze document
            document_analytics = document_analytics_service.analyze_document_content(text_content, file_name)
            
            return {
                "document_id": document_id,
                "file_name": file_name,
                "chunks_processed": len(documents),
                "collection_name": collection_name,
                "tags": tags or [],
                "message": f"Successfully processed {len(documents)} chunks from {file_name}",
                "latency_ms": latency_ms,
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "analytics": document_analytics
            }
            
        except Exception as e:
            logger.error(f"Error uploading document: {str(e)}")
            raise Exception(f"Failed to upload document: {str(e)}")
    
    async def ask_question(self, question: str, collection_name: str = "default", 
                          model_provider: str = "ollama", model_name: str = "llama3.2:3b",
                          temperature: float = 0.7, max_tokens: Optional[int] = None,
                          top_k: int = 5, similarity_threshold: float = -0.5, filter_tags: List[str] = None,
                          collection_names: List[str] = None) -> Dict:
        """Ask a question about uploaded documents."""
        start_time = time.time()
        
        try:
            # Determine which collections to query
            collections_to_query = collection_names if collection_names else [collection_name]
            
            # Query multiple collections and combine results
            all_results = {
                'documents': [],
                'metadatas': [],
                'distances': []
            }
            
            for coll_name in collections_to_query:
                try:
                    collection = self.chroma_client.get_collection(name=coll_name)
                    
                    # Query for relevant documents (we'll filter by tags after query)
                    results = collection.query(
                        query_texts=[question],
                        n_results=top_k * 2 if filter_tags else top_k,  # Get more results if filtering
                        include=["documents", "metadatas", "distances"]
                    )
                    
                    # If no results from semantic search, try to get some documents anyway
                    if len(results['documents'][0]) == 0:
                        logger.warning(f"No results from semantic search, trying to get documents without query")
                        try:
                            fallback_results = collection.get(limit=top_k)
                            if len(fallback_results['documents']) > 0:
                                logger.info(f"Fallback query found {len(fallback_results['documents'])} documents")
                                results = {
                                    'documents': [fallback_results['documents']],
                                    'metadatas': [fallback_results['metadatas']],
                                    'distances': [[0.0] * len(fallback_results['documents'])]  # Assume perfect similarity
                                }
                        except Exception as e:
                            logger.error(f"Fallback query also failed: {str(e)}")
                    
                    # Add collection name to metadata for tracking
                    for metadata in results['metadatas'][0]:
                        metadata['collection_name'] = coll_name
                    
                    # Combine results
                    all_results['documents'].extend(results['documents'][0])
                    all_results['metadatas'].extend(results['metadatas'][0])
                    all_results['distances'].extend(results['distances'][0])
                    
                except Exception as e:
                    logger.warning(f"Could not query collection {coll_name}: {str(e)}")
                    continue
            

            
            # Sort combined results by distance (similarity)
            combined_results = list(zip(all_results['documents'], all_results['metadatas'], all_results['distances']))
            combined_results.sort(key=lambda x: x[2])  # Sort by distance
            
            # Take top results
            top_results = combined_results[:top_k * 2 if filter_tags else top_k]
            
            # Unzip results
            results = {
                'documents': [[doc for doc, _, _ in top_results]],
                'metadatas': [[metadata for _, metadata, _ in top_results]],
                'distances': [[distance for _, _, distance in top_results]]
            }
            
            # Filter by similarity threshold and tags
            relevant_chunks = []
            sources = []
            
            for i, (doc, metadata, distance) in enumerate(zip(
                results['documents'][0], 
                results['metadatas'][0], 
                results['distances'][0]
            )):
                similarity_score = 1 - distance  # Convert distance to similarity
                
                # Check if document has required tags
                doc_tags_str = metadata.get("tags", "")
                doc_tags = doc_tags_str.split(",") if doc_tags_str else []
                tag_match = True
                if filter_tags:
                    tag_match = any(tag in doc_tags for tag in filter_tags)
                
                if similarity_score >= similarity_threshold and tag_match:
                    relevant_chunks.append(doc)
                    sources.append({
                        "document_id": metadata.get("document_id", ""),
                        "file_name": metadata.get("file_name", ""),
                        "chunk_text": doc,
                        "similarity_score": similarity_score,
                        "chunk_index": metadata.get("chunk_index", i),
                        "tags": doc_tags
                    })
            
            # If no relevant chunks found, try with an even lower threshold
            if not relevant_chunks:
                # Try with a much lower similarity threshold
                lower_threshold = max(-0.8, similarity_threshold - 0.5)
                
                # Re-filter with lower threshold
                relevant_chunks = []
                sources = []
                
                for i, (doc, metadata, distance) in enumerate(zip(
                    results['documents'][0], 
                    results['metadatas'][0], 
                    results['distances'][0]
                )):
                    similarity_score = 1 - distance
                    
                    # Check if document has required tags
                    doc_tags_str = metadata.get("tags", "")
                    doc_tags = doc_tags_str.split(",") if doc_tags_str else []
                    tag_match = True
                    if filter_tags:
                        tag_match = any(tag in doc_tags for tag in filter_tags)
                    
                    if similarity_score >= lower_threshold and tag_match:
                        relevant_chunks.append(doc)
                        sources.append({
                            "document_id": metadata.get("document_id", ""),
                            "file_name": metadata.get("file_name", ""),
                            "chunk_text": doc,
                            "similarity_score": similarity_score,
                            "chunk_index": metadata.get("chunk_index", i),
                            "tags": doc_tags,
                            "collection_name": metadata.get("collection_name", collection_name)
                        })
                
                # If still no relevant chunks, include all available chunks for collection-level questions
                if not relevant_chunks:
                    # Check if this is a collection-level question
                    collection_question_keywords = [
                        "documents in", "collection", "what documents", "files in", 
                        "uploaded documents", "stored documents", "available documents"
                    ]
                    
                    is_collection_question = any(keyword in question.lower() for keyword in collection_question_keywords)
                    
                    if is_collection_question:
                        logger.info("Collection-level question detected, including all available chunks")
                        # Include all chunks for collection-level questions
                        for i, (doc, metadata, distance) in enumerate(zip(
                            results['documents'][0], 
                            results['metadatas'][0], 
                            results['distances'][0]
                        )):
                            doc_tags_str = metadata.get("tags", "")
                            doc_tags = doc_tags_str.split(",") if doc_tags_str else []
                            tag_match = True
                            if filter_tags:
                                tag_match = any(tag in doc_tags for tag in filter_tags)
                            
                            if tag_match:
                                relevant_chunks.append(doc)
                                sources.append({
                                    "document_id": metadata.get("document_id", ""),
                                    "file_name": metadata.get("file_name", ""),
                                    "chunk_text": doc,
                                    "similarity_score": 1 - distance,
                                    "chunk_index": metadata.get("chunk_index", i),
                                    "tags": doc_tags,
                                    "collection_name": metadata.get("collection_name", collection_name)
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
            model = self.model_factory.get_model(
                model_provider, 
                model_name, 
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            # Handle Ollama models differently
            if model_provider == "ollama":
                # For Ollama, use ainvoke with the full prompt
                full_prompt = f"{system_prompt}\n\nQuestion: {question}"
                response_content = await model.ainvoke(full_prompt)
                response = type('Response', (), {
                    'content': response_content,
                    'token_usage': None
                })()
            else:
                # For other models, use agenerate
                from langchain.schema import HumanMessage, SystemMessage
                messages = [
                    SystemMessage(content=system_prompt),
                    HumanMessage(content=question)
                ]
                response_result = await model.agenerate([messages])
                response = response_result.generations[0][0]
                response = type('Response', (), {
                    'content': response.text,
                    'token_usage': response.generation_info.get('token_usage') if hasattr(response, 'generation_info') else None
                })()
            
            latency_ms = (time.time() - start_time) * 1000
            
            # Calculate confidence score
            confidence_data = self.confidence_service.calculate_overall_confidence(
                response.content, question, sources
            )
            
            return {
                "answer": response.content,
                "question": question,
                "sources": sources,
                "model_provider": model_provider,
                "model_name": model_name,
                "token_usage": response.token_usage,
                "latency_ms": latency_ms,
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "confidence": confidence_data
            }
            
        except Exception as e:
            logger.error(f"Error asking question: {str(e)}")
            raise Exception(f"Failed to process question: {str(e)}")
    
    async def ask_question_stream(self, question: str, collection_name: str = "default",
                                 model_provider: str = "ollama", model_name: str = "llama3.2:3b",
                                 temperature: float = 0.7, max_tokens: Optional[int] = None,
                                 top_k: int = 5, similarity_threshold: float = -0.5, filter_tags: List[str] = None,
                                 collection_names: List[str] = None) -> AsyncGenerator[Dict, None]:
        """Ask a question with streaming response."""
        start_time = time.time()
        
        try:
            # Determine which collections to query
            collections_to_query = collection_names if collection_names else [collection_name]
            
            # Query multiple collections and combine results
            all_results = {
                'documents': [],
                'metadatas': [],
                'distances': []
            }
            
            for coll_name in collections_to_query:
                try:
                    collection = self.chroma_client.get_collection(name=coll_name)
                    
                    # Query for relevant documents (we'll filter by tags after query)
                    results = collection.query(
                        query_texts=[question],
                        n_results=top_k * 2 if filter_tags else top_k,  # Get more results if filtering
                        include=["documents", "metadatas", "distances"]
                    )
                    
                    # Debug logging
                    logger.info(f"ChromaDB query for '{question}' returned {len(results['documents'][0])} documents")
                    if len(results['documents'][0]) > 0:
                        logger.info(f"First few distances: {results['distances'][0][:5]}")
                        logger.info(f"First document preview: {results['documents'][0][0][:100]}...")
                    else:
                        logger.warning(f"No documents returned from ChromaDB query for: {question}")
                    
                    # Add collection name to metadata for tracking
                    for metadata in results['metadatas'][0]:
                        metadata['collection_name'] = coll_name
                    
                    # Combine results
                    all_results['documents'].extend(results['documents'][0])
                    all_results['metadatas'].extend(results['metadatas'][0])
                    all_results['distances'].extend(results['distances'][0])
                    
                except Exception as e:
                    logger.warning(f"Could not query collection {coll_name}: {str(e)}")
                    continue
            
            # Sort combined results by distance (similarity)
            combined_results = list(zip(all_results['documents'], all_results['metadatas'], all_results['distances']))
            combined_results.sort(key=lambda x: x[2])  # Sort by distance
            
            # Take top results
            top_results = combined_results[:top_k * 2 if filter_tags else top_k]
            
            # Unzip results
            results = {
                'documents': [[doc for doc, _, _ in top_results]],
                'metadatas': [[metadata for _, metadata, _ in top_results]],
                'distances': [[distance for _, _, distance in top_results]]
            }
            
            # Filter by similarity threshold and tags
            relevant_chunks = []
            sources = []
            
            for i, (doc, metadata, distance) in enumerate(zip(
                results['documents'][0], 
                results['metadatas'][0], 
                results['distances'][0]
            )):
                similarity_score = 1 - distance
                
                # Check if document has required tags
                doc_tags_str = metadata.get("tags", "")
                doc_tags = doc_tags_str.split(",") if doc_tags_str else []
                tag_match = True
                if filter_tags:
                    tag_match = any(tag in doc_tags for tag in filter_tags)
                
                if similarity_score >= similarity_threshold and tag_match:
                    relevant_chunks.append(doc)
                    sources.append({
                        "document_id": metadata.get("document_id", ""),
                        "file_name": metadata.get("file_name", ""),
                        "chunk_text": doc,
                        "similarity_score": similarity_score,
                        "chunk_index": metadata.get("chunk_index", i),
                        "tags": doc_tags
                    })
            
            if not relevant_chunks:
                # Try with a much lower similarity threshold
                lower_threshold = max(-0.8, similarity_threshold - 0.5)
                
                # Re-filter with lower threshold
                relevant_chunks = []
                sources = []
                
                for i, (doc, metadata, distance) in enumerate(zip(
                    results['documents'][0], 
                    results['metadatas'][0], 
                    results['distances'][0]
                )):
                    similarity_score = 1 - distance
                    
                    # Check if document has required tags
                    doc_tags_str = metadata.get("tags", "")
                    doc_tags = doc_tags_str.split(",") if doc_tags_str else []
                    tag_match = True
                    if filter_tags:
                        tag_match = any(tag in doc_tags for tag in filter_tags)
                    
                    if similarity_score >= lower_threshold and tag_match:
                        relevant_chunks.append(doc)
                        sources.append({
                            "document_id": metadata.get("document_id", ""),
                            "file_name": metadata.get("file_name", ""),
                            "chunk_text": doc,
                            "similarity_score": similarity_score,
                            "chunk_index": metadata.get("chunk_index", i),
                            "tags": doc_tags,
                            "collection_name": metadata.get("collection_name", collection_name)
                        })
                
                # If still no relevant chunks, include all available chunks for collection-level questions
                if not relevant_chunks:
                    # Check if this is a collection-level question
                    collection_question_keywords = [
                        "documents in", "collection", "what documents", "files in", 
                        "uploaded documents", "stored documents", "available documents"
                    ]
                    
                    is_collection_question = any(keyword in question.lower() for keyword in collection_question_keywords)
                    
                    if is_collection_question:
                        logger.info("Collection-level question detected, including all available chunks")
                        # Include all chunks for collection-level questions
                        for i, (doc, metadata, distance) in enumerate(zip(
                            results['documents'][0], 
                            results['metadatas'][0], 
                            results['distances'][0]
                        )):
                            doc_tags_str = metadata.get("tags", "")
                            doc_tags = doc_tags_str.split(",") if doc_tags_str else []
                            tag_match = True
                            if filter_tags:
                                tag_match = any(tag in doc_tags for tag in filter_tags)
                            
                            if tag_match:
                                relevant_chunks.append(doc)
                                sources.append({
                                    "document_id": metadata.get("document_id", ""),
                                    "file_name": metadata.get("file_name", ""),
                                    "chunk_text": doc,
                                    "similarity_score": 1 - distance,
                                    "chunk_index": metadata.get("chunk_index", i),
                                    "tags": doc_tags,
                                    "collection_name": metadata.get("collection_name", collection_name)
                                })
                
                if not relevant_chunks:
                    # Estimate token usage for error message
                    error_message = "I couldn't find any relevant information in the uploaded documents to answer your question. Please try rephrasing your question or upload more relevant documents."
                    prompt_tokens = len(question) // 4
                    completion_tokens = len(error_message) // 4
                    total_tokens = prompt_tokens + completion_tokens
                    
                    token_usage = {
                        "prompt_tokens": prompt_tokens,
                        "completion_tokens": completion_tokens,
                        "total_tokens": total_tokens
                    }
                    
                    yield {
                        "content": error_message,
                        "is_complete": True,
                        "sources": [],
                        "latency_ms": (time.time() - start_time) * 1000,
                        "token_usage": token_usage
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
            model = self.model_factory.get_model(
                model_provider, 
                model_name, 
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            # Handle Ollama models differently for streaming
            if model_provider == "ollama":
                # For Ollama, generate the full response and yield it as a single chunk
                full_prompt = f"{system_prompt}\n\nQuestion: {question}"
                response_content = await model.ainvoke(full_prompt)
                
                # Estimate token usage for Ollama (since it doesn't provide exact counts)
                # Rough estimation: 1 token ≈ 4 characters for English text
                prompt_tokens = len(full_prompt) // 4
                completion_tokens = len(response_content) // 4
                total_tokens = prompt_tokens + completion_tokens
                
                token_usage = {
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "total_tokens": total_tokens
                }
                
                # Calculate confidence score
                confidence_data = self.confidence_service.calculate_overall_confidence(
                    response_content, question, sources
                )
                
                yield {
                    "content": response_content,
                    "is_complete": True,
                    "sources": sources,
                    "latency_ms": (time.time() - start_time) * 1000,
                    "confidence": confidence_data,
                    "token_usage": token_usage
                }
            else:
                # For other models, use streaming with enhanced token usage extraction
                from langchain.schema import HumanMessage, SystemMessage
                from app.services.generation_service import StreamingCallbackHandler
                
                messages = [
                    SystemMessage(content=system_prompt),
                    HumanMessage(content=question)
                ]
                
                # Create callback handler for token usage extraction
                callback_handler = StreamingCallbackHandler()
                
                try:
                    # Use streaming approach with callback handler
                    response_result = await model.agenerate(
                        [messages],
                        callbacks=[callback_handler]
                    )
                    response_content = response_result.generations[0][0].text
                    
                    # Use token usage from callback handler (enhanced extraction)
                    token_usage = None
                    if callback_handler.token_usage:
                        token_usage = {
                            "prompt_tokens": callback_handler.token_usage.prompt_tokens,
                            "completion_tokens": callback_handler.token_usage.completion_tokens,
                            "total_tokens": callback_handler.token_usage.total_tokens
                        }
                    else:
                        # Fallback to response_result if callback handler doesn't have token usage
                        if hasattr(response_result, 'llm_output') and response_result.llm_output:
                            token_info = response_result.llm_output.get('token_usage', {})
                            if token_info:
                                token_usage = {
                                    "prompt_tokens": token_info.get('prompt_tokens', 0),
                                    "completion_tokens": token_info.get('completion_tokens', 0),
                                    "total_tokens": token_info.get('total_tokens', 0)
                                }
                    
                    # Calculate confidence score
                    confidence_data = self.confidence_service.calculate_overall_confidence(
                        response_content, question, sources
                    )
                    
                    yield {
                        "content": response_content,
                        "is_complete": True,
                        "sources": sources,
                        "latency_ms": (time.time() - start_time) * 1000,
                        "confidence": confidence_data,
                        "token_usage": token_usage
                    }
                    
                except Exception as e:
                    logger.error(f"Error in streaming RAG response: {str(e)}")
                    # Fallback to non-streaming approach
                    response_result = await model.agenerate([messages])
                    response_content = response_result.generations[0][0].text
                    
                    # Extract token usage from response if available
                    token_usage = None
                    if hasattr(response_result, 'llm_output') and response_result.llm_output:
                        token_info = response_result.llm_output.get('token_usage', {})
                        if token_info:
                            token_usage = {
                                "prompt_tokens": token_info.get('prompt_tokens', 0),
                                "completion_tokens": token_info.get('completion_tokens', 0),
                                "total_tokens": token_info.get('total_tokens', 0)
                            }
                    
                    # Calculate confidence score
                    confidence_data = self.confidence_service.calculate_overall_confidence(
                        response_content, question, sources
                    )
                    
                    yield {
                        "content": response_content,
                        "is_complete": True,
                        "sources": sources,
                        "latency_ms": (time.time() - start_time) * 1000,
                        "confidence": confidence_data,
                        "token_usage": token_usage
                    }
                
        except Exception as e:
            logger.error(f"Error in streaming question: {str(e)}")
            
            # Estimate token usage for error message
            error_message = f"Error: {str(e)}"
            prompt_tokens = len(question) // 4
            completion_tokens = len(error_message) // 4
            total_tokens = prompt_tokens + completion_tokens
            
            token_usage = {
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": total_tokens
            }
            
            yield {
                "content": error_message,
                "is_complete": True,
                "sources": [],
                "latency_ms": (time.time() - start_time) * 1000,
                "token_usage": token_usage
            }
    
    def list_all_collections(self) -> Dict:
        """List all collections and their document counts for debugging."""
        try:
            collections = self.chroma_client.list_collections()
            result = {}
            
            for collection in collections:
                try:
                    count = collection.count()
                    result[collection.name] = {
                        "name": collection.name,
                        "document_count": count,
                        "metadata": collection.metadata
                    }
                    logger.info(f"Collection {collection.name}: {count} documents")
                except Exception as e:
                    logger.error(f"Error getting count for collection {collection.name}: {str(e)}")
                    result[collection.name] = {
                        "name": collection.name,
                        "document_count": "error",
                        "error": str(e)
                    }
            
            return result
        except Exception as e:
            logger.error(f"Error listing collections: {str(e)}")
            return {"error": str(e)}
    
    def get_collections(self) -> List[CollectionInfo]:
        """Get information about all collections."""
        collections = []
        
        for collection in self.chroma_client.list_collections():
            collection_info = self.chroma_client.get_collection(collection.name)
            count = collection_info.count()
            
            # Get unique documents in collection and collect tags
            documents = {}
            available_tags = set()
            if count > 0:
                results = collection_info.get(limit=count)
                for metadata in results['metadatas']:
                    doc_id = metadata.get('document_id', '')
                    tags_str = metadata.get('tags', '')
                    tags = tags_str.split(",") if tags_str else []
                    
                    # Add tags to available tags set
                    available_tags.update(tags)
                    
                    if doc_id not in documents:
                        documents[doc_id] = {
                            "document_id": doc_id,
                            "file_name": metadata.get('file_name', ''),
                            "chunks": 0,
                            "tags": tags
                        }
                    documents[doc_id]["chunks"] += 1
            
            collections.append(CollectionInfo(
                collection_name=collection.name,
                document_count=len(documents),
                total_chunks=count,
                documents=list(documents.values()),
                created_at=collection.metadata.get("created_at", ""),
                last_updated=datetime.datetime.utcnow().isoformat(),
                available_tags=list(available_tags)
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