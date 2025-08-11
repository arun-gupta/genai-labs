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

interface CloudModel {
  id: string;
  name: string;
  models: string[];
  requires_api_key: boolean;
  api_key_configured?: boolean;
  configured_model?: string;
  description?: string;
}

interface ModelsData {
  models: Model[];
  available_count: number;
  total_count: number;
  categories: string[];
  organizations: string[];
}

interface AllModelsData {
  providers: CloudModel[];
  ollama_models: ModelsData;
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
  const [allModelsData, setAllModelsData] = useState<AllModelsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedOrganization, setSelectedOrganization] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'local' | 'cloud'>('local');

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getAvailableModels();
      setAllModelsData(data as AllModelsData);
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

  const filteredModels = allModelsData?.ollama_models.models.filter(model => {
    const matchesSearch = model.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || model.category === selectedCategory;
    const matchesOrganization = selectedOrganization === 'all' || model.organization === selectedOrganization;
    
    let matchesAvailability = true;
    if (availabilityFilter === 'available') matchesAvailability = model.status === "Available";
    else if (availabilityFilter === 'installed') matchesAvailability = model.status === "Installed (Not Running)";
    else if (availabilityFilter === 'download') matchesAvailability = model.status === "Download Required";
    
    return matchesSearch && matchesCategory && matchesOrganization && matchesAvailability;
  }) || [];

  const availableModels = filteredModels.filter(m => m.status === "Available");
  const installedModels = filteredModels.filter(m => m.status === "Installed (Not Running)");
  const downloadRequiredModels = filteredModels.filter(m => m.status === "Download Required");

  const cloudModels = allModelsData?.providers || [];

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

  const renderModelCard = (model: Model, isAvailable: boolean, statusType?: string) => {
    const CategoryIcon = categoryIcons[model.category as keyof typeof categoryIcons] || Zap;
    const orgColor = organizationColors[model.organization as keyof typeof organizationColors] || 'bg-gray-100 text-gray-800';
    
    return (
      <div 
        key={model.name}
        className={`rounded-lg border-2 transition-all duration-200 hover:shadow-lg ${
          isAvailable 
            ? 'bg-gradient-to-br from-green-50 to-white border-green-300 hover:border-green-400 shadow-sm' 
            : 'bg-white border-blue-200 hover:border-blue-300'
        }`}
      >
        {/* Header */}
        <div className={`p-4 border-b ${isAvailable ? 'border-green-100' : 'border-gray-100'}`}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <CategoryIcon className={`w-5 h-5 ${isAvailable ? 'text-green-600' : 'text-blue-600'}`} />
              <h3 className="font-semibold text-gray-900">{model.display_name}</h3>
            </div>
            {isAvailable ? (
              <div className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-full">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-700">Available</span>
              </div>
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
        <div className={`px-4 py-2 border-b ${isAvailable ? 'border-green-100' : 'border-gray-100'}`}>
          <div className="flex flex-wrap gap-1">
            {model.tags.slice(0, 3).map((tag, index) => (
              <span 
                key={index}
                className={`px-2 py-1 rounded-full text-xs ${
                  isAvailable ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                }`}
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
              isAvailable ? 'text-green-600' : 
              statusType === 'installed' ? 'text-purple-600' : 'text-blue-600'
            }`}>
              {isAvailable ? 'Ready to Use' : 
               statusType === 'installed' ? 'Installed (Not Running)' : 'Download Required'}
            </span>
          </div>
          
          <button
            onClick={() => copyToClipboard(model.download_command)}
            className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              copiedCommand === model.download_command
                ? 'bg-green-100 text-green-700'
                : isAvailable 
                  ? 'bg-green-50 text-green-700 hover:bg-green-100'
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
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Models</h1>
        <p className="text-xl text-gray-600 mb-2">
          Explore local and cloud-based AI models
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('local')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'local'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Local Models ({allModelsData?.ollama_models.total_count || 0})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('cloud')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'cloud'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <span>Cloud Models ({cloudModels.length})</span>
            </div>
          </button>
        </div>
      </div>

      {/* Local Models Tab */}
      {activeTab === 'local' && (
        <>
          {/* Availability Summary */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-center space-x-8 text-sm">
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-700">{allModelsData?.ollama_models.available_count} Ready to Use</span>
              </div>
              <div className="flex items-center space-x-2 bg-blue-100 px-3 py-1 rounded-full">
                <Download className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-700">{(allModelsData?.ollama_models.total_count || 0) - (allModelsData?.ollama_models.available_count || 0)} Need Download</span>
              </div>
            </div>
          </div>
        </>
      )}

              {/* Local Models Content */}
        {activeTab === 'local' && (
          <>
            {/* Legend */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Legend</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm">Available - Ready to use</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Tag className="w-5 h-5 text-purple-500" />
                  <span className="text-sm">Installed (Not Running)</span>
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
                    {allModelsData?.ollama_models.categories.map(category => (
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
                    {allModelsData?.ollama_models.organizations.map(org => (
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
                    <option value="installed">Installed (Not Running)</option>
                    <option value="download">Download Required</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Cloud Models Tab */}
        {activeTab === 'cloud' && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-blue-900 mb-2">Cloud-Based AI Models</h2>
              <p className="text-blue-700">Access powerful cloud models with API keys</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cloudModels.map((provider) => (
                <div key={provider.id} className="bg-white rounded-lg border border-blue-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-6 h-6 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                    </div>
                    {provider.requires_api_key ? (
                      provider.api_key_configured ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Configured
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          API Key Required
                        </span>
                      )
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Free Tier
                      </span>
                    )}
                  </div>
                  
                  {provider.description && (
                    <p className="text-sm text-gray-600 mb-4">{provider.description}</p>
                  )}
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Available Models:</h4>
                    <div className="flex flex-wrap gap-1">
                      {provider.models.map((model, index) => (
                        <span 
                          key={index}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            model === provider.configured_model
                              ? 'bg-green-100 text-green-800 border border-green-300'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {model}
                          {model === provider.configured_model && (
                            <span className="ml-1 text-green-600">✓</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        {provider.models.length} model{provider.models.length !== 1 ? 's' : ''}
                        {provider.configured_model && (
                          <span className="ml-2 text-green-600">
                            • {provider.configured_model} configured
                          </span>
                        )}
                      </span>
                      <div className="flex items-center space-x-2">
                        {provider.requires_api_key && (
                          <ExternalLink className="w-4 h-4 text-blue-600" />
                        )}
                        <span className={`text-xs font-medium ${
                          provider.api_key_configured ? 'text-green-600' : provider.requires_api_key ? 'text-blue-600' : 'text-green-600'
                        }`}>
                          {provider.api_key_configured ? 'Ready to Use' : provider.requires_api_key ? 'Setup Required' : 'Ready to Use'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 bg-blue-100 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Getting Started with Cloud Models</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Configure API keys in your environment variables</li>
                <li>• Cloud models provide high performance and reliability</li>
                <li>• Pay-per-use pricing for most providers</li>
                <li>• No local storage or processing required</li>
              </ul>
            </div>
          </div>
        )}

        {/* Local Models Display */}
        {activeTab === 'local' && (
          <>
            {/* Available Models Section */}
            {availableModels.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center space-x-2 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h2 className="text-2xl font-bold text-green-700">Ready to Use</h2>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm font-medium">
                    {availableModels.length} model{availableModels.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableModels.map((model) => renderModelCard(model, true))}
                </div>
              </div>
            )}

            {/* Installed Models Section */}
            {installedModels.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center space-x-2 mb-4">
                  <Tag className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-purple-700">Installed (Not Running)</h2>
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-sm font-medium">
                    {installedModels.length} model{installedModels.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {installedModels.map((model) => renderModelCard(model, false, "installed"))}
                </div>
              </div>
            )}

            {/* Download Required Models Section */}
            {downloadRequiredModels.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center space-x-2 mb-4">
                  <Download className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-blue-700">Download Required</h2>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm font-medium">
                    {downloadRequiredModels.length} model{downloadRequiredModels.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {downloadRequiredModels.map((model) => renderModelCard(model, false, "download"))}
                </div>
              </div>
            )}

            {/* No Results */}
            {filteredModels.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No models found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            )}
          </>
        )}
    </div>
  );
}; 