import React, { useState, useEffect } from 'react';
import { ChevronDown, Zap, Brain, Server } from 'lucide-react';
import { ModelProvider, AvailableModels } from '../types/api';
import { apiService } from '../services/api';

interface ModelSelectorProps {
  selectedProvider: string;
  selectedModel: string;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
  disabled?: boolean;
  externalModels?: AvailableModels | null;  // Optional external data
}

const providerIcons = {
  openai: Zap,
  anthropic: Brain,
  ollama: Server,
};

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
  disabled = false,
  externalModels = null,
}) => {
  const [availableModels, setAvailableModels] = useState<AvailableModels | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (externalModels) {
      // Use external data if provided
      setAvailableModels(externalModels);
      setIsLoading(false);
      setError(null);
    } else {
      // Otherwise load data from API
      loadAvailableModels();
    }
  }, [externalModels]);

  const loadAvailableModels = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const models = await apiService.getAvailableModels();
      setAvailableModels(models);
    } catch (err) {
      setError('Failed to load available models');
      console.error('Error loading models:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProviderData = availableModels?.providers.find(
    p => p.id === selectedProvider
  );

  const availableModelsForProvider = selectedProviderData?.models || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={loadAvailableModels}
            className="mt-2 text-red-600 hover:text-red-700 text-sm underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Provider Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Model Provider
        </label>
        <div className="relative">
          <select
            value={selectedProvider}
            onChange={(e) => {
              onProviderChange(e.target.value);
              // Reset model selection when provider changes
              const newProvider = availableModels?.providers.find(
                p => p.id === e.target.value
              );
              if (newProvider?.models.length) {
                onModelChange(newProvider.models[0]);
              }
            }}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white disabled:bg-gray-50 disabled:cursor-not-allowed appearance-none"
          >
            {availableModels?.providers.map((provider) => {
              const Icon = providerIcons[provider.id as keyof typeof providerIcons] || Server;
              const hasModels = provider.models.length > 0;
              const displayName = provider.id === 'ollama' && !hasModels 
                ? `${provider.name} (No models running)` 
                : provider.name;
              return (
                <option key={provider.id} value={provider.id}>
                  {displayName}
                </option>
              );
            })}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
        </div>
        {selectedProviderData && (
          <p className="mt-1 text-xs text-gray-500">
            {selectedProviderData.requires_api_key 
              ? 'Requires API key configuration' 
              : selectedProvider === 'ollama' && availableModelsForProvider.length === 0
                ? 'No models currently running - see instructions below'
                : 'Local model - no API key required'
            }
          </p>
        )}
      </div>

      {/* Model Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Model
        </label>
        <div className="relative">
          <select
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
            disabled={disabled || !availableModelsForProvider.length}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white disabled:bg-gray-50 disabled:cursor-not-allowed appearance-none"
          >
            {availableModelsForProvider.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
        </div>
        
        {/* Show helpful message when no models are available for Ollama */}
        {selectedProvider === 'ollama' && availableModelsForProvider.length === 0 && (
          <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Server className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  No Ollama models are currently running
                </h4>
                <p className="text-sm text-blue-700 mb-3">
                  To use local models, you need to start Ollama and run at least one model. You can:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">1</span>
                    <span className="text-sm text-blue-700">Start Ollama: <code className="bg-blue-100 px-1 rounded text-xs">ollama serve</code></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">2</span>
                    <span className="text-sm text-blue-700">Download a model: <code className="bg-blue-100 px-1 rounded text-xs">ollama pull mistral:7b</code></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">3</span>
                    <span className="text-sm text-blue-700">Run the model: <code className="bg-blue-100 px-1 rounded text-xs">ollama run mistral:7b</code></span>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                  <h5 className="text-xs font-medium text-green-800 mb-2">💡 Pro Tip: Keep Models Running</h5>
                  <p className="text-xs text-green-700 mb-2">
                    For instant responses, keep models loaded indefinitely:
                  </p>
                  <div className="space-y-1">
                    <code className="block text-xs bg-green-100 text-green-800 p-1 rounded break-all">
                      {`curl http://localhost:11434/api/generate -d '{"model": "mistral:7b", "keep_alive": -1}'`}
                    </code>
                    <code className="block text-xs bg-green-100 text-green-800 p-1 rounded break-all">
                      {`curl http://localhost:11434/api/generate -d '{"model": "mistral:latest", "keep_alive": -1}'`}
                    </code>
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    This eliminates loading delays for better performance.
                  </p>
                </div>
                <div className="mt-3 flex space-x-2">
                  <a
                    href="/models"
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Browse available models →
                  </a>
                  <button
                    onClick={loadAvailableModels}
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Refresh status
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 