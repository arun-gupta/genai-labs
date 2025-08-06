import React, { useState, useEffect } from 'react';
import { ModelSelector } from '../components/ModelSelector';
import { ModelComparison } from '../components/ModelComparison';
import { apiService } from '../services/api';

export const SummarizePage: React.FC = () => {
  const [text, setText] = useState('');
  const [availableModels, setAvailableModels] = useState<any>(null);
  const [selectedProvider, setSelectedProvider] = useState('ollama');
  const [selectedModel, setSelectedModel] = useState('mistral:7b');
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResults, setComparisonResults] = useState<any>(null);
  const [selectedModels, setSelectedModels] = useState<Array<{ provider: string; model: string }>>([]);

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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Summarize Page (Testing ModelSelector)</h1>
      
      {/* Model Selector Component */}
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

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to summarize..."
        className="w-full h-32 p-2 border rounded"
      />
      <p className="mt-4">Text length: {text.length}</p>
      <p className="mt-2">Available models: {availableModels ? 'Loaded' : 'Loading...'}</p>
      <p className="mt-2">Selected model: {selectedModel}</p>
      
      {/* Model Comparison Component */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Model Comparison Test</h2>
        <ModelComparison
          results={comparisonResults?.results || []}
          metrics={comparisonResults?.comparison_metrics || {}}
          recommendations={comparisonResults?.recommendations || []}
          isComparing={isComparing}
          comparisonType="summarization"
          selectedModels={selectedModels.map(m => `${m.provider}/${m.model}`)}
        />
      </div>
    </div>
  );
}; 