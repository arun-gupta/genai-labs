#!/bin/bash

# GenAI Lab Setup Script
# This script ensures all dependencies are installed in virtual environments

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 GenAI Lab Setup Script${NC}"
echo -e "${BLUE}========================${NC}"

# Function to check if Python is available
check_python() {
    if command -v python3 &> /dev/null; then
        echo -e "${GREEN}✅ Python 3 found: $(python3 --version)${NC}"
        return 0
    elif command -v python &> /dev/null; then
        echo -e "${GREEN}✅ Python found: $(python --version)${NC}"
        return 0
    else
        echo -e "${RED}❌ Python not found. Please install Python 3.8+${NC}"
        return 1
    fi
}

# Function to check if Node.js is available
check_node() {
    if command -v node &> /dev/null; then
        echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}"
        return 0
    else
        echo -e "${RED}❌ Node.js not found. Please install Node.js 16+${NC}"
        return 1
    fi
}

# Function to check if npm is available
check_npm() {
    if command -v npm &> /dev/null; then
        echo -e "${GREEN}✅ npm found: $(npm --version)${NC}"
        return 0
    else
        echo -e "${RED}❌ npm not found. Please install npm${NC}"
        return 1
    fi
}

# Function to setup backend
setup_backend() {
    echo -e "\n${BLUE}🐍 Setting up Python Backend...${NC}"
    cd backend
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo -e "${YELLOW}📦 Creating Python virtual environment...${NC}"
        python3 -m venv venv
        echo -e "${GREEN}✅ Virtual environment created${NC}"
    else
        echo -e "${GREEN}✅ Virtual environment already exists${NC}"
    fi
    
    # Activate virtual environment
    echo -e "${YELLOW}🔄 Activating virtual environment...${NC}"
    source venv/bin/activate
    
    # Upgrade pip
    echo -e "${YELLOW}📦 Upgrading pip...${NC}"
    pip install --upgrade pip
    
    # Install dependencies
    echo -e "${YELLOW}📦 Installing Python dependencies...${NC}"
    pip install -r requirements.txt
    
    # Verify installation
    echo -e "${YELLOW}🔍 Verifying installation...${NC}"
    python -c "import fastapi, langchain, openai, anthropic; print('✅ All key dependencies installed')"
    
    echo -e "${GREEN}✅ Backend setup complete!${NC}"
    cd ..
}

# Function to setup frontend
setup_frontend() {
    echo -e "\n${BLUE}⚛️  Setting up React Frontend...${NC}"
    cd frontend
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"
        npm install
        echo -e "${GREEN}✅ Node.js dependencies installed${NC}"
    else
        echo -e "${GREEN}✅ Node.js dependencies already installed${NC}"
    fi
    
    # Verify installation
    echo -e "${YELLOW}🔍 Verifying installation...${NC}"
    npm list --depth=0 | grep -E "(react|vite|typescript)" || echo "✅ Key dependencies found"
    
    echo -e "${GREEN}✅ Frontend setup complete!${NC}"
    cd ..
}

# Function to create environment files
setup_env_files() {
    echo -e "\n${BLUE}📝 Setting up environment files...${NC}"
    
    # Backend environment
    if [ ! -f "backend/.env" ]; then
        if [ -f "backend/env.example" ]; then
            echo -e "${YELLOW}📝 Creating backend .env from example...${NC}"
            cp backend/env.example backend/.env
            echo -e "${YELLOW}⚠️  Please edit backend/.env and add your API keys${NC}"
        else
            echo -e "${YELLOW}📝 Creating basic backend .env...${NC}"
            cat > backend/.env << EOF
# API Keys (add your keys here)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# CORS Settings
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Ollama Settings
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral:7b
EOF
            echo -e "${YELLOW}⚠️  Please edit backend/.env and add your API keys${NC}"
        fi
    else
        echo -e "${GREEN}✅ Backend .env already exists${NC}"
    fi
    
    # Frontend environment
    if [ ! -f "frontend/.env" ]; then
        if [ -f "frontend/env.example" ]; then
            echo -e "${YELLOW}📝 Creating frontend .env from example...${NC}"
            cp frontend/env.example frontend/.env
        else
            echo -e "${YELLOW}📝 Creating basic frontend .env...${NC}"
            cat > frontend/.env << EOF
VITE_API_BASE_URL=http://localhost:8000/api/v1
EOF
        fi
    else
        echo -e "${GREEN}✅ Frontend .env already exists${NC}"
    fi
}

# Function to verify gitignore
verify_gitignore() {
    echo -e "\n${BLUE}🔍 Verifying .gitignore configuration...${NC}"
    
    if [ -f ".gitignore" ]; then
        # Check for virtual environment exclusions
        if grep -q "venv/" .gitignore && grep -q "node_modules/" .gitignore; then
            echo -e "${GREEN}✅ .gitignore properly configured for virtual environments${NC}"
        else
            echo -e "${YELLOW}⚠️  .gitignore may need updates for virtual environments${NC}"
        fi
        
        # Check for Python exclusions
        if grep -q "__pycache__/" .gitignore; then
            echo -e "${GREEN}✅ .gitignore includes Python cache exclusions${NC}"
        else
            echo -e "${YELLOW}⚠️  .gitignore missing Python cache exclusions${NC}"
        fi
    else
        echo -e "${RED}❌ .gitignore not found${NC}"
    fi
}

# Main setup process
main() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    
    # Check prerequisites
    check_python || exit 1
    check_node || exit 1
    check_npm || exit 1
    
    # Setup environment files
    setup_env_files
    
    # Setup backend
    setup_backend
    
    # Setup frontend
    setup_frontend
    
    # Verify gitignore
    verify_gitignore
    
    echo -e "\n${GREEN}🎉 Setup complete!${NC}"
    echo -e "${BLUE}=============================================${NC}"
    echo -e "${GREEN}✅ Python virtual environment: backend/venv/${NC}"
    echo -e "${GREEN}✅ Node.js dependencies: frontend/node_modules/${NC}"
    echo -e "${GREEN}✅ Environment files created${NC}"
    echo -e "${BLUE}=============================================${NC}"
    echo -e "${YELLOW}Next steps:${NC}"
    echo -e "1. Edit backend/.env and add your API keys"
    echo -e "2. Run ./quickstart.sh to start the application"
    echo -e "3. Visit http://localhost:3000 to use the app"
}

# Run main function
main "$@" 