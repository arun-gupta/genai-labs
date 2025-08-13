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

  async getImageGenerationProviders(): Promise<AvailableModels> {
    return this.request<AvailableModels>('/models/image-generation');
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

  async exportContent(format: 'pdf' | 'word' | 'markdown' | 'html', content: any): Promise<Blob> {
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

  async getSupportedLanguages(timeoutMs: number = 6000): Promise<SupportedLanguages> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${this.baseUrl}/languages`, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      return response.json();
    } finally {
      clearTimeout(timeoutId);
    }
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

  // RAG Methods
  async uploadRAGDocument(formData: FormData, tags?: string[]): Promise<any> {
    if (tags && tags.length > 0) {
      formData.append('tags', JSON.stringify(tags));
    }
    
    const response = await fetch(`${this.baseUrl}/rag/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`RAG upload failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async askRAGQuestion(request: any, filterTags?: string[]): Promise<any> {
    const requestWithTags = {
      ...request,
      filter_tags: filterTags
    };
    
    return this.request<any>('/rag/question', {
      method: 'POST',
      body: JSON.stringify(requestWithTags),
    });
  }

  async askRAGQuestionStream(
    request: any,
    onChunk: (chunk: StreamChunk) => void,
    onError: (error: string) => void,
    filterTags?: string[]
  ): Promise<void> {
    const url = `${this.baseUrl}/rag/question/stream`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          filter_tags: filterTags,
          collection_names: request.collection_names
        }),
      });

      if (!response.ok) {
        throw new Error(`RAG streaming request failed: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const eventType = line.slice(7).trim();
            if (eventType === 'error') {
              continue;
            }
          }
          
          if (line.startsWith('data: ')) {
            try {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                return;
              }
              const chunk: StreamChunk = JSON.parse(data);
              onChunk(chunk);
            } catch (e) {
              console.warn('Failed to parse RAG SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

  async getRAGCollections(): Promise<any[]> {
    return this.request<any[]>('/rag/collections');
  }

  async deleteRAGDocument(request: { document_id: string; collection_name: string }): Promise<any> {
    return this.request<any>('/rag/document', {
      method: 'DELETE',
      body: JSON.stringify(request),
    });
  }

  async deleteRAGCollection(collectionName: string): Promise<any> {
    return this.request<any>(`/rag/collection/${collectionName}`, {
      method: 'DELETE',
    });
  }

  async getQuestionSuggestions(collectionName: string, forceRefresh: boolean = false): Promise<{suggestions: any[]}> {
    const cacheBuster = forceRefresh ? `?t=${Date.now()}` : '';
    return this.request<{suggestions: any[]}>(`/rag/suggestions/${collectionName}${cacheBuster}`);
  }

  async getDocumentQuestionSuggestions(collectionName: string, documentId: string, forceRefresh: boolean = false): Promise<{suggestions: any[]}> {
    const cacheBuster = forceRefresh ? `?t=${Date.now()}` : '';
    return this.request<{suggestions: any[]}>(`/rag/suggestions/${collectionName}/document/${documentId}${cacheBuster}`);
  }

  async getDocumentAnalytics(collectionName: string, documentId: string): Promise<{analytics: any}> {
    return this.request<{analytics: any}>(`/rag/analytics/${collectionName}/document/${documentId}`);
  }

  // Model Comparison Methods
  async compareSummarizationModels(request: {
    text?: string;
    url?: string;
    file_content?: File;
    models: Array<{ provider: string; model: string }>;
    max_length: number;
    temperature: number;
    summary_type: string;
  }): Promise<any> {
    const formData = new FormData();
    
    if (request.text) {
      formData.append('text', request.text);
    }
    if (request.url) {
      formData.append('url', request.url);
    }
    if (request.file_content) {
      formData.append('file_content', request.file_content);
    }
    
    formData.append('models', JSON.stringify(request.models));
    formData.append('max_length', request.max_length.toString());
    formData.append('temperature', request.temperature.toString());
    formData.append('summary_type', request.summary_type);

    const response = await fetch(`${this.baseUrl}/summarize/compare`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Model comparison failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async compareGenerationModels(request: {
    system_prompt: string;
    user_prompt: string;
    models: Array<{ provider: string; model: string }>;
    temperature?: number;
    max_tokens?: number;
    target_language?: string;
    translate_response?: boolean;
    output_format?: string;
  }): Promise<any> {
    const response = await fetch(`${this.baseUrl}/generate/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async compareRAGModels(request: {
    question: string;
    collection_names: string[];
    models: Array<{ provider: string; model: string }>;
    temperature?: number;
    max_tokens?: number;
    top_k?: number;
    similarity_threshold?: number;
    filter_tags?: string[];
  }): Promise<any> {
    const response = await fetch(`${this.baseUrl}/rag/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Image Analysis Methods
  async analyzeImage(request: {
    image: Uint8Array;
    analysis_type: 'describe' | 'extract' | 'analyze' | 'compare';
    model_provider: string;
    model_name?: string;
    custom_prompt?: string;
    temperature?: number;
  }): Promise<any> {
    const formData = new FormData();
    formData.append('image', new Blob([request.image]), 'image.png');
    formData.append('analysis_type', request.analysis_type);
    formData.append('model_provider', request.model_provider);
    if (request.model_name) formData.append('model_name', request.model_name);
    if (request.custom_prompt) formData.append('custom_prompt', request.custom_prompt);
    if (request.temperature !== undefined) formData.append('temperature', request.temperature.toString());
    
    // Add cache-busting parameter
    formData.append('_timestamp', Date.now().toString());

    const response = await fetch(`${this.baseUrl}/vision/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Image analysis failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async compareImages(request: {
    images: Uint8Array[];
    comparison_type: 'similarity' | 'style' | 'content' | 'quality';
    model_provider: string;
    model_name?: string;
    temperature?: number;
  }): Promise<any> {
    const formData = new FormData();
    request.images.forEach((image, index) => {
      formData.append('images', new Blob([image]), `image-${index}.png`);
    });
    formData.append('comparison_type', request.comparison_type);
    formData.append('model_provider', request.model_provider);
    if (request.model_name) formData.append('model_name', request.model_name);
    if (request.temperature !== undefined) formData.append('temperature', request.temperature.toString());

    const response = await fetch(`${this.baseUrl}/vision/compare`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Image comparison failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Image Generation Methods
  async generateImage(request: {
    prompt: string;
    model_provider: string;
    model_name?: string;
    size?: string;
    quality?: string;
    style?: string;
    num_images?: number;
    temperature?: number;
  }): Promise<any> {
    return this.request('/generate/image', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async generateStoryboard(request: {
    story_prompt: string;
    style?: string;
    num_panels?: number;
    provider?: string;
  }): Promise<any> {
    return this.request('/generate/storyboard', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getDiffusionHealth(): Promise<any> {
    return this.request('/diffusion/health', {
      method: 'GET',
    });
  }

  async generateImageVariations(request: {
    image: Uint8Array;
    model_provider: string;
    model_name?: string;
    size?: string;
    num_variations?: number;
  }): Promise<any> {
    const formData = new FormData();
    formData.append('image', new Blob([request.image]), 'image.png');
    formData.append('model_provider', request.model_provider);
    if (request.model_name) formData.append('model_name', request.model_name);
    if (request.size) formData.append('size', request.size);
    if (request.num_variations !== undefined) formData.append('num_variations', request.num_variations.toString());

    const response = await fetch(`${this.baseUrl}/generate/image/variations`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Image variation generation failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async editImage(request: {
    image: Uint8Array;
    mask?: Uint8Array;
    prompt: string;
    model_provider: string;
    model_name?: string;
    size?: string;
  }): Promise<any> {
    const formData = new FormData();
    formData.append('image', new Blob([request.image]), 'image.png');
    if (request.mask) formData.append('mask', new Blob([request.mask]), 'mask.png');
    formData.append('prompt', request.prompt);
    formData.append('model_provider', request.model_provider);
    if (request.model_name) formData.append('model_name', request.model_name);
    if (request.size) formData.append('size', request.size);

    const response = await fetch(`${this.baseUrl}/generate/image/edit`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Image editing failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Video Generation Methods
  async generateVideo(request: {
    prompt: string;
    style?: string;
    width?: number;
    height?: number;
    duration?: number;
    fps?: number;
    num_videos?: number;
  }): Promise<any> {
    return this.request<any>('/generate/video', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async generateVideoStream(request: {
    prompt: string;
    style?: string;
    width?: number;
    height?: number;
    duration?: number;
    fps?: number;
    num_videos?: number;
  }, onProgress?: (progress: { download_progress: number; load_progress: number; generate_progress: number }) => void): Promise<any> {
    const response = await fetch(`${this.baseUrl}/generate/video/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Video generation failed: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    return new Promise((resolve, reject) => {
      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error('Video generation timed out. Please try again.'));
      }, 300000); // 5 minutes timeout

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              break;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data.trim()) {
                  try {
                    const parsed = JSON.parse(data);
                    
                    if (parsed.event === 'progress' && onProgress) {
                      onProgress(parsed);
                    } else if (parsed.event === 'complete') {
                      clearTimeout(timeout);
                      resolve(parsed);
                    } else if (parsed.event === 'error') {
                      clearTimeout(timeout);
                      reject(new Error(parsed.error));
                    }
                  } catch (e) {
                    // Ignore parsing errors for incomplete chunks
                  }
                }
              }
            }
          }
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      };

      processStream();
    });
  }

  async generateAnimation(request: {
    prompt: string;
    style?: string;
    width?: number;
    height?: number;
    num_frames?: number;
    fps?: number;
  }): Promise<any> {
    return this.request<any>('/generate/animation', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async enhanceVideo(request: {
    video: File;
    enhancement_type?: string;
  }): Promise<any> {
    const formData = new FormData();
    formData.append('video', request.video);
    formData.append('enhancement_type', request.enhancement_type || 'upscale');

    const response = await fetch(`${this.baseUrl}/enhance/video`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Video enhancement failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async generateMusic(payload: { prompt: string; duration?: number; tempo?: number }) {
    const res = await fetch(`${this.baseUrl}/audio/generate/music`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Music generation failed');
    return res.json();
  }

  async processAudio(formData: FormData) {
    const res = await fetch(`${this.baseUrl}/audio/process`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Audio processing failed');
    return res.json();
  }

  async speechToText(formData: FormData) {
    const res = await fetch(`${this.baseUrl}/audio/speech-to-text`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Speech-to-text failed');
    return res.json();
  }

  async textToSpeech(formData: FormData) {
    const res = await fetch(`${this.baseUrl}/audio/text-to-speech`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Text-to-speech failed');
    return res.json();
  }

  async getTTSVoices(params?: string) {
    const url = params ? `${this.baseUrl}/audio/tts/voices?${params}` : `${this.baseUrl}/audio/tts/voices`;
    const res = await fetch(url, {
      method: 'GET',
    });
    if (!res.ok) throw new Error('Failed to get TTS voices');
    return res.json();
  }
}

export const apiService = new ApiService(); 