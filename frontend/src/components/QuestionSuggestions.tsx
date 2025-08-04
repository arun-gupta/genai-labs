import React, { useState, useEffect } from 'react';
import { Lightbulb, Sparkles } from 'lucide-react';
import { apiService } from '../services/api';

interface QuestionSuggestion {
  question: string;
  type: string;
  confidence: number;
  topic?: string;
  action?: string;
}

interface QuestionSuggestionsProps {
  collectionNames: string[];
  documentId?: string;
  onSuggestionClick: (question: string) => void;
  className?: string;
  refreshKey?: number;
}

export const QuestionSuggestions: React.FC<QuestionSuggestionsProps> = ({
  collectionNames,
  documentId,
  onSuggestionClick,
  className = "",
  refreshKey
}) => {
  const [suggestions, setSuggestions] = useState<QuestionSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (collectionNames.length > 0) {
      loadSuggestions();
    }
  }, [collectionNames, documentId, refreshKey]);

  const loadSuggestions = async () => {
    if (collectionNames.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let allSuggestions: QuestionSuggestion[] = [];
      
      if (documentId) {
        // For document-specific suggestions, use the first collection
        const response = await apiService.getDocumentQuestionSuggestions(collectionNames[0], documentId);
        allSuggestions = response.suggestions || [];
      } else {
        // For collection suggestions, combine suggestions from all selected collections
        for (const collectionName of collectionNames) {
          try {
            const response = await apiService.getQuestionSuggestions(collectionName);
            const collectionSuggestions = response.suggestions || [];
            // Add collection name to suggestions for context
            const labeledSuggestions = collectionSuggestions.map(s => ({
              ...s,
              question: s.question,
              collection: collectionName
            }));
            allSuggestions.push(...labeledSuggestions);
          } catch (err) {
            console.warn(`Failed to load suggestions for collection ${collectionName}:`, err);
          }
        }
        
        // Remove duplicates and organize by type
        const uniqueSuggestions = allSuggestions.filter((suggestion, index, self) =>
          index === self.findIndex(s => s.question === suggestion.question)
        );
        
        // Organize suggestions by type and priority
        const organizedSuggestions = organizeSuggestions(uniqueSuggestions);
        allSuggestions = organizedSuggestions;
      }
      
      setSuggestions(allSuggestions);
    } catch (err) {
      setError('Failed to load suggestions');
      console.error('Error loading suggestions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const organizeSuggestions = (suggestions: QuestionSuggestion[]): QuestionSuggestion[] => {
    // Define priority order for suggestion types
    const typePriority = {
      'collection': 1,      // Collection info (highest priority)
      'summary': 2,         // Summary questions
      'document_content': 3, // Document content questions
      'document_types': 4,   // Document type questions
      'topic': 5,           // Topic-based questions
      'action': 6           // Action questions (lowest priority)
    };
    
    // Sort by type priority first, then by confidence
    return suggestions.sort((a, b) => {
      const aPriority = typePriority[a.type as keyof typeof typePriority] || 7;
      const bPriority = typePriority[b.type as keyof typeof typePriority] || 7;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // If same type, sort by confidence (higher first)
      return b.confidence - a.confidence;
    });
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'topic':
        return <Sparkles className="w-4 h-4" />;
      case 'action':
        return <Lightbulb className="w-4 h-4" />;
      case 'collection':
      case 'summary':
      case 'document_purpose':
      case 'document_summary':
      case 'document_audience':
      case 'document_topic':
        return <Lightbulb className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'topic':
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      case 'action':
        return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
      case 'collection':
      case 'summary':
        return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100';
      case 'document_purpose':
      case 'document_summary':
      case 'document_audience':
      case 'document_topic':
        return 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          <span>Loading suggestions...</span>
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
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          <span>Question Suggestions</span>
        </div>
        <div className="text-sm text-red-600">{error}</div>
        <button
          onClick={loadSuggestions}
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  const displayedSuggestions = showAll ? suggestions : suggestions.slice(0, 6);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          <span>Question Suggestions</span>
        </div>
        {suggestions.length > 6 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            {showAll ? 'Show less' : `Show ${suggestions.length - 6} more`}
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {displayedSuggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion.question)}
            className={`flex items-start space-x-2 p-3 rounded-lg border text-left transition-all hover:shadow-sm ${getSuggestionColor(suggestion.type)}`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getSuggestionIcon(suggestion.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium leading-tight">
                {suggestion.question}
              </div>
              <div className="text-xs opacity-75 mt-1">
                Confidence: {Math.round(suggestion.confidence * 100)}%
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}; 