import React from 'react';
import { Clock, Target, Zap, TrendingUp, BarChart3 } from 'lucide-react';

interface PerformanceMetricsProps {
  metrics: {
    responseTime: number | null;
    accuracyScore: number | null;
    tokenCount: number | null;
    processingTime: number | null;
    timestamp: string | null;
  };
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ metrics }) => {
  const formatTime = (ms: number) => {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getAccuracyColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAccuracyLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const getResponseTimeColor = (ms: number) => {
    if (ms < 2000) return 'text-green-600';
    if (ms < 5000) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getResponseTimeLabel = (ms: number) => {
    if (ms < 2000) return 'Fast';
    if (ms < 5000) return 'Normal';
    return 'Slow';
  };

  if (!metrics.responseTime && !metrics.accuracyScore) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Response Time */}
        {metrics.responseTime && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className={`w-5 h-5 ${getResponseTimeColor(metrics.responseTime)}`} />
              <h4 className="font-medium text-gray-900">Response Time</h4>
            </div>
            <div className="space-y-1">
              <p className={`text-2xl font-bold ${getResponseTimeColor(metrics.responseTime)}`}>
                {formatTime(metrics.responseTime)}
              </p>
              <p className="text-sm text-gray-500">
                {getResponseTimeLabel(metrics.responseTime)}
              </p>
            </div>
          </div>
        )}

        {/* Accuracy Score */}
        {metrics.accuracyScore && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Target className={`w-5 h-5 ${getAccuracyColor(metrics.accuracyScore)}`} />
              <h4 className="font-medium text-gray-900">Accuracy Score</h4>
            </div>
            <div className="space-y-1">
              <p className={`text-2xl font-bold ${getAccuracyColor(metrics.accuracyScore)}`}>
                {metrics.accuracyScore}%
              </p>
              <p className="text-sm text-gray-500">
                {getAccuracyLabel(metrics.accuracyScore)}
              </p>
            </div>
          </div>
        )}

        {/* Token Count */}
        {metrics.tokenCount && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-gray-900">Token Count</h4>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-blue-600">
                {metrics.tokenCount.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                Estimated tokens
              </p>
            </div>
          </div>
        )}

        {/* Processing Time */}
        {metrics.processingTime && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <h4 className="font-medium text-gray-900">Processing Time</h4>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-purple-600">
                {formatTime(metrics.processingTime)}
              </p>
              <p className="text-sm text-gray-500">
                AI processing
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Performance Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          <h4 className="font-medium text-gray-900">Performance Summary</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {metrics.responseTime && (
            <div className="flex justify-between">
              <span className="text-gray-600">Total Response Time:</span>
              <span className="font-medium">{formatTime(metrics.responseTime)}</span>
            </div>
          )}
          {metrics.processingTime && (
            <div className="flex justify-between">
              <span className="text-gray-600">AI Processing:</span>
              <span className="font-medium">{formatTime(metrics.processingTime)}</span>
            </div>
          )}
          {metrics.responseTime && metrics.processingTime && (
            <div className="flex justify-between">
              <span className="text-gray-600">Network Overhead:</span>
              <span className="font-medium">{formatTime(metrics.responseTime - metrics.processingTime)}</span>
            </div>
          )}
          {metrics.accuracyScore && (
            <div className="flex justify-between">
              <span className="text-gray-600">Accuracy Level:</span>
              <span className={`font-medium ${getAccuracyColor(metrics.accuracyScore)}`}>
                {getAccuracyLabel(metrics.accuracyScore)}
              </span>
            </div>
          )}
          {metrics.timestamp && (
            <div className="flex justify-between">
              <span className="text-gray-600">Generated:</span>
              <span className="font-medium">
                {new Date(metrics.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 