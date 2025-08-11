# 🎨 Stable Diffusion Setup Guide

This guide will help you set up local image generation using Stable Diffusion with your GenAI Lab.

## 🎯 Overview

GenAI Lab supports local image generation through **three options** (in order of recommendation):

1. **🏆 Ollama + OllamaDiffuser** (Highly Recommended) - Consistent with your Ollama setup, pre-downloaded models
2. **🔧 AUTOMATIC1111 WebUI** (Advanced) - Full-featured Stable Diffusion interface  
3. **⚡ Direct Diffusion** (Fallback) - Direct Python integration with model downloads

## 🏆 Option 1: Ollama + OllamaDiffuser (Recommended)

### Why Choose Ollama + OllamaDiffuser?
- **🔄 Consistent Management**: Same approach as your existing Ollama LLM setup
- **📦 Pre-downloaded Models**: No delays during first generation - models ready instantly
- **🎯 Unified Architecture**: All AI models served through Ollama ecosystem
- **💾 Better Resource Sharing**: Optimized GPU/memory usage across all models
- **⚡ Fast Setup**: Uses familiar `ollama pull` commands

### Quick Setup

```bash
# Install OllamaDiffuser
pip install ollamadiffuser

# Pull Stable Diffusion XL model (one-time download)
ollamadiffuser pull stable-diffusion-xl-base-1.0

# Start serving the model
ollamadiffuser run stable-diffusion-xl-base-1.0
```

**Service runs on:** `http://localhost:8000`

### Integration with GenAI Lab

Your GenAI Lab automatically detects and uses OllamaDiffuser:

1. **Select "Diffusion Lab (Integrated)"** provider in Vision page
2. **Choose from available models** (dynamically loaded from OllamaDiffuser)  
3. **Generate instantly** - no download delays since models are pre-pulled

**Key Features Available:**
- **Text-to-Image**: High-quality SDXL generation
- **Storyboard Generation**: Multi-panel visual narratives
- **Advanced Styling**: 14+ artistic styles  
- **Batch Generation**: Multiple images with variations
- **Consistent Performance**: Same quality every time

### Model Management

```bash
# Add more models anytime
ollamadiffuser pull stable-diffusion-v1-5
ollamadiffuser pull flux.1-schnell

# List available models  
ollamadiffuser list

# Remove unused models
ollamadiffuser rm [model-name]
```

### Testing the Setup

1. **Start OllamaDiffuser**: `ollamadiffuser run stable-diffusion-xl-base-1.0`
2. **Test API**: `curl http://localhost:8000/api/health`
3. **Open GenAI Lab**: Go to Vision → Image Generation
4. **Select provider**: "Diffusion Lab (Integrated)"
5. **Generate**: Fast, high-quality images immediately!

> **📖 [Complete Ollama + OllamaDiffuser Setup Guide](OLLAMA_DIFFUSION_SETUP.md)** - Detailed instructions with troubleshooting

## 🚀 Option 1: AUTOMATIC1111 WebUI (Recommended)

### Prerequisites
- Python 3.10+ 
- Git
- 8GB+ RAM recommended
- NVIDIA GPU with 4GB+ VRAM (optional but recommended)

### Installation Steps

#### 1. Clone the Repository
```bash
git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git
cd stable-diffusion-webui
```

#### 2. Install Dependencies

**On macOS:**
```bash
# Install Python 3.10 if not already installed
brew install python@3.10

# Upgrade pip
python3 -m pip install --upgrade pip
```

**On Linux/Ubuntu:**
```bash
# Install dependencies
sudo apt update
sudo apt install wget git python3 python3-venv python3-pip

# For NVIDIA GPU support
sudo apt install nvidia-driver-470 nvidia-cuda-toolkit
```

**On Windows:**
- Install [Python 3.10](https://www.python.org/downloads/)
- Install [Git](https://git-scm.com/download/win)

#### 3. First Run (Downloads Models Automatically)
```bash
# This will download Stable Diffusion 1.5 model (~4GB)
./webui.sh
```

#### 4. Configure for API Access
For GenAI Lab integration, you need to enable the API:

**Create `webui-user.sh` (macOS/Linux) or `webui-user.bat` (Windows):**
```bash
#!/bin/bash
export COMMANDLINE_ARGS="--api --listen --port 7860"
```

**Or run directly:**
```bash
./webui.sh --api --listen --port 7860
```

### 📦 Installing Additional Models

#### High-Quality Models (Optional)
1. **Stable Diffusion XL (SDXL)** - Better quality, larger images
   ```bash
   cd models/Stable-diffusion/
   wget https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors
   ```

2. **Realistic Vision** - Photorealistic images
   ```bash
   wget https://huggingface.co/SG161222/Realistic_Vision_V5.1_noVAE/resolve/main/Realistic_Vision_V5.1.safetensors
   ```

3. **DreamShaper** - Fantasy and artistic styles
   ```bash
   wget https://huggingface.co/Lykon/DreamShaper/resolve/main/DreamShaper_8_pruned.safetensors
   ```

## 🔧 Option 2: OllamaDiffuser (Alternative)

### Installation
```bash
# Install dependencies
pip install diffusers torch torchvision transformers accelerate

# Install OllamaDiffuser (if using custom implementation)
# Follow specific OllamaDiffuser documentation
```

### Configuration
- Configure to run on port 8000
- Ensure API endpoints match GenAI Lab expectations

## ⚙️ GenAI Lab Configuration

### Provider Options
Your GenAI Lab supports three image generation providers:

1. **OpenAI (DALL-E)** - Cloud-based, requires API key
2. **Ollama** - Routes to local Stable Diffusion (WebUI → OllamaDiffuser fallback)
3. **Stable Diffusion (Local)** - Direct connection to WebUI or OllamaDiffuser

### Connection Details
- **WebUI URL**: `http://localhost:7860`
- **OllamaDiffuser URL**: `http://localhost:8000`
- **API Endpoints**: Automatically configured

## 🎭 Features & Capabilities

### Artistic Styles Supported
- **Photorealistic** - `photorealistic, high quality, detailed`
- **Oil Painting** - `oil painting, artistic, classical art style`
- **Watercolor** - `watercolor painting, soft, flowing`
- **Digital Art** - `digital art, concept art, artstation`
- **Anime Style** - `anime style, manga, cel shading`
- **Cartoon** - `cartoon style, animated, colorful`
- **Pencil Sketch** - `pencil sketch, hand drawn, monochrome`
- **Pop Art** - `pop art style, bold colors, retro`
- **Impressionist** - `impressionist painting, loose brushstrokes`
- **Surreal** - `surreal art, dreamlike, fantasy`
- **Minimalist** - `minimalist, clean, simple composition`
- **Cyberpunk** - `cyberpunk style, neon, futuristic`
- **Vintage** - `vintage style, retro, aged`
- **Abstract** - `abstract art, non-representational`

### Image Sizes
- **512x512** - Standard SD 1.5 resolution
- **1024x1024** - Square high resolution
- **1792x1024** - Landscape format
- **1024x1792** - Portrait format

### Quality Settings
- **Standard** - 20 steps, CFG 7, Euler a sampler
- **HD** - 30 steps, CFG 8, DPM++ 2M Karras sampler

## 🧪 Testing Your Setup

### 1. Start the Service
```bash
cd stable-diffusion-webui
./webui.sh --api --listen --port 7860
```

### 2. Verify API Access
Test the API endpoint:
```bash
curl -X GET http://localhost:7860/sdapi/v1/options
```

### 3. Test in GenAI Lab
1. Open GenAI Lab at `http://localhost:3000`
2. Navigate to **Vision** page
3. Click **Image Generation** tab
4. Select **"Ollama"** or **"Stable Diffusion (Local)"** provider
5. Enter prompt: `"A beautiful sunset over mountains, photorealistic"`
6. Choose **"Photorealistic"** style
7. Click **"Generate Image"**

## 🚨 Troubleshooting

### Common Issues

#### "Failed to connect to Stable Diffusion WebUI"
- **Check if WebUI is running**: `curl http://localhost:7860`
- **Verify API is enabled**: Look for `--api` in startup command
- **Check port availability**: `lsof -i :7860`

#### "Local image generation failed"
- **Restart WebUI** with API enabled
- **Check logs** in WebUI terminal for errors
- **Verify model files** are downloaded in `models/Stable-diffusion/`

#### Out of Memory Errors
- **Reduce image size** to 512x512
- **Close other GPU applications**
- **Add `--lowvram` flag**: `./webui.sh --api --listen --port 7860 --lowvram`

#### Slow Generation
- **Use GPU acceleration**: Install CUDA/ROCm
- **Reduce steps**: Use standard quality instead of HD
- **Use lighter models**: Stick with SD 1.5 instead of SDXL

### Performance Optimization

#### For NVIDIA GPUs
```bash
# Enable xformers for faster generation
./webui.sh --api --listen --port 7860 --xformers
```

#### For Apple Silicon (M1/M2)
```bash
# Use MPS acceleration
./webui.sh --api --listen --port 7860 --use-cpu all
```

#### For CPU-only
```bash
# CPU mode (slower but works without GPU)
./webui.sh --api --listen --port 7860 --use-cpu all --precision full --no-half
```

## 📋 Quick Start Checklist

- [ ] Clone AUTOMATIC1111 WebUI repository
- [ ] Run initial setup to download base model
- [ ] Configure API access with `--api --listen --port 7860`
- [ ] Start WebUI service
- [ ] Test API connection
- [ ] Open GenAI Lab Vision page
- [ ] Select local provider (Ollama or Stable Diffusion)
- [ ] Generate test image
- [ ] Verify image appears in results

## 🔗 Useful Resources

- [AUTOMATIC1111 WebUI GitHub](https://github.com/AUTOMATIC1111/stable-diffusion-webui)
- [Stable Diffusion Models on Hugging Face](https://huggingface.co/models?search=stable-diffusion)
- [WebUI API Documentation](https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/API)
- [Model Installation Guide](https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/Features#stable-diffusion-models)

## 🆘 Getting Help

If you encounter issues:

1. **Check WebUI logs** for error messages
2. **Verify system requirements** (Python 3.10+, sufficient RAM/VRAM)
3. **Try different models** if one isn't working
4. **Use CPU mode** as fallback if GPU issues occur
5. **Check GenAI Lab logs** in browser console

For additional support, refer to the [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) guide.
