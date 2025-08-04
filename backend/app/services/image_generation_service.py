import base64
import io
import time
import uuid
from typing import Dict, List, Optional, Any, AsyncGenerator
from PIL import Image
import logging
import aiohttp
import json

from app.core.config import settings

logger = logging.getLogger(__name__)


class ImageGenerationService:
    """Service for generating images using various AI models."""
    
    def __init__(self):
        self.openai_api_key = settings.openai_api_key
        self.stability_api_key = getattr(settings, 'stability_api_key', None)
        
    async def generate_image(
        self,
        prompt: str,
        model_provider: str,
        model_name: Optional[str] = None,
        size: str = "1024x1024",
        quality: str = "standard",
        style: Optional[str] = None,
        num_images: int = 1,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """Generate images from text prompt."""
        start_time = time.time()
        
        try:
            if model_provider == "openai":
                return await self._generate_openai_image(
                    prompt, model_name, size, quality, style, num_images
                )
            elif model_provider == "stability":
                return await self._generate_stability_image(
                    prompt, model_name, size, quality, style, num_images
                )
            elif model_provider == "ollama":
                return await self._generate_ollama_image(
                    prompt, model_name, size, quality, style, num_images
                )
            else:
                raise ValueError(f"Unsupported model provider: {model_provider}")
                
        except Exception as e:
            logger.error(f"Image generation failed: {e}")
            raise
    
    async def _generate_openai_image(
        self,
        prompt: str,
        model_name: Optional[str],
        size: str,
        quality: str,
        style: Optional[str],
        num_images: int
    ) -> Dict[str, Any]:
        """Generate image using OpenAI DALL-E."""
        if not self.openai_api_key:
            raise ValueError("OpenAI API key not configured")
        
        # Use DALL-E 3 by default
        model = model_name or "dall-e-3"
        
        # Prepare the prompt with style if specified
        final_prompt = prompt
        if style:
            final_prompt = f"{prompt}, {style} style"
        
        # Validate size for DALL-E 3
        valid_sizes = ["1024x1024", "1792x1024", "1024x1792"]
        if size not in valid_sizes:
            size = "1024x1024"
        
        # DALL-E 3 only supports 1 image at a time
        if num_images > 1:
            num_images = 1
            logger.warning("DALL-E 3 only supports 1 image at a time")
        
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Bearer {self.openai_api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": model,
                "prompt": final_prompt,
                "size": size,
                "quality": quality,
                "n": num_images
            }
            
            async with session.post(
                "https://api.openai.com/v1/images/generations",
                headers=headers,
                json=data
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"OpenAI API error: {error_text}")
                
                result = await response.json()
                
                # Process the response
                images = []
                for image_data in result.get("data", []):
                    image_url = image_data.get("url")
                    if image_url:
                        # Download the image and convert to base64
                        image_bytes = await self._download_image(session, image_url)
                        images.append({
                            "url": image_url,
                            "base64": base64.b64encode(image_bytes).decode('utf-8'),
                            "size": size
                        })
                
                return {
                    "provider": "openai",
                    "model": model,
                    "prompt": final_prompt,
                    "images": images,
                    "generation_id": result.get("created"),
                    "timestamp": time.time()
                }
    
    async def _generate_stability_image(
        self,
        prompt: str,
        model_name: Optional[str],
        size: str,
        quality: str,
        style: Optional[str],
        num_images: int
    ) -> Dict[str, Any]:
        """Generate image using Stability AI."""
        if not self.stability_api_key:
            raise ValueError("Stability API key not configured")
        
        # Use SDXL by default
        model = model_name or "sdxl"
        
        # Prepare the prompt with style if specified
        final_prompt = prompt
        if style:
            final_prompt = f"{prompt}, {style} style"
        
        # Parse size
        width, height = map(int, size.split('x'))
        
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Bearer {self.stability_api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "text_prompts": [
                    {
                        "text": final_prompt,
                        "weight": 1.0
                    }
                ],
                "cfg_scale": 7,
                "height": height,
                "width": width,
                "samples": num_images,
                "steps": 30
            }
            
            async with session.post(
                "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
                headers=headers,
                json=data
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Stability API error: {error_text}")
                
                result = await response.json()
                
                # Process the response
                images = []
                for artifact in result.get("artifacts", []):
                    if artifact.get("type") == "IMAGE":
                        image_bytes = base64.b64decode(artifact.get("base64"))
                        images.append({
                            "base64": artifact.get("base64"),
                            "size": size,
                            "seed": artifact.get("seed")
                        })
                
                return {
                    "provider": "stability",
                    "model": model,
                    "prompt": final_prompt,
                    "images": images,
                    "generation_id": str(uuid.uuid4()),
                    "timestamp": time.time()
                }
    
    async def _generate_ollama_image(
        self,
        prompt: str,
        model_name: Optional[str],
        size: str,
        quality: str,
        style: Optional[str],
        num_images: int
    ) -> Dict[str, Any]:
        """Generate image using Ollama (if available)."""
        # Note: This is a placeholder for future Ollama image generation support
        # Currently, Ollama doesn't have robust image generation capabilities
        raise NotImplementedError("Ollama image generation not yet implemented")
    
    async def _download_image(self, session: aiohttp.ClientSession, url: str) -> bytes:
        """Download image from URL."""
        async with session.get(url) as response:
            if response.status != 200:
                raise Exception(f"Failed to download image: {response.status}")
            return await response.read()
    
    async def generate_image_variations(
        self,
        image_bytes: bytes,
        model_provider: str,
        model_name: Optional[str] = None,
        size: str = "1024x1024",
        num_variations: int = 1
    ) -> Dict[str, Any]:
        """Generate variations of an existing image."""
        if model_provider == "openai":
            return await self._generate_openai_variations(
                image_bytes, model_name, size, num_variations
            )
        else:
            raise ValueError(f"Variations not supported for provider: {model_provider}")
    
    async def _generate_openai_variations(
        self,
        image_bytes: bytes,
        model_name: Optional[str],
        size: str,
        num_variations: int
    ) -> Dict[str, Any]:
        """Generate variations using OpenAI."""
        if not self.openai_api_key:
            raise ValueError("OpenAI API key not configured")
        
        # Use DALL-E 2 for variations (DALL-E 3 doesn't support variations yet)
        model = model_name or "dall-e-2"
        
        # Validate size for DALL-E 2
        valid_sizes = ["256x256", "512x512", "1024x1024"]
        if size not in valid_sizes:
            size = "1024x1024"
        
        # Prepare image for upload
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Bearer {self.openai_api_key}"
            }
            
            # Create form data
            data = aiohttp.FormData()
            data.add_field('image', image_bytes, filename='image.png', content_type='image/png')
            data.add_field('n', str(num_variations))
            data.add_field('size', size)
            
            async with session.post(
                "https://api.openai.com/v1/images/variations",
                headers=headers,
                data=data
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"OpenAI API error: {error_text}")
                
                result = await response.json()
                
                # Process the response
                images = []
                for image_data in result.get("data", []):
                    image_url = image_data.get("url")
                    if image_url:
                        # Download the image and convert to base64
                        image_bytes = await self._download_image(session, image_url)
                        images.append({
                            "url": image_url,
                            "base64": base64.b64encode(image_bytes).decode('utf-8'),
                            "size": size
                        })
                
                return {
                    "provider": "openai",
                    "model": model,
                    "operation": "variations",
                    "images": images,
                    "generation_id": result.get("created"),
                    "timestamp": time.time()
                }
    
    async def edit_image(
        self,
        image_bytes: bytes,
        mask_bytes: Optional[bytes],
        prompt: str,
        model_provider: str,
        model_name: Optional[str] = None,
        size: str = "1024x1024"
    ) -> Dict[str, Any]:
        """Edit an existing image using inpainting/outpainting."""
        if model_provider == "openai":
            return await self._edit_openai_image(
                image_bytes, mask_bytes, prompt, model_name, size
            )
        else:
            raise ValueError(f"Image editing not supported for provider: {model_provider}")
    
    async def _edit_openai_image(
        self,
        image_bytes: bytes,
        mask_bytes: Optional[bytes],
        prompt: str,
        model_name: Optional[str],
        size: str
    ) -> Dict[str, Any]:
        """Edit image using OpenAI."""
        if not self.openai_api_key:
            raise ValueError("OpenAI API key not configured")
        
        # Use DALL-E 2 for editing
        model = model_name or "dall-e-2"
        
        # Validate size
        valid_sizes = ["256x256", "512x512", "1024x1024"]
        if size not in valid_sizes:
            size = "1024x1024"
        
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Bearer {self.openai_api_key}"
            }
            
            # Create form data
            data = aiohttp.FormData()
            data.add_field('image', image_bytes, filename='image.png', content_type='image/png')
            if mask_bytes:
                data.add_field('mask', mask_bytes, filename='mask.png', content_type='image/png')
            data.add_field('prompt', prompt)
            data.add_field('n', '1')
            data.add_field('size', size)
            
            endpoint = "https://api.openai.com/v1/images/edits" if mask_bytes else "https://api.openai.com/v1/images/generations"
            
            async with session.post(endpoint, headers=headers, data=data) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"OpenAI API error: {error_text}")
                
                result = await response.json()
                
                # Process the response
                images = []
                for image_data in result.get("data", []):
                    image_url = image_data.get("url")
                    if image_url:
                        # Download the image and convert to base64
                        image_bytes = await self._download_image(session, image_url)
                        images.append({
                            "url": image_url,
                            "base64": base64.b64encode(image_bytes).decode('utf-8'),
                            "size": size
                        })
                
                return {
                    "provider": "openai",
                    "model": model,
                    "operation": "edit",
                    "prompt": prompt,
                    "images": images,
                    "generation_id": result.get("created"),
                    "timestamp": time.time()
                }


# Global instance
image_generation_service = ImageGenerationService() 