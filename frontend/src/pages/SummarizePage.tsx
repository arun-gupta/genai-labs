import React, { useState, useRef, useEffect } from 'react';
import { FileText, Settings, Send, Upload, Link, File, Globe, X, BarChart3, Languages, History, Zap, GitCompare } from 'lucide-react';
import { ModelSelector } from '../components/ModelSelector';
import { ModelComparison } from '../components/ModelComparison';
import { apiService } from '../services/api';

export const SummarizePage: React.FC = () => {
  const [text, setText] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('ollama');
  const [selectedModel, setSelectedModel] = useState('mistral:7b');
  const [availableModels, setAvailableModels] = useState<any>(null);
  
  // Model comparison state
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResults, setComparisonResults] = useState<any>(null);
  const [selectedModels, setSelectedModels] = useState<Array<{ provider: string; model: string }>>([]);
  const [showComparison, setShowComparison] = useState(false);

  // Preset model combinations
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

  const handleModelComparison = async () => {
    if (!text.trim() || selectedModels.length < 2) return;
    
    setIsComparing(true);
    setComparisonResults(null);
    setShowComparison(true);
    
    try {
      const request = {
        models: selectedModels,
        text: text,
        max_length: 150,
        temperature: 0.3,
        summary_type: 'general'
      };
      
      const result = await apiService.compareSummarizationModels(request);
      setComparisonResults(result);
    } catch (err) {
      console.error('Comparison error:', err);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Summarize Page (Testing Preset Combinations)</h1>
      
      {/* Model Selection */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Model Selection</h2>
        <ModelSelector
          selectedProvider={selectedProvider}
          selectedModel={selectedModel}
          onProviderChange={setSelectedProvider}
          onModelChange={setSelectedModel}
          disabled={false}
        />
      </div>

      {/* Model Comparison */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Model Comparison</h2>
        
        {/* Preset Combinations */}
        <div className="mb-4">
          <h3 className="text-md font-medium mb-2">Quick Combinations</h3>
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
          <div key={provider.id} className="mb-3">
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
        
        <button
          onClick={handleModelComparison}
          disabled={isComparing || selectedModels.length < 2}
          className="mt-3 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {isComparing ? 'Comparing...' : 'Compare Models'}
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to summarize..."
        className="w-full h-32 p-2 border rounded"
      />
      <p className="mt-4">Text length: {text.length}</p>
      <p className="mt-2">Selected model: {selectedModel}</p>
      <p className="mt-2">Available models: {availableModels ? 'Loaded' : 'Loading...'}</p>
      <p className="mt-2">Selected for comparison: {selectedModels.length} models</p>

      {/* Model Comparison Results */}
      {showComparison && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Comparison Results</h2>
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
  );
}; 