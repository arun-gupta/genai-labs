from pydantic import BaseModel, Field
from typing import Optional, Literal, List
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


# RAG Models
class DocumentUploadRequest(BaseModel):
    file_content: bytes = Field(..., description="Document file content")
    file_name: str = Field(..., description="Name of the uploaded file")
    file_type: str = Field(..., description="Type of the uploaded file")
    collection_name: Optional[str] = Field("default", description="Vector collection name")
    tags: Optional[List[str]] = Field([], description="Tags for categorizing the document")


class DocumentUploadResponse(BaseModel):
    document_id: str
    file_name: str
    chunks_processed: int
    collection_name: str
    tags: List[str]
    message: str
    timestamp: str


class RAGQuestionRequest(BaseModel):
    question: str = Field(..., description="Question to ask about the documents")
    collection_name: Optional[str] = Field("default", description="Vector collection to search")
    collection_names: Optional[List[str]] = Field(None, description="Multiple vector collections to search")
    model_provider: ModelProvider = Field(..., description="Model provider to use")
    model_name: Optional[str] = Field(None, description="Specific model name")
    temperature: float = Field(0.7, ge=0.0, le=2.0, description="Sampling temperature")
    max_tokens: Optional[int] = Field(None, ge=1, le=4000, description="Maximum tokens to generate")
    stream: bool = Field(True, description="Whether to stream the response")
    top_k: int = Field(5, ge=1, le=20, description="Number of relevant chunks to retrieve")
    similarity_threshold: float = Field(0.7, ge=0.0, le=1.0, description="Minimum similarity threshold")
    filter_tags: Optional[List[str]] = Field(None, description="Filter documents by specific tags")


class RAGQuestionResponse(BaseModel):
    answer: str
    question: str
    sources: List[dict]
    model_provider: str
    model_name: str
    token_usage: Optional[dict] = None
    latency_ms: Optional[float] = None
    timestamp: str


class DocumentSource(BaseModel):
    document_id: str
    file_name: str
    chunk_text: str
    similarity_score: float
    page_number: Optional[int] = None
    chunk_index: int
    tags: List[str] = []


class CollectionInfo(BaseModel):
    collection_name: str
    document_count: int
    total_chunks: int
    documents: List[dict]
    created_at: str
    last_updated: str
    available_tags: List[str] = []


class DeleteDocumentRequest(BaseModel):
    document_id: str = Field(..., description="ID of the document to delete")
    collection_name: Optional[str] = Field("default", description="Vector collection name")


# Model Comparison Models
class ModelComparisonRequest(BaseModel):
    text: Optional[str] = Field(None, description="Text to summarize")
    url: Optional[str] = Field(None, description="URL to summarize")
    file_content: Optional[bytes] = Field(None, description="File content to summarize")
    file_type: Optional[str] = Field(None, description="Type of file being processed")
    models: List[dict] = Field(..., description="List of models to compare")
    max_length: int = Field(150, ge=10, le=1000, description="Maximum length of summary")
    temperature: float = Field(0.3, ge=0.0, le=2.0, description="Sampling temperature")
    summary_type: str = Field("general", description="Type of summary: general, bullet_points, key_points, extractive")
    target_language: Optional[str] = Field("en", description="Target language for translation (default: en)")
    translate_summary: bool = Field(False, description="Whether to translate the summary")


class GenerationComparisonRequest(BaseModel):
    system_prompt: str = Field("", description="System prompt for the model")
    user_prompt: str = Field(..., description="User prompt for text generation")
    models: List[dict] = Field(..., description="List of models to compare")
    temperature: float = Field(0.7, ge=0.0, le=2.0, description="Sampling temperature")
    max_tokens: Optional[int] = Field(None, ge=1, le=4000, description="Maximum tokens to generate")
    target_language: Optional[str] = Field("en", description="Target language for translation (default: en)")
    translate_response: bool = Field(False, description="Whether to translate the response")
    output_format: OutputFormat = Field(OutputFormat.TEXT, description="Output format for the response")


class ModelComparisonResult(BaseModel):
    model_provider: str
    model_name: str
    summary: Optional[str] = None
    generated_text: Optional[str] = None
    original_length: int
    summary_length: Optional[int] = None
    generated_length: Optional[int] = None
    compression_ratio: Optional[float] = None
    token_usage: Optional[dict] = None
    latency_ms: Optional[float] = None
    quality_score: Optional[float] = None
    coherence_score: Optional[float] = None
    relevance_score: Optional[float] = None
    timestamp: str


class ModelComparisonResponse(BaseModel):
    comparison_id: str
    original_text: str
    results: List[ModelComparisonResult]
    comparison_metrics: dict
    recommendations: List[str]
    timestamp: str 