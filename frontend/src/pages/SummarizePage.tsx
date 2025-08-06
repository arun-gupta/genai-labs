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
  
  // Adding back more complex state
  const [inputType, setInputType] = useState<'text' | 'url' | 'file'>('text');
  const [url, setUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [maxLength, setMaxLength] = useState(150);
  const [temperature, setTemperature] = useState(0.3);
  const [summaryType, setSummaryType] = useState('general');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [tokenUsage, setTokenUsage] = useState<any>(null);
  const [latencyMs, setLatencyMs] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'response' | 'analytics' | 'comparison'>('response');
  const [originalText, setOriginalText] = useState<string>('');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [translateOutput, setTranslateOutput] = useState(false);
  const [outputFormat, setOutputFormat] = useState<'text' | 'json' | 'xml' | 'markdown' | 'csv' | 'yaml' | 'html' | 'bullet_points' | 'numbered_list' | 'table'>('text');
  const [languageDetection, setLanguageDetection] = useState<any>(null);
  const [isDetectingLanguage, setIsDetectingLanguage] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

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

  // Adding back the language detection effect
  useEffect(() => {
    if (inputType === 'text' && text.length > 10) {
      const timeoutId = setTimeout(() => {
        // Simulate language detection
        setIsDetectingLanguage(true);
        setTimeout(() => {
          setLanguageDetection({ language: 'en', confidence: 0.95 });
          setIsDetectingLanguage(false);
        }, 1000);
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [text, inputType]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Summarize Page (Testing Complex State)</h1>
      
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

      {/* Input Type Selector */}
      <div className="mb-4">
        <h3 className="text-md font-medium mb-2">Input Type</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setInputType('text')}
            className={`px-4 py-2 rounded ${inputType === 'text' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Text
          </button>
          <button
            onClick={() => setInputType('url')}
            className={`px-4 py-2 rounded ${inputType === 'url' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            URL
          </button>
          <button
            onClick={() => setInputType('file')}
            className={`px-4 py-2 rounded ${inputType === 'file' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            File
          </button>
        </div>
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
      <p className="mt-2">Input type: {inputType}</p>
      <p className="mt-2">Language detection: {languageDetection ? 'Detected' : 'Not detected'}</p>
      
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