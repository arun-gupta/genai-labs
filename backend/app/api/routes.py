from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse
from typing import Optional
from app.models.requests import GenerateRequest, SummarizeRequest
from app.models.responses import GenerationResponse, SummarizeResponse, StreamChunk, ErrorResponse
from app.services.generation_service import GenerationService
from app.services.input_processor import input_processor
from app.services.analytics_service import analytics_service
from app.services.generation_analytics_service import generation_analytics_service
from app.services.language_service import language_service
from app.services.model_availability_service import model_availability_service
from app.services.prompt_template_service import prompt_template_service
from app.services.export_service import export_service
from app.services.rag_service import rag_service
from app.services.model_comparison_service import model_comparison_service
from app.models.requests import ModelProvider, RAGQuestionRequest, RAGQuestionResponse, DocumentUploadRequest, DocumentUploadResponse, CollectionInfo, DeleteDocumentRequest, ModelComparisonRequest, ModelComparisonResponse, GenerationComparisonRequest
import json
import time
import datetime
import io

router = APIRouter()
generation_service = GenerationService()


@router.post("/generate", response_model=GenerationResponse)
async def generate_text(request: GenerateRequest):
    """Generate text using the specified model."""
    try:
        start_time = time.time()
        
        # Collect the full response for non-streaming
        full_content = ""
        token_usage = None
        latency_ms = 0
        
        async for chunk in generation_service.generate_text_stream(
            system_prompt=request.system_prompt,
            user_prompt=request.user_prompt,
            model_provider=request.model_provider.value,
            model_name=request.model_name,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        ):
            full_content += chunk.content
            if chunk.token_usage:
                token_usage = chunk.token_usage
            if chunk.latency_ms:
                latency_ms = chunk.latency_ms
        
        return GenerationResponse(
            content=full_content,
            model_provider=request.model_provider.value,
            model_name=request.model_name or "default",
            token_usage=token_usage,
            latency_ms=latency_ms,
            timestamp=datetime.datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate/stream")
async def generate_text_stream(request: GenerateRequest):
    """Generate text with streaming response."""
    async def generate():
        try:
            async for chunk in generation_service.generate_text_stream(
                system_prompt=request.system_prompt,
                user_prompt=request.user_prompt,
                model_provider=request.model_provider.value,
                model_name=request.model_name,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                target_language=request.target_language or "en",
                translate_response=request.translate_response or False,
                output_format=request.output_format.value,
                num_candidates=request.num_candidates
            ):
                yield {
                    "event": "chunk",
                    "data": chunk.model_dump_json()
                }
                
                if chunk.is_complete:
                    break
                    
        except Exception as e:
            error_chunk = StreamChunk(
                content=f"Error: {str(e)}",
                is_complete=True
            )
            yield {
                "event": "error",
                "data": error_chunk.model_dump_json()
            }
    
    return EventSourceResponse(generate())


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_text(request: SummarizeRequest):
    """Summarize text using the specified model."""
    try:
        start_time = time.time()
        
        # Process input based on type
        try:
            processed_text = input_processor.validate_input(
                text=request.text,
                url=request.url,
                file_content=request.file_content,
                file_type=request.file_type
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
        # Collect the full response for non-streaming
        full_summary = ""
        token_usage = None
        latency_ms = 0
        
        async for chunk in generation_service.summarize_text_stream(
            text=processed_text,
            model_provider=request.model_provider.value,
            model_name=request.model_name,
            max_length=request.max_length,
            temperature=request.temperature,
            summary_type=request.summary_type
        ):
            full_summary += chunk.content
            if chunk.token_usage:
                token_usage = chunk.token_usage
            if chunk.latency_ms:
                latency_ms = chunk.latency_ms
        
        # Calculate compression ratio
        original_length = len(processed_text.split())
        summary_length = len(full_summary.split())
        compression_ratio = original_length / summary_length if summary_length > 0 else 0
        
        return SummarizeResponse(
            summary=full_summary,
            original_length=original_length,
            summary_length=summary_length,
            compression_ratio=compression_ratio,
            model_provider=request.model_provider.value,
            model_name=request.model_name or "default",
            token_usage=token_usage,
            latency_ms=latency_ms,
            timestamp=datetime.datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/summarize/stream")
async def summarize_text_stream(request: SummarizeRequest):
    """Summarize text with streaming response."""
    async def generate():
        try:
            # Process input based on type
            try:
                processed_text = input_processor.validate_input(
                    text=request.text,
                    url=request.url,
                    file_content=request.file_content,
                    file_type=request.file_type
                )
            except ValueError as e:
                error_chunk = StreamChunk(
                    content=f"Error: {str(e)}",
                    is_complete=True
                )
                yield {
                    "event": "error",
                    "data": error_chunk.model_dump_json()
                }
                return
            
            async for chunk in generation_service.summarize_text_stream(
                text=processed_text,
                model_provider=request.model_provider.value,
                model_name=request.model_name,
                max_length=request.max_length,
                temperature=request.temperature,
                summary_type=request.summary_type,
                target_language=request.target_language,
                translate_summary=request.translate_summary,
                output_format=request.output_format.value
            ):
                yield {
                    "event": "chunk",
                    "data": chunk.model_dump_json()
                }
                
                if chunk.is_complete:
                    break
                    
        except Exception as e:
            error_chunk = StreamChunk(
                content=f"Error: {str(e)}",
                is_complete=True
            )
            yield {
                "event": "error",
                "data": error_chunk.model_dump_json()
            }
    
    return EventSourceResponse(generate())


@router.post("/summarize/file")
async def summarize_file(
    file: UploadFile = File(...),
    model_provider: str = Form(...),
    model_name: str = Form(""),
    max_length: int = Form(150),
    temperature: float = Form(0.3),
    summary_type: str = Form("general")
):
    """Summarize uploaded file using the specified model."""
    try:
        # Read file content
        file_content = await file.read()
        
        # Determine file type from extension
        file_type = file.filename.split('.')[-1].lower() if '.' in file.filename else 'txt'
        
        # Process the file
        try:
            processed_text = input_processor.extract_text_from_file(file_content, file_type)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"File processing failed: {str(e)}")
        
        # Create request object
        request = SummarizeRequest(
            text=None,
            url=None,
            file_content=file_content,
            file_type=file_type,
            model_provider=ModelProvider(model_provider),
            model_name=model_name if model_name else None,
            max_length=max_length,
            temperature=temperature,
            summary_type=summary_type,
            stream=False
        )
        
        # Process the request
        start_time = time.time()
        
        # Collect the full response
        full_summary = ""
        token_usage = None
        latency_ms = 0
        
        async for chunk in generation_service.summarize_text_stream(
            text=processed_text,
            model_provider=request.model_provider.value,
            model_name=request.model_name,
            max_length=request.max_length,
            temperature=request.temperature,
            summary_type=request.summary_type
        ):
            full_summary += chunk.content
            if chunk.token_usage:
                token_usage = chunk.token_usage
            if chunk.latency_ms:
                latency_ms = chunk.latency_ms
        
        # Calculate compression ratio
        original_length = len(processed_text.split())
        summary_length = len(full_summary.split())
        compression_ratio = original_length / summary_length if summary_length > 0 else 0
        
        return SummarizeResponse(
            summary=full_summary,
            original_length=original_length,
            summary_length=summary_length,
            compression_ratio=compression_ratio,
            model_provider=request.model_provider.value,
            model_name=request.model_name or "default",
            token_usage=token_usage,
            latency_ms=latency_ms,
            timestamp=datetime.datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analytics")
async def analyze_summary(request: dict):
    """Analyze summary and provide comprehensive analytics."""
    try:
        original_text = request.get("original_text", "")
        summary_text = request.get("summary_text", "")
        
        if not original_text or not summary_text:
            raise HTTPException(status_code=400, detail="Both original_text and summary_text are required")
        
        analytics = analytics_service.analyze_text(original_text, summary_text)
        
        return {
            "analytics": analytics,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics failed: {str(e)}")


@router.post("/analytics/generation")
async def analyze_generation(request: dict):
    """Analyze generated text and provide comprehensive analytics."""
    try:
        system_prompt = request.get("system_prompt", "")
        user_prompt = request.get("user_prompt", "")
        generated_text = request.get("generated_text", "")
        output_format = request.get("output_format", "text")
        
        if not generated_text:
            raise HTTPException(status_code=400, detail="generated_text is required")
        
        analytics = generation_analytics_service.analyze_generation(
            system_prompt, user_prompt, generated_text, output_format
        )
        
        return {
            "analytics": analytics,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation analytics failed: {str(e)}")


@router.get("/templates")
async def get_prompt_templates():
    """Get all available prompt templates."""
    try:
        templates = prompt_template_service.get_all_templates()
        categories = prompt_template_service.get_categories()
        
        return {
            "templates": templates,
            "categories": categories
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get templates: {str(e)}")


@router.get("/templates/{category}")
async def get_templates_by_category(category: str):
    """Get templates filtered by category."""
    try:
        templates = prompt_template_service.get_templates_by_category(category)
        return {
            "templates": templates,
            "category": category
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get templates: {str(e)}")


@router.post("/templates/fill")
async def fill_template(request: dict):
    """Fill a template with provided variables."""
    try:
        template_id = request.get("template_id")
        variables = request.get("variables", {})
        
        if not template_id:
            raise HTTPException(status_code=400, detail="template_id is required")
        
        result = prompt_template_service.fill_template(template_id, variables)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fill template: {str(e)}")


@router.post("/export/{format_type}")
async def export_content(format_type: str, request: dict):
    """Export content to various formats (pdf, word, markdown)."""
    try:
        if format_type not in ["pdf", "word", "markdown"]:
            raise HTTPException(status_code=400, detail="Invalid format. Supported: pdf, word, markdown")
        
        content = request.get("content", {})
        if not content:
            raise HTTPException(status_code=400, detail="Content is required")
        
        if format_type == "pdf":
            file_content = export_service.export_to_pdf(content)
            return StreamingResponse(
                io.BytesIO(file_content),
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename=generated_content.pdf"}
            )
        elif format_type == "word":
            file_content = export_service.export_to_word(content)
            return StreamingResponse(
                io.BytesIO(file_content),
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                headers={"Content-Disposition": f"attachment; filename=generated_content.docx"}
            )
        elif format_type == "markdown":
            file_content = export_service.export_to_markdown(content)
            return StreamingResponse(
                io.BytesIO(file_content.encode('utf-8')),
                media_type="text/markdown",
                headers={"Content-Disposition": f"attachment; filename=generated_content.md"}
            )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.post("/detect-language")
async def detect_language(request: dict):
    """Detect the language of the input text."""
    try:
        text = request.get("text", "")
        
        if not text:
            raise HTTPException(status_code=400, detail="Text is required")
        
        detection = language_service.detect_language(text)
        
        return {
            "detection": detection,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Language detection failed: {str(e)}")


@router.post("/translate")
async def translate_text(request: dict):
    """Translate text to the target language."""
    try:
        text = request.get("text", "")
        target_language = request.get("target_language", "en")
        source_language = request.get("source_language", "auto")
        
        if not text:
            raise HTTPException(status_code=400, detail="Text is required")
        
        if not target_language:
            raise HTTPException(status_code=400, detail="Target language is required")
        
        translation = language_service.translate_text(text, target_language, source_language)
        
        return {
            "translation": translation,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")


@router.get("/languages")
async def get_supported_languages():
    """Get list of supported languages."""
    try:
        languages = language_service.get_supported_languages()
        
        # Group languages by family for better organization
        language_families = {}
        for code, info in languages.items():
            family = language_service.get_language_family(code)
            if family not in language_families:
                language_families[family] = []
            
            language_families[family].append({
                "code": code,
                "name": info["name"],
                "native": info["native"]
            })
        
        return {
            "languages": languages,
            "families": language_families,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get languages: {str(e)}")


@router.get("/models")
async def get_available_models():
    """Get available model providers and their configurations."""
    # Get Ollama models with availability status
    ollama_models_data = await model_availability_service.get_models_with_availability()
    
    return {
        "providers": [
            {
                "id": "openai",
                "name": "OpenAI",
                "models": ["gpt-4", "gpt-3.5-turbo", "gpt-4-turbo"],
                "requires_api_key": True
            },
            {
                "id": "anthropic",
                "name": "Anthropic",
                "models": ["claude-3-sonnet-20240229", "claude-3-haiku-20240307", "claude-2.1"],
                "requires_api_key": True
            },
            {
                "id": "ollama",
                "name": "Ollama (Local)",
                "models": [model["name"] for model in ollama_models_data["models"] if model["is_available"]],
                "requires_api_key": False
            }
        ],
        "ollama_models": ollama_models_data,
        "summary_types": [
            {"id": "general", "name": "General Summary", "description": "Standard summary of main points"},
            {"id": "bullet_points", "name": "Bullet Points", "description": "Key points in bullet format"},
            {"id": "key_points", "name": "Key Points", "description": "Extract main ideas and key points"},
            {"id": "extractive", "name": "Extractive", "description": "Select important sentences from text"}
        ],
        "supported_file_types": [
            {"extension": "txt", "name": "Text File", "description": "Plain text files"},
            {"extension": "pdf", "name": "PDF Document", "description": "PDF documents"},
            {"extension": "docx", "name": "Word Document", "description": "Microsoft Word documents"},
            {"extension": "xlsx", "name": "Excel Spreadsheet", "description": "Microsoft Excel files"},
            {"extension": "md", "name": "Markdown", "description": "Markdown files"}
        ]
    }


# RAG Endpoints
@router.post("/rag/upload", response_model=DocumentUploadResponse)
async def upload_document_for_rag(
    file: UploadFile = File(...),
    collection_name: str = Form("default"),
    tags: Optional[str] = Form("")
):
    """Upload a document for RAG processing."""
    try:
        file_content = await file.read()
        
        # Parse tags from JSON string
        tag_list = []
        if tags:
            try:
                tag_list = json.loads(tags)
            except json.JSONDecodeError:
                # If not JSON, treat as comma-separated string
                tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
        
        result = await rag_service.upload_document(
            file_content=file_content,
            file_name=file.filename,
            collection_name=collection_name,
            tags=tag_list
        )
        
        return DocumentUploadResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rag/question", response_model=RAGQuestionResponse)
async def ask_rag_question(request: RAGQuestionRequest):
    """Ask a question about uploaded documents."""
    try:
        result = await rag_service.ask_question(
            question=request.question,
            collection_name=request.collection_name,
            model_provider=request.model_provider.value,
            model_name=request.model_name,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            top_k=request.top_k,
            similarity_threshold=request.similarity_threshold,
            filter_tags=request.filter_tags,
            collection_names=request.collection_names
        )
        
        return RAGQuestionResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rag/question/stream")
async def ask_rag_question_stream(request: RAGQuestionRequest):
    """Ask a question about uploaded documents with streaming response."""
    async def generate():
        try:
            async for chunk in rag_service.ask_question_stream(
                question=request.question,
                collection_name=request.collection_name,
                model_provider=request.model_provider.value,
                model_name=request.model_name,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                top_k=request.top_k,
                similarity_threshold=request.similarity_threshold,
                filter_tags=request.filter_tags,
                collection_names=request.collection_names
            ):
                yield {
                    "event": "chunk",
                    "data": json.dumps(chunk)
                }
                
                if chunk.get("is_complete", False):
                    break
                    
        except Exception as e:
            error_chunk = {
                "content": f"Error: {str(e)}",
                "is_complete": True,
                "sources": []
            }
            yield {
                "event": "error",
                "data": json.dumps(error_chunk)
            }
    
    return EventSourceResponse(generate())


@router.get("/rag/collections")
async def get_rag_collections():
    """Get information about all RAG collections."""
    try:
        collections = rag_service.get_collections()
        return {"collections": collections}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/rag/debug/collections")
async def debug_rag_collections():
    """Debug endpoint to list all collections and their document counts."""
    try:
        collections_info = rag_service.list_all_collections()
        return {"debug_info": collections_info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/rag/document")
async def delete_rag_document(request: DeleteDocumentRequest):
    """Delete a document from RAG collection."""
    try:
        result = rag_service.delete_document(
            document_id=request.document_id,
            collection_name=request.collection_name
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/rag/collection/{collection_name}")
async def delete_rag_collection(collection_name: str):
    """Delete an entire RAG collection."""
    try:
        result = rag_service.delete_collection(collection_name=collection_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Model Comparison Endpoints
@router.post("/summarize/compare", response_model=ModelComparisonResponse)
async def compare_summarization_models(
    text: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    file_content: Optional[UploadFile] = File(None),
    models: str = Form(...),
    max_length: int = Form(150),
    temperature: float = Form(0.3),
    summary_type: str = Form("general"),
    target_language: Optional[str] = Form("en"),
    translate_summary: bool = Form(False)
):
    """Compare multiple models for text summarization."""
    try:
        # Parse models JSON string
        try:
            models_list = json.loads(models)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid models format")
        
        # Extract text from request
        text_content = None
        if text:
            text_content = text
        elif url:
            # Process URL to extract text
            try:
                text_content, _ = input_processor.extract_text_from_url(url)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to process URL: {str(e)}")
        elif file_content:
            # Process file content
            try:
                file_bytes = await file_content.read()
                file_type = file_content.filename.split('.')[-1].lower() if '.' in file_content.filename else 'txt'
                text_content = input_processor.extract_text_from_file(file_bytes, file_type)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")
        else:
            raise HTTPException(status_code=400, detail="No text, URL, or file content provided")
        
        # Validate models
        if not models_list or len(models_list) < 2:
            raise HTTPException(status_code=400, detail="At least 2 models must be specified for comparison")
        
        # Compare models
        result = await model_comparison_service.compare_models(
            text=text_content,
            models=models_list,
            max_length=max_length,
            temperature=temperature,
            summary_type=summary_type
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate/compare", response_model=ModelComparisonResponse)
async def compare_generation_models(
    system_prompt: str = Form(""),
    user_prompt: str = Form(...),
    models: str = Form(...),
    temperature: float = Form(0.7),
    max_tokens: Optional[int] = Form(None),
    target_language: Optional[str] = Form("en"),
    translate_response: bool = Form(False),
    output_format: str = Form("text")
):
    """Compare multiple models for text generation."""
    try:
        # Parse models JSON string
        try:
            models_list = json.loads(models)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid models format")
        
        # Validate models
        if not models_list or len(models_list) < 2:
            raise HTTPException(status_code=400, detail="At least 2 models must be specified for comparison")
        
        # Compare models for generation
        result = await model_comparison_service.compare_generation_models(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            models=models_list,
            temperature=temperature,
            max_tokens=max_tokens,
            target_language=target_language,
            translate_response=translate_response,
            output_format=output_format
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 