# GenAI Lab 🧪

A full-stack web application for experimenting with different GenAI use cases using large language models (LLMs). Supports both local models (via Ollama) and cloud-hosted models (OpenAI, Anthropic, etc.).

## 🚀 Features

### Core Features
- **Text Generation** (`/generate`): Advanced text generation with multiple writing styles
- **Text Summarization** (`/summarize`): Multi-format summarization with analytics
- **Models Explorer** (`/models`): Comprehensive view of open-source models with availability status
- **Real-time Streaming**: Live output with token usage and latency tracking
- **Prompt History**: Local storage for session-based prompt history
- **Modular Architecture**: LangChain-based model abstractions

### Advanced Text Generation Features
- **Writing Style Selector**: 12 different writing styles (Creative, Poetic, Business, Academic, Technical, Conversational, Journalistic, Storytelling, Persuasive, Minimalist, Formal, Humorous)
- **Voice Input**: Speech-to-text for prompts using Web Speech API
- **Voice Output**: Text-to-speech for responses with voice selection
- **Multiple Candidates**: Generate multiple response variations (1-5 candidates)
- **Output Format Selection**: Choose from 10+ output formats (Text, JSON, XML, Markdown, CSV, YAML, HTML, Bullet Points, Numbered Lists, Tables)
- **Language Translation**: Built-in translation support for responses
- **Language Detection**: Automatic language detection for input text
- **Prompt Templates**: Pre-built templates with variable substitution
- **Generation Analytics**: Comprehensive analysis of generated content

### Text Summarization Features
- **Multiple Input Methods**: Text, URL, and file upload support
- **Summary Types**: General, bullet points, key points, and extractive summaries
- **Analytics Dashboard**: Detailed metrics and quality analysis
- **Compression Ratios**: Track information retention and compression
- **Readability Scores**: Multiple readability metrics (Flesch, Gunning Fog, SMOG, etc.)
- **Sentiment Analysis**: Sentiment tracking and preservation analysis
- **Keyword Analysis**: Keyword extraction and overlap tracking

### Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Backend**: FastAPI (Python) + LangChain + Pydantic
- **APIs**: Web Speech API (voice features), OpenAI API, Anthropic API, Ollama API
- **Deployment**: Docker-ready with modular architecture
- **Development**: Hot reload, TypeScript compilation, ESLint

## 🤖 Supported Models

### Open Source Models (via Ollama)
The application includes a comprehensive **Models Explorer** page that showcases 12+ open-source language models:

#### Available Models:
- **Qwen 2.5 (3B)** - Alibaba's efficient reasoning model
- **Phi-3 (3.8B)** - Microsoft's compact reasoning model  
- **DeepSeek Coder (3B)** - Specialized coding model
- **Llama 3.1 (3B)** - Meta's latest compact model
- **Grok (3B)** - xAI's conversational model
- **BLOOM (3B)** - Multilingual model (46+ languages)
- **Gemma 2 (3B)** - Google's lightweight model
- **Mistral (7B)** - High-performance reasoning model
- **Code Llama (3B)** - Meta's coding specialist
- **Neural Chat (3B)** - Intel's conversational model
- **Orca Mini (3B)** - Microsoft's high-quality model
- **Llama 2 (3B)** - Meta's foundational model

#### Features:
- **Availability Status**: Shows which models are installed vs. need downloading
- **One-Click Copy**: Copy download commands with a single click
- **Advanced Filtering**: Filter by category, organization, and availability
- **Search**: Search across model names, descriptions, and tags
- **Visual Indicators**: Color-coded organization badges and status icons

## 📁 Project Structure

```
genai-labs/
├── frontend/                 # React TypeScript application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── VoiceInput.tsx      # Speech-to-text component
│   │   │   ├── VoiceOutput.tsx     # Text-to-speech component
│   │   │   ├── WritingStyleSelector.tsx # Writing style dropdown
│   │   │   └── ...                 # Other components
│   │   ├── pages/          # Route components
│   │   │   ├── GeneratePage.tsx    # Text generation with voice features
│   │   │   ├── SummarizePage.tsx   # Text summarization
│   │   │   └── ModelsPage.tsx      # Models explorer
│   │   ├── services/       # API client services
│   │   ├── types/          # TypeScript type definitions
│   │   │   └── speech.d.ts # Web Speech API declarations
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── backend/                 # FastAPI Python application
│   ├── app/
│   │   ├── api/            # API route handlers
│   │   ├── core/           # Configuration and core utilities
│   │   ├── models/         # Pydantic models
│   │   ├── services/       # LangChain and model services
│   │   │   ├── generation_service.py      # Text generation
│   │   │   ├── generation_analytics_service.py # Content analysis
│   │   │   └── ...                        # Other services
│   │   └── utils/          # Utility functions
│   ├── requirements.txt    # Python dependencies
│   └── main.py            # FastAPI application entry point
├── docker-compose.yml      # Local development setup
└── README.md              # This file
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Docker (optional, for containerized deployment)

### 🚀 Quick Start (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd genai-labs

# Start the application (includes setup if needed)
./quickstart.sh
```

**Note:** The `quickstart.sh` script automatically handles setup if needed, including:
- Creating Python virtual environment
- Installing dependencies
- Setting up environment files
- Starting both backend and frontend servers

### 🔧 Manual Setup (Alternative)

If you prefer to run setup separately or need more control:

```bash
# Clone the repository
git clone <repository-url>
cd genai-labs

# Run setup only (optional)
./setup.sh

# Start the application
./quickstart.sh
```

#### 1. Clone and Manual Setup

```bash
# Clone the repository
git clone <repository-url>
cd genai-labs

# Create environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

#### 2. Backend Setup (with Virtual Environment)

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables in .env
# Add your API keys for OpenAI, Anthropic, etc.

# Run the backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables in .env
# Configure backend API URL

# Run the frontend
npm run dev
```

## 🐍 Virtual Environment Management

### Why Virtual Environments?

This project **strictly requires** Python virtual environments to ensure:
- **Dependency Isolation**: Prevents conflicts between project dependencies
- **Reproducible Builds**: Ensures consistent environments across different machines
- **Clean Development**: Keeps system Python clean and project-specific
- **Easy Cleanup**: Simple to remove and recreate if needed

### Virtual Environment Structure

```
genai-lab/
├── backend/
│   ├── venv/              # Python virtual environment (gitignored)
│   │   ├── bin/           # Virtual environment binaries
│   │   ├── lib/           # Installed packages
│   │   └── pyvenv.cfg     # Virtual environment config
│   ├── requirements.txt   # Python dependencies
│   └── main.py           # FastAPI application
└── frontend/
    ├── node_modules/      # Node.js dependencies (gitignored)
    └── package.json       # Node.js dependencies
```

### Virtual Environment Commands

```bash
# Create virtual environment
python -m venv backend/venv

# Activate virtual environment
source backend/venv/bin/activate  # Linux/macOS
# or
backend\venv\Scripts\activate     # Windows

# Deactivate virtual environment
deactivate

# Install dependencies in virtual environment
pip install -r backend/requirements.txt

# Check if virtual environment is active
echo $VIRTUAL_ENV  # Should show path to venv

# List installed packages
pip list

# Remove virtual environment (if needed)
rm -rf backend/venv
```

### .gitignore Configuration

The project includes comprehensive `.gitignore` rules to ensure virtual environments are never committed:

```gitignore
# Virtual environments
venv/
env/
ENV/
env.bak/
venv.bak/

# Python cache
__pycache__/
*.py[cod]
*$py.class

# Node.js dependencies
node_modules/
npm-debug.log*

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

### Troubleshooting Virtual Environments

#### Issue: "No module named 'fastapi'"
```bash
# Solution: Ensure virtual environment is activated
source backend/venv/bin/activate
pip install -r backend/requirements.txt
```

#### Issue: "Virtual environment is corrupted"
```bash
# Solution: Recreate virtual environment
rm -rf backend/venv
python -m venv backend/venv
source backend/venv/bin/activate
pip install -r backend/requirements.txt
```

#### Issue: "Permission denied" on virtual environment
```bash
# Solution: Fix permissions
chmod +x backend/venv/bin/activate
chmod +x backend/venv/bin/python
```

#### Issue: "Python not found"
```bash
# Solution: Install Python 3.9+ and ensure it's in PATH
python3 --version
# or
python --version
```

## 🔍 Environment Verification

### Automated Verification

Use the verification script to check if your environment is properly configured:

```bash
# Verify environment setup
./verify_env.sh
```

This script checks:
- ✅ Virtual environment status
- ✅ Backend virtual environment structure
- ✅ Frontend dependencies
- ✅ Environment files
- ✅ .gitignore configuration
- ✅ Key Python dependencies
- ✅ Key Node.js dependencies

### Manual Verification

You can also verify manually:

```bash
# Check if virtual environment is active
echo $VIRTUAL_ENV

# Check if backend virtual environment exists
ls -la backend/venv/

# Check if frontend dependencies exist
ls -la frontend/node_modules/

# Check if environment files exist
ls -la backend/.env frontend/.env

# Check .gitignore configuration
grep -E "(venv/|node_modules/|__pycache__/)" .gitignore
```

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

## ⚠️ Rate Limiting and API Quotas

### OpenAI Rate Limits
- **TPM (Tokens Per Minute)**: Default limit is 10,000 tokens per minute
- **RPM (Requests Per Minute)**: Varies by model and account tier
- **Context Length**: GPT-4 has a 8,192 token context limit

### Handling Rate Limits
The application includes built-in handling for rate limits:

1. **Automatic Text Truncation**: Long texts are automatically truncated to stay within limits
2. **User-Friendly Error Messages**: Clear explanations when limits are hit
3. **Helpful Tips**: Suggestions for avoiding rate limits
4. **Alternative Models**: Switch to Ollama for local processing without limits

### Tips to Avoid Rate Limits
- Use shorter texts for summarization
- Wait a few minutes between requests
- Consider using Ollama (local) for large documents
- Check your OpenAI account limits and upgrade if needed
- Use the "extractive" summary type for very long documents

### 4. Docker Setup (Optional)

```bash
# Run both frontend and backend with Docker Compose
docker-compose up --build
```

## 🔧 Environment Variables

### Backend (.env)
```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key

# Ollama (local models)
OLLAMA_BASE_URL=http://localhost:11434

# Application
DEBUG=True
CORS_ORIGINS=http://localhost:3000
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8000
```

## 🎯 Usage

### Text Generation (`/generate`)
1. **Select Writing Style**: Choose from 12 different writing styles (Creative, Business, Academic, etc.)
2. **Voice Input**: Use microphone to dictate your prompts
3. **Configure Settings**: Set temperature, max tokens, output format, and number of candidates
4. **Generate**: Create text with real-time streaming and analytics
5. **Voice Output**: Listen to generated responses with text-to-speech
6. **Export**: Copy, download, or share your generated content

### Text Summarization (`/summarize`)
1. **Input Content**: Paste text, provide URL, or upload files
2. **Choose Summary Type**: General, bullet points, key points, or extractive
3. **Configure Parameters**: Set length, temperature, and output format
4. **Generate Summary**: Get instant summaries with detailed analytics
5. **Analyze Results**: View compression ratios, readability scores, and sentiment analysis

### Models Explorer (`/models`)
1. **Browse Models**: View 12+ open-source models with detailed information
2. **Check Availability**: See which models are installed vs. need downloading
3. **Copy Commands**: One-click copy of Ollama download commands
4. **Filter & Search**: Find models by category, organization, or availability

## 🔮 Roadmap

### Phase 2: Advanced Features (In Progress)
- **✅ Writing Style Selection**: 12 different writing styles implemented
- **✅ Voice Input/Output**: Speech-to-text and text-to-speech features
- **✅ Multiple Candidates**: Generate multiple response variations
- **✅ Advanced Analytics**: Comprehensive content analysis
- **🔄 Q&A over Documents**: RAG implementation for document queries
- **🔄 Code Generation**: Specialized code generation and explanation
- **🔄 Translation Services**: Multi-language translation capabilities
- **🔄 Structured Data Extraction**: Extract structured data from text

### Phase 3: Collaboration & Analytics
- **🔄 User Authentication**: User accounts and session management
- **🔄 Prompt Template Library**: Community-shared prompt templates
- **🔄 Team Collaboration**: Multi-user collaboration features
- **🔄 Performance Analytics**: Advanced usage and performance tracking
- **🔄 Model Comparison Tools**: Side-by-side model performance comparison
- **🔄 Advanced Sampling**: Top-p, top-k, frequency penalty controls
- **🔄 Conversation History**: Multi-turn conversation management
- **🔄 Content Filtering**: Safety and bias detection features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 