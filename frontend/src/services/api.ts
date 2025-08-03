import { 
  GenerateRequest, 
  SummarizeRequest, 
  GenerationResponse, 
  SummarizeResponse, 
  AvailableModels,
  StreamChunk,
  LanguageDetection,
  Translation,
  SupportedLanguages,
  PromptTemplatesResponse,
  TemplateFillRequest,
  TemplateFillResponse
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async generateText(request: GenerateRequest): Promise<GenerationResponse> {
    return this.request<GenerationResponse>('/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async summarizeText(request: SummarizeRequest): Promise<SummarizeResponse> {
    return this.request<SummarizeResponse>('/summarize', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async summarizeFile(
    file: File,
    modelProvider: string,
    modelName: string = '',
    maxLength: number = 150,
    temperature: number = 0.3,
    summaryType: string = 'general'
  ): Promise<SummarizeResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_provider', modelProvider);
    formData.append('model_name', modelName);
    formData.append('max_length', maxLength.toString());
    formData.append('temperature', temperature.toString());
    formData.append('summary_type', summaryType);

    const response = await fetch(`${this.baseUrl}/summarize/file`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`File upload failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getAvailableModels(): Promise<AvailableModels> {
    return this.request<AvailableModels>('/models');
  }

  async analyzeSummary(request: AnalyticsRequest): Promise<AnalyticsResponse> {
    return this.request<AnalyticsResponse>('/analytics', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async analyzeGeneration(request: { 
    system_prompt: string; 
    user_prompt: string; 
    generated_text: string; 
    output_format?: string 
  }): Promise<{ analytics: any }> {
    return this.request<{ analytics: any }>('/analytics/generation', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getPromptTemplates(): Promise<PromptTemplatesResponse> {
    return this.request<PromptTemplatesResponse>('/templates');
  }

  async getTemplatesByCategory(category: string): Promise<{ templates: PromptTemplate[]; category: string }> {
    return this.request<{ templates: PromptTemplate[]; category: string }>(`/templates/${category}`);
  }

  async fillTemplate(request: TemplateFillRequest): Promise<TemplateFillResponse> {
    return this.request<TemplateFillResponse>('/templates/fill', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async exportContent(format: 'pdf' | 'word' | 'markdown', content: any): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/export/${format}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  async detectLanguage(text: string): Promise<{ detection: LanguageDetection }> {
    return this.request<{ detection: LanguageDetection }>('/detect-language', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async translateText(
    text: string, 
    targetLanguage: string, 
    sourceLanguage: string = 'auto'
  ): Promise<{ translation: Translation }> {
    return this.request<{ translation: Translation }>('/translate', {
      method: 'POST',
      body: JSON.stringify({ 
        text, 
        target_language: targetLanguage, 
        source_language: sourceLanguage 
      }),
    });
  }

  async getSupportedLanguages(): Promise<SupportedLanguages> {
    return this.request<SupportedLanguages>('/languages');
  }

  async generateTextStream(
    request: GenerateRequest,
    onChunk: (chunk: StreamChunk) => void,
    onError: (error: string) => void
  ): Promise<void> {
    const url = `${this.baseUrl}/generate/stream`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Stream request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body reader available');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const eventType = line.slice(7).trim();
            if (eventType === 'error') {
              // Handle error event
              continue;
            }
          }
          
          if (line.startsWith('data: ')) {
            try {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                return;
              }
              const streamChunk: StreamChunk = JSON.parse(data);
              onChunk(streamChunk);
            } catch (e) {
              // Skip invalid JSON lines
              console.warn('Failed to parse SSE data:', data, e);
            }
          }
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async summarizeTextStream(
    request: SummarizeRequest,
    onChunk: (chunk: StreamChunk) => void,
    onError: (error: string) => void
  ): Promise<void> {
    const url = `${this.baseUrl}/summarize/stream`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Stream request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body reader available');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const eventType = line.slice(7).trim();
            if (eventType === 'error') {
              // Handle error event
              continue;
            }
          }
          
          if (line.startsWith('data: ')) {
            try {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                return;
              }
              const streamChunk: StreamChunk = JSON.parse(data);
              onChunk(streamChunk);
            } catch (e) {
              // Skip invalid JSON lines
              console.warn('Failed to parse SSE data:', data, e);
            }
          }
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unknown error');
    }
  }
}

export const apiService = new ApiService(); 