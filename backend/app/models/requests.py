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
    target_language: Optional[str] = Field("en", description="Target language for translation (default: en)")
    translate_response: bool = Field(False, description="Whether to translate the response")


class SummarizeRequest(BaseModel):
    text: Optional[str] = Field(None, description="Text to summarize")
    url: Optional[str] = Field(None, description="URL to scrape and summarize")
    file_content: Optional[bytes] = Field(None, description="File content to summarize")
    file_type: Optional[str] = Field(None, description="Type of file (txt, pdf, docx, etc.)")
    model_provider: ModelProvider = Field(..., description="Model provider to use")
    model_name: Optional[str] = Field(None, description="Specific model name (optional)")
    max_length: int = Field(150, ge=50, le=500, description="Maximum length of summary")
    temperature: float = Field(0.3, ge=0.0, le=2.0, description="Sampling temperature")
    stream: bool = Field(True, description="Whether to stream the response")
    summary_type: str = Field("general", description="Type of summary: general, bullet_points, key_points, extractive")
    target_language: Optional[str] = Field("en", description="Target language for translation (default: en)")
    translate_summary: bool = Field(False, description="Whether to translate the summary") 