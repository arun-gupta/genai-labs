# Troubleshooting Guide

## 🚨 Common Issues & Solutions

### Setup Issues

#### "Python not found"
```bash
# Solution: Install Python 3.9+ and ensure it's in PATH
python3 --version
# or
python --version

# If not found, install Python:
# macOS: brew install python@3.11
# Ubuntu: sudo apt install python3.11
# Windows: Download from python.org
```

#### "Node.js not found"
```bash
# Solution: Install Node.js 18+ and npm
node --version
npm --version

# If not found, install Node.js:
# macOS: brew install node
# Ubuntu: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
# Windows: Download from nodejs.org
```

#### "Virtual environment is corrupted"
```bash
# Solution: Recreate virtual environment
rm -rf backend/venv
python -m venv backend/venv
source backend/venv/bin/activate
pip install -r backend/requirements.txt
```

#### "Permission denied" on virtual environment
```bash
# Solution: Fix permissions
chmod +x backend/venv/bin/activate
chmod +x backend/venv/bin/python
```

### Runtime Issues

#### "No module named 'fastapi'"
```bash
# Solution: Ensure virtual environment is activated
source backend/venv/bin/activate
pip install -r backend/requirements.txt
```

#### "Port 8000 is already in use"
```bash
# Solution: Kill existing process or use different port
lsof -ti:8000 | xargs kill -9
# or
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

#### "Port 3000 is already in use"
```bash
# Solution: Kill existing process or use different port
lsof -ti:3000 | xargs kill -9
# or
npm run dev -- --port 3001
```

#### "Frontend can't connect to backend"
```bash
# Solution: Check backend is running and CORS settings
# 1. Ensure backend is running on port 8000
# 2. Check frontend/.env has correct API URL
# 3. Verify CORS_ORIGINS in backend/.env
```

### Model Issues

#### "Model not found"
```bash
# Solution: Install the model
ollama pull modelname
# or use a different model in the UI
```

#### "Out of memory"
```bash
# Solution: Use smaller model or close other apps
ollama pull llama3.1:3b  # Instead of 7B model
# or close other applications to free RAM
```

#### "Ollama not running"
```bash
# Solution: Start Ollama service
ollama serve
# or install Ollama if not installed
```

### API Issues

#### "Rate limit exceeded"
```bash
# Solution: Wait and retry or use local models
# 1. Wait a few minutes before retrying
# 2. Switch to Ollama (local) models
# 3. Use shorter texts for summarization
# 4. Check your API quota limits
```

#### "Invalid API key"
```bash
# Solution: Check environment variables
# 1. Verify API keys in backend/.env
# 2. Ensure keys are valid and have credits
# 3. Check for extra spaces or characters
```

#### "Network timeout"
```bash
# Solution: Check internet connection and retry
# 1. Verify internet connection
# 2. Try again in a few minutes
# 3. Use local models if available
```

### Voice Feature Issues

#### "Microphone access denied"
```bash
# Solution: Allow microphone permissions
# 1. Click microphone icon in browser address bar
# 2. Select "Allow" for microphone access
# 3. Refresh the page
```

#### "No speech detected"
```bash
# Solution: Check microphone settings
# 1. Ensure microphone is not muted
# 2. Try speaking louder or closer to microphone
# 3. Check browser console for errors
# 4. Use Chrome or Edge browser
```

#### "Voice features not working"
```bash
# Solution: Check browser compatibility
# 1. Use Chrome or Edge for best support
# 2. Ensure HTTPS connection (if applicable)
# 3. Update browser to latest version
# 4. Check Web Speech API support
```

### Export Issues

#### "Export failed"
```bash
# Solution: Check content and format
# 1. Ensure content is not empty
# 2. Try different export format
# 3. Check browser download settings
# 4. Clear browser cache
```

#### "File download not working"
```bash
# Solution: Check browser settings
# 1. Allow downloads in browser
# 2. Check download folder permissions
# 3. Try different browser
# 4. Check antivirus blocking downloads
```

## 🔍 Diagnostic Commands

### Environment Check
```bash
# Check Python version
python --version

# Check Node.js version
node --version

# Check if virtual environment is active
echo $VIRTUAL_ENV

# Check if backend dependencies are installed
source backend/venv/bin/activate
pip list | grep fastapi
```

### Service Status
```bash
# Check if backend is running
curl http://localhost:8000/health

# Check if frontend is running
curl http://localhost:3000

# Check if Ollama is running
curl http://localhost:11434/api/tags
```

### Network Issues
```bash
# Check if ports are in use
lsof -i :8000
lsof -i :3000
lsof -i :11434

# Check network connectivity
ping localhost
curl -I http://localhost:8000
```

## 🛠️ Advanced Troubleshooting

### Log Analysis

#### Backend Logs
```bash
# Check backend logs
cd backend
source venv/bin/activate
uvicorn main:app --reload --log-level debug
```

#### Frontend Logs
```bash
# Check browser console for errors
# Press F12 to open developer tools
# Look for errors in Console tab
```

#### System Logs
```bash
# Check system logs for errors
# macOS: Console.app
# Linux: journalctl -f
# Windows: Event Viewer
```

### Performance Issues

#### Slow Response Times
```bash
# Solution: Optimize model usage
# 1. Use smaller models for testing
# 2. Enable GPU acceleration if available
# 3. Close other applications
# 4. Check system resources
```

#### High Memory Usage
```bash
# Solution: Monitor and optimize
# 1. Use 3B models instead of 7B
# 2. Close other applications
# 3. Restart services periodically
# 4. Monitor with htop or Activity Monitor
```

### Data Issues

#### Prompt History Lost
```bash
# Solution: Check localStorage
# 1. Check browser localStorage in DevTools
# 2. Clear browser cache if needed
# 3. Export history before clearing
```

#### Settings Not Saved
```bash
# Solution: Check browser storage
# 1. Verify browser allows localStorage
# 2. Check for private/incognito mode
# 3. Clear browser cache and retry
```

## 📞 Getting Help

### Before Asking for Help

1. **Check this troubleshooting guide**
2. **Run diagnostic commands**
3. **Check browser console for errors**
4. **Verify environment setup**
5. **Try restarting services**

### Useful Information to Include

When reporting issues, include:
- **Operating System**: macOS, Windows, Linux
- **Browser**: Chrome, Firefox, Safari, Edge
- **Python Version**: `python --version`
- **Node.js Version**: `node --version`
- **Error Messages**: Exact error text
- **Steps to Reproduce**: Detailed steps
- **Expected vs Actual Behavior**: What you expected vs what happened

### Community Resources

- **GitHub Issues**: Report bugs and feature requests
- **Discussions**: Ask questions and share solutions
- **Documentation**: Check the docs folder for detailed guides
- **Examples**: Look at example configurations and usage 