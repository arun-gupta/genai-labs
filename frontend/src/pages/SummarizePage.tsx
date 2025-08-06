import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export const SummarizePage: React.FC = () => {
  const [text, setText] = useState('');
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
      <h1 className="text-2xl font-bold mb-4">Summarize Page (Minimal - Testing)</h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to summarize..."
        className="w-full h-32 p-2 border rounded"
      />
      <p className="mt-4">Text length: {text.length}</p>
      <p className="mt-2">Available models: {availableModels ? 'Loaded' : 'Loading...'}</p>
    </div>
  );
}; 