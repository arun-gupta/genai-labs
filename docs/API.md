# API Reference

## 🔧 Backend API Documentation

The GenAI Lab backend provides a RESTful API built with FastAPI. All endpoints are available at `http://localhost:8000/api/v1/`.

## 📚 Interactive Documentation

Visit the interactive API documentation at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🚀 Core Endpoints

### Text Generation

#### `POST /api/v1/generate/stream`
Generate text with real-time streaming.

**Request Body:**
```json
{
  "system_prompt": "You are a helpful assistant.",
  "user_prompt": "Write a short story about a robot.",
  "model_provider": "ollama",
  "model_name": "mistral:7b",
  "temperature": 0.7,
  "max_tokens": 1000,
  "stream": true,
  "target_language": "en",
  "translate_response": false,
  "output_format": "text",
  "num_candidates": 1
}
```

**Response:** Server-Sent Events (SSE) stream

#### `POST /api/v1/generate/analytics`
Analyze generated content for metrics and insights.

**Request Body:**
```json
{
  "text": "Generated text content to analyze",
  "original_prompt": "Original prompt used"
}
```

**Response:**
```json
{
  "analytics": {
    "readability": {
      "flesch_reading_ease": 75.2,
      "gunning_fog": 8.1,
      "smog": 6.5
    },
    "sentiment": {
      "positive": 0.65,
      "negative": 0.15,
      "neutral": 0.20
    },
    "statistics": {
      "word_count": 150,
      "sentence_count": 8,
      "paragraph_count": 3
    }
  }
}
```

### Text Summarization

#### `POST /api/v1/summarize`
Summarize text with various options.

**Request Body:**
```json
{
  "text": "Long text to summarize",
  "model_provider": "ollama",
  "model_name": "mistral:7b",
  "max_length": 150,
  "temperature": 0.3,
  "summary_type": "general",
  "target_language": "en",
  "translate_summary": false,
  "output_format": "text"
}
```

**Response:**
```json
{
  "summary": "Summarized text content",
  "token_usage": {
    "prompt_tokens": 500,
    "completion_tokens": 100,
    "total_tokens": 600
  },
  "latency_ms": 2500
}
```

#### `POST /api/v1/summarize/analytics`
Analyze summarization quality and metrics.

**Request Body:**
```json
{
  "original_text": "Original long text",
  "summary": "Generated summary",
  "summary_type": "general"
}
```

**Response:**
```json
{
  "analytics": {
    "compression_ratio": 0.25,
    "information_retention": 0.85,
    "readability": {
      "flesch_reading_ease": 78.5,
      "gunning_fog": 7.2
    },
    "sentiment_preservation": 0.92,
    "keyword_overlap": 0.75
  }
}
```

### Language Services

#### `POST /api/v1/detect-language`
Detect the language of input text.

**Request Body:**
```json
{
  "text": "Text to detect language for"
}
```

**Response:**
```json
{
  "detection": {
    "language": "en",
    "confidence": 0.95,
    "language_name": "English"
  }
}
```

#### `POST /api/v1/translate`
Translate text between languages.

**Request Body:**
```json
{
  "text": "Text to translate",
  "source_language": "en",
  "target_language": "es"
}
```

**Response:**
```json
{
  "translated_text": "Translated text content",
  "source_language": "en",
  "target_language": "es"
}
```

### Model Management

#### `GET /api/v1/models`
Get available models and their status.

**Response:**
```json
{
  "models": [
    {
      "name": "mistral:7b",
      "provider": "ollama",
      "description": "High-performance reasoning model",
      "parameters": "7B",
      "organization": "Mistral AI",
      "category": "general",
      "installed": true,
      "download_command": "ollama pull mistral:7b"
    }
  ]
}
```



### Model Comparison

#### `POST /api/v1/generate/compare`
Compare multiple models for text generation.

**Request Body:**
```json
{
  "system_prompt": "You are a helpful assistant.",
  "user_prompt": "Write a short story about a robot.",
  "models": [
    {"provider": "ollama", "name": "mistral:7b"},
    {"provider": "openai", "name": "gpt-3.5-turbo"}
  ],
  "temperature": 0.7,
  "max_tokens": 1000,
  "output_format": "text"
}
```

**Response:**
```json
{
  "results": [
    {
      "model": "mistral:7b",
      "provider": "ollama",
      "response": "Generated text...",
      "metrics": {
        "quality_score": 8.5,
        "coherence": 0.85,
        "relevance": 0.92
      },
      "performance": {
        "response_time_ms": 2500,
        "token_usage": 150
      }
    }
  ],
  "recommendations": {
    "best_overall": "gpt-3.5-turbo",
    "best_speed": "mistral:7b",
    "best_quality": "gpt-3.5-turbo"
  }
}
```

#### `POST /api/v1/summarize/compare`
Compare multiple models for text summarization.

**Request Body:**
```json
{
  "text": "Long text to summarize",
  "models": [
    {"provider": "ollama", "name": "mistral:7b"},
    {"provider": "openai", "name": "gpt-3.5-turbo"}
  ],
  "summary_type": "general",
  "max_length": 150,
  "temperature": 0.3
}
```

**Response:** Similar structure to generation comparison

### Q&A over Documents (RAG)

#### `POST /api/v1/rag/upload`
Upload a document for RAG processing.

**Request Body:**
```json
{
  "file": "base64_encoded_file_content",
  "filename": "document.pdf",
  "collection_name": "my_collection",
  "tags": ["research", "technical"]
}
```

**Response:**
```json
{
  "document_id": "doc_123",
  "filename": "document.pdf",
  "collection_name": "my_collection",
  "tags": ["research", "technical"],
  "chunks_created": 15,
  "processing_time_ms": 1200
}
```

#### `POST /api/v1/rag/question`
Ask a question about uploaded documents.

**Request Body:**
```json
{
  "question": "What are the main findings?",
  "collection_names": ["my_collection"],
  "model_provider": "ollama",
  "model_name": "mistral:7b",
  "temperature": 0.3,
  "max_tokens": 500
}
```

**Response:**
```json
{
  "answer": "The main findings include...",
  "sources": [
    {
      "document_name": "document.pdf",
      "chunk_index": 5,
      "similarity_score": 0.92,
      "content": "Relevant document excerpt..."
    }
  ],
  "confidence_score": 0.85,
  "processing_time_ms": 1800
}
```

#### `POST /api/v1/rag/question/stream`
Stream Q&A responses in real-time.

**Request Body:** Same as `/rag/question`

**Response:** Server-Sent Events (SSE) stream

#### `GET /api/v1/rag/collections`
Get all RAG collections.

**Response:**
```json
{
  "collections": [
    {
      "name": "my_collection",
      "document_count": 5,
      "total_chunks": 75,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### `DELETE /api/v1/rag/collection/{collection_name}`
Delete a RAG collection.

**Response:**
```json
{
  "success": true,
  "message": "Collection deleted successfully"
}
```

#### `GET /api/v1/rag/suggestions/{collection_name}`
Get intelligent question suggestions.

**Response:**
```json
{
  "suggestions": [
    {
      "question": "What are the key topics covered?",
      "category": "overview",
      "confidence": 0.9
    },
    {
      "question": "What are the main conclusions?",
      "category": "analysis",
      "confidence": 0.85
    }
  ]
}
```

#### `GET /api/v1/rag/analytics/{collection_name}/document/{document_id}`
Get document analytics.

**Response:**
```json
{
  "analytics": {
    "topics": ["AI", "Machine Learning", "Data Science"],
    "entities": ["OpenAI", "GPT-5", "GPT-4", "Neural Networks"],
    "readability": {
      "flesch_reading_ease": 65.2,
      "gunning_fog": 12.1
    },
    "insights": ["Technical content", "Research-focused", "Academic tone"]
  }
}
```

#### `POST /api/v1/rag/compare`
Compare multiple models for Q&A performance.

**Request Body:**
```json
{
  "question": "What are the main findings?",
  "collection_names": ["my_collection"],
  "models": [
    {"provider": "ollama", "name": "mistral:7b"},
    {"provider": "openai", "name": "gpt-3.5-turbo"}
  ],
  "temperature": 0.3,
  "max_tokens": 500
}
```

**Response:** Similar structure to other comparison endpoints

#### `GET /api/v1/models/{provider}`
Get models for a specific provider.

**Response:**
```json
{
  "provider": "ollama",
  "models": [...]
}
```

### Export Services

#### `POST /api/v1/export`
Export content in various formats.

**Request Body:**
```json
{
  "content": "Content to export",
  "format": "pdf",
  "title": "Document Title",
  "author": "Author Name"
}
```

**Response:** File download (PDF, Word, Markdown, HTML)

## 🔐 Authentication

Currently, the API does not require authentication for local development. For production deployment, consider implementing:

- API key authentication
- JWT tokens
- OAuth 2.0

## 📊 Rate Limiting

### OpenAI Rate Limits
- **TPM (Tokens Per Minute)**: 10,000 tokens per minute
- **RPM (Requests Per Minute)**: Varies by model and account tier
- **Context Length**: GPT-5 has 128K token context limit, GPT-4 has 8,192 token context limit

### Handling Rate Limits
The API includes built-in rate limit handling:
- Automatic text truncation
- User-friendly error messages
- Alternative model suggestions
- Retry logic with exponential backoff

## 🐛 Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "detail": "Invalid request parameters",
  "error_code": "VALIDATION_ERROR"
}
```

#### 429 Too Many Requests
```json
{
  "detail": "Rate limit exceeded",
  "error_code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 60
}
```

#### 500 Internal Server Error
```json
{
  "detail": "Internal server error",
  "error_code": "INTERNAL_ERROR"
}
```

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `VALIDATION_ERROR` | Invalid request parameters | Check request format |
| `MODEL_NOT_FOUND` | Model not available | Install model or use different one |
| `RATE_LIMIT_EXCEEDED` | API rate limit hit | Wait and retry |
| `AUTHENTICATION_ERROR` | Invalid API keys | Check environment variables |
| `INTERNAL_ERROR` | Server-side error | Check server logs |

## 🔧 Configuration

### Environment Variables

```env
# API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434

# Application Settings
DEBUG=True
CORS_ORIGINS=http://localhost:3000
```

### CORS Configuration

The API is configured to accept requests from:
- `http://localhost:3000` (Frontend development)
- `http://127.0.0.1:3000` (Alternative localhost)

## 📈 Performance

### Response Times
- **Local Models**: 1-5 seconds (depending on model size)
- **Cloud Models**: 2-10 seconds (depending on complexity)
- **Analytics**: 0.5-2 seconds

### Optimization Tips
- Use appropriate model sizes for your use case
- Enable streaming for long responses
- Cache frequently requested content
- Monitor token usage to optimize costs

## 🧪 Testing

### Health Check
```bash
curl http://localhost:8000/health
```

### API Status
```bash
curl http://localhost:8000/api/v1/status
```

### Model Availability
```bash
curl http://localhost:8000/api/v1/models
``` 