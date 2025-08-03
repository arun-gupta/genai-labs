import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  BookOpen, 
  Brain, 
  Target, 
  Zap, 
  FileText, 
  Code, 
  MessageCircle, 
  Palette,
  CheckCircle,
  AlertCircle,
  Star,
  Lightbulb,
  Users,
  Globe,
  Hash,
  List,
  Table,
  FileCode
} from 'lucide-react';

interface GenerationAnalyticsDisplayProps {
  analytics: any;
  isLoading: boolean;
}

export const GenerationAnalyticsDisplay: React.FC<GenerationAnalyticsDisplayProps> = ({ analytics, isLoading }) => {
  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Analyzing generation...</span>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Generation Analytics</h3>
          <p className="text-gray-600">Generate text to see detailed analytics and insights.</p>
        </div>
      </div>
    );
  }

  const { 
    prompt_analysis, 
    generation_metrics, 
    content_quality, 
    creativity_analysis, 
    format_compliance,
    engagement_metrics,
    technical_analysis,
    style_analysis,
    coherence_analysis,
    diversity_metrics
  } = analytics;

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

  const getFormatComplianceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Prompt Analysis */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Target className="text-blue-600" size={20} />
          <h2 className="text-xl font-semibold text-gray-900">Prompt Analysis</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">System Prompt</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Length:</span>
                <span className="font-medium">{prompt_analysis.system_prompt.length} chars</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Words:</span>
                <span className="font-medium">{prompt_analysis.system_prompt.word_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Complexity:</span>
                <span className="font-medium">{prompt_analysis.system_prompt.complexity.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Has Instructions:</span>
                <span className="font-medium">{prompt_analysis.system_prompt.has_instructions ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">User Prompt</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Length:</span>
                <span className="font-medium">{prompt_analysis.user_prompt.length} chars</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Words:</span>
                <span className="font-medium">{prompt_analysis.user_prompt.word_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Type:</span>
                <span className="font-medium capitalize">{prompt_analysis.user_prompt.question_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Specific Request:</span>
                <span className="font-medium">{prompt_analysis.user_prompt.has_specific_request ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generation Metrics */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="text-green-600" size={20} />
          <h2 className="text-xl font-semibold text-gray-900">Generation Metrics</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Basic Metrics</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Characters:</span>
                <span className="font-medium">{generation_metrics.basic_metrics.characters.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Words:</span>
                <span className="font-medium">{generation_metrics.basic_metrics.words.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Sentences:</span>
                <span className="font-medium">{generation_metrics.basic_metrics.sentences}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Paragraphs:</span>
                <span className="font-medium">{generation_metrics.basic_metrics.paragraphs}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Averages</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Sentence Length:</span>
                <span className="font-medium">{generation_metrics.basic_metrics.avg_sentence_length.toFixed(1)} words</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Word Length:</span>
                <span className="font-medium">{generation_metrics.basic_metrics.avg_word_length.toFixed(1)} chars</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Paragraph Length:</span>
                <span className="font-medium">{generation_metrics.basic_metrics.avg_paragraph_length.toFixed(1)} words</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Efficiency</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Words/Paragraph:</span>
                <span className="font-medium">{generation_metrics.generation_efficiency.words_per_paragraph.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Sentences/Paragraph:</span>
                <span className="font-medium">{generation_metrics.generation_efficiency.sentences_per_paragraph.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Content Density:</span>
                <span className="font-medium">{(generation_metrics.generation_efficiency.content_density * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Quality */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Star className="text-yellow-600" size={20} />
          <h2 className="text-xl font-semibold text-gray-900">Content Quality</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Vocabulary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Unique Words:</span>
                <span className="font-medium">{content_quality.vocabulary.unique_words}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Diversity:</span>
                <span className="font-medium">{(content_quality.vocabulary.vocabulary_diversity * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Complexity</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Long Words:</span>
                <span className="font-medium">{content_quality.complexity.long_words}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Long Word Ratio:</span>
                <span className="font-medium">{(content_quality.complexity.long_word_ratio * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Syllables:</span>
                <span className="font-medium">{content_quality.complexity.syllable_count}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Structure</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Has Introduction:</span>
                <span className="font-medium">{content_quality.structure.has_introduction ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Has Conclusion:</span>
                <span className="font-medium">{content_quality.structure.has_conclusion ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Has Transitions:</span>
                <span className="font-medium">{content_quality.structure.has_transitions ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Creativity Analysis */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Lightbulb className="text-purple-600" size={20} />
          <h2 className="text-xl font-semibold text-gray-900">Creativity Analysis</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Lexical Creativity</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Rare Words:</span>
                <span className="font-medium">{creativity_analysis.lexical_creativity.rare_words}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Unique Ratio:</span>
                <span className="font-medium">{(creativity_analysis.lexical_creativity.unique_word_ratio * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Richness:</span>
                <span className="font-medium">{(creativity_analysis.lexical_creativity.vocabulary_richness * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Syntactic Creativity</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Sentence Variety:</span>
                <span className="font-medium">{(creativity_analysis.syntactic_creativity.sentence_variety * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Complex Sentences:</span>
                <span className="font-medium">{creativity_analysis.syntactic_creativity.complex_sentences}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Syntactic Diversity:</span>
                <span className="font-medium">{(creativity_analysis.syntactic_creativity.syntactic_diversity * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Semantic Creativity</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Metaphor Density:</span>
                <span className="font-medium">{(creativity_analysis.semantic_creativity.metaphor_density * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Abstract Concepts:</span>
                <span className="font-medium">{creativity_analysis.semantic_creativity.abstract_concepts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Creative Phrases:</span>
                <span className="font-medium">{creativity_analysis.semantic_creativity.creative_phrases.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Format Compliance */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <CheckCircle className="text-green-600" size={20} />
          <h2 className="text-xl font-semibold text-gray-900">Format Compliance</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-700">Format: {format_compliance.format_type.toUpperCase()}</h3>
              <p className="text-sm text-gray-600">Compliance with requested output format</p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${getFormatComplianceColor(format_compliance.compliance_score)}`}>
                {(format_compliance.compliance_score * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">Compliance Score</div>
            </div>
          </div>
          
          {format_compliance.format_suggestions.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Suggestions for Improvement:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {format_compliance.format_suggestions.map((suggestion: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="text-blue-600" size={20} />
          <h2 className="text-xl font-semibold text-gray-900">Engagement Metrics</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Sentiment & Emotion</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Sentiment:</span>
                <span className={`font-medium ${getSentimentLabel(engagement_metrics.sentiment.compound).color}`}>
                  {getSentimentLabel(engagement_metrics.sentiment.compound).label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Positive Words:</span>
                <span className="font-medium">{engagement_metrics.emotional_appeal.positive_emotion_words}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Negative Words:</span>
                <span className="font-medium">{engagement_metrics.emotional_appeal.negative_emotion_words}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Emotional Intensity:</span>
                <span className="font-medium">{(engagement_metrics.emotional_appeal.emotional_intensity * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Readability</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Flesch Reading Ease:</span>
                <span className={`font-medium ${getReadabilityLevel(engagement_metrics.readability.flesch_reading_ease).color}`}>
                  {engagement_metrics.readability.flesch_reading_ease.toFixed(0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Grade Level:</span>
                <span className="font-medium">{engagement_metrics.readability.flesch_kincaid_grade.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Gunning Fog:</span>
                <span className="font-medium">{engagement_metrics.readability.gunning_fog.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="font-medium text-gray-700 mb-3">Engagement Indicators</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              {engagement_metrics.engagement_indicators.has_questions ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-gray-400" />
              )}
              <span className="text-sm">Questions</span>
            </div>
            <div className="flex items-center space-x-2">
              {engagement_metrics.engagement_indicators.has_exclamations ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-gray-400" />
              )}
              <span className="text-sm">Exclamations</span>
            </div>
            <div className="flex items-center space-x-2">
              {engagement_metrics.engagement_indicators.has_direct_address ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-gray-400" />
              )}
              <span className="text-sm">Direct Address</span>
            </div>
            <div className="flex items-center space-x-2">
              {engagement_metrics.engagement_indicators.has_storytelling_elements ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-gray-400" />
              )}
              <span className="text-sm">Storytelling</span>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Analysis */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Code className="text-indigo-600" size={20} />
          <h2 className="text-xl font-semibold text-gray-900">Technical Analysis</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Code & Technical</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Code Blocks:</span>
                <span className="font-medium">{technical_analysis.code_analysis.has_code_blocks ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Technical Terms:</span>
                <span className="font-medium">{technical_analysis.code_analysis.has_technical_terms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Numbers:</span>
                <span className="font-medium">{technical_analysis.code_analysis.has_numbers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">URLs:</span>
                <span className="font-medium">{technical_analysis.code_analysis.has_urls}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Structure Elements</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Headers:</span>
                <span className="font-medium">{technical_analysis.structure_analysis.has_headers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Lists:</span>
                <span className="font-medium">{technical_analysis.structure_analysis.has_lists}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Bold Text:</span>
                <span className="font-medium">{technical_analysis.structure_analysis.has_bold}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Italic Text:</span>
                <span className="font-medium">{technical_analysis.structure_analysis.has_italic}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Language Features</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Quotes:</span>
                <span className="font-medium">{technical_analysis.language_features.has_quotes ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Parentheses:</span>
                <span className="font-medium">{technical_analysis.language_features.has_parentheses ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Colons:</span>
                <span className="font-medium">{technical_analysis.language_features.has_colons ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Semicolons:</span>
                <span className="font-medium">{technical_analysis.language_features.has_semicolons ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Writing Style */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Palette className="text-pink-600" size={20} />
          <h2 className="text-xl font-semibold text-gray-900">Writing Style</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Sentence Structure</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Length:</span>
                <span className="font-medium">{style_analysis.sentence_structure.avg_sentence_length.toFixed(1)} words</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Variety:</span>
                <span className="font-medium">{(style_analysis.sentence_structure.sentence_variety * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Complex:</span>
                <span className="font-medium">{style_analysis.sentence_structure.complex_sentences}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Simple:</span>
                <span className="font-medium">{style_analysis.sentence_structure.simple_sentences}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Tone Analysis</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Formal:</span>
                <span className="font-medium">{style_analysis.tone_analysis.formal_indicators}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Casual:</span>
                <span className="font-medium">{style_analysis.tone_analysis.casual_indicators}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Academic:</span>
                <span className="font-medium">{style_analysis.tone_analysis.academic_indicators}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Conversational:</span>
                <span className="font-medium">{style_analysis.tone_analysis.conversational_indicators}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Voice Analysis</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Voice:</span>
                <span className="font-medium">{(style_analysis.voice_analysis.active_voice * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Passive Voice:</span>
                <span className="font-medium">{(style_analysis.voice_analysis.passive_voice * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">First Person:</span>
                <span className="font-medium">{style_analysis.voice_analysis.first_person}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Second Person:</span>
                <span className="font-medium">{style_analysis.voice_analysis.second_person}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coherence Analysis */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="text-teal-600" size={20} />
          <h2 className="text-xl font-semibold text-gray-900">Coherence Analysis</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Logical Flow</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Transition Words:</span>
                <span className="font-medium">{coherence_analysis.logical_flow.transition_words}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Topic Consistency:</span>
                <span className="font-medium">{(coherence_analysis.logical_flow.topic_consistency * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Has Structure:</span>
                <span className="font-medium">{coherence_analysis.organization.has_clear_structure ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Cohesion</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pronoun Reference:</span>
                <span className="font-medium">{(coherence_analysis.cohesion.pronoun_reference * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Repetition Score:</span>
                <span className="font-medium">{(coherence_analysis.cohesion.repetition_analysis.repetition_score * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Semantic Coherence:</span>
                <span className="font-medium">{(coherence_analysis.cohesion.semantic_coherence * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Organization</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Paragraph Org:</span>
                <span className="font-medium">{(coherence_analysis.organization.paragraph_organization * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Logical Progression:</span>
                <span className="font-medium">{(coherence_analysis.organization.logical_progression * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Diversity Metrics */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Globe className="text-orange-600" size={20} />
          <h2 className="text-xl font-semibold text-gray-900">Diversity Metrics</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Lexical Diversity</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Type-Token Ratio:</span>
                <span className="font-medium">{(diversity_metrics.lexical_diversity.type_token_ratio * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Hapax Legomena:</span>
                <span className="font-medium">{diversity_metrics.lexical_diversity.hapax_legomena}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Hapax Ratio:</span>
                <span className="font-medium">{(diversity_metrics.lexical_diversity.hapax_ratio * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Semantic Diversity</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Unique Concepts:</span>
                <span className="font-medium">{diversity_metrics.semantic_diversity.concept_variety}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Domain Coverage:</span>
                <span className="font-medium">{(diversity_metrics.semantic_diversity.domain_coverage * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Perspective Diversity:</span>
                <span className="font-medium">{(diversity_metrics.semantic_diversity.perspective_diversity * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Structural Diversity</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Sentence Patterns:</span>
                <span className="font-medium">{diversity_metrics.structural_diversity.sentence_patterns}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Paragraph Variety:</span>
                <span className="font-medium">{(diversity_metrics.structural_diversity.paragraph_variety * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Formatting Diversity:</span>
                <span className="font-medium">{(diversity_metrics.structural_diversity.formatting_diversity * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 