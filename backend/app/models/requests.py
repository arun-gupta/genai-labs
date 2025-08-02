from pydantic import BaseModel, Field
from typing import Optional, Literal
from enum import Enum


class ModelProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    OLLAMA = "ollama"


class GenerateRequest(BaseModel):
    system_prompt: str = Field(..., description="System prompt to guide the model behavior")
    user_prompt: str = Field(..., description="User prompt for text generation")
    model_provider: ModelProvider = Field(..., description="Model provider to use")
    model_name: Optional[str] = Field(None, description="Specific model name (optional)")
    temperature: float = Field(0.7, ge=0.0, le=2.0, description="Sampling temperature")
    max_tokens: Optional[int] = Field(None, ge=1, le=4000, description="Maximum tokens to generate")
    stream: bool = Field(True, description="Whether to stream the response")


class SummarizeRequest(BaseModel):
    text: str = Field(..., description="Text to summarize")
    model_provider: ModelProvider = Field(..., description="Model provider to use")
    model_name: Optional[str] = Field(None, description="Specific model name (optional)")
    max_length: int = Field(150, ge=50, le=500, description="Maximum length of summary")
    temperature: float = Field(0.3, ge=0.0, le=2.0, description="Sampling temperature")
    stream: bool = Field(True, description="Whether to stream the response") 