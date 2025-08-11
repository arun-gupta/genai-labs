# Stable Diffusion 3.5 Large Integration

## Overview

GenAI Labs now supports [Stable Diffusion 3.5 Large](https://huggingface.co/stabilityai/stable-diffusion-3.5-large), the latest and most advanced text-to-image model from Stability AI.

## Key Features

- **Higher Quality**: Significantly improved image quality compared to SD 1.5
- **Better Typography**: Enhanced text rendering capabilities
- **Complex Prompt Understanding**: Better comprehension of detailed prompts
- **Resource Efficient**: Optimized for faster generation
- **Higher Resolution**: Supports up to 1024x1024 resolution by default

## Technical Details

### Model Architecture
- **Type**: Multimodal Diffusion Transformer (MMDiT)
- **Text Encoders**: CLIP-ViT/G, CLIP-ViT/L, T5-xxl
- **Context Length**: 77/256 tokens
- **License**: Stability Community License (free for <$1M annual revenue)

### System Requirements
- **RAM**: 8GB+ recommended
- **Storage**: ~4GB for model download
- **GPU**: Optional (CPU fallback available)

## Setup

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Model Download
The model will be automatically downloaded on first use (~4GB). This may take 5-10 minutes depending on your internet connection.

### 3. Usage
The model is automatically selected when you choose "Stable Diffusion" in both Image Generation and Image Analysis sections.

## Configuration

### Default Parameters (SD 3.5 Large)
- **Resolution**: 1024x1024
- **Inference Steps**: 28
- **Guidance Scale**: 3.5
- **Max Sequence Length**: 512

### Comparison with SD 1.5
| Feature | SD 1.5 | SD 3.5 Large |
|---------|--------|--------------|
| Default Resolution | 512x512 | 1024x1024 |
| Inference Steps | 50 | 28 |
| Guidance Scale | 8.5 | 3.5 |
| Model Size | ~2GB | ~4GB |
| Quality | Good | Excellent |

## License Considerations

- **Free Use**: Available for research, non-commercial, and commercial use for organizations with <$1M annual revenue
- **Enterprise License**: Required for organizations with >$1M annual revenue
- **Contact**: [Stability AI Licensing](https://stability.ai/license)

## Troubleshooting

### Common Issues

1. **Out of Memory Errors**
   - Reduce resolution to 512x512
   - Use CPU mode (slower but more compatible)

2. **Slow Generation**
   - First run includes model download
   - Subsequent generations are much faster
   - Consider using GPU if available

3. **Model Not Loading**
   - Check internet connection for initial download
   - Verify sufficient disk space (~4GB)
   - Ensure latest diffusers version (>=0.28.0)

### Performance Tips

- **GPU Acceleration**: Enable CUDA/MPS for faster generation
- **Memory Optimization**: Use attention slicing for lower memory usage
- **Batch Processing**: Generate multiple images sequentially rather than in parallel

## API Integration

The model is automatically integrated into the existing API endpoints:

- `POST /api/v1/generate/image` - Image generation
- `POST /api/v1/vision/analyze` - Image analysis

No additional configuration required - simply select "Stable Diffusion" as your model provider.

## Future Enhancements

- Support for additional SD 3.5 variants
- Fine-tuning capabilities
- Advanced prompt engineering features
- Batch processing optimizations
