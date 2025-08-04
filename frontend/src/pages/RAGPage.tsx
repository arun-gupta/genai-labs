import React, { useState, useEffect, useRef } from 'react';
import { Upload, Send, FileText, Search, Trash2, FolderOpen, Plus, X, Download, Copy, Check, BarChart3, Shield, XCircle, Zap, Settings } from 'lucide-react';
import { ModelSelector } from '../components/ModelSelector';
import { ResponseDisplay } from '../components/ResponseDisplay';
import { VoiceInput } from '../components/VoiceInput';
import { VoiceOutput } from '../components/VoiceOutput';
import { ExportOptions } from '../components/ExportOptions';
import { QuestionSuggestions } from '../components/QuestionSuggestions';
import { ConfidenceDisplay } from '../components/ConfidenceDisplay';
import { DocumentAnalytics } from '../components/DocumentAnalytics';
import { apiService } from '../services/api';
import { StreamChunk } from '../types/api';

interface Document {
  document_id: string;
  file_name: string;
  chunks: number;
}

interface Collection {
  collection_name: string;
  document_count: number;
  total_chunks: number;
  documents: Document[];
  created_at: string;
  last_updated: string;
  available_tags: string[];
}

interface Source {
  document_id: string;
  file_name: string;
  chunk_text: string;
  similarity_score: number;
  chunk_index: number;
  tags: string[];
  collection_name?: string;
}

export const RAGPage: React.FC = () => {
  const [selectedProvider, setSelectedProvider] = useState('ollama');
  const [selectedModel, setSelectedModel] = useState('mistral:7b');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState<number | undefined>(1000);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState('default');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [topK, setTopK] = useState(5);
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(-0.2);
  const [copiedSource, setCopiedSource] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<any>(null);
  const [selectedDocumentForAnalytics, setSelectedDocumentForAnalytics] = useState<string | null>(null);
  const [documentTags, setDocumentTags] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewCollectionInput, setShowNewCollectionInput] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState<string[]>(['default']);
  const [lastUploadAnalytics, setLastUploadAnalytics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('response'); // 'response', 'sources', 'confidence'
  
  // Predefined sample tags for easy selection
  const sampleTags = [
    'legal', 'contract', 'agreement', 'policy', 'manual', 'guide',
    'financial', 'budget', 'invoice', 'receipt', 'tax',
    'hr', 'employee', 'hiring', 'training', 'benefits',
    'technical', 'specification', 'requirements', 'design', 'code',
    'marketing', 'campaign', 'advertising', 'social-media', 'brand',
    'operations', 'process', 'procedure', 'workflow', 'sop',
    'research', 'analysis', 'report', 'study', 'survey',
    'compliance', 'regulatory', 'audit', 'certification', 'standards'
  ];
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const response = await apiService.getRAGCollections();
      const collectionsData = (response as any).collections || response; // Handle both structures
      setCollections(collectionsData);
      
      // Extract all available tags from collections
      const allTags = new Set<string>();
      collectionsData.forEach((collection: Collection) => {
        if (collection.available_tags) {
          collection.available_tags.forEach(tag => allTags.add(tag));
        }
      });
      setAvailableTags(Array.from(allTags));
    } catch (error) {
      console.error('Error loading collections:', error);
    }
  };

  const createNewCollection = async () => {
    if (!newCollectionName.trim()) {
      setError('Please enter a collection name');
      return;
    }
    
    try {
      // Create a new collection by uploading a dummy document
      // This will create the collection structure
      const dummyContent = new Blob(['Collection created'], { type: 'text/plain' });
      const dummyFile = new File([dummyContent], 'collection_init.txt');
      
      const formData = new FormData();
      formData.append('file', dummyFile);
      formData.append('collection_name', newCollectionName.trim());
      
      await apiService.uploadRAGDocument(formData, []);
      
      // Delete the dummy document
      const collections = await apiService.getRAGCollections();
      const newCollection = collections.find(c => c.collection_name === newCollectionName.trim());
      if (newCollection && newCollection.documents.length > 0) {
        await apiService.deleteRAGDocument({
          document_id: newCollection.documents[0].document_id,
          collection_name: newCollectionName.trim()
        });
      }
      
      setNewCollectionName('');
      setShowNewCollectionInput(false);
      setSelectedCollection(newCollectionName.trim());
      await loadCollections();
    } catch (error) {
      setError(`Failed to create collection: ${error}`);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('collection_name', selectedCollection);

        const response = await apiService.uploadRAGDocument(formData, documentTags);
        
        // Store analytics from the upload response
        if (response.analytics) {
          setLastUploadAnalytics(response.analytics);
        }
        
        setUploadedFiles(prev => [...prev, file]);
        await loadCollections(); // Refresh collections
      }
    } catch (error) {
      setError(`Upload failed: ${error}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    setIsAsking(true);
    setAnswer('');
    setSources([]);
    setConfidence(null);
    setError(null);

    try {
      let fullAnswer = '';
      let finalSources: Source[] = [];
      let confidenceData: any = null;

      await apiService.askRAGQuestionStream(
        {
          question: question,
          collection_name: selectedCollections[0] || 'default',
          collection_names: selectedCollections,
          model_provider: selectedProvider,
          model_name: selectedModel,
          temperature: temperature,
          max_tokens: maxTokens,
          stream: true,
          top_k: topK,
          similarity_threshold: similarityThreshold
        },
        (chunk: StreamChunk) => {
          fullAnswer += chunk.content;
          setAnswer(fullAnswer);
          
          if (chunk.is_complete && chunk.sources) {
            finalSources = chunk.sources;
            setSources(finalSources);
          }
          
          if (chunk.confidence) {
            confidenceData = chunk.confidence;
            setConfidence(confidenceData);
          }
        },
        (error: string) => {
          setError(error);
        },
        filterTags
      );
    } catch (error) {
      setError(`Failed to get answer: ${error}`);
    } finally {
      setIsAsking(false);
    }
  };

  const handleVoiceInput = (transcript: string) => {
    setQuestion(prev => prev + ' ' + transcript);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskQuestion();
    }
  };

  const handleSuggestionClick = (suggestedQuestion: string) => {
    setQuestion(suggestedQuestion);
  };

  const copySourceText = async (source: Source) => {
    try {
      await navigator.clipboard.writeText(source.chunk_text);
      setCopiedSource(source.document_id);
      setTimeout(() => setCopiedSource(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      await apiService.deleteRAGDocument({
        document_id: documentId,
        collection_name: selectedCollection
      });
      await loadCollections();
    } catch (error) {
      setError(`Failed to delete document: ${error}`);
    }
  };

  const deleteCollection = async (collectionName: string) => {
    if (collectionName === 'default') {
      setError('Cannot delete the default collection');
      return;
    }

    try {
      await apiService.deleteRAGCollection(collectionName);
      if (selectedCollection === collectionName) {
        setSelectedCollection('default');
      }
      await loadCollections();
    } catch (error) {
      setError(`Failed to delete collection: ${error}`);
    }
  };

  const getExportContent = () => {
    return {
      system_prompt: `You are a helpful assistant that answers questions based on the provided context from uploaded documents.`,
      user_prompt: question,
      generated_content: answer,
      metadata: {
        model_provider: selectedProvider,
        model_name: selectedModel,
        timestamp: new Date().toISOString(),
        token_usage: undefined,
        latency_ms: undefined
      },
      analytics: {
        sources: sources.map(s => `${s.file_name}: ${s.chunk_text}`).join('\n\n')
      }
    };
  };

  const currentCollection = collections.find(c => c.collection_name === selectedCollection);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Q&A over Documents (RAG)</h1>
        <p className="text-gray-600">
          Ask questions about your uploaded documents and get intelligent answers
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Panel - Settings */}
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
              disabled={isAsking}
            />
          </div>

          {/* RAG Settings */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Settings className="text-gray-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">RAG Settings</h2>
            </div>
            
            <div className="space-y-4">
              {/* Top K */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">Top K Results</label>
                  <span className="text-xs text-gray-500">{topK}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={topK}
                  onChange={(e) => setTopK(parseInt(e.target.value))}
                  disabled={isAsking}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Few</span>
                  <span>Many</span>
                </div>
              </div>

              {/* Similarity Threshold */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">Similarity Threshold</label>
                  <span className="text-xs text-gray-500">{similarityThreshold}</span>
                </div>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.1"
                  value={similarityThreshold}
                  onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                  disabled={isAsking}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Loose</span>
                  <span>Strict</span>
                </div>
              </div>
            </div>
          </div>

          {/* Document Upload */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Upload className="text-green-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Document Upload</h2>
            </div>
            
            <div className="space-y-4">
              {/* Document Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Document Tags</label>
                <div className="space-y-2">
                  {/* Sample Tags */}
                  <div className="flex flex-wrap gap-1">
                    {sampleTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          if (documentTags.includes(tag)) {
                            setDocumentTags(documentTags.filter(t => t !== tag));
                          } else {
                            setDocumentTags([...documentTags, tag]);
                          }
                        }}
                        className={`px-2 py-1 text-xs rounded-full border ${
                          documentTags.includes(tag)
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  
                  {/* Selected Tags */}
                  {documentTags.length > 0 && (
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-1">
                        {documentTags.map(tag => (
                          <span key={tag} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full flex items-center space-x-1">
                            <span>{tag}</span>
                            <button
                              onClick={() => setDocumentTags(documentTags.filter(t => t !== tag))}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                        <button
                          onClick={() => setDocumentTags([])}
                          className="px-2 py-1 text-xs text-red-600 hover:text-red-800 underline"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Collection for Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Collection for Upload</label>
                <div className="flex space-x-2">
                  <select
                    value={selectedCollection}
                    onChange={(e) => setSelectedCollection(e.target.value)}
                    className="flex-1 input-field"
                  >
                    {collections.map(collection => (
                      <option key={collection.collection_name} value={collection.collection_name}>
                        {collection.collection_name} ({collection.document_count} docs)
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowNewCollectionInput(!showNewCollectionInput)}
                    className="btn-secondary px-3"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                {showNewCollectionInput && (
                  <div className="mt-2 flex space-x-2">
                    <input
                      type="text"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      placeholder="New collection name"
                      className="flex-1 input-field"
                    />
                    <button
                      onClick={createNewCollection}
                      disabled={!newCollectionName.trim()}
                      className="btn-primary px-3"
                    >
                      Create
                    </button>
                  </div>
                )}
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Document</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    accept=".pdf,.txt,.docx,.md"
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="mx-auto text-gray-400" size={32} />
                    <div className="text-gray-600 mt-2">
                      <span className="text-primary-600 hover:text-primary-700 font-medium">
                        Click to upload
                      </span>
                      {' '}or drag and drop
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Supports: PDF, TXT, DOCX, MD files
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Collections */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <FolderOpen className="text-purple-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Collections</h2>
            </div>
            
            <div className="space-y-3">
              {collections.map(collection => (
                <div key={collection.collection_name} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{collection.collection_name}</span>
                      <span className="text-xs text-gray-500">
                        {collection.document_count} docs, {collection.total_chunks} chunks
                      </span>
                    </div>
                    <button
                      onClick={() => deleteCollection(collection.collection_name)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete collection"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {collection.documents.map(doc => (
                      <div key={doc.document_id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-700 cursor-pointer hover:text-blue-600" 
                                onClick={() => setSelectedDocumentForAnalytics(selectedDocumentForAnalytics === doc.document_id ? null : doc.document_id)}>
                            {doc.file_name}
                          </span>
                          <span className="text-xs text-gray-500">({doc.chunks} chunks)</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setSelectedDocumentForAnalytics(selectedDocumentForAnalytics === doc.document_id ? null : doc.document_id)}
                            className="text-blue-500 hover:text-blue-700"
                            title="View analytics"
                          >
                            <BarChart3 size={14} />
                          </button>
                          <button
                            onClick={() => deleteDocument(doc.document_id)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete document"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Document Analytics */}
                  {collection.documents.map(doc => (
                    selectedDocumentForAnalytics === doc.document_id && (
                      <div key={`analytics-${doc.document_id}`} className="mt-3 pt-3 border-t border-gray-200">
                        <DocumentAnalytics
                          collectionName={collection.collection_name}
                          documentId={doc.document_id}
                          compact={true}
                        />
                      </div>
                    )
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Upload Analytics */}
          {lastUploadAnalytics && (
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="text-green-600" size={20} />
                <h2 className="text-lg font-semibold text-gray-900">Upload Analytics</h2>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-600 text-xs">Words</span>
                    <span className="font-medium">{lastUploadAnalytics.statistics?.word_count?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-600 text-xs">Reading Time</span>
                    <span className="font-medium">{lastUploadAnalytics.statistics?.estimated_reading_time_minutes || 'N/A'} min</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-600 text-xs">Type</span>
                    <span className="font-medium capitalize">{lastUploadAnalytics.document_type || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-600 text-xs">Readability</span>
                    <span className="font-medium">{lastUploadAnalytics.readability?.level?.replace('_', ' ') || 'N/A'}</span>
                  </div>
                </div>
                {lastUploadAnalytics.summary && (
                  <p className="text-xs text-gray-600 leading-relaxed">{lastUploadAnalytics.summary}</p>
                )}
                <button
                  onClick={() => setLastUploadAnalytics(null)}
                  className="text-xs text-green-600 hover:text-green-800 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Center Panel - Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Question Input */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Question Input</h2>
            </div>
            
            {/* Target Collections */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Collections for Question</label>
              <div className="space-y-2">
                {collections.map(collection => (
                  <label key={collection.collection_name} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedCollections.includes(collection.collection_name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCollections([...selectedCollections, collection.collection_name]);
                        } else {
                          setSelectedCollections(selectedCollections.filter(c => c !== collection.collection_name));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {collection.collection_name} ({collection.document_count} docs)
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Question Input */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Question</label>
                <VoiceInput
                  onTranscript={handleVoiceInput}
                  disabled={isAsking}
                  className="text-xs"
                />
              </div>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask a question about your uploaded documents..."
                className="w-full h-32 input-field resize-none"
                disabled={isAsking}
              />
            </div>

            {/* Filter by Tags */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Tags (optional)</label>
              {availableTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        if (filterTags.includes(tag)) {
                          setFilterTags(filterTags.filter(t => t !== tag));
                        } else {
                          setFilterTags([...filterTags, tag]);
                        }
                      }}
                      className={`px-3 py-1 text-xs rounded-full border ${
                        filterTags.includes(tag)
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-500 mb-2">
                  No tags available yet. Upload documents with tags to filter by them.
                </div>
              )}
              
              {/* Selected Filter Tags */}
              {filterTags.length > 0 && (
                <div className="mt-2">
                  <div className="flex flex-wrap gap-1">
                    {filterTags.map(tag => (
                      <span key={tag} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full flex items-center space-x-1">
                        <span>{tag}</span>
                        <button
                          onClick={() => setFilterTags(filterTags.filter(t => t !== tag))}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    <button
                      onClick={() => setFilterTags([])}
                      className="px-2 py-1 text-xs text-red-600 hover:text-red-800 underline"
                    >
                      Clear All
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Filtering by: {filterTags.join(', ')}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={handleAskQuestion}
                disabled={isAsking || !question.trim() || selectedCollections.length === 0}
                className="btn-primary flex items-center space-x-2"
              >
                <Send size={16} />
                <span>{isAsking ? 'Asking...' : 'Ask Question'}</span>
              </button>
            </div>

            <div className="mt-2 text-xs text-gray-500 text-center">
              Press Cmd/Ctrl + Enter to ask question
            </div>
          </div>

          {/* Question Suggestions */}
          <QuestionSuggestions
            collectionNames={selectedCollections}
            onSuggestionClick={handleSuggestionClick}
            className="mt-4"
          />

          {/* Response Section with Tabs */}
          <div className="card">
            {/* Tab Navigation */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setActiveTab('response')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'response'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FileText size={16} />
                <span>Response</span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <BarChart3 size={16} />
                <span>Analytics</span>
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'response' && (
              <div className="space-y-6">
                {/* Question Display */}
                {question && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Search className="w-4 h-4 text-blue-500" />
                      <h4 className="font-medium text-blue-900">Question</h4>
                    </div>
                    <p className="text-blue-800">{question}</p>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                    <div className="flex items-center space-x-2 mb-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <h4 className="font-medium">Error</h4>
                    </div>
                    <p>{error}</p>
                  </div>
                )}

                {/* Answer Display */}
                <ResponseDisplay
                  content={answer}
                  isStreaming={isAsking}
                  tokenUsage={undefined}
                  latencyMs={undefined}
                  modelName={selectedModel}
                  modelProvider={selectedProvider}
                />
                
                {answer && (
                  <ExportOptions content={getExportContent()} />
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {/* Confidence Analysis */}
                {confidence && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">Confidence Analysis</h3>
                    <ConfidenceDisplay confidence={confidence} />
                  </div>
                )}

                {/* Sources Analysis */}
                {sources.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">Sources ({sources.length})</h3>
                    <div className="space-y-4">
                      {sources.map((source, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">{source.file_name}</span>
                              <span className="text-xs text-gray-500">
                                Similarity: {(source.similarity_score * 100).toFixed(1)}%
                              </span>
                              {source.collection_name && (
                                <span className="text-xs text-purple-500">
                                  Collection: {source.collection_name}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => copySourceText(source)}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              {copiedSource === source.document_id ? (
                                <Check size={16} />
                              ) : (
                                <Copy size={16} />
                              )}
                            </button>
                          </div>
                          {source.tags && source.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {source.tags.map(tag => (
                                <span key={tag} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                            {source.chunk_text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!confidence && sources.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <BarChart3 className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-2">No analytics available yet</p>
                    <p className="text-sm">Ask a question to see confidence analysis and sources</p>
                  </div>
                )}
              </div>
            )}

            {!answer && activeTab === 'response' && (
              <div className="text-center text-gray-500 py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2">Ask a question to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 