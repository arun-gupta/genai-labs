# GenAI Lab 🧪

A full-stack web application for experimenting with different GenAI use cases using large language models (LLMs). Supports both local models (via Ollama) and cloud-hosted models (OpenAI, Anthropic, etc.).

## 🚀 Features

### MVP (Phase 1)
- **Prompt Editor**: System and user prompt inputs with real-time editing
- **Model Selection**: Dropdown to choose between OpenAI, Anthropic, and Ollama models
- **Use Cases**: 
  - Text generation (`/generate`)
  - Text summarization (`/summarize`)
- **Models Explorer**: Comprehensive view of open-source models with availability status (`/models`)
- **Real-time Streaming**: Live output with token usage and latency tracking
- **Prompt History**: Local storage for session-based prompt history
- **Modular Architecture**: LangChain-based model abstractions

### Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: FastAPI (Python) + LangChain
- **Deployment**: Docker-ready with modular architecture

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
genai-lab/
├── frontend/                 # React TypeScript application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Route components
│   │   ├── services/       # API client services
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── backend/                 # FastAPI Python application
│   ├── app/
│   │   ├── api/            # API route handlers
│   │   ├── core/           # Configuration and core utilities
│   │   ├── models/         # Pydantic models
│   │   ├── services/       # LangChain and model services
│   │   └── utils/          # Utility functions
│   ├── requirements.txt    # Python dependencies
│   └── main.py            # FastAPI application entry point
├── shared/                 # Shared types and constants
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
cd genai-lab

# Run the automated setup script
./setup.sh

# Start the application
./quickstart.sh
```

### 🔧 Manual Setup

#### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd genai-lab

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

1. **Text Generation** (`/generate`):
   - Enter system and user prompts
   - Select your preferred model
   - Generate text with real-time streaming

2. **Text Summarization** (`/summarize`):
   - Paste text to summarize
   - Choose model and parameters
   - Get instant summaries

## 🔮 Roadmap

### Phase 2: Advanced Features
- Q&A over documents (RAG)
- Code generation and explanation
- Translation services
- Sentiment analysis
- Structured data extraction
- Persona simulation

### Phase 3: Collaboration & Analytics
- User authentication
- Prompt template library
- Team collaboration
- Performance analytics
- Model comparison tools

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 