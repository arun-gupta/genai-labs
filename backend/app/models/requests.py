from pydantic import BaseModel, Field
from typing import Optional, Literal
from enum import Enum


class OutputFormat(str, Enum):
    TEXT = "text"
    JSON = "json"
    XML = "xml"
    MARKDOWN = "markdown"
    CSV = "csv"
    YAML = "yaml"
    HTML = "html"
    BULLET_POINTS = "bullet_points"
    NUMBERED_LIST = "numbered_list"
    TABLE = "table"


class ModelProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    OLLAMA = "ollama"


class GenerateRequest(BaseModel):
    system_prompt: str = Field("", description="System prompt for the model")
    user_prompt: str = Field(..., description="User prompt for text generation")
    model_provider: ModelProvider = Field(..., description="Model provider to use")
    model_name: Optional[str] = Field(None, description="Specific model name")
    temperature: float = Field(0.7, ge=0.0, le=2.0, description="Sampling temperature")
    max_tokens: Optional[int] = Field(None, ge=1, le=4000, description="Maximum tokens to generate")
    stream: bool = Field(True, description="Whether to stream the response")
    output_format: OutputFormat = Field(OutputFormat.TEXT, description="Output format for the response")
    target_language: Optional[str] = Field("en", description="Target language for translation (default: en)")
    translate_response: bool = Field(False, description="Whether to translate the response")
    num_candidates: int = Field(1, ge=1, le=5, description="Number of candidate responses to generate")


class GenerationResponse(BaseModel):
    content: str
    model_provider: str
    model_name: str
    token_usage: Optional[dict] = None
    latency_ms: Optional[float] = None
    timestamp: str


class SummarizeRequest(BaseModel):
    text: Optional[str] = Field(None, description="Text to summarize")
    url: Optional[str] = Field(None, description="URL to summarize")
    file_content: Optional[bytes] = Field(None, description="File content to summarize")
    file_type: Optional[str] = Field(None, description="Type of file being processed")
    model_provider: ModelProvider = Field(..., description="Model provider to use")
    model_name: Optional[str] = Field(None, description="Specific model name")
    max_length: int = Field(150, ge=10, le=1000, description="Maximum length of summary")
    temperature: float = Field(0.3, ge=0.0, le=2.0, description="Sampling temperature")
    stream: bool = Field(True, description="Whether to stream the response")
    summary_type: str = Field("general", description="Type of summary: general, bullet_points, key_points, extractive")
    target_language: Optional[str] = Field("en", description="Target language for translation (default: en)")
    translate_summary: bool = Field(False, description="Whether to translate the summary")
    output_format: OutputFormat = Field(OutputFormat.TEXT, description="Output format for the summary")


class SummarizeResponse(BaseModel):
    summary: str
    original_length: int
    summary_length: int
    compression_ratio: float
    model_provider: str
    model_name: str
    token_usage: Optional[dict] = None
    latency_ms: Optional[float] = None
    timestamp: str


class StreamChunk(BaseModel):
    content: str
    is_complete: bool = False
    token_usage: Optional[dict] = None
    latency_ms: Optional[float] = None


class AnalyticsRequest(BaseModel):
    original_text: str = Field(..., description="Original text for analysis")
    summary_text: str = Field(..., description="Summary text for analysis")


class AnalyticsResponse(BaseModel):
    analytics: dict
    timestamp: str 