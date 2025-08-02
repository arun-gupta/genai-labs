from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse
from app.models.requests import GenerateRequest, SummarizeRequest
from app.models.responses import GenerationResponse, SummarizeResponse, StreamChunk, ErrorResponse
from app.services.generation_service import GenerationService
from app.services.input_processor import input_processor
from app.models.requests import ModelProvider
import json
import time
import datetime

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
                max_tokens=request.max_tokens
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
                summary_type=request.summary_type
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


@router.get("/models")
async def get_available_models():
    """Get available model providers and their configurations."""
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
                "models": ["llama2", "mistral", "codellama", "llama2:13b"],
                "requires_api_key": False
            }
        ],
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