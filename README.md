# GenAI Lab 🧠

**Your complete AI playground for text, images, documents, and more - all in one place!**

A full-stack web application that lets you experiment with cutting-edge AI models. Generate text, create images, analyze documents, build storyboards, and compare AI models - all with both local and cloud AI models.

## 🚀 Get Started in 30 Seconds

```bash
# Clone and start the application
git clone <repository-url>
cd genai-labs

# Install ffmpeg (required for audio features)
# macOS: brew install ffmpeg
# Linux: sudo apt install ffmpeg
# Windows: Download from ffmpeg.org

./quickstart.sh  # Installs everything and starts the app
```

**That's it!** Open http://localhost:3000 and start creating! 🎉

## ✨ What Can You Do?

### 🤖 **Text AI**
- **Text Generation**: Create content in 12+ styles (Creative, Business, Academic, etc.)
- **Text Summarization**: Summarize text, URLs, and documents with 7+ summary types
- **Real-time Streaming**: Watch your content being created live
- **Multiple Variations**: Generate 1-5 different versions of your content
- **Export Options**: Save as PDF, Word, Markdown, or other formats

### 📄 **Document Intelligence (RAG)**
- **Upload & Ask**: Drop PDFs, Word docs, or text files and ask questions
- **Smart Search**: AI finds the most relevant information from your documents using vector search
- **Collection Management**: Organize documents with tags and collections
- **Confidence Scores**: See how confident the AI is in its answers
- **Document Analytics**: Get insights into your uploaded documents
- **Question Suggestions**: AI-powered suggestions based on document content
- **Multi-Collection Queries**: Target specific document collections

### 🗣️ **Audio & Voice**
- **Speech-to-Text**: Convert audio files to text with multiple language support
- **Text-to-Speech**: Generate natural-sounding speech from text with voice customization
- **Voice Input**: Speak your prompts directly into the application
- **Voice Output**: Listen to AI responses being read aloud
- **Audio Processing**: Automatic format conversion and optimization
- **SSML Support**: Advanced speech markup for enhanced voice control (Work in Progress)

### 🎨 **Image Creation & Analysis**
- **Generate Images**: Create stunning visuals from text descriptions
- **Multiple Styles**: Choose from 14+ artistic styles (Photorealistic, Anime, Oil Painting, etc.)
- **Storyboard Creation**: Build multi-panel visual stories with AI
- **Image Analysis**: Upload images and get detailed descriptions and insights
- **Local Generation**: Create images privately on your own machine

### 🎬 **Video & Animation** (Work in Progress)
- **Video Generation**: Create videos from text prompts using Stable Video Diffusion (Memory optimization in progress)
- **Animation Creation**: Generate smooth animations with customizable frame counts
- **Video Enhancement**: Upscale, stabilize, and enhance existing videos
- **Multiple Formats**: Support for MP4, GIF, and other video formats
- **Smart Loading**: Progressive model loading for faster video generation
- **⚠️ Note**: Currently optimizing memory usage for stable video generation

### 📊 **AI Model Comparison**
- **Side-by-Side Testing**: Compare different AI models for the same task
- **Performance Metrics**: See response times, quality scores, and token usage
- **20+ Local Models**: Test GPT-OSS-20B, Mistral, Llama, and many more
- **Cloud Models**: Access GPT-5, Claude Sonnet 4, and other cutting-edge models

## 🛠️ Quick Setup Options

### 🚀 **Super Quick Start** (Recommended)
```bash
./quickstart.sh  # Everything in one command
```

### 🔧 **Development Setup**
```bash
./dev-setup.sh   # For developers who want more control
./quickstart.sh  # Start the app
```

### 🐍 **Manual Setup**
```bash
./setup.sh       # Complete setup with virtual environment
./activate_venv.sh  # Activate the environment
cd backend && python main.py  # Start backend
cd frontend && npm run dev     # Start frontend
```

## 🎯 Key Features

### 🌟 **What Makes This Special**
- **All-in-One Platform**: Text, images, documents, and more in one interface
- **Local + Cloud**: Use AI models on your machine or in the cloud
- **Privacy-First**: Keep sensitive data local with local models
- **Real-time Streaming**: Watch AI responses being generated live
- **Smart Analytics**: Get insights into your AI interactions
- **Modern UI**: Clean, responsive interface that works on all devices

### 🤖 **Supported AI Models**

**Cloud Models (Require API Keys)**
- **OpenAI**: GPT-5, GPT-4, GPT-3.5-turbo
- **Anthropic**: Claude Sonnet 4, Claude Opus 4, Claude 3.5 Sonnet

**Local Models (Free, Private)**
- **Llama 3.2**: Meta's latest 3B model with improved performance and capabilities (default)
- **GPT-OSS-20B**: OpenAI's open-weight model with advanced reasoning
- **Mistral**: High-performance 7B model with excellent reasoning
- **Llama 2**: Meta's foundational models (3B, 7B, 13B variants)
- **Code Llama**: Specialized coding models
- **And 15+ more**: Including Phi-3, Qwen 2.5, Gemma 2, and others

### 🎨 **Image Generation**
- **Local Generation**: Stable Diffusion XL, 1.5, 2.1, and 3.5 Large
- **Cloud Generation**: DALL-E 3, Claude Sonnet 4
- **Smart Loading**: Models load progressively for faster startup
- **Dynamic Storyboards**: Create multi-panel visual stories with story progression

## 📚 Documentation

- **[Features Guide](docs/FEATURES.md)** - Complete feature overview
- **[Models Guide](docs/MODELS.md)** - Supported models and usage
- **[Stable Diffusion Setup](docs/STABLE_DIFFUSION_SETUP.md)** - Local image generation setup
- **[Integrated Diffusion Guide](docs/INTEGRATED_DIFFUSION_SETUP.md)** - Recommended setup for built-in image generation
- **[Voice Features](docs/VOICE.md)** - Speech-to-text and text-to-speech
- **[API Reference](docs/API.md)** - Backend API documentation
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions

## 🆕 Recent Updates

### 🎬 **Video & Animation Platform** (Work in Progress)
- **Video Generation**: Create videos from text prompts using Stable Video Diffusion (Memory optimization in progress)
- **Animation Creation**: Generate smooth animations with customizable frame counts
- **Video Enhancement**: Upscale, stabilize, and enhance existing videos
- **Multiple Formats**: Support for MP4, GIF, and other video formats
- **Smart Loading**: Progressive model loading for faster video generation
- **⚠️ Note**: Currently optimizing memory usage for stable video generation

### 🗣️ **Voice Features** (SSML Support: Work in Progress)
- **Speech-to-Text**: Convert audio to text with multiple language support
- **Text-to-Speech**: Generate natural-sounding speech from text
- **SSML Support**: Advanced speech markup for enhanced voice control (currently WIP)
- **Audio Processing**: Automatic format conversion and optimization

### 🎬 **Dynamic Storyboard Generation**
- **Story Progression**: Each panel has unique prompts for natural story flow
- **Smart Loading**: Images generate while models are still loading
- **Multiple Styles**: Cinematic, Anime, Oil Painting, and more
- **Panel Management**: Clear old storyboards when starting new ones
- **Better UX**: No more cropped images, improved visual presentation

### 🎨 **Enhanced Image Generation**
- **Integrated Diffusion Service**: Direct Stable Diffusion with automatic model management
- **Smart Model Loading**: Progressive loading system for faster startup
- **Multiple Model Support**: Stable Diffusion 1.5, 2.1, XL, and 3.5 Large
- **14+ Artistic Styles**: Photorealistic, Oil Painting, Anime, Cyberpunk, and more

### 🤖 **Latest AI Models**
- **Llama 3.2**: Meta's latest 3B model with improved performance (now default)
- **GPT-5 Support**: Latest OpenAI model with advanced reasoning
- **Claude Sonnet 4 & Opus 4**: Latest Anthropic models with 200K context
- **GPT-OSS-20B**: OpenAI's open-weight model with agentic capabilities

### 🔧 **Recent Improvements**
- **Smart Model Detection**: Automatic detection and selection of available Ollama models
- **Default Model Selection**: Llama 3.2 automatically selected when available
- **Enhanced UI**: Reorganized voice features interface for better user experience
- **Audio Processing**: Improved STT/TTS with automatic format conversion
- **Documentation**: Comprehensive guides for all features and troubleshooting

### 📄 **Document Intelligence (RAG)**
- **Intelligent Question Suggestions**: AI-powered suggestions based on document content
- **Document Tagging**: Organize documents with custom tags
- **Multi-Collection Queries**: Target specific document collections
- **Enhanced Analytics**: Comprehensive document analysis and insights
- **Smart Model Detection**: Automatic detection and selection of available Ollama models

## 🛠️ Technical Details

### Architecture
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: FastAPI + Python
- **AI Models**: Ollama (local) + OpenAI/Anthropic APIs (cloud)
- **Image Generation**: Integrated Stable Diffusion + Cloud APIs
- **Database**: ChromaDB for document storage and vector search

### System Requirements
- **OS**: macOS, Linux, Windows (WSL)
- **Python**: 3.8+
- **Node.js**: 16+
- **RAM**: 8GB+ (16GB+ recommended for local models)
- **Storage**: 10GB+ free space for models
- **ffmpeg**: Required for audio processing (STT/TTS features)
  - **macOS**: `brew install ffmpeg`
  - **Linux**: `sudo apt install ffmpeg` (Ubuntu/Debian) or `sudo yum install ffmpeg` (CentOS/RHEL)
  - **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html) or use `winget install ffmpeg`

### Virtual Environment
All Python dependencies are automatically installed in virtual environments for isolation and consistency.

## 🗺️ Roadmap

🔄 **Video & Animation** - Local video generation and animated storyboards (Work in Progress - Memory optimization in progress)

🗣️ **Voice Features** - Enhanced SSML support and voice processing improvements (Work in Progress)

🤖 **AI Agents & Automation** - Multi-step reasoning agents and workflow automation

🎨 **Creative Suite** - Music generation, audio processing, and code generation

🌐 **Advanced Features** - Multi-language support, personalization, and data extraction

🔮 **Future Vision** - Chatbot builder, advanced analytics, and business intelligence

---

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines and feel free to submit issues or pull requests.

## 📄 License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details.

---

**Ready to start creating? Run `./quickstart.sh` and let your imagination run wild! 🚀** 