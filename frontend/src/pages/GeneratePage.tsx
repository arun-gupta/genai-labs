import React, { useState, useEffect } from 'react';
import { Send, Settings, History, Languages, FileText, Zap, Mic, Volume2, Palette, ChevronDown, BarChart3, GitCompare } from 'lucide-react';
import { ModelSelector } from '../components/ModelSelector';
import { ResponseDisplay } from '../components/ResponseDisplay';
import { LanguageSelector } from '../components/LanguageSelector';
import { LanguageDetectionDisplay } from '../components/LanguageDetection';
import { OutputFormatSelector } from '../components/OutputFormatSelector';
import { GenerationAnalyticsDisplay } from '../components/GenerationAnalyticsDisplay';
import { PromptTemplateSelector } from '../components/PromptTemplateSelector';
import { MultipleCandidatesSelector } from '../components/MultipleCandidatesSelector';
import { VoiceInput } from '../components/VoiceInput';
import { VoiceOutput } from '../components/VoiceOutput';
import { PromptHistoryComponent } from '../components/PromptHistory';
import { ExportOptions } from '../components/ExportOptions';
import { ModelComparison } from '../components/ModelComparison';
import { apiService } from '../services/api';
import { storageUtils, PromptHistory } from '../utils/storage';
import { StreamChunk, LanguageDetection } from '../types/api';

export const GeneratePage: React.FC = () => {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('ollama');
  const [selectedModel, setSelectedModel] = useState('mistral:7b');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState<number | undefined>(1000);
  const [isGenerating, setIsGenerating] = useState(false);
  const [response, setResponse] = useState('');
  const [tokenUsage, setTokenUsage] = useState<any>(null);
  const [latencyMs, setLatencyMs] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [translateOutput, setTranslateOutput] = useState(false);
  const [outputFormat, setOutputFormat] = useState<'text' | 'json' | 'xml' | 'markdown' | 'csv' | 'yaml' | 'html' | 'bullet_points' | 'numbered_list' | 'table'>('text');
  const [numCandidates, setNumCandidates] = useState(1);
  const [selectedWritingStyle, setSelectedWritingStyle] = useState('none');
  const [languageDetection, setLanguageDetection] = useState<LanguageDetection | null>(null);
  const [isDetectingLanguage, setIsDetectingLanguage] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'response' | 'analytics' | 'comparison'>('response');
  const [candidates, setCandidates] = useState<string[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<number>(0);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResults, setComparisonResults] = useState<any>(null);
  const [selectedModels, setSelectedModels] = useState<Array<{ provider: string; model: string }>>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [availableModels, setAvailableModels] = useState<any>(null);

  // Default model combinations for quick comparison
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
      } catch (error) {
        console.error('Failed to load available models:', error);
      }
    };
    
    loadAvailableModels();
  }, []);

  // Get all available Ollama models for the "Compare All Local Models" preset
  const getAllLocalModels = () => {
    if (!availableModels) return [];
    
    return availableModels
      .filter((model: any) => model.provider === 'ollama' && model.is_available)
      .map((model: any) => ({
        provider: model.provider,
        model: model.name
      }));
  };

  // Language detection effect
  useEffect(() => {
    const detectLanguage = async () => {
      if (!userPrompt.trim()) {
        setLanguageDetection(null);
        return;
      }

      setIsDetectingLanguage(true);
      try {
        const result = await apiService.detectLanguage(userPrompt);
        setLanguageDetection(result.detection);
      } catch (error) {
        console.error('Language detection failed:', error);
        setLanguageDetection(null);
      } finally {
        setIsDetectingLanguage(false);
      }
    };

    // Debounce language detection
    const timeoutId = setTimeout(detectLanguage, 1000);
    return () => clearTimeout(timeoutId);
  }, [userPrompt]);

  const handleGenerate = async () => {
    if (!userPrompt.trim()) {
      setError('Please enter a user prompt');
      return;
    }

    setIsGenerating(true);
    setResponse('');
    setCandidates([]);
    setSelectedCandidate(0);
    setError(null);
    setTokenUsage(null);
    setLatencyMs(undefined);

    try {
      let finalResponse = '';
      
      await apiService.generateTextStream(
        {
          system_prompt: systemPrompt,
          user_prompt: userPrompt,
          model_provider: selectedProvider as any,
          model_name: selectedModel,
          temperature,
          max_tokens: maxTokens,
          stream: true,
          target_language: targetLanguage,
          translate_response: translateOutput,
          output_format: outputFormat,
          num_candidates: numCandidates,
        },
        (chunk: StreamChunk) => {
          if (chunk.is_complete && numCandidates > 1) {
            // Handle multiple candidates
            try {
              const candidatesArray = JSON.parse(chunk.content);
              setCandidates(candidatesArray);
              setResponse(candidatesArray[0] || '');
              setSelectedCandidate(0);
            } catch (e) {
              // Fallback to single response
              setResponse(chunk.content);
              setCandidates([chunk.content]);
              setSelectedCandidate(0);
            }
          } else {
            setResponse(prev => prev + chunk.content);
          }
          finalResponse += chunk.content;
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

      // Generate analytics with the complete response
      await generateAnalytics(finalResponse);

      // Save to history
      const historyItem: PromptHistory = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: 'generate',
        system_prompt: systemPrompt,
        user_prompt: userPrompt,
        model_provider: selectedProvider,
        model_name: selectedModel,
        response: response,
        token_usage: tokenUsage,
        latency_ms: latencyMs || 0,
      };
      storageUtils.addPromptToHistory(historyItem);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAnalytics = async (generatedText?: string) => {
    const textToAnalyze = generatedText || response;
    if (!textToAnalyze) return;
    
    setIsAnalyzing(true);
    try {
      const analyticsResponse = await apiService.analyzeGeneration({
        system_prompt: systemPrompt,
        user_prompt: userPrompt,
        generated_text: textToAnalyze,
        output_format: outputFormat
      });
      setAnalytics(analyticsResponse.analytics);
    } catch (err) {
      console.error('Error generating analytics:', err);
      // Don't show error to user as analytics is not critical
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleGenerate();
    }
  };

  const handleTemplateSelect = (systemPrompt: string, userPrompt: string) => {
    setSystemPrompt(systemPrompt);
    setUserPrompt(userPrompt);
  };

  const handleWritingStyleChange = (style: string) => {
    setSelectedWritingStyle(style);
    if (style === 'none') {
      setSystemPrompt('');
    }
  };

  const handleVoiceInput = (transcript: string) => {
    setUserPrompt(prev => prev + (prev ? ' ' : '') + transcript);
  };

  const handleOutputFormatChange = (format: string) => {
    setOutputFormat(format as 'text' | 'json' | 'xml' | 'markdown' | 'csv' | 'yaml' | 'html' | 'bullet_points' | 'numbered_list' | 'table');
  };

  const handleClearTemplate = () => {
    setSystemPrompt('');
    setUserPrompt('');
  };

  const handleCandidateSelect = (index: number) => {
    setSelectedCandidate(index);
    setResponse(candidates[index] || '');
  };

  const handleLoadFromHistory = (systemPrompt: string, userPrompt: string) => {
    setSystemPrompt(systemPrompt);
    setUserPrompt(userPrompt);
    setShowHistory(false);
  };

  const handleModelComparison = async () => {
    if (!userPrompt.trim()) {
      setError('Please enter a user prompt');
      return;
    }
    
    if (selectedModels.length < 2) {
      setError('Please select at least 2 models for comparison');
      return;
    }
    
    setIsComparing(true);
    setError(null);
    setComparisonResults(null);
    
    try {
      const result = await apiService.compareGenerationModels({
        system_prompt: systemPrompt,
        user_prompt: userPrompt,
        models: selectedModels,
        temperature: temperature,
        max_tokens: maxTokens,
        target_language: targetLanguage,
        translate_response: translateOutput,
        output_format: outputFormat
      });
      
      setComparisonResults(result);
      setShowComparison(true);
      setActiveTab('comparison'); // Automatically switch to comparison tab
    } catch (err) {
      setError(`Model comparison failed: ${err}`);
    } finally {
      setIsComparing(false);
    }
  };

  const getExportContent = () => {
    return {
      system_prompt: systemPrompt,
      user_prompt: userPrompt,
      generated_content: response,
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Text Generation</h1>
        <p className="text-gray-600">
          Create compelling content with AI-powered text generation
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Panel - Input & Settings */}
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
              disabled={isGenerating}
            />
          </div>

          {/* Writing Style */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Palette className="text-purple-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Writing Style</h2>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-gray-700">
                  {selectedWritingStyle === 'none' ? 'Default Style' : selectedWritingStyle.charAt(0).toUpperCase() + selectedWritingStyle.slice(1)}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showAdvancedSettings ? 'rotate-180' : ''}`} />
              </button>
              
              {showAdvancedSettings && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {[
                    { id: 'none', name: 'Default Style', icon: '⚪' },
                    { id: 'creative', name: 'Creative', icon: '🎨' },
                    { id: 'business', name: 'Business', icon: '💼' },
                    { id: 'academic', name: 'Academic', icon: '📚' },
                    { id: 'technical', name: 'Technical', icon: '⚙️' },
                    { id: 'conversational', name: 'Conversational', icon: '💬' },
                    { id: 'poetic', name: 'Poetic', icon: '📝' },
                    { id: 'storytelling', name: 'Storytelling', icon: '📖' },
                    { id: 'persuasive', name: 'Persuasive', icon: '🎯' },
                    { id: 'minimalist', name: 'Minimalist', icon: '✨' },
                    { id: 'formal', name: 'Formal', icon: '🎩' },
                    { id: 'humorous', name: 'Humorous', icon: '😄' },
                    { id: 'journalistic', name: 'Journalistic', icon: '📰' }
                  ].map(style => (
                    <div
                      key={style.id}
                      onClick={() => {
                        handleWritingStyleChange(style.id);
                        setShowAdvancedSettings(false);
                      }}
                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <span className="text-lg">{style.icon}</span>
                      <span className="font-medium text-gray-900">{style.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Settings */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Settings className="text-gray-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Quick Settings</h2>
            </div>
            
            <div className="space-y-4">
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
                  disabled={isGenerating}
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

              {/* Multiple Candidates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Response Variations</label>
                <MultipleCandidatesSelector
                  numCandidates={numCandidates}
                  onNumCandidatesChange={setNumCandidates}
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
                  disabled={isGenerating}
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

          {/* Model Comparison Settings */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <GitCompare className="text-purple-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Model Comparison</h2>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-3">
                Select models to compare for text generation performance
              </p>
              
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
              ))}
              
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

              {/* Default Model Combinations */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Combinations</h4>
                <div className="space-y-2">
                  {defaultModelCombinations.map((combination, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (combination.name === "Compare All Local Models") {
                          setSelectedModels(getAllLocalModels());
                        } else {
                          setSelectedModels(combination.models);
                        }
                      }}
                      disabled={isComparing || (combination.name === "Compare All Local Models" && getAllLocalModels().length === 0)}
                      className="w-full text-left p-2 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors disabled:opacity-50"
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {combination.name}
                        {combination.name === "Compare All Local Models" && getAllLocalModels().length > 0 && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {getAllLocalModels().length} models
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600">{combination.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Prompt Templates */}
          <div className="card">
            <PromptTemplateSelector
              onTemplateSelect={handleTemplateSelect}
              onClearTemplate={handleClearTemplate}
              currentSystemPrompt={systemPrompt}
              currentUserPrompt={userPrompt}
              className="w-full"
            />
          </div>

          {/* History */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <History className="text-blue-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">History</h3>
              </div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
              >
                {showHistory ? 'Hide' : 'Show'} History
              </button>
            </div>
            
            {showHistory && (
              <PromptHistoryComponent
                onLoadPrompt={handleLoadFromHistory}
                className="w-full"
              />
            )}
          </div>
        </div>

        {/* Center Panel - Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Prompts */}
          <div className="card">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Prompts</h2>
            </div>
            
            <div className="space-y-4">
              {/* System Prompt */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">System Prompt (Optional)</label>
                  <VoiceInput
                    onTranscript={(transcript) => setSystemPrompt(prev => prev + (prev ? ' ' : '') + transcript)}
                    disabled={isGenerating}
                    className="text-xs"
                  />
                </div>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  disabled={isGenerating}
                  className="input-field h-20 resize-none"
                  placeholder="You are a helpful assistant that..."
                  onKeyDown={handleKeyPress}
                />
              </div>

              {/* User Prompt */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">User Prompt *</label>
                  <VoiceInput
                    onTranscript={handleVoiceInput}
                    disabled={isGenerating}
                    className="text-xs"
                  />
                </div>
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  disabled={isGenerating}
                  className="input-field h-32 resize-none"
                  placeholder="Enter your prompt here or use voice input..."
                  onKeyDown={handleKeyPress}
                />
                
                {/* Sample Prompts */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600">Sample Prompts</span>
                    <button
                      onClick={() => setUserPrompt('')}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setUserPrompt('Write a professional email to schedule a meeting with a client next week.')}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                    >
                      📧 Email
                    </button>
                    <button
                      onClick={() => setUserPrompt('Create a detailed project plan for launching a new mobile app.')}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                    >
                      📋 Project Plan
                    </button>
                    <button
                      onClick={() => setUserPrompt('Write a compelling product description for a smart home device.')}
                      className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
                    >
                      🛍️ Product
                    </button>
                    <button
                      onClick={() => setUserPrompt('Explain quantum computing in simple terms for a high school student.')}
                      className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition-colors"
                    >
                      🧠 Explain
                    </button>
                    <button
                      onClick={() => setUserPrompt('Write a creative story about a time traveler who visits ancient Rome.')}
                      className="px-3 py-1 text-xs bg-pink-100 text-pink-700 rounded-full hover:bg-pink-200 transition-colors"
                    >
                      📚 Story
                    </button>
                    <button
                      onClick={() => setUserPrompt('Create a step-by-step guide for beginners to learn Python programming.')}
                      className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors"
                    >
                      💻 Tutorial
                    </button>
                    <button
                      onClick={() => setUserPrompt('Write a persuasive argument for why renewable energy is the future.')}
                      className="px-3 py-1 text-xs bg-teal-100 text-teal-700 rounded-full hover:bg-teal-200 transition-colors"
                    >
                      🌱 Argument
                    </button>
                    <button
                      onClick={() => setUserPrompt('Create a comprehensive workout plan for building muscle and strength.')}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                    >
                      💪 Fitness
                    </button>
                  </div>
                </div>
                
                {/* Language Detection */}
                {userPrompt.trim() && (
                  <div className="mt-2">
                    <LanguageDetectionDisplay
                      detection={languageDetection}
                      isLoading={isDetectingLanguage}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

                        {/* Generate and Compare Buttons */}
            <div className="flex justify-between items-center mt-4">
              <div className="flex space-x-2">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !userPrompt.trim()}
                  className="btn-primary flex items-center space-x-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Generate</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleModelComparison}
                  disabled={isComparing || !userPrompt.trim() || selectedModels.length < 2}
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
              
              {/* Debug info for button */}
              <div className="text-xs text-gray-500">
                <p>Selected models: {selectedModels.length}</p>
                <p>Button enabled: {selectedModels.length >= 2 ? 'Yes' : 'No'}</p>
              </div>
            </div>

            <div className="mt-2 text-xs text-gray-500 text-center">
              Press Cmd/Ctrl + Enter to generate • Select 2+ models to compare
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
                  content={response}
                  isStreaming={isGenerating}
                  tokenUsage={tokenUsage}
                  latencyMs={latencyMs}
                  modelName={selectedModel}
                  modelProvider={selectedProvider}
                />
                
                {response && (
                  <ExportOptions
                    content={getExportContent()}
                    className="w-full"
                  />
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <GenerationAnalyticsDisplay
                analytics={analytics}
                isLoading={isAnalyzing}
              />
            )}

            {activeTab === 'comparison' && (
              <div className="space-y-6">
                {comparisonResults ? (
                  <ModelComparison
                    results={comparisonResults.results}
                    metrics={comparisonResults.comparison_metrics}
                    recommendations={comparisonResults.recommendations}
                    isComparing={isComparing}
                    comparisonType="generation"
                    selectedModels={selectedModels.map(m => `${m.provider}/${m.model}`)}
                  />
                ) : (
                  <div className="text-center py-12">
                    <GitCompare className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Model Comparison Results</h3>
                    <p className="text-gray-600 mb-4 max-w-md mx-auto">
                      Compare how different AI models handle the same prompt to find the best one for your needs.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                      <h4 className="font-medium text-blue-900 mb-2">How to compare models:</h4>
                      <ol className="text-sm text-blue-800 space-y-1 text-left">
                        <li>1. Enter your prompt in the text area above</li>
                        <li>2. Select 2 or more models in the Model Comparison section</li>
                        <li>3. Click "Compare Models" to see results</li>
                        <li>4. View quality scores, speed, and recommendations</li>
                      </ol>
                    </div>
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