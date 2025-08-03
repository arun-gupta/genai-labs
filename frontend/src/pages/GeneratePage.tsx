import React, { useState, useEffect } from 'react';
import { Send, Settings, History, Languages, FileText } from 'lucide-react';
import { ModelSelector } from '../components/ModelSelector';
import { ResponseDisplay } from '../components/ResponseDisplay';
import { LanguageSelector } from '../components/LanguageSelector';
import { LanguageDetectionDisplay } from '../components/LanguageDetection';
import { OutputFormatSelector } from '../components/OutputFormatSelector';
import { GenerationAnalyticsDisplay } from '../components/GenerationAnalyticsDisplay';
import { PromptTemplateSelector } from '../components/PromptTemplateSelector';
import { MultipleCandidatesSelector } from '../components/MultipleCandidatesSelector';
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
  const [outputFormat, setOutputFormat] = useState('text');
  const [numCandidates, setNumCandidates] = useState(3);
  const [languageDetection, setLanguageDetection] = useState<LanguageDetection | null>(null);
  const [isDetectingLanguage, setIsDetectingLanguage] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'response' | 'analytics'>('response');
  const [candidates, setCandidates] = useState<string[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<number>(0);

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

  const handleClearTemplate = () => {
    setSystemPrompt('');
    setUserPrompt('');
  };

  const handleCandidateSelect = (index: number) => {
    setSelectedCandidate(index);
    setResponse(candidates[index] || '');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Text Generation</h1>
        <p className="text-gray-600">
          Generate text using different large language models with custom prompts
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
              disabled={isGenerating}
            />

            {/* Output Format Settings */}
            <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-2 mb-3">
                <FileText className="text-purple-600" size={20} />
                <h3 className="text-lg font-medium text-gray-900">Output Format</h3>
              </div>
              
              <OutputFormatSelector
                selectedFormat={outputFormat}
                onFormatChange={setOutputFormat}
                className="w-full"
              />
            </div>

            {/* Language Settings */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-3">
                <Languages className="text-blue-600" size={20} />
                <h3 className="text-lg font-medium text-gray-900">Language Settings</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="translate-response"
                    checked={translateResponse}
                    onChange={(e) => setTranslateResponse(e.target.checked)}
                    disabled={isGenerating}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="translate-response" className="text-sm font-medium text-gray-700">
                    Translate response to different language
                  </label>
                </div>
                
                {translateResponse && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Language
                    </label>
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

            <div className="grid grid-cols-2 gap-4 mt-4">
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
                  disabled={isGenerating}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 mt-1">{temperature}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  min="1"
                  max="4000"
                  value={maxTokens || ''}
                  onChange={(e) => setMaxTokens(e.target.value ? parseInt(e.target.value) : undefined)}
                  disabled={isGenerating}
                  className="input-field"
                  placeholder="1000"
                />
              </div>
            </div>

            {/* Multiple Candidates Settings */}
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <MultipleCandidatesSelector
                numCandidates={numCandidates}
                onNumCandidatesChange={setNumCandidates}
                className="w-full"
              />
            </div>

            {/* Prompt Templates */}
            <div className="mt-4">
              <PromptTemplateSelector
                onTemplateSelect={handleTemplateSelect}
                onClearTemplate={handleClearTemplate}
                currentSystemPrompt={systemPrompt}
                currentUserPrompt={userPrompt}
                className="w-full"
              />
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Prompts</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System Prompt (Optional)
                </label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  disabled={isGenerating}
                  className="input-field h-24 resize-none"
                  placeholder="You are a helpful assistant that..."
                  onKeyDown={handleKeyPress}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Prompt *
                </label>
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  disabled={isGenerating}
                  className="input-field h-32 resize-none"
                  placeholder="Enter your prompt here..."
                  onKeyDown={handleKeyPress}
                />
                
                {/* Language Detection Display */}
                {userPrompt.trim() && (
                  <div className="mt-3">
                    <LanguageDetectionDisplay
                      detection={languageDetection}
                      isLoading={isDetectingLanguage}
                    />
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !userPrompt.trim()}
              className="mt-4 btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>

        {/* Output Section */}
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
  );
}; 