import React, { useState, useEffect } from 'react';
import { History, Clock, Zap, Copy, Trash2, Search, Filter, Download, RefreshCw } from 'lucide-react';
import { PromptHistory } from '../utils/storage';
import { storageUtils } from '../utils/storage';

interface PromptHistoryProps {
  onLoadPrompt: (systemPrompt: string, userPrompt: string) => void;
  className?: string;
}

export const PromptHistoryComponent: React.FC<PromptHistoryProps> = ({
  onLoadPrompt,
  className = ""
}) => {
  const [history, setHistory] = useState<PromptHistory[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<PromptHistory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'generate' | 'summarize'>('all');
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    filterHistory();
  }, [history, searchTerm, selectedType]);

  const loadHistory = () => {
    const savedHistory = storageUtils.getPromptHistory();
    setHistory(savedHistory.reverse()); // Show newest first
  };

  const filterHistory = () => {
    let filtered = history;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        (item.system_prompt && item.system_prompt.toLowerCase().includes(term)) ||
        (item.user_prompt && item.user_prompt.toLowerCase().includes(term)) ||
        (item.text && item.text.toLowerCase().includes(term)) ||
        item.response.toLowerCase().includes(term) ||
        item.model_name.toLowerCase().includes(term)
      );
    }

    setFilteredHistory(filtered);
  };

  const handleLoadPrompt = (item: PromptHistory) => {
    if (item.type === 'generate') {
      onLoadPrompt(item.system_prompt || '', item.user_prompt || '');
    } else {
      // For summarize, we can't load the original text back, but we can show the summary
      onLoadPrompt('', `Summarize: ${item.text || ''}`);
    }
    setIsOpen(false);
  };

  const handleCopyResponse = async (response: string, id: string) => {
    try {
      await navigator.clipboard.writeText(response);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleDeleteItem = (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    storageUtils.savePromptHistory(updatedHistory.reverse()); // Reverse back for storage
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
      storageUtils.clearPromptHistory();
      setHistory([]);
      setFilteredHistory([]);
    }
  };

  const handleExportHistory = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `genai-lab-history-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <History className="text-blue-600" size={20} />
          <h3 className="text-lg font-semibold text-gray-900">Prompt History</h3>
          <span className="text-sm text-gray-500">({history.length} items)</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadHistory}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh history"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={handleExportHistory}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Export history"
          >
            <Download size={16} />
          </button>
          <button
            onClick={handleClearHistory}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            title="Clear all history"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search prompts, responses, or models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="text-gray-400" size={16} />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as 'all' | 'generate' | 'summarize')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="generate">Text Generation</option>
            <option value="summarize">Summarization</option>
          </select>
        </div>
      </div>

      {/* History List */}
      <div className="max-h-96 overflow-y-auto space-y-3">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {history.length === 0 ? (
              <div>
                <History className="mx-auto mb-2 text-gray-300" size={32} />
                <p>No history yet</p>
                <p className="text-sm">Your prompts and responses will appear here</p>
              </div>
            ) : (
              <div>
                <Search className="mx-auto mb-2 text-gray-300" size={32} />
                <p>No results found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.type === 'generate' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {item.type === 'generate' ? 'Generation' : 'Summarization'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(item.timestamp)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleCopyResponse(item.response, item.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy response"
                  >
                    {copiedId === item.id ? (
                      <span className="text-green-500 text-xs">Copied!</span>
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                {/* Prompts */}
                {item.type === 'generate' ? (
                  <div>
                    {item.system_prompt && (
                      <div className="mb-2">
                        <div className="text-xs font-medium text-gray-500 mb-1">System Prompt</div>
                        <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                          {truncateText(item.system_prompt, 150)}
                        </div>
                      </div>
                    )}
                    {item.user_prompt && (
                      <div className="mb-2">
                        <div className="text-xs font-medium text-gray-500 mb-1">User Prompt</div>
                        <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                          {truncateText(item.user_prompt, 150)}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-2">
                    <div className="text-xs font-medium text-gray-500 mb-1">Input</div>
                    <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                      {truncateText(item.text || '', 150)}
                    </div>
                  </div>
                )}

                {/* Response Preview */}
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Response</div>
                  <div className="text-sm text-gray-700 bg-blue-50 p-2 rounded">
                    {truncateText(item.response, 200)}
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <Zap size={12} />
                      <span>{item.model_name}</span>
                    </div>
                    {item.token_usage && (
                      <span>{item.token_usage.total_tokens} tokens</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock size={12} />
                    <span>{item.latency_ms}ms</span>
                  </div>
                </div>
              </div>

              {/* Load Button */}
              <button
                onClick={() => handleLoadPrompt(item)}
                className="mt-3 w-full py-2 px-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                Load Prompt
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 