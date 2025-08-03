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