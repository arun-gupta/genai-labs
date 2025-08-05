import asyncio
import aiohttp
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

class ModelAvailabilityService:
    """Service for managing model availability and information."""
    
    def __init__(self):
        self.ollama_base_url = "http://localhost:11434"
        self.available_models_cache = None
        self.cache_timestamp = 0
        self.cache_duration = 30  # Cache for 30 seconds
        
    async def get_running_models(self) -> List[str]:
        """Get list of currently running models from Ollama."""
        try:
            async with aiohttp.ClientSession() as session:
                # First check which models are actually running
                async with session.get(f"{self.ollama_base_url}/api/ps") as response:
                    if response.status == 200:
                        data = await response.json()
                        running_models = [model['name'] for model in data.get('models', [])]
                        logger.info(f"Running models: {running_models}")
                        return running_models
                    else:
                        logger.warning(f"Failed to fetch running models from Ollama: {response.status}")
                        return []
        except Exception as e:
            logger.error(f"Error fetching available models: {e}")
            return []

    async def get_available_models(self) -> List[str]:
        """Backward compatibility method - returns running models."""
        return await self.get_running_models()
    
    def get_open_source_models(self) -> List[Dict]:
        """Get comprehensive list of open-source models with metadata."""
        return [
            {
                "name": "qwen3:8b",
                "display_name": "Qwen 3 (8B)",
                "description": "Alibaba's 8B parameter model with strong reasoning and multilingual capabilities",
                "parameters": "8B",
                "organization": "Alibaba",
                "license": "Apache 2.0",
                "download_command": "ollama pull qwen3:8b",
                "category": "High Performance",
                "tags": ["reasoning", "multilingual", "alibaba", "high-performance"]
            },
            {
                "name": "qwen2.5:3b",
                "display_name": "Qwen 2.5 (3B)",
                "description": "Alibaba's efficient 3B parameter model with strong reasoning capabilities",
                "parameters": "3B",
                "organization": "Alibaba",
                "license": "Apache 2.0",
                "download_command": "ollama pull qwen2.5:3b",
                "category": "Reasoning & Analysis",
                "tags": ["reasoning", "efficient", "multilingual"]
            },
            {
                "name": "phi3:3.8b",
                "display_name": "Phi-3 (3.8B)",
                "description": "Microsoft's compact model with excellent performance on reasoning tasks",
                "parameters": "3.8B",
                "organization": "Microsoft",
                "license": "MIT",
                "download_command": "ollama pull phi3:3.8b",
                "category": "Reasoning & Analysis",
                "tags": ["reasoning", "compact", "microsoft"]
            },
            {
                "name": "deepseek-coder:3b",
                "display_name": "DeepSeek Coder (3B)",
                "description": "Specialized coding model with strong programming capabilities",
                "parameters": "3B",
                "organization": "DeepSeek",
                "license": "Apache 2.0",
                "download_command": "ollama pull deepseek-coder:3b",
                "category": "Coding & Development",
                "tags": ["coding", "programming", "specialized"]
            },
            {
                "name": "llama3.1:3b",
                "display_name": "Llama 3.1 (3B)",
                "description": "Meta's latest compact model with improved performance",
                "parameters": "3B",
                "organization": "Meta",
                "license": "Meta License",
                "download_command": "ollama pull llama3.1:3b",
                "category": "General Purpose",
                "tags": ["general", "meta", "latest"]
            },
            {
                "name": "grok:3b",
                "display_name": "Grok (3B)",
                "description": "xAI's compact model with conversational abilities",
                "parameters": "3B",
                "organization": "xAI",
                "license": "Apache 2.0",
                "download_command": "ollama pull grok:3b",
                "category": "Conversational",
                "tags": ["conversational", "xai", "chat"]
            },
            {
                "name": "bloom:3b",
                "display_name": "BLOOM (3B)",
                "description": "Multilingual model with support for 46+ languages",
                "parameters": "3B",
                "organization": "BigScience",
                "license": "Responsible AI License",
                "download_command": "ollama pull bloom:3b",
                "category": "Multilingual",
                "tags": ["multilingual", "46+ languages", "bloom"]
            },
            {
                "name": "gemma2:3b",
                "display_name": "Gemma 2 (3B)",
                "description": "Google's lightweight model optimized for efficiency",
                "parameters": "3B",
                "organization": "Google",
                "license": "Gemma License",
                "download_command": "ollama pull gemma2:3b",
                "category": "Efficient",
                "tags": ["efficient", "google", "lightweight"]
            },
            {
                "name": "mistral:7b",
                "display_name": "Mistral (7B)",
                "description": "High-performance 7B model with excellent reasoning",
                "parameters": "7B",
                "organization": "Mistral AI",
                "license": "Apache 2.0",
                "download_command": "ollama pull mistral:7b",
                "category": "High Performance",
                "tags": ["reasoning", "high-performance", "mistral"]
            },
            {
                "name": "codellama:3b",
                "display_name": "Code Llama (3B)",
                "description": "Specialized coding model with code generation capabilities",
                "parameters": "3B",
                "organization": "Meta",
                "license": "Meta License",
                "download_command": "ollama pull codellama:3b",
                "category": "Coding & Development",
                "tags": ["coding", "meta", "code-generation"]
            },
            {
                "name": "neural-chat:3b",
                "display_name": "Neural Chat (3B)",
                "description": "Intel's conversational model optimized for dialogue",
                "parameters": "3B",
                "organization": "Intel",
                "license": "Apache 2.0",
                "download_command": "ollama pull neural-chat:3b",
                "category": "Conversational",
                "tags": ["conversational", "intel", "dialogue"]
            },
            {
                "name": "orca-mini:3b",
                "display_name": "Orca Mini (3B)",
                "description": "Microsoft's compact model trained on high-quality data",
                "parameters": "3B",
                "organization": "Microsoft",
                "license": "MIT",
                "download_command": "ollama pull orca-mini:3b",
                "category": "General Purpose",
                "tags": ["general", "microsoft", "high-quality"]
            },
            {
                "name": "llama2:3b",
                "display_name": "Llama 2 (3B)",
                "description": "Meta's foundational 3B model with broad capabilities",
                "parameters": "3B",
                "organization": "Meta",
                "license": "Meta License",
                "download_command": "ollama pull llama2:3b",
                "category": "General Purpose",
                "tags": ["general", "meta", "foundational"]
            },
            {
                "name": "gpt-oss:20b",
                "display_name": "GPT-OSS-20B",
                "description": "OpenAI's open-weight model with powerful reasoning and agentic capabilities",
                "parameters": "20B",
                "organization": "OpenAI",
                "license": "Apache 2.0",
                "download_command": "ollama pull gpt-oss:20b",
                "category": "Reasoning & Analysis",
                "tags": ["reasoning", "agentic", "openai", "open-weight", "function-calling", "advanced-reasoning"]
            }
        ]
    
    async def get_installed_models(self) -> List[str]:
        """Get list of installed models from Ollama."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.ollama_base_url}/api/tags") as response:
                    if response.status == 200:
                        data = await response.json()
                        installed_models = [model['name'] for model in data.get('models', [])]
                        logger.info(f"Installed models: {installed_models}")
                        return installed_models
                    else:
                        logger.warning(f"Failed to fetch installed models from Ollama: {response.status}")
                        return []
        except Exception as e:
            logger.error(f"Error fetching installed models: {e}")
            return []

    async def get_models_with_availability(self) -> Dict:
        """Get models with their availability status."""
        # Get currently running models
        running_models = await self.get_running_models()
        
        # Get installed models
        installed_models = await self.get_installed_models()
        
        # Get all open-source models
        all_models = self.get_open_source_models()
        
        # Mark availability status
        for model in all_models:
            if model["name"] in running_models:
                model["is_available"] = True
                model["status"] = "Available"
            elif model["name"] in installed_models:
                model["is_available"] = False
                model["status"] = "Installed (Not Running)"
            else:
                model["is_available"] = False
                model["status"] = "Download Required"
        
        # Sort models alphabetically by display_name
        all_models.sort(key=lambda x: x["display_name"])
        
        return {
            "models": all_models,
            "available_count": len(running_models),
            "total_count": len(all_models),
            "categories": sorted(list(set(model["category"] for model in all_models))),
            "organizations": sorted(list(set(model["organization"] for model in all_models)))
        }

# Global instance
model_availability_service = ModelAvailabilityService() 