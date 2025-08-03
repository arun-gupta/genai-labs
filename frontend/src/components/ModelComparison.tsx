import React, { useState } from 'react';
import { BarChart3, Clock, Target, TrendingUp, Award, Zap, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface ModelResult {
  model_provider: string;
  model_name: string;
  summary: string;
  original_length: number;
  summary_length: number;
  compression_ratio: number;
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
  average_compression_ratio: number;
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
}

export const ModelComparison: React.FC<ModelComparisonProps> = ({
  results,
  metrics,
  recommendations,
  isComparing
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'quality' | 'speed' | 'compression'>('quality');
  const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set());

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedResults(newExpanded);
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'quality': return <Target className="text-blue-500" size={16} />;
      case 'speed': return <Zap className="text-green-500" size={16} />;
      case 'compression': return <FileText className="text-purple-500" size={16} />;
      default: return <BarChart3 className="text-gray-500" size={16} />;
    }
  };

  const getMetricColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (result: ModelResult) => {
    const badges = [];
    
    if (metrics.best_quality_model === `${result.model_provider}/${result.model_name}`) {
      badges.push(
        <span key="quality" className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Award className="mr-1" size={12} />
          Best Quality
        </span>
      );
    }
    
    if (metrics.fastest_model === `${result.model_provider}/${result.model_name}`) {
      badges.push(
        <span key="speed" className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Zap className="mr-1" size={12} />
          Fastest
        </span>
      );
    }
    
    if (metrics.most_compressed_model === `${result.model_provider}/${result.model_name}`) {
      badges.push(
        <span key="compression" className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <FileText className="mr-1" size={12} />
          Most Concise
        </span>
      );
    }
    
    return badges;
  };

  if (isComparing) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Comparing models...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
          </div>
        </div>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Comparison Overview */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="text-blue-500" size={20} />
          <h2 className="text-lg font-semibold">Model Comparison Results</h2>
        </div>
        
        {/* Metrics Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {metrics.average_quality_score ? (metrics.average_quality_score * 100).toFixed(1) : 'N/A'}%
            </div>
            <div className="text-sm text-gray-600">Avg Quality</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {metrics.average_latency_ms ? (metrics.average_latency_ms / 1000).toFixed(1) : 'N/A'}s
            </div>
            <div className="text-sm text-gray-600">Avg Speed</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {metrics.average_compression_ratio ? (metrics.average_compression_ratio * 100).toFixed(1) : 'N/A'}%
            </div>
            <div className="text-sm text-gray-600">Avg Compression</div>
          </div>
          
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {metrics.total_models}
            </div>
            <div className="text-sm text-gray-600">Models Tested</div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-3">Recommendations</h3>
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg">
                  <CheckCircle className="text-yellow-600 mt-0.5" size={16} />
                  <p className="text-sm text-gray-700">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Model Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {results.map((result, index) => (
          <div key={index} className="card">
            {/* Model Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {result.model_provider}/{result.model_name}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  {getPerformanceBadge(result)}
                </div>
              </div>
              <button
                onClick={() => toggleExpanded(index)}
                className="text-blue-500 hover:text-blue-700"
              >
                {expandedResults.has(index) ? 'Show Less' : 'Show More'}
              </button>
            </div>

            {/* Summary */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Summary</h4>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {expandedResults.has(index) 
                    ? result.summary 
                    : result.summary.length > 200 
                      ? `${result.summary.substring(0, 200)}...` 
                      : result.summary
                  }
                </p>
              </div>
            </div>

            {/* Basic Metrics */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {result.summary_length}
                </div>
                <div className="text-xs text-gray-500">Words</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {(result.compression_ratio * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">Compression</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {result.latency_ms ? (result.latency_ms / 1000).toFixed(1) : 'N/A'}
                </div>
                <div className="text-xs text-gray-500">Seconds</div>
              </div>
            </div>

            {/* Quality Metrics */}
            {expandedResults.has(index) && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Quality Metrics</h4>
                
                <div className="space-y-2">
                  {result.quality_score !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Overall Quality</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${(result.quality_score * 100)}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${getMetricColor(result.quality_score)}`}>
                          {(result.quality_score * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {result.coherence_score !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Coherence</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${(result.coherence_score * 100)}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${getMetricColor(result.coherence_score)}`}>
                          {(result.coherence_score * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {result.relevance_score !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Relevance</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full" 
                            style={{ width: `${(result.relevance_score * 100)}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${getMetricColor(result.relevance_score)}`}>
                          {(result.relevance_score * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Token Usage */}
                {result.token_usage && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Token Usage</h5>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Total:</span>
                        <span className="font-medium ml-1">{result.token_usage.total_tokens}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Prompt:</span>
                        <span className="font-medium ml-1">{result.token_usage.prompt_tokens}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Completion:</span>
                        <span className="font-medium ml-1">{result.token_usage.completion_tokens}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 