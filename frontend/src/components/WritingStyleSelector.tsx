import React, { useState, useRef, useEffect } from 'react';
import { Palette, ChevronDown } from 'lucide-react';
import { WritingStyle } from '../types/api';

interface WritingStyleSelectorProps {
  selectedStyle: string;
  onStyleChange: (style: string) => void;
  onSystemPromptChange: (prompt: string) => void;
  className?: string;
}

const WRITING_STYLES: WritingStyle[] = [
  {
    id: 'none',
    name: 'None',
    description: 'No specific writing style - use default model behavior',
    icon: '⚪',
    category: 'default',
    systemPrompt: ''
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Imaginative and artistic writing with vivid descriptions',
    icon: '🎨',
    category: 'creative',
    systemPrompt: 'You are a creative writer with a vivid imagination. Write in an engaging, descriptive style that brings ideas to life with colorful language, metaphors, and sensory details. Focus on storytelling and emotional resonance.'
  },
  {
    id: 'poetic',
    name: 'Poetic',
    description: 'Lyrical and rhythmic writing with poetic devices',
    icon: '📝',
    category: 'creative',
    systemPrompt: 'You are a poet who writes with rhythm, meter, and poetic devices. Use metaphors, similes, alliteration, and imagery to create beautiful, evocative language. Consider rhyme schemes and poetic forms when appropriate.'
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Professional and formal business communication',
    icon: '💼',
    category: 'professional',
    systemPrompt: 'You are a business professional. Write in a clear, concise, and professional tone. Use formal language, avoid jargon when possible, and structure your response logically with clear headings and bullet points when appropriate.'
  },
  {
    id: 'academic',
    name: 'Academic',
    description: 'Scholarly and research-based writing style',
    icon: '📚',
    category: 'educational',
    systemPrompt: 'You are an academic writer. Use formal, scholarly language with precise terminology. Structure your response with clear arguments, evidence, and citations. Maintain objectivity and analytical rigor.'
  },
  {
    id: 'technical',
    name: 'Technical',
    description: 'Precise and detailed technical documentation',
    icon: '⚙️',
    category: 'professional',
    systemPrompt: 'You are a technical writer. Write with precision, clarity, and attention to detail. Use technical terminology appropriately, provide step-by-step instructions when needed, and ensure accuracy in all technical information.'
  },
  {
    id: 'conversational',
    name: 'Conversational',
    description: 'Friendly and approachable casual writing',
    icon: '💬',
    category: 'casual',
    systemPrompt: 'You are a friendly conversationalist. Write in a warm, approachable tone as if speaking to a friend. Use contractions, simple language, and engaging questions. Keep the tone light and relatable.'
  },
  {
    id: 'journalistic',
    name: 'Journalistic',
    description: 'News-style writing with facts and objectivity',
    icon: '📰',
    category: 'informational',
    systemPrompt: 'You are a journalist. Write in a clear, objective style that presents facts accurately and fairly. Use the inverted pyramid structure, answer the 5 Ws (who, what, when, where, why), and maintain journalistic integrity.'
  },
  {
    id: 'storytelling',
    name: 'Storytelling',
    description: 'Narrative-driven writing with plot and characters',
    icon: '📖',
    category: 'creative',
    systemPrompt: 'You are a storyteller. Create engaging narratives with compelling characters, clear plot structure, and vivid scenes. Use dialogue, pacing, and descriptive language to draw readers into the story.'
  },
  {
    id: 'persuasive',
    name: 'Persuasive',
    description: 'Convincing and argumentative writing style',
    icon: '🎯',
    category: 'professional',
    systemPrompt: 'You are a persuasive writer. Use logical arguments, emotional appeals, and credible evidence to convince your audience. Structure your response with clear claims, supporting evidence, and compelling conclusions.'
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Simple and concise writing with essential information',
    icon: '✨',
    category: 'casual',
    systemPrompt: 'You are a minimalist writer. Use simple, clear language with minimal words. Focus on essential information, avoid unnecessary details, and create clean, easy-to-read content that gets straight to the point.'
  },
  {
    id: 'formal',
    name: 'Formal',
    description: 'Traditional and dignified writing style',
    icon: '🎩',
    category: 'professional',
    systemPrompt: 'You are a formal writer. Use sophisticated vocabulary, complex sentence structures, and traditional writing conventions. Maintain a dignified, respectful tone appropriate for formal occasions and professional settings.'
  },
  {
    id: 'humorous',
    name: 'Humorous',
    description: 'Witty and entertaining writing with humor',
    icon: '😄',
    category: 'casual',
    systemPrompt: 'You are a humorous writer. Use wit, wordplay, and clever observations to entertain your audience. Include appropriate jokes, puns, and lighthearted commentary while maintaining the quality of your content.'
  }
];

// Example prompts for each writing style
const STYLE_EXAMPLES: Record<string, string> = {
  creative: "Describe a magical forest at sunset",
  poetic: "Write a poem about the changing seasons",
  business: "Draft a professional email to a client about project updates",
  academic: "Analyze the impact of climate change on biodiversity",
  technical: "Explain how to implement a REST API",
  conversational: "Tell me about your favorite hobby",
  journalistic: "Report on a local community event",
  storytelling: "Create a short story about a mysterious package",
  persuasive: "Convince someone to adopt a pet from a shelter",
  minimalist: "Summarize the key points of a meeting",
  formal: "Write a formal letter of recommendation",
  humorous: "Explain quantum physics using only food analogies"
};

export const WritingStyleSelector: React.FC<WritingStyleSelectorProps> = ({
  selectedStyle,
  onStyleChange,
  onSystemPromptChange,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleStyleSelect = (styleId: string) => {
    onStyleChange(styleId);
    const style = WRITING_STYLES.find(s => s.id === styleId);
    if (style && styleId !== 'none') {
      onSystemPromptChange(style.systemPrompt);
    }
    setIsOpen(false);
  };

  const selectedStyleData = WRITING_STYLES.find(s => s.id === selectedStyle);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center space-x-2">
        <Palette className="text-purple-600" size={20} />
        <h3 className="text-lg font-medium text-gray-900">Writing Style</h3>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-lg hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
        >
          <div className="flex items-center space-x-2">
            {selectedStyleData && (
              <span className="text-lg">{selectedStyleData.icon}</span>
            )}
            <div className="text-left">
              <div className="text-gray-900 font-medium">
                {selectedStyleData ? selectedStyleData.name : 'Select a writing style'}
              </div>
              {selectedStyleData && selectedStyleData.id !== 'none' && (
                <div className="text-xs text-gray-500 truncate max-w-48">
                  {selectedStyleData.description}
                </div>
              )}
            </div>
          </div>
          <ChevronDown 
            className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto">
            {WRITING_STYLES.map(style => (
              <div
                key={style.id}
                onClick={() => handleStyleSelect(style.id)}
                className="flex items-start space-x-3 p-4 hover:bg-purple-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
              >
                <span className="text-xl mt-1">{style.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 mb-1">{style.name}</div>
                  <div className="text-sm text-gray-600 leading-relaxed">{style.description}</div>
                  {STYLE_EXAMPLES[style.id] && (
                    <div className="mt-2 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                      💡 Example: "{STYLE_EXAMPLES[style.id]}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedStyleData && selectedStyleData.id !== 'none' && (
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-start space-x-2">
            <span className="text-lg">{selectedStyleData.icon}</span>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-1">{selectedStyleData.name} Style</h4>
              <p className="text-sm text-gray-600">{selectedStyleData.description}</p>
              {STYLE_EXAMPLES[selectedStyleData.id] && (
                <div className="mt-2 p-2 bg-white rounded border border-purple-200">
                  <div className="text-xs font-medium text-purple-700 mb-1">Example prompt:</div>
                  <div className="text-xs text-gray-600 italic">"{STYLE_EXAMPLES[selectedStyleData.id]}"</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 