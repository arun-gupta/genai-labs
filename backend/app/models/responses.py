from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class TokenUsage(BaseModel):
    prompt_tokens: int = Field(..., description="Number of tokens in the prompt")
    completion_tokens: int = Field(..., description="Number of tokens in the completion")
    total_tokens: int = Field(..., description="Total number of tokens used")


class GenerationResponse(BaseModel):
    content: str = Field(..., description="Generated text content")
    model_provider: str = Field(..., description="Model provider used")
    model_name: str = Field(..., description="Specific model name used")
    token_usage: Optional[TokenUsage] = Field(None, description="Token usage information")
    latency_ms: float = Field(..., description="Response latency in milliseconds")
    finish_reason: Optional[str] = Field(None, description="Reason for completion")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")


class SummarizeResponse(BaseModel):
    summary: str = Field(..., description="Generated summary")
    original_length: int = Field(..., description="Length of original text")
    summary_length: int = Field(..., description="Length of generated summary")
    compression_ratio: float = Field(..., description="Compression ratio (original/summary)")
    model_provider: str = Field(..., description="Model provider used")
    model_name: str = Field(..., description="Specific model name used")
    token_usage: Optional[TokenUsage] = Field(None, description="Token usage information")
    latency_ms: float = Field(..., description="Response latency in milliseconds")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")


class StreamChunk(BaseModel):
    content: str = Field(..., description="Streamed content chunk")
    is_complete: bool = Field(False, description="Whether this is the final chunk")
    token_usage: Optional[TokenUsage] = Field(None, description="Token usage information")
    latency_ms: Optional[float] = Field(None, description="Response latency in milliseconds")


class ErrorResponse(BaseModel):
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp") 