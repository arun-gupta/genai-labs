import React, { useRef, useState } from 'react';
import { Music2, SlidersHorizontal, Upload, Download, Play, Zap } from 'lucide-react';
import { apiService } from '../services/api';
import { LanguageSelector } from '../components/LanguageSelector';

export const AudioPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'music' | 'processing'>('music');

  // Music generation state
  const [prompt, setPrompt] = useState('uplifting cinematic theme with major scale');
  const [duration, setDuration] = useState(8);
  const [tempo, setTempo] = useState(100);
  const [musicUrl, setMusicUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [musicLanguage, setMusicLanguage] = useState('en');
  const [musicProgress, setMusicProgress] = useState(0);
  const musicProgressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Audio processing state
  const [uploaded, setUploaded] = useState<File | null>(null);
  const [processedUrl, setProcessedUrl] = useState('');
  const [normalize, setNormalize] = useState(true);
  const [reverse, setReverse] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const processingProgressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      alert('Upload an audio file first (WAV recommended).');
      return;
    }
    try {
      setIsProcessing(true);
      setProcessedUrl('');
      startProgress(setProcessingProgress, processingProgressTimer);
      const res = await apiService.processAudio(uploaded, { normalize, reverse, speed });
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
              onClick={() => setActiveTab('processing')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'processing'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Audio Processing
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
                    <h2 className="text-lg font-semibold">Music Prompt</h2>
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

            {activeTab === 'processing' && (
              <>
                {/* Upload */}
                <div className="card space-y-3">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="text-green-600" size={18} />
                    <h2 className="text-lg font-semibold">Upload Audio</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setUploaded(e.target.files?.[0] || null)}
                    />
                    <button
                      onClick={() => {
                        if (fileInputRef.current) fileInputRef.current.value = '';
                        setUploaded(null);
                      }}
                      className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded inline-flex items-center gap-1"
                    >
                      <Upload size={14} /> Reset
                    </button>
                  </div>
                </div>

                {/* Options */}
                <div className="card space-y-4">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="text-gray-600" size={18} />
                    <h2 className="text-lg font-semibold">Processing Options</h2>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={normalize} onChange={(e) => setNormalize(e.target.checked)} /> Normalize
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={reverse} onChange={(e) => setReverse(e.target.checked)} /> Reverse
                  </label>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Speed: {speed.toFixed(2)}x</label>
                    <input type="range" min={0.5} max={1.5} step={0.05} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-full" />
                  </div>
                </div>

                {/* Actions */}
                <div className="card space-y-3">
                  <button onClick={handleProcess} disabled={isProcessing || !uploaded} className="btn-secondary inline-flex items-center gap-2">
                    <Play size={16} /> {isProcessing ? 'Processing...' : 'Process Audio'}
                  </button>
                  {(isProcessing || processingProgress > 0) && (
                    <div>
                      <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
                        <div
                          className="bg-green-600 h-2 transition-all duration-300 ease-out"
                          style={{ width: `${processingProgress}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{processingProgress}%</div>
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

              {activeTab === 'processing' && (
                <>
                  {processedUrl ? (
                    <div className="space-y-2">
                      <audio 
                        src={processedUrl} 
                        controls 
                        className="w-full [&::-webkit-media-controls-panel]:bg-gray-100 [&::-webkit-media-controls-play-button]:bg-green-500 [&::-webkit-media-controls-play-button]:rounded-full [&::-webkit-media-controls-timeline]:bg-gray-300 [&::-webkit-media-controls-timeline]:rounded-full [&::-webkit-media-controls-timeline]:h-8 [&::-webkit-media-controls-current-time-display]:text-gray-700 [&::-webkit-media-controls-time-remaining-display]:text-gray-700 [&::-webkit-media-controls-volume-slider]:bg-gray-300 [&::-webkit-media-controls-volume-slider]:rounded-full [&::-webkit-media-controls-volume-slider]:h-2 [&::-webkit-media-controls-mute-button]:bg-gray-400 [&::-webkit-media-controls-mute-button]:rounded-full [&::-webkit-media-controls-timeline]:!bg-orange-200 [&::-webkit-media-controls-timeline]:!h-8 [&::-webkit-media-controls-timeline]:!border-2 [&::-webkit-media-controls-timeline]:!border-orange-500"
                        style={{
                          '--webkit-media-controls-panel-background-color': '#f3f4f6',
                          '--webkit-media-controls-play-button-background-color': '#10b981',
                          '--webkit-media-controls-timeline-background-color': '#fed7aa',
                          '--webkit-media-controls-timeline-progress-color': '#ea580c',
                          '--webkit-media-controls-timeline-border-radius': '9999px',
                          '--webkit-media-controls-timeline-height': '32px',
                          '--webkit-media-controls-volume-slider-background-color': '#d1d5db',
                          '--webkit-media-controls-volume-slider-progress-color': '#10b981',
                          '--webkit-media-controls-volume-slider-border-radius': '9999px',
                          '--webkit-media-controls-volume-slider-height': '8px'
                        } as React.CSSProperties}
                      />
                      {/* Custom progress indicator */}
                      <div className="absolute top-0 left-0 w-full h-8 pointer-events-none">
                        <div className="relative w-full h-full">
                          <div className="absolute top-1 left-0 w-full h-6 bg-transparent">
                            <div 
                              className="absolute top-0 left-0 h-full bg-green-500 rounded-l-full transition-all duration-300 ease-out"
                              style={{ width: `${processingProgress}%` }}
                            />
                            <div 
                              className="absolute top-0 h-full w-2 bg-green-600 border-2 border-white rounded-full shadow-lg transform -translate-y-1 transition-all duration-300 ease-out"
                              style={{ left: `calc(${processingProgress}% - 4px)` }}
                            >
                              <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-green-600 absolute -top-2 left-1/2 transform -translate-x-1/2"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <a href={processedUrl} download="processed.wav" className="text-indigo-600 hover:underline inline-flex items-center gap-1">
                        <Download size={14} /> Download Processed WAV
                      </a>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">No processed audio yet. Upload a file, choose options, and click Process Audio.</div>
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
