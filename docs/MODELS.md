# Models Guide

## 🤖 Supported Models

### Open Source Models (via Ollama)

The application includes a comprehensive **Models Explorer** page that showcases 20+ open-source language models:

#### Available Models:

- **Qwen 2.5 (3B)** - Alibaba's efficient reasoning model
- **Phi-3 (3.8B)** - Microsoft's compact reasoning model  
- **DeepSeek Coder (3B)** - Specialized coding model
- **Llama 3.1 (3B)** - Meta's latest compact model
- **Grok (3B)** - xAI's conversational model
- **BLOOM (3B)** - Multilingual model (46+ languages)
- **Gemma 2 (3B)** - Google's lightweight model
- **Mistral (7B)** - High-performance reasoning model
- **Code Llama (3B)** - Meta's coding specialist
- **Neural Chat (3B)** - Intel's conversational model
- **Orca Mini (3B)** - Microsoft's high-quality model
- **Llama 2 (3B)** - Meta's foundational model
- **GPT-OSS-20B** - OpenAI's open-weight model with advanced reasoning

#### Model Features:

- **Availability Status**: Shows which models are installed vs. need downloading
- **One-Click Copy**: Copy download commands with a single click
- **Advanced Filtering**: Filter by category, organization, and availability
- **Search**: Search across model names, descriptions, and tags
- **Visual Indicators**: Color-coded organization badges and status icons

## 🚀 Cloud Models

### OpenAI Models
- **GPT-5** - Latest and most advanced reasoning and analysis
- **GPT-4** - Advanced reasoning and analysis
- **GPT-3.5 Turbo** - Fast and cost-effective generation
- **GPT-4 Turbo** - Enhanced performance with larger context
- **GPT-4 Vision** - Multi-modal vision capabilities

### Anthropic Models
- **Claude Sonnet 4** - Latest flagship model with hybrid reasoning and 200K context
- **Claude Opus 4** - Most powerful model with advanced autonomy and vision capabilities
- **Claude 3.5 Sonnet** - Enhanced reasoning with excellent coding abilities
- **Claude 3.5 Haiku** - Fastest model for simple tasks with improved efficiency
- **Claude 3 Opus** - High-quality model for complex analysis

## 📊 Model Comparison

### Performance Characteristics

| Model | Size | Speed | Quality | Use Case |
|-------|------|-------|---------|----------|
| **Claude Opus 4** | Very Large | Medium | Exceptional | Most advanced reasoning and autonomy |
| **Claude Sonnet 4** | Large | Fast | Very High | Latest reasoning with hybrid thinking |
| **GPT-5** | Large | Medium | Very High | Latest reasoning and analysis |
| **GPT-4** | Large | Medium | High | Complex reasoning |
| **Claude 3.5 Sonnet** | Large | Fast | High | Enhanced coding and analysis |
| **Claude 3.5 Haiku** | Medium | Very Fast | Good | Fast responses and simple tasks |
| **GPT-OSS-20B** | Large | Medium | Very High | Advanced reasoning and agentic capabilities |
| **Mistral 7B** | Medium | Fast | Good | General purpose |
| **Llama 3.1** | Small | Very Fast | Good | Quick responses |
| **Code Llama** | Medium | Fast | Good | Programming |

### Resource Requirements

| Model | RAM | Storage | GPU | Best For |
|-------|-----|---------|-----|----------|
| **3B Models** | 4GB | 2GB | Optional | Development |
| **7B Models** | 8GB | 4GB | Recommended | Production |
| **20B Models** | 16GB | 8GB | Recommended | Advanced reasoning |
| **Cloud Models** | N/A | N/A | N/A | All users |

## 🔧 Model Installation

### Installing Ollama Models

1. **Navigate to Models Explorer** (`/models`)
2. **Find your desired model**
3. **Click "Copy Command"**
4. **Run the command in terminal**:
   ```bash
ollama pull llama3.2:3b
```

### Popular Model Commands

```bash
# General purpose models
ollama pull llama3.2:3b
ollama pull llama3.1:3b
ollama pull gemma2:3b

# Specialized models
ollama pull codellama:3b
ollama pull deepseek-coder:3b
ollama pull neural-chat:3b

# Multilingual models
ollama pull bloom:3b
ollama pull qwen2.5:3b

# Advanced reasoning
ollama pull gpt-oss-20b
```

## 🎯 Model Selection Guide

### For Text Generation
- **Creative Writing**: Claude Opus 4, Claude Sonnet 4, GPT-5, GPT-4
- **Business Content**: Claude Sonnet 4, GPT-5, GPT-4, Claude 3.5 Sonnet
- **Technical Writing**: Claude Opus 4, Claude Sonnet 4, GPT-5, Code Llama

### For Summarization
- **Long Documents**: Claude Opus 4, Claude Sonnet 4, GPT-5, GPT-4
- **Quick Summaries**: Claude 3.5 Haiku, GPT-3.5 Turbo, Mistral 7B
- **Technical Content**: Claude Sonnet 4, Claude 3.5 Sonnet, Code Llama

### For Development
- **Code Generation**: Claude Sonnet 4, Code Llama, DeepSeek Coder
- **Code Review**: Claude Opus 4, Claude Sonnet 4, GPT-5, GPT-4
- **Documentation**: Claude Opus 4, Claude Sonnet 4, GPT-5, GPT-4

### For Advanced Reasoning
- **Complex Analysis**: GPT-OSS-20B, Claude Opus 4, Claude Sonnet 4
- **Agentic Tasks**: GPT-OSS-20B, Claude Opus 4
- **Multi-step Reasoning**: GPT-OSS-20B, Claude Sonnet 4, GPT-5

## ⚡ Performance Tips

### Local Models
- **Use 3B models** for development and testing
- **Use 7B models** for production quality
- **Use 20B models** for advanced reasoning tasks
- **Enable GPU acceleration** for better performance
- **Close other applications** to free up RAM

### Cloud Models
- **Use Claude 3.5 Haiku** for fast, cost-effective generation
- **Use Claude Sonnet 4** for balanced performance and advanced reasoning
- **Use Claude Opus 4** for the most sophisticated and autonomous tasks
- **Use GPT-5** for the latest OpenAI reasoning capabilities
- **Use GPT-OSS-20B** for advanced reasoning and agentic capabilities
- **Monitor API usage** to avoid rate limits
- **Cache responses** when possible
- **Use hybrid reasoning mode** with Claude Sonnet 4 for complex analysis

## 🔍 Model Status

### Checking Model Availability

The Models Explorer automatically checks which models are:
- ✅ **Installed** - Ready to use
- ⏳ **Downloading** - Currently being installed
- ❌ **Not Installed** - Need to be downloaded

### Model Management

```bash
# List installed models
ollama list

# Remove a model
ollama rm modelname

# Update a model
ollama pull modelname

# Check model info
ollama show modelname
```

### Keeping Models Running Indefinitely

By default, Ollama unloads models after a period of inactivity to free up memory. For production environments or when you want immediate responses, you can keep models loaded indefinitely:

```bash
# Keep a model running forever (until manually stopped)
curl http://localhost:11434/api/generate -d '{"model": "llama3.2:3b", "keep_alive": -1}'

# Examples for other models
curl http://localhost:11434/api/generate -d '{"model": "mistral:latest", "keep_alive": -1}'
curl http://localhost:11434/api/generate -d '{"model": "codellama:3b", "keep_alive": -1}'
curl http://localhost:11434/api/generate -d '{"model": "qwen2.5:3b", "keep_alive": -1}'
curl http://localhost:11434/api/generate -d '{"model": "gpt-oss-20b", "keep_alive": -1}'
```

**Benefits of keeping models loaded:**
- ⚡ **Instant responses** - No loading delay for the first request
- 🔄 **Consistent performance** - Eliminates cold start latency
- 🏭 **Production ready** - Ideal for server deployments and high-traffic applications

**Memory considerations:**
- Each loaded model consumes RAM based on its size (3B ≈ 4GB, 7B ≈ 8GB, 20B ≈ 16GB)
- Monitor system resources when keeping multiple models loaded
- Use `ollama ps` to check which models are currently running

```bash
# Check currently running models
ollama ps

# Stop a specific model to free memory
curl http://localhost:11434/api/generate -d '{"model": "llama3.2:3b", "keep_alive": 0}'
```

## 🎨 Image Generation Models

### Cloud-Based Image Generation

#### OpenAI DALL-E
- **DALL-E 3** - Latest, highest quality image generation
- **Features**: Natural language prompts, high resolution, style variations
- **API Key Required**: Yes (OpenAI account)

#### Anthropic Claude
- **Claude Sonnet 4** - Advanced image generation capabilities
- **Features**: High-quality image generation with natural language prompts
- **API Key Required**: Yes (Anthropic account)

### Local Image Generation

#### Integrated Diffusion Service
The application includes a built-in **Integrated Diffusion Service** that provides seamless local image generation:

**Features:**
- **Automatic Model Management**: Downloads and manages Stable Diffusion models automatically
- **Health Monitoring**: Real-time service health checks and status reporting
- **Multiple Generation Types**: Text-to-image, image-to-image, and storyboard generation
- **Smart Prompt Enhancement**: Automatic prompt optimization for better results
- **Privacy-First**: All generation happens locally on your machine
- **No External Dependencies**: Self-contained service with minimal setup

**Supported Models:**
- **Stable Diffusion XL Base 1.0** - High-quality, detailed image generation
- **Automatic Model Detection**: Service automatically detects and loads available models

**Generation Capabilities:**
- **Text-to-Image**: Generate images from text prompts
- **Image-to-Image**: Transform existing images with new prompts
- **Storyboard Generation**: Create multi-panel storyboards from narrative prompts
- **Style Control**: Multiple artistic styles (Cinematic, Anime, Photorealistic, etc.)
- **Resolution Options**: Flexible sizing from 384x384 to 1024x1024

### Model Selection Guide

| Use Case | Recommended Model | Setup Complexity | Quality | Speed |
|----------|------------------|------------------|---------|-------|
| **Quick Testing** | DALL-E 3 | Low (API key) | Excellent | Fast |
| **Privacy/Local** | Integrated Diffusion | Low (automatic) | Very Good | Medium |
| **High Quality** | Claude Sonnet 4 | Low (API key) | Excellent | Fast |
| **Storyboards** | Integrated Diffusion | Low (automatic) | Very Good | Medium |
| **Production** | Integrated Diffusion | Low (automatic) | Very Good | Variable |

### Performance Considerations

#### Hardware Requirements
- **Minimum**: 8GB RAM, 4GB VRAM (for local generation)
- **Recommended**: 16GB RAM, 8GB VRAM (for optimal performance)
- **Optimal**: 32GB RAM, 12GB+ VRAM (for multiple concurrent generations)

#### Generation Speed
- **DALL-E 3**: ~10-30 seconds (cloud latency)
- **Claude Sonnet 4**: ~15-45 seconds (cloud latency)
- **Integrated Diffusion**: ~30-120 seconds (local, depends on hardware and image size)
- **Storyboard Generation**: ~2-3 minutes per panel (local)

## 🛠️ Troubleshooting

### Common Issues

#### Model Not Found
```bash
# Solution: Pull the model
ollama pull modelname
```

#### Out of Memory
```bash
# Solution: Use smaller model or close other apps
ollama pull llama3.1:3b  # Instead of 7B model
```

#### Slow Performance
```bash
# Solution: Enable GPU acceleration
# Install CUDA drivers and Ollama with GPU support
```

#### Model Corrupted
```bash
# Solution: Reinstall the model
ollama rm modelname
ollama pull modelname
```

#### Image Generation Issues
```bash
# Check integrated diffusion service health
curl http://localhost:8000/api/v1/diffusion/health

# Restart the backend service if needed
cd backend && python main.py
``` 