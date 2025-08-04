import React from 'react';
import { Shield, AlertTriangle, CheckCircle, Info, TrendingUp, TrendingDown } from 'lucide-react';
import { ConfidenceData } from '../types/api';

interface ConfidenceDisplayProps {
  confidence: ConfidenceData;
  className?: string;
}

export const ConfidenceDisplay: React.FC<ConfidenceDisplayProps> = ({
  confidence,
  className = ""
}) => {
  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'very_low':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getConfidenceIcon = (level: string) => {
    switch (level) {
      case 'high':
        return <CheckCircle className="w-4 h-4" />;
      case 'medium':
        return <Shield className="w-4 h-4" />;
      case 'low':
        return <AlertTriangle className="w-4 h-4" />;
      case 'very_low':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getConfidenceLabel = (level: string) => {
    switch (level) {
      case 'high':
        return 'High Confidence';
      case 'medium':
        return 'Medium Confidence';
      case 'low':
        return 'Low Confidence';
      case 'very_low':
        return 'Very Low Confidence';
      default:
        return 'Unknown Confidence';
    }
  };

  const getConfidenceAdvice = (level: string) => {
    switch (level) {
      case 'high':
        return 'This answer is based on strong evidence and can be trusted.';
      case 'medium':
        return 'This answer is reasonably reliable but consider verifying with additional sources.';
      case 'low':
        return 'This answer has limited supporting evidence. Please verify the information.';
      case 'very_low':
        return 'This answer has very low confidence and may be unreliable.';
      default:
        return 'Confidence level could not be determined.';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Confidence Indicator */}
      <div className={`flex items-center space-x-2 p-3 rounded-lg border ${getConfidenceColor(confidence.confidence_level)}`}>
        {getConfidenceIcon(confidence.confidence_level)}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-medium">{getConfidenceLabel(confidence.confidence_level)}</span>
            <span className="text-sm font-bold">
              {Math.round(confidence.overall_confidence * 100)}%
            </span>
          </div>
          <div className="text-xs mt-1">{confidence.explanation}</div>
        </div>
      </div>

      {/* Confidence Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Source Confidence */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">Source Quality</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Confidence</span>
            <span className="text-sm font-bold">{Math.round(confidence.source_confidence * 100)}%</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {confidence.factors.source_count} sources, {confidence.factors.unique_documents} documents
          </div>
        </div>

        {/* Answer Quality */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">Answer Quality</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Confidence</span>
            <span className="text-sm font-bold">{Math.round(confidence.answer_confidence * 100)}%</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {confidence.factors.answer_length} chars, {confidence.factors.has_sources ? 'with sources' : 'no sources'}
          </div>
        </div>
      </div>

      {/* Advice */}
      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
        <div className="flex items-start space-x-2">
          <Info className="w-4 h-4 text-blue-500 mt-0.5" />
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">Advice:</div>
            <div>{getConfidenceAdvice(confidence.confidence_level)}</div>
          </div>
        </div>
      </div>

      {/* Detailed Factors */}
      <details className="bg-gray-50 p-3 rounded-lg">
        <summary className="cursor-pointer text-sm font-medium text-gray-700">
          View Detailed Factors
        </summary>
        <div className="mt-2 space-y-2 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Source Count:</span>
            <span>{confidence.factors.source_count}</span>
          </div>
          <div className="flex justify-between">
            <span>Average Similarity:</span>
            <span>{confidence.factors.avg_similarity.toFixed(3)}</span>
          </div>
          <div className="flex justify-between">
            <span>Unique Documents:</span>
            <span>{confidence.factors.unique_documents}</span>
          </div>
          <div className="flex justify-between">
            <span>Answer Length:</span>
            <span>{confidence.factors.answer_length} characters</span>
          </div>
          <div className="flex justify-between">
            <span>Has Source Citations:</span>
            <span>{confidence.factors.has_sources ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </details>
    </div>
  );
}; 