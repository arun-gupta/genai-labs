# Setup Guide

## 🛠️ Prerequisites

- **Node.js 18+** and npm
- **Python 3.9+**
- **Git** (for cloning the repository)

## 🚀 Quick Start (Recommended)

The easiest way to get started:

```bash
# Clone the repository
git clone <repository-url>
cd genai-labs

# Start the application (includes setup if needed)
./quickstart.sh
```

**That's it!** The app will be running at http://localhost:3000

## 🔧 Setup Options

### 🚀 Quick Start (Recommended)
```bash
./quickstart.sh  # Everything in one command
```

### 🔧 Development Setup
```bash
./dev-setup.sh   # Quick dev environment
./quickstart.sh  # Start the app
```

### 📋 Complete Setup
```bash
./setup.sh       # Comprehensive setup
./quickstart.sh  # Start the app
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
genai-labs/
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

## 🔧 Manual Setup (Alternative)

If you prefer to run setup separately or need more control:

### 1. Clone and Manual Setup

```bash
# Clone the repository
git clone <repository-url>
cd genai-labs

# Create environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Backend Setup (with Virtual Environment)

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

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables in .env
# Configure backend API URL

# Run the frontend
npm run dev
```

### 4. Ollama Setup (Optional - For Local Models)

If you want to use local models via Ollama:

```bash
# Install Ollama (if not already installed)
# Visit https://ollama.ai for installation instructions

# Start Ollama server
ollama serve

# Download and run a model
ollama pull mistral:7b
ollama run mistral:7b

# Keep models running indefinitely for better performance
curl http://localhost:11434/api/generate -d '{"model": "mistral:7b", "keep_alive": -1}'
curl http://localhost:11434/api/generate -d '{"model": "mistral:latest", "keep_alive": -1}'
```

**Benefits of keeping models loaded:**
- ⚡ **Instant responses** - No loading delay for the first request
- 🔄 **Consistent performance** - Eliminates cold start latency
- 🏭 **Production ready** - Ideal for server deployments

**Managing running models:**
```bash
# Check which models are currently running
ollama ps

# Stop a model to free memory
curl http://localhost:11434/api/generate -d '{"model": "mistral:7b", "keep_alive": 0}'
```

### 5. Local Image Generation Setup (Optional)

For privacy-focused, local image generation without cloud dependencies:

#### Option A: AUTOMATIC1111 Stable Diffusion WebUI (Recommended)

```bash
# Install Git LFS (if not already installed)
git lfs install

# Clone the repository
git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git
cd stable-diffusion-webui

# Linux/macOS: Run with API enabled
./webui.sh --api --listen

# Windows: Run with API enabled
webui-user.bat
# Add to webui-user.bat: set COMMANDLINE_ARGS=--api --listen
```

**Download Models:**
```bash
# Navigate to models/Stable-diffusion directory
cd models/Stable-diffusion

# Download Stable Diffusion 1.5 (recommended starter model)
wget https://huggingface.co/runwayml/stable-diffusion-v1-5/resolve/main/v1-5-pruned-emaonly.ckpt

# Or download via WebUI interface at http://localhost:7860
```

**Verify Installation:**
- Access WebUI at: http://localhost:7860
- API should be available at: http://localhost:7860/docs
- Test generation in the WebUI before using with our app

#### Option B: OllamaDiffuser (Lightweight Alternative)

```bash
# Install OllamaDiffuser
pip install ollamadiffuser

# Pull and run a model
ollamadiffuser pull flux.1-schnell
ollamadiffuser serve

# Verify installation
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A red rose"}'
```

**Available Models:**
- `flux.1-schnell` - Fast, high-quality (recommended)
- `flux.1-dev` - Development version with more features
- `stable-diffusion-3.5` - Latest Stability AI model
- `stable-diffusion-1.5` - Classic model

#### Hardware Requirements

**Minimum (SD 1.5):**
- 8GB RAM
- 4GB VRAM (GPU) or 16GB RAM (CPU-only)
- 10GB free disk space

**Recommended (SD XL/FLUX):**
- 16GB RAM
- 8GB VRAM (GPU) or 32GB RAM (CPU-only)
- 20GB free disk space

**Optimal (Multiple models):**
- 32GB+ RAM
- 12GB+ VRAM
- 50GB+ free disk space

#### Integration with Our App

Once your local image generation is running:

1. **Open Vision AI page** in the app
2. **Select "Ollama" or "Stable Diffusion"** as provider
3. **Choose your model** from the dropdown
4. **Start generating images** locally and privately!

The app automatically detects and connects to:
- AUTOMATIC1111 WebUI (port 7860)
- OllamaDiffuser (port 8000)
```

## 🐛 Troubleshooting

### Common Issues

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

#### Issue: "Node.js not found"
```bash
# Solution: Install Node.js 18+ and npm
node --version
npm --version
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