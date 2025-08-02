from typing import AsyncGenerator, Optional
from langchain.schema import HumanMessage, SystemMessage
from langchain.callbacks.base import BaseCallbackHandler
from app.services.model_factory import model_factory
from app.models.responses import TokenUsage, StreamChunk
import time
import json


class StreamingCallbackHandler(BaseCallbackHandler):
    """Custom callback handler for streaming responses."""
    
    def __init__(self):
        self.content = ""
        self.start_time = time.time()
        self.token_usage = None
    
    def on_llm_new_token(self, token: str, **kwargs):
        """Handle new token from streaming response."""
        self.content += token
    
    def on_llm_end(self, response, **kwargs):
        """Handle end of LLM response."""
        if hasattr(response, 'llm_output') and response.llm_output:
            token_info = response.llm_output.get('token_usage', {})
            self.token_usage = TokenUsage(
                prompt_tokens=token_info.get('prompt_tokens', 0),
                completion_tokens=token_info.get('completion_tokens', 0),
                total_tokens=token_info.get('total_tokens', 0)
            )


class GenerationService:
    """Service for handling text generation and summarization."""
    
    def __init__(self):
        self.model_factory = model_factory
    
    def _format_error_message(self, error: str) -> str:
        """Format error messages for better user experience."""
        if "rate_limit_exceeded" in error or "429" in error:
            return "Rate limit exceeded. Please try again in a moment or use a shorter text."
        elif "context_length" in error or "8192" in error:
            return "Text too long. Please try with a shorter text or document."
        elif "tokens per min" in error or "TPM" in error:
            return "Rate limit exceeded. Please try again in a moment or use a shorter text."
        elif "quota" in error.lower():
            return "API quota exceeded. Please check your API key or try again later."
        else:
            return error
    
    def _should_retry_with_fallback(self, error: str) -> bool:
        """Determine if we should retry with a fallback model."""
        rate_limit_indicators = [
            "rate_limit_exceeded", "429", "tokens per min", "TPM", "quota"
        ]
        return any(indicator in error.lower() for indicator in rate_limit_indicators)
    
    async def generate_text_stream(
        self,
        system_prompt: str,
        user_prompt: str,
        model_provider: str,
        model_name: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> AsyncGenerator[StreamChunk, None]:
        """Generate text with streaming response."""
        start_time = time.time()
        
        try:
            # Get model instance
            model = self.model_factory.get_model(
                provider=model_provider,
                model_name=model_name,
                temperature=temperature,
                max_tokens=max_tokens,
                streaming=True
            )
            
            # Create callback handler for streaming
            callback_handler = StreamingCallbackHandler()
            
            # Prepare messages
            messages = []
            if system_prompt.strip():
                messages.append(SystemMessage(content=system_prompt))
            messages.append(HumanMessage(content=user_prompt))
            
            # Generate response
            response = await model.agenerate([messages], callbacks=[callback_handler])
            
            # Calculate latency
            latency_ms = (time.time() - start_time) * 1000
            
            # Yield final chunk with complete information
            yield StreamChunk(
                content=callback_handler.content,
                is_complete=True,
                token_usage=callback_handler.token_usage,
                latency_ms=latency_ms
            )
            
        except Exception as e:
            # Yield error chunk
            yield StreamChunk(
                content=f"Error: {self._format_error_message(str(e))}",
                is_complete=True,
                latency_ms=(time.time() - start_time) * 1000
            )
    
    async def summarize_text_stream(
        self,
        text: str,
        model_provider: str,
        model_name: Optional[str] = None,
        max_length: int = 150,
        temperature: float = 0.3,
        summary_type: str = "general"
    ) -> AsyncGenerator[StreamChunk, None]:
        """Summarize text with streaming response."""
        start_time = time.time()
        
        try:
            # Get model instance
            model = self.model_factory.get_model(
                provider=model_provider,
                model_name=model_name,
                temperature=temperature,
                streaming=True
            )
            
            # Create callback handler for streaming
            callback_handler = StreamingCallbackHandler()
            
            # Create summarization prompt based on type
            system_prompt = self._get_summary_system_prompt(summary_type, max_length)
            user_prompt = f"Please summarize the following text:\n\n{text}"
            
            # Prepare messages
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ]
            
            # Generate response
            response = await model.agenerate([messages], callbacks=[callback_handler])
            
            # Calculate latency
            latency_ms = (time.time() - start_time) * 1000
            
            # Yield final chunk with complete information
            yield StreamChunk(
                content=callback_handler.content,
                is_complete=True,
                token_usage=callback_handler.token_usage,
                latency_ms=latency_ms
            )
            
        except Exception as e:
            # Yield error chunk
            yield StreamChunk(
                content=f"Error: {self._format_error_message(str(e))}",
                is_complete=True,
                latency_ms=(time.time() - start_time) * 1000
            )
    
    def _get_summary_system_prompt(self, summary_type: str, max_length: int) -> str:
        """Get system prompt based on summary type."""
        base_prompt = f"You are a helpful assistant that creates concise summaries. Keep summaries under {max_length} words."
        
        if summary_type == "general":
            return f"{base_prompt} Provide a general summary of the main points."
        
        elif summary_type == "bullet_points":
            return f"{base_prompt} Provide a summary in bullet point format, highlighting key points."
        
        elif summary_type == "key_points":
            return f"{base_prompt} Extract and summarize the key points and main ideas."
        
        elif summary_type == "extractive":
            return f"{base_prompt} Create an extractive summary by selecting and combining the most important sentences from the text."
        
        else:
            return base_prompt 