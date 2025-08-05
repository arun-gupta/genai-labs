from typing import AsyncGenerator, Optional
from langchain.schema import HumanMessage, SystemMessage
from langchain.callbacks.base import BaseCallbackHandler
from app.services.model_factory import model_factory
from app.services.language_service import language_service
from app.services.output_formatter_service import output_formatter_service
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
        max_tokens: Optional[int] = None,
        target_language: str = "en",
        translate_response: bool = False,
        output_format: str = "text",
        num_candidates: int = 1
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
            
            # Prepare messages with output format instructions
            messages = []
            if system_prompt.strip():
                # Add output format instructions to system prompt
                formatted_system_prompt = output_formatter_service.format_system_prompt(
                    system_prompt, output_format
                )
                messages.append(SystemMessage(content=formatted_system_prompt))
            else:
                # If no system prompt, add format instructions to user prompt
                format_instruction = output_formatter_service.get_format_instruction(output_format)
                user_prompt_with_format = f"{user_prompt}\n\n{format_instruction}"
                messages.append(HumanMessage(content=user_prompt_with_format))
            
            if system_prompt.strip():
                messages.append(HumanMessage(content=user_prompt))
            
            # Generate multiple candidates
            all_candidates = []
            total_token_usage = None
            
            for candidate_num in range(num_candidates):
                # Create a new callback handler for each candidate
                candidate_handler = StreamingCallbackHandler()
                
                # Generate response - handle Ollama models differently
                if model_provider == "ollama":
                    # For Ollama, use a different approach
                    try:
                        # Convert messages to simple text for Ollama
                        prompt_text = ""
                        for message in messages:
                            if hasattr(message, 'content'):
                                prompt_text += message.content + "\n"
                        
                        # Use the model's __call__ method for Ollama
                        response = await model.ainvoke(prompt_text)
                        candidate_handler.content = response
                        
                        # Estimate token usage for Ollama (since it doesn't provide exact counts)
                        # Rough estimation: 1 token ≈ 4 characters for English text
                        prompt_tokens = len(prompt_text) // 4
                        completion_tokens = len(response) // 4
                        total_tokens = prompt_tokens + completion_tokens
                        
                        candidate_handler.token_usage = TokenUsage(
                            prompt_tokens=prompt_tokens,
                            completion_tokens=completion_tokens,
                            total_tokens=total_tokens
                        )
                    except Exception as ollama_error:
                        raise Exception(f"Ollama model error: {str(ollama_error)}")
                else:
                    # For other models, use agenerate
                    await model.agenerate([messages], callbacks=[candidate_handler])
                
                # Handle translation if requested
                candidate_content = candidate_handler.content
                if translate_response and target_language != "en":
                    try:
                        translation_result = language_service.translate_text(
                            candidate_content, 
                            target_language, 
                            "auto"
                        )
                        candidate_content = translation_result['translated_text']
                    except Exception as translation_error:
                        # If translation fails, keep original content
                        print(f"Translation failed: {translation_error}")
                
                all_candidates.append(candidate_content)
                
                # Accumulate token usage
                if candidate_handler.token_usage:
                    if total_token_usage is None:
                        total_token_usage = candidate_handler.token_usage.copy()
                    else:
                        # Add token counts
                        for key in total_token_usage:
                            if key in candidate_handler.token_usage:
                                total_token_usage[key] += candidate_handler.token_usage[key]
            
            # Calculate latency
            latency_ms = (time.time() - start_time) * 1000
            
            # Yield candidates
            if num_candidates == 1:
                # Single candidate - yield as before
                yield StreamChunk(
                    content=all_candidates[0],
                    is_complete=True,
                    token_usage=total_token_usage,
                    latency_ms=latency_ms
                )
            else:
                # Multiple candidates - yield as JSON array
                candidates_json = json.dumps(all_candidates, ensure_ascii=False)
                yield StreamChunk(
                    content=candidates_json,
                    is_complete=True,
                    token_usage=total_token_usage,
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
        summary_type: str = "general",
        target_language: str = "en",
        translate_summary: bool = False,
        output_format: str = "text"
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
            base_system_prompt = self._get_summary_system_prompt(summary_type, max_length)
            
            # Add output format instructions to system prompt
            system_prompt = output_formatter_service.format_system_prompt(base_system_prompt, output_format)
            user_prompt = f"Please summarize the following text:\n\n{text}"
            
            # Prepare messages
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ]
            
            # Generate response - handle Ollama models differently
            if model_provider == "ollama":
                # For Ollama, use a different approach
                try:
                    # Convert messages to simple text for Ollama
                    prompt_text = ""
                    for message in messages:
                        if hasattr(message, 'content'):
                            prompt_text += message.content + "\n"
                    
                    # Use the model's __call__ method for Ollama
                    response = await model.ainvoke(prompt_text)
                    callback_handler.content = response
                    
                    # Estimate token usage for Ollama (since it doesn't provide exact counts)
                    # Rough estimation: 1 token ≈ 4 characters for English text
                    prompt_tokens = len(prompt_text) // 4
                    completion_tokens = len(response) // 4
                    total_tokens = prompt_tokens + completion_tokens
                    
                    callback_handler.token_usage = TokenUsage(
                        prompt_tokens=prompt_tokens,
                        completion_tokens=completion_tokens,
                        total_tokens=total_tokens
                    )
                except Exception as ollama_error:
                    raise Exception(f"Ollama model error: {str(ollama_error)}")
            else:
                # For other models, use agenerate
                await model.agenerate([messages], callbacks=[callback_handler])
            
            # Calculate latency
            latency_ms = (time.time() - start_time) * 1000
            
            # Get the summary content
            summary_content = callback_handler.content
            
            # Translate if requested
            if translate_summary and target_language != "en":
                try:
                    translation_result = language_service.translate_text(
                        summary_content, 
                        target_language, 
                        "en"
                    )
                    if translation_result.get('error'):
                        # If translation fails, use original summary
                        summary_content = f"{summary_content}\n\n[Translation failed: {translation_result['error']}]"
                    else:
                        summary_content = translation_result['translated_text']
                except Exception as e:
                    # If translation fails, use original summary
                    summary_content = f"{summary_content}\n\n[Translation failed: {str(e)}]"
            
            # Yield final chunk with complete information
            yield StreamChunk(
                content=summary_content,
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