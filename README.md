# GenAI Lab 🧪

A full-stack web application for experimenting with different GenAI use cases using large language models (LLMs). Supports both local models (via Ollama) and cloud-hosted models (OpenAI, Anthropic, etc.).

## 🚀 Features

### MVP (Phase 1)
- **Prompt Editor**: System and user prompt inputs with real-time editing
- **Model Selection**: Dropdown to choose between OpenAI, Anthropic, and Ollama models
- **Use Cases**: 
  - Text generation (`/generate`)
  - Text summarization (`/summarize`)
- **Real-time Streaming**: Live output with token usage and latency tracking
- **Prompt History**: Local storage for session-based prompt history
- **Modular Architecture**: LangChain-based model abstractions

### Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: FastAPI (Python) + LangChain
- **Deployment**: Docker-ready with modular architecture

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

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd genai-lab

# Create environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Backend Setup

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