# Features Guide

## 🚀 Core Features

### Text Generation (`/generate`)
Advanced text generation with multiple writing styles and real-time streaming.

**Key Features:**
- **Writing Style Selector**: 12 different writing styles (Creative, Poetic, Business, Academic, Technical, Conversational, Journalistic, Storytelling, Persuasive, Minimalist, Formal, Humorous)
- **Voice Input**: Speech-to-text for prompts using Web Speech API
- **Voice Output**: Text-to-speech for responses with voice selection
- **Multiple Candidates**: Generate multiple response variations (1-5 candidates)
- **Output Format Selection**: Choose from 10+ output formats (Text, JSON, XML, Markdown, CSV, YAML, HTML, Bullet Points, Numbered Lists, Tables)
- **Language Translation**: Built-in translation support for responses
- **Language Detection**: Automatic language detection for input text
- **Prompt Templates**: Pre-built templates with variable substitution
- **Generation Analytics**: Comprehensive analysis of generated content
- **Model Comparison**: Compare multiple models side-by-side with quality metrics
- **Quick Model Combinations**: Pre-built combinations (Local vs Cloud, Efficient, High Performance)
- **Sample Prompts**: 8 diverse, clickable sample prompts for quick start

### Text Summarization (`/summarize`)
Multi-format summarization with comprehensive analytics and multiple input methods.

**Key Features:**
- **Multiple Input Methods**: Text, URL, and file upload support
- **Summary Types**: General, bullet points, key points, and extractive summaries
- **Analytics Dashboard**: Detailed metrics and quality analysis
- **Compression Ratios**: Track information retention and compression
- **Readability Scores**: Multiple readability metrics (Flesch, Gunning Fog, SMOG, etc.)
- **Sentiment Analysis**: Sentiment tracking and preservation analysis
- **Keyword Analysis**: Keyword extraction and overlap tracking
- **Model Comparison**: Compare multiple models side-by-side with quality metrics
- **Quick Model Combinations**: Pre-built combinations (Local vs Cloud, Efficient, High Performance)

### Models Explorer (`/models`)
Comprehensive view of open-source models with availability status and management tools.

**Key Features:**
- **Availability Status**: Shows which models are installed vs. need downloading
- **One-Click Copy**: Copy download commands with a single click
- **Advanced Filtering**: Filter by category, organization, and availability
- **Search**: Search across model names, descriptions, and tags
- **Visual Indicators**: Color-coded organization badges and status icons

### Q&A over Documents (RAG) (`/rag`)
Advanced document question answering with intelligent retrieval and comprehensive analytics.

**Key Features:**
- **Document Upload**: Support for PDF, DOCX, TXT, MD, CSV files
- **Document Tagging**: Add custom tags to organize and filter documents
- **Collection Management**: Create, manage, and delete document collections
- **Multi-Collection Queries**: Target questions at specific collections or query across multiple
- **Intelligent Question Suggestions**: AI-powered suggestions based on document content analysis
- **Smart Retrieval**: Advanced similarity matching with fallback thresholds
- **Source Tracking**: Detailed citations with document names, chunk indices, and similarity scores
- **Answer Confidence Scores**: AI-generated confidence ratings with detailed breakdowns
- **Document Analytics**: Comprehensive analysis of uploaded documents (topics, entities, readability, insights)
- **Performance Metrics**: Response time, accuracy tracking, and processing statistics
- **Model Comparison**: Compare multiple models for Q&A performance
- **Quick Model Combinations**: Pre-built combinations for easy comparison setup
- **Filter by Tags**: Focus on specific document categories
- **Export Options**: Export Q&A results in multiple formats

## 🎤 Voice Features

### Voice Input (Speech-to-Text)
- **Real-time Transcription**: Convert speech to text in real-time
- **Continuous Recognition**: Supports ongoing speech input
- **Language Support**: Defaults to English (en-US)
- **Visual Feedback**: Animated microphone with audio level indicators
- **Error Handling**: Graceful fallback for unsupported browsers

### Voice Output (Text-to-Speech)
- **Multiple Voices**: Choose from available system voices
- **Playback Controls**: Play, pause, resume, and stop functionality
- **Voice Selection**: Dropdown to select preferred voice
- **Visual Status**: Clear playing/paused status indicators
- **Smart Voice Detection**: Automatically selects English voices

### Browser Compatibility
- **Chrome/Edge**: Full support for both voice input and output
- **Firefox**: Full support for text-to-speech, limited speech recognition
- **Safari**: Full support for text-to-speech, limited speech recognition
- **Mobile Browsers**: Limited support, varies by platform

## 📊 Analytics & Export

### Generation Analytics
- **Token Usage**: Track tokens consumed per request
- **Latency Metrics**: Response time analysis
- **Content Analysis**: Readability, sentiment, and quality metrics
- **Performance Tracking**: Historical performance data

## 🔄 Model Comparison

### Side-by-Side Analysis
- **Quality Metrics**: Coherence, relevance, and overall quality scores
- **Performance Metrics**: Response time, token usage, and processing speed
- **Recommendations**: AI-powered suggestions for best model selection
- **Visual Comparison**: Easy-to-read comparison tables and charts

### Quick Combinations
- **Local vs Cloud**: Compare local Ollama models with cloud models
- **Efficient Models**: Compare lightweight models for speed optimization
- **High Performance**: Compare high-quality models for accuracy
- **Smart Filtering**: Only shows combinations with available models

### Supported Tasks
- **Text Generation**: Compare models for creative and technical writing
- **Text Summarization**: Compare models for different summary types
- **Q&A over Documents**: Compare models for document question answering

### Export Options
- **Multiple Formats**: PDF, Word, Markdown, HTML export
- **Structured Data**: JSON, XML, CSV, YAML output
- **Formatted Lists**: Bullet points and numbered lists
- **Tables**: Structured table format

### Prompt History
- **Local Storage**: Session-based prompt history
- **Search & Filter**: Find previous prompts quickly
- **Load & Reuse**: Easily reuse previous prompts
- **Export History**: Save prompt history for backup

## 🔧 Technical Features

### Real-time Streaming
- **Live Output**: See responses as they're generated
- **Progress Indicators**: Visual feedback during generation
- **Token Tracking**: Real-time token usage display
- **Cancel Support**: Stop generation mid-process

### Modular Architecture
- **LangChain Integration**: Flexible model abstractions
- **Service-based Design**: Clean separation of concerns
- **API-first Approach**: RESTful API for all features
- **Extensible Framework**: Easy to add new models and features

### Performance Features
- **Caching**: Intelligent response caching
- **Rate Limiting**: Built-in API rate limit handling
- **Error Recovery**: Graceful error handling and recovery
- **Optimization**: Efficient resource usage 