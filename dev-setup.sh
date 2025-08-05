#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Setting up GenAI Lab for development...${NC}"
echo -e "${BLUE}==========================================${NC}"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3.9+ first.${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

# Create environment files if they don't exist
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}📝 Creating backend environment file...${NC}"
    cp backend/env.example backend/.env
    echo -e "${GREEN}✅ Backend environment file created${NC}"
    echo -e "${YELLOW}⚠️  Please edit backend/.env and add your API keys${NC}"
else
    echo -e "${GREEN}✅ Backend environment file already exists${NC}"
fi

if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}📝 Creating frontend environment file...${NC}"
    cp frontend/env.example frontend/.env
    echo -e "${GREEN}✅ Frontend environment file created${NC}"
else
    echo -e "${GREEN}✅ Frontend environment file already exists${NC}"
fi

# Setup backend
echo -e "\n${BLUE}🐍 Setting up Python backend...${NC}"
cd backend

# Create virtual environment if it doesn't exist
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

# Install dependencies
echo -e "${YELLOW}📦 Installing Python dependencies...${NC}"
pip install -r requirements.txt

# Verify installation
echo -e "${YELLOW}🔍 Verifying installation...${NC}"
python -c "import fastapi, langchain, openai, anthropic, textstat; print('✅ All key dependencies installed')"

cd ..

# Setup frontend
echo -e "\n${BLUE}⚛️  Setting up React frontend...${NC}"
cd frontend

# Install dependencies
echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"
npm install

# Verify installation
echo -e "${YELLOW}🔍 Verifying installation...${NC}"
npm list --depth=0 | grep -E "(react|vite|typescript)" > /dev/null && echo "✅ All key dependencies installed"

cd ..

echo -e "\n${GREEN}✅ Development setup complete!${NC}"
echo -e "${BLUE}=============================================${NC}"
echo -e "${GREEN}🚀 To start the application:${NC}"
echo -e "${YELLOW}   ./quickstart.sh${NC}"
echo -e ""
echo -e "${GREEN}🔍 To verify your environment:${NC}"
echo -e "${YELLOW}   ./verify_env.sh${NC}"
echo -e ""
echo -e "${GREEN}📚 Manual startup (if needed):${NC}"
echo -e "${YELLOW}1. Start the backend:${NC}"
echo -e "   cd backend && source venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo -e ""
echo -e "${YELLOW}2. Start the frontend (in a new terminal):${NC}"
echo -e "   cd frontend && npm run dev"
echo -e ""
echo -e "${GREEN}🌐 Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}🔧 Backend API: http://localhost:8000${NC}"
echo -e "${GREEN}📚 API Docs: http://localhost:8000/docs${NC}" 