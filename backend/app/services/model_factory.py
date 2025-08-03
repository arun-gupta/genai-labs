from typing import Optional, Dict, Any
from langchain.llms.base import LLM
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_ollama import OllamaLLM
from app.core.config import settings
import time


class ModelFactory:
    """Factory for creating different LLM instances based on provider."""
    
    def __init__(self):
        self._models: Dict[str, LLM] = {}
    
    def get_model(self, provider: str, model_name: Optional[str] = None, **kwargs) -> LLM:
        """Get or create an LLM instance for the specified provider."""
        cache_key = f"{provider}:{model_name or 'default'}"
        
        if cache_key not in self._models:
            self._models[cache_key] = self._create_model(provider, model_name, **kwargs)
        
        return self._models[cache_key]
    
    def _create_model(self, provider: str, model_name: Optional[str] = None, **kwargs) -> LLM:
        """Create a new LLM instance for the specified provider."""
        if provider == "openai":
            return self._create_openai_model(model_name, **kwargs)
        elif provider == "anthropic":
            return self._create_anthropic_model(model_name, **kwargs)
        elif provider == "ollama":
            return self._create_ollama_model(model_name, **kwargs)
        else:
            raise ValueError(f"Unsupported model provider: {provider}")
    
    def _create_openai_model(self, model_name: Optional[str] = None, **kwargs) -> ChatOpenAI:
        """Create OpenAI model instance."""
        if not settings.openai_api_key:
            raise ValueError("OpenAI API key not configured")
        
        model = model_name or settings.openai_model
        # Remove temperature, streaming, and max_tokens from kwargs to avoid duplicates
        model_kwargs = {k: v for k, v in kwargs.items() if k not in ['temperature', 'streaming', 'max_tokens']}
        
        return ChatOpenAI(
            model=model,
            openai_api_key=settings.openai_api_key,
            temperature=kwargs.get('temperature', 0.7),
            max_tokens=kwargs.get('max_tokens'),
            streaming=kwargs.get('streaming', True),
            **model_kwargs
        )
    
    def _create_anthropic_model(self, model_name: Optional[str] = None, **kwargs) -> ChatAnthropic:
        """Create Anthropic model instance."""
        if not settings.anthropic_api_key:
            raise ValueError("Anthropic API key not configured")
        
        model = model_name or settings.anthropic_model
        # Remove temperature, streaming, and max_tokens from kwargs to avoid duplicates
        model_kwargs = {k: v for k, v in kwargs.items() if k not in ['temperature', 'streaming', 'max_tokens']}
        
        return ChatAnthropic(
            model=model,
            anthropic_api_key=settings.anthropic_api_key,
            temperature=kwargs.get('temperature', 0.7),
            max_tokens=kwargs.get('max_tokens'),
            streaming=kwargs.get('streaming', True),
            **model_kwargs
        )
    
    def _create_ollama_model(self, model_name: Optional[str] = None, **kwargs) -> OllamaLLM:
        """Create Ollama model instance."""
        model = model_name or settings.ollama_model
        # Remove temperature, streaming, and max_tokens from kwargs to avoid duplicates
        model_kwargs = {k: v for k, v in kwargs.items() if k not in ['temperature', 'streaming', 'max_tokens']}
        
        return OllamaLLM(
            model=model,
            base_url=settings.ollama_base_url,
            temperature=kwargs.get('temperature', 0.7),
            **model_kwargs
        )


# Global model factory instance
model_factory = ModelFactory() 