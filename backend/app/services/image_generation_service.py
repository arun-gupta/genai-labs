import base64
import io
import os
import time
import uuid
from typing import Dict, List, Optional, Any, AsyncGenerator
from PIL import Image
import logging
import aiohttp
import json

from app.core.config import settings
from app.services.integrated_diffusion_service import integrated_diffusion_service

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
            elif model_provider == "stable_diffusion":
                return await self._generate_stable_diffusion_image(
                    prompt, model_name, size, quality, style, num_images
                )
            elif model_provider == "integrated_diffusion":
                return await self._generate_integrated_diffusion_image(
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
        """Generate image using local Stable Diffusion via WebUI API."""
        try:
            # Try Stable Diffusion WebUI API (AUTOMATIC1111)
            return await self._generate_stable_diffusion_image(
                prompt, model_name, size, quality, style, num_images
            )
        except Exception as e:
            # Try OllamaDiffuser API as fallback
            try:
                return await self._generate_ollamadiffuser_image(
                    prompt, model_name, size, quality, style, num_images
                )
            except Exception as e2:
                raise Exception(f"Local image generation failed. Please ensure Stable Diffusion WebUI or OllamaDiffuser is running. WebUI error: {str(e)}, OllamaDiffuser error: {str(e2)}")

    async def _generate_stable_diffusion_image(
        self,
        prompt: str,
        model_name: Optional[str],
        size: str,
        quality: str,
        style: Optional[str],
        num_images: int
    ) -> Dict[str, Any]:
        """Generate image using Stable Diffusion WebUI API (AUTOMATIC1111)."""
        
        # Parse size
        width, height = self._parse_image_size(size, default="512x512")
        
        # Build enhanced prompt with style
        enhanced_prompt = prompt
        if style and style != "Default Style":
            style_prompts = {
                "Photorealistic": "photorealistic, high quality, detailed",
                "Oil Painting": "oil painting, artistic, classical art style",
                "Watercolor": "watercolor painting, soft, flowing",
                "Digital Art": "digital art, concept art, artstation",
                "Anime Style": "anime style, manga, cel shading",
                "Cartoon": "cartoon style, animated, colorful",
                "Pencil Sketch": "pencil sketch, hand drawn, monochrome",
                "Pop Art": "pop art style, bold colors, retro",
                "Impressionist": "impressionist painting, loose brushstrokes",
                "Surreal": "surreal art, dreamlike, fantasy",
                "Minimalist": "minimalist, clean, simple composition",
                "Cyberpunk": "cyberpunk style, neon, futuristic",
                "Vintage": "vintage style, retro, aged",
                "Abstract": "abstract art, non-representational"
            }
            if style in style_prompts:
                enhanced_prompt = f"{prompt}, {style_prompts[style]}"
        
        # Prepare API payload
        payload = {
            "prompt": enhanced_prompt,
            "negative_prompt": "blurry, low quality, distorted, deformed, ugly, bad anatomy",
            "width": width,
            "height": height,
            "steps": 20,
            "cfg_scale": 7,
            "sampler_name": "Euler a",
            "batch_size": num_images,
            "n_iter": 1,
            "restore_faces": True,
            "seed": -1
        }
        
        # Add quality settings
        if quality == "hd":
            payload.update({
                "steps": 30,
                "cfg_scale": 8,
                "sampler_name": "DPM++ 2M Karras"
            })
        
        # Call Stable Diffusion WebUI API
        webui_url = "http://localhost:7860"  # Default WebUI port
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    f"{webui_url}/sdapi/v1/txt2img",
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=300)  # 5 minute timeout
                ) as response:
                    if response.status != 200:
                        raise Exception(f"Stable Diffusion WebUI API error: {response.status}")
                    
                    result = await response.json()
                    
                    if "images" not in result or not result["images"]:
                        raise Exception("No images returned from Stable Diffusion WebUI")
                    
                    # Convert base64 images to URLs
                    images = []
                    for i, base64_image in enumerate(result["images"]):
                        # Save base64 image to temp file
                        image_data = base64.b64decode(base64_image)
                        temp_filename = f"sd_generated_{int(time.time())}_{i}.png"
                        temp_path = os.path.join("temp_uploads", temp_filename)
                        
                        os.makedirs("temp_uploads", exist_ok=True)
                        with open(temp_path, "wb") as f:
                            f.write(image_data)
                        
                        # Create URL for the image
                        image_url = f"/temp_uploads/{temp_filename}"
                        images.append({
                            "url": image_url,
                            "width": width,
                            "height": height
                        })
                    
                    return {
                        "model_provider": "stable_diffusion",
                        "model_name": model_name or "stable-diffusion-1.5",
                        "prompt": prompt,
                        "images": images,
                        "generation_id": str(uuid.uuid4()),
                        "timestamp": time.time()
                    }
                    
            except aiohttp.ClientError as e:
                raise Exception(f"Failed to connect to Stable Diffusion WebUI at {webui_url}: {str(e)}")

    async def _generate_ollamadiffuser_image(
        self,
        prompt: str,
        model_name: Optional[str],
        size: str,
        quality: str,
        style: Optional[str],
        num_images: int
    ) -> Dict[str, Any]:
        """Generate image using OllamaDiffuser API."""
        
        # Parse size
        width, height = self._parse_image_size(size, default="512x512")
        
        # Build enhanced prompt with style
        enhanced_prompt = prompt
        if style and style != "Default Style":
            enhanced_prompt = f"{prompt}, {style.lower().replace(' ', ' ')}"
        
        # Prepare API payload
        payload = {
            "prompt": enhanced_prompt,
            "width": width,
            "height": height,
            "num_images": num_images,
            "model": model_name or "flux.1-schnell"
        }
        
        # Call OllamaDiffuser API
        diffuser_url = "http://localhost:8000"  # Default OllamaDiffuser port
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    f"{diffuser_url}/api/generate",
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=300)  # 5 minute timeout
                ) as response:
                    if response.status != 200:
                        raise Exception(f"OllamaDiffuser API error: {response.status}")
                    
                    # OllamaDiffuser returns images directly
                    image_data = await response.read()
                    
                    # Save image to temp file
                    temp_filename = f"od_generated_{int(time.time())}.png"
                    temp_path = os.path.join("temp_uploads", temp_filename)
                    
                    os.makedirs("temp_uploads", exist_ok=True)
                    with open(temp_path, "wb") as f:
                        f.write(image_data)
                    
                    # Create URL for the image
                    image_url = f"/temp_uploads/{temp_filename}"
                    
                    return {
                        "model_provider": "ollamadiffuser",
                        "model_name": model_name or "flux.1-schnell",
                        "prompt": prompt,
                        "images": [{
                            "url": image_url,
                            "width": width,
                            "height": height
                        }],
                        "generation_id": str(uuid.uuid4()),
                        "timestamp": time.time()
                    }
                    
            except aiohttp.ClientError as e:
                raise Exception(f"Failed to connect to OllamaDiffuser at {diffuser_url}: {str(e)}")

    async def _generate_integrated_diffusion_image(
        self,
        prompt: str,
        model_name: Optional[str],
        size: str,
        quality: str,
        style: Optional[str],
        num_images: int
    ) -> Dict[str, Any]:
        """Generate image using integrated diffusion service (diffusion-lab approach)."""
        
        # Parse size
        width, height = self._parse_image_size(size, default="1024x1024")
        
        # Map quality to inference steps
        num_inference_steps = 30 if quality == "hd" else 20
        
        # Use integrated diffusion service
        try:
            result = await integrated_diffusion_service.generate_text_to_image(
                prompt=prompt,
                style=style or "",
                width=width,
                height=height,
                num_images=num_images,
                num_inference_steps=num_inference_steps,
                model_name=model_name or "stabilityai/stable-diffusion-xl-base-1.0"
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Integrated diffusion generation failed: {e}")
            raise Exception(f"Integrated diffusion generation failed: {str(e)}")

    def _parse_image_size(self, size: str, default: str = "512x512") -> tuple[int, int]:
        """Parse image size string into width and height."""
        try:
            if 'x' in size:
                width, height = map(int, size.split('x'))
            else:
                # Handle single number (square)
                dimension = int(size)
                width, height = dimension, dimension
            return width, height
        except (ValueError, AttributeError):
            # Fallback to default
            width, height = map(int, default.split('x'))
            return width, height
    
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