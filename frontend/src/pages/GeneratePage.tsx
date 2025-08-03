import React, { useState, useEffect } from 'react';
import { Send, Settings, History, Languages, FileText, Zap, Mic, Volume2, Palette, ChevronDown } from 'lucide-react';
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
import { ExportOptions } from '../components/ExportOptions';
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
  const [translateResponse, setTranslateResponse] = useState(false);
  const [outputFormat, setOutputFormat] = useState<'text' | 'json' | 'xml' | 'markdown' | 'csv' | 'yaml' | 'html' | 'bullet_points' | 'numbered_list' | 'table'>('text');
  const [numCandidates, setNumCandidates] = useState(1);
  const [selectedWritingStyle, setSelectedWritingStyle] = useState('none');
  const [languageDetection, setLanguageDetection] = useState<LanguageDetection | null>(null);
  const [isDetectingLanguage, setIsDetectingLanguage] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'response' | 'analytics'>('response');
  const [candidates, setCandidates] = useState<string[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<number>(0);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

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
          translate_response: translateResponse,
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Output Format</label>
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
        </div>

        {/* Center Panel - Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Prompts */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Prompts</h2>
              <div className="flex items-center space-x-2">
                <VoiceInput
                  onTranscript={handleVoiceInput}
                  disabled={isGenerating}
                  className="text-xs"
                />
              </div>
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

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !userPrompt.trim()}
              className="mt-4 w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Generate Text</span>
                </>
              )}
            </button>

            <div className="mt-2 text-xs text-gray-500 text-center">
              Press Cmd/Ctrl + Enter to generate
            </div>
          </div>

          {/* Response */}
          <div>
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-4">
              <button
                onClick={() => setActiveTab('response')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'response'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Response
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Analytics
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'response' && (
              <ResponseDisplay
                content={response}
                isStreaming={isGenerating}
                tokenUsage={tokenUsage}
                latencyMs={latencyMs}
                modelName={selectedModel}
                modelProvider={selectedProvider}
              />
            )}

            {activeTab === 'analytics' && (
              <GenerationAnalyticsDisplay
                analytics={analytics}
                isLoading={isAnalyzing}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 