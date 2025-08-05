import React, { useState } from 'react';
import { BarChart3, Clock, Target, TrendingUp, Award, Zap, FileText, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Lightbulb, Table } from 'lucide-react';

interface ModelResult {
  model_provider: string;
  model_name: string;
  summary?: string;
  generated_text?: string;
  original_length: number;
  summary_length?: number;
  generated_length?: number;
  compression_ratio?: number;
  token_usage?: {
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
  };
  latency_ms?: number;
  quality_score?: number;
  coherence_score?: number;
  relevance_score?: number;
  timestamp: string;
}

interface ComparisonMetrics {
  average_latency_ms: number;
  average_quality_score: number;
  average_coherence_score: number;
  average_relevance_score: number;
  average_compression_ratio?: number;
  best_quality_model?: string;
  fastest_model?: string;
  most_compressed_model?: string;
  total_models: number;
}

interface ModelComparisonProps {
  results: ModelResult[];
  metrics: ComparisonMetrics;
  recommendations: string[];
  isComparing: boolean;
  comparisonType: 'summarization' | 'generation';
  selectedModels?: string[]; // Add selected models for progress tracking
}

export const ModelComparison: React.FC<ModelComparisonProps> = ({
  results,
  metrics,
  recommendations,
  isComparing,
  comparisonType,
  selectedModels = []
}) => {
  const [expandedSummary, setExpandedSummary] = useState<number | null>(null);
  const [showDetailedMetrics, setShowDetailedMetrics] = useState(true);

  // Debug info
  console.log('ModelComparison render:', { isComparing, results: results?.length, selectedModels: selectedModels?.length });

  if (isComparing) {
    return (
      <div className="card">
        <div className="flex items-center space-x-2 mb-6">
          <BarChart3 className="text-blue-600" size={20} />
          <h3 className="text-lg font-semibold text-gray-900">Model Comparison in Progress</h3>
        </div>
        
        {/* Progress Overview */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm text-gray-500">
              {selectedModels.length > 0 ? `${selectedModels.length} models selected` : 'Processing...'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full transition-all duration-500 animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>

        {/* Comparison Steps */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Initializing comparison</p>
              <p className="text-xs text-gray-500">Setting up model evaluation framework</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Generating responses</p>
              <p className="text-xs text-gray-500">
                {selectedModels.length > 0 
                  ? `Processing ${selectedModels.length} models in parallel` 
                  : 'Processing models...'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-400">Analyzing quality metrics</p>
              <p className="text-xs text-gray-400">Evaluating coherence, relevance, and performance</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-400">Generating recommendations</p>
              <p className="text-xs text-gray-400">Creating insights and suggestions</p>
            </div>
          </div>
        </div>

        {/* Model Status */}
        {selectedModels.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Model Processing Status</h4>
            <div className="space-y-2">
              {selectedModels.map((model, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-2 w-2 border-b border-blue-600"></div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{model}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-xs text-gray-500">Processing...</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estimated Time */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Estimated time: 30-60s</span>
          </div>
        </div>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <BarChart3 className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Model Comparison Results</h3>
          <p className="text-gray-600 mb-6">
            Compare how different AI models {comparisonType === 'summarization' ? 'summarize' : 'generate'} the same content to find the best one for your needs.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <h4 className="font-medium text-blue-900 mb-2">How to compare models:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Enter your text, URL, or upload a file above</li>
              <li>2. Select 2 or more models in the Model Comparison section</li>
              <li>3. Click "Compare Models" to see results</li>
              <li>4. View quality scores, performance metrics, and recommendations</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  const toggleExpandedSummary = (index: number) => {
    setExpandedSummary(expandedSummary === index ? null : index);
  };

  const getMetricColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getPerformanceBadge = (result: ModelResult) => {
    if (!result.latency_ms) return null;
    
    const latencySeconds = result.latency_ms / 1000;
    if (latencySeconds < 2) return { text: 'Fast', color: 'bg-green-100 text-green-800' };
    if (latencySeconds < 5) return { text: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Slow', color: 'bg-red-100 text-red-800' };
  };

  const getContent = (result: ModelResult) => {
    return comparisonType === 'summarization' ? result.summary : result.generated_text;
  };

  const getContentLength = (result: ModelResult) => {
    return comparisonType === 'summarization' ? result.summary_length : result.generated_length;
  };

  const getContentColumnHeader = () => {
    return comparisonType === 'summarization' ? 'Summary' : 'Generated Text';
  };

  const getLengthColumnHeader = () => {
    return comparisonType === 'summarization' ? 'Summary Length' : 'Generated Length';
  };

  const getCompressionColumn = () => {
    return comparisonType === 'summarization' ? 'Compression Ratio' : null;
  };

  const getCompressionCell = (result: ModelResult) => {
    if (comparisonType !== 'summarization' || !result.compression_ratio) return null;
    return (
      <td className="px-4 py-4 text-center">
        <div className="text-sm font-medium text-gray-900">
          {result.compression_ratio.toFixed(1)}%
        </div>
      </td>
    );
  };

  return (
    <div className="space-y-6">
      {/* Quick Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((result, index) => (
          <div key={index} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 text-sm truncate">
                {result.model_provider}/{result.model_name}
              </h4>
              {getPerformanceBadge(result) && (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPerformanceBadge(result)!.color}`}>
                  {getPerformanceBadge(result)!.text}
                </span>
              )}
            </div>
            
            {/* Key Metrics */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Quality</span>
                <span className="text-sm font-medium text-gray-900">
                  {result.quality_score ? `${result.quality_score.toFixed(0)}%` : 'N/A'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full" 
                  style={{ width: `${result.quality_score || 0}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Speed</span>
                <span className="text-sm font-medium text-gray-900">
                  {result.latency_ms ? `${(result.latency_ms / 1000).toFixed(1)}s` : 'N/A'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-green-500 h-1.5 rounded-full" 
                  style={{ width: `${result.latency_ms ? Math.min((result.latency_ms / 10000) * 100, 100) : 0}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Tokens</span>
                <span className="text-sm font-medium text-gray-900">
                  {result.token_usage?.total_tokens || 'N/A'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-orange-500 h-1.5 rounded-full" 
                  style={{ width: `${result.token_usage?.total_tokens ? Math.min((result.token_usage.total_tokens / 1000) * 100, 100) : 0}%` }}
                ></div>
              </div>
            </div>
            
            {/* Content Preview */}
            <div className="border-t pt-3">
              <p className="text-xs text-gray-600 mb-1">Preview:</p>
              <p className="text-sm text-gray-700 line-clamp-3">
                {getContent(result)?.substring(0, 100)}...
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Lightbulb className="text-yellow-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Recommendations</h3>
          </div>
          <div className="space-y-3">
            {recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <p className="text-sm text-gray-700">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Results Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Table className="text-blue-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Detailed Results</h3>
          </div>
          <button
            onClick={() => setShowDetailedMetrics(!showDetailedMetrics)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            {showDetailedMetrics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{showDetailedMetrics ? 'Hide' : 'Show'} Details</span>
          </button>
        </div>

        {showDetailedMetrics && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {getContentColumnHeader()}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quality
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Speed
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tokens
                  </th>
                  {getCompressionColumn() && (
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {getCompressionColumn()}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {result.model_provider}/{result.model_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">
                        {getContent(result) ? (
                          <div>
                            <div className={`${expandedSummary === index ? '' : 'line-clamp-2'}`}>
                              {getContent(result)}
                            </div>
                            {getContent(result)!.length > 150 && (
                              <button
                                onClick={() => toggleExpandedSummary(index)}
                                className="text-blue-600 hover:text-blue-800 text-xs mt-1"
                              >
                                {expandedSummary === index ? 'Show less' : 'Show more'}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">No content generated</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {result.quality_score ? `${result.quality_score.toFixed(0)}%` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {result.latency_ms ? `${(result.latency_ms / 1000).toFixed(1)}s` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {result.token_usage?.total_tokens || 'N/A'}
                      </div>
                    </td>
                    {getCompressionCell(result)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}; 