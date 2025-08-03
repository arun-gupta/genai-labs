# GenAI Lab 🧪

A full-stack web application for experimenting with different GenAI use cases using large language models (LLMs). Supports both local models (via Ollama) and cloud-hosted models (OpenAI, Anthropic, etc.).

## 🚀 Quick Start

```bash
# Clone and start the application
git clone <repository-url>
cd genai-labs
./quickstart.sh  # Installs all dependencies and starts the app
```

**That's it!** The app will be running at http://localhost:3000

## ✨ Features

- **Text Generation** - Advanced text creation with 12+ writing styles
- **Text Summarization** - Multi-format summarization with analytics  
- **Q&A over Documents** - RAG-powered document question answering
- **Model Comparison** - Side-by-side model performance analysis
- **Models Explorer** - Browse and manage 12+ open-source LLM models
- **Voice Features** - Speech-to-text and text-to-speech
- **Real-time Streaming** - Live output with token usage tracking
- **Export Options** - PDF, Word, Markdown, HTML export
- **Prompt History** - Local storage for session management

## 🛠️ Alternative Setup Options

### 🔧 Development Setup
```bash
./dev-setup.sh   # Quick dev environment setup (creates venv, installs deps)
./quickstart.sh  # Start the app (skips dependency installation)
```



## 🔧 Configuration

### Environment Variables

**Backend** (`backend/.env`):
```env
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
OLLAMA_BASE_URL=http://localhost:11434
```

**Frontend** (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:8000
```

## 📚 Documentation

- **[Features Guide](docs/FEATURES.md)** - Detailed feature documentation
- **[Setup Guide](docs/SETUP.md)** - Complete setup instructions
- **[Models Guide](docs/MODELS.md)** - Supported models and usage
- **[Voice Features](docs/VOICE.md)** - Speech-to-text and text-to-speech
- **[API Reference](docs/API.md)** - Backend API documentation
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions

## 🎯 Usage

### Text Generation
1. Navigate to `/generate`
2. Choose writing style and configure settings
3. Enter prompts (voice input supported)
4. Generate text with real-time streaming
5. Export in multiple formats

### Text Summarization  
1. Navigate to `/summarize`
2. Input text, URL, or upload files
3. Choose summary type and parameters
4. Get summaries with detailed analytics
5. Export results

### Models Explorer
1. Navigate to `/models`
2. Browse 12+ open-source models
3. Check availability status
4. Copy download commands for Ollama

### Q&A over Documents
1. Navigate to `/rag`
2. Upload documents (PDF, DOCX, TXT, MD, CSV)
3. Ask questions about your documents
4. View source citations and export results

### Model Comparison
1. Navigate to `/summarize`
2. Select 2+ models in the comparison section
3. Enter text to summarize
4. Click "Compare Models" to see side-by-side analysis

## 🏗️ Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Backend**: FastAPI (Python) + LangChain + Pydantic
- **APIs**: Web Speech API, OpenAI API, Anthropic API, Ollama API

## 🔮 Roadmap

- **Code Generation** - Specialized coding features
- **Translation Services** - Multi-language support
- **Structured Data Extraction** - Data processing capabilities
- **Advanced Analytics** - Enhanced performance metrics and insights

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

Apache License 2.0 - see [LICENSE](LICENSE) for details. 