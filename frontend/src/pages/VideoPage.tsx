import React, { useState, useEffect } from 'react';
import { Camera, Upload, Video, Download, RotateCcw, Eye, Palette, FileText, BarChart3, Play, Pause } from 'lucide-react';
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

    try {
      // Parse video size
      const [width, height] = videoSize.split('x').map(Number);
      
      // Call the API
      const result = await apiService.generateVideo({
        prompt: generationPrompt,
        style: artisticStyle,
        width,
        height,
        duration: videoDuration,
        fps,
        num_videos: numVideos
      });

      setGenerationResult(result);
      setGeneratedVideos(prev => [result, ...prev]);
      
    } catch (error) {
      console.error('Video generation failed:', error);
      alert('Video generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
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
      // Call the API
      const result = await apiService.generateAnimation({
        prompt: animationPrompt,
        style: animationStyle,
        width: 512,
        height: 512,
        num_frames: numFrames,
        fps
      });

      setAnimationResult(result);
      
    } catch (error) {
      console.error('Animation generation failed:', error);
      alert('Animation generation failed. Please try again.');
    } finally {
      setIsGeneratingAnimation(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Video & Animation</h1>
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

        {/* Video Generation Tab */}
        {activeTab === 'generation' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Generate Videos from Text</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Input Section */}
              <div className="space-y-6">
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

                <button
                  onClick={handleVideoGeneration}
                  disabled={isGenerating}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Generating Video...' : 'Generate Video'}
                </button>

                {/* Progress Indicators */}
                {isGenerating && (
                  <div className="space-y-4">
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

              {/* Sample Prompts */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Sample Prompts</h3>
                <div className="grid grid-cols-1 gap-2">
                  {sampleVideoPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setGenerationPrompt(prompt)}
                      className="text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results Section */}
            {generationResult && (
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Output</h3>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
                      Video Generated
                    </span>
                    <button
                      onClick={() => downloadVideo(generationResult.videos[0].base64, 'generated-video.mp4')}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4 text-center">
                    <Video className="w-16 h-16 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600">Video preview would be displayed here</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Size: {generationResult.videos[0].size} | Duration: {generationResult.videos[0].duration}s | FPS: {generationResult.videos[0].fps}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{generationResult.prompt}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Animation Tab */}
        {activeTab === 'animation' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Create Animations</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Input Section */}
              <div className="space-y-6">
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

                <div className="grid grid-cols-2 gap-4">
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

                <button
                  onClick={handleAnimationGeneration}
                  disabled={isGeneratingAnimation}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingAnimation ? 'Creating Animation...' : 'Create Animation'}
                </button>
              </div>

              {/* Sample Prompts */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Sample Animation Prompts</h3>
                <div className="grid grid-cols-1 gap-2">
                  {sampleAnimationPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setAnimationPrompt(prompt)}
                      className="text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Enhancement Tab */}
        {activeTab === 'enhancement' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Enhance Videos</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Upload Section */}
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

              {/* Preview Section */}
              <div>
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
            </div>

            {/* Enhancement Results */}
            {enhancementResult && (
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Output</h3>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      Enhanced
                    </span>
                    <button
                      onClick={() => downloadVideo(enhancementResult.enhanced_video, 'enhanced-video.mp4')}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4 text-center">
                    <Video className="w-16 h-16 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600">Video preview</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Original: {enhancementResult.original_size} → Enhanced: {enhancementResult.enhanced_size}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Output Gallery</h2>
            
            {generatedVideos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {generatedVideos.map((result, resultIndex) => (
                  <div key={resultIndex} className="border rounded-lg overflow-hidden">
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-2 truncate">
                        {result.prompt}
                      </h3>
                      <div className="bg-gray-100 rounded-lg p-4 text-center mb-3">
                        <Video className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">Video preview</p>
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
        )}
      </div>
    </div>
  );
};
