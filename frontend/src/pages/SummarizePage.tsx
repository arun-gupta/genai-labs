import React, { useState } from 'react';
import { FileText, Settings, Send } from 'lucide-react';
import { ModelSelector } from '../components/ModelSelector';
import { ResponseDisplay } from '../components/ResponseDisplay';
import { apiService } from '../services/api';
import { storageUtils, PromptHistory } from '../utils/storage';
import { StreamChunk } from '../types/api';

export const SummarizePage: React.FC = () => {
  const [text, setText] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [maxLength, setMaxLength] = useState(150);
  const [temperature, setTemperature] = useState(0.3);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [tokenUsage, setTokenUsage] = useState<any>(null);
  const [latencyMs, setLatencyMs] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const handleSummarize = async () => {
    if (!text.trim()) {
      setError('Please enter text to summarize');
      return;
    }

    setIsSummarizing(true);
    setSummary('');
    setError(null);
    setTokenUsage(null);
    setLatencyMs(undefined);

    try {
      await apiService.summarizeTextStream(
        {
          text: text,
          model_provider: selectedProvider as any,
          model_name: selectedModel,
          max_length: maxLength,
          temperature: temperature,
          stream: true,
        },
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

      // Save to history
      const historyItem: PromptHistory = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: 'summarize',
        text: text,
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

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Text Summarization</h1>
        <p className="text-gray-600">
          Summarize long texts using different large language models
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
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Text to Summarize</h2>
              <div className="text-sm text-gray-500">
                {wordCount} words
              </div>
            </div>
            
            <div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isSummarizing}
                className="input-field h-64 resize-none"
                placeholder="Paste or type the text you want to summarize here..."
                onKeyDown={handleKeyPress}
              />
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleSummarize}
              disabled={isSummarizing || !text.trim()}
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
                  <span>Summarize Text</span>
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