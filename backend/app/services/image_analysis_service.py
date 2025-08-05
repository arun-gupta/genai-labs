import base64
import io
import time
from typing import Dict, List, Optional, Any
from PIL import Image
import logging
from langchain.schema import HumanMessage, SystemMessage
from langchain.callbacks import StreamingStdOutCallbackHandler

from app.services.model_factory import ModelFactory
from app.core.config import settings

logger = logging.getLogger(__name__)


class ImageAnalysisService:
    """Service for analyzing images using vision-capable models."""
    
    def __init__(self):
        self.model_factory = ModelFactory()
        
    def _encode_image_to_base64(self, image_bytes: bytes) -> str:
        """Convert image bytes to base64 string."""
        return base64.b64encode(image_bytes).decode('utf-8')
    
    def _validate_image(self, image_bytes: bytes) -> bool:
        """Validate image format and size."""
        try:
            logger.info(f"Validating image: size={len(image_bytes)} bytes")
            image = Image.open(io.BytesIO(image_bytes))
            logger.info(f"Image opened successfully: format={image.format}, size={image.size}, mode={image.mode}")
            
            # Check if image is too large (max 20MB)
            if len(image_bytes) > 20 * 1024 * 1024:
                logger.error(f"Image too large: {len(image_bytes)} bytes")
                return False
                
            # Check dimensions (max 4096x4096)
            if image.width > 4096 or image.height > 4096:
                logger.error(f"Image dimensions too large: {image.width}x{image.height}")
                return False
                
            # Check if image is too small
            if image.width < 10 or image.height < 10:
                logger.error(f"Image dimensions too small: {image.width}x{image.height}")
                return False
                
            logger.info("Image validation passed")
            return True
        except Exception as e:
            logger.error(f"Image validation failed: {e}")
            return False
    
    def _prepare_image_message(self, image_bytes: bytes, prompt: str) -> List:
        """Prepare message with image for vision models."""
        base64_image = self._encode_image_to_base64(image_bytes)
        
        # Different models expect different image formats
        image_message = {
            "type": "image_url",
            "image_url": {
                "url": f"data:image/jpeg;base64,{base64_image}"
            }
        }
        
        return [
            HumanMessage(content=[
                {"type": "text", "text": prompt},
                image_message
            ])
        ]
    
    async def analyze_image(
        self,
        image_bytes: bytes,
        analysis_type: str,
        model_provider: str,
        model_name: Optional[str] = None,
        custom_prompt: Optional[str] = None,
        temperature: float = 0.3
    ) -> Dict[str, Any]:
        """Analyze image content based on analysis type."""
        start_time = time.time()
        
        try:
            # Validate image
            if not self._validate_image(image_bytes):
                raise ValueError("Invalid image format or size")
            
            # Get appropriate prompt based on analysis type
            if custom_prompt:
                prompt = custom_prompt
            else:
                prompt = self._get_analysis_prompt(analysis_type)
            
            # Get vision model
            model = self.model_factory.get_model(
                provider=model_provider,
                model_name=model_name,
                temperature=temperature,
                vision_capable=True
            )
            
            # Prepare messages
            messages = self._prepare_image_message(image_bytes, prompt)
            
            # Generate analysis
            response = await model.agenerate([messages])
            analysis_text = response.generations[0][0].text
            
            # Process results based on analysis type
            processed_results = self._process_analysis_results(
                analysis_type, analysis_text
            )
            
            latency_ms = (time.time() - start_time) * 1000
            
            return {
                "analysis_type": analysis_type,
                "analysis": processed_results,
                "raw_response": analysis_text,
                "model_provider": model_provider,
                "model_name": model_name or "default",
                "latency_ms": latency_ms,
                "timestamp": time.time()
            }
            
        except Exception as e:
            logger.error(f"Image analysis failed: {e}")
            raise
    
    def _get_analysis_prompt(self, analysis_type: str) -> str:
        """Get appropriate prompt for different analysis types."""
        prompts = {
            "describe": "Please describe this image in detail. Include what you see, the objects, people, actions, setting, colors, and any text visible in the image.",
            "extract": "Please extract and list all text content visible in this image. If there are tables, charts, or structured data, please format it clearly.",
            "analyze": "Please provide a comprehensive analysis of this image. Include: 1) Main objects and subjects, 2) Actions or activities, 3) Setting and context, 4) Colors and visual elements, 5) Any text or symbols, 6) Overall mood or atmosphere.",
            "compare": "Please analyze this image and provide insights about its content, style, and characteristics that could be useful for comparison with other images."
        }
        return prompts.get(analysis_type, prompts["describe"])
    
    def _process_analysis_results(self, analysis_type: str, raw_text: str) -> Dict[str, Any]:
        """Process raw analysis text into structured results."""
        if analysis_type == "extract":
            # For text extraction, try to identify structured data
            lines = raw_text.strip().split('\n')
            extracted_text = []
            tables = []
            current_table = []
            
            for line in lines:
                if line.strip():
                    if '|' in line or '\t' in line:
                        # Likely table data
                        current_table.append(line.strip())
                    else:
                        if current_table:
                            tables.append(current_table)
                            current_table = []
                        extracted_text.append(line.strip())
            
            if current_table:
                tables.append(current_table)
            
            return {
                "extracted_text": extracted_text,
                "tables": tables,
                "total_text_elements": len(extracted_text)
            }
        
        elif analysis_type == "analyze":
            # For comprehensive analysis, try to structure the response
            sections = raw_text.split('\n\n')
            structured_analysis = {
                "objects": [],
                "actions": [],
                "setting": "",
                "colors": [],
                "text_content": [],
                "mood": "",
                "overall_description": ""
            }
            
            # Simple parsing - in a real implementation, you might use more sophisticated NLP
            for section in sections:
                if "object" in section.lower() or "subject" in section.lower():
                    structured_analysis["objects"].append(section.strip())
                elif "action" in section.lower() or "activity" in section.lower():
                    structured_analysis["actions"].append(section.strip())
                elif "setting" in section.lower() or "context" in section.lower():
                    structured_analysis["setting"] = section.strip()
                elif "color" in section.lower():
                    structured_analysis["colors"].append(section.strip())
                elif "text" in section.lower() or "symbol" in section.lower():
                    structured_analysis["text_content"].append(section.strip())
                elif "mood" in section.lower() or "atmosphere" in section.lower():
                    structured_analysis["mood"] = section.strip()
                else:
                    structured_analysis["overall_description"] += section.strip() + " "
            
            return structured_analysis
        
        else:
            # For describe and compare, return as-is
            return {
                "description": raw_text.strip(),
                "word_count": len(raw_text.split()),
                "sentence_count": len(raw_text.split('.'))
            }
    
    async def compare_images(
        self,
        images: List[bytes],
        comparison_type: str,
        model_provider: str,
        model_name: Optional[str] = None,
        temperature: float = 0.3
    ) -> Dict[str, Any]:
        """Compare multiple images."""
        if len(images) < 2:
            raise ValueError("At least 2 images required for comparison")
        
        start_time = time.time()
        
        try:
            # Validate all images
            for i, img_bytes in enumerate(images):
                if not self._validate_image(img_bytes):
                    raise ValueError(f"Invalid image format or size for image {i+1}")
            
            # Get comparison prompt
            prompt = self._get_comparison_prompt(comparison_type, len(images))
            
            # Get vision model
            model = self.model_factory.get_model(
                provider=model_provider,
                model_name=model_name,
                temperature=temperature,
                vision_capable=True
            )
            
            # Prepare messages with multiple images
            image_messages = []
            for img_bytes in images:
                base64_image = self._encode_image_to_base64(img_bytes)
                image_messages.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{base64_image}"
                    }
                })
            
            messages = [
                HumanMessage(content=[
                    {"type": "text", "text": prompt},
                    *image_messages
                ])
            ]
            
            # Generate comparison
            response = await model.agenerate([messages])
            comparison_text = response.generations[0][0].text
            
            latency_ms = (time.time() - start_time) * 1000
            
            return {
                "comparison_type": comparison_type,
                "comparison": comparison_text,
                "model_provider": model_provider,
                "model_name": model_name or "default",
                "latency_ms": latency_ms,
                "image_count": len(images),
                "timestamp": time.time()
            }
            
        except Exception as e:
            logger.error(f"Image comparison failed: {e}")
            raise
    
    def _get_comparison_prompt(self, comparison_type: str, image_count: int) -> str:
        """Get appropriate prompt for image comparison."""
        prompts = {
            "similarity": f"Please compare these {image_count} images and identify their similarities and differences. Focus on content, style, composition, and visual elements.",
            "style": f"Please analyze the artistic style of these {image_count} images. Compare their visual style, techniques, color palettes, and artistic approaches.",
            "content": f"Please compare the content and subject matter of these {image_count} images. What do they show, and how do they relate to each other?",
            "quality": f"Please assess and compare the quality of these {image_count} images. Consider factors like clarity, composition, lighting, and overall visual appeal."
        }
        return prompts.get(comparison_type, prompts["similarity"])


# Global instance
image_analysis_service = ImageAnalysisService() 