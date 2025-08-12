import React, { useState, useEffect } from 'react';
import { Camera, Upload, Video, Download, RotateCcw, Eye, Palette, FileText, BarChart3, Play, Pause, Zap } from 'lucide-react';
import { apiService } from '../services/api';
import { ModelSelector } from '../components/ModelSelector';
import { ExportOptions } from '../components/ExportOptions';

interface VideoGenerationResult {
  provider: string;
  model: string;
  prompt: string;
  videos: Array<{
    url?: string;
    base64: string;
    size: string;
    duration: number;
    fps: number;
  }>;
  generation_id: string;
  timestamp: number;
}

interface VideoAnalysisResult {
  analysis_type: string;
  analysis: any;
  raw_response: string;
  model_provider: string;
  model_name: string;
  latency_ms: number;
  timestamp: number;
}

export const VideoPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generation' | 'animation' | 'enhancement' | 'gallery'>('generation');

  // Video Generation State
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [videoSize, setVideoSize] = useState('512x512');
  const [videoDuration, setVideoDuration] = useState(3);
  const [fps, setFps] = useState(24);
  const [artisticStyle, setArtisticStyle] = useState('');
  const [numVideos, setNumVideos] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [generationPhase, setGenerationPhase] = useState<'download' | 'load' | 'generate' | 'complete'>('download');
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [generateProgress, setGenerateProgress] = useState<number>(0);
  const [generationResult, setGenerationResult] = useState<VideoGenerationResult | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Animation State
  const [animationPrompt, setAnimationPrompt] = useState('');
  const [animationStyle, setAnimationStyle] = useState('cinematic');
  const [numFrames, setNumFrames] = useState(24);
  const [isGeneratingAnimation, setIsGeneratingAnimation] = useState(false);
  const [animationProgress, setAnimationProgress] = useState<number>(0);
  const [animationPhase, setAnimationPhase] = useState<'download' | 'load' | 'generate' | 'complete'>('download');
  const [animationDownloadProgress, setAnimationDownloadProgress] = useState<number>(0);
  const [animationLoadProgress, setAnimationLoadProgress] = useState<number>(0);
  const [animationGenerateProgress, setAnimationGenerateProgress] = useState<number>(0);
  const [animationResult, setAnimationResult] = useState<any>(null);

  // Video Enhancement State
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [enhancementType, setEnhancementType] = useState('upscale');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementResult, setEnhancementResult] = useState<any>(null);

  // Gallery State
  const [generatedVideos, setGeneratedVideos] = useState<VideoGenerationResult[]>([]);

  // Drag state
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPasteNotification, setShowPasteNotification] = useState(false);

  // Results tab state
  const [resultsTab, setResultsTab] = useState<'response' | 'analytics' | 'comparison'>('response');

  // Sample prompts for video generation
  const sampleVideoPrompts = [
    "A spaceship traveling through a colorful nebula",
    "A butterfly emerging from a cocoon in slow motion",
    "Ocean waves crashing against rocky cliffs",
    "A robot walking through a futuristic city",
    "A flower blooming in time-lapse",
    "A car driving through a neon-lit tunnel",
    "A bird soaring over mountain peaks",
    "A clock with moving gears and mechanisms"
  ];

  // Sample animation prompts
  const sampleAnimationPrompts = [
    "A character walking through a magical forest",
    "A ball bouncing with realistic physics",
    "A door opening to reveal a mysterious room",
    "A candle flame flickering in the wind",
    "A book opening with pages turning",
    "A key turning in an ancient lock",
    "A window opening to show a beautiful sunset",
    "A hand drawing a circle in the air"
  ];

  // Video styles
  const videoStyles = [
    { value: '', label: 'Default' },
    { value: 'cinematic', label: 'Cinematic' },
    { value: 'anime', label: 'Anime' },
    { value: 'photorealistic', label: 'Photorealistic' },
    { value: 'artistic', label: 'Artistic' },
    { value: 'fantasy', label: 'Fantasy' },
    { value: 'sci-fi', label: 'Sci-Fi' },
    { value: 'vintage', label: 'Vintage' },
    { value: 'futuristic', label: 'Futuristic' },
    { value: 'horror', label: 'Horror' },
    { value: 'romantic', label: 'Romantic' },
    { value: 'action', label: 'Action' }
  ];

  // Enhancement types
  const enhancementTypes = [
    { value: 'upscale', label: 'Upscale (2x)' },
    { value: 'stabilize', label: 'Stabilize' },
    { value: 'smooth', label: 'Smooth Motion' },
    { value: 'enhance', label: 'Enhance Quality' },
    { value: 'color_correct', label: 'Color Correction' },
    { value: 'denoise', label: 'Remove Noise' }
  ];

  // Video sizes
  const videoSizes = [
    { value: '256x256', label: '256x256 (Fast)' },
    { value: '384x384', label: '384x384 (Balanced)' },
    { value: '512x512', label: '512x512 (Quality)' },
    { value: '768x768', label: '768x768 (HD)' }
  ];

  useEffect(() => {
    // Load any initial data
  }, []);

  const handleVideoGeneration = async () => {
    if (!generationPrompt.trim()) {
      alert('Please enter a prompt for video generation');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setDownloadProgress(0);
    setLoadProgress(0);
    setGenerateProgress(0);
    setGenerationResult(null);
    setGenerationError(null); // Clear any previous errors

    try {
      // Parse video size
      const [width, height] = videoSize.split('x').map(Number);
      
      // Call the streaming API with progress updates
      const result = await apiService.generateVideoStream({
        prompt: generationPrompt,
        style: artisticStyle,
        width,
        height,
        duration: videoDuration,
        fps,
        num_videos: numVideos
      }, (progress) => {
        // Update progress state with real values
        setDownloadProgress(progress.download_progress);
        setLoadProgress(progress.load_progress);
        setGenerateProgress(progress.generate_progress);
      });

      setGenerationResult(result);
      setGeneratedVideos(prev => [result, ...prev]);
      
    } catch (error) {
      console.error('Video generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Video generation failed. Please try again.';
      setGenerationError(errorMessage);
    } finally {
      setIsGenerating(false);
      // Reset progress
      setDownloadProgress(0);
      setLoadProgress(0);
      setGenerateProgress(0);
    }
  };

  const handleAnimationGeneration = async () => {
    if (!animationPrompt.trim()) {
      alert('Please enter a prompt for animation generation');
      return;
    }

    setIsGeneratingAnimation(true);
    setAnimationProgress(0);
    setAnimationDownloadProgress(0);
    setAnimationLoadProgress(0);
    setAnimationGenerateProgress(0);
    setAnimationResult(null);

    try {
      // Call the API with progress simulation
      const result = await apiService.generateAnimation({
        prompt: animationPrompt,
        style: animationStyle,
        width: 512,
        height: 512,
        num_frames: numFrames,
        fps
      });

      // Simulate progress for animation (since we don't have streaming for animation yet)
      for (let i = 0; i <= 100; i += 10) {
        setAnimationDownloadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      for (let i = 0; i <= 100; i += 10) {
        setAnimationLoadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      for (let i = 0; i <= 100; i += 10) {
        setAnimationGenerateProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setAnimationResult(result);
      
    } catch (error) {
      console.error('Animation generation failed:', error);
      alert('Animation generation failed. Please try again.');
    } finally {
      setIsGeneratingAnimation(false);
      // Reset progress
      setAnimationDownloadProgress(0);
      setAnimationLoadProgress(0);
      setAnimationGenerateProgress(0);
    }
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedVideo(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setVideoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoEnhancement = async () => {
    if (!uploadedVideo) {
      alert('Please upload a video for enhancement');
      return;
    }

    setIsEnhancing(true);

    try {
      const result = await apiService.enhanceVideo({
        video: uploadedVideo,
        enhancement_type: enhancementType
      });

      setEnhancementResult(result);
      
    } catch (error) {
      console.error('Video enhancement failed:', error);
      alert('Video enhancement failed. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const downloadVideo = (base64Data: string, filename: string) => {
    const link = document.createElement('a');
    link.href = `data:video/mp4;base64,${base64Data}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderVideoGenerationTab = () => (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Left Panel - Input & Settings */}
      <div className="xl:col-span-1 space-y-6">
        {/* Video Generation */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Video className="text-indigo-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Video Generation</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video Prompt
              </label>
              <textarea
                value={generationPrompt}
                onChange={(e) => setGenerationPrompt(e.target.value)}
                placeholder="Describe the video you want to generate..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Sample Prompts */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Sample Prompts</h3>
              <div className="grid grid-cols-1 gap-2">
                {sampleVideoPrompts.slice(0, 3).map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setGenerationPrompt(prompt)}
                    className="text-left p-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Settings */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="text-blue-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Quick Settings</h2>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Size
                </label>
                <select
                  value={videoSize}
                  onChange={(e) => setVideoSize(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {videoSizes.map((size) => (
                    <option key={size.value} value={size.value}>
                      {size.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Style
                </label>
                <select
                  value={artisticStyle}
                  onChange={(e) => setArtisticStyle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {videoStyles.map((style) => (
                    <option key={style.value} value={style.value}>
                      {style.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration: {videoDuration}s
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="2"
                  max="5"
                  value={videoDuration}
                  onChange={(e) => setVideoDuration(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>2s</span>
                  <span>3s</span>
                  <span>4s</span>
                  <span>5s</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  FPS: {fps}
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="12"
                    max="60"
                    step="12"
                    value={fps}
                    onChange={(e) => setFps(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>12</span>
                    <span>24</span>
                    <span>30</span>
                    <span>60</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Videos: {numVideos}
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="1"
                    max="4"
                    value={numVideos}
                    onChange={(e) => setNumVideos(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="card">
          <button
            onClick={handleVideoGeneration}
            disabled={isGenerating}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating Video...' : 'Generate Video'}
          </button>

            {/* Progress Indicators */}
            {isGenerating && (
              <div className="space-y-4 mt-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Downloading Model</span>
                    <span>{downloadProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Loading Model</span>
                    <span>{loadProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${loadProgress}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Generating Video</span>
                    <span>{generateProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${generateProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Right Panel - Response */}
      <div className="xl:col-span-2 space-y-6">
        {/* Results Section */}
        {generationError ? (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Response</h2>
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                  Generation Failed
                </span>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <Video className="w-16 h-16 mx-auto text-red-400 mb-2" />
                <h3 className="text-lg font-medium text-red-900 mb-2">Video Generation Failed</h3>
                <p className="text-red-700 mb-4">{generationError}</p>
                <button
                  onClick={() => setGenerationError(null)}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        ) : generationResult ? (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Response</h2>
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
                  Video Generated
                </span>
              </div>
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                {generationResult.videos[0].base64 && generationResult.videos[0].base64.startsWith('data:video/mp4;base64,') ? (
                  <video
                    src={generationResult.videos[0].base64}
                    controls
                    className="w-full max-w-md mx-auto rounded"
                    autoPlay
                    muted
                    loop
                  />
                ) : (
                  <>
                    <Video className="w-16 h-16 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600">Video Generation Successful!</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Size: {generationResult.videos[0].size} | Duration: {generationResult.videos[0].duration}s | FPS: {generationResult.videos[0].fps}
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                      <p className="text-sm text-blue-800">
                        <strong>🎬 Demo Mode:</strong> This is a simulation of video generation. 
                        The actual video content will be displayed here when real AI video models are integrated.
                      </p>
                    </div>
                  </>
                )}
                <div className="mt-3">
                  <button
                    onClick={() => downloadVideo(generationResult.videos[0].base64, 'generated-video.mp4')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    <Download className="w-4 h-4 inline mr-2" />
                    Download Video
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">{generationResult.prompt}</p>
            </div>
          </div>
        ) : (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Response</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Video className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Generate Videos</h3>
              <p className="text-gray-600 mb-4">
                Enter a prompt and adjust your settings, then click "Generate Video" to create your AI-generated video.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h4 className="font-medium text-blue-900 mb-2">💡 Tips for better results:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Be descriptive and specific about what you want to see</li>
                  <li>• Include details about style, mood, and composition</li>
                  <li>• Try different durations and FPS settings for different effects</li>
                  <li>• Use the sample prompts as inspiration</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );


  const renderAnimationTab = () => (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Left Panel - Input & Settings */}
      <div className="xl:col-span-1 space-y-6">
        {/* Animation Creation */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Play className="text-indigo-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Animation Creation</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Animation Prompt
              </label>
              <textarea
                value={animationPrompt}
                onChange={(e) => setAnimationPrompt(e.target.value)}
                placeholder="Describe the animation you want to create..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Sample Prompts */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Sample Prompts</h3>
              <div className="grid grid-cols-1 gap-2">
                {sampleAnimationPrompts.slice(0, 3).map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setAnimationPrompt(prompt)}
                    className="text-left p-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Settings */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="text-blue-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Quick Settings</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Style
              </label>
              <select
                value={animationStyle}
                onChange={(e) => setAnimationStyle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {videoStyles.map((style) => (
                  <option key={style.value} value={style.value}>
                    {style.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  FPS: {fps}
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="12"
                    max="60"
                    step="12"
                    value={fps}
                    onChange={(e) => setFps(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>12</span>
                    <span>24</span>
                    <span>30</span>
                    <span>60</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frames: {numFrames}
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="12"
                    max="96"
                    step="12"
                    value={numFrames}
                    onChange={(e) => setNumFrames(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>12</span>
                    <span>24</span>
                    <span>48</span>
                    <span>96</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Create Button */}
        <div className="card">
          <button
            onClick={handleAnimationGeneration}
            disabled={isGeneratingAnimation}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingAnimation ? 'Creating Animation...' : 'Create Animation'}
          </button>
        </div>
      </div>

      {/* Right Panel - Response */}
      <div className="xl:col-span-2 space-y-6">
        {/* Results Section */}
        {animationResult ? (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Response</h2>
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
                  Animation Created
                </span>
              </div>
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                {animationResult.videos[0].base64 && animationResult.videos[0].base64.startsWith('data:video/mp4;base64,') ? (
                  <video
                    src={animationResult.videos[0].base64}
                    controls
                    className="w-full max-w-md mx-auto rounded"
                    autoPlay
                    muted
                    loop
                  />
                ) : (
                  <>
                    <Play className="w-16 h-16 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600">Animation Generation Successful!</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Style: {animationStyle} | FPS: {fps} | Frames: {numFrames}
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                      <p className="text-sm text-blue-800">
                        <strong>🎬 Demo Mode:</strong> This is a simulation of animation generation. 
                        The actual animation content will be displayed here when real AI animation models are integrated.
                      </p>
                    </div>
                  </>
                )}
                <div className="mt-3">
                  <button
                    onClick={() => downloadVideo(animationResult.videos[0].base64, 'animation.mp4')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    <Download className="w-4 h-4 inline mr-2" />
                    Download Animation
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">{animationResult.prompt}</p>
            </div>
          </div>
        ) : (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Response</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Play className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Create Animations</h3>
              <p className="text-gray-600 mb-4">
                Enter an animation prompt and adjust your settings, then click "Create Animation" to generate your AI animation.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h4 className="font-medium text-blue-900 mb-2">💡 Animation Tips:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Focus on movement and action in your descriptions</li>
                  <li>• Specify the type of motion you want to see</li>
                  <li>• Adjust frame count for longer or shorter animations</li>
                  <li>• Try different styles for various animation effects</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderEnhancementTab = () => (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Left Panel - Input & Settings */}
      <div className="xl:col-span-1 space-y-6">
        {/* Upload Section */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Enhance Videos</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Video
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                  id="video-upload"
                />
                <label htmlFor="video-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-500">MP4, AVI, MOV up to 100MB</p>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enhancement Type
              </label>
              <select
                value={enhancementType}
                onChange={(e) => setEnhancementType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {enhancementTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleVideoEnhancement}
              disabled={!uploadedVideo || isEnhancing}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEnhancing ? 'Enhancing Video...' : 'Enhance Video'}
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Response */}
      <div className="xl:col-span-2 space-y-6">
        {/* Preview Section */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Video Preview</h3>
          {videoPreview ? (
            <div className="border rounded-lg p-4">
              <video
                src={videoPreview}
                controls
                className="w-full rounded"
              />
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Video className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No video uploaded</p>
            </div>
          )}
        </div>

        {/* Enhancement Results */}
        {enhancementResult ? (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Response</h2>
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  Enhanced
                </span>
              </div>
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                {enhancementResult.enhanced_video && enhancementResult.enhanced_video.startsWith('data:video/mp4;base64,') ? (
                  <video
                    src={enhancementResult.enhanced_video}
                    controls
                    className="w-full max-w-md mx-auto rounded"
                    autoPlay
                    muted
                    loop
                  />
                ) : (
                  <>
                    <RotateCcw className="w-16 h-16 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600">Video Enhancement Successful!</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Original: {enhancementResult.original_size} → Enhanced: {enhancementResult.enhanced_size}
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                      <p className="text-sm text-blue-800">
                        <strong>🎬 Demo Mode:</strong> This is a simulation of video enhancement. 
                        The actual enhanced video content will be displayed here when real AI enhancement models are integrated.
                      </p>
                    </div>
                  </>
                )}
                <div className="mt-3">
                  <button
                    onClick={() => downloadVideo(enhancementResult.enhanced_video, 'enhanced-video.mp4')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    <Download className="w-4 h-4 inline mr-2" />
                    Download Enhanced Video
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Response</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <RotateCcw className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Enhance Videos</h3>
              <p className="text-gray-600 mb-4">
                Upload a video and select an enhancement type, then click "Enhance Video" to improve your video quality.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h4 className="font-medium text-blue-900 mb-2">💡 Enhancement Options:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Upscale:</strong> Increase video resolution (2x)</li>
                  <li>• <strong>Stabilize:</strong> Reduce camera shake and movement</li>
                  <li>• <strong>Smooth Motion:</strong> Create fluid, smooth animations</li>
                  <li>• <strong>Enhance Quality:</strong> Improve overall video clarity</li>
                  <li>• <strong>Color Correction:</strong> Adjust colors and lighting</li>
                  <li>• <strong>Remove Noise:</strong> Clean up video artifacts</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderGalleryTab = () => (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Response Gallery</h2>
      
      {generatedVideos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {generatedVideos.map((result, resultIndex) => (
            <div key={resultIndex} className="border rounded-lg overflow-hidden">
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-2 truncate">
                  {result.prompt}
                </h3>
                <div className="bg-gray-100 rounded-lg p-4 text-center mb-3">
                  {result.videos[0].base64 && result.videos[0].base64.startsWith('data:video/mp4;base64,') ? (
                    <video
                      src={result.videos[0].base64}
                      controls
                      className="w-full rounded"
                      autoPlay
                      muted
                      loop
                    />
                  ) : (
                    <>
                      <Video className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Demo Video</p>
                      <p className="text-xs text-gray-400">(Mock data)</p>
                    </>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    {result.model} • {result.videos.length} video{result.videos.length > 1 ? 's' : ''}
                  </div>
                  <button
                    onClick={() => downloadVideo(result.videos[0].base64, `video-${resultIndex}.mp4`)}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <Video className="mx-auto h-12 w-12 mb-4" />
          <p>No videos generated yet</p>
          <p className="text-sm mt-2">Generate your first video to see it here</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Video & Animation</h1>
            <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800 border border-yellow-200">WIP</span>
          </div>
          <p className="text-gray-600">Create stunning videos and animations with AI</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('generation')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'generation'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Video className="inline-block w-4 h-4 mr-2" />
              Video Generation
            </button>
            <button
              onClick={() => setActiveTab('animation')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'animation'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Play className="inline-block w-4 h-4 mr-2" />
              Animation
            </button>
            <button
              onClick={() => setActiveTab('enhancement')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'enhancement'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <RotateCcw className="inline-block w-4 h-4 mr-2" />
              Video Enhancement
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'gallery'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="inline-block w-4 h-4 mr-2" />
              Gallery
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'generation' && renderVideoGenerationTab()}
          {activeTab === 'animation' && renderAnimationTab()}
          {activeTab === 'enhancement' && renderEnhancementTab()}
          {activeTab === 'gallery' && renderGalleryTab()}
        </div>
      </div>
    </div>
  );
};
