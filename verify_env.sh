#!/bin/bash

# GenAI Lab Environment Verification Script
# This script verifies that virtual environments are properly set up

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 GenAI Lab Environment Verification${NC}"
echo -e "${BLUE}====================================${NC}"

# Function to check if we're in a virtual environment
check_virtual_env() {
    if [ -n "$VIRTUAL_ENV" ]; then
        echo -e "${GREEN}✅ Virtual environment is active: $VIRTUAL_ENV${NC}"
        return 0
    else
        echo -e "${RED}❌ No virtual environment is active${NC}"
        return 1
    fi
}

# Function to check if backend virtual environment exists
check_backend_venv() {
    if [ -d "backend/venv" ]; then
        echo -e "${GREEN}✅ Backend virtual environment exists: backend/venv/${NC}"
        
        # Check if it's properly structured
        if [ -f "backend/venv/bin/activate" ] && [ -f "backend/venv/bin/python" ]; then
            echo -e "${GREEN}✅ Backend virtual environment is properly structured${NC}"
            return 0
        else
            echo -e "${RED}❌ Backend virtual environment is corrupted${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Backend virtual environment not found${NC}"
        return 1
    fi
}

# Function to check if frontend node_modules exists
check_frontend_deps() {
    if [ -d "frontend/node_modules" ]; then
        echo -e "${GREEN}✅ Frontend dependencies exist: frontend/node_modules/${NC}"
        return 0
    else
        echo -e "${RED}❌ Frontend dependencies not found${NC}"
        return 1
    fi
}

# Function to check if environment files exist
check_env_files() {
    local backend_env_exists=false
    local frontend_env_exists=false
    
    if [ -f "backend/.env" ]; then
        echo -e "${GREEN}✅ Backend environment file exists: backend/.env${NC}"
        backend_env_exists=true
    else
        echo -e "${YELLOW}⚠️  Backend environment file not found: backend/.env${NC}"
    fi
    
    if [ -f "frontend/.env" ]; then
        echo -e "${GREEN}✅ Frontend environment file exists: frontend/.env${NC}"
        frontend_env_exists=true
    else
        echo -e "${YELLOW}⚠️  Frontend environment file not found: frontend/.env${NC}"
    fi
    
    if [ "$backend_env_exists" = true ] && [ "$frontend_env_exists" = true ]; then
        return 0
    else
        return 1
    fi
}

# Function to check if .gitignore is properly configured
check_gitignore() {
    if [ -f ".gitignore" ]; then
        echo -e "${GREEN}✅ .gitignore file exists${NC}"
        
        local venv_ignored=false
        local node_modules_ignored=false
        local pycache_ignored=false
        
        if grep -q "venv/" .gitignore; then
            echo -e "${GREEN}✅ Virtual environments are gitignored${NC}"
            venv_ignored=true
        fi
        
        if grep -q "node_modules/" .gitignore; then
            echo -e "${GREEN}✅ Node.js dependencies are gitignored${NC}"
            node_modules_ignored=true
        fi
        
        if grep -q "__pycache__/" .gitignore; then
            echo -e "${GREEN}✅ Python cache is gitignored${NC}"
            pycache_ignored=true
        fi
        
        if [ "$venv_ignored" = true ] && [ "$node_modules_ignored" = true ] && [ "$pycache_ignored" = true ]; then
            return 0
        else
            return 1
        fi
    else
        echo -e "${RED}❌ .gitignore file not found${NC}"
        return 1
    fi
}

# Function to check if key dependencies are installed
check_dependencies() {
    echo -e "\n${BLUE}🔍 Checking Python dependencies...${NC}"
    
    # Activate backend virtual environment temporarily
    if [ -f "backend/venv/bin/activate" ]; then
        source backend/venv/bin/activate
        
        # Check key Python packages
        local missing_packages=()
        
        if ! python -c "import fastapi" 2>/dev/null; then
            missing_packages+=("fastapi")
        fi
        
        if ! python -c "import langchain" 2>/dev/null; then
            missing_packages+=("langchain")
        fi
        
        if ! python -c "import openai" 2>/dev/null; then
            missing_packages+=("openai")
        fi
        
        if ! python -c "import anthropic" 2>/dev/null; then
            missing_packages+=("anthropic")
        fi
        
        if [ ${#missing_packages[@]} -eq 0 ]; then
            echo -e "${GREEN}✅ All key Python dependencies are installed${NC}"
        else
            echo -e "${RED}❌ Missing Python dependencies: ${missing_packages[*]}${NC}"
            echo -e "${YELLOW}💡 Run: cd backend && source venv/bin/activate && pip install -r requirements.txt${NC}"
        fi
        
        deactivate
    else
        echo -e "${RED}❌ Cannot check Python dependencies - virtual environment not found${NC}"
    fi
    
    echo -e "\n${BLUE}🔍 Checking Node.js dependencies...${NC}"
    
    if [ -d "frontend/node_modules" ]; then
        # Check if key Node.js packages are installed
        if [ -d "frontend/node_modules/react" ] && [ -d "frontend/node_modules/vite" ]; then
            echo -e "${GREEN}✅ Key Node.js dependencies are installed${NC}"
        else
            echo -e "${RED}❌ Missing Node.js dependencies${NC}"
            echo -e "${YELLOW}💡 Run: cd frontend && npm install${NC}"
        fi
    else
        echo -e "${RED}❌ Cannot check Node.js dependencies - node_modules not found${NC}"
    fi
}

# Main verification process
main() {
    local all_good=true
    
    echo -e "${BLUE}🔍 Checking virtual environment status...${NC}"
    check_virtual_env || all_good=false
    
    echo -e "\n${BLUE}🔍 Checking project structure...${NC}"
    check_backend_venv || all_good=false
    check_frontend_deps || all_good=false
    check_env_files || all_good=false
    check_gitignore || all_good=false
    
    check_dependencies
    
    echo -e "\n${BLUE}====================================${NC}"
    
    if [ "$all_good" = true ]; then
        echo -e "${GREEN}🎉 Environment verification passed!${NC}"
        echo -e "${GREEN}✅ Your GenAI Lab environment is properly configured${NC}"
        echo -e "${YELLOW}💡 You can now run ./quickstart.sh to start the application${NC}"
    else
        echo -e "${RED}❌ Environment verification failed!${NC}"
        echo -e "${YELLOW}💡 Please run ./setup.sh to fix the issues${NC}"
        exit 1
    fi
}

# Run main function
main "$@" 