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
                content=f"Error: {str(e)}",
                is_complete=True,
                latency_ms=(time.time() - start_time) * 1000
            )
    
    async def summarize_text_stream(
        self,
        text: str,
        model_provider: str,
        model_name: Optional[str] = None,
        max_length: int = 150,
        temperature: float = 0.3
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
            
            # Create summarization prompt
            system_prompt = f"You are a helpful assistant that creates concise summaries. Keep summaries under {max_length} words."
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
                content=f"Error: {str(e)}",
                is_complete=True,
                latency_ms=(time.time() - start_time) * 1000
            ) 