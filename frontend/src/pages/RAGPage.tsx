import React, { useState, useEffect, useRef } from 'react';
import { Upload, Send, FileText, Search, Trash2, FolderOpen, Plus, X, Download, Copy, Check, BarChart3 } from 'lucide-react';
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
  const [showSources, setShowSources] = useState(false);
  const [copiedSource, setCopiedSource] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<any>(null);
  const [selectedDocumentForAnalytics, setSelectedDocumentForAnalytics] = useState<string | null>(null);
  const [documentTags, setDocumentTags] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewCollectionInput, setShowNewCollectionInput] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState<string[]>(['default']);
  
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
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Q&A over Documents</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Upload documents and ask questions to get AI-powered answers based on your content.
        </p>
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        {/* Left Panel - Settings & Upload */}
        <div className="space-y-6">
          {/* Model Settings */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="text-blue-500" size={20} />
              <h2 className="text-lg font-semibold">Model Settings</h2>
            </div>
            <ModelSelector
              selectedProvider={selectedProvider}
              onProviderChange={setSelectedProvider}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature: {temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens: {maxTokens || 'Unlimited'}
                </label>
                <input
                  type="number"
                  value={maxTokens || ''}
                  onChange={(e) => setMaxTokens(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="1000"
                />
              </div>
            </div>
          </div>

          {/* RAG Settings */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Search className="text-green-500" size={20} />
              <h2 className="text-lg font-semibold">RAG Settings</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Top K Results: {topK}
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={topK}
                  onChange={(e) => setTopK(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Similarity Threshold: {similarityThreshold}
                </label>
                <input
                  type="range"
                  min="-1"
                  max="0"
                  step="0.01"
                  value={similarityThreshold}
                  onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Document Upload */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Upload className="text-purple-500" size={20} />
              <h2 className="text-lg font-semibold">Upload Documents</h2>
            </div>
            
            {/* Collection Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection for Upload
              </label>
              <div className="flex space-x-2 items-center">
                <select
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                >
                  {collections.map(collection => (
                    <option key={collection.collection_name} value={collection.collection_name}>
                      {collection.collection_name} ({collection.document_count} docs)
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowNewCollectionInput(!showNewCollectionInput)}
                  className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  <Plus size={16} />
                </button>
              </div>
              {/* Collection delete buttons */}
              <div className="mt-2 space-y-1">
                {collections.map(collection => (
                  <div key={collection.collection_name} className="flex items-center justify-between text-xs text-gray-700">
                    <span>{collection.collection_name}</span>
                    <button
                      disabled={selectedCollection === collection.collection_name}
                      onClick={async () => {
                        if (window.confirm(`Delete collection '${collection.collection_name}'? This cannot be undone.`)) {
                          await apiService.deleteRAGCollection(collection.collection_name);
                          await loadCollections();
                        }
                      }}
                      className={`ml-2 px-2 py-1 rounded ${selectedCollection === collection.collection_name ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
              
              {/* New Collection Input */}
              {showNewCollectionInput && (
                <div className="mt-2 flex space-x-2">
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="New collection name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <button
                    onClick={createNewCollection}
                    className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowNewCollectionInput(false);
                      setNewCollectionName('');
                    }}
                    className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Document Tags */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Tags
              </label>
              <input
                type="text"
                value={documentTags.join(', ')}
                onChange={(e) => setDocumentTags(e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag))}
                placeholder="e.g., research, technical, manual"
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
              />
              
              {/* Sample Tags */}
              <div className="mb-2">
                <p className="text-xs text-gray-600 mb-2">Quick select tags:</p>
                <div className="flex flex-wrap gap-1">
                  {sampleTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        if (!documentTags.includes(tag)) {
                          setDocumentTags([...documentTags, tag]);
                        }
                      }}
                      disabled={documentTags.includes(tag)}
                      className={`px-2 py-1 text-xs rounded-full border ${
                        documentTags.includes(tag)
                          ? 'bg-blue-500 text-white border-blue-500 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Selected Tags */}
              {documentTags.length > 0 && (
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
              )}
              
              <p className="text-xs text-gray-500 mt-1">
                Tags will be applied to uploaded documents for better organization
              </p>
            </div>

            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.txt,.md,.csv"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="btn-primary"
                >
                  {isUploading ? 'Uploading...' : 'Choose Files'}
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                PDF, DOCX, TXT, MD, CSV files supported
              </p>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Recently Uploaded</h3>
                <div className="space-y-2">
                  {uploadedFiles.slice(-3).map((file, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="truncate">{file.name}</span>
                      <Check className="text-green-500" size={16} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Collection Info */}
          {currentCollection && (
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <FolderOpen className="text-orange-500" size={20} />
                <h2 className="text-lg font-semibold">Collection Info</h2>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Documents:</span>
                  <span>{currentCollection.document_count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Chunks:</span>
                  <span>{currentCollection.total_chunks}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span>{new Date(currentCollection.last_updated).toLocaleDateString()}</span>
                </div>
              </div>
              
              {/* Document List */}
              {currentCollection.documents.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Documents</h3>
                  <div className="space-y-2">
                    {currentCollection.documents.map(doc => (
                      <div key={doc.document_id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                        <span className="truncate">{doc.file_name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">{doc.chunks} chunks</span>
                          <button
                            onClick={() => setSelectedDocumentForAnalytics(selectedDocumentForAnalytics === doc.document_id ? null : doc.document_id)}
                            className="text-blue-500 hover:text-blue-700"
                            title="View Analytics"
                          >
                            <BarChart3 size={14} />
                          </button>
                          <button
                            onClick={() => deleteDocument(doc.document_id)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete Document"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Document Analytics */}
              {selectedDocumentForAnalytics && (
                <div className="mt-4">
                  <DocumentAnalytics
                    collectionName={selectedCollection}
                    documentId={selectedDocumentForAnalytics}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center Panel - Question Input */}
        <div className="space-y-6">
          {/* Question Input */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Search className="text-blue-500" size={20} />
              <h2 className="text-lg font-semibold">Ask a Question</h2>
              <VoiceInput onTranscript={handleVoiceInput} />
            </div>
            
            {/* Collection Selector for Questions */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Collections for Question
              </label>
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
                      className="rounded"
                    />
                    <span className="text-sm">
                      {collection.collection_name} ({collection.document_count} docs)
                    </span>
                  </label>
                ))}
              </div>
              {selectedCollections.length === 0 && (
                <p className="text-xs text-red-500 mt-1">
                  Please select at least one collection
                </p>
              )}
            </div>
            
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about your uploaded documents..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={4}
            />
            
            {/* Tag Filtering */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Tags (optional)
              </label>
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
              
              {answer && (
                <button
                  onClick={() => setShowSources(!showSources)}
                  className="btn-secondary"
                >
                  {showSources ? 'Hide' : 'Show'} Sources ({sources.length})
                </button>
              )}
            </div>
          </div>

          {/* Question Suggestions */}
          <QuestionSuggestions
            collectionNames={selectedCollections}
            onSuggestionClick={handleSuggestionClick}
            className="mt-4"
          />

          {/* Sources */}
          {showSources && sources.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Sources</h3>
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
        </div>

        {/* Right Panel - Answer */}
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="text-green-500" size={20} />
              <h2 className="text-lg font-semibold">Answer</h2>
              {answer && <VoiceOutput text={answer} />}
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            
            {answer ? (
              <div className="space-y-4">
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{answer}</p>
                </div>
                
                {/* Confidence Display */}
                {confidence && (
                  <ConfidenceDisplay confidence={confidence} />
                )}
                
                <ExportOptions content={getExportContent()} />
              </div>
            ) : (
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