# Models Guide

## 🤖 Supported Models

### Open Source Models (via Ollama)

The application includes a comprehensive **Models Explorer** page that showcases 12+ open-source language models:

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
| **Mistral 7B** | Medium | Fast | Good | General purpose |
| **Llama 3.1** | Small | Very Fast | Good | Quick responses |
| **Code Llama** | Medium | Fast | Good | Programming |

### Resource Requirements

| Model | RAM | Storage | GPU | Best For |
|-------|-----|---------|-----|----------|
| **3B Models** | 4GB | 2GB | Optional | Development |
| **7B Models** | 8GB | 4GB | Recommended | Production |
| **Cloud Models** | N/A | N/A | N/A | All users |

## 🔧 Model Installation

### Installing Ollama Models

1. **Navigate to Models Explorer** (`/models`)
2. **Find your desired model**
3. **Click "Copy Command"**
4. **Run the command in terminal**:
   ```bash
   ollama pull mistral:7b
   ```

### Popular Model Commands

```bash
# General purpose models
ollama pull mistral:7b
ollama pull llama3.1:3b
ollama pull gemma2:3b

# Specialized models
ollama pull codellama:3b
ollama pull deepseek-coder:3b
ollama pull neural-chat:3b

# Multilingual models
ollama pull bloom:3b
ollama pull qwen2.5:3b
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

## ⚡ Performance Tips

### Local Models
- **Use 3B models** for development and testing
- **Use 7B models** for production quality
- **Enable GPU acceleration** for better performance
- **Close other applications** to free up RAM

### Cloud Models
- **Use Claude 3.5 Haiku** for fast, cost-effective generation
- **Use Claude Sonnet 4** for balanced performance and advanced reasoning
- **Use Claude Opus 4** for the most sophisticated and autonomous tasks
- **Use GPT-5** for the latest OpenAI reasoning capabilities
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
curl http://localhost:11434/api/generate -d '{"model": "mistral:7b", "keep_alive": -1}'

# Examples for other models
curl http://localhost:11434/api/generate -d '{"model": "mistral:latest", "keep_alive": -1}'
curl http://localhost:11434/api/generate -d '{"model": "codellama:3b", "keep_alive": -1}'
curl http://localhost:11434/api/generate -d '{"model": "qwen2.5:3b", "keep_alive": -1}'
```

**Benefits of keeping models loaded:**
- ⚡ **Instant responses** - No loading delay for the first request
- 🔄 **Consistent performance** - Eliminates cold start latency
- 🏭 **Production ready** - Ideal for server deployments and high-traffic applications

**Memory considerations:**
- Each loaded model consumes RAM based on its size (3B ≈ 4GB, 7B ≈ 8GB)
- Monitor system resources when keeping multiple models loaded
- Use `ollama ps` to check which models are currently running

```bash
# Check currently running models
ollama ps

# Stop a specific model to free memory
curl http://localhost:11434/api/generate -d '{"model": "mistral:7b", "keep_alive": 0}'
```

## 🎨 Image Generation Models

### Cloud-Based Image Generation

#### OpenAI DALL-E
- **DALL-E 3** - Latest, highest quality image generation
- **DALL-E 2** - Previous generation, good quality and speed
- **Features**: Natural language prompts, high resolution, style variations
- **API Key Required**: Yes (OpenAI account)

### Local Image Generation

#### Stable Diffusion (via AUTOMATIC1111 WebUI)
```bash
# Installation (Linux/macOS)
git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git
cd stable-diffusion-webui
./webui.sh --api

# Windows
git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git
cd stable-diffusion-webui
webui-user.bat
```

**Supported Models:**
- **Stable Diffusion 1.5** - Fast, good quality baseline model
- **Stable Diffusion 2.1** - Improved version with better composition
- **Stable Diffusion XL** - Higher resolution, more detailed images
- **Custom Models** - Community fine-tuned models from Civitai, Hugging Face

**Features:**
- Full control over generation parameters
- Custom model support
- Advanced samplers and schedulers
- ControlNet integration
- Upscaling and post-processing

#### OllamaDiffuser
```bash
# Installation
pip install ollamadiffuser

# Pull and run models
ollamadiffuser pull flux.1-schnell
ollamadiffuser run flux.1-schnell

# Generate images via API
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A beautiful sunset over mountains"}' \
  --output image.png
```

**Supported Models:**
- **FLUX.1 Schnell** - Fast, high-quality generation
- **FLUX.1 Dev** - Development version with enhanced capabilities
- **Stable Diffusion 3.5** - Latest Stability AI model
- **Stable Diffusion 1.5** - Classic baseline model

**Features:**
- Ollama-style model management
- Simple API interface
- Lightweight deployment
- Cross-platform support

### Integration with Ollama

When using Ollama for image generation, the system automatically:
1. **Tries AUTOMATIC1111 WebUI** (http://localhost:7860) first
2. **Falls back to OllamaDiffuser** (http://localhost:8000) if WebUI unavailable
3. **Provides clear error messages** if neither service is running

### Model Selection Guide

| Use Case | Recommended Model | Setup Complexity | Quality | Speed |
|----------|------------------|------------------|---------|-------|
| **Quick Testing** | DALL-E 3 | Low (API key) | Excellent | Fast |
| **Privacy/Local** | Stable Diffusion 1.5 | Medium | Good | Medium |
| **High Quality** | Stable Diffusion XL | Medium | Excellent | Slow |
| **Experimental** | FLUX.1 models | Medium | Very Good | Fast |
| **Production** | AUTOMATIC1111 + Custom | High | Excellent | Variable |

### Performance Considerations

#### Hardware Requirements
- **Minimum**: 8GB RAM, 4GB VRAM (for SD 1.5)
- **Recommended**: 16GB RAM, 8GB VRAM (for SD XL)
- **Optimal**: 32GB RAM, 12GB+ VRAM (for multiple models)

#### Generation Speed
- **DALL-E 3**: ~10-30 seconds (cloud latency)
- **SD 1.5**: ~5-15 seconds (local, depends on hardware)
- **SD XL**: ~15-45 seconds (local, higher quality)
- **FLUX.1**: ~10-25 seconds (local, optimized)

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