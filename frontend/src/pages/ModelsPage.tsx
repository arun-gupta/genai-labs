import React, { useState, useEffect } from 'react';
import { 
  Download, 
  CheckCircle, 
  Clock, 
  Search, 
  Filter, 
  Zap, 
  Code, 
  MessageCircle, 
  Globe, 
  Brain,
  Star,
  Tag,
  ExternalLink,
  Copy
} from 'lucide-react';
import { apiService } from '../services/api';

interface Model {
  name: string;
  display_name: string;
  description: string;
  parameters: string;
  organization: string;
  license: string;
  download_command: string;
  category: string;
  tags: string[];
  is_available: boolean;
  status: string;
}

interface ModelsData {
  models: Model[];
  available_count: number;
  total_count: number;
  categories: string[];
  organizations: string[];
}

const categoryIcons = {
  'Efficient Reasoning': Brain,
  'Reasoning': Brain,
  'Coding': Code,
  'Conversational': MessageCircle,
  'Multilingual': Globe,
  'Efficient': Zap,
  'High Performance': Star,
  'General Purpose': Zap
};

const organizationColors = {
  'Meta': 'bg-blue-100 text-blue-800',
  'Microsoft': 'bg-green-100 text-green-800',
  'Google': 'bg-red-100 text-red-800',
  'Alibaba': 'bg-orange-100 text-orange-800',
  'DeepSeek': 'bg-purple-100 text-purple-800',
  'xAI': 'bg-gray-100 text-gray-800',
  'BigScience': 'bg-indigo-100 text-indigo-800',
  'Mistral AI': 'bg-pink-100 text-pink-800',
  'Intel': 'bg-cyan-100 text-cyan-800'
};

export const ModelsPage: React.FC = () => {
  const [modelsData, setModelsData] = useState<ModelsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedOrganization, setSelectedOrganization] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getAvailableModels();
      setModelsData(data.ollama_models);
    } catch (err) {
      setError('Failed to load models');
      console.error('Error loading models:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCommand(text);
      setTimeout(() => setCopiedCommand(null), 2000);
    } catch (err) {
      console.error('Failed to copy command:', err);
    }
  };

  const filteredModels = modelsData?.models.filter(model => {
    const matchesSearch = model.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || model.category === selectedCategory;
    const matchesOrganization = selectedOrganization === 'all' || model.organization === selectedOrganization;
    
    let matchesAvailability = true;
    if (availabilityFilter === 'available') matchesAvailability = model.is_available;
    else if (availabilityFilter === 'download') matchesAvailability = !model.is_available;
    
    return matchesSearch && matchesCategory && matchesOrganization && matchesAvailability;
  }) || [];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading models...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={loadModels}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Open Source Models</h1>
        <p className="text-xl text-gray-600 mb-2">
          Explore {modelsData?.total_count} open-source language models
        </p>
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>{modelsData?.available_count} Available</span>
          </div>
          <div className="flex items-center space-x-1">
            <Download className="w-4 h-4 text-blue-500" />
            <span>{modelsData?.total_count - (modelsData?.available_count || 0)} Download Required</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm">Available - Ready to use</span>
          </div>
          <div className="flex items-center space-x-2">
            <Download className="w-5 h-5 text-blue-500" />
            <span className="text-sm">Download Required - Run command to install</span>
          </div>
          <div className="flex items-center space-x-2">
            <Tag className="w-5 h-5 text-purple-500" />
            <span className="text-sm">Click command to copy</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search models, descriptions, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {modelsData?.categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
            <select
              value={selectedOrganization}
              onChange={(e) => setSelectedOrganization(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Organizations</option>
              {modelsData?.organizations.map(org => (
                <option key={org} value={org}>{org}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Models</option>
              <option value="available">Available</option>
              <option value="download">Download Required</option>
            </select>
          </div>
        </div>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModels.map((model) => {
          const CategoryIcon = categoryIcons[model.category as keyof typeof categoryIcons] || Zap;
          const orgColor = organizationColors[model.organization as keyof typeof organizationColors] || 'bg-gray-100 text-gray-800';
          
          return (
            <div 
              key={model.name}
              className={`bg-white rounded-lg border-2 transition-all duration-200 hover:shadow-lg ${
                model.is_available 
                  ? 'border-green-200 hover:border-green-300' 
                  : 'border-blue-200 hover:border-blue-300'
              }`}
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <CategoryIcon className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">{model.display_name}</h3>
                  </div>
                  {model.is_available ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Download className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${orgColor}`}>
                    {model.organization}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    {model.parameters}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2">{model.description}</p>
              </div>

              {/* Tags */}
              <div className="px-4 py-2 border-b border-gray-100">
                <div className="flex flex-wrap gap-1">
                  {model.tags.slice(0, 3).map((tag, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                  {model.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded-full text-xs">
                      +{model.tags.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500">License: {model.license}</span>
                  <span className={`text-xs font-medium ${
                    model.is_available ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {model.status}
                  </span>
                </div>
                
                <button
                  onClick={() => copyToClipboard(model.download_command)}
                  className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    copiedCommand === model.download_command
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Tag className="w-4 h-4" />
                  <span className="font-mono text-xs">
                    {copiedCommand === model.download_command ? 'Copied!' : model.download_command}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* No Results */}
      {filteredModels.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No models found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}; 