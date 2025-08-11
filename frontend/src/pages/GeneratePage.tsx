import React, { useState, useEffect, useMemo } from 'react';
import { Send, Settings, History, Languages, FileText, Zap, Mic, Volume2, Palette, ChevronDown, BarChart3, GitCompare, X, Globe, Upload } from 'lucide-react';
import { ModelSelector } from '../components/ModelSelector';
import { ResponseDisplay } from '../components/ResponseDisplay';
import { LanguageSelector } from '../components/LanguageSelector';
import { LanguageDetectionDisplay } from '../components/LanguageDetection';
import { OutputFormatSelector } from '../components/OutputFormatSelector';
import { GenerationAnalyticsDisplay } from '../components/GenerationAnalyticsDisplay';

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
  const [inputType, setInputType] = useState<'text' | 'url' | 'file'>('text');
  const [candidates, setCandidates] = useState<string[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<number>(0);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResults, setComparisonResults] = useState<any>(null);
  const [selectedModels, setSelectedModels] = useState<Array<{ provider: string; model: string }>>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [availableModels, setAvailableModels] = useState<any>(null);

  // Type for model combinations
  interface ModelCombination {
    name: string;
    description: string;
    models: Array<{ provider: string; model: string }>;
    disabled?: boolean;
    disabledReason?: string | null;
  }

  // Default model combinations for quick comparison
  const defaultModelCombinations: ModelCombination[] = [
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
        { provider: "anthropic", model: "claude-3-5-haiku-20241022" }
      ]
    },
    {
      name: "Efficient Models",
      description: "Compare lightweight models for speed",
      models: [
        { provider: "ollama", model: "mistral:7b" },
        { provider: "openai", model: "gpt-3.5-turbo" },
        { provider: "anthropic", model: "claude-3-5-haiku-20241022" }
      ]
    },
    {
      name: "High Performance",
      description: "Compare high-quality models for accuracy",
      models: [
        { provider: "ollama", model: "mistral:7b" },
        { provider: "openai", model: "gpt-5" },
        { provider: "anthropic", model: "claude-sonnet-4" }
      ]
    },
    {
      name: "Reasoning & Analysis",
      description: "Compare models with advanced reasoning and analysis capabilities",
      models: [
        { provider: "ollama", model: "gpt-oss:20b" },
        { provider: "openai", model: "gpt-5" },
        { provider: "anthropic", model: "claude-sonnet-4" }
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

  // Get model count for any combination
  const getModelCount = useMemo(() => {
    return (combination: any) => {
      if (combination.name === "Compare All Local Models") {
        return getAllLocalModels.length;
      }
      return combination.models.length;
    };
  }, [getAllLocalModels]);

  // Filter and modify combinations based on model availability
  const getAvailableCombinations = useMemo(() => {
    if (!availableModels?.providers) {
      return defaultModelCombinations;
    }

    const ollamaProvider = availableModels.providers.find((p: any) => p.id === 'ollama');
    const hasOllamaModels = ollamaProvider && ollamaProvider.models && ollamaProvider.models.length > 0;

    return defaultModelCombinations.map(combination => {
      // For "Compare All Local Models", always show but disable if no models
      if (combination.name === "Compare All Local Models") {
        return {
          ...combination,
          disabled: !hasOllamaModels,
          disabledReason: hasOllamaModels ? null : "No Ollama models running"
        };
      }

      // For other combinations, filter out unavailable Ollama models but keep cloud models
      const availableModelsInCombination = combination.models.filter((model: any) => {
        if (model.provider === 'ollama') {
          return hasOllamaModels;
        }
        return true; // Keep cloud models
      });

      // Only disable if ALL models in the combination are unavailable
      const hasOllamaInCombination = combination.models.some((model: any) => model.provider === 'ollama');
      const hasCloudInCombination = combination.models.some((model: any) => model.provider !== 'ollama');
      const isDisabled = hasOllamaInCombination && !hasOllamaModels && !hasCloudInCombination;

      // Update description if some Ollama models were filtered out
      let updatedDescription = combination.description;
      if (hasOllamaInCombination && !hasOllamaModels && hasCloudInCombination) {
        updatedDescription = `${combination.description} (cloud models only)`;
      }

      return {
        ...combination,
        models: availableModelsInCombination,
        disabled: isDisabled,
        disabledReason: isDisabled ? "No models available" : null,
        description: updatedDescription
      };
    });
  }, [availableModels, getAllLocalModels]);

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
    setShowComparison(true);
    setActiveTab('comparison'); // Switch to comparison tab immediately
    
    const startTime = Date.now();
    const minDisplayTime = 3000; // Minimum 3 seconds to show progress indicators
    
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
      
      // Ensure progress indicators are shown for at least minDisplayTime
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);
      
      setTimeout(() => {
        setIsComparing(false);
      }, remainingTime);
      
    } catch (err) {
      setError(`Model comparison failed: ${err}`);
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

            {/* Max Length */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">Max Length</label>
                <span className="text-xs text-gray-500">{maxTokens} words</span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                disabled={isGenerating}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Short</span>
                <span>Long</span>
              </div>
            </div>

            {/* Number of Variations */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">Variations</label>
                <span className="text-xs text-gray-500">{numCandidates}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={numCandidates}
                onChange={(e) => setNumCandidates(parseInt(e.target.value))}
                disabled={isGenerating}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1</span>
                <span>5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Output Format */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="text-gray-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Output Format</h2>
          </div>
          <OutputFormatSelector
            selectedFormat={outputFormat}
            onFormatChange={handleOutputFormatChange}
          />
        </div>

        {/* Language Settings */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Languages className="text-gray-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Language</h2>
          </div>
          
          <div className="space-y-4">
            <LanguageSelector
              selectedLanguage={targetLanguage}
              onLanguageChange={setTargetLanguage}
            />
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="translate-output"
                checked={translateOutput}
                onChange={(e) => setTranslateOutput(e.target.checked)}
                disabled={isGenerating}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="translate-output" className="text-sm text-gray-700">
                Translate output
              </label>
            </div>
            
            {translateOutput && (
              <LanguageSelector
                selectedLanguage={targetLanguage}
                onLanguageChange={setTargetLanguage}
              />
            )}
          </div>
        </div>

        {/* Model Comparison */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <GitCompare className="text-purple-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Model Comparison</h2>
            </div>
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="text-sm text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-2 py-1 rounded transition-colors"
            >
              {showComparison ? 'Hide' : 'Show'}
            </button>
          </div>
          
          {showComparison && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Models to Compare
                </label>
                <div className="space-y-2">
                  {defaultModelCombinations.map((combination, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedModels(combination.models)}
                      disabled={combination.disabled}
                      className={`w-full text-left p-3 border rounded-lg transition-colors ${
                        combination.disabled
                          ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                          : 'border-gray-200 hover:border-purple-400 hover:bg-purple-50'
                      }`}
                      title={combination.disabledReason || combination.description}
                    >
                      <div className="font-medium text-sm">{combination.name}</div>
                      <div className="text-xs text-gray-500">{combination.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {selectedModels.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selected Models ({selectedModels.length})
                  </label>
                  <div className="space-y-1">
                    {selectedModels.map((model, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{model.provider}/{model.model}</span>
                        <button
                          onClick={() => setSelectedModels(selectedModels.filter((_, i) => i !== index))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* History */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <History className="text-gray-600" size={20} />
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
                  Text to Generate
                </label>
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
                className="input-field h-80 resize-none"
                placeholder="Enter your prompt here, or use voice input..."
                onKeyDown={handleKeyPress}
              />
              <div className="flex justify-between items-center mt-2">
                <div className="text-sm text-gray-500">
                  {userPrompt.trim() ? userPrompt.trim().split(/\s+/).length : 0} words
                </div>
                <button
                  onClick={() => setUserPrompt('Write a compelling blog post about the future of artificial intelligence and its impact on society.')}
                  disabled={isGenerating}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium disabled:opacity-50"
                  title="Load sample prompt"
                >
                  Try Sample
                </button>
              </div>
              
              {/* Language Detection Display */}
              <div className={`mt-3 transition-all duration-300 ease-in-out ${
                (languageDetection || isDetectingLanguage) ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0 overflow-hidden'
              }`}>
                <LanguageDetectionDisplay
                  detection={languageDetection}
                  isLoading={isDetectingLanguage}
                />
              </div>
            </div>
          )}

                     {/* URL Input */}
           {inputType === 'url' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL to Generate
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  disabled={isGenerating}
                  className="input-field flex-1"
                  placeholder="https://example.com/article"
                  onKeyDown={handleKeyPress}
                />
                <button
                  onClick={() => setUserPrompt('https://example.com/ai-article')}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium disabled:opacity-50"
                  title="Try with sample URL"
                >
                  Try Sample
                </button>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Enter a valid URL to scrape and generate content from
              </div>
            </div>
          )}

                     {/* File Input */}
           {inputType === 'file' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File to Generate
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {/* This section is not directly related to the file input for text generation,
                    but it's part of the original file input logic.
                    For text generation, we'll use userPrompt.
                    For file generation, we'd need a state for selectedFile and handleFileSelect.
                    Since the original file input was removed, this block is now effectively dead code
                    for text generation, but kept as per instruction to only apply specified changes. */}
                {/* <div className="space-y-2">
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
                </div> */}
              </div>
            </div>
          )}

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
              {isComparing || comparisonResults ? (
                <ModelComparison
                  results={comparisonResults?.results || []}
                  metrics={comparisonResults?.comparison_metrics || {}}
                  recommendations={comparisonResults?.recommendations || []}
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
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>To compare models:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>1. Select 2 or more models in the left panel</li>
                      <li>2. Enter text, URL, or upload a file</li>
                      <li>3. Click "Compare Models" to see results</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 