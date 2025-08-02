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
}) => {
  const [availableModels, setAvailableModels] = useState<AvailableModels | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAvailableModels();
  }, []);

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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
          >
            {availableModels?.providers.map((provider) => {
              const Icon = providerIcons[provider.id as keyof typeof providerIcons] || Server;
              return (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
          >
            {availableModelsForProvider.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
        </div>
      </div>
    </div>
  );
}; 