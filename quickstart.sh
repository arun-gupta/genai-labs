#!/bin/bash

# Parse command line arguments
KILL_EXISTING=true
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-kill)
            KILL_EXISTING=false
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --no-kill    Don't kill existing processes, ask user instead"
            echo "  --help, -h   Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0              # Kill existing processes and start fresh"
            echo "  $0 --no-kill    # Ask before killing existing processes"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo "🚀 Starting GenAI Lab - Full Stack Application"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local port=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}⏳ Waiting for $service_name to be ready on port $port...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if check_port $port; then
            echo -e "${GREEN}✅ $service_name is ready!${NC}"
            return 0
        fi
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $service_name failed to start on port $port${NC}"
    return 1
}

# Function to kill process on port
kill_port() {
    local port=$1
    local service_name=$2
    
    if check_port $port; then
        echo -e "${YELLOW}🛑 Stopping existing $service_name on port $port...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null
        sleep 2
        if check_port $port; then
            echo -e "${RED}❌ Failed to stop $service_name on port $port${NC}"
            return 1
        else
            echo -e "${GREEN}✅ Stopped $service_name on port $port${NC}"
            return 0
        fi
    fi
    return 0
}

# Function to kill GenAI Lab processes
kill_genai_processes() {
    echo -e "${BLUE}🔍 Looking for existing GenAI Lab processes...${NC}"
    
    local should_kill=true
    
    # Check if we should ask before killing
    if [ "$KILL_EXISTING" = false ]; then
        local uvicorn_pids=$(pgrep -f "uvicorn.*main:app" 2>/dev/null)
        local vite_pids=$(pgrep -f "vite" 2>/dev/null)
        
        if [ ! -z "$uvicorn_pids" ] || [ ! -z "$vite_pids" ] || check_port 8000 || check_port 3000; then
            echo -e "${YELLOW}⚠️  Found existing GenAI Lab processes${NC}"
            read -p "Do you want to stop them and start fresh? (y/n): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                should_kill=false
            fi
        fi
    fi
    
    if [ "$should_kill" = true ]; then
        # Kill uvicorn processes (backend)
        local uvicorn_pids=$(pgrep -f "uvicorn.*main:app" 2>/dev/null)
        if [ ! -z "$uvicorn_pids" ]; then
            echo -e "${YELLOW}🛑 Stopping existing backend processes...${NC}"
            echo $uvicorn_pids | xargs kill -9 2>/dev/null
            sleep 1
        fi
        
        # Kill vite processes (frontend)
        local vite_pids=$(pgrep -f "vite" 2>/dev/null)
        if [ ! -z "$vite_pids" ]; then
            echo -e "${YELLOW}🛑 Stopping existing frontend processes...${NC}"
            echo $vite_pids | xargs kill -9 2>/dev/null
            sleep 1
        fi
        
        # Kill any remaining processes on our ports
        kill_port 8000 "Backend"
        kill_port 3000 "Frontend"
    else
        echo -e "${YELLOW}⚠️  Skipping process cleanup${NC}"
    fi
}

# Kill existing GenAI Lab processes
kill_genai_processes

# Create environment files if they don't exist
if [ ! -f "backend/.env" ]; then
    echo -e "${BLUE}📝 Creating backend environment file...${NC}"
    cp backend/env.example backend/.env
    echo -e "${YELLOW}⚠️  Please edit backend/.env and add your API keys if needed${NC}"
fi

if [ ! -f "frontend/.env" ]; then
    echo -e "${BLUE}📝 Creating frontend environment file...${NC}"
    cp frontend/env.example frontend/.env
fi

# Function to start backend
start_backend() {
    echo -e "${BLUE}🐍 Starting FastAPI backend...${NC}"
    cd backend
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo -e "${YELLOW}📦 Creating Python virtual environment...${NC}"
        python3 -m venv venv
        echo -e "${GREEN}✅ Virtual environment created${NC}"
    fi
    
    # Verify virtual environment is properly set up
    if [ ! -f "venv/bin/activate" ]; then
        echo -e "${RED}❌ Virtual environment is corrupted. Please run ./setup.sh to recreate it.${NC}"
        exit 1
    fi
    
    # Activate virtual environment and install dependencies
    echo -e "${YELLOW}🔄 Activating virtual environment...${NC}"
    source venv/bin/activate
    
    # Verify we're in the virtual environment
    if [ -z "$VIRTUAL_ENV" ]; then
        echo -e "${RED}❌ Failed to activate virtual environment${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Virtual environment activated: $VIRTUAL_ENV${NC}"
    
    # Check if requirements are installed
    if ! python -c "import fastapi" 2>/dev/null; then
        echo -e "${YELLOW}📦 Installing Python dependencies...${NC}"
        pip install -r requirements.txt
    fi
    
    # Start the backend server
    echo -e "${GREEN}🚀 Starting backend server on http://localhost:8000${NC}"
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
}

# Function to start frontend
start_frontend() {
    echo -e "${BLUE}⚛️  Starting React frontend...${NC}"
    cd frontend
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"
        npm install
    fi
    
    # Start the frontend development server
    echo -e "${GREEN}🚀 Starting frontend server on http://localhost:3000${NC}"
    npm run dev
}

# Start backend in background
echo -e "${BLUE}🔄 Starting services...${NC}"
start_backend &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start frontend in background
start_frontend &
FRONTEND_PID=$!

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✅ Services stopped${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for both services to be ready
wait_for_service 8000 "Backend API"
BACKEND_READY=$?

wait_for_service 3000 "Frontend"
FRONTEND_READY=$?

if [ $BACKEND_READY -eq 0 ] && [ $FRONTEND_READY -eq 0 ]; then
    echo -e "\n${GREEN}🎉 GenAI Lab is now running!${NC}"
    echo -e "${BLUE}=============================================${NC}"
    echo -e "${GREEN}🌐 Frontend: http://localhost:3000${NC}"
    echo -e "${GREEN}🔧 Backend API: http://localhost:8000${NC}"
    echo -e "${GREEN}📚 API Documentation: http://localhost:8000/docs${NC}"
    echo -e "${BLUE}=============================================${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
    
    # Keep the script running
    wait
else
    echo -e "${RED}❌ Failed to start one or more services${NC}"
    cleanup
    exit 1
fi 