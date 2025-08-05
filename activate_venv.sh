#!/bin/bash

# GenAI Lab Virtual Environment Activation Script
# This script helps you activate the Python virtual environment

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐍 GenAI Lab Virtual Environment Activation${NC}"
echo -e "${BLUE}==========================================${NC}"

# Check if we're already in a virtual environment
if [ -n "$VIRTUAL_ENV" ]; then
    echo -e "${GREEN}✅ Virtual environment is already active: $VIRTUAL_ENV${NC}"
    echo -e "${YELLOW}💡 To deactivate, run: deactivate${NC}"
    exit 0
fi

# Check if backend virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo -e "${RED}❌ Virtual environment not found${NC}"
    echo -e "${YELLOW}💡 Please run ./setup.sh first to create the virtual environment${NC}"
    exit 1
fi

# Check if virtual environment is properly set up
if [ ! -f "backend/venv/bin/activate" ]; then
    echo -e "${RED}❌ Virtual environment is corrupted${NC}"
    echo -e "${YELLOW}💡 Please run ./setup.sh to recreate the virtual environment${NC}"
    exit 1
fi

# Activate the virtual environment
echo -e "${YELLOW}🔄 Activating virtual environment...${NC}"
source backend/venv/bin/activate

# Verify activation
if [ -z "$VIRTUAL_ENV" ]; then
    echo -e "${RED}❌ Failed to activate virtual environment${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Virtual environment activated: $VIRTUAL_ENV${NC}"
echo -e "${GREEN}✅ Python path: $(which python)${NC}"
echo -e "${GREEN}✅ Pip path: $(which pip)${NC}"

# Show available commands
echo -e "\n${BLUE}🚀 Available commands:${NC}"
echo -e "${YELLOW}   uvicorn main:app --reload --host 0.0.0.0 --port 8000${NC}"
echo -e "${YELLOW}   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000${NC}"
echo -e "${YELLOW}   pip install <package_name>${NC}"
echo -e "${YELLOW}   deactivate${NC}"

echo -e "\n${GREEN}💡 To start the backend server, run:${NC}"
echo -e "${YELLOW}   cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000${NC}"

echo -e "\n${GREEN}💡 To deactivate the virtual environment, run:${NC}"
echo -e "${YELLOW}   deactivate${NC}" 