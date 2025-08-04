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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vision AI</h1>
          <p className="text-gray-600">Analyze images and generate new ones using AI vision models</p>
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

        {/* Image Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Image Analysis</h2>
              
              {/* Image Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
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
                        <p className="text-sm text-gray-500">Click to change image</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="text-sm text-gray-600">Click to upload an image</p>
                        <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 20MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

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
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Analysis Summary</h3>
                    <p className="text-gray-700">{analysisResult.raw_response}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Model:</span>
                      <p className="font-medium">{analysisResult.model_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Provider:</span>
                      <p className="font-medium">{analysisResult.model_provider}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <p className="font-medium capitalize">{analysisResult.analysis_type}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Latency:</span>
                      <p className="font-medium">{analysisResult.latency_ms.toFixed(0)}ms</p>
                    </div>
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
                </div>
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