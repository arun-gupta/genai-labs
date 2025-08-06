import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FileText, Settings, Send, Upload, Link, File, Globe, X, BarChart3, Languages, History, Zap, GitCompare } from 'lucide-react';
import { VoiceInput } from '../components/VoiceInput';
import { ModelSelector } from '../components/ModelSelector';
import { ResponseDisplay } from '../components/ResponseDisplay';
import { AnalyticsDisplay } from '../components/AnalyticsDisplay';
import { LanguageSelector } from '../components/LanguageSelector';
import { LanguageDetectionDisplay } from '../components/LanguageDetection';
import { OutputFormatSelector } from '../components/OutputFormatSelector';
import { PromptHistoryComponent } from '../components/PromptHistory';
import { ExportOptions } from '../components/ExportOptions';
import { ModelComparison } from '../components/ModelComparison';
import { apiService } from '../services/api';
import { storageUtils, PromptHistory } from '../utils/storage';
import { StreamChunk, SummaryType, SupportedFileType, AnalyticsResponse, LanguageDetection } from '../types/api';

export const SummarizePage: React.FC = () => {
  const [inputType, setInputType] = useState<'text' | 'url' | 'file'>('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedProvider, setSelectedProvider] = useState('ollama');
  const [selectedModel, setSelectedModel] = useState('mistral:7b');
  const [maxLength, setMaxLength] = useState(150);
  const [temperature, setTemperature] = useState(0.3);
  const [summaryType, setSummaryType] = useState('general');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [tokenUsage, setTokenUsage] = useState<any>(null);
  const [latencyMs, setLatencyMs] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<any>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse['analytics'] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'response' | 'analytics' | 'comparison'>('response');
  const [originalText, setOriginalText] = useState<string>('');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [translateOutput, setTranslateOutput] = useState(false);
  const [outputFormat, setOutputFormat] = useState<'text' | 'json' | 'xml' | 'markdown' | 'csv' | 'yaml' | 'html' | 'bullet_points' | 'numbered_list' | 'table'>('text');
  const [languageDetection, setLanguageDetection] = useState<LanguageDetection | null>(null);
  const [isDetectingLanguage, setIsDetectingLanguage] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResults, setComparisonResults] = useState<any>(null);
  const [selectedModels, setSelectedModels] = useState<Array<{ provider: string; model: string }>>([]);
  const [showComparison, setShowComparison] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default model combinations for quick comparison (static like GeneratePage)
  const defaultModelCombinations = [
    {
      name: "Compare All Local Models",
      description: "Compare all available Ollama models",
      models: [] // Will be populated dynamically
    },
    {
      name: "Local vs Cloud",
      description: "Compare local Ollama model with cloud models",
      models: [
        { provider: "ollama", model: "mistral:7b" },
        { provider: "openai", model: "gpt-3.5-turbo" },
        { provider: "anthropic", model: "claude-3-haiku-20240307" }
      ]
    },
    {
      name: "Efficient Models",
      description: "Compare lightweight models for speed",
      models: [
        { provider: "ollama", model: "mistral:7b" },
        { provider: "openai", model: "gpt-3.5-turbo" },
        { provider: "anthropic", model: "claude-3-haiku-20240307" }
      ]
    },
    {
      name: "High Performance",
      description: "Compare high-quality models for accuracy",
      models: [
        { provider: "ollama", model: "mistral:7b" },
        { provider: "openai", model: "gpt-4" },
        { provider: "anthropic", model: "claude-3-sonnet-20240229" }
      ]
    },
    {
      name: "Reasoning & Analysis",
      description: "Compare models with advanced reasoning and analysis capabilities",
      models: [
        { provider: "ollama", model: "gpt-oss:20b" },
        { provider: "openai", model: "gpt-4" },
        { provider: "anthropic", model: "claude-3-sonnet-20240229" }
      ]
    }
  ];

  // Load available models
  useEffect(() => {
    const loadAvailableModels = async () => {
      try {
        const models = await apiService.getAvailableModels();
        setAvailableModels(models);
      } catch (err) {
        console.error('Error loading models:', err);
      }
    };
    loadAvailableModels();
  }, []);

  // Get all available Ollama models for comparison (same pattern as GeneratePage)
  const getAllLocalModels = useMemo(() => {
    if (!availableModels?.ollama_models?.models || !Array.isArray(availableModels.ollama_models.models)) {
      return [];
    }
    
    return availableModels.ollama_models.models
      .filter((model: any) => model.is_available)
      .map((model: any) => ({
        provider: 'ollama',
        model: model.name
      }));
  }, [availableModels]);

  // Get model count for any combination (same pattern as GeneratePage)
  const getModelCount = useMemo(() => {
    return (combination: any) => {
      if (combination.name === "Compare All Local Models") {
        return getAllLocalModels.length;
      }
      return combination.models.length;
    };
  }, [getAllLocalModels]);

  // Language detection effect
  useEffect(() => {
    if (inputType === 'text' && text.length > 10) {
      const timeoutId = setTimeout(() => {
        detectLanguage(text);
      }, 1000); // Debounce for 1 second
      
      return () => clearTimeout(timeoutId);
    }
  }, [text, inputType]);

  const detectLanguage = async (text: string) => {
    if (!text.trim() || text.length < 10) return;
    
    setIsDetectingLanguage(true);
    try {
      const response = await apiService.detectLanguage(text);
      setLanguageDetection(response.detection);
    } catch (err) {
      console.error('Error detecting language:', err);
    } finally {
      setIsDetectingLanguage(false);
    }
  };

  const handleOutputFormatChange = (format: string) => {
    setOutputFormat(format as 'text' | 'json' | 'xml' | 'markdown' | 'csv' | 'yaml' | 'html' | 'bullet_points' | 'numbered_list' | 'table');
  };

  const handleLoadFromHistory = (systemPrompt: string, userPrompt: string) => {
    // For summarize page, we can load the text input from history
    if (userPrompt.startsWith('Summarize: ')) {
      const textToSummarize = userPrompt.replace('Summarize: ', '');
      setText(textToSummarize);
      setInputType('text');
    }
    setShowHistory(false);
  };

  const handleVoiceInput = (transcript: string) => {
    setText(prev => prev + (prev ? ' ' : '') + transcript);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSummarize();
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
      return false;
    }
    if (inputType === 'url' && !url.trim()) {
      return false;
    }
    if (inputType === 'file' && !selectedFile) {
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
    setAnalytics(null);
    
    // Store original text for analytics
    if (inputType === 'text') {
      setOriginalText(text);
    } else if (inputType === 'url') {
      setOriginalText(`URL: ${url}`);
    } else if (inputType === 'file' && selectedFile) {
      setOriginalText(`File: ${selectedFile.name}`);
    }

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
          target_language: targetLanguage,
          translate_summary: translateOutput,
          output_format: outputFormat as any,
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

      // Generate analytics
      await generateAnalytics();

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

  const generateAnalytics = async () => {
    if (!summary) return;
    
    setIsAnalyzing(true);
    try {
      // Get the actual original text for analytics
      let originalTextForAnalytics = '';
      if (inputType === 'text') {
        originalTextForAnalytics = text;
      } else if (inputType === 'url') {
        // For URL, we'll use a placeholder since we don't have the scraped content
        originalTextForAnalytics = `Content from URL: ${url}`;
      } else if (inputType === 'file' && selectedFile) {
        // For file, we'll use a placeholder since we don't have the extracted content
        originalTextForAnalytics = `Content from file: ${selectedFile.name}`;
      }
      
      if (originalTextForAnalytics && originalTextForAnalytics.length > 10) {
        const analyticsResponse = await apiService.analyzeSummary({
          original_text: originalTextForAnalytics,
          summary_text: summary
        });
        setAnalytics(analyticsResponse.analytics);
      } else {
        // Show a message that analytics requires more content
        console.log('Analytics requires more original content to be meaningful');
      }
    } catch (err) {
      console.error('Error generating analytics:', err);
      // Don't show error to user as analytics is not critical
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleModelComparison = async () => {
    if (!validateInput()) return;
    
    setIsComparing(true);
    setError(null);
    setComparisonResults(null);
    setShowComparison(true);
    setActiveTab('comparison'); // Switch to comparison tab immediately
    
    const startTime = Date.now();
    const minDisplayTime = 3000; // Minimum 3 seconds to show progress indicators
    
    try {
      const request: any = {
        models: selectedModels,
        max_length: maxLength,
        temperature: temperature,
        summary_type: summaryType
      };
      
      if (inputType === 'text') {
        request.text = text;
      } else if (inputType === 'url') {
        request.url = url;
      } else if (inputType === 'file' && selectedFile) {
        request.file_content = selectedFile;
      }
      
      const result = await apiService.compareSummarizationModels(request);
      
      if (result && result.results && result.results.length > 0) {
        setComparisonResults(result);
        
        // Ensure progress indicators are shown for at least minDisplayTime
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minDisplayTime - elapsedTime);
        
        setTimeout(() => {
          setIsComparing(false);
        }, remainingTime);
        
      } else {
        setError('Invalid response from comparison API');
        setIsComparing(false);
      }
      
    } catch (err) {
      setError(`Model comparison failed: ${err}`);
      setIsComparing(false);
    }
  };

  const getExportContent = () => {
    return {
      system_prompt: `Summarize the following text as a ${summaryType} summary with maximum ${maxLength} words.`,
      user_prompt: inputType === 'text' ? text : inputType === 'url' ? url : selectedFile?.name || '',
      generated_content: summary,
      metadata: {
        model_provider: selectedProvider,
        model_name: selectedModel,
        timestamp: new Date().toISOString(),
        token_usage: tokenUsage,
        latency_ms: latencyMs,
      },
      analytics: analytics,
    };
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Text Summarization</h1>
        <p className="text-gray-600">Create concise summaries from text, URLs, or documents</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Panel - Settings */}
        <div className="xl:col-span-1 space-y-6">
          {/* Model Selection */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="text-blue-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Model</h2>
            </div>
            <ModelSelector
              selectedProvider={selectedProvider}
              selectedModel={selectedModel}
              onProviderChange={setSelectedProvider}
              onModelChange={setSelectedModel}
              disabled={isSummarizing}
            />
          </div>

                    {/* Summary Settings */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Settings className="text-gray-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Summary Settings</h2>
            </div>
            
            <div className="space-y-4">
              {/* Summary Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Summary Type</label>
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

              {/* Max Length */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">Max Length</label>
                  <span className="text-xs text-gray-500">{maxLength} words</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="500"
                  value={maxLength}
                  onChange={(e) => setMaxLength(parseInt(e.target.value))}
                  disabled={isSummarizing}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Short</span>
                  <span>Long</span>
                </div>
              </div>

              {/* Temperature */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">Creativity</label>
                  <span className="text-xs text-gray-500">{temperature}</span>
                </div>
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
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Focused</span>
                  <span>Creative</span>
                </div>
              </div>

              {/* Output Format */}
              <div>
                <OutputFormatSelector
                  selectedFormat={outputFormat}
                  onFormatChange={handleOutputFormatChange}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Language Settings */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Languages className="text-blue-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Language</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="translate-output"
                  checked={translateOutput}
                  onChange={(e) => setTranslateOutput(e.target.checked)}
                  disabled={isSummarizing}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="translate-output" className="text-sm text-gray-700">
                  Translate output
                </label>
              </div>
              
              {translateOutput && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Language</label>
                  <LanguageSelector
                    selectedLanguage={targetLanguage}
                    onLanguageChange={setTargetLanguage}
                    placeholder="Select target language..."
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>

          {/* History */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <History className="text-blue-600" size={20} />
                <h2 className="text-lg font-semibold text-gray-900">History</h2>
              </div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
              >
                {showHistory ? 'Hide' : 'Show'}
              </button>
            </div>
            
            {showHistory && (
              <PromptHistoryComponent
                onLoadPrompt={handleLoadFromHistory}
                className="w-full"
              />
            )}
          </div>

          {/* Model Comparison Settings */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <GitCompare className="text-purple-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Model Comparison</h2>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-3">Select models to compare for summarization performance</p>
              
              {/* Preset Combinations */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Combinations</h4>
                <div className="space-y-2">
                  {defaultModelCombinations.map((combination, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (combination.name === "Compare All Local Models") {
                          setSelectedModels(getAllLocalModels);
                        } else {
                          setSelectedModels(combination.models);
                        }
                      }}
                      disabled={isComparing}
                      className="w-full text-left p-2 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors disabled:opacity-50"
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {combination.name}
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {getModelCount(combination)} models
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">{combination.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3">Or select models manually:</p>
              
              {availableModels?.providers?.map((provider: any) => (
                <div key={provider.id} className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">{provider.name}</h4>
                  <div className="space-y-1">
                    {provider.models?.slice(0, 3).map((model: string) => (
                      <label key={model} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedModels.some(m => m.provider === provider.id && m.model === model)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedModels(prev => [...prev, { provider: provider.id, model }]);
                            } else {
                              setSelectedModels(prev => prev.filter(m => !(m.provider === provider.id && m.model === model)));
                            }
                          }}
                          disabled={isComparing}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">{model}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )) || (
                <div className="text-sm text-gray-500">
                  Loading available models...
                </div>
              )}
              
              {selectedModels.length > 0 && (
                <div className="mt-3 p-2 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-purple-700">
                      Selected: {selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''}
                    </p>
                    <button
                      onClick={() => setSelectedModels([])}
                      className="text-xs text-purple-600 hover:text-purple-800 hover:bg-purple-100 px-2 py-1 rounded transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center Panel - Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Input Source */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Input Source</h2>
            </div>
            
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
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Text to Summarize
                  </label>
                  <VoiceInput
                    onTranscript={handleVoiceInput}
                    disabled={isSummarizing}
                    className="text-xs"
                  />
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={isSummarizing}
                  className="input-field h-80 resize-none"
                  placeholder="Paste or type the text you want to summarize here, or use voice input..."
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
                
                {/* Language Detection Display */}
                {(languageDetection || isDetectingLanguage) && (
                  <div className="mt-3">
                    <LanguageDetectionDisplay
                      detection={languageDetection}
                      isLoading={isDetectingLanguage}
                    />
                  </div>
                )}
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

            <div className="flex justify-between items-center mt-4">
              <div className="flex space-x-2">
                <button
                  onClick={handleSummarize}
                  disabled={isSummarizing || !validateInput()}
                  className="btn-primary flex items-center space-x-2"
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
                
                <button
                  onClick={handleModelComparison}
                  disabled={isComparing || !validateInput() || selectedModels.length < 2}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isComparing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Comparing...</span>
                    </>
                  ) : (
                    <>
                      <GitCompare size={16} />
                      <span>Compare Models</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mt-2 text-xs text-gray-500 text-center">
              Press Cmd/Ctrl + Enter to summarize • Select 2+ models to compare
            </div>
          </div>

          {/* Response Section with Tabs */}
          <div className="card">
            {/* Tab Navigation */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setActiveTab('response')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'response'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FileText size={16} />
                <span>Response</span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <BarChart3 size={16} />
                <span>Analytics</span>
              </button>
              <button
                onClick={() => setActiveTab('comparison')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'comparison'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <GitCompare size={16} />
                <span>Comparison</span>
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'response' && (
              <div className="space-y-6">
                <ResponseDisplay
                  content={summary}
                  isStreaming={isSummarizing}
                  tokenUsage={tokenUsage}
                  latencyMs={latencyMs}
                  modelName={selectedModel}
                  modelProvider={selectedProvider}
                />
                
                {summary && (
                  <ExportOptions
                    content={getExportContent()}
                    className="w-full"
                  />
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <AnalyticsDisplay
                analytics={analytics}
                isLoading={isAnalyzing}
              />
            )}

            {activeTab === 'comparison' && (
              <div className="space-y-6">
                {isComparing || comparisonResults ? (
                  <ModelComparison
                    results={comparisonResults?.results || []}
                    metrics={comparisonResults?.comparison_metrics || {}}
                    recommendations={comparisonResults?.recommendations || []}
                    isComparing={isComparing}
                    comparisonType="summarization"
                    selectedModels={selectedModels.map(m => `${m.provider}/${m.model}`)}
                  />
                ) : (
                  <div className="text-center py-12">
                    <GitCompare className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Model Comparison Results</h3>
                    <p className="text-gray-600 mb-4 max-w-md mx-auto">
                      Compare how different AI models summarize the same content to find the best one for your needs.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 