# 🎨 Ollama + Diffusion Setup Guide

This guide shows how to set up **OllamaDiffuser** to serve Stable Diffusion models alongside your existing Ollama installation for consistent, pre-downloaded model serving.

## 🎯 Why Use Ollama + OllamaDiffuser?

### ✅ **Advantages**
- **Consistent with Ollama** - Same management approach for all models
- **Pre-downloaded models** - No download delays during first generation
- **Unified serving** - All AI models served through Ollama ecosystem
- **Better resource management** - Shared model caching and GPU utilization
- **Familiar commands** - Same `ollama pull`/`ollama run` style interface

### 🔄 **Architecture**
```
GenAI Lab → OllamaDiffuser (port 8000) → Stable Diffusion Models
              ↓
         Standard Ollama (port 11434) → LLM Models
```

## 🚀 Installation & Setup

### **Step 1: Install OllamaDiffuser**

```bash
# Install OllamaDiffuser
pip install ollamadiffuser

# Verify installation
ollamadiffuser --version
```

### **Step 2: Pull Stable Diffusion Models**

Pre-download the models you want to use:

```bash
# Pull Stable Diffusion XL (recommended)
ollamadiffuser pull stable-diffusion-xl-base-1.0

# Pull other popular models
ollamadiffuser pull stable-diffusion-v1-5
ollamadiffuser pull flux.1-schnell
ollamadiffuser pull flux.1-dev

# List available models
ollamadiffuser list
```

### **Step 3: Start OllamaDiffuser Service**

```bash
# Start with a specific model
ollamadiffuser run stable-diffusion-xl-base-1.0

# Or start the service and load models on-demand
ollamadiffuser serve
```

**Service will run on:** `http://localhost:8000`

### **Step 4: Verify Setup**

Test that everything is working:

```bash
# Check service health
curl http://localhost:8000/api/health

# List available models
curl http://localhost:8000/api/models

# Test image generation
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "stable-diffusion-xl-base-1.0",
    "prompt": "A beautiful sunset over mountains",
    "width": 1024,
    "height": 1024
  }' | jq '.images[0]' > test-image.json
```

## 🔧 Configuration Options

### **OllamaDiffuser Configuration**

Create `~/.ollamadiffuser/config.yaml`:

```yaml
# OllamaDiffuser Configuration
server:
  host: "0.0.0.0"
  port: 8000
  
models:
  cache_dir: "~/.ollama/models/diffusion"
  
generation:
  default_steps: 20
  default_guidance: 7.5
  max_batch_size: 4
  
gpu:
  memory_fraction: 0.8
  enable_attention_slicing: true
```

### **Model Aliases**

Set up convenient aliases:

```bash
# Create model aliases
ollamadiffuser alias sdxl stable-diffusion-xl-base-1.0
ollamadiffuser alias sd15 stable-diffusion-v1-5
ollamadiffuser alias flux flux.1-schnell

# Use aliases
ollamadiffuser run sdxl
```

## 📋 Model Recommendations

### **For GenAI Lab Integration**

| Model | Size | Quality | Speed | Use Case |
|-------|------|---------|--------|----------|
| **stable-diffusion-xl-base-1.0** | ~6GB | Excellent | Medium | **Recommended** - High quality, good balance |
| **stable-diffusion-v1-5** | ~2GB | Good | Fast | Quick generation, lower resource usage |
| **flux.1-schnell** | ~12GB | Excellent | Fast | Latest model, very high quality |
| **flux.1-dev** | ~12GB | Excellent | Slow | Development version, highest quality |

### **Quick Setup for Testing**

```bash
# Minimal setup - just SDXL
ollamadiffuser pull stable-diffusion-xl-base-1.0
ollamadiffuser run stable-diffusion-xl-base-1.0
```

### **Full Setup for Production**

```bash
# Complete setup with multiple models
ollamadiffuser pull stable-diffusion-xl-base-1.0
ollamadiffuser pull stable-diffusion-v1-5
ollamadiffuser pull flux.1-schnell

# Start service (loads models on-demand)
ollamadiffuser serve
```

## 🔗 GenAI Lab Integration

Your GenAI Lab is already configured to work with OllamaDiffuser:

### **Automatic Detection**
- Health checks OllamaDiffuser at startup
- Lists available models dynamically
- Auto-downloads missing models when requested

### **Provider Selection**
1. **Go to Vision page** → **Image Generation tab**
2. **Select "Diffusion Lab (Integrated)"** provider
3. **Choose model** from dropdown (shows available OllamaDiffuser models)
4. **Generate!** - No download delays

### **Model Management**
```bash
# Add new models anytime
ollamadiffuser pull [model-name]

# Remove unused models
ollamadiffuser rm [model-name]

# Check resource usage
ollamadiffuser ps
```

## 🚨 Troubleshooting

### **OllamaDiffuser Not Starting**

```bash
# Check if port 8000 is available
lsof -i :8000

# Start with verbose logging
ollamadiffuser serve --verbose

# Check logs
tail -f ~/.ollamadiffuser/logs/server.log
```

### **Model Download Issues**

```bash
# Clear cache and retry
ollamadiffuser cache clear
ollamadiffuser pull stable-diffusion-xl-base-1.0

# Check disk space
df -h ~/.ollama/
```

### **GenAI Lab Connection Issues**

```bash
# Verify OllamaDiffuser API
curl http://localhost:8000/api/health

# Check GenAI Lab logs
cd genai-labs/backend
tail -f logs/app.log

# Test API endpoint
curl http://localhost:8000/api/v1/diffusion/health
```

### **Performance Issues**

```bash
# Monitor GPU usage
nvidia-smi  # For NVIDIA GPUs
top -pid $(pgrep ollamadiffuser)  # For CPU usage

# Reduce batch size
# Edit ~/.ollamadiffuser/config.yaml
# Set max_batch_size: 1
```

## 📖 Commands Reference

### **Essential Commands**

```bash
# Install and setup
pip install ollamadiffuser
ollamadiffuser pull stable-diffusion-xl-base-1.0

# Service management
ollamadiffuser serve                    # Start service
ollamadiffuser run [model]             # Run specific model
ollamadiffuser stop                    # Stop service

# Model management
ollamadiffuser list                    # List local models
ollamadiffuser pull [model]            # Download model
ollamadiffuser rm [model]              # Remove model
ollamadiffuser ps                      # Show running models

# Utilities
ollamadiffuser --help                  # Show help
ollamadiffuser version                 # Show version
ollamadiffuser status                  # Show service status
```

### **Advanced Usage**

```bash
# Custom generation parameters
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "stable-diffusion-xl-base-1.0",
    "prompt": "A cyberpunk cityscape at night",
    "negative_prompt": "blurry, low quality",
    "width": 1024,
    "height": 1024,
    "num_inference_steps": 30,
    "guidance_scale": 8.0,
    "seed": 12345
  }'
```

## 🎯 Next Steps

1. **✅ Install OllamaDiffuser**: `pip install ollamadiffuser`
2. **✅ Pull SDXL model**: `ollamadiffuser pull stable-diffusion-xl-base-1.0`
3. **✅ Start service**: `ollamadiffuser run stable-diffusion-xl-base-1.0`
4. **✅ Test in GenAI Lab**: Select "Diffusion Lab (Integrated)" provider
5. **✅ Generate images**: No download delays!

Your GenAI Lab will now have **fast, consistent image generation** using the same model management approach as your LLMs! 🚀🎨

