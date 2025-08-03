# Voice Features Guide

## 🎤 Voice Input (Speech-to-Text)

### Overview
Convert speech to text in real-time using the Web Speech API. Perfect for hands-free prompt input and accessibility.

### Features
- **Real-time Transcription**: Convert speech to text as you speak
- **Continuous Recognition**: Supports ongoing speech input without interruption
- **Language Support**: Defaults to English (en-US) with multi-language capability
- **Visual Feedback**: Animated microphone with audio level indicators
- **Error Handling**: Graceful fallback for unsupported browsers
- **Noise Filtering**: Built-in noise reduction and echo cancellation

### How to Use

1. **Navigate to Text Generation** (`/generate`) or **Text Summarization** (`/summarize`)
2. **Click the microphone icon** next to the input field
3. **Start speaking** - your words will appear as text
4. **Click again to stop** recording
5. **Edit the transcript** if needed before generating

### Browser Compatibility

| Browser | Speech Recognition | Text-to-Speech | Notes |
|---------|-------------------|----------------|-------|
| **Chrome/Edge** | ✅ Full Support | ✅ Full Support | Best experience |
| **Firefox** | ⚠️ Limited | ✅ Full Support | May require HTTPS |
| **Safari** | ⚠️ Limited | ✅ Full Support | iOS support varies |
| **Mobile** | ⚠️ Varies | ✅ Good Support | Platform dependent |

### Troubleshooting Voice Input

#### Microphone Not Working
```bash
# Check browser permissions
# Allow microphone access when prompted
# Ensure HTTPS connection (required for some browsers)
```

#### No Speech Recognition
```bash
# Try Chrome or Edge browser
# Check if Web Speech API is supported
# Ensure microphone is not muted
```

## 🔊 Voice Output (Text-to-Speech)

### Overview
Listen to generated responses with natural-sounding speech synthesis. Choose from multiple voices and control playback.

### Features
- **Multiple Voices**: Choose from available system voices
- **Playback Controls**: Play, pause, resume, and stop functionality
- **Voice Selection**: Dropdown to select preferred voice
- **Visual Status**: Clear playing/paused status indicators
- **Smart Voice Detection**: Automatically selects English voices
- **Speed Control**: Adjust playback speed (0.5x to 2x)

### How to Use

1. **Generate text** using Text Generation or Summarization
2. **Click the speaker icon** next to the response
3. **Choose your preferred voice** from the dropdown
4. **Control playback** with play/pause/stop buttons
5. **Adjust speed** if needed

### Voice Selection

#### Available Voice Types
- **Male Voices**: Deep, authoritative, professional
- **Female Voices**: Clear, expressive, natural
- **Neutral Voices**: Balanced, easy to understand
- **Accented Voices**: Various regional accents

#### Voice Quality Factors
- **Clarity**: How well the voice pronounces words
- **Naturalness**: How human-like the voice sounds
- **Speed**: Speaking rate and pacing
- **Pitch**: Voice tone and inflection

### Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| **Voice Selection** | ✅ | ✅ | ✅ | ✅ |
| **Playback Controls** | ✅ | ✅ | ✅ | ✅ |
| **Speed Control** | ✅ | ✅ | ✅ | ✅ |
| **Voice Quality** | Excellent | Good | Good | Excellent |

## 🔧 Technical Implementation

### Web Speech API

The voice features use the browser's native Web Speech API:

```javascript
// Speech Recognition
const recognition = new webkitSpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;

// Speech Synthesis
const utterance = new SpeechSynthesisUtterance(text);
speechSynthesis.speak(utterance);
```

### Supported Languages

#### Speech Recognition
- **Primary**: English (en-US)
- **Secondary**: Spanish, French, German, Italian
- **Experimental**: Chinese, Japanese, Korean

#### Text-to-Speech
- **English**: Multiple accents and dialects
- **Spanish**: European and Latin American
- **French**: European and Canadian
- **German**: Standard and Austrian
- **Italian**: Standard Italian

## 🎯 Best Practices

### Voice Input Tips
- **Speak clearly** and at a normal pace
- **Minimize background noise** for better accuracy
- **Use punctuation commands** like "period" or "comma"
- **Pause briefly** between sentences
- **Review transcript** before submitting

### Voice Output Tips
- **Choose appropriate voice** for content type
- **Adjust speed** for complex content
- **Use for proofreading** generated text
- **Enable for accessibility** features
- **Test voice quality** before long content

### Performance Optimization
- **Close other audio apps** to reduce interference
- **Use wired headphones** for better quality
- **Ensure stable internet** for cloud-based features
- **Restart browser** if voice features stop working

## 🛠️ Troubleshooting

### Common Voice Input Issues

#### "Microphone access denied"
```bash
# Solution: Allow microphone permissions
# Click the microphone icon in browser address bar
# Select "Allow" for microphone access
```

#### "No speech detected"
```bash
# Solution: Check microphone settings
# Ensure microphone is not muted
# Try speaking louder or closer to microphone
# Check browser console for errors
```

#### "Recognition not supported"
```bash
# Solution: Use supported browser
# Chrome or Edge recommended
# Ensure HTTPS connection
# Update browser to latest version
```

### Common Voice Output Issues

#### "No voices available"
```bash
# Solution: Install system voices
# Windows: Settings > Time & Language > Speech
# macOS: System Preferences > Accessibility > Speech
# Linux: Install speech synthesis packages
```

#### "Voice sounds robotic"
```bash
# Solution: Choose better voice
# Select higher quality voice from dropdown
# Ensure stable internet connection
# Try different voice options
```

#### "Playback not working"
```bash
# Solution: Check audio settings
# Ensure system audio is not muted
# Check browser audio permissions
# Try refreshing the page
```

## 🔒 Privacy & Security

### Data Handling
- **No cloud processing** - Voice recognition runs locally
- **No voice data stored** - Transcripts are temporary
- **Browser-only** - No server-side voice processing
- **User control** - Full control over voice features

### Security Considerations
- **HTTPS required** - Voice features need secure connection
- **Permission-based** - Explicit user consent required
- **Local processing** - Voice data stays on your device
- **No tracking** - Voice usage is not monitored or logged 