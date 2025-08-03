import React from 'react';
import { BarChart3, TrendingUp, BookOpen, Brain, Target, Zap } from 'lucide-react';
import { AnalyticsResponse } from '../types/api';

interface AnalyticsDisplayProps {
  analytics: AnalyticsResponse['analytics'] | null;
  isLoading: boolean;
}

export const AnalyticsDisplay: React.FC<AnalyticsDisplayProps> = ({ analytics, isLoading }) => {
  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Analyzing summary...</span>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Summary Analytics</h3>
          <p className="text-gray-600">Generate a summary to see detailed analytics and insights.</p>
        </div>
      </div>
    );
  }

  const { basic_metrics, readability_scores, content_analysis, sentiment_analysis, keyword_analysis, summary_quality } = analytics;

  const getReadabilityLevel = (score: number) => {
    if (score >= 90) return { level: 'Very Easy', color: 'text-green-600' };
    if (score >= 80) return { level: 'Easy', color: 'text-green-500' };
    if (score >= 70) return { level: 'Fairly Easy', color: 'text-yellow-600' };
    if (score >= 60) return { level: 'Standard', color: 'text-yellow-500' };
    if (score >= 50) return { level: 'Fairly Difficult', color: 'text-orange-500' };
    if (score >= 30) return { level: 'Difficult', color: 'text-red-500' };
    return { level: 'Very Difficult', color: 'text-red-600' };
  };

  const getSentimentLabel = (compound: number) => {
    if (compound >= 0.05) return { label: 'Positive', color: 'text-green-600' };
    if (compound <= -0.05) return { label: 'Negative', color: 'text-red-600' };
    return { label: 'Neutral', color: 'text-gray-600' };
  };

  return (
    <div className="space-y-6">
      {/* Basic Metrics */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="text-blue-600" size={20} />
          <h2 className="text-xl font-semibold text-gray-900">Basic Metrics</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Original Text</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Characters:</span>
                <span className="font-medium">{basic_metrics.original.characters.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Words:</span>
                <span className="font-medium">{basic_metrics.original.words.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Sentences:</span>
                <span className="font-medium">{basic_metrics.original.sentences}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Paragraphs:</span>
                <span className="font-medium">{basic_metrics.original.paragraphs}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Characters:</span>
                <span className="font-medium">{basic_metrics.summary.characters.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Words:</span>
                <span className="font-medium">{basic_metrics.summary.words.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Sentences:</span>
                <span className="font-medium">{basic_metrics.summary.sentences}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Paragraphs:</span>
                <span className="font-medium">{basic_metrics.summary.paragraphs}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Compression</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Compression:</span>
                <span className="font-medium text-green-600">{basic_metrics.compression.compression_percentage.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Word Ratio:</span>
                <span className="font-medium">{(basic_metrics.compression.word_ratio * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Sentence Ratio:</span>
                <span className="font-medium">{(basic_metrics.compression.sentence_ratio * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Readability Scores */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <BookOpen className="text-green-600" size={20} />
          <h2 className="text-xl font-semibold text-gray-900">Readability Analysis</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-3">Original Text</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Flesch Reading Ease:</span>
                <span className={`font-medium ${getReadabilityLevel(readability_scores.original.flesch_reading_ease).color}`}>
                  {readability_scores.original.flesch_reading_ease.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Flesch-Kincaid Grade:</span>
                <span className="font-medium">{readability_scores.original.flesch_kincaid_grade.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Gunning Fog Index:</span>
                <span className="font-medium">{readability_scores.original.gunning_fog.toFixed(1)}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-3">Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Flesch Reading Ease:</span>
                <span className={`font-medium ${getReadabilityLevel(readability_scores.summary.flesch_reading_ease).color}`}>
                  {readability_scores.summary.flesch_reading_ease.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Flesch-Kincaid Grade:</span>
                <span className="font-medium">{readability_scores.summary.flesch_kincaid_grade.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Gunning Fog Index:</span>
                <span className="font-medium">{readability_scores.summary.gunning_fog.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sentiment Analysis */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="text-purple-600" size={20} />
          <h2 className="text-xl font-semibold text-gray-900">Sentiment Analysis</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-3">Original Text</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Sentiment:</span>
                <span className={`font-medium ${getSentimentLabel(sentiment_analysis.original.compound).color}`}>
                  {getSentimentLabel(sentiment_analysis.original.compound).label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Positive:</span>
                <span className="font-medium text-green-600">{(sentiment_analysis.original.pos * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Neutral:</span>
                <span className="font-medium text-gray-600">{(sentiment_analysis.original.neu * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Negative:</span>
                <span className="font-medium text-red-600">{(sentiment_analysis.original.neg * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-3">Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Sentiment:</span>
                <span className={`font-medium ${getSentimentLabel(sentiment_analysis.summary.compound).color}`}>
                  {getSentimentLabel(sentiment_analysis.summary.compound).label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Positive:</span>
                <span className="font-medium text-green-600">{(sentiment_analysis.summary.pos * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Neutral:</span>
                <span className="font-medium text-gray-600">{(sentiment_analysis.summary.neu * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Negative:</span>
                <span className="font-medium text-red-600">{(sentiment_analysis.summary.neg * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Sentiment Shift:</span>
            <span className={`font-medium ${
              Math.abs(sentiment_analysis.sentiment_preservation.sentiment_shift) < 0.1 
                ? 'text-green-600' 
                : 'text-yellow-600'
            }`}>
              {sentiment_analysis.sentiment_preservation.sentiment_shift > 0 ? '+' : ''}
              {sentiment_analysis.sentiment_preservation.sentiment_shift.toFixed(3)}
            </span>
          </div>
        </div>
      </div>

      {/* Keyword Analysis */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Target className="text-orange-600" size={20} />
          <h2 className="text-xl font-semibold text-gray-900">Keyword Analysis</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-3">Top Keywords (Original)</h3>
            <div className="space-y-2">
              {keyword_analysis.original_keywords.slice(0, 5).map((keyword, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-sm text-gray-600">{keyword.word}:</span>
                  <span className="font-medium">{keyword.frequency}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-3">Top Keywords (Summary)</h3>
            <div className="space-y-2">
              {keyword_analysis.summary_keywords.slice(0, 5).map((keyword, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-sm text-gray-600">{keyword.word}:</span>
                  <span className="font-medium">{keyword.frequency}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Keyword Overlap:</span>
            <span className="font-medium text-blue-600">{(keyword_analysis.keyword_overlap_ratio * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Summary Quality */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Zap className="text-yellow-600" size={20} />
          <h2 className="text-xl font-semibold text-gray-900">Summary Quality Assessment</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-3">Quality Metrics</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Coherence Score:</span>
                <span className="font-medium text-blue-600">{(summary_quality.coherence_score * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Info Density Improvement:</span>
                <span className="font-medium text-green-600">
                  {summary_quality.information_density.density_improvement > 0 ? '+' : ''}
                  {(summary_quality.information_density.density_improvement * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-3">Quality Indicators</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Has Structure:</span>
                <span className={`font-medium ${summary_quality.quality_indicators.has_structure ? 'text-green-600' : 'text-red-600'}`}>
                  {summary_quality.quality_indicators.has_structure ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Appropriate Length:</span>
                <span className={`font-medium ${summary_quality.quality_indicators.appropriate_length ? 'text-green-600' : 'text-red-600'}`}>
                  {summary_quality.quality_indicators.appropriate_length ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Maintains Key Concepts:</span>
                <span className={`font-medium ${summary_quality.quality_indicators.maintains_key_concepts ? 'text-green-600' : 'text-red-600'}`}>
                  {summary_quality.quality_indicators.maintains_key_concepts ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 