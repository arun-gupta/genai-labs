import React, { useRef, useState, useEffect } from 'react';
import { Music2, SlidersHorizontal, Upload, Download, Play, Zap, Volume2, VolumeX, RotateCcw, Clock, Filter, Mic, Volume1, FileText, ChevronDown } from 'lucide-react';
import { apiService } from '../services/api';

export const AudioPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'music' | 'effects' | 'tts' | 'stt'>('music');

  // Music generation state
  const [prompt, setPrompt] = useState('uplifting cinematic theme with major scale');
  const [duration, setDuration] = useState(8);
  const [tempo, setTempo] = useState(100);
  // Music generation controls
  const [genre, setGenre] = useState('cinematic');
  const [mood, setMood] = useState('uplifting');
  const [key, setKey] = useState('C');
  const [musicUrl, setMusicUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [musicProgress, setMusicProgress] = useState(0);
  const musicProgressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Audio effects state
  const [uploaded, setUploaded] = useState<File | null>(null);
  const [processedUrl, setProcessedUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const processingProgressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Audio effects options
  const [normalize, setNormalize] = useState(true);
  const [reverse, setReverse] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [reverb, setReverb] = useState(0);
  const [echo, setEcho] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [fadeIn, setFadeIn] = useState(0);
  const [fadeOut, setFadeOut] = useState(0);
  // EQ parameters
  const [eqLow, setEqLow] = useState(0);
  const [eqMid, setEqMid] = useState(0);
  const [eqHigh, setEqHigh] = useState(0);
  // Compression parameters
  const [compressionThreshold, setCompressionThreshold] = useState(-20);
  const [compressionRatio, setCompressionRatio] = useState(4);
  const [compressionAttack, setCompressionAttack] = useState(10);
  const [compressionRelease, setCompressionRelease] = useState(100);
  const [outputFormat, setOutputFormat] = useState<'wav' | 'mp3' | 'flac'>('wav');
  const [sampleRate, setSampleRate] = useState(44100);
  const [appliedEffects, setAppliedEffects] = useState<{pitch: number, speed: number}>({pitch: 1.0, speed: 1.0});

  // Speech processing state
  const [speechText, setSpeechText] = useState('');
  const [ttsText, setTtsText] = useState('Hello, this is a test of the text-to-speech system.');
  const [ttsVoice, setTtsVoice] = useState('en-US-AriaNeural');
  const [ttsSpeed, setTtsSpeed] = useState(1.0);
  const [ttsVolume, setTtsVolume] = useState(100);
  const [ttsModel, setTtsModel] = useState('edge');
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string>('');
  const [isTtsGenerating, setIsTtsGenerating] = useState(false);
  const [ttsProgress, setTtsProgress] = useState(0);
  const ttsProgressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Enhanced TTS settings
  const [ttsPitch, setTtsPitch] = useState(0);
  const [ttsGender, setTtsGender] = useState('');
  const [ttsStyle, setTtsStyle] = useState('');
  const [ttsLanguage, setTtsLanguage] = useState('');
  const [ttsTranslateText, setTtsTranslateText] = useState(true);
  const [ttsUseSsml, setTtsUseSsml] = useState(false);
  const [ttsNormalizeText, setTtsNormalizeText] = useState(true);
  const [ttsOutputFormat, setTtsOutputFormat] = useState<'mp3' | 'wav' | 'ogg' | 'm4a'>('mp3');
  const [filteredVoices, setFilteredVoices] = useState<Array<{name: string, language: string, gender: string, model: string, style?: string}>>([]);
  const [ttsAppliedSettings, setTtsAppliedSettings] = useState<any>(null);
  
  // STT state
  const [sttLanguage, setSttLanguage] = useState('en-US');
  const [sttModel, setSttModel] = useState('google');
  const [isSttProcessing, setIsSttProcessing] = useState(false);
  const [sttProgress, setSttProgress] = useState(0);
  const sttProgressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [sttResult, setSttResult] = useState<{text: string, confidence: number, language: string, model: string} | null>(null);
  const [sttUploadedFile, setSttUploadedFile] = useState<File | null>(null);
  
  // Available voices
  const [availableVoices, setAvailableVoices] = useState<Array<{name: string, language: string, gender: string, model: string, style?: string}>>([]);

  const clearAllEffects = () => {
    setNormalize(true);
    setReverse(false);
    setSpeed(1.0);
    setPitch(1.0);
    setReverb(0);
    setEcho(0);
    setVolume(1.0);
    setFadeIn(0);
    setFadeOut(0);
    setEqLow(0);
    setEqMid(0);
    setEqHigh(0);
    setCompressionThreshold(-20);
    setCompressionRatio(4);
    setCompressionAttack(10);
    setCompressionRelease(100);
    setOutputFormat('wav');
    setSampleRate(44100);
    setAppliedEffects({pitch: 1.0, speed: 1.0});
  };

  const audioRef = useRef<HTMLAudioElement>(null);

  // Load available voices on component mount
  useEffect(() => {
    const loadVoices = async () => {
      try {
        const response = await apiService.getTTSVoices();
        setAvailableVoices(response.voices || []);
        setFilteredVoices(response.voices || []);
      } catch (error) {
        console.error('Failed to load voices:', error);
      }
    };
    loadVoices();
  }, []);

  // Auto-disable text normalization when SSML is detected
  useEffect(() => {
    const isSSML = ttsText.trim().startsWith('<speak');
    if (isSSML && ttsNormalizeText) {
      setTtsNormalizeText(false);
    }
  }, [ttsText, ttsNormalizeText]);

  // Filter voices when criteria change
  useEffect(() => {
    const filterVoices = async () => {
      try {
        const params = new URLSearchParams();
        if (ttsGender) params.append('gender', ttsGender);
        if (ttsModel) params.append('model', ttsModel);
        if (ttsLanguage) params.append('language', ttsLanguage);
        
        const response = await apiService.getTTSVoices(params.toString());
        setFilteredVoices(response.voices || []);
        
        // Auto-select the best voice for the chosen language
        if (response.voices && response.voices.length > 0) {
          // Find the best voice for the selected language
          let bestVoice = response.voices[0];
          
          if (ttsLanguage === 'hi-IN') {
            // For Hindi, prefer Edge TTS neural voices
            const edgeNeuralVoice = response.voices.find((v: any) => 
              v.model === 'edge' && v.name.toLowerCase().includes('neural') && v.language.toLowerCase().includes('hi')
            );
            if (edgeNeuralVoice) {
              bestVoice = edgeNeuralVoice;
            } else {
              // Fallback to any Hindi voice
              const hindiVoice = response.voices.find((v: any) => 
                v.language.toLowerCase().includes('hi')
              );
              if (hindiVoice) {
                bestVoice = hindiVoice;
              }
            }
          } else if (ttsLanguage) {
            // For other languages, prefer Edge TTS voices
            const edgeVoice = response.voices.find((v: any) => v.model === 'edge');
            if (edgeVoice) {
              bestVoice = edgeVoice;
            }
          } else {
            // If no language selected, prefer Edge TTS English voices based on browser locale
            const browserLang = navigator.language.toLowerCase();
            
            // Try to find a voice that matches the browser locale
            let edgeEnglishVoice = response.voices.find((v: any) => 
              v.model === 'edge' && v.language.toLowerCase() === browserLang
            );
            
            // If no exact match, try to find a voice from the same country/region
            if (!edgeEnglishVoice && browserLang.startsWith('en')) {
              if (browserLang.includes('us') || browserLang.includes('en-us')) {
                // Prefer US English
                edgeEnglishVoice = response.voices.find((v: any) => 
                  v.model === 'edge' && v.language.toLowerCase() === 'en-us'
                );
              } else if (browserLang.includes('gb') || browserLang.includes('en-gb')) {
                // Prefer UK English
                edgeEnglishVoice = response.voices.find((v: any) => 
                  v.model === 'edge' && v.language.toLowerCase() === 'en-gb'
                );
              } else if (browserLang.includes('au') || browserLang.includes('en-au')) {
                // Prefer Australian English
                edgeEnglishVoice = response.voices.find((v: any) => 
                  v.model === 'edge' && v.language.toLowerCase() === 'en-au'
                );
              }
            }
            
            // Fallback to any Edge TTS English voice, preferring US English
            if (!edgeEnglishVoice) {
              edgeEnglishVoice = response.voices.find((v: any) => 
                v.model === 'edge' && v.language.toLowerCase() === 'en-us'
              ) || response.voices.find((v: any) => 
                v.model === 'edge' && v.language.toLowerCase().startsWith('en')
              );
            }
            
            if (edgeEnglishVoice) {
              bestVoice = edgeEnglishVoice;
            }
          }
          
          setTtsVoice(bestVoice.name);
        } else {
          // If no voices found for the selected language, fall back to English based on browser locale
          console.warn(`No voices found for language: ${ttsLanguage}, falling back to English`);
          const browserLang = navigator.language.toLowerCase();
          
          // Try to find a voice that matches the browser locale
          let englishVoice = availableVoices.find((v: any) => 
            v.model === 'edge' && v.language.toLowerCase() === browserLang
          );
          
          // If no exact match, try to find a voice from the same country/region
          if (!englishVoice && browserLang.startsWith('en')) {
            if (browserLang.includes('us') || browserLang.includes('en-us')) {
              // Prefer US English
              englishVoice = availableVoices.find((v: any) => 
                v.model === 'edge' && v.language.toLowerCase() === 'en-us'
              );
            } else if (browserLang.includes('gb') || browserLang.includes('en-gb')) {
              // Prefer UK English
              englishVoice = availableVoices.find((v: any) => 
                v.model === 'edge' && v.language.toLowerCase() === 'en-gb'
              );
            } else if (browserLang.includes('au') || browserLang.includes('en-au')) {
              // Prefer Australian English
              englishVoice = availableVoices.find((v: any) => 
                v.model === 'edge' && v.language.toLowerCase() === 'en-au'
              );
            }
          }
          
          // Fallback to any Edge TTS English voice, preferring US English
          if (!englishVoice) {
            englishVoice = availableVoices.find((v: any) => 
              v.model === 'edge' && v.language.toLowerCase() === 'en-us'
            ) || availableVoices.find((v: any) => 
              v.model === 'edge' && v.language.toLowerCase().startsWith('en')
            );
          }
          
          if (englishVoice) {
            setTtsVoice(englishVoice.name);
          }
        }
      } catch (error) {
        console.error('Failed to filter voices:', error);
      }
    };
    
    // Always filter voices, even when no criteria are set
    filterVoices();
        }, [ttsGender, ttsModel, ttsLanguage, availableVoices]);

  // Auto-enable SSML when speaking styles are selected
  useEffect(() => {
    if (ttsStyle) {
      setTtsUseSsml(true);
    }
  }, [ttsStyle]);

  // Speech processing functions
  const handleSpeechToText = async (file: File) => {
    try {
      setIsSttProcessing(true);
      setSttResult(null);
      startProgress(setSttProgress, sttProgressTimer);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', sttLanguage);
      formData.append('model', sttModel);
      
      const result = await apiService.speechToText(formData);
      setSttResult(result);
      finishProgress(setSttProgress, sttProgressTimer);
      
      // Show success message for real audio files
      if (!file.name.includes('sample')) {
        alert(`Speech-to-text successful! Transcribed ${result.text.length} characters with ${Math.round(result.confidence * 100)}% confidence.`);
      }
    } catch (error) {
      console.error('STT Error details:', error);
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes('Speech could not be understood') && sttUploadedFile?.name.includes('sample') && !sttUploadedFile?.name.includes('speech-sample')) {
          alert('Test completed! The "Speech could not be understood" result is expected for the test tone. This confirms the STT interface is working correctly. Try uploading a real audio file with speech for actual transcription.');
        } else {
          alert(`Speech-to-text failed: ${errorMessage}`);
        }
      } else {
        alert('Speech-to-text failed. Please try again.');
      }
      resetProgress(setSttProgress);
    } finally {
      setIsSttProcessing(false);
    }
  };

  const handleUseSampleAudio = async () => {
    try {
      // Try to fetch the speech sample from the public directory
      const response = await fetch('/speech-sample.mp3');
      
      if (!response.ok) {
        // If the file doesn't exist, create a fallback audio file
        throw new Error('Sample speech file not available');
      }
      
      const audioBlob = await response.blob();
      const sampleFile = new File([audioBlob], 'speech-sample.mp3', { type: 'audio/mp3' });
      
      // Set the sample file for processing
      setSttUploadedFile(sampleFile);
      
    } catch (error) {
      // Fallback: Create a simple audio file if the sample is not available
      console.log('Sample speech file not available, creating fallback audio...');
      
      const sampleRate = 44100;
      const duration = 2; // 2 seconds
      const samples = sampleRate * duration;
      
      // Create audio data with a clear, recognizable pattern
      const audioData = new Float32Array(samples);
      
      // Create a pattern that mimics speech with clear variations
      for (let i = 0; i < samples; i++) {
        const time = i / sampleRate;
        let amplitude = 0;
        
        // Create a pattern that varies over time to simulate speech
        const baseFreq = 300 + 200 * Math.sin(time * 1.5);
        const modulation = Math.sin(2 * Math.PI * baseFreq * time);
        
        // Add some variation to make it more speech-like
        const variation = Math.sin(time * 4) * Math.sin(time * 7);
        
        // Combine the patterns
        amplitude = 0.3 * modulation * (1 + 0.2 * variation);
        
        // Add some noise to make it more realistic
        amplitude += 0.05 * (Math.random() - 0.5);
        
        // Add fade in/out
        const fadeIn = Math.min(1, time / 0.3);
        const fadeOut = Math.min(1, (duration - time) / 0.3);
        amplitude *= fadeIn * fadeOut;
        
        audioData[i] = Math.max(-1, Math.min(1, amplitude));
      }
      
      // Convert to WAV format
      const wavBuffer = new ArrayBuffer(44 + samples * 2);
      const view = new DataView(wavBuffer);
      
      // WAV header
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + samples * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, samples * 2, true);
      
      // Write audio data
      for (let i = 0; i < samples; i++) {
        const sample = Math.max(-1, Math.min(1, audioData[i]));
        view.setInt16(44 + i * 2, sample * 0x7FFF, true);
      }
      
      // Create File object
      const sampleFile = new File([wavBuffer], 'sample-tone.wav', { type: 'audio/wav' });
      
      // Set the sample file for processing
      setSttUploadedFile(sampleFile);
    }
  };

  const handleTextToSpeech = async () => {
    if (!ttsText.trim()) return;
    
    try {
      setIsTtsGenerating(true);
      setTtsAudioUrl('');
      startProgress(setTtsProgress, ttsProgressTimer);
      
      const formData = new FormData();
      formData.append('text', ttsText);
      formData.append('voice', ttsVoice);
      formData.append('speed', ttsSpeed.toString());
      formData.append('pitch', ttsPitch.toString());
      formData.append('volume', ttsVolume.toString());
      formData.append('model', ttsModel);
      formData.append('gender', ttsGender);
      formData.append('style', ttsStyle);
      formData.append('language', ttsLanguage);
      formData.append('translate_text', ttsTranslateText.toString());
      formData.append('output_format', ttsOutputFormat);
      formData.append('use_ssml', ttsUseSsml.toString());
      formData.append('normalize_text', ttsNormalizeText.toString());
      
      const result = await apiService.textToSpeech(formData);
      setTtsAudioUrl(result.audio_base64);
      setTtsAppliedSettings(result.applied_settings);
      finishProgress(setTtsProgress, ttsProgressTimer);
    } catch (error) {
      alert('Text-to-speech failed. Please try again.');
      console.error(error);
      resetProgress(setTtsProgress);
    } finally {
      setIsTtsGenerating(false);
    }
  };

  // Update playback rate when speed changes or effects are applied
  React.useEffect(() => {
    if (audioRef.current && processedUrl) {
      // Calculate effective playback rate
      // When pitch is applied, the backend changes the sample rate
      // We need to compensate for this in the playback rate
      let effectiveSpeed = speed;
      
      // If pitch was applied, adjust the playback rate
      if (appliedEffects.pitch !== 1.0) {
        // The backend changes sample rate for pitch, so we need to compensate
        // If pitch is 2.0x, the audio is already 2x faster, so we need to slow it down
        effectiveSpeed = speed / appliedEffects.pitch;
      }
      
      audioRef.current.playbackRate = effectiveSpeed;
      console.log('Set playback rate to:', effectiveSpeed, '(speed:', speed, ', pitch:', appliedEffects.pitch, ')');
    }
  }, [speed, processedUrl, appliedEffects]);

  // Set playback rate when audio starts playing
  const handleAudioPlay = () => {
    if (audioRef.current) {
      let effectiveSpeed = speed;
      
      if (appliedEffects.pitch !== 1.0) {
        effectiveSpeed = speed / appliedEffects.pitch;
      }
      
      audioRef.current.playbackRate = effectiveSpeed;
      console.log('Audio started playing, set playback rate to:', effectiveSpeed, '(speed:', speed, ', pitch:', appliedEffects.pitch, ')');
    }
  };

  const samplePrompts: string[] = [
    'Epic cinematic theme with orchestral strings and dramatic brass',
    'Jazz quartet with smooth piano, walking bass, and brush drums',
    'Electronic dance track with pulsing synths and driving beats',
    'Classical piano sonata with flowing melodies and rich harmonies',
    'Rock anthem with powerful guitar riffs and thunderous drums',
    'Ambient meditation with ethereal strings and gentle piano',
    'Latin jazz fusion with fiery horns and percussive rhythms',
    'Folk ballad with acoustic guitar and warm vocal harmonies',
    'Synthwave retro with analog synthesizers and drum machines',
    'Orchestral film score with emotional strings and brass',
    'Blues trio with soulful guitar, walking bass, and brush drums',
    'Chamber music with delicate strings and gentle woodwinds',
    'Funk groove with tight bass, rhythmic guitar, and punchy drums',
    'Celtic folk with acoustic guitar, fiddle, and bodhran drums',
    'Smooth jazz with mellow saxophone, piano, and soft brushes'
  ];

  const [showAllSamples, setShowAllSamples] = useState(false);
  const visiblePrompts = showAllSamples ? samplePrompts : samplePrompts.slice(0, 4);

  const startProgress = (setFn: React.Dispatch<React.SetStateAction<number>>, ref: React.MutableRefObject<ReturnType<typeof setInterval> | null>) => {
    setFn(0);
    if (ref.current) clearInterval(ref.current);
    ref.current = setInterval(() => {
      setFn((prev: number) => {
        const maxBeforeComplete = 99;
        if (prev >= maxBeforeComplete) return prev;
        let inc = 1;
        if (prev < 60) inc = 4 + Math.floor(Math.random() * 5);        // 4-8%
        else if (prev < 85) inc = 2 + Math.floor(Math.random() * 4);   // 2-5%
        else inc = 1 + Math.floor(Math.random() * 2);                   // 1-2%
        const next = Math.min(prev + inc, maxBeforeComplete);
        return next;
      });
    }, 250);
  };

  const finishProgress = (setFn: React.Dispatch<React.SetStateAction<number>>, ref: React.MutableRefObject<ReturnType<typeof setInterval> | null>) => {
    if (ref.current) {
      clearInterval(ref.current);
      ref.current = null;
    }
    setFn(100);
  };

  const resetProgress = (setFn: React.Dispatch<React.SetStateAction<number>>) => setFn(0);

  // Ensure timers are cleared on unmount or tab change
  React.useEffect(() => {
    return () => {
      if (musicProgressTimer.current) clearInterval(musicProgressTimer.current);
      if (processingProgressTimer.current) clearInterval(processingProgressTimer.current);
    };
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    try {
      setIsGenerating(true);
      setMusicUrl('');
      startProgress(setMusicProgress, musicProgressTimer);
      
      // Generate music based on descriptive prompt
      const fullPrompt = `${genre} ${mood} music in ${key} key: ${prompt}`;
      const res = await apiService.generateMusic({ prompt: fullPrompt, duration, tempo });
      
      setMusicUrl(res.audio_base64);
      finishProgress(setMusicProgress, musicProgressTimer);
    } catch (e) {
      alert('Music generation failed.');
      console.error(e);
      resetProgress(setMusicProgress);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleProcess = async () => {
    if (!uploaded) {
      alert('Please upload an audio file first.');
      return;
    }

    try {
      setIsProcessing(true);
      setProcessedUrl('');
      startProgress(setProcessingProgress, processingProgressTimer);
      
      const formData = new FormData();
      formData.append('file', uploaded);
      formData.append('normalize', normalize.toString());
      formData.append('reverse', reverse.toString());
      formData.append('speed', speed.toString());
      formData.append('pitch', pitch.toString());
      formData.append('reverb', reverb.toString());
      formData.append('echo', echo.toString());
      formData.append('volume', volume.toString());
      formData.append('fade_in', fadeIn.toString());
      formData.append('fade_out', fadeOut.toString());
      // EQ parameters
      formData.append('eq_low', eqLow.toString());
      formData.append('eq_mid', eqMid.toString());
      formData.append('eq_high', eqHigh.toString());
      // Compression parameters
      formData.append('compression_threshold', compressionThreshold.toString());
      formData.append('compression_ratio', compressionRatio.toString());
      formData.append('compression_attack', compressionAttack.toString());
      formData.append('compression_release', compressionRelease.toString());
      formData.append('output_format', outputFormat);
      formData.append('sample_rate', sampleRate.toString());

      const res = await apiService.processAudio(formData);
      console.log('Audio processing response:', res);
      console.log('Processed audio base64 length:', res.audio_base64.length);
      
      // Track applied effects for playback rate calculation
      if (res.effects_applied) {
        setAppliedEffects({
          pitch: res.effects_applied.pitch || 1.0,
          speed: res.effects_applied.speed || 1.0
        });
        console.log('Applied effects:', res.effects_applied);
      }
      
      setProcessedUrl(res.audio_base64);
      finishProgress(setProcessingProgress, processingProgressTimer);
    } catch (e) {
      alert('Audio processing failed.');
      console.error(e);
      resetProgress(setProcessingProgress);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Audio</h1>
            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 border border-blue-200">Music & Processing</span>
          </div>
          <p className="text-gray-600 mt-2">Generate simple demo music from a prompt and perform basic processing on uploaded audio.</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('music')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'music'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Music
            </button>
            <button
              onClick={() => setActiveTab('effects')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'effects'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Effects
            </button>
            <button
              onClick={() => setActiveTab('tts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tts'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Text-to-Speech
            </button>
            <button
              onClick={() => setActiveTab('stt')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stt'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Speech-to-Text
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className={`grid gap-6 ${
          activeTab === 'music' || activeTab === 'effects' 
            ? 'grid-cols-1 xl:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {/* Left Panel - Inputs */}
          <div className={`space-y-6 ${
            activeTab === 'music' || activeTab === 'effects' 
              ? 'xl:col-span-1' 
              : 'hidden'
          }`}>
            {activeTab === 'music' && (
              <>
                {/* Prompt */}
                <div className="card">
                  <div className="flex items-center gap-2 mb-3">
                    <Music2 className="text-indigo-600" size={18} />
                    <h2 className="text-lg font-semibold">Prompt</h2>
                  </div>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the music you want (e.g., uplifting cinematic theme)"
                    className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Sample Prompts */}
                <div className="card">
                  <h3 className="text-md font-semibold mb-3">Sample Prompts</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {visiblePrompts.map((sp, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPrompt(sp)}
                        className="text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors text-sm"
                        title="Use this sample prompt"
                      >
                        {sp}
                      </button>
                    ))}
                  </div>
                  {samplePrompts.length > 4 && (
                    <button
                      onClick={() => setShowAllSamples((s) => !s)}
                      className="mt-3 text-xs text-indigo-600 hover:underline"
                    >
                      {showAllSamples ? 'Show Less' : `Show More (${samplePrompts.length - 4} more)`}
                    </button>
                  )}
                </div>



                {/* Quick Settings */}
                <div className="card">
                  <h3 className="text-md font-semibold mb-3">Quick Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4">
                      <label className="text-sm text-gray-700 font-medium w-16">Genre</label>
                      <select
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                      >
                        <option value="cinematic">Cinematic</option>
                        <option value="rock">Rock</option>
                        <option value="pop">Pop</option>
                        <option value="jazz">Jazz</option>
                        <option value="classical">Classical</option>
                        <option value="electronic">Electronic</option>
                        <option value="ambient">Ambient</option>
                        <option value="folk">Folk</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-4">
                      <label className="text-sm text-gray-700 font-medium w-16">Mood</label>
                      <select
                        value={mood}
                        onChange={(e) => setMood(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                      >
                        <option value="uplifting">Uplifting</option>
                        <option value="melancholic">Melancholic</option>
                        <option value="energetic">Energetic</option>
                        <option value="relaxing">Relaxing</option>
                        <option value="dramatic">Dramatic</option>
                        <option value="mysterious">Mysterious</option>
                        <option value="romantic">Romantic</option>
                        <option value="epic">Epic</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-4">
                      <label className="text-sm text-gray-700 font-medium w-16">Key</label>
                      <select
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                      >
                        <option value="C">C Major</option>
                        <option value="G">G Major</option>
                        <option value="D">D Major</option>
                        <option value="A">A Major</option>
                        <option value="E">E Major</option>
                        <option value="B">B Major</option>
                        <option value="F">F Major</option>
                        <option value="Bb">Bb Major</option>
                        <option value="Am">A Minor</option>
                        <option value="Em">E Minor</option>
                        <option value="Bm">B Minor</option>
                        <option value="F#m">F# Minor</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2 font-medium">Duration: {duration}s</label>
                      <input
                        type="range"
                        min="4"
                        max="16"
                        step="1"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>4s</span>
                        <span>16s</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-700 mb-2 font-medium">Tempo: {tempo} BPM</label>
                      <input
                        type="range"
                        min="60"
                        max="160"
                        step="10"
                        value={tempo}
                        onChange={(e) => setTempo(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>60</span>
                        <span>160</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="card space-y-3">
                  <button onClick={handleGenerate} disabled={isGenerating} className="btn-primary inline-flex items-center gap-2">
                    <Zap size={16} /> {isGenerating ? 'Generating...' : 'Generate Music'}
                  </button>
                  {(isGenerating || musicProgress > 0) && (
                    <div>
                      <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2 transition-all duration-300 ease-out"
                          style={{ width: `${musicProgress}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{musicProgress}%</div>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'effects' && (
              <>
                {/* Upload */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Upload Audio File</h3>
                  
                  {/* Sample File */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">Need a test file?</h4>
                        <p className="text-sm text-blue-700 mt-1">Download our sample audio file to test the effects</p>
                      </div>
                      <button
                        onClick={() => {
                          // Create a more vibrant test melody
                          const sampleRate = 44100;
                          const duration = 4; // 4 seconds
                          const samples = sampleRate * duration;
                          
                          // Define a simple melody (C major scale: C, D, E, F, G, A, B, C)
                          const notes = [
                            { freq: 261.63, duration: 0.5 }, // C4
                            { freq: 293.66, duration: 0.5 }, // D4
                            { freq: 329.63, duration: 0.5 }, // E4
                            { freq: 349.23, duration: 0.5 }, // F4
                            { freq: 392.00, duration: 0.5 }, // G4
                            { freq: 440.00, duration: 0.5 }, // A4
                            { freq: 493.88, duration: 0.5 }, // B4
                            { freq: 523.25, duration: 0.5 }  // C5
                          ];
                          
                          // Generate the melody
                          const audioData = new Float32Array(samples);
                          let currentSample = 0;
                          
                          for (const note of notes) {
                            const noteSamples = Math.floor(note.duration * sampleRate);
                            const endSample = Math.min(currentSample + noteSamples, samples);
                            
                            for (let i = currentSample; i < endSample; i++) {
                              // Add some variation to make it more interesting
                              const time = (i - currentSample) / sampleRate;
                              const envelope = Math.exp(-time * 2); // Decay envelope
                              const vibrato = Math.sin(2 * Math.PI * 6 * time) * 0.02; // Subtle vibrato
                              
                              audioData[i] = Math.sin(2 * Math.PI * (note.freq + vibrato) * time) * 0.25 * envelope;
                            }
                            
                            currentSample += noteSamples;
                          }
                          
                          // Add some percussion-like elements for rhythm
                          const beatSamples = Math.floor(0.5 * sampleRate); // Half second beats
                          for (let beat = 0; beat < 8; beat++) {
                            const beatStart = beat * beatSamples;
                            if (beatStart < samples) {
                              // Add a percussive click at the start of each beat
                              for (let i = 0; i < Math.min(1000, samples - beatStart); i++) {
                                const click = Math.random() * 0.1 * Math.exp(-i / 100);
                                audioData[beatStart + i] += click;
                              }
                            }
                          }
                          
                          // Convert to WAV format
                          const wavBuffer = new ArrayBuffer(44 + samples * 2);
                          const view = new DataView(wavBuffer);
                          
                          // WAV header
                          const writeString = (offset: number, string: string) => {
                            for (let i = 0; i < string.length; i++) {
                              view.setUint8(offset + i, string.charCodeAt(i));
                            }
                          };
                          
                          writeString(0, 'RIFF');
                          view.setUint32(4, 36 + samples * 2, true);
                          writeString(8, 'WAVE');
                          writeString(12, 'fmt ');
                          view.setUint32(16, 16, true);
                          view.setUint16(20, 1, true);
                          view.setUint16(22, 1, true);
                          view.setUint32(24, sampleRate, true);
                          view.setUint32(28, sampleRate * 2, true);
                          view.setUint16(32, 2, true);
                          view.setUint16(34, 16, true);
                          writeString(36, 'data');
                          view.setUint32(40, samples * 2, true);
                          
                          // Convert float samples to 16-bit PCM
                          let offset = 44;
                          for (let i = 0; i < samples; i++) {
                            const sample = Math.max(-1, Math.min(1, audioData[i]));
                            view.setInt16(offset, sample * 0x7FFF, true);
                            offset += 2;
                          }
                          
                          // Create a File object from the WAV data
                          const blob = new Blob([wavBuffer], { type: 'audio/wav' });
                          const sampleFile = new File([blob], 'sample-melody.wav', { type: 'audio/wav' });
                          
                          // Set the sample file as the uploaded file
                          setUploaded(sampleFile);
                        }}
                        className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Use Sample
                      </button>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          {uploaded ? uploaded.name : 'Upload audio file (WAV, MP3, FLAC)'}
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                          {uploaded ? 'Click to change file' : 'Click to select or drag and drop'}
                        </span>
                      </label>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept="audio/*"
                        onChange={(e) => setUploaded(e.target.files?.[0] || null)}
                        ref={fileInputRef}
                      />
                    </div>
                  </div>
                </div>

                {/* Audio Effects Options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Audio Effects</h3>
                    <button
                      onClick={clearAllEffects}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors flex items-center gap-1"
                    >
                      <RotateCcw size={14} />
                      Clear All Effects
                    </button>
                  </div>

                  {/* Quick Combinations */}
                  <div className="space-y-3">
                    <h4 className="text-md font-medium text-gray-800">Quick Combinations</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          setNormalize(true);
                          setReverse(false);
                          setSpeed(1.0);
                          setPitch(1.0);
                          setReverb(0);
                          setEcho(0);
                          setVolume(1.0);
                          setFadeIn(0);
                          setFadeOut(0);
                          setEqLow(0);
                          setEqMid(0);
                          setEqHigh(0);
                          setCompressionThreshold(-20);
                          setCompressionRatio(4);
                          setCompressionAttack(10);
                          setCompressionRelease(100);
                        }}
                        className="text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors text-sm"
                      >
                        <div className="font-medium text-gray-900">Clean Audio</div>
                        <div className="text-xs text-gray-600">Normalize only</div>
                      </button>

                      <button
                        onClick={() => {
                          setNormalize(true);
                          setReverse(false);
                          setSpeed(1.2);
                          setPitch(1.0);
                          setReverb(0);
                          setEcho(0);
                          setVolume(1.0);
                          setFadeIn(0);
                          setFadeOut(0);
                        }}
                        className="text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors text-sm"
                      >
                        <div className="font-medium text-gray-900">Speed Up</div>
                        <div className="text-xs text-gray-600">1.2x speed</div>
                      </button>

                      <button
                        onClick={() => {
                          setNormalize(true);
                          setReverse(false);
                          setSpeed(1.0);
                          setPitch(1.2);
                          setReverb(0);
                          setEcho(0);
                          setVolume(1.0);
                          setFadeIn(0);
                          setFadeOut(0);
                        }}
                        className="text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors text-sm"
                      >
                        <div className="font-medium text-gray-900">Higher Pitch</div>
                        <div className="text-xs text-gray-600">1.2x pitch</div>
                      </button>

                      <button
                        onClick={() => {
                          setNormalize(true);
                          setReverse(false);
                          setSpeed(1.0);
                          setPitch(1.0);
                          setReverb(20);
                          setEcho(0);
                          setVolume(1.0);
                          setFadeIn(0);
                          setFadeOut(0);
                        }}
                        className="text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors text-sm"
                      >
                        <div className="font-medium text-gray-900">Reverb</div>
                        <div className="text-xs text-gray-600">20% reverb</div>
                      </button>

                      <button
                        onClick={() => {
                          setNormalize(true);
                          setReverse(false);
                          setSpeed(1.0);
                          setPitch(1.0);
                          setReverb(0);
                          setEcho(15);
                          setVolume(1.0);
                          setFadeIn(0);
                          setFadeOut(0);
                        }}
                        className="text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors text-sm"
                      >
                        <div className="font-medium text-gray-900">Echo</div>
                        <div className="text-xs text-gray-600">15% echo</div>
                      </button>

                      <button
                        onClick={() => {
                          setNormalize(true);
                          setReverse(false);
                          setSpeed(1.0);
                          setPitch(1.0);
                          setReverb(0);
                          setEcho(0);
                          setVolume(1.0);
                          setFadeIn(1.0);
                          setFadeOut(1.0);
                        }}
                        className="text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors text-sm"
                      >
                        <div className="font-medium text-gray-900">Fade In/Out</div>
                        <div className="text-xs text-gray-600">1s fade each</div>
                      </button>

                      <button
                        onClick={() => {
                          setNormalize(true);
                          setReverse(false);
                          setSpeed(1.0);
                          setPitch(1.0);
                          setReverb(15);
                          setEcho(10);
                          setVolume(1.0);
                          setFadeIn(0.5);
                          setFadeOut(0.5);
                        }}
                        className="text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors text-sm"
                      >
                        <div className="font-medium text-gray-900">Ambient</div>
                        <div className="text-xs text-gray-600">Reverb + echo + fade</div>
                      </button>

                      <button
                        onClick={() => {
                          setNormalize(true);
                          setReverse(false);
                          setSpeed(1.5);
                          setPitch(1.3);
                          setReverb(0);
                          setEcho(0);
                          setVolume(1.0);
                          setFadeIn(0);
                          setFadeOut(0);
                        }}
                        className="text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors text-sm"
                      >
                        <div className="font-medium text-gray-900">Chipmunk</div>
                        <div className="text-xs text-gray-600">Fast + high pitch</div>
                      </button>

                      <button
                        onClick={() => {
                          setNormalize(true);
                          setReverse(false);
                          setSpeed(0.8);
                          setPitch(0.7);
                          setReverb(0);
                          setEcho(0);
                          setVolume(1.0);
                          setFadeIn(0);
                          setFadeOut(0);
                          setEqLow(0);
                          setEqMid(0);
                          setEqHigh(0);
                          setCompressionThreshold(-20);
                          setCompressionRatio(4);
                          setCompressionAttack(10);
                          setCompressionRelease(100);
                        }}
                        className="text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors text-sm"
                      >
                        <div className="font-medium text-gray-900">Slow & Deep</div>
                        <div className="text-xs text-gray-600">Slow + low pitch</div>
                      </button>

                      <button
                        onClick={() => {
                          setNormalize(true);
                          setReverse(false);
                          setSpeed(1.0);
                          setPitch(1.0);
                          setReverb(0);
                          setEcho(0);
                          setVolume(1.0);
                          setFadeIn(0);
                          setFadeOut(0);
                          setEqLow(6);
                          setEqMid(0);
                          setEqHigh(0);
                          setCompressionThreshold(-20);
                          setCompressionRatio(4);
                          setCompressionAttack(10);
                          setCompressionRelease(100);
                        }}
                        className="text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors text-sm"
                      >
                        <div className="font-medium text-gray-900">Bass Boost</div>
                        <div className="text-xs text-gray-600">+6dB low frequencies</div>
                      </button>

                      <button
                        onClick={() => {
                          setNormalize(true);
                          setReverse(false);
                          setSpeed(1.0);
                          setPitch(1.0);
                          setReverb(0);
                          setEcho(0);
                          setVolume(1.0);
                          setFadeIn(0);
                          setFadeOut(0);
                          setEqLow(0);
                          setEqMid(0);
                          setEqHigh(6);
                          setCompressionThreshold(-20);
                          setCompressionRatio(4);
                          setCompressionAttack(10);
                          setCompressionRelease(100);
                        }}
                        className="text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors text-sm"
                      >
                        <div className="font-medium text-gray-900">Bright</div>
                        <div className="text-xs text-gray-600">+6dB high frequencies</div>
                      </button>

                      <button
                        onClick={() => {
                          setNormalize(true);
                          setReverse(false);
                          setSpeed(1.0);
                          setPitch(1.0);
                          setReverb(0);
                          setEcho(0);
                          setVolume(1.0);
                          setFadeIn(0);
                          setFadeOut(0);
                          setEqLow(0);
                          setEqMid(0);
                          setEqHigh(0);
                          setCompressionThreshold(-12);
                          setCompressionRatio(8);
                          setCompressionAttack(5);
                          setCompressionRelease(50);
                        }}
                        className="text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors text-sm"
                      >
                        <div className="font-medium text-gray-900">Heavy Compression</div>
                        <div className="text-xs text-gray-600">8:1 ratio, -12dB threshold</div>
                      </button>

                      <button
                        onClick={() => {
                          setNormalize(true);
                          setReverse(false);
                          setSpeed(1.0);
                          setPitch(1.0);
                          setReverb(0);
                          setEcho(0);
                          setVolume(1.0);
                          setFadeIn(0);
                          setFadeOut(0);
                          setEqLow(3);
                          setEqMid(0);
                          setEqHigh(3);
                          setCompressionThreshold(-16);
                          setCompressionRatio(6);
                          setCompressionAttack(10);
                          setCompressionRelease(100);
                        }}
                        className="text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors text-sm"
                      >
                        <div className="font-medium text-gray-900">Radio Ready</div>
                        <div className="text-xs text-gray-600">EQ + compression</div>
                      </button>
                    </div>
                  </div>
                  
                  {/* Basic Effects */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700" title="Automatically adjust audio levels to make quiet parts louder and loud parts quieter">
                        <Volume2 size={16} />
                        Normalize Audio
                      </label>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={normalize}
                          onChange={(e) => setNormalize(e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-600">Boost quiet parts</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700" title="Play the audio backwards, creating a reversed effect">
                        <RotateCcw size={16} />
                        Reverse Audio
                      </label>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={reverse}
                          onChange={(e) => setReverse(e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-600">Play backwards</span>
                      </div>
                    </div>
                  </div>

                  {/* Slider Effects */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700" title="Change playback speed without affecting pitch">
                        <Zap size={16} />
                        Speed: {speed.toFixed(1)}x
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="3.0"
                        step="0.1"
                        value={speed}
                        onChange={(e) => setSpeed(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0.1x</span>
                        <span>1.0x</span>
                        <span>3.0x</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700" title="Change the pitch (frequency) of the audio - higher values make it sound higher">
                        <Music2 size={16} />
                        Pitch: {pitch.toFixed(1)}x
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={pitch}
                        onChange={(e) => setPitch(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0.5x</span>
                        <span>1.0x</span>
                        <span>2.0x</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700" title="Adjust the overall volume level of the audio">
                        <Volume2 size={16} />
                        Volume: {volume.toFixed(1)}x
                      </label>
                      <input
                        type="range"
                        min="0.0"
                        max="3.0"
                        step="0.1"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0.0x</span>
                        <span>1.0x</span>
                        <span>3.0x</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700" title="Add room-like echo effects to simulate different acoustic spaces">
                        <Zap size={16} />
                        Reverb: {reverb}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={reverb}
                        onChange={(e) => setReverb(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>None</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700" title="Add repeating echo effects with multiple delay taps">
                        <Clock size={16} />
                        Echo: {echo}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={echo}
                        onChange={(e) => setEcho(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>None</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700" title="Gradually increase volume from silence at the beginning of the audio">
                        <Volume2 size={16} />
                        Fade In: {fadeIn}s
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={fadeIn}
                        onChange={(e) => setFadeIn(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="relative">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>0s</span>
                          <span>1s</span>
                          <span>2s</span>
                          <span>3s</span>
                          <span>4s</span>
                          <span>5s</span>
                          <span>6s</span>
                          <span>7s</span>
                          <span>8s</span>
                          <span>9s</span>
                          <span>10s</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          {[...Array(11)].map((_, i) => (
                            <div key={i} className="w-px h-2 bg-gray-300"></div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700" title="Gradually decrease volume to silence at the end of the audio">
                        <VolumeX size={16} />
                        Fade Out: {fadeOut}s
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={fadeOut}
                        onChange={(e) => setFadeOut(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="relative">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>0s</span>
                          <span>1s</span>
                          <span>2s</span>
                          <span>3s</span>
                          <span>4s</span>
                          <span>5s</span>
                          <span>6s</span>
                          <span>7s</span>
                          <span>8s</span>
                          <span>9s</span>
                          <span>10s</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          {[...Array(11)].map((_, i) => (
                            <div key={i} className="w-px h-2 bg-gray-300"></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* EQ Controls */}
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <h4 className="text-md font-semibold text-gray-900" title="Adjust different frequency bands to shape the tonal character of the audio">Equalizer (EQ)</h4>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700" title="Boost or cut low frequencies (below 250Hz) - affects bass and warmth">
                          <Volume2 size={16} />
                          Low (Bass): {eqLow}dB
                        </label>
                        <input
                          type="range"
                          min="-12"
                          max="12"
                          step="1"
                          value={eqLow}
                          onChange={(e) => setEqLow(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>-12dB</span>
                          <span>0dB</span>
                          <span>+12dB</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700" title="Boost or cut mid frequencies (250Hz-4kHz) - affects vocals and instruments">
                          <Music2 size={16} />
                          Mid: {eqMid}dB
                        </label>
                        <input
                          type="range"
                          min="-12"
                          max="12"
                          step="1"
                          value={eqMid}
                          onChange={(e) => setEqMid(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>-12dB</span>
                          <span>0dB</span>
                          <span>+12dB</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700" title="Boost or cut high frequencies (above 4kHz) - affects brightness and clarity">
                          <Zap size={16} />
                          High (Treble): {eqHigh}dB
                        </label>
                        <input
                          type="range"
                          min="-12"
                          max="12"
                          step="1"
                          value={eqHigh}
                          onChange={(e) => setEqHigh(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>-12dB</span>
                          <span>0dB</span>
                          <span>+12dB</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Compression Controls */}
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <h4 className="text-md font-semibold text-gray-900" title="Reduce dynamic range by making loud parts quieter and quiet parts louder">Compression</h4>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700" title="The level at which compression starts to take effect">
                          <Volume2 size={16} />
                          Threshold: {compressionThreshold}dB
                        </label>
                        <input
                          type="range"
                          min="-40"
                          max="0"
                          step="1"
                          value={compressionThreshold}
                          onChange={(e) => setCompressionThreshold(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>-40dB</span>
                          <span>-20dB</span>
                          <span>0dB</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700" title="How much compression is applied - higher ratios mean more aggressive compression">
                          <Zap size={16} />
                          Ratio: {compressionRatio}:1
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          step="1"
                          value={compressionRatio}
                          onChange={(e) => setCompressionRatio(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>1:1</span>
                          <span>4:1</span>
                          <span>20:1</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700" title="How quickly compression kicks in when audio exceeds the threshold">
                          <Clock size={16} />
                          Attack: {compressionAttack}ms
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          step="1"
                          value={compressionAttack}
                          onChange={(e) => setCompressionAttack(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>1ms</span>
                          <span>10ms</span>
                          <span>100ms</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700" title="How quickly compression releases when audio falls below the threshold">
                          <RotateCcw size={16} />
                          Release: {compressionRelease}ms
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="1000"
                          step="10"
                          value={compressionRelease}
                          onChange={(e) => setCompressionRelease(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>10ms</span>
                          <span>100ms</span>
                          <span>1000ms</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Output Settings */}
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <h4 className="text-md font-semibold text-gray-900">Output Settings</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Output Format</label>
                        <select
                          value={outputFormat}
                          onChange={(e) => setOutputFormat(e.target.value as 'wav' | 'mp3' | 'flac')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="wav">WAV (Uncompressed)</option>
                          <option value="mp3">MP3 (Compressed)</option>
                          <option value="flac">FLAC (Lossless)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Sample Rate</label>
                        <select
                          value={sampleRate}
                          onChange={(e) => setSampleRate(parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value={22050}>22.05 kHz</option>
                          <option value={44100}>44.1 kHz (CD Quality)</option>
                          <option value={48000}>48 kHz (Professional)</option>
                          <option value={96000}>96 kHz (High Quality)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleProcess}
                    disabled={isProcessing || !uploaded}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <SlidersHorizontal size={16} />
                        Apply Effects
                      </>
                    )}
                  </button>

                  {processingProgress > 0 && processingProgress < 100 && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${processingProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

                      {/* Right Panel - Output */}
            <div className={`space-y-6 ${
              activeTab === 'music' || activeTab === 'effects' 
                ? 'xl:col-span-2' 
                : ''
            }`}>
              <div className={`card space-y-2 ${
                activeTab === 'tts' || activeTab === 'stt' 
                  ? 'hidden' 
                  : ''
              }`}>
                <h2 className="text-lg font-semibold">Output</h2>
              {activeTab === 'music' && (
                <>
                  {musicUrl ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Generated Music</h3>
                        <a href={musicUrl} download="music.wav" className="text-indigo-600 hover:underline inline-flex items-center gap-1 text-sm">
                          <Download size={14} /> Download WAV
                        </a>
                      </div>
                      
                      <div className="space-y-2 p-4 bg-gray-50 rounded-lg border">
                        <audio 
                          src={musicUrl} 
                          controls 
                          className="w-full [&::-webkit-media-controls-panel]:bg-gray-100 [&::-webkit-media-controls-play-button]:bg-blue-500 [&::-webkit-media-controls-play-button]:rounded-full [&::-webkit-media-controls-timeline]:bg-gray-300 [&::-webkit-media-controls-timeline]:rounded-full [&::-webkit-media-controls-timeline]:h-8 [&::-webkit-media-controls-current-time-display]:text-gray-700 [&::-webkit-media-controls-time-remaining-display]:text-gray-700 [&::-webkit-media-controls-volume-slider]:bg-gray-300 [&::-webkit-media-controls-volume-slider]:rounded-full [&::-webkit-media-controls-volume-slider]:h-2 [&::-webkit-media-controls-mute-button]:bg-gray-400 [&::-webkit-media-controls-mute-button]:rounded-full [&::-webkit-media-controls-timeline]:!bg-orange-200 [&::-webkit-media-controls-timeline]:!h-8 [&::-webkit-media-controls-timeline]:!border-2 [&::-webkit-media-controls-timeline]:!border-orange-500"
                          style={{
                            '--webkit-media-controls-panel-background-color': '#f3f4f6',
                            '--webkit-media-controls-play-button-background-color': '#3b82f6',
                            '--webkit-media-controls-timeline-background-color': '#fed7aa',
                            '--webkit-media-controls-timeline-progress-color': '#ea580c',
                            '--webkit-media-controls-timeline-border-radius': '9999px',
                            '--webkit-media-controls-timeline-height': '32px',
                            '--webkit-media-controls-volume-slider-background-color': '#d1d5db',
                            '--webkit-media-controls-volume-slider-progress-color': '#3b82f6',
                            '--webkit-media-controls-volume-slider-border-radius': '9999px',
                            '--webkit-media-controls-volume-slider-height': '8px'
                          } as React.CSSProperties}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">No audio yet. Enter a descriptive prompt and click Generate Music to create your composition.</div>
                  )}
                </>
              )}

              {activeTab === 'effects' && (
                <>
                  {processedUrl ? (
                    <div className="space-y-6">
                      {/* Audio Comparison */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Audio Comparison</h3>
                        
                        {/* Original Audio */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Play size={16} />
                            Original Audio
                          </h4>
                          <div className="relative">
                            <audio 
                              src={uploaded ? URL.createObjectURL(uploaded) : ''} 
                              controls 
                              className="w-full [&::-webkit-media-controls-panel]:bg-gray-100 [&::-webkit-media-controls-play-button]:bg-blue-500 [&::-webkit-media-controls-play-button]:rounded-full [&::-webkit-media-controls-timeline]:bg-gray-300 [&::-webkit-media-controls-timeline]:rounded-full [&::-webkit-media-controls-timeline]:h-6 [&::-webkit-media-controls-current-time-display]:text-gray-700 [&::-webkit-media-controls-time-remaining-display]:text-gray-700 [&::-webkit-media-controls-volume-slider]:bg-gray-300 [&::-webkit-media-controls-volume-slider]:rounded-full [&::-webkit-media-controls-volume-slider]:h-2 [&::-webkit-media-controls-mute-button]:bg-gray-400 [&::-webkit-media-controls-mute-button]:rounded-full"
                              style={{
                                '--webkit-media-controls-panel-background-color': '#f3f4f6',
                                '--webkit-media-controls-play-button-background-color': '#3b82f6',
                                '--webkit-media-controls-timeline-background-color': '#e5e7eb',
                                '--webkit-media-controls-timeline-progress-color': '#3b82f6',
                                '--webkit-media-controls-timeline-border-radius': '9999px',
                                '--webkit-media-controls-timeline-height': '24px',
                                '--webkit-media-controls-volume-slider-background-color': '#d1d5db',
                                '--webkit-media-controls-volume-slider-progress-color': '#3b82f6',
                                '--webkit-media-controls-volume-slider-border-radius': '9999px',
                                '--webkit-media-controls-volume-slider-height': '8px'
                              } as React.CSSProperties}
                            />
                          </div>
                        </div>

                        {/* Processed Audio */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <SlidersHorizontal size={16} />
                            Processed Audio
                          </h4>
                          <div className="relative">
                            <audio 
                              src={processedUrl} 
                              controls 
                              ref={audioRef}
                              onLoadedMetadata={(e) => {
                                const audio = e.target as HTMLAudioElement;
                                console.log('Processed audio loaded:', {
                                  duration: audio.duration,
                                  currentSrc: audio.currentSrc,
                                  playbackRate: audio.playbackRate
                                });
                              }}
                              onCanPlay={(e) => {
                                const audio = e.target as HTMLAudioElement;
                                console.log('Processed audio can play:', {
                                  duration: audio.duration,
                                  readyState: audio.readyState,
                                  networkState: audio.networkState
                                });
                              }}
                              onError={(e) => {
                                const audio = e.target as HTMLAudioElement;
                                console.error('Processed audio error:', {
                                  error: audio.error,
                                  networkState: audio.networkState
                                });
                              }}
                              onPlay={handleAudioPlay}
                              className="w-full [&::-webkit-media-controls-panel]:bg-gray-100 [&::-webkit-media-controls-play-button]:bg-green-500 [&::-webkit-media-controls-play-button]:rounded-full [&::-webkit-media-controls-timeline]:bg-gray-300 [&::-webkit-media-controls-timeline]:rounded-full [&::-webkit-media-controls-timeline]:h-6 [&::-webkit-media-controls-current-time-display]:text-gray-700 [&::-webkit-media-controls-time-remaining-display]:text-gray-700 [&::-webkit-media-controls-volume-slider]:bg-gray-300 [&::-webkit-media-controls-volume-slider]:rounded-full [&::-webkit-media-controls-volume-slider]:h-2 [&::-webkit-media-controls-mute-button]:bg-gray-400 [&::-webkit-media-controls-mute-button]:rounded-full [&::-webkit-media-controls-timeline]:!bg-orange-200 [&::-webkit-media-controls-timeline]:!h-6 [&::-webkit-media-controls-timeline]:!border-2 [&::-webkit-media-controls-timeline]:!border-orange-500"
                              style={{
                                '--webkit-media-controls-panel-background-color': '#f3f4f6',
                                '--webkit-media-controls-play-button-background-color': '#10b981',
                                '--webkit-media-controls-timeline-background-color': '#fed7aa',
                                '--webkit-media-controls-timeline-progress-color': '#ea580c',
                                '--webkit-media-controls-timeline-border-radius': '9999px',
                                '--webkit-media-controls-timeline-height': '24px',
                                '--webkit-media-controls-volume-slider-background-color': '#d1d5db',
                                '--webkit-media-controls-volume-slider-progress-color': '#10b981',
                                '--webkit-media-controls-volume-slider-border-radius': '9999px',
                                '--webkit-media-controls-volume-slider-height': '8px'
                              } as React.CSSProperties}
                            />
                          </div>
                        </div>

                        {/* Applied Filters */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Filter size={16} />
                            Applied Filters
                          </h4>
                          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                            {normalize && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Normalize</span>
                                <span className="text-green-600 font-medium">Applied</span>
                              </div>
                            )}
                            {reverse && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Reverse</span>
                                <span className="text-green-600 font-medium">Applied</span>
                              </div>
                            )}
                            {speed !== 1.0 && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Speed</span>
                                <span className="text-blue-600 font-medium">{speed}x</span>
                              </div>
                            )}
                            {pitch !== 1.0 && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Pitch</span>
                                <span className="text-blue-600 font-medium">{pitch}x</span>
                              </div>
                            )}
                            {volume !== 1.0 && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Volume</span>
                                <span className="text-blue-600 font-medium">{volume}x</span>
                              </div>
                            )}
                            {reverb > 0 && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Reverb</span>
                                <span className="text-blue-600 font-medium">{reverb}%</span>
                              </div>
                            )}
                            {echo > 0 && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Echo</span>
                                <span className="text-blue-600 font-medium">{echo}%</span>
                              </div>
                            )}
                            {fadeIn > 0 && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Fade In</span>
                                <span className="text-blue-600 font-medium">{fadeIn}s</span>
                              </div>
                            )}
                            {fadeOut > 0 && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Fade Out</span>
                                <span className="text-blue-600 font-medium">{fadeOut}s</span>
                              </div>
                            )}
                            {eqLow !== 0 && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">EQ Low</span>
                                <span className="text-blue-600 font-medium">{eqLow}dB</span>
                              </div>
                            )}
                            {eqMid !== 0 && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">EQ Mid</span>
                                <span className="text-blue-600 font-medium">{eqMid}dB</span>
                              </div>
                            )}
                            {eqHigh !== 0 && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">EQ High</span>
                                <span className="text-blue-600 font-medium">{eqHigh}dB</span>
                              </div>
                            )}
                            {compressionThreshold !== -20 && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Compression Threshold</span>
                                <span className="text-blue-600 font-medium">{compressionThreshold}dB</span>
                              </div>
                            )}
                            {compressionRatio !== 4 && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Compression Ratio</span>
                                <span className="text-blue-600 font-medium">{compressionRatio}:1</span>
                              </div>
                            )}
                            {compressionAttack !== 10 && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Compression Attack</span>
                                <span className="text-blue-600 font-medium">{compressionAttack}ms</span>
                              </div>
                            )}
                            {compressionRelease !== 100 && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Compression Release</span>
                                <span className="text-blue-600 font-medium">{compressionRelease}ms</span>
                              </div>
                            )}
                            {outputFormat !== 'wav' && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Output Format</span>
                                <span className="text-blue-600 font-medium">{outputFormat.toUpperCase()}</span>
                              </div>
                            )}
                            {sampleRate !== 44100 && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Sample Rate</span>
                                <span className="text-blue-600 font-medium">{sampleRate}Hz</span>
                              </div>
                            )}
                            {!normalize && !reverse && speed === 1.0 && pitch === 1.0 && volume === 1.0 && reverb === 0 && echo === 0 && fadeIn === 0 && fadeOut === 0 && eqLow === 0 && eqMid === 0 && eqHigh === 0 && compressionThreshold === -20 && compressionRatio === 4 && compressionAttack === 10 && compressionRelease === 100 && outputFormat === 'wav' && sampleRate === 44100 && (
                              <div className="text-sm text-gray-500 italic">No effects applied</div>
                            )}
                          </div>
                        </div>

                        {/* Download Options */}
                        <div className="flex gap-4 pt-2">
                          <a href={uploaded ? URL.createObjectURL(uploaded) : ''} download="original.wav" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                            <Download size={14} /> Download Original
                          </a>
                          <a href={processedUrl} download="processed.wav" className="text-indigo-600 hover:underline inline-flex items-center gap-1">
                            <Download size={14} /> Download Processed
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">No processed audio yet. Upload a file, choose options, and click Apply Effects.</div>
                  )}
                </>
              )}


            </div>

            <div className={`card ${
              activeTab === 'tts' || activeTab === 'stt' 
                ? 'hidden' 
                : ''
            }`}>
              <h3 className="text-md font-semibold mb-2">Notes</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Music generation is a lightweight demo (procedural synth). Swap with server models later.</li>
                <li>• Processing supports normalize, reverse, and speed change. Upload WAV/PCM for best results.</li>
                <li>• Speech-to-Text supports Google Speech Recognition and OpenAI Whisper models.</li>
                <li>• Text-to-Speech uses Microsoft Edge TTS (high quality), Google TTS, and system voices.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Speech Content - Full Width */}
        {activeTab === 'tts' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Panel - Inputs */}
            <div className="xl:col-span-1 space-y-6">
              <div className="card">
                <div className="flex items-center gap-2 mb-3">
                  <Volume1 className="text-indigo-600" size={18} />
                  <h2 className="text-lg font-semibold">Text-to-Speech</h2>
                </div>

                {/* TTS Text Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Text to Convert</label>
                  <textarea
                    value={ttsText}
                    onChange={(e) => setTtsText(e.target.value)}
                    placeholder="Enter text to convert to speech..."
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* SSML Sample Prompts */}
                <div className="mb-4">
                  <details className="group">
                    <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-700 hover:text-indigo-600">
                      <span>SSML Sample Prompts</span>
                      <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="mt-3 space-y-2">
                      <div className="text-xs text-gray-500 mb-2">
                        Click any prompt to test SSML features. Remember to enable "SSML Processing" above.
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <button
                          onClick={() => {
                            setTtsText('<speak>Hello! This is a <prosody rate="slow">slow</prosody> and <prosody rate="fast">fast</prosody> demonstration of SSML.</speak>');
                            setTtsUseSsml(true);
                          }}
                          className="text-left p-2 text-xs bg-gray-50 hover:bg-indigo-50 rounded border hover:border-indigo-200 transition-colors"
                        >
                          <div className="font-medium text-gray-800">Speed Variation</div>
                          <div className="text-gray-600">Demonstrates slow and fast speech rates</div>
                        </button>
                        
                        <button
                          onClick={() => {
                            setTtsText('<speak>This is <prosody pitch="high">high pitched</prosody> and <prosody pitch="low">low pitched</prosody> speech.</speak>');
                            setTtsUseSsml(true);
                          }}
                          className="text-left p-2 text-xs bg-gray-50 hover:bg-indigo-50 rounded border hover:border-indigo-200 transition-colors"
                        >
                          <div className="font-medium text-gray-800">Pitch Control</div>
                          <div className="text-gray-600">Shows high and low pitch variations</div>
                        </button>
                        
                        <button
                          onClick={() => {
                            setTtsText('<speak>Welcome to <break time="1s"/> our <prosody volume="loud">loud</prosody> and <prosody volume="soft">soft</prosody> demonstration.</speak>');
                            setTtsUseSsml(true);
                          }}
                          className="text-left p-2 text-xs bg-gray-50 hover:bg-indigo-50 rounded border hover:border-indigo-200 transition-colors"
                        >
                          <div className="font-medium text-gray-800">Volume & Pauses</div>
                          <div className="text-gray-600">Combines volume control with pauses</div>
                        </button>
                        
                        <button
                          onClick={() => {
                            setTtsText('<speak>This is a <prosody rate="slow" pitch="low">deep, slow voice</prosody> followed by <prosody rate="fast" pitch="high">a quick, high voice</prosody>.</speak>');
                            setTtsUseSsml(true);
                          }}
                          className="text-left p-2 text-xs bg-gray-50 hover:bg-indigo-50 rounded border hover:border-indigo-200 transition-colors"
                        >
                          <div className="font-medium text-gray-800">Combined Effects</div>
                          <div className="text-gray-600">Multiple prosody attributes together</div>
                        </button>
                        
                        <button
                          onClick={() => {
                            setTtsText('<speak>Counting: <prosody rate="slow">one</prosody> <break time="0.5s"/> <prosody rate="medium">two</prosody> <break time="0.5s"/> <prosody rate="fast">three</prosody>!</speak>');
                            setTtsUseSsml(true);
                          }}
                          className="text-left p-2 text-xs bg-gray-50 hover:bg-indigo-50 rounded border hover:border-indigo-200 transition-colors"
                        >
                          <div className="font-medium text-gray-800">Counting with Effects</div>
                          <div className="text-gray-600">Progressive speed changes with pauses</div>
                        </button>
                        
                        <button
                          onClick={() => {
                            setTtsText('<speak>This is a <prosody pitch="+20%" rate="0.8">calm, measured</prosody> voice for meditation, followed by <prosody pitch="+50%" rate="1.5">excited, energetic</prosody> speech!</speak>');
                            setTtsUseSsml(true);
                          }}
                          className="text-left p-2 text-xs bg-gray-50 hover:bg-indigo-50 rounded border hover:border-indigo-200 transition-colors"
                        >
                          <div className="font-medium text-gray-800">Mood Contrast</div>
                          <div className="text-gray-600">Calm vs excited speech patterns</div>
                        </button>
                      </div>
                    </div>
                  </details>
                </div>

                {/* Quick Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">Quick Settings</h3>
                  
                  {/* Model & Voice */}
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                      <select
                        value={ttsModel}
                        onChange={(e) => setTtsModel(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="edge">Microsoft Edge TTS</option>
                        <option value="gtts">Google TTS</option>
                        <option value="pyttsx3">System TTS</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Voice</label>
                      <select
                        value={ttsVoice}
                        onChange={(e) => setTtsVoice(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {filteredVoices
                          .filter(voice => voice.model === ttsModel)
                          .map(voice => (
                            <option key={voice.name} value={voice.name}>
                              {voice.name} ({voice.language})
                            </option>
                          ))}
                      </select>
                      {ttsVoice && (
                        <div className="text-xs text-gray-500 mt-1">
                          Selected: {ttsVoice}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Language & Voice Settings */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Output Language</label>
                      <select
                        value={ttsLanguage}
                        onChange={(e) => setTtsLanguage(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      >
                        <option value="">Auto-detect from text</option>
                        <option value="en-US">English (US)</option>
                        <option value="en-GB">English (UK)</option>
                        <option value="es-ES">Spanish</option>
                        <option value="fr-FR">French</option>
                        <option value="de-DE">German</option>
                        <option value="it-IT">Italian</option>
                        <option value="pt-BR">Portuguese (Brazil)</option>
                        <option value="ru-RU">Russian</option>
                        <option value="ja-JP">Japanese</option>
                        <option value="ko-KR">Korean</option>
                        <option value="zh-CN">Chinese (Simplified)</option>
                        <option value="ar-SA">Arabic</option>
                        <option value="hi-IN">Hindi</option>
                        <option value="nl-NL">Dutch</option>
                        <option value="sv-SE">Swedish</option>
                        <option value="no-NO">Norwegian</option>
                        <option value="da-DK">Danish</option>
                        <option value="fi-FI">Finnish</option>
                        <option value="pl-PL">Polish</option>
                        <option value="tr-TR">Turkish</option>
                        <option value="he-IL">Hebrew</option>
                        <option value="th-TH">Thai</option>
                        <option value="vi-VN">Vietnamese</option>
                        <option value="id-ID">Indonesian</option>
                        <option value="ms-MY">Malay</option>
                        <option value="fa-IR">Persian</option>
                        <option value="ur-PK">Urdu</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select
                        value={ttsGender}
                        onChange={(e) => setTtsGender(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      >
                        <option value="">Any Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Neutral">Neutral</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Speaking Style</label>
                    <select
                      value={ttsStyle}
                      onChange={(e) => setTtsStyle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      <option value="">Any Style</option>
                      <option value="formal">Formal (Professional)</option>
                      <option value="casual">Casual (Conversational)</option>
                      <option value="cheerful">Cheerful (Happy)</option>
                      <option value="sad">Sad (Melancholic)</option>
                      <option value="angry">Angry (Frustrated)</option>
                      <option value="friendly">Friendly (Warm)</option>
                      <option value="terrified">Terrified (Scared)</option>
                      <option value="shouting">Shouting (Loud)</option>
                      <option value="unfriendly">Unfriendly (Cold)</option>
                      <option value="whispering">Whispering (Soft)</option>
                      <option value="hopeful">Hopeful (Optimistic)</option>
                    </select>
                  </div>

                  {/* Playback Settings */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700">Playback Settings</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Speed</label>
                        <input
                          type="range"
                          min="0.5"
                          max="2.0"
                          step="0.1"
                          value={ttsSpeed}
                          onChange={(e) => setTtsSpeed(parseFloat(e.target.value))}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 mt-1">{ttsSpeed}x</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pitch</label>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          step="5"
                          value={ttsPitch}
                          onChange={(e) => setTtsPitch(parseInt(e.target.value))}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 mt-1">{ttsPitch > 0 ? `+${ttsPitch}%` : `${ttsPitch}%`}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Volume</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={ttsVolume}
                          onChange={(e) => setTtsVolume(parseInt(e.target.value))}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 mt-1">{ttsVolume}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Output Format */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Output Format</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Audio Format</label>
                      <select
                        value={ttsOutputFormat}
                        onChange={(e) => setTtsOutputFormat(e.target.value as 'mp3' | 'wav' | 'ogg' | 'm4a')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      >
                        <option value="mp3">MP3 (Most Compatible)</option>
                        <option value="wav">WAV (High Quality)</option>
                        <option value="ogg">OGG (Smaller Size)</option>
                        <option value="m4a">M4A (Apple Compatible)</option>
                      </select>
                    </div>
                  </div>

                  {/* Advanced Options */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Advanced Options</h4>
                    
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="translate-text"
                          checked={ttsTranslateText}
                          onChange={(e) => setTtsTranslateText(e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="translate-text" className="ml-2 text-sm text-gray-700">
                          Translate Text
                        </label>
                      </div>
                      <div className="text-xs text-gray-500 ml-6">
                        Translate input text to the selected output language before speech generation
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="use-ssml"
                          checked={ttsUseSsml}
                          onChange={(e) => setTtsUseSsml(e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="use-ssml" className="ml-2 text-sm text-gray-700">
                          Enable SSML Processing
                        </label>
                      </div>
                      <div className="text-xs text-gray-500 ml-6">
                        Use Speech Synthesis Markup Language for enhanced voice control
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="normalize-text"
                          checked={ttsNormalizeText}
                          onChange={(e) => setTtsNormalizeText(e.target.checked)}
                          disabled={ttsText.trim().startsWith('<speak')}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                        />
                        <label htmlFor="normalize-text" className={`ml-2 text-sm ${ttsText.trim().startsWith('<speak') ? 'text-gray-400' : 'text-gray-700'}`}>
                          Text Normalization
                          {ttsText.trim().startsWith('<speak') && (
                            <span className="ml-1 text-xs text-orange-600">(disabled for SSML)</span>
                          )}
                        </label>
                      </div>
                      <div className="text-xs text-gray-500 ml-6">
                        Convert numbers, abbreviations, and symbols to words for better pronunciation
                        {ttsText.trim().startsWith('<speak') && (
                          <div className="text-orange-600 mt-1">
                            ⚠️ Text normalization is disabled when using SSML to preserve markup
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleTextToSpeech}
                    disabled={isTtsGenerating || !ttsText.trim()}
                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isTtsGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Volume1 size={16} />
                        Generate Speech
                      </>
                    )}
                  </button>

                  {/* TTS Progress */}
                  {isTtsGenerating && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>Generating speech...</span>
                        <span>{ttsProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${ttsProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Output */}
            <div className="xl:col-span-2 space-y-6">
              <div className="card space-y-2">
                <h2 className="text-lg font-semibold">Output</h2>
                {ttsAudioUrl ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Generated Speech</h3>
                      <a href={ttsAudioUrl} download={`speech.${ttsOutputFormat}`} className="text-indigo-600 hover:underline inline-flex items-center gap-1 text-sm">
                        <Download size={14} /> Download {ttsOutputFormat.toUpperCase()}
                      </a>
                    </div>
                    
                    <div className="space-y-2 p-4 bg-gray-50 rounded-lg border">
                      <audio
                        src={ttsAudioUrl}
                        controls
                        className="w-full [&::-webkit-media-controls-panel]:bg-gray-100 [&::-webkit-media-controls-play-button]:bg-blue-500 [&::-webkit-media-controls-play-button]:rounded-full [&::-webkit-media-controls-timeline]:bg-gray-300 [&::-webkit-media-controls-timeline]:rounded-full [&::-webkit-media-controls-timeline]:h-8 [&::-webkit-media-controls-current-time-display]:text-gray-700 [&::-webkit-media-controls-time-remaining-display]:text-gray-700 [&::-webkit-media-controls-volume-slider]:bg-gray-300 [&::-webkit-media-controls-volume-slider]:rounded-full [&::-webkit-media-controls-volume-slider]:h-2 [&::-webkit-media-controls-mute-button]:bg-gray-400 [&::-webkit-media-controls-mute-button]:rounded-full [&::-webkit-media-controls-timeline]:!bg-orange-200 [&::-webkit-media-controls-timeline]:!h-8 [&::-webkit-media-controls-timeline]:!border-2 [&::-webkit-media-controls-timeline]:!border-orange-500"
                        style={{
                          '--webkit-media-controls-panel-background-color': '#f3f4f6',
                          '--webkit-media-controls-play-button-background-color': '#3b82f6',
                          '--webkit-media-controls-timeline-background-color': '#fed7aa',
                          '--webkit-media-controls-timeline-progress-color': '#ea580c',
                          '--webkit-media-controls-timeline-border-radius': '9999px',
                          '--webkit-media-controls-timeline-height': '32px',
                          '--webkit-media-controls-volume-slider-background-color': '#d1d5db',
                          '--webkit-media-controls-volume-slider-progress-color': '#3b82f6',
                          '--webkit-media-controls-volume-slider-border-radius': '9999px',
                          '--webkit-media-controls-volume-slider-height': '8px'
                        } as React.CSSProperties}
                      />
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Text Length:</span> {ttsText.length} characters
                    </div>

                    {/* Applied Settings Display */}
                    {ttsAppliedSettings && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="text-sm font-semibold text-blue-800 mb-2">Applied Settings</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="font-medium">Voice:</span> {ttsAppliedSettings.voice}</div>
                          <div><span className="font-medium">Model:</span> {ttsAppliedSettings.model}</div>
                          <div><span className="font-medium">Speed:</span> {ttsAppliedSettings.speed}x</div>
                          <div><span className="font-medium">Pitch:</span> {ttsAppliedSettings.pitch > 0 ? `+${ttsAppliedSettings.pitch}%` : `${ttsAppliedSettings.pitch}%`}</div>
                          <div><span className="font-medium">Volume:</span> {ttsAppliedSettings.volume}%</div>
                          <div><span className="font-medium">Language:</span> {ttsAppliedSettings.language || 'Auto-detected'}</div>
                          {ttsAppliedSettings.gender && <div><span className="font-medium">Gender:</span> {ttsAppliedSettings.gender}</div>}
                          {ttsAppliedSettings.style && <div><span className="font-medium">Style:</span> {ttsAppliedSettings.style}</div>}
                          <div><span className="font-medium">Translation:</span> {ttsAppliedSettings.translation_applied ? 'Yes' : 'No'}</div>
                          <div><span className="font-medium">SSML:</span> {ttsAppliedSettings.ssml_used ? 'Yes' : 'No'}</div>
                          <div><span className="font-medium">Normalized:</span> {ttsAppliedSettings.text_normalized ? 'Yes' : 'No'}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">No speech generated yet. Enter text, choose settings, and click Generate Speech to create audio.</div>
                )}
              </div>

              {/* TTS Notes */}
              <div className="card">
                <h3 className="text-md font-semibold mb-2">Quick Guide</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Output Language</strong>: Choose the language for speech generation</li>
                  <li>• <strong>Translate Text</strong>: When enabled, translates your text before speaking</li>
                  <li>• <strong>Voice Quality</strong>: Filter by gender, age, style, and emotion</li>
                  <li>• <strong>Models</strong>: Edge TTS (best), Google TTS (good), System TTS (basic)</li>
                  <li>• <strong>Customization</strong>: Adjust speed, pitch, and volume as needed</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stt' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Panel - Inputs */}
            <div className="xl:col-span-1 space-y-6">
              <div className="card">
                <div className="flex items-center gap-2 mb-3">
                  <Mic className="text-indigo-600" size={18} />
                  <h2 className="text-lg font-semibold">Speech-to-Text</h2>
                </div>
                
                {/* Quick Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">Quick Settings</h3>
                  
                  {/* STT Controls */}
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                      <select
                        value={sttLanguage}
                        onChange={(e) => setSttLanguage(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="en-US">English (US)</option>
                        <option value="en-GB">English (UK)</option>
                        <option value="es-ES">Spanish</option>
                        <option value="fr-FR">French</option>
                        <option value="de-DE">German</option>
                        <option value="it-IT">Italian</option>
                        <option value="pt-BR">Portuguese (Brazil)</option>
                        <option value="ja-JP">Japanese</option>
                        <option value="ko-KR">Korean</option>
                        <option value="zh-CN">Chinese (Simplified)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                      <select
                        value={sttModel}
                        onChange={(e) => setSttModel(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="google">Google Speech Recognition</option>
                        <option value="whisper">OpenAI Whisper</option>
                      </select>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Audio File</label>
                    
                    {/* Sample Audio Option */}
                    <div className="mb-3 space-y-2">
                      <button
                        onClick={() => handleUseSampleAudio()}
                        className="w-full bg-indigo-50 text-indigo-700 px-4 py-2 rounded-md hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 border border-indigo-200"
                      >
                        <Play size={16} />
                        Use Sample Speech
                      </button>
                      <div className="text-xs text-gray-500 text-center">
                        Loads a real speech sample file for testing STT functionality.
                      </div>
                      
                      <div className="text-xs text-gray-500 text-center">
                        💡 <strong>Tip:</strong> For best results, upload a file with clear spoken words or record your voice using your device's recording app.
                      </div>
                      
                      <div className="text-xs text-blue-600 text-center bg-blue-50 p-2 rounded border border-blue-200">
                        <strong>💡 For Real STT Testing:</strong> The sample speech file contains real speech that should be recognized. You can also upload your own audio files.
                      </div>
                    </div>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSttUploadedFile(file);
                          }
                        }}
                        className="hidden"
                        id="stt-file-input"
                      />
                      <label htmlFor="stt-file-input" className="cursor-pointer">
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          WAV, MP3, M4A up to 10MB
                        </p>
                      </label>
                    </div>
                  </div>

                  {/* File Status and Controls */}
                  {sttUploadedFile && (
                    <div className="mt-4 space-y-3">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="text-green-600" size={16} />
                          <div className="text-sm">
                            <div className="font-medium text-green-800">{sttUploadedFile.name}</div>
                            <div className="text-green-600">{(sttUploadedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Audio Player */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-700">Preview Audio:</div>
                          <button
                            onClick={() => {
                              const audio = document.getElementById('stt-audio-player') as HTMLAudioElement;
                              if (audio) {
                                if (audio.paused) {
                                  audio.play();
                                } else {
                                  audio.pause();
                                }
                              }
                            }}
                            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                          >
                            <Play size={14} />
                            Play Audio
                          </button>
                        </div>
                        <audio
                          id="stt-audio-player"
                          controls
                          className="w-full [&::-webkit-media-controls-panel]:bg-gray-100 [&::-webkit-media-controls-play-button]:bg-blue-500 [&::-webkit-media-controls-play-button]:rounded-full [&::-webkit-media-controls-timeline]:bg-gray-300 [&::-webkit-media-controls-timeline]:rounded-full [&::-webkit-media-controls-timeline]:h-6 [&::-webkit-media-controls-current-time-display]:text-gray-700 [&::-webkit-media-controls-time-remaining-display]:text-gray-700 [&::-webkit-media-controls-volume-slider]:bg-gray-300 [&::-webkit-media-controls-volume-slider]:rounded-full [&::-webkit-media-controls-volume-slider]:h-2 [&::-webkit-media-controls-mute-button]:bg-gray-400 [&::-webkit-media-controls-mute-button]:rounded-full"
                          style={{
                            '--webkit-media-controls-panel-background-color': '#f3f4f6',
                            '--webkit-media-controls-play-button-background-color': '#3b82f6',
                            '--webkit-media-controls-timeline-background-color': '#d1d5db',
                            '--webkit-media-controls-timeline-progress-color': '#3b82f6',
                            '--webkit-media-controls-timeline-border-radius': '9999px',
                            '--webkit-media-controls-timeline-height': '24px',
                            '--webkit-media-controls-volume-slider-background-color': '#d1d5db',
                            '--webkit-media-controls-volume-slider-progress-color': '#3b82f6',
                            '--webkit-media-controls-volume-slider-border-radius': '9999px',
                            '--webkit-media-controls-volume-slider-height': '8px'
                          } as React.CSSProperties}
                        >
                          <source src={URL.createObjectURL(sttUploadedFile)} type={sttUploadedFile.type} />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                      
                      <button
                        onClick={() => handleSpeechToText(sttUploadedFile)}
                        disabled={isSttProcessing}
                        className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSttProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <Mic size={16} />
                            Generate Text
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Progress Bar */}
                  {isSttProcessing && (
                    <div>
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>Processing speech...</span>
                        <span>{sttProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${sttProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Output */}
            <div className="xl:col-span-2 space-y-6">
              <div className="card space-y-2">
                <h2 className="text-lg font-semibold">Output</h2>
                {sttResult ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Transcription Result</h3>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-600">
                          Confidence: {Math.round(sttResult.confidence * 100)}%
                        </div>
                        {sttUploadedFile && (
                          <button
                            onClick={() => {
                              const audio = document.getElementById('stt-audio-player') as HTMLAudioElement;
                              if (audio) {
                                if (audio.paused) {
                                  audio.play();
                                } else {
                                  audio.pause();
                                }
                              }
                            }}
                            className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                          >
                            <Play size={14} />
                            Replay Audio
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 p-4 bg-gray-50 rounded-lg border">
                      <p className="text-gray-800 text-lg leading-relaxed">{sttResult.text}</p>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Model:</span> {sttResult.model} | <span className="font-medium">Language:</span> {sttResult.language}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    {sttUploadedFile 
                      ? sttUploadedFile.name.includes('speech-sample') 
                        ? "Sample speech loaded! Click 'Generate Text' to transcribe the real speech audio." 
                        : sttUploadedFile.name.includes('sample')
                        ? "Test tone loaded. Click 'Generate Text' to test the interface (will likely show 'Speech could not be understood')." 
                        : "Click 'Generate Text' to convert your audio file to text."
                      : "Upload an audio file or use the sample speech to test STT functionality."
                    }
                  </div>
                )}
              </div>

              {/* STT Notes */}
              <div className="card">
                <h3 className="text-md font-semibold mb-2">Notes</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Speech-to-Text supports Google Speech Recognition and OpenAI Whisper models.</li>
                  <li>• Google Speech Recognition works best with clear audio and supports multiple languages.</li>
                  <li>• OpenAI Whisper provides high accuracy and works well with various audio qualities.</li>
                  <li>• Supported audio formats: WAV, MP3, M4A up to 10MB file size.</li>
                  <li>• Choose the appropriate language for better transcription accuracy.</li>
                  <li>• <strong>For testing:</strong> Record your voice or use a file with clear spoken words.</li>
                  <li>• The sample audio is for interface testing only and may not contain recognizable speech.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
