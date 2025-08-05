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
    
    # Verify virtual environment is properly set up
    if [ ! -f "venv/bin/activate" ]; then
        echo -e "${RED}❌ Virtual environment is corrupted. Removing and recreating...${NC}"
        rm -rf venv
        python3 -m venv venv
        echo -e "${GREEN}✅ Virtual environment recreated${NC}"
    fi
    
    # Activate virtual environment
    echo -e "${YELLOW}🔄 Activating virtual environment...${NC}"
    source venv/bin/activate
    
    # Verify we're in the virtual environment
    if [ -z "$VIRTUAL_ENV" ]; then
        echo -e "${RED}❌ Failed to activate virtual environment${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Virtual environment activated: $VIRTUAL_ENV${NC}"
    
    # Upgrade pip
    echo -e "${YELLOW}📦 Upgrading pip...${NC}"
    pip install --upgrade pip
    
    # Install dependencies
    echo -e "${YELLOW}📦 Installing Python dependencies...${NC}"
    pip install -r requirements.txt
    
    # Verify installation
    echo -e "${YELLOW}🔍 Verifying installation...${NC}"
    python -c "import fastapi, langchain, openai, anthropic, textstat; print('✅ All key dependencies installed')"
    
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
    npm list --depth=0 | grep -E "(react|vite|typescript)" > /dev/null && echo "✅ All key dependencies installed"
    
    echo -e "${GREEN}✅ Frontend setup complete!${NC}"
    cd ..
}

# Function to create environment files
create_env_files() {
    echo -e "\n${BLUE}📝 Setting up environment files...${NC}"
    
    # Backend environment file
    if [ ! -f "backend/.env" ]; then
        echo -e "${YELLOW}📝 Creating backend environment file...${NC}"
        cp backend/env.example backend/.env
        echo -e "${GREEN}✅ Backend environment file created${NC}"
        echo -e "${YELLOW}⚠️  Please edit backend/.env and add your API keys if needed${NC}"
    else
        echo -e "${GREEN}✅ Backend environment file already exists${NC}"
    fi
    
    # Frontend environment file
    if [ ! -f "frontend/.env" ]; then
        echo -e "${YELLOW}📝 Creating frontend environment file...${NC}"
        cp frontend/env.example frontend/.env
        echo -e "${GREEN}✅ Frontend environment file created${NC}"
    else
        echo -e "${GREEN}✅ Frontend environment file already exists${NC}"
    fi
}

# Function to verify setup
verify_setup() {
    echo -e "\n${BLUE}🔍 Verifying setup...${NC}"
    
    # Check backend virtual environment
    if [ -d "backend/venv" ] && [ -f "backend/venv/bin/activate" ]; then
        echo -e "${GREEN}✅ Backend virtual environment is properly configured${NC}"
    else
        echo -e "${RED}❌ Backend virtual environment is not properly configured${NC}"
        return 1
    fi
    
    # Check frontend dependencies
    if [ -d "frontend/node_modules" ]; then
        echo -e "${GREEN}✅ Frontend dependencies are installed${NC}"
    else
        echo -e "${RED}❌ Frontend dependencies are not installed${NC}"
        return 1
    fi
    
    # Check environment files
    if [ -f "backend/.env" ] && [ -f "frontend/.env" ]; then
        echo -e "${GREEN}✅ Environment files are configured${NC}"
    else
        echo -e "${YELLOW}⚠️  Some environment files may be missing${NC}"
    fi
    
    return 0
}

# Main setup process
main() {
    # Check prerequisites
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    check_python || exit 1
    check_node || exit 1
    check_npm || exit 1
    
    # Setup backend
    setup_backend
    
    # Setup frontend
    setup_frontend
    
    # Create environment files
    create_env_files
    
    # Verify setup
    if verify_setup; then
        echo -e "\n${GREEN}🎉 Setup completed successfully!${NC}"
        echo -e "${BLUE}=============================================${NC}"
        echo -e "${GREEN}🚀 To start the application:${NC}"
        echo -e "${YELLOW}   ./quickstart.sh${NC}"
        echo -e ""
        echo -e "${GREEN}🔍 To verify your environment:${NC}"
        echo -e "${YELLOW}   ./verify_env.sh${NC}"
        echo -e ""
        echo -e "${GREEN}📚 For more information:${NC}"
        echo -e "${YELLOW}   cat README.md${NC}"
        echo -e "${BLUE}=============================================${NC}"
    else
        echo -e "\n${RED}❌ Setup verification failed. Please check the errors above.${NC}"
        exit 1
    fi
}

# Run main function
main 