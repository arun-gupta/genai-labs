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
    STABLE_DIFFUSION = "stable_diffusion"
    INTEGRATED_DIFFUSION = "integrated_diffusion"


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
    summary_type: str = Field("general", description="Type of summary: general, bullet_points, key_points, extractive, executive, technical, news")
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
    analytics: Optional[dict] = None


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
    similarity_threshold: float = Field(-0.2, ge=-1.0, le=1.0, description="Minimum similarity threshold (can be negative for distance-based calculation)")
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
    confidence: Optional[dict] = None


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
    system_prompt: str = Field("", description="System prompt for generation")
    user_prompt: str = Field(..., description="User prompt for generation")
    models: List[dict] = Field(..., description="List of models to compare")
    temperature: float = Field(0.7, ge=0.0, le=2.0, description="Temperature for generation")
    max_tokens: Optional[int] = Field(None, ge=1, le=4000, description="Maximum tokens to generate")
    target_language: str = Field("en", description="Target language for translation")
    translate_response: bool = Field(False, description="Whether to translate the response")
    output_format: str = Field("text", description="Output format for generation")

class RAGModelComparisonRequest(BaseModel):
    question: str = Field(..., description="Question to ask")
    collection_names: List[str] = Field(..., description="List of collection names to search")
    models: List[dict] = Field(..., description="List of models to compare")
    temperature: float = Field(0.7, ge=0.0, le=2.0, description="Temperature for generation")
    max_tokens: Optional[int] = Field(None, ge=1, le=4000, description="Maximum tokens to generate")
    top_k: int = Field(5, ge=1, le=20, description="Number of top results to retrieve")
    similarity_threshold: float = Field(-0.2, ge=-1.0, le=1.0, description="Similarity threshold for retrieval")
    filter_tags: Optional[List[str]] = Field(None, description="Tags to filter documents by")


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


# Image Analysis Models
class ImageAnalysisRequest(BaseModel):
    image: bytes = Field(..., description="Image file content")
    analysis_type: Literal["describe", "extract", "analyze", "compare"] = Field("describe", description="Type of analysis to perform")
    model_provider: ModelProvider = Field(..., description="Model provider to use")
    model_name: Optional[str] = Field(None, description="Specific model name")
    custom_prompt: Optional[str] = Field(None, description="Custom analysis prompt")
    temperature: float = Field(0.3, ge=0.0, le=2.0, description="Sampling temperature")


class ImageAnalysisResponse(BaseModel):
    analysis_type: str
    analysis: dict
    raw_response: str
    model_provider: str
    model_name: str
    latency_ms: float
    timestamp: float


class ImageComparisonRequest(BaseModel):
    images: List[bytes] = Field(..., description="List of images to compare")
    comparison_type: Literal["similarity", "style", "content", "quality"] = Field("similarity", description="Type of comparison")
    model_provider: ModelProvider = Field(..., description="Model provider to use")
    model_name: Optional[str] = Field(None, description="Specific model name")
    temperature: float = Field(0.3, ge=0.0, le=2.0, description="Sampling temperature")


class ImageComparisonResponse(BaseModel):
    comparison_type: str
    comparison: str
    model_provider: str
    model_name: str
    latency_ms: float
    image_count: int
    timestamp: float


# Image Generation Models
class ImageGenerationRequest(BaseModel):
    prompt: str = Field(..., description="Text prompt for image generation")
    model_provider: ModelProvider = Field(..., description="Model provider to use")
    model_name: Optional[str] = Field(None, description="Specific model name")
    size: str = Field("1024x1024", description="Image size (e.g., 1024x1024)")
    quality: str = Field("standard", description="Image quality (standard, hd)")
    style: Optional[str] = Field(None, description="Artistic style to apply")
    num_images: int = Field(1, ge=1, le=4, description="Number of images to generate")
    temperature: float = Field(0.7, ge=0.0, le=2.0, description="Sampling temperature")


class ImageGenerationResponse(BaseModel):
    provider: str
    model: str
    prompt: str
    images: List[dict]
    generation_id: str
    timestamp: float


class ImageVariationRequest(BaseModel):
    image: bytes = Field(..., description="Base image for variations")
    model_provider: ModelProvider = Field(..., description="Model provider to use")
    model_name: Optional[str] = Field(None, description="Specific model name")
    size: str = Field("1024x1024", description="Image size")
    num_variations: int = Field(1, ge=1, le=4, description="Number of variations to generate")


class ImageEditRequest(BaseModel):
    image: bytes = Field(..., description="Image to edit")
    mask: Optional[bytes] = Field(None, description="Mask for inpainting")
    prompt: str = Field(..., description="Edit prompt")
    model_provider: ModelProvider = Field(..., description="Model provider to use")
    model_name: Optional[str] = Field(None, description="Specific model name")
    size: str = Field("1024x1024", description="Image size") 