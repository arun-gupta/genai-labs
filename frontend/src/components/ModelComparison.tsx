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
  comparisonType: 'summarization' | 'generation' | 'rag';
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
  console.log('ModelComparison render:', { 
    isComparing, 
    results: results?.length, 
    selectedModels: selectedModels?.length,
    hasResults: !!results,
    resultsData: results,
    metrics: metrics,
    recommendations: recommendations
  });

  if (isComparing) {
    console.log('Showing progress indicators because isComparing is true');
    
    // Different progress steps based on comparison type
    const getProgressSteps = () => {
      if (comparisonType === 'rag') {
        return [
          {
            title: "Initializing RAG comparison",
            description: "Setting up document retrieval and model evaluation",
            status: "completed",
            icon: <CheckCircle className="w-5 h-5 text-green-600" />
          },
          {
            title: "Retrieving relevant documents",
            description: "Searching through document collections for context",
            status: "active",
            icon: <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          },
          {
            title: "Generating responses",
            description: `Processing ${selectedModels.length > 0 ? selectedModels.length : ''} models with document context`,
            status: "active",
            icon: <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          },
          {
            title: "Analyzing quality metrics",
            description: "Evaluating relevance, coherence, and source accuracy",
            status: "pending",
            icon: <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
          },
          {
            title: "Generating recommendations",
            description: "Creating insights and suggestions",
            status: "pending",
            icon: <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
          }
        ];
      } else {
        // Generate/Summarize comparison steps
        return [
          {
            title: "Initializing comparison",
            description: "Setting up model evaluation framework and preparing prompts",
            status: "completed",
            icon: <CheckCircle className="w-5 h-5 text-green-600" />
          },
          {
            title: "Generating responses",
            description: `Processing ${selectedModels.length > 0 ? selectedModels.length : ''} models in parallel`,
            status: "active",
            icon: <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          },
          {
            title: "Analyzing quality metrics",
            description: "Evaluating coherence, relevance, and performance indicators",
            status: "active",
            icon: <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
          },
          {
            title: "Calculating performance scores",
            description: "Computing speed, efficiency, and quality rankings",
            status: "active",
            icon: <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
          },
          {
            title: "Generating recommendations",
            description: "Creating insights and suggestions for optimal model selection",
            status: "pending",
            icon: <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
          }
        ];
      }
    };

    const progressSteps = getProgressSteps();
    const getStepStyle = (status: string) => {
      switch (status) {
        case "completed":
          return "bg-green-100";
        case "active":
          return "bg-blue-100";
        case "pending":
          return "bg-gray-100";
        default:
          return "bg-gray-100";
      }
    };

    const getTextStyle = (status: string) => {
      switch (status) {
        case "completed":
          return "text-gray-900";
        case "active":
          return "text-gray-900";
        case "pending":
          return "text-gray-400";
        default:
          return "text-gray-400";
      }
    };

    const getDescriptionStyle = (status: string) => {
      switch (status) {
        case "completed":
          return "text-gray-500";
        case "active":
          return "text-gray-500";
        case "pending":
          return "text-gray-400";
        default:
          return "text-gray-400";
      }
    };

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
            <div className="bg-blue-500 h-2 rounded-full transition-all duration-500 animate-pulse" style={{ width: comparisonType === 'rag' ? '60%' : '75%' }}></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {comparisonType === 'rag' 
              ? 'Analyzing model performance with document context...'
              : 'Analyzing model performance and generating comprehensive metrics...'
            }
          </p>
        </div>

        {/* Comparison Steps */}
        <div className="space-y-4 mb-6">
          {progressSteps.map((step, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 ${getStepStyle(step.status)} rounded-full flex items-center justify-center`}>
                  {step.icon}
                </div>
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${getTextStyle(step.status)}`}>{step.title}</p>
                <p className={`text-xs ${getDescriptionStyle(step.status)}`}>{step.description}</p>
              </div>
            </div>
          ))}
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
                    <p className="text-xs text-gray-500">
                      {comparisonType === 'rag' 
                        ? 'Processing with document context...'
                        : 'Processing and analyzing response quality'
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estimated Time */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-700">
              {comparisonType === 'rag' 
                ? `Estimated time: ${Math.max(15, selectedModels.length * 5)}s`
                : `Estimated completion time: ${selectedModels.length > 0 ? `${Math.max(2, selectedModels.length * 1.5)}s` : '2-5s'}`
              }
            </span>
          </div>
          {comparisonType === 'rag' && (
            <p className="text-xs text-blue-600 mt-1">Time varies based on document complexity and model performance.</p>
          )}
        </div>
      </div>
    );
  }

  if (!results || results.length === 0) {
    console.log('Showing no results message because:', { 
      hasResults: !!results, 
      resultsLength: results?.length,
      results: results 
    });
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

  const getContent = (result: ModelResult) => {
    return comparisonType === 'summarization' ? result.summary : result.generated_text;
  };

  const getContentColumnHeader = () => {
    return comparisonType === 'summarization' ? 'Summary' : 'Generated Text';
  };

  const getCompressionColumn = () => {
    return comparisonType === 'summarization' ? 'Compression Ratio' : null;
  };

  const getCompressionCell = (result: ModelResult) => {
    if (comparisonType !== 'summarization' || !result.compression_ratio) return null;
    return (
      <td className="px-4 py-4 text-center">
        <div className="text-sm font-medium text-gray-900">
          {(result.compression_ratio * 100).toFixed(1)}%
        </div>
      </td>
    );
  };

  return (
    <div className="space-y-6">
      {/* Response Content Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((result, index) => (
          <div key={index} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 text-sm truncate">
                {result.model_provider}/{result.model_name}
              </h4>
              {result.latency_ms && (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  result.latency_ms < 2000 ? 'bg-green-100 text-green-800' :
                  result.latency_ms < 5000 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {result.latency_ms < 2000 ? 'Fast' : result.latency_ms < 5000 ? 'Medium' : 'Slow'}
                </span>
              )}
            </div>
            
            {/* Content */}
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600 mb-1">Response:</p>
                <div className="text-sm text-gray-700">
                  {getContent(result) ? (
                    <div>
                      <div className={`${expandedSummary === index ? '' : 'line-clamp-4'}`}>
                        {getContent(result)}
                      </div>
                      {getContent(result)!.length > 200 && (
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
              </div>
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

      {/* Metrics Charts */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <BarChart3 className="text-blue-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
          </div>
          <button
            onClick={() => setShowDetailedMetrics(!showDetailedMetrics)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            {showDetailedMetrics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{showDetailedMetrics ? 'Hide' : 'Show'} Charts</span>
          </button>
        </div>

        {showDetailedMetrics && (
          <div className="space-y-6">
            {/* Quality Comparison Chart */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Quality Scores</h4>
              <div className="space-y-3">
                {results.map((result, index) => {
                  // Debug logging
                  console.log(`Model ${result.model_provider}/${result.model_name} quality data:`, {
                    quality_score: result.quality_score,
                    coherence_score: result.coherence_score,
                    relevance_score: result.relevance_score,
                    raw_result: result
                  });
                  
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{result.model_provider}/{result.model_name}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {result.quality_score ? `${result.quality_score.toFixed(0)}%` : 'N/A'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-blue-500 h-3 rounded-full transition-all duration-300" 
                          style={{ width: `${result.quality_score || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Coherence & Relevance Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Coherence Scores</h4>
                <div className="space-y-3">
                  {results.map((result, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{result.model_provider}/{result.model_name}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {result.coherence_score ? `${result.coherence_score.toFixed(0)}%` : 'N/A'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-green-500 h-3 rounded-full transition-all duration-300" 
                          style={{ width: `${result.coherence_score || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Relevance Scores</h4>
                <div className="space-y-3">
                  {results.map((result, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{result.model_provider}/{result.model_name}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {result.relevance_score ? `${result.relevance_score.toFixed(0)}%` : 'N/A'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-purple-500 h-3 rounded-full transition-all duration-300" 
                          style={{ width: `${result.relevance_score || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Speed Comparison Chart */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Response Time (Lower is better)</h4>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{result.model_provider}/{result.model_name}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {result.latency_ms ? `${(result.latency_ms / 1000).toFixed(1)}s` : 'N/A'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-green-500 h-3 rounded-full transition-all duration-300" 
                        style={{ 
                          width: `${result.latency_ms ? Math.min((result.latency_ms / 10000) * 100, 100) : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Efficiency Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Words per Second</h4>
                <div className="space-y-3">
                  {results.map((result, index) => {
                    const wordsPerSecond = result.latency_ms && getContent(result) 
                      ? (getContent(result)!.split(' ').length / (result.latency_ms / 1000)).toFixed(1)
                      : 'N/A';
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{result.model_provider}/{result.model_name}</span>
                          <span className="text-sm font-medium text-gray-900">{wordsPerSecond}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-cyan-500 h-3 rounded-full transition-all duration-300" 
                            style={{ 
                              width: `${wordsPerSecond !== 'N/A' ? Math.min((parseFloat(wordsPerSecond) / 50) * 100, 100) : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Tokens per Second</h4>
                <div className="space-y-3">
                  {results.map((result, index) => {
                    const tokensPerSecond = result.latency_ms && result.token_usage?.total_tokens
                      ? (result.token_usage.total_tokens / (result.latency_ms / 1000)).toFixed(1)
                      : 'N/A';
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{result.model_provider}/{result.model_name}</span>
                          <span className="text-sm font-medium text-gray-900">{tokensPerSecond}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-teal-500 h-3 rounded-full transition-all duration-300" 
                            style={{ 
                              width: `${tokensPerSecond !== 'N/A' ? Math.min((parseFloat(tokensPerSecond) / 100) * 100, 100) : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Token Usage Chart */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Token Usage</h4>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{result.model_provider}/{result.model_name}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {result.token_usage?.total_tokens || 'N/A'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-orange-500 h-3 rounded-full transition-all duration-300" 
                        style={{ 
                          width: `${result.token_usage?.total_tokens ? Math.min((result.token_usage.total_tokens / 1000) * 100, 100) : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Estimation */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Estimated Cost (USD)</h4>
              <div className="space-y-3">
                {results.map((result, index) => {
                  // Rough cost estimation based on token usage
                  const estimatedCost = result.token_usage?.total_tokens 
                    ? (result.token_usage.total_tokens * 0.00002).toFixed(4) // ~$0.02 per 1K tokens
                    : 'N/A';
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{result.model_provider}/{result.model_name}</span>
                        <span className="text-sm font-medium text-gray-900">${estimatedCost}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-red-500 h-3 rounded-full transition-all duration-300" 
                          style={{ 
                            width: `${estimatedCost !== 'N/A' ? Math.min((parseFloat(estimatedCost) / 0.01) * 100, 100) : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Comparative Rankings */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Performance Rankings</h4>
              <div className="space-y-3">
                {(() => {
                  // Calculate rankings based on multiple factors
                  const rankedResults = results.map((result, index) => {
                    const qualityScore = result.quality_score || 0;
                    const speedScore = result.latency_ms ? Math.max(0, 100 - (result.latency_ms / 100)) : 0;
                    const efficiencyScore = result.token_usage?.total_tokens ? Math.max(0, 100 - (result.token_usage.total_tokens / 10)) : 0;
                    const overallScore = (qualityScore + speedScore + efficiencyScore) / 3;
                    return { ...result, overallScore, originalIndex: index };
                  }).sort((a, b) => b.overallScore - a.overallScore);

                  return rankedResults.map((result, rankIndex) => (
                    <div key={result.originalIndex} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${
                            rankIndex === 0 ? 'text-yellow-600' : 
                            rankIndex === 1 ? 'text-gray-600' : 
                            rankIndex === 2 ? 'text-amber-600' : 'text-gray-500'
                          }`}>
                            #{rankIndex + 1}
                          </span>
                          <span className="text-sm text-gray-600">{result.model_provider}/{result.model_name}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {result.overallScore.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-300 ${
                            rankIndex === 0 ? 'bg-yellow-500' : 
                            rankIndex === 1 ? 'bg-gray-500' : 
                            rankIndex === 2 ? 'bg-amber-500' : 'bg-gray-400'
                          }`}
                          style={{ width: `${result.overallScore}%` }}
                        ></div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Compression Ratio Chart (for summarization only) */}
            {comparisonType === 'summarization' && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Compression Ratio</h4>
                <div className="space-y-3">
                  {results.map((result, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{result.model_provider}/{result.model_name}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {result.compression_ratio ? 
                            `${(result.compression_ratio * 100).toFixed(1)}% of original` : 'N/A'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-purple-500 h-3 rounded-full transition-all duration-300" 
                          style={{ 
                            width: `${result.compression_ratio ? (result.compression_ratio * 100) : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 