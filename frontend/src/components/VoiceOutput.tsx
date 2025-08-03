import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, Square } from 'lucide-react';

interface VoiceOutputProps {
  text: string;
  disabled?: boolean;
  className?: string;
}

export const VoiceOutput: React.FC<VoiceOutputProps> = ({
  text,
  disabled = false,
  className = ""
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentVoice, setCurrentVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voiceSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (voiceSelectorRef.current && !voiceSelectorRef.current.contains(event.target as Node)) {
        setShowVoiceSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Check if browser supports speech synthesis
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      
      // Load available voices
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        
        // Set default voice (prefer English voices)
        const englishVoice = voices.find(voice => 
          voice.lang.startsWith('en') && voice.default
        ) || voices.find(voice => 
          voice.lang.startsWith('en')
        ) || voices[0];
        
        setCurrentVoice(englishVoice || null);
      };

      // Load voices when they become available
      if (window.speechSynthesis.getVoices().length > 0) {
        loadVoices();
      } else {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }

      // Cleanup
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    } else {
      setIsSupported(false);
      setError('Text-to-speech is not supported in this browser');
    }
  }, []);

  const speak = () => {
    if (!isSupported || disabled || !text.trim()) return;

    try {
      // Stop any current speech
      window.speechSynthesis.cancel();

      // Create new utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = currentVoice;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Set up event handlers
      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
        setError(null);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };

      utterance.onpause = () => {
        setIsPaused(true);
      };

      utterance.onresume = () => {
        setIsPaused(false);
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        setError(`Speech synthesis error: ${event.error}`);
        setIsPlaying(false);
        setIsPaused(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      setError('Failed to start speech synthesis');
      console.error('Speech synthesis error:', err);
    }
  };

  const pause = () => {
    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resume = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handleVoiceChange = (voice: SpeechSynthesisVoice) => {
    setCurrentVoice(voice);
    setShowVoiceSelector(false);
    
    // If currently playing, restart with new voice
    if (isPlaying) {
      stop();
      setTimeout(speak, 100);
    }
  };

  if (!isSupported) {
    return (
      <div className={`flex items-center space-x-2 text-sm text-gray-500 ${className}`}>
        <VolumeX size={16} />
        <span>Text-to-speech not supported in this browser</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Voice selector */}
      <div className="relative" ref={voiceSelectorRef}>
        <button
          onClick={() => setShowVoiceSelector(!showVoiceSelector)}
          disabled={disabled}
          className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          title="Select voice"
        >
          <Volume2 size={12} />
          <span>{currentVoice?.name || 'Default'}</span>
        </button>

        {showVoiceSelector && (
          <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto min-w-48">
            {availableVoices.map((voice) => (
              <div
                key={voice.name}
                onClick={() => handleVoiceChange(voice)}
                className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-sm">{voice.name}</div>
                <div className="text-xs text-gray-500">{voice.lang}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Play/Pause/Stop controls */}
      <div className="flex items-center space-x-1">
        {!isPlaying ? (
          <button
            onClick={speak}
            disabled={disabled || !text.trim()}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Play audio"
          >
            <Play size={14} />
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                onClick={resume}
                className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                title="Resume audio"
              >
                <Play size={14} />
              </button>
            ) : (
              <button
                onClick={pause}
                className="p-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-colors"
                title="Pause audio"
              >
                <Pause size={14} />
              </button>
            )}
            <button
              onClick={stop}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              title="Stop audio"
            >
              <Square size={14} />
            </button>
          </>
        )}
      </div>

      {/* Status indicator */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">
          {isPlaying ? (isPaused ? 'Paused' : 'Playing...') : 'Text-to-speech'}
        </span>
        {isPlaying && !isPaused && (
          <div className="flex space-x-1">
            <div className="w-1 h-4 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-1 h-4 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1 h-4 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          </div>
        )}
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
          {error}
        </div>
      )}
    </div>
  );
}; 