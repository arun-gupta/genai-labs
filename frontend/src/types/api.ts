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

export interface ModelProvider {
  id: string;
  name: string;
  models: string[];
  requires_api_key: boolean;
}

export interface AvailableModels {
  providers: ModelProvider[];
} 