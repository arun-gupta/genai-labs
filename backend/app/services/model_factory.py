from typing import Optional, Dict, Any, Union
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
    
    def get_model(self, provider: str, model_name: Optional[str] = None, vision_capable: bool = False, **kwargs) -> Union[ChatOpenAI, ChatAnthropic, OllamaLLM]:
        """Get or create an LLM instance for the specified provider."""
        cache_key = f"{provider}:{model_name or 'default'}:vision_{vision_capable}"
        
        if cache_key not in self._models:
            self._models[cache_key] = self._create_model(provider, model_name, vision_capable, **kwargs)
        
        return self._models[cache_key]
    
    def _create_model(self, provider: str, model_name: Optional[str] = None, vision_capable: bool = False, **kwargs) -> Union[ChatOpenAI, ChatAnthropic, OllamaLLM]:
        """Create a new LLM instance for the specified provider."""
        if provider == "openai":
            return self._create_openai_model(model_name, vision_capable, **kwargs)
        elif provider == "anthropic":
            return self._create_anthropic_model(model_name, vision_capable, **kwargs)
        elif provider == "ollama":
            return self._create_ollama_model(model_name, vision_capable, **kwargs)
        else:
            raise ValueError(f"Unsupported model provider: {provider}")
    
    def _create_openai_model(self, model_name: Optional[str] = None, vision_capable: bool = False, **kwargs) -> ChatOpenAI:
        """Create OpenAI model instance."""
        if not settings.openai_api_key:
            raise ValueError("OpenAI API key not configured")
        
        # Use vision model if requested
        if vision_capable:
            model = model_name or "gpt-4-vision-preview"
        else:
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
    
    def _create_anthropic_model(self, model_name: Optional[str] = None, vision_capable: bool = False, **kwargs) -> ChatAnthropic:
        """Create Anthropic model instance."""
        if not settings.anthropic_api_key:
            raise ValueError("Anthropic API key not configured")
        
        # Use vision model if requested
        if vision_capable:
            model = model_name or "claude-3-5-sonnet-20241022"
        else:
            model = model_name or settings.anthropic_model
            
        # Remove temperature, streaming, and max_tokens from kwargs to avoid duplicates
        model_kwargs = {k: v for k, v in kwargs.items() if k not in ['temperature', 'streaming', 'max_tokens']}
        
        # Provide default max_tokens for Anthropic if None
        max_tokens = kwargs.get('max_tokens')
        if max_tokens is None:
            max_tokens = 1000  # Default value for Anthropic models
        
        return ChatAnthropic(
            model=model,
            anthropic_api_key=settings.anthropic_api_key,
            temperature=kwargs.get('temperature', 0.7),
            max_tokens=max_tokens,
            streaming=kwargs.get('streaming', True),
            **model_kwargs
        )
    
    def _create_ollama_model(self, model_name: Optional[str] = None, vision_capable: bool = False, **kwargs) -> OllamaLLM:
        """Create Ollama model instance."""
        # Use vision model if requested
        if vision_capable:
            model = model_name or "llava:7b"
        else:
            model = model_name or settings.ollama_model
            
        # Handle GPT-OSS model name mapping
        if model == "gpt-oss:20b":
            # GPT-OSS models require specific configuration for harmony format
            model_kwargs = {k: v for k, v in kwargs.items() if k not in ['temperature', 'streaming', 'max_tokens']}
            
            return OllamaLLM(
                model=model,
                base_url=settings.ollama_base_url,
                temperature=kwargs.get('temperature', 0.7),
                **model_kwargs
            )
        else:
            # Standard Ollama models
            model_kwargs = {k: v for k, v in kwargs.items() if k not in ['temperature', 'streaming', 'max_tokens']}
            
            return OllamaLLM(
                model=model,
                base_url=settings.ollama_base_url,
                temperature=kwargs.get('temperature', 0.7),
                **model_kwargs
            )


# Global model factory instance
model_factory = ModelFactory() 