export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface GenerationResponse {
  content: string;
  model_provider: string;
  model_name: string;
  token_usage?: TokenUsage;
  latency_ms: number;
  finish_reason?: string;
  timestamp: string;
}

export interface SummarizeResponse {
  summary: string;
  original_length: number;
  summary_length: number;
  compression_ratio: number;
  model_provider: string;
  model_name: string;
  token_usage?: TokenUsage;
  latency_ms: number;
  timestamp: string;
}

export interface StreamChunk {
  content: string;
  is_complete: boolean;
  token_usage?: TokenUsage;
  latency_ms?: number;
}

export interface GenerateRequest {
  system_prompt: string;
  user_prompt: string;
  model_provider: 'openai' | 'anthropic' | 'ollama';
  model_name?: string;
  temperature: number;
  max_tokens?: number;
  stream: boolean;
}

export interface SummarizeRequest {
  text?: string;
  url?: string;
  file_content?: string;
  file_type?: string;
  model_provider: 'openai' | 'anthropic' | 'ollama';
  model_name?: string;
  max_length: number;
  temperature: number;
  stream: boolean;
  summary_type: 'general' | 'bullet_points' | 'key_points' | 'extractive';
}

export interface SummaryType {
  id: string;
  name: string;
  description: string;
}

export interface SupportedFileType {
  extension: string;
  name: string;
  description: string;
}

export interface AvailableModels {
  providers: ModelProvider[];
  summary_types: SummaryType[];
  supported_file_types: SupportedFileType[];
}

export interface AnalyticsRequest {
  original_text: string;
  summary_text: string;
}

export interface AnalyticsResponse {
  analytics: {
    basic_metrics: {
      original: {
        characters: number;
        words: number;
        sentences: number;
        paragraphs: number;
        avg_sentence_length: number;
        avg_word_length: number;
      };
      summary: {
        characters: number;
        words: number;
        sentences: number;
        paragraphs: number;
        avg_sentence_length: number;
        avg_word_length: number;
      };
      compression: {
        character_ratio: number;
        word_ratio: number;
        sentence_ratio: number;
        compression_percentage: number;
      };
    };
    readability_scores: {
      original: {
        flesch_reading_ease: number;
        flesch_kincaid_grade: number;
        gunning_fog: number;
        smog_index: number;
        automated_readability_index: number;
        coleman_liau_index: number;
        linsear_write_formula: number;
        dale_chall_readability_score: number;
      };
      summary: {
        flesch_reading_ease: number;
        flesch_kincaid_grade: number;
        gunning_fog: number;
        smog_index: number;
        automated_readability_index: number;
        coleman_liau_index: number;
        linsear_write_formula: number;
        dale_chall_readability_score: number;
      };
    };
    content_analysis: {
      vocabulary: {
        original_unique_words: number;
        summary_unique_words: number;
        vocabulary_diversity: number;
        summary_vocabulary_retention: number;
      };
      complexity: {
        original_long_words: number;
        summary_long_words: number;
        long_word_ratio: number;
      };
    };
    sentiment_analysis: {
      original: {
        neg: number;
        neu: number;
        pos: number;
        compound: number;
      };
      summary: {
        neg: number;
        neu: number;
        pos: number;
        compound: number;
      };
      sentiment_preservation: {
        compound_difference: number;
        sentiment_shift: number;
      };
    };
    keyword_analysis: {
      original_keywords: Array<{word: string; frequency: number}>;
      summary_keywords: Array<{word: string; frequency: number}>;
      keyword_overlap_ratio: number;
      keyword_preservation: number;
    };
    summary_quality: {
      information_density: {
        original: number;
        summary: number;
        density_improvement: number;
      };
      coherence_score: number;
      quality_indicators: {
        has_structure: boolean;
        appropriate_length: boolean;
        maintains_key_concepts: boolean;
      };
    };
  };
  timestamp: string;
}

export interface ModelProvider {
  id: string;
  name: string;
  models: string[];
  requires_api_key: boolean;
}

export interface AvailableModels {
  providers: ModelProvider[];
} 