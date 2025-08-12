import React, { useRef, useState } from 'react';
import { Music2, SlidersHorizontal, Upload, Download, Play, Zap, Volume2, VolumeX, RotateCcw, Clock, Filter } from 'lucide-react';
import { apiService } from '../services/api';
import { LanguageSelector } from '../components/LanguageSelector';

export const AudioPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'music' | 'effects'>('music');

  // Music generation state
  const [prompt, setPrompt] = useState('uplifting cinematic theme with major scale');
  const [duration, setDuration] = useState(8);
  const [tempo, setTempo] = useState(100);
  const [musicUrl, setMusicUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [musicLanguage, setMusicLanguage] = useState('en');
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
  const [outputFormat, setOutputFormat] = useState<'wav' | 'mp3' | 'flac'>('wav');
  const [sampleRate, setSampleRate] = useState(44100);
  const [appliedEffects, setAppliedEffects] = useState<{pitch: number, speed: number}>({pitch: 1.0, speed: 1.0});

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
    setOutputFormat('wav');
    setSampleRate(44100);
    setAppliedEffects({pitch: 1.0, speed: 1.0});
  };

  const audioRef = useRef<HTMLAudioElement>(null);

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
    'Epic orchestral trailer with soaring strings and thunderous drums',
    'Warm lo-fi chillhop with dusty drums and jazzy Rhodes',
    'Energetic synthwave chase with retro arps and driving bass',
    'Acoustic folk with fingerpicked guitar and light percussion',
    '8-bit chiptune adventure theme with catchy melody',
    'Latin salsa groove with lively horns and congas',
    'Dark trap beat with sub 808s and sparse piano',
    'Ambient space pads with distant choirs and slow swells',
    'Funk bass riff driving a tight, syncopated groove',
    'Minimal piano ostinato with evolving harmonies'
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
    try {
      setIsGenerating(true);
      setMusicUrl('');
      startProgress(setMusicProgress, musicProgressTimer);
      const fullPrompt = musicLanguage ? `[lang:${musicLanguage}] ${prompt}` : prompt;
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
          </nav>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Panel - Inputs */}
          <div className="xl:col-span-1 space-y-6">
            {activeTab === 'music' && (
              <>
                {/* Prompt */}
                <div className="card space-y-3">
                  <div className="flex items-center gap-2">
                    <Music2 className="text-indigo-600" size={18} />
                    <h2 className="text-lg font-semibold">Prompt</h2>
                  </div>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the music you want (e.g., uplifting cinematic theme)"
                    className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Output Language</label>
                    <LanguageSelector selectedLanguage={musicLanguage} onLanguageChange={setMusicLanguage} />
                  </div>
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
                <div className="card space-y-4">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="text-gray-600" size={18} />
                    <h2 className="text-lg font-semibold">Quick Settings</h2>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Duration: {duration}s</label>
                    <input type="range" min={4} max={16} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Tempo: {tempo} BPM</label>
                    <input type="range" min={60} max={160} step={5} value={tempo} onChange={(e) => setTempo(Number(e.target.value))} className="w-full" />
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
                        }}
                        className="text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors text-sm"
                      >
                        <div className="font-medium text-gray-900">Slow & Deep</div>
                        <div className="text-xs text-gray-600">Slow + low pitch</div>
                      </button>
                    </div>
                  </div>
                  
                  {/* Basic Effects */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
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
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
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
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
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
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
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
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
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
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
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
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
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
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
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
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
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
          <div className="xl:col-span-2 space-y-6">
            <div className="card space-y-2">
              <h2 className="text-lg font-semibold">Output</h2>
              {activeTab === 'music' && (
                <>
                  {musicUrl ? (
                    <div className="space-y-2">
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
                      {/* Custom progress indicator */}
                      <div className="absolute top-0 left-0 w-full h-8 pointer-events-none">
                        <div className="relative w-full h-full">
                          <div className="absolute top-1 left-0 w-full h-6 bg-transparent">
                            <div 
                              className="absolute top-0 left-0 h-full bg-red-500 rounded-l-full transition-all duration-300 ease-out"
                              style={{ width: `${musicProgress}%` }}
                            />
                            <div 
                              className="absolute top-0 h-full w-2 bg-red-600 border-2 border-white rounded-full shadow-lg transform -translate-y-1 transition-all duration-300 ease-out"
                              style={{ left: `calc(${musicProgress}% - 4px)` }}
                            >
                              <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-red-600 absolute -top-2 left-1/2 transform -translate-x-1/2"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <a href={musicUrl} download="music.wav" className="text-indigo-600 hover:underline inline-flex items-center gap-1">
                        <Download size={14} /> Download WAV
                      </a>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">No audio yet. Enter a prompt and click Generate Music to hear the result.</div>
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
                            {!normalize && !reverse && speed === 1.0 && pitch === 1.0 && volume === 1.0 && reverb === 0 && echo === 0 && fadeIn === 0 && fadeOut === 0 && outputFormat === 'wav' && sampleRate === 44100 && (
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
                          <button
                            onClick={() => {
                              console.log('Volume test: Set volume to 0.5 and apply effects to hear the difference');
                              alert('Set volume to 0.5 and apply effects to test volume changes');
                            }}
                            className="text-green-600 hover:underline inline-flex items-center gap-1"
                          >
                            <Zap size={14} /> Test Volume
                          </button>
                          <button
                            onClick={() => {
                              console.log('Fade test: Set fade in to 1s and fade out to 1s to hear the difference');
                              alert('Set fade in to 1s and fade out to 1s to test fade effects');
                            }}
                            className="text-green-600 hover:underline inline-flex items-center gap-1"
                          >
                            <Zap size={14} /> Test Fade
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">No processed audio yet. Upload a file, choose options, and click Apply Effects.</div>
                  )}
                </>
              )}
            </div>

            <div className="card">
              <h3 className="text-md font-semibold mb-2">Notes</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Music generation is a lightweight demo (procedural synth). Swap with server models later.</li>
                <li>• Processing supports normalize, reverse, and speed change. Upload WAV/PCM for best results.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
