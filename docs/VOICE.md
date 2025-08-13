# Voice Features Documentation

## Overview
The GenAI Lab includes comprehensive voice features for both Speech-to-Text (STT) and Text-to-Speech (TTS) capabilities.

## System Requirements

### Required Dependencies
- **ffmpeg**: Required for audio processing (STT/TTS features)
  - **macOS**: `brew install ffmpeg`
  - **Linux**: `sudo apt install ffmpeg` (Ubuntu/Debian) or `sudo yum install ffmpeg` (CentOS/RHEL)
  - **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html) or use `winget install ffmpeg`

## Speech-to-Text (STT)

### Supported Models
- **Google Speech Recognition**: High accuracy, supports multiple languages
- **OpenAI Whisper**: Advanced AI model with excellent transcription quality

### Supported Audio Formats
- **Primary**: WAV, MP3, M4A, OGG
- **Conversion**: Automatic conversion using ffmpeg for unsupported formats

### Features
- Real-time audio processing
- Language detection and selection
- Multiple model selection
- Audio format conversion

## Text-to-Speech (TTS)

### Supported Models
- **Microsoft Edge TTS**: High-quality, free TTS service
- **Google Text-to-Speech (gTTS)**: Google's TTS service

### Features
- Multiple voice selection
- Speed and pitch control
- Volume adjustment
- Output format selection (MP3, WAV, OGG, M4A)
- Text normalization for better pronunciation

### Voice Selection
- 322+ voices available via Edge TTS
- Filter by language, gender, and style
- Automatic voice selection based on content

## ⚠️ Work In Progress (WIP)

### SSML (Speech Synthesis Markup Language)
**Status**: WIP - Currently experiencing issues with proper SSML processing

**Known Issues**:
- SSML tags may be spoken literally instead of being interpreted
- Speed variations in SSML may not work correctly
- Complex SSML structures may cause processing errors

**Current State**:
- Basic SSML detection and namespace injection implemented
- Text normalization properly skipped for SSML content
- Frontend UI includes SSML checkbox and sample prompts
- Backend processing includes SSML handling logic

**Future Improvements Needed**:
- Fix SSML parsing and processing in Edge TTS
- Implement proper SSML validation
- Add support for more SSML features (emotions, styles, etc.)
- Improve error handling for malformed SSML

**Temporary Workaround**:
- Use plain text with speed/pitch controls instead of SSML
- Text normalization works well for improved pronunciation
- Voice selection provides natural speech variations

## Troubleshooting

### Common Issues

#### STT Issues
1. **"Audio file could not be read" error**
   - **Solution**: Install ffmpeg (`brew install ffmpeg` on macOS)
   - **Cause**: Missing ffmpeg dependency for audio conversion

2. **Poor transcription quality**
   - **Solution**: Try different STT models (Google vs Whisper)
   - **Solution**: Ensure audio is clear and in supported format

#### TTS Issues
1. **No audio generated**
   - **Solution**: Check voice selection and model availability
   - **Solution**: Verify text input is not empty

2. **SSML not working properly**
   - **Solution**: Use plain text with speed/pitch controls instead
   - **Status**: Known issue, marked as WIP

### Getting Help
- Check the [Troubleshooting Guide](../docs/TROUBLESHOOTING.md)
- Review system requirements and dependencies
- Ensure ffmpeg is properly installed
- For SSML issues, use plain text alternatives until WIP is resolved 