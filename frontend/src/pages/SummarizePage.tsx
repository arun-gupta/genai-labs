import React, { useState, useRef, useEffect } from 'react';
import { FileText, Settings, Send, Upload, Link, File, Globe, X, BarChart3, Languages, History, Zap, GitCompare } from 'lucide-react';
import { apiService } from '../services/api';

export const SummarizePage: React.FC = () => {
  const [text, setText] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('ollama');
  const [selectedModel, setSelectedModel] = useState('mistral:7b');
  const [availableModels, setAvailableModels] = useState<any>(null);

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
      <h1 className="text-2xl font-bold mb-4">Summarize Page (Testing)</h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to summarize..."
        className="w-full h-32 p-2 border rounded"
      />
      <p className="mt-4">Text length: {text.length}</p>
      <p className="mt-2">Selected model: {selectedModel}</p>
      <p className="mt-2">Available models: {availableModels ? 'Loaded' : 'Loading...'}</p>
    </div>
  );
}; 