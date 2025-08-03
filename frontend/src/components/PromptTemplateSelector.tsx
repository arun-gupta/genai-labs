import React, { useState, useEffect } from 'react';
import { FileText, ChevronDown, ChevronRight, Settings } from 'lucide-react';
import { PromptTemplate, PromptTemplatesResponse } from '../types/api';
import { apiService } from '../services/api';

interface PromptTemplateSelectorProps {
  onTemplateSelect: (systemPrompt: string, userPrompt: string) => void;
  className?: string;
}

export const PromptTemplateSelector: React.FC<PromptTemplateSelectorProps> = ({
  onTemplateSelect,
  className = ""
}) => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response: PromptTemplatesResponse = await apiService.getPromptTemplates();
      setTemplates(response.templates);
      setCategories(response.categories);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(template => template.category === selectedCategory);

  const handleTemplateSelect = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    // Initialize variables with empty values
    const initialVariables: Record<string, string> = {};
    template.variables.forEach(variable => {
      initialVariables[variable] = '';
    });
    setVariables(initialVariables);
  };

  const handleVariableChange = (variable: string, value: string) => {
    setVariables(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const handleFillTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      const result = await apiService.fillTemplate({
        template_id: selectedTemplate.id,
        variables
      });
      
      onTemplateSelect(result.system_prompt, result.user_prompt);
      setIsOpen(false);
      setSelectedTemplate(null);
      setVariables({});
    } catch (error) {
      console.error('Failed to fill template:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'creative': return '🎨';
      case 'business': return '💼';
      case 'technical': return '⚙️';
      case 'academic': return '📚';
      case 'personal': return '👤';
      default: return '📝';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="text-gray-500" size={20} />
          <h3 className="text-lg font-medium text-gray-900">Prompt Templates</h3>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
        >
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span>{isOpen ? 'Hide' : 'Show'} Templates</span>
        </button>
      </div>

      {isOpen && (
        <div className="space-y-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Categories
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          {/* Templates List */}
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Loading templates...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{template.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {getCategoryIcon(template.category)} {template.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          {template.variables.length} variables
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Template Variables Form */}
          {selectedTemplate && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-3">
                <Settings className="text-blue-600" size={20} />
                <h4 className="font-medium text-gray-900">Fill Template Variables</h4>
              </div>
              
              <div className="space-y-3">
                {selectedTemplate.variables.map(variable => (
                  <div key={variable}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {variable.charAt(0).toUpperCase() + variable.slice(1).replace('_', ' ')}
                    </label>
                    <input
                      type="text"
                      value={variables[variable] || ''}
                      onChange={(e) => handleVariableChange(variable, e.target.value)}
                      placeholder={`Enter ${variable.replace('_', ' ')}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ))}
                
                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={handleFillTemplate}
                    disabled={Object.values(variables).some(v => !v.trim())}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Use Template
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTemplate(null);
                      setVariables({});
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 