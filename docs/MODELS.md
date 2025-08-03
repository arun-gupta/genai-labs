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
- **GPT-4** - Advanced reasoning and analysis
- **GPT-3.5 Turbo** - Fast and cost-effective generation
- **GPT-4 Turbo** - Enhanced performance with larger context

### Anthropic Models
- **Claude 3 Opus** - Most capable model for complex tasks
- **Claude 3 Sonnet** - Balanced performance and speed
- **Claude 3 Haiku** - Fast and efficient for simple tasks

## 📊 Model Comparison

### Performance Characteristics

| Model | Size | Speed | Quality | Use Case |
|-------|------|-------|---------|----------|
| **GPT-4** | Large | Medium | High | Complex reasoning |
| **Claude 3** | Large | Medium | High | Analysis & writing |
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
- **Creative Writing**: GPT-4, Claude 3, Mistral 7B
- **Business Content**: GPT-4, Claude 3 Sonnet
- **Technical Writing**: GPT-4, Claude 3, Code Llama

### For Summarization
- **Long Documents**: GPT-4, Claude 3 Opus
- **Quick Summaries**: GPT-3.5 Turbo, Mistral 7B
- **Technical Content**: Claude 3, Code Llama

### For Development
- **Code Generation**: Code Llama, DeepSeek Coder
- **Code Review**: GPT-4, Claude 3
- **Documentation**: GPT-4, Claude 3

## ⚡ Performance Tips

### Local Models
- **Use 3B models** for development and testing
- **Use 7B models** for production quality
- **Enable GPU acceleration** for better performance
- **Close other applications** to free up RAM

### Cloud Models
- **Use GPT-3.5 Turbo** for cost-effective generation
- **Use GPT-4** for complex reasoning tasks
- **Monitor API usage** to avoid rate limits
- **Cache responses** when possible

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