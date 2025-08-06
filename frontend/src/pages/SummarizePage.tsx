import React, { useState, useEffect } from 'react';
import { FileText, Settings, Send, Upload, Link, File, Globe, X, BarChart3, Languages, History, Zap, GitCompare } from 'lucide-react';
import { ModelSelector } from '../components/ModelSelector';
import { ModelComparison } from '../components/ModelComparison';
import { ResponseDisplay } from '../components/ResponseDisplay';
import { AnalyticsDisplay } from '../components/AnalyticsDisplay';
import { apiService } from '../services/api';

export const SummarizePage: React.FC = () => {
  const [text, setText] = useState('');
  const [availableModels, setAvailableModels] = useState<any>(null);
  const [selectedProvider, setSelectedProvider] = useState('ollama');
  const [selectedModel, setSelectedModel] = useState('mistral:7b');
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResults, setComparisonResults] = useState<any>(null);
  const [selectedModels, setSelectedModels] = useState<Array<{ provider: string; model: string }>>([]);
  
  // Adding back more complex state
  const [inputType, setInputType] = useState<'text' | 'url' | 'file'>('text');
  const [url, setUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [maxLength, setMaxLength] = useState(150);
  const [temperature, setTemperature] = useState(0.3);
  const [summaryType, setSummaryType] = useState('general');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [tokenUsage, setTokenUsage] = useState<any>(null);
  const [latencyMs, setLatencyMs] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'response' | 'analytics' | 'comparison'>('response');
  const [originalText, setOriginalText] = useState<string>('');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [translateOutput, setTranslateOutput] = useState(false);
  const [outputFormat, setOutputFormat] = useState<'text' | 'json' | 'xml' | 'markdown' | 'csv' | 'yaml' | 'html' | 'bullet_points' | 'numbered_list' | 'table'>('text');
  const [languageDetection, setLanguageDetection] = useState<any>(null);
  const [isDetectingLanguage, setIsDetectingLanguage] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Static preset combinations (no dynamic useMemo)
  const defaultModelCombinations = [
    {
      name: "Local vs Cloud",
      description: "Compare local Ollama model with cloud models",
      models: [
        { provider: "ollama", model: "mistral:7b" },
        { provider: "openai", model: "gpt-3.5-turbo" }
      ]
    },
    {
      name: "Fast vs Accurate",
      description: "Compare speed vs accuracy",
      models: [
        { provider: "ollama", model: "qwen3:8b" },
        { provider: "openai", model: "gpt-4" }
      ]
    }
  ];

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

  // Adding back the language detection effect
  useEffect(() => {
    if (inputType === 'text' && text.length > 10) {
      const timeoutId = setTimeout(() => {
        // Simulate language detection
        setIsDetectingLanguage(true);
        setTimeout(() => {
          setLanguageDetection({ language: 'en', confidence: 0.95 });
          setIsDetectingLanguage(false);
        }, 1000);
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [text, inputType]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Text Summarization</h1>
        <p className="text-gray-600">
          Create concise summaries from text, URLs, or documents
        </p>
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
                  <option value="general">General Summary</option>
                  <option value="bullet_points">Bullet Points</option>
                  <option value="key_points">Key Points</option>
                  <option value="extractive">Extractive</option>
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
            </div>
          </div>

          {/* Model Comparison Settings */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <GitCompare className="text-purple-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Model Comparison</h2>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-3">
                Select models to compare for summarization performance
              </p>
              
              {/* Preset Combinations */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Combinations</h4>
                <div className="space-y-2">
                  {defaultModelCombinations.map((combination, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedModels(combination.models)}
                      disabled={isComparing}
                      className="w-full text-left p-2 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors disabled:opacity-50"
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {combination.name}
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {combination.models.length} models
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
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={isSummarizing}
                  className="input-field h-80 resize-none"
                  placeholder="Paste or type the text you want to summarize here..."
                />
                <div className="flex justify-between items-center mt-2">
                  <div className="text-sm text-gray-500">
                    {text.trim() ? text.trim().split(/\s+/).length : 0} words
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mt-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsSummarizing(!isSummarizing)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Send size={16} />
                  <span>Summarize</span>
                </button>
                
                <button
                  onClick={() => setIsComparing(!isComparing)}
                  disabled={selectedModels.length < 2}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <GitCompare size={16} />
                  <span>Compare Models</span>
                </button>
              </div>
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
                <ModelComparison
                  results={comparisonResults?.results || []}
                  metrics={comparisonResults?.comparison_metrics || {}}
                  recommendations={comparisonResults?.recommendations || []}
                  isComparing={isComparing}
                  comparisonType="summarization"
                  selectedModels={selectedModels.map(m => `${m.provider}/${m.model}`)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 