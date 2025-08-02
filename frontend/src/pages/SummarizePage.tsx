import React, { useState, useRef, useEffect } from 'react';
import { FileText, Settings, Send, Upload, Link, File, Globe, X } from 'lucide-react';
import { ModelSelector } from '../components/ModelSelector';
import { ResponseDisplay } from '../components/ResponseDisplay';
import { apiService } from '../services/api';
import { storageUtils, PromptHistory } from '../utils/storage';
import { StreamChunk, SummaryType, SupportedFileType } from '../types/api';

export const SummarizePage: React.FC = () => {
  const [inputType, setInputType] = useState<'text' | 'url' | 'file'>('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [maxLength, setMaxLength] = useState(150);
  const [temperature, setTemperature] = useState(0.3);
  const [summaryType, setSummaryType] = useState('general');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [tokenUsage, setTokenUsage] = useState<any>(null);
  const [latencyMs, setLatencyMs] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAvailableModels();
  }, []);

  const loadAvailableModels = async () => {
    try {
      const models = await apiService.getAvailableModels();
      setAvailableModels(models);
    } catch (err) {
      console.error('Error loading models:', err);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateInput = () => {
    if (inputType === 'text' && !text.trim()) {
      setError('Please enter text to summarize');
      return false;
    }
    if (inputType === 'url' && !url.trim()) {
      setError('Please enter a URL to summarize');
      return false;
    }
    if (inputType === 'file' && !selectedFile) {
      setError('Please select a file to summarize');
      return false;
    }
    return true;
  };

  const handleSummarize = async () => {
    if (!validateInput()) return;

    setIsSummarizing(true);
    setSummary('');
    setError(null);
    setTokenUsage(null);
    setLatencyMs(undefined);

    try {
      if (inputType === 'file' && selectedFile) {
        // Handle file upload
        const response = await apiService.summarizeFile(
          selectedFile,
          selectedProvider,
          selectedModel,
          maxLength,
          temperature,
          summaryType
        );
        
        setSummary(response.summary);
        setTokenUsage(response.token_usage);
        setLatencyMs(response.latency_ms);
      } else {
        // Handle text/URL with streaming
        const request = {
          text: inputType === 'text' ? text : undefined,
          url: inputType === 'url' ? url : undefined,
          model_provider: selectedProvider as any,
          model_name: selectedModel,
          max_length: maxLength,
          temperature: temperature,
          summary_type: summaryType as any,
          stream: true,
        };

        await apiService.summarizeTextStream(
          request,
          (chunk: StreamChunk) => {
            setSummary(prev => prev + chunk.content);
            if (chunk.token_usage) {
              setTokenUsage(chunk.token_usage);
            }
            if (chunk.latency_ms) {
              setLatencyMs(chunk.latency_ms);
            }
          },
          (error: string) => {
            setError(error);
          }
        );
      }

      // Save to history
      const historyItem: PromptHistory = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: 'summarize',
        text: inputType === 'text' ? text : inputType === 'url' ? url : selectedFile?.name || '',
        model_provider: selectedProvider,
        model_name: selectedModel,
        response: summary,
        token_usage: tokenUsage,
        latency_ms: latencyMs || 0,
      };
      storageUtils.addPromptToHistory(historyItem);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSummarize();
    }
  };

  const getInputContent = () => {
    if (inputType === 'text') return text;
    if (inputType === 'url') return url;
    if (inputType === 'file' && selectedFile) return selectedFile.name;
    return '';
  };

  const inputContent = getInputContent();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Text Summarization</h1>
        <p className="text-gray-600">
          Summarize text, URLs, or documents using different large language models
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Settings className="text-gray-500" size={20} />
              <h2 className="text-xl font-semibold text-gray-900">Configuration</h2>
            </div>
            
            <ModelSelector
              selectedProvider={selectedProvider}
              selectedModel={selectedModel}
              onProviderChange={setSelectedProvider}
              onModelChange={setSelectedModel}
              disabled={isSummarizing}
            />

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Length (words)
                </label>
                <input
                  type="number"
                  min="50"
                  max="500"
                  value={maxLength}
                  onChange={(e) => setMaxLength(parseInt(e.target.value))}
                  disabled={isSummarizing}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  disabled={isSummarizing}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 mt-1">{temperature}</div>
              </div>
            </div>

            {/* Summary Type Selector */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Summary Type
              </label>
              <select
                value={summaryType}
                onChange={(e) => setSummaryType(e.target.value)}
                disabled={isSummarizing}
                className="input-field"
              >
                {availableModels?.summary_types?.map((type: SummaryType) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                )) || (
                  <>
                    <option value="general">General Summary</option>
                    <option value="bullet_points">Bullet Points</option>
                    <option value="key_points">Key Points</option>
                    <option value="extractive">Extractive</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Input Source</h2>
            
            {/* Input Type Selector */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setInputType('text')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  inputType === 'text'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FileText size={16} />
                <span>Text</span>
              </button>
              <button
                onClick={() => setInputType('url')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  inputType === 'url'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Globe size={16} />
                <span>URL</span>
              </button>
              <button
                onClick={() => setInputType('file')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  inputType === 'file'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Upload size={16} />
                <span>File</span>
              </button>
            </div>

            {/* Text Input */}
            {inputType === 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text to Summarize
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={isSummarizing}
                  className="input-field h-64 resize-none"
                  placeholder="Paste or type the text you want to summarize here..."
                  onKeyDown={handleKeyPress}
                />
                <div className="flex justify-between items-center mt-2">
                  <div className="text-sm text-gray-500">
                    {text.trim() ? text.trim().split(/\s+/).length : 0} words
                  </div>
                  <button
                    onClick={() => setText(`Open Source has demonstrated that massive benefits accrue to everyone after removing the barriers to learning, using, sharing and improving software systems. These benefits are the result of using licenses that adhere to the Open Source Definition. For AI, society needs at least the same essential freedoms of Open Source to enable AI developers, deployers and end users to enjoy those same benefits: autonomy, transparency, frictionless reuse and collaborative improvement.

An Open Source AI is an AI system made available under terms and in a way that grant the freedoms to:
• Use the system for any purpose and without having to ask for permission.
• Study how the system works and inspect its components.
• Modify the system for any purpose, including to change its output.
• Share the system for others to use with or without modifications, for any purpose.`)}
                    disabled={isSummarizing}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium disabled:opacity-50"
                    title="Load sample text about Open Source AI"
                  >
                    Try Sample
                  </button>
                </div>
              </div>
            )}

            {/* URL Input */}
            {inputType === 'url' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL to Summarize
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={isSummarizing}
                    className="input-field flex-1"
                    placeholder="https://example.com/article"
                    onKeyDown={handleKeyPress}
                  />
                  <button
                    onClick={() => setUrl('https://opensource.org/ai/open-source-ai-definition')}
                    disabled={isSummarizing}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium disabled:opacity-50"
                    title="Try with Open Source AI Definition"
                  >
                    Try Sample
                  </button>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Enter a valid URL to scrape and summarize its content, or click "Try Sample" to test with the Open Source AI Definition
                </div>
              </div>
            )}

            {/* File Input */}
            {inputType === 'file' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File to Summarize
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {selectedFile ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center space-x-2">
                        <File className="text-green-500" size={20} />
                        <span className="font-medium text-gray-900">{selectedFile.name}</span>
                        <button
                          onClick={removeFile}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="text-sm text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="mx-auto text-gray-400" size={32} />
                      <div className="text-gray-600">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Click to upload
                        </button>
                        {' '}or drag and drop
                      </div>
                      <div className="text-xs text-gray-500">
                        Supports: TXT, PDF, DOCX, XLSX, MD files
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept=".txt,.pdf,.docx,.xlsx,.md"
                    className="hidden"
                  />
                </div>
                <div className="mt-3 text-center">
                  <a
                    href="/sample-document.txt"
                    download="sample-document.txt"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                  >
                    <File size={16} />
                    <span>Download Sample Document</span>
                  </a>
                  <div className="text-xs text-gray-500 mt-1">
                    Download a sample text file to test the file upload feature
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm font-medium mb-2">{error}</p>
                {error.includes("Rate limit") && (
                  <div className="text-red-500 text-xs space-y-1">
                    <p>💡 Tips to avoid rate limits:</p>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      <li>Try with a shorter text or document</li>
                      <li>Wait a few minutes before trying again</li>
                      <li>Use a different model (try Ollama for local processing)</li>
                      <li>Check your API key limits</li>
                    </ul>
                  </div>
                )}
                {error.includes("too long") && (
                  <div className="text-red-500 text-xs space-y-1">
                    <p>💡 Tips for long content:</p>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      <li>Split your text into smaller sections</li>
                      <li>Use the "extractive" summary type</li>
                      <li>Try with a shorter document</li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleSummarize}
              disabled={isSummarizing || !inputContent}
              className="mt-4 btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSummarizing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Summarizing...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Summarize</span>
                </>
              )}
            </button>

            <div className="mt-2 text-xs text-gray-500 text-center">
              Press Cmd/Ctrl + Enter to summarize
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div>
          <ResponseDisplay
            content={summary}
            isStreaming={isSummarizing}
            tokenUsage={tokenUsage}
            latencyMs={latencyMs}
            modelName={selectedModel}
            modelProvider={selectedProvider}
          />
        </div>
      </div>
    </div>
  );
}; 