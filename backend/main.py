from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.core.config import settings
import uvicorn

# Create FastAPI app
app = FastAPI(
    title="GenAI Lab API",
    description="A full-stack web application for experimenting with different GenAI use cases",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix=settings.api_prefix)


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Welcome to GenAI Lab API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "generate": f"{settings.api_prefix}/generate",
            "generate_stream": f"{settings.api_prefix}/generate/stream",
            "summarize": f"{settings.api_prefix}/summarize",
            "summarize_stream": f"{settings.api_prefix}/summarize/stream",
            "models": f"{settings.api_prefix}/models"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": "2024-01-01T00:00:00Z"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    ) 