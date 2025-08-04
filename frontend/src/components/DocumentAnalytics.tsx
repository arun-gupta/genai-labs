import React, { useState, useEffect } from 'react';
import { BarChart3, FileText, Users, MapPin, Calendar, Phone, Building, TrendingUp, Clock, BookOpen, Target, Lightbulb } from 'lucide-react';
import { apiService } from '../services/api';

interface DocumentAnalytics {
  file_name: string;
  analysis_timestamp: string;
  document_type: string;
  statistics: {
    word_count: number;
    sentence_count: number;
    paragraph_count: number;
    character_count: number;
    average_words_per_sentence: number;
    average_sentence_length: number;
    numbers_found: number;
    dates_found: number;
    emails_found: number;
    urls_found: number;
    estimated_reading_time_minutes: number;
  };
  topics: Array<{
    topic: string;
    type: string;
    frequency: number;
    importance: string;
  }>;
  entities: {
    companies: string[];
    people: string[];
    locations: string[];
    dates: string[];
    contact_info: string[];
  };
  key_phrases: string[];
  summary: string;
  readability: {
    score: number;
    level: string;
    complexity: string;
    avg_words_per_sentence: number;
    avg_word_length: number;
  };
  insights: string[];
}

interface DocumentAnalyticsProps {
  collectionName: string;
  documentId: string;
  className?: string;
}

export const DocumentAnalytics: React.FC<DocumentAnalyticsProps> = ({
  collectionName,
  documentId,
  className = ""
}) => {
  const [analytics, setAnalytics] = useState<DocumentAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (collectionName && documentId) {
      loadAnalytics();
    }
  }, [collectionName, documentId]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getDocumentAnalytics(collectionName, documentId);
      setAnalytics(response.analytics);
    } catch (err) {
      setError('Failed to load document analytics');
      console.error('Error loading analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'agreement':
        return <FileText className="w-4 h-4" />;
      case 'policy':
        return <Target className="w-4 h-4" />;
      case 'manual':
        return <BookOpen className="w-4 h-4" />;
      case 'report':
        return <BarChart3 className="w-4 h-4" />;
      case 'form':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getReadabilityColor = (level: string) => {
    switch (level) {
      case 'easy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'difficult':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'very_difficult':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
          <BarChart3 className="w-4 h-4 text-blue-500" />
          <span>Loading Document Analytics...</span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
          <BarChart3 className="w-4 h-4 text-blue-500" />
          <span>Document Analytics</span>
        </div>
        <div className="text-sm text-red-600">{error}</div>
        <button
          onClick={loadAnalytics}
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
        <BarChart3 className="w-4 h-4 text-blue-500" />
        <span>Document Analytics</span>
      </div>

      {/* Document Overview */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          {getDocumentTypeIcon(analytics.document_type)}
          <h3 className="font-semibold text-gray-900">{analytics.file_name}</h3>
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full capitalize">
            {analytics.document_type}
          </span>
        </div>
        <p className="text-sm text-gray-600">{analytics.summary}</p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <FileText className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-600">Words</span>
          </div>
          <div className="text-lg font-bold">{analytics.statistics.word_count.toLocaleString()}</div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <Clock className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-600">Reading Time</span>
          </div>
          <div className="text-lg font-bold">{analytics.statistics.estimated_reading_time_minutes} min</div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-gray-600">Sentences</span>
          </div>
          <div className="text-lg font-bold">{analytics.statistics.sentence_count}</div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <BookOpen className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-gray-600">Paragraphs</span>
          </div>
          <div className="text-lg font-bold">{analytics.statistics.paragraph_count}</div>
        </div>
      </div>

      {/* Readability */}
      <div className={`p-4 rounded-lg border ${getReadabilityColor(analytics.readability.level)}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4" />
            <span className="font-medium">Readability</span>
          </div>
          <span className="text-sm font-bold">{analytics.readability.score}/100</span>
        </div>
        <div className="text-sm">
          <div>Level: {analytics.readability.level.replace('_', ' ').toUpperCase()}</div>
          <div>Complexity: {analytics.readability.complexity}</div>
          <div>Avg. words per sentence: {analytics.readability.avg_words_per_sentence}</div>
        </div>
      </div>

      {/* Key Topics */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Key Topics</h4>
        <div className="space-y-2">
          {analytics.topics.slice(0, 8).map((topic, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm">{topic.topic}</span>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${getImportanceColor(topic.importance)}`}>
                  {topic.importance}
                </span>
                <span className="text-xs text-gray-500">({topic.frequency})</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Entities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analytics.entities.companies.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Building className="w-4 h-4 text-blue-500" />
              <h4 className="font-semibold text-gray-900">Organizations</h4>
            </div>
            <div className="space-y-1">
              {analytics.entities.companies.slice(0, 5).map((company, index) => (
                <div key={index} className="text-sm text-gray-700">{company}</div>
              ))}
            </div>
          </div>
        )}
        
        {analytics.entities.locations.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <MapPin className="w-4 h-4 text-green-500" />
              <h4 className="font-semibold text-gray-900">Locations</h4>
            </div>
            <div className="space-y-1">
              {analytics.entities.locations.slice(0, 5).map((location, index) => (
                <div key={index} className="text-sm text-gray-700">{location}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contact Information */}
      {analytics.entities.contact_info.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Phone className="w-4 h-4 text-purple-500" />
            <h4 className="font-semibold text-gray-900">Contact Information</h4>
          </div>
          <div className="space-y-1">
            {analytics.entities.contact_info.slice(0, 3).map((contact, index) => (
              <div key={index} className="text-sm text-gray-700">{contact}</div>
            ))}
          </div>
        </div>
      )}

      {/* Key Phrases */}
      {analytics.key_phrases.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Key Phrases</h4>
          <div className="space-y-2">
            {analytics.key_phrases.slice(0, 5).map((phrase, index) => (
              <div key={index} className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                "{phrase}"
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {analytics.insights.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Lightbulb className="w-4 h-4 text-blue-500" />
            <h4 className="font-semibold text-blue-900">Insights</h4>
          </div>
          <div className="space-y-2">
            {analytics.insights.map((insight, index) => (
              <div key={index} className="text-sm text-blue-800">• {insight}</div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Statistics */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-3">Additional Statistics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Numbers found:</span>
            <span className="font-medium ml-1">{analytics.statistics.numbers_found}</span>
          </div>
          <div>
            <span className="text-gray-600">Dates found:</span>
            <span className="font-medium ml-1">{analytics.statistics.dates_found}</span>
          </div>
          <div>
            <span className="text-gray-600">Emails found:</span>
            <span className="font-medium ml-1">{analytics.statistics.emails_found}</span>
          </div>
          <div>
            <span className="text-gray-600">URLs found:</span>
            <span className="font-medium ml-1">{analytics.statistics.urls_found}</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 