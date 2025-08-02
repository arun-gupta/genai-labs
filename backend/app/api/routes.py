from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse
from app.models.requests import GenerateRequest, SummarizeRequest
from app.models.responses import GenerationResponse, SummarizeResponse, StreamChunk, ErrorResponse
from app.services.generation_service import GenerationService
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
        
        # Collect the full response for non-streaming
        full_summary = ""
        token_usage = None
        latency_ms = 0
        
        async for chunk in generation_service.summarize_text_stream(
            text=request.text,
            model_provider=request.model_provider.value,
            model_name=request.model_name,
            max_length=request.max_length,
            temperature=request.temperature
        ):
            full_summary += chunk.content
            if chunk.token_usage:
                token_usage = chunk.token_usage
            if chunk.latency_ms:
                latency_ms = chunk.latency_ms
        
        # Calculate compression ratio
        original_length = len(request.text.split())
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
            async for chunk in generation_service.summarize_text_stream(
                text=request.text,
                model_provider=request.model_provider.value,
                model_name=request.model_name,
                max_length=request.max_length,
                temperature=request.temperature
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
        ]
    } 