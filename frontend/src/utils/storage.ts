export interface PromptHistory {
  id: string;
  timestamp: string;
  type: 'generate' | 'summarize';
  system_prompt?: string;
  user_prompt?: string;
  text?: string;
  model_provider: string;
  model_name: string;
  response: string;
  token_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  latency_ms: number;
}

const HISTORY_KEY = 'genai_lab_prompt_history';
const MAX_HISTORY_ITEMS = 50;

export const storageUtils = {
  getPromptHistory(): PromptHistory[] {
    try {
      const history = localStorage.getItem(HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error reading prompt history:', error);
      return [];
    }
  },

  savePromptHistory(history: PromptHistory[]): void {
    try {
      // Keep only the most recent items
      const limitedHistory = history.slice(-MAX_HISTORY_ITEMS);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('Error saving prompt history:', error);
    }
  },

  addPromptToHistory(prompt: PromptHistory): void {
    const history = this.getPromptHistory();
    history.push(prompt);
    this.savePromptHistory(history);
  },

  clearPromptHistory(): void {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing prompt history:', error);
    }
  },

  getHistoryByType(type: 'generate' | 'summarize'): PromptHistory[] {
    const history = this.getPromptHistory();
    return history.filter(item => item.type === type);
  }
}; 