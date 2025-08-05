import React, { useState, useEffect } from 'react';
import { Camera, Upload, Image as ImageIcon, Download, RotateCcw, Eye, Palette, FileText, BarChart3 } from 'lucide-react';
import { apiService } from '../services/api';
import { ModelSelector } from '../components/ModelSelector';
import { ExportOptions } from '../components/ExportOptions';

interface ImageAnalysisResult {
  analysis_type: string;
  analysis: any;
  raw_response: string;
  model_provider: string;
  model_name: string;
  latency_ms: number;
  timestamp: number;
}

interface ImageGenerationResult {
  provider: string;
  model: string;
  prompt: string;
  images: Array<{
    url?: string;
    base64: string;
    size: string;
    seed?: number;
  }>;
  generation_id: string;
  timestamp: number;
}

export const VisionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'generation' | 'gallery'>('analysis');
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [selectedModel, setSelectedModel] = useState('gpt-4-vision-preview');
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  
  // Image Analysis State
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [analysisType, setAnalysisType] = useState<'describe' | 'extract' | 'analyze' | 'compare'>('describe');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResult | null>(null);
  
  // Image Generation State
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [imageSize, setImageSize] = useState('1024x1024');
  const [imageQuality, setImageQuality] = useState('standard');
  const [artisticStyle, setArtisticStyle] = useState('');
  const [numImages, setNumImages] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<ImageGenerationResult | null>(null);
  
  // Gallery State
  const [generatedImages, setGeneratedImages] = useState<ImageGenerationResult[]>([]);
  
  // Drag state
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPasteNotification, setShowPasteNotification] = useState(false);
  
  // Results tab state
  const [resultsTab, setResultsTab] = useState<'response' | 'analytics' | 'comparison'>('response');

  // Sample data
  const sampleImages = [
    {
      name: 'Business Meeting',
      description: 'A professional business meeting scene',
      color: '#4F46E5', // Indigo
      analysisPrompts: [
        'Describe the people and setting in this business meeting',
        'What type of business activity is taking place?',
        'Analyze the professional environment and atmosphere'
      ],
      generationPrompts: [
        'A professional business meeting with diverse team members',
        'Modern office conference room with people collaborating',
        'Corporate boardroom with executives in suits'
      ]
    },
    {
      name: 'Nature Scene',
      description: 'A beautiful natural landscape',
      color: '#059669', // Emerald
      analysisPrompts: [
        'Describe the natural elements and landscape features',
        'What type of environment is shown in this scene?',
        'Analyze the colors and mood of this natural setting'
      ],
      generationPrompts: [
        'Serene mountain landscape with trees and a lake',
        'Peaceful forest scene with sunlight filtering through trees',
        'Beautiful sunset over rolling hills and meadows'
      ]
    },
    {
      name: 'Technology',
      description: 'Modern technology and digital devices',
      color: '#DC2626', // Red
      analysisPrompts: [
        'Describe the technology and digital elements shown',
        'What type of devices or systems are displayed?',
        'Analyze the futuristic or modern aspects of this scene'
      ],
      generationPrompts: [
        'Futuristic technology interface with glowing screens',
        'Modern workspace with multiple monitors and devices',
        'Sci-fi computer terminal with holographic displays'
      ]
    }
  ];

  const samplePrompts = [
    'A majestic dragon flying over a medieval castle at sunset',
    'A cozy coffee shop interior with warm lighting and people working',
    'A futuristic cityscape with flying cars and neon lights',
    'A peaceful garden with blooming flowers and butterflies',
    'A professional portrait of a confident business person',
    'An underwater scene with colorful coral reefs and fish',
    'A magical forest with glowing mushrooms and fairy lights',
    'A modern minimalist kitchen with clean lines and natural light'
  ];

  // Load available models
  useEffect(() => {
    const loadAvailableModels = async () => {
      try {
        const models = await apiService.getAvailableModels();
        setAvailableModels(models);
      } catch (error) {
        console.error('Failed to load available models:', error);
      }
    };
    
    loadAvailableModels();
  }, []);

  // Global paste event listener
  useEffect(() => {
    const handleGlobalPaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            // Validate file size (20MB limit)
            if (file.size > 20 * 1024 * 1024) {
              alert('Image file is too large. Please use an image smaller than 20MB.');
              return;
            }
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
              alert('Please paste a valid image file.');
              return;
            }
            
            setUploadedImage(file);
            const reader = new FileReader();
            reader.onload = (e) => {
              setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
            setShowPasteNotification(true);
            setTimeout(() => setShowPasteNotification(false), 3000);
            break;
          }
        }
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => {
      document.removeEventListener('paste', handleGlobalPaste);
    };
  }, []);

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle clipboard paste
  const handlePaste = (event: React.ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          // Validate file size (20MB limit)
          if (file.size > 20 * 1024 * 1024) {
            alert('Image file is too large. Please use an image smaller than 20MB.');
            return;
          }
          
          // Validate file type
          if (!file.type.startsWith('image/')) {
            alert('Please paste a valid image file.');
            return;
          }
          
          setUploadedImage(file);
          const reader = new FileReader();
          reader.onload = (e) => {
            setImagePreview(e.target?.result as string);
          };
          reader.readAsDataURL(file);
          setShowPasteNotification(true);
          setTimeout(() => setShowPasteNotification(false), 3000);
          break;
        }
      }
    }
  };

  // Handle drag and drop
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        // Validate file size (20MB limit)
        if (file.size > 20 * 1024 * 1024) {
          alert('Image file is too large. Please use an image smaller than 20MB.');
          return;
        }
        
        setUploadedImage(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        alert('Please drop a valid image file.');
      }
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  // Handle image analysis
  const handleImageAnalysis = async () => {
    if (!uploadedImage) {
      alert('Please upload an image first');
      return;
    }

    setIsAnalyzing(true);
    try {
      const imageBytes = await fileToBytes(uploadedImage);
      const result = await apiService.analyzeImage({
        image: imageBytes,
        analysis_type: analysisType,
        model_provider: selectedProvider,
        model_name: selectedModel,
        custom_prompt: customPrompt || undefined,
        temperature: 0.3
      });
      
      setAnalysisResult(result);
      setResultsTab('response'); // Switch to response tab when results are available
    } catch (error) {
      console.error('Image analysis failed:', error);
      alert('Image analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle image generation
  const handleImageGeneration = async () => {
    if (!generationPrompt.trim()) {
      alert('Please enter a prompt for image generation');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await apiService.generateImage({
        prompt: generationPrompt,
        model_provider: selectedProvider,
        model_name: selectedModel,
        size: imageSize,
        quality: imageQuality,
        style: artisticStyle || undefined,
        num_images: numImages,
        temperature: 0.7
      });
      
      setGenerationResult(result);
      setGeneratedImages(prev => [result, ...prev]);
      setResultsTab('response'); // Switch to response tab when results are available
    } catch (error) {
      console.error('Image generation failed:', error);
      alert('Image generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Convert file to bytes
  const fileToBytes = async (file: File): Promise<Uint8Array> => {
    return new Uint8Array(await file.arrayBuffer());
  };

  // Download image
  const downloadImage = (base64Data: string, filename: string) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64Data}`;
    link.download = filename;
    link.click();
  };

  // Generate a simple colored image
  const generateSampleImage = (name: string, color: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 200, 150);
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(name, 100, 75);
    }
    return canvas.toDataURL('image/png');
  };

  // Handle sample image selection
  const handleSampleImageSelect = (sampleImage: any) => {
    // Generate the image data
    const imageDataUrl = generateSampleImage(sampleImage.name, sampleImage.color);
    
    // Convert base64 PNG to a File object
    const base64Data = imageDataUrl.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const file = new File([byteArray], `${sampleImage.name.toLowerCase().replace(' ', '-')}.png`, { type: 'image/png' });
    
    setUploadedImage(file);
    setImagePreview(imageDataUrl);
  };

  // Handle sample prompt selection
  const handleSamplePromptSelect = (prompt: string) => {
    setGenerationPrompt(prompt);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vision AI</h1>
          <p className="text-gray-600">Analyze images and generate new ones using AI vision models</p>
          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center space-x-1">
              <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">Ctrl+V</span>
              <span>Paste image from clipboard</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">Drag & Drop</span>
              <span>Upload image files</span>
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm mb-8">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'analysis'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Eye size={16} />
            <span>Image Analysis</span>
          </button>
          <button
            onClick={() => setActiveTab('generation')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'generation'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Palette size={16} />
            <span>Image Generation</span>
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'gallery'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <ImageIcon size={16} />
            <span>Gallery</span>
          </button>
        </div>

        {/* Paste Notification */}
        {showPasteNotification && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2">
            <span>✓</span>
            <span>Image pasted successfully!</span>
          </div>
        )}

        {/* Image Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Image Analysis</h2>
              
              {/* Sample Images */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sample Images
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {sampleImages.map((sampleImage, index) => (
                    <button
                      key={index}
                      onClick={() => handleSampleImageSelect(sampleImage)}
                      className="border border-gray-200 rounded-lg p-3 hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
                    >
                      <div 
                        className="w-full h-20 rounded mb-2 flex items-center justify-center"
                        style={{ backgroundColor: sampleImage.color }}
                      >
                        <span className="text-white font-medium text-sm">{sampleImage.name}</span>
                      </div>
                      <p className="text-xs font-medium text-gray-900">{sampleImage.name}</p>
                      <p className="text-xs text-gray-500">{sampleImage.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Image
                </label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                    isDragOver 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onPaste={handlePaste}
                  tabIndex={0}
                  role="button"
                  aria-label="Upload image by clicking, dragging, or pasting"
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    {imagePreview ? (
                      <div className="space-y-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-w-full h-64 object-contain mx-auto rounded"
                        />
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Click to change image</p>
                          <p className="text-xs text-gray-400">Or drag & drop, or paste (Ctrl+V)</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {isDragOver ? (
                          <>
                            <Upload className="mx-auto h-12 w-12 text-blue-500" />
                            <p className="text-sm text-blue-600 font-medium">Drop image here</p>
                          </>
                        ) : (
                          <>
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="space-y-1">
                              <p className="text-sm text-gray-600">Click to upload an image</p>
                              <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 20MB</p>
                              <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
                                <span>• Drag & drop</span>
                                <span>• Paste (Ctrl+V)</span>
                                <span>• Click to browse</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Sample Prompts for Selected Image */}
              {uploadedImage && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sample Analysis Prompts
                  </label>
                  <div className="space-y-2">
                    {sampleImages.find(img => img.name === uploadedImage.name?.replace('.png', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))?.analysisPrompts?.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => setCustomPrompt(prompt)}
                        className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                      >
                        <p className="text-sm text-gray-900">{prompt}</p>
                      </button>
                    )) || (
                      <div className="text-sm text-gray-500 italic">
                        No sample prompts available for this image
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Analysis Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Analysis Type
                </label>
                <select
                  value={analysisType}
                  onChange={(e) => setAnalysisType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="describe">Describe Image</option>
                  <option value="extract">Extract Text</option>
                  <option value="analyze">Comprehensive Analysis</option>
                  <option value="compare">Compare Images</option>
                </select>
              </div>

              {/* Custom Prompt */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Prompt (Optional)
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Enter a custom analysis prompt..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              {/* Model Selection */}
              <div className="mb-6">
                <ModelSelector
                  selectedProvider={selectedProvider}
                  setSelectedProvider={setSelectedProvider}
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  availableModels={availableModels}
                />
              </div>

              {/* Analyze Button */}
              <button
                onClick={handleImageAnalysis}
                disabled={isAnalyzing || !uploadedImage}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Eye size={16} />
                    <span>Analyze Image</span>
                  </>
                )}
              </button>
            </div>

            {/* Results Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
              
              {analysisResult ? (
                <>
                  {/* Results Tabs */}
                  <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-4">
                    <button
                      onClick={() => setResultsTab('response')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        resultsTab === 'response'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <FileText size={16} />
                      <span>Response</span>
                    </button>
                    <button
                      onClick={() => setResultsTab('analytics')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        resultsTab === 'analytics'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <BarChart3 size={16} />
                      <span>Analytics</span>
                    </button>
                    <button
                      onClick={() => setResultsTab('comparison')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        resultsTab === 'comparison'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Eye size={16} />
                      <span>Comparison</span>
                    </button>
                  </div>

                  {/* Response Tab */}
                  {resultsTab === 'response' && (
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">Analysis Summary</h3>
                        <p className="text-gray-700">{analysisResult.raw_response}</p>
                      </div>
                      
                      {analysisResult.analysis_type === 'extract' && analysisResult.analysis.extracted_text && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h3 className="font-medium text-blue-900 mb-2">Extracted Text</h3>
                          <div className="space-y-1">
                            {analysisResult.analysis.extracted_text.map((text: string, index: number) => (
                              <p key={index} className="text-blue-800">{text}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysisResult.analysis_type === 'analyze' && (
                        <div className="space-y-3">
                          {analysisResult.analysis.objects && analysisResult.analysis.objects.length > 0 && (
                            <div className="bg-green-50 rounded-lg p-3">
                              <h4 className="font-medium text-green-900 mb-1">Objects</h4>
                              <p className="text-green-800 text-sm">{analysisResult.analysis.objects.join(', ')}</p>
                            </div>
                          )}
                          {analysisResult.analysis.actions && analysisResult.analysis.actions.length > 0 && (
                            <div className="bg-purple-50 rounded-lg p-3">
                              <h4 className="font-medium text-purple-900 mb-1">Actions</h4>
                              <p className="text-purple-800 text-sm">{analysisResult.analysis.actions.join(', ')}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Analytics Tab */}
                  {resultsTab === 'analytics' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <span className="text-gray-500">Model:</span>
                          <p className="font-medium">{analysisResult.model_name}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <span className="text-gray-500">Provider:</span>
                          <p className="font-medium">{analysisResult.model_provider}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <span className="text-gray-500">Analysis Type:</span>
                          <p className="font-medium capitalize">{analysisResult.analysis_type}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <span className="text-gray-500">Response Time:</span>
                          <p className="font-medium">{analysisResult.latency_ms.toFixed(0)}ms</p>
                        </div>
                      </div>
                      
                      {analysisResult.analysis.description && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h3 className="font-medium text-blue-900 mb-2">Content Analysis</h3>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-blue-700">Word Count:</span>
                              <p className="font-medium">{analysisResult.analysis.description.word_count}</p>
                            </div>
                            <div>
                              <span className="text-blue-700">Sentence Count:</span>
                              <p className="font-medium">{analysisResult.analysis.description.sentence_count}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Comparison Tab */}
                  {resultsTab === 'comparison' && (
                    <div className="text-center text-gray-500 py-8">
                      <Eye className="mx-auto h-12 w-12 mb-4" />
                      <p>Compare this image with others using the "Compare Images" feature</p>
                      <p className="text-sm mt-2">Upload multiple images to enable comparison</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Eye className="mx-auto h-12 w-12 mb-4" />
                  <p>Upload an image and click "Analyze Image" to see results</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Image Generation Tab */}
        {activeTab === 'generation' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Image Generation</h2>
              
              {/* Sample Prompts */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sample Prompts
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {samplePrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleSamplePromptSelect(prompt)}
                      className="text-left p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                      <p className="text-sm text-gray-900 line-clamp-2">{prompt}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Generation Prompt
                </label>
                <textarea
                  value={generationPrompt}
                  onChange={(e) => setGenerationPrompt(e.target.value)}
                  placeholder="Describe the image you want to generate..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>

              {/* Generation Options */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Size
                  </label>
                  <select
                    value={imageSize}
                    onChange={(e) => setImageSize(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1024x1024">1024x1024</option>
                    <option value="1792x1024">1792x1024</option>
                    <option value="1024x1792">1024x1792</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality
                  </label>
                  <select
                    value={imageQuality}
                    onChange={(e) => setImageQuality(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="hd">HD</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Images
                  </label>
                  <select
                    value={numImages}
                    onChange={(e) => setNumImages(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Artistic Style
                  </label>
                  <input
                    type="text"
                    value={artisticStyle}
                    onChange={(e) => setArtisticStyle(e.target.value)}
                    placeholder="e.g., oil painting, digital art"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Model Selection */}
              <div className="mb-6">
                <ModelSelector
                  selectedProvider={selectedProvider}
                  setSelectedProvider={setSelectedProvider}
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  availableModels={availableModels}
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleImageGeneration}
                disabled={isGenerating || !generationPrompt.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Palette size={16} />
                    <span>Generate Image</span>
                  </>
                )}
              </button>
            </div>

            {/* Results Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Generated Images</h2>
              
              {generationResult ? (
                <>
                  {/* Results Tabs */}
                  <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-4">
                    <button
                      onClick={() => setResultsTab('response')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        resultsTab === 'response'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <FileText size={16} />
                      <span>Response</span>
                    </button>
                    <button
                      onClick={() => setResultsTab('analytics')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        resultsTab === 'analytics'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <BarChart3 size={16} />
                      <span>Analytics</span>
                    </button>
                    <button
                      onClick={() => setResultsTab('comparison')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        resultsTab === 'comparison'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Eye size={16} />
                      <span>Comparison</span>
                    </button>
                  </div>

                  {/* Response Tab */}
                  {resultsTab === 'response' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        {generationResult.images.map((image, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <img
                              src={`data:image/png;base64,${image.base64}`}
                              alt={`Generated image ${index + 1}`}
                              className="w-full h-64 object-cover rounded mb-3"
                            />
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">
                                {image.size} • {image.seed ? `Seed: ${image.seed}` : 'No seed'}
                              </span>
                              <button
                                onClick={() => downloadImage(image.base64, `generated-image-${index + 1}.png`)}
                                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                              >
                                <Download size={14} />
                                <span>Download</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Analytics Tab */}
                  {resultsTab === 'analytics' && (
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">Generation Info</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Model:</span>
                            <p className="font-medium">{generationResult.model}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Provider:</span>
                            <p className="font-medium">{generationResult.provider}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Prompt:</span>
                            <p className="font-medium truncate">{generationResult.prompt}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Images:</span>
                            <p className="font-medium">{generationResult.images.length}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="font-medium text-blue-900 mb-2">Generation Parameters</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-blue-700">Generation ID:</span>
                            <p className="font-medium font-mono text-xs">{generationResult.generation_id}</p>
                          </div>
                          <div>
                            <span className="text-blue-700">Timestamp:</span>
                            <p className="font-medium">{new Date(generationResult.timestamp * 1000).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Comparison Tab */}
                  {resultsTab === 'comparison' && (
                    <div className="text-center text-gray-500 py-8">
                      <Eye className="mx-auto h-12 w-12 mb-4" />
                      <p>Compare generated images with different models or prompts</p>
                      <p className="text-sm mt-2">Generate multiple images to enable comparison</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Palette className="mx-auto h-12 w-12 mb-4" />
                  <p>Enter a prompt and click "Generate Image" to create new images</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Generated Images Gallery</h2>
            
            {generatedImages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {generatedImages.map((result, resultIndex) => (
                  <div key={resultIndex} className="border rounded-lg overflow-hidden">
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-2 truncate">
                        {result.prompt}
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {result.images.map((image, imageIndex) => (
                          <div key={imageIndex} className="relative group">
                            <img
                              src={`data:image/png;base64,${image.base64}`}
                              alt={`Generated image ${imageIndex + 1}`}
                              className="w-full h-32 object-cover rounded"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                              <button
                                onClick={() => downloadImage(image.base64, `gallery-image-${resultIndex}-${imageIndex}.png`)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white text-gray-900 px-3 py-1 rounded text-sm font-medium"
                              >
                                Download
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 text-xs text-gray-500">
                        {result.model} • {result.images.length} images • {new Date(result.timestamp * 1000).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <ImageIcon className="mx-auto h-12 w-12 mb-4" />
                <p>No generated images yet. Generate some images to see them here!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 