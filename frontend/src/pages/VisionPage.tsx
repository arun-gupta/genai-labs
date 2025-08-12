import React, { useState, useEffect } from 'react';
import { Camera, Upload, Image as ImageIcon, Download, RotateCcw, Eye, Palette, FileText, BarChart3 } from 'lucide-react';
import { apiService } from '../services/api';
import { ModelSelector } from '../components/ModelSelector';
import { ExportOptions } from '../components/ExportOptions';

// Static sample image URLs (from public directory) with cache busting
const timestamp = Date.now();
const businessMeetingImage = `/sample-images/business-meeting.png?t=${timestamp}`;
const natureSceneImage = `/sample-images/nature-scene.png?t=${timestamp}`;
const technologyImage = `/sample-images/technology.png?t=${timestamp}`;

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
    const [activeTab, setActiveTab] = useState<'analysis' | 'generation' | 'storyboard' | 'gallery'>('analysis');

  // Analysis provider state
  const [analysisProvider, setAnalysisProvider] = useState('integrated_diffusion');
  
  // Generation provider state
  const [generationProvider, setGenerationProvider] = useState('integrated_diffusion');
  
  // Storyboard provider state
  const [storyboardProvider, setStoryboardProvider] = useState('integrated_diffusion');

  

  
  // Image Analysis State
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResult | null>(null);
  
  // Image Generation State
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [imageSize, setImageSize] = useState('512x512');
  const [imageQuality, setImageQuality] = useState('standard');
  const [artisticStyle, setArtisticStyle] = useState('');
  const [numImages, setNumImages] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [generationPhase, setGenerationPhase] = useState<'download' | 'load' | 'generate' | 'complete'>('download');
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [generateProgress, setGenerateProgress] = useState<number>(0);
  const [generationResult, setGenerationResult] = useState<ImageGenerationResult | null>(null);
  
  // Integrated Diffusion State
  const [diffusionHealth, setDiffusionHealth] = useState<any>(null);
  
  // Storyboard State
  const [storyPrompt, setStoryPrompt] = useState('');
  const [storyStyle, setStoryStyle] = useState('cinematic');
  const [numPanels, setNumPanels] = useState(3);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [storyProgress, setStoryProgress] = useState<number>(0);
  const [storyPhase, setStoryPhase] = useState<'download' | 'load' | 'generate' | 'complete'>('download');
  const [storyDownloadProgress, setStoryDownloadProgress] = useState<number>(0);
  const [storyLoadProgress, setStoryLoadProgress] = useState<number>(0);
  const [storyGenerateProgress, setStoryGenerateProgress] = useState<number>(0);
  const [storyResult, setStoryResult] = useState<any>(null);
  const [modelStatus, setModelStatus] = useState<'checking' | 'downloaded' | 'not_downloaded' | 'error'>('checking');
  const [showAllPrompts, setShowAllPrompts] = useState(false);
  const [showQuickSettings, setShowQuickSettings] = useState(false);
  const [showAllStoryPrompts, setShowAllStoryPrompts] = useState(false);
  
  // Gallery State
  const [generatedImages, setGeneratedImages] = useState<ImageGenerationResult[]>([]);
  
  // Drag state
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPasteNotification, setShowPasteNotification] = useState(false);
  
  // Results tab state
  const [resultsTab, setResultsTab] = useState<'response' | 'analytics' | 'comparison'>('response');

  // Sample data with static images
  const sampleImages = [
    {
      name: 'Business Meeting',
      description: 'A professional business meeting scene',
      color: '#4F46E5', // Indigo
      image: businessMeetingImage,
      analysisPrompts: [
        'Analyze the business meeting dynamics and professional setting',
        'Describe the corporate environment and team interaction',
        'Identify any presentation materials or business documents visible',
        'Assess the professional atmosphere and workplace culture',
        'Examine the meeting room setup and technology used'
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
      image: natureSceneImage,
      analysisPrompts: [
        'Analyze the natural landscape and environmental elements',
        'Describe the seasonal characteristics and weather conditions',
        'Identify the types of vegetation and geological features',
        'Assess the natural lighting and atmospheric conditions',
        'Examine the composition and depth of the landscape'
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
      image: technologyImage,
      analysisPrompts: [
        'Analyze the technological devices and digital interface elements',
        'Describe the modern workspace and equipment setup',
        'Identify the types of technology and software interfaces visible',
        'Assess the digital environment and connectivity features',
        'Examine the technological aesthetics and user interface design'
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
    'A professional portrait of a confident business person in oil painting style',
    'An underwater scene with colorful coral reefs and fish in watercolor style',
    'A magical forest with glowing mushrooms and fairy lights in anime style',
    'A modern minimalist kitchen with clean lines and natural light',
    'A vintage steam locomotive crossing a mountain bridge',
    'A cyberpunk street scene with neon signs and rain',
    'An abstract representation of music and sound waves',
    'A renaissance-style portrait of a modern tech entrepreneur'
  ];

  const artisticStyles = [
    { value: '', label: 'Default Style' },
    { value: 'photorealistic', label: 'Photorealistic' },
    { value: 'oil painting', label: 'Oil Painting' },
    { value: 'watercolor', label: 'Watercolor' },
    { value: 'digital art', label: 'Digital Art' },
    { value: 'anime', label: 'Anime Style' },
    { value: 'cartoon', label: 'Cartoon' },
    { value: 'sketch', label: 'Pencil Sketch' },
    { value: 'pop art', label: 'Pop Art' },
    { value: 'impressionist', label: 'Impressionist' },
    { value: 'surreal', label: 'Surreal' },
    { value: 'minimalist', label: 'Minimalist' },
    { value: 'vintage', label: 'Vintage' },
    { value: 'cyberpunk', label: 'Cyberpunk' },
    { value: 'steampunk', label: 'Steampunk' },
    { value: 'gothic', label: 'Gothic' },
    { value: 'art deco', label: 'Art Deco' },
    { value: 'pixel art', label: 'Pixel Art' },
    { value: 'abstract', label: 'Abstract' },
    { value: 'renaissance', label: 'Renaissance Style' },
    { value: 'baroque', label: 'Baroque' },
    { value: 'cubist', label: 'Cubist' },
    { value: 'neon', label: 'Neon/Synthwave' },
    { value: 'film noir', label: 'Film Noir' }
  ];

  // Load available models for both analysis and generation
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Check model status for image generation
        try {
          const healthResponse = await apiService.getDiffusionHealth();
          console.log('Health response:', healthResponse);
          if (healthResponse && healthResponse.model_loaded === true) {
            setModelStatus('downloaded');
          } else {
            setModelStatus('not_downloaded');
          }
        } catch (error) {
          console.error('Failed to check model status:', error);
          setModelStatus('error');
        }
      } catch (error) {
        console.error('Failed to load models:', error);
      }
    };
    
    loadModels();
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
      // Clear previous analysis results
      setAnalysisResult(null);
      
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
          
          // Clear previous analysis results
          setAnalysisResult(null);
          
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
        
        // Clear previous analysis results
        setAnalysisResult(null);
        
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
      console.log('Starting analysis for image:', uploadedImage.name, 'Size:', uploadedImage.size);
      console.log('Analysis provider:', analysisProvider);
      
      const imageBytes = await fileToBytes(uploadedImage);
      console.log('Image bytes length:', imageBytes.length);
      
      const result = await apiService.analyzeImage({
        image: imageBytes,
        analysis_type: 'describe', // Default to describe since we removed the dropdown
        model_provider: analysisProvider,
        model_name: analysisProvider === 'openai' ? 'gpt-4o' : 'stable-diffusion-3.5-large',
        custom_prompt: customPrompt || undefined,
        temperature: 0.3
      });
      
      console.log('Analysis result:', result);
      setAnalysisResult(result);
      setResultsTab('response'); // Switch to response tab when results are available
      
      // Update model status if analysis was successful with Stable Diffusion
      if (analysisProvider === 'integrated_diffusion') {
        console.log('Analysis successful with Stable Diffusion, updating model status to downloaded');
        setModelStatus('downloaded');
      }
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
    setGenerationProgress(0);
    setDownloadProgress(0);
    setLoadProgress(0);
    setGenerateProgress(0);
    
    // Check actual model status from backend before deciding phases (only for Stable Diffusion)
    let actualModelStatus = modelStatus;
    if (generationProvider === 'integrated_diffusion') {
      try {
        const healthResponse = await apiService.getDiffusionHealth();
        console.log('Backend health response:', healthResponse);
        actualModelStatus = healthResponse.model_loaded ? 'downloaded' : 'not_downloaded';
        console.log('Actual model status from backend:', actualModelStatus);
      } catch (error) {
        console.error('Failed to check backend model status:', error);
      }
    } else {
      // For OpenAI and GPT-4 Vision, model is always "downloaded" (no local model)
      actualModelStatus = 'downloaded';
    }
    
    // Smart phase detection based on provider and actual model status
    console.log('Generation provider:', generationProvider, 'Current model status:', modelStatus, 'Actual backend status:', actualModelStatus);
    let startPhase: 'download' | 'generate';
    if (generationProvider === 'openai' || generationProvider === 'gpt-vision') {
      // OpenAI and GPT-4 Vision don't need download/load phases
      startPhase = 'generate';
    } else {
      // Stable Diffusion needs download/load phases
      startPhase = actualModelStatus === 'downloaded' ? 'generate' : 'download';
    }
    console.log('Starting generation phase:', startPhase);
    setGenerationPhase(startPhase);
    
    // Track completion with local variables
    let downloadComplete = false;
    let loadComplete = false;
    
    // Phase 1: Model Download (0-100%) - skip if model already loaded
    let downloadInterval: number | null = null;
    if (startPhase === 'download') {
      downloadInterval = setInterval(() => {
        setDownloadProgress(prev => {
          const newProgress = Math.min(prev + Math.random() * 3, 100);
          if (newProgress >= 100) {
            clearInterval(downloadInterval!);
            downloadComplete = true;
            setGenerationPhase('load');
            // Start load phase immediately after download completes
            setTimeout(() => startLoadPhase(), 100);
            return 100;
          }
          return newProgress;
        });
      }, 200);
    } else {
      // Model already loaded or using OpenAI, skip both download and load phases
      setDownloadProgress(100);
      setLoadProgress(100);
      downloadComplete = true;
      loadComplete = true;
      setGenerationPhase('generate');
      // Start generate phase immediately
      setTimeout(() => startGeneratePhase(), 100);
    }

    // Phase 2: Model Loading (0-100%) - only start after download is complete
    let loadInterval: number | null = null;
    const startLoadPhase = () => {
      loadInterval = setInterval(() => {
        setLoadProgress(prev => {
          const newProgress = Math.min(prev + Math.random() * 2, 100);
          if (newProgress >= 100) {
            clearInterval(loadInterval!);
            loadComplete = true;
            setGenerationPhase('generate');
            // Start generate phase immediately after load completes
            setTimeout(() => startGeneratePhase(), 100);
            return 100;
          }
          return newProgress;
        });
      }, 300);
    };

    // Phase 3: Image Generation (0-100%) - only start after load is complete
    let generateInterval: number | null = null;
    const startGeneratePhase = () => {
      // Start with a much slower progress to better simulate actual generation time
      generateInterval = setInterval(() => {
        setGenerateProgress(prev => {
          // Much slower progress that better reflects real Stable Diffusion generation time
          // Start very slow, then slightly faster in the middle, then slow again at the end
          let increment;
          if (prev < 30) {
            // Very slow at the beginning (model initialization)
            increment = 0.1;
          } else if (prev < 70) {
            // Slightly faster in the middle (actual generation)
            increment = 0.3;
          } else {
            // Slow again at the end (final processing)
            increment = 0.15;
          }
          const newProgress = Math.min(prev + increment, 85); // Cap at 85% instead of 95%
          return newProgress;
        });
      }, 500); // Slower interval (500ms instead of 200ms)
    };

    // Start generate phase after load completes
    const checkLoadComplete = setInterval(() => {
      if (loadComplete) {
        clearInterval(checkLoadComplete);
        startGeneratePhase();
      }
    }, 100);

    try {
      const result = await apiService.generateImage({
        prompt: generationPrompt,
        model_provider: generationProvider,
        model_name: generationProvider === 'openai' ? 'dall-e-3' : generationProvider === 'gpt-vision' ? 'gpt-4o' : 'stable-diffusion-3.5-large',
        size: imageSize,
        quality: imageQuality,
        style: artisticStyle || undefined,
        num_images: numImages,
        temperature: 0.7
      });
      
      // Complete the generation progress when API actually finishes
      if (generateInterval) clearInterval(generateInterval);
      setGenerateProgress(100);
      setGenerationPhase('complete');
      setGenerationResult(result);
      setGeneratedImages(prev => [result, ...prev]);
      setResultsTab('response'); // Switch to response tab when results are available
      
      // Update model status since generation was successful
      setModelStatus('downloaded');
      console.log('Generation successful, model status updated to downloaded');
    } catch (error) {
      console.error('Image generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (errorMessage.includes('Ollama image generation not yet implemented')) {
        alert('Ollama image generation is not yet supported. Please use OpenAI (DALL-E) or Anthropic for image generation.');
      } else {
        alert(`Image generation failed: ${errorMessage}. Please try again.`);
      }
    } finally {
      if (downloadInterval) clearInterval(downloadInterval);
      if (loadInterval) clearInterval(loadInterval);
      if (generateInterval) clearInterval(generateInterval);
      setIsGenerating(false);
      setGenerationProgress(0);
      setDownloadProgress(0);
      setLoadProgress(0);
      setGenerateProgress(0);
      setGenerationPhase('download');
    }
  };

  const handleStoryboardGeneration = async () => {
    if (!storyPrompt.trim()) {
      alert('Please enter a story prompt for storyboard generation');
      return;
    }

    // Warn user about long generation time for storyboards
    if (numPanels > 3) {
      const confirmed = confirm(`🎬 Storyboard Generation Notice:\n\n• ${numPanels} panels will be generated\n• Estimated time: 10-15 minutes\n• Each panel takes 2-3 minutes to generate\n• The process cannot be interrupted\n• You can leave this page open and check back\n\nThis is normal for AI image generation. Continue?`);
      if (!confirmed) {
        return;
      }
    } else if (numPanels > 1) {
      const confirmed = confirm(`🎬 Storyboard Generation Notice:\n\n• ${numPanels} panels will be generated\n• Estimated time: 5-10 minutes\n• Each panel takes 2-3 minutes to generate\n• The process cannot be interrupted\n• You can leave this page open and check back\n\nThis is normal for AI image generation. Continue?`);
      if (!confirmed) {
        return;
      }
    } else {
      const confirmed = confirm(`🎬 Storyboard Generation Notice:\n\n• 1 panel will be generated\n• Estimated time: 2-3 minutes\n• The process cannot be interrupted\n• You can leave this page open and check back\n\nThis is normal for AI image generation. Continue?`);
      if (!confirmed) {
        return;
      }
    }

    setIsGeneratingStory(true);
    setStoryProgress(0);
    setStoryDownloadProgress(0);
    setStoryLoadProgress(0);
    setStoryGenerateProgress(0);
    setStoryResult(null); // Clear previous storyboard results
    
    // Smart phase detection based on model status and provider
    let startPhase: 'download' | 'load' | 'generate';
    if (storyboardProvider === 'integrated_diffusion') {
      // Check actual model status from backend for Stable Diffusion
      try {
        const healthCheck = await apiService.getDiffusionHealth();
        const actualModelStatus = healthCheck.model_loaded ? 'downloaded' : 'not_downloaded';
        startPhase = actualModelStatus === 'downloaded' ? 'load' : 'download';
      } catch (error) {
        // Fallback to current model status if health check fails
        startPhase = modelStatus === 'downloaded' ? 'load' : 'download';
      }
    } else {
      // Skip download/load for cloud providers
      startPhase = 'generate';
    }
    setStoryPhase(startPhase);
    
    // Track completion with local variables
    let downloadComplete = false;
    let loadComplete = false;
    
    // Phase 1: Model Download (0-100%) - skip if model already loaded or cloud provider
    let downloadInterval: number | null = null;
    if (startPhase === 'download' && storyboardProvider === 'integrated_diffusion') {
      downloadInterval = setInterval(() => {
        setStoryDownloadProgress(prev => {
          const newProgress = Math.min(prev + Math.random() * 2, 100);
          if (newProgress >= 100) {
            clearInterval(downloadInterval!);
            downloadComplete = true;
            setStoryPhase('load');
            // Start load phase immediately after download completes
            setTimeout(() => startLoadPhase(), 100);
            return 100;
          }
          return newProgress;
        });
      }, 500);
    } else {
      // Model already loaded or cloud provider, skip download phase
      setStoryDownloadProgress(100);
      downloadComplete = true;
      if (storyboardProvider === 'integrated_diffusion') {
        setStoryPhase('load');
        // Start load phase immediately
        setTimeout(() => startLoadPhase(), 100);
      } else {
        setStoryPhase('generate');
        // Start generate phase immediately for cloud providers
        setTimeout(() => startGeneratePhase(), 100);
      }
    }

    // Phase 2: Model Loading (0-100%) - only start after download is complete and only for local models
    let loadInterval: number | null = null;
    const startLoadPhase = () => {
      if (storyboardProvider !== 'integrated_diffusion') {
        // Skip load phase for cloud providers
        setStoryLoadProgress(100);
        loadComplete = true;
        setStoryPhase('generate');
        setTimeout(() => startGeneratePhase(), 100);
        return;
      }
      
      loadInterval = setInterval(() => {
        setStoryLoadProgress(prev => {
          const newProgress = Math.min(prev + Math.random() * 1.5, 100);
          if (newProgress >= 100) {
            clearInterval(loadInterval!);
            loadComplete = true;
            setStoryPhase('generate');
            // Start generate phase immediately after load completes
            setTimeout(() => startGeneratePhase(), 100);
            return 100;
          }
          return newProgress;
        });
      }, 700);
    };

    // Phase 3: Storyboard Generation (0-100%) - only start after load is complete
    let generateInterval: number | null = null;
    const startGeneratePhase = () => {
      // Start with a much slower progress to better simulate actual generation time
      generateInterval = setInterval(() => {
        setStoryGenerateProgress(prev => {
          // Much slower progress that better reflects real Stable Diffusion generation time
          // Start very slow, then slightly faster in the middle, then slow again at the end
          let increment;
          if (prev < 30) {
            // Very slow at the beginning (model initialization)
            increment = 0.15;
          } else if (prev < 70) {
            // Slightly faster in the middle (actual generation)
            increment = 0.3;
          } else {
            // Slow again at the end (final processing)
            increment = 0.2;
          }
          const newProgress = Math.min(prev + increment, 90); // Cap at 90% to leave room for completion
          return newProgress;
        });
      }, 500); // Slightly faster interval for better responsiveness
    };

    try {
      // Add a longer timeout for storyboard generation since it generates multiple images
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Storyboard generation timed out - this can take 10+ minutes for multiple images')), 900000); // 15 minutes timeout
      });
      
      const result = await Promise.race([
        apiService.generateStoryboard({
          story_prompt: storyPrompt,
          style: storyStyle || undefined,
          num_panels: numPanels,
          provider: storyboardProvider
        }),
        timeoutPromise
      ]);
      
      // Complete the generation progress when API actually finishes
      if (generateInterval) clearInterval(generateInterval);
      setStoryGenerateProgress(100);
      setStoryPhase('complete');
      setStoryResult(result);
      console.log('Storyboard result:', result); // Debug log
      
      // Add storyboard images to gallery
      if (result && result.panels && Array.isArray(result.panels)) {
        // Convert storyboard panels to gallery format
        const galleryEntry: ImageGenerationResult = {
          provider: result.model || storyboardProvider,
          model: result.model || 'stable-diffusion-xl-base-1.0',
          prompt: result.story_prompt,
          images: result.panels.map((panel: any) => ({
            base64: panel.image_data,
            size: '384x384',
            url: undefined
          })),
          generation_id: `storyboard-${Date.now()}`,
          timestamp: Date.now()
        };
        setGeneratedImages(prev => [galleryEntry, ...prev]);
      }
      
      setResultsTab('response'); // Switch to response tab when results are available
      
      // Update model status if using Stable Diffusion
      if (result.provider === 'integrated_diffusion') {
        setModelStatus('downloaded');
        console.log('Storyboard generation successful, model status updated to downloaded');
      }
    } catch (error) {
      console.error('Storyboard generation failed:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to generate storyboard. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('timed out')) {
          errorMessage = `⏰ Storyboard Generation Timeout:\n\n• The generation took longer than 15 minutes\n• This can happen with ${numPanels} panels\n• The images may still be generating in the background\n• Try with fewer panels (1-2) for faster results\n• Check back in a few minutes to see if it completed`;
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = '🌐 Network Error:\n\n• Connection lost during storyboard generation\n• Please check your internet connection\n• Try again when connection is stable';
        } else {
          errorMessage = `❌ Storyboard Generation Failed:\n\n• Error: ${error.message}\n• Please try again\n• If the problem persists, try with fewer panels`;
        }
      }
      
      alert(errorMessage);
    } finally {
      if (downloadInterval) clearInterval(downloadInterval);
      if (loadInterval) clearInterval(loadInterval);
      if (generateInterval) clearInterval(generateInterval);
      setIsGeneratingStory(false);
      setStoryProgress(0);
      setStoryDownloadProgress(0);
      setStoryLoadProgress(0);
      setStoryGenerateProgress(0);
      setStoryPhase('download');
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

  // Helper function to adjust color brightness (for fallback)
  const adjustBrightness = (hex: string, percent: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  };

  // Handle sample image selection
  const handleSampleImageSelect = (sampleImage: any) => {
    // Clear previous analysis results
    setAnalysisResult(null);
    
    // Use the static image
    setImagePreview(sampleImage.image);
    
    // Convert the image URL to a File object for analysis
    fetch(sampleImage.image)
      .then(response => response.blob())
      .then(blob => {
        const file = new File([blob], `${sampleImage.name.toLowerCase().replace(' ', '-')}.png`, { type: 'image/png' });
        setUploadedImage(file);
      })
      .catch(error => {
        console.error('Error loading sample image:', error);
      });
  };

  // Handle sample prompt selection
  const handleSamplePromptSelect = (prompt: string) => {
    setGenerationPrompt(prompt);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Vision AI</h1>
          </div>
          <p className="text-gray-600">Analyze images, generate new ones, and create storyboards using advanced AI vision models</p>
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
            <span>Analysis</span>
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
            <span>Generation</span>
          </button>
          <button
            onClick={() => setActiveTab('storyboard')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'storyboard'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FileText size={16} />
            <span>Storyboard</span>
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
              <h2 className="text-xl font-semibold mb-4">Analysis</h2>
              
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
                      <div className="w-full h-20 rounded mb-2 overflow-hidden">
                        <img
                          src={sampleImage.image}
                          alt={sampleImage.name}
                          className="w-full h-full object-cover"
                        />
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
                    Image-Specific Analysis Prompts
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



              {/* General Sample Analysis Prompts */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sample Prompts
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    'Describe the main elements and composition of this image',
                    'What is the overall mood and atmosphere?',
                    'Analyze the colors, lighting, and visual style',
                    'Extract any text or readable content from this image',
                    'Provide a comprehensive technical analysis of this image'
                  ].map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setCustomPrompt(prompt)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                      <p className="text-sm text-gray-900">{prompt}</p>
                    </button>
                  ))}
                </div>
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

              {/* Analysis Model Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Pick a Model
                </label>
                <div className="space-y-3">
                  {/* GPT-4 Vision Option */}
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      analysisProvider === 'openai' 
                        ? 'border-blue-300 bg-blue-50' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => setAnalysisProvider('openai')}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">
                            GPT-4 Vision
                          </h4>
                          {analysisProvider === 'openai' && (
                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Best for text extraction, detailed descriptions, and complex reasoning.
                        </p>
                        <div className="mt-2 text-xs text-gray-500">
                          <strong>Model:</strong> gpt-4o
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stable Diffusion Option */}
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      analysisProvider === 'integrated_diffusion' 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => setAnalysisProvider('integrated_diffusion')}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">
                            Stable Diffusion
                          </h4>
                          {analysisProvider === 'integrated_diffusion' && (
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Best for style analysis, visual composition, and artistic characteristics.
                        </p>
                        <div className="mt-2 text-xs text-gray-500">
                          <strong>Model:</strong> stable-diffusion-3.5-large
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
                              <h2 className="text-xl font-semibold mb-4">Response</h2>
              
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
                      
                      {/* Dominant Colors Section */}
                      {analysisResult.analysis.dominant_colors && analysisResult.analysis.dominant_colors.length > 0 && (
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900 mb-3">Dominant Colors</h3>
                          <div className="flex flex-wrap gap-3">
                            {analysisResult.analysis.dominant_colors.map((color: any, index: number) => (
                              <div key={index} className={`flex items-center space-x-2 bg-white rounded-lg p-2 shadow-sm ${color.significant ? 'ring-2 ring-yellow-300' : ''}`}>
                                <div 
                                  className="w-8 h-8 rounded border border-gray-200"
                                  style={{ backgroundColor: color.hex }}
                                  title={`${color.name} (${color.hex}) - ${color.percentage.toFixed(1)}%`}
                                ></div>
                                <div className="text-xs">
                                  <div className="font-medium text-gray-900">{color.name}</div>
                                  <div className="font-mono text-gray-600">{color.hex}</div>
                                  <div className="text-gray-500">{color.percentage.toFixed(1)}%</div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-sm text-gray-600 mt-2">
                            Top {analysisResult.analysis.dominant_colors.length} colors extracted from the image
                          </p>
                        </div>
                      )}
                      
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
                    <div className="space-y-6">
                      {/* Performance Metrics */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                        <h3 className="font-medium text-blue-900 mb-3 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Performance Metrics
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <span className="text-gray-500 text-xs">Model</span>
                            <p className="font-medium text-blue-900">{analysisResult.model_name}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <span className="text-gray-500 text-xs">Provider</span>
                            <p className="font-medium text-blue-900 capitalize">{analysisResult.model_provider}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <span className="text-gray-500 text-xs">Analysis Type</span>
                            <p className="font-medium text-blue-900 capitalize">{analysisResult.analysis_type}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <span className="text-gray-500 text-xs">Response Time</span>
                            <p className="font-medium text-blue-900">
                              {analysisResult.latency_ms > 1000 
                                ? `${(analysisResult.latency_ms / 1000).toFixed(1)}s` 
                                : `${analysisResult.latency_ms.toFixed(0)}ms`}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Image Technical Analysis - For Stable Diffusion */}
                      {analysisResult.model_provider === 'integrated_diffusion' && analysisResult.analysis && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                          <h3 className="font-medium text-green-900 mb-3 flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                            Image Technical Analysis
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            {analysisResult.analysis.analysis?.content_description && (
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <span className="text-gray-500 text-xs">Format & Size</span>
                                <p className="font-medium text-green-900 text-xs">
                                  {analysisResult.analysis.analysis.content_description.match(/\((\d+x\d+)\s+pixels/)?.[1] || 'Unknown'}
                                </p>
                              </div>
                            )}
                            {analysisResult.analysis.analysis?.content_description && (
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <span className="text-gray-500 text-xs">Orientation</span>
                                <p className="font-medium text-green-900 text-xs">
                                  {analysisResult.analysis.analysis.content_description.match(/(landscape|portrait|square)/i)?.[1] || 'Unknown'}
                                </p>
                              </div>
                            )}
                            {analysisResult.analysis.analysis?.content_description && (
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <span className="text-gray-500 text-xs">Color Profile</span>
                                <p className="font-medium text-green-900 text-xs">
                                  {analysisResult.analysis.analysis.content_description.match(/(colorful|muted)/i)?.[1] || 'Unknown'}
                                </p>
                              </div>
                            )}
                            {analysisResult.analysis.analysis?.content_description && (
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <span className="text-gray-500 text-xs">Brightness</span>
                                <p className="font-medium text-green-900 text-xs">
                                  {analysisResult.analysis.analysis.content_description.match(/(bright|dark|moderate)/i)?.[1] || 'Unknown'}
                                </p>
                              </div>
                            )}
                            {analysisResult.analysis.analysis?.content_description && (
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <span className="text-gray-500 text-xs">Contrast Level</span>
                                <p className="font-medium text-green-900 text-xs">
                                  {analysisResult.analysis.analysis.content_description.match(/(high|moderate|low)\s+contrast/i)?.[1] || 'Unknown'}
                                </p>
                              </div>
                            )}
                            {analysisResult.analysis.analysis?.content_description && (
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <span className="text-gray-500 text-xs">Image Type</span>
                                <p className="font-medium text-green-900 text-xs">
                                  {analysisResult.analysis.analysis.content_description.match(/Image analysis reveals.*?(\w+)\s+format/i)?.[1] || 'Unknown'}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Content Analysis - For OpenAI */}
                      {analysisResult.model_provider === 'openai' && analysisResult.analysis && (
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                          <h3 className="font-medium text-purple-900 mb-3 flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                            Content Analysis
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            {analysisResult.analysis.description?.word_count && (
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <span className="text-gray-500 text-xs">Word Count</span>
                                <p className="font-medium text-purple-900">{analysisResult.analysis.description.word_count}</p>
                              </div>
                            )}
                            {analysisResult.analysis.description?.sentence_count && (
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <span className="text-gray-500 text-xs">Sentence Count</span>
                                <p className="font-medium text-purple-900">{analysisResult.analysis.description.sentence_count}</p>
                              </div>
                            )}
                            {analysisResult.analysis.description?.readability_score && (
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <span className="text-gray-500 text-xs">Readability</span>
                                <p className="font-medium text-purple-900">{analysisResult.analysis.description.readability_score}</p>
                              </div>
                            )}
                            {analysisResult.analysis.description?.sentiment && (
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <span className="text-gray-500 text-xs">Sentiment</span>
                                <p className="font-medium text-purple-900 capitalize">{analysisResult.analysis.description.sentiment}</p>
                              </div>
                            )}
                            {analysisResult.analysis.description?.key_topics && (
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <span className="text-gray-500 text-xs">Key Topics</span>
                                <p className="font-medium text-purple-900 text-xs">
                                  {Array.isArray(analysisResult.analysis.description.key_topics) 
                                    ? analysisResult.analysis.description.key_topics.slice(0, 3).join(', ')
                                    : analysisResult.analysis.description.key_topics}
                                </p>
                              </div>
                            )}
                            {analysisResult.analysis.description?.language && (
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <span className="text-gray-500 text-xs">Language</span>
                                <p className="font-medium text-purple-900">{analysisResult.analysis.description.language}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Dominant Colors - For Stable Diffusion */}
                      {analysisResult.model_provider === 'integrated_diffusion' && analysisResult.analysis?.analysis?.dominant_colors && (
                        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4">
                          <h3 className="font-medium text-orange-900 mb-3 flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                            Dominant Colors
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {analysisResult.analysis.analysis.dominant_colors.slice(0, 8).map((color: any, index: number) => (
                              <div key={index} className="bg-white rounded-lg p-3 shadow-sm">
                                <div className="flex items-center space-x-2 mb-1">
                                  <div 
                                    className="w-4 h-4 rounded border border-gray-300"
                                    style={{ backgroundColor: color.hex }}
                                  ></div>
                                  <span className="text-xs font-medium text-orange-900">{color.name}</span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {color.hex} ({color.percentage}%)
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Analysis Quality Metrics */}
                      <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
                          </svg>
                          Analysis Quality
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <span className="text-gray-500 text-xs">Analysis Depth</span>
                            <p className="font-medium text-gray-900">
                              {analysisResult.model_provider === 'openai' ? 'High' : 'Technical'}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <span className="text-gray-500 text-xs">Processing Speed</span>
                            <p className="font-medium text-gray-900">
                              {analysisResult.latency_ms < 2000 ? 'Fast' : analysisResult.latency_ms < 5000 ? 'Medium' : 'Slow'}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <span className="text-gray-500 text-xs">Model Capability</span>
                            <p className="font-medium text-gray-900">
                              {analysisResult.model_name.includes('gpt-4') ? 'Advanced' : 'Specialized'}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <span className="text-gray-500 text-xs">Analysis Type</span>
                            <p className="font-medium text-gray-900 capitalize">
                              {analysisResult.analysis_type === 'describe' ? 'Comprehensive' : analysisResult.analysis_type}
                            </p>
                          </div>
                        </div>
                      </div>
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
              <h2 className="text-xl font-semibold mb-4">Generation</h2>
              
              {/* Prompt Input - Moved to top */}
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



              {/* Sample Prompts - Moved after prompt input */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Sample Prompts
                  </label>
                  <button
                    onClick={() => setShowAllPrompts(!showAllPrompts)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {showAllPrompts ? 'Show Less' : 'Show More'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(showAllPrompts ? samplePrompts : samplePrompts.slice(0, 6)).map((prompt, index) => (
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

              {/* Quick Settings */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Quick Settings
                  </label>
                  <button
                    onClick={() => setShowQuickSettings(!showQuickSettings)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {showQuickSettings ? 'Hide Settings' : 'Show Settings'}
                  </button>
                </div>
                
                {showQuickSettings && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Image Size
                        </label>
                        <select
                          value={imageSize}
                          onChange={(e) => setImageSize(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="512x512">512x512 (Recommended)</option>
                          <option value="768x768">768x768</option>
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

                    <div className="grid grid-cols-2 gap-4">
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
                        <select
                          value={artisticStyle}
                          onChange={(e) => setArtisticStyle(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {artisticStyles.map((style) => (
                            <option key={style.value} value={style.value}>
                              {style.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Model Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pick a Model
                </label>
                <div className="space-y-3">
                  {/* GPT-4 Vision Option */}
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      generationProvider === 'gpt-vision' 
                        ? 'border-blue-300 bg-blue-50' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => setGenerationProvider('gpt-vision')}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">
                            GPT-4 Vision
                          </h4>
                          {generationProvider === 'gpt-vision' && (
                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Best for creative image generation with excellent prompt understanding.
                        </p>
                        <div className="mt-2 text-xs text-gray-500">
                          <strong>Model:</strong> gpt-4o
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stable Diffusion Option */}
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      generationProvider === 'integrated_diffusion' 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => setGenerationProvider('integrated_diffusion')}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">
                            Stable Diffusion
                          </h4>
                          {generationProvider === 'integrated_diffusion' && (
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Best for style analysis, visual composition, and artistic characteristics.
                        </p>
                        <div className="mt-2 text-xs text-gray-500">
                          <strong>Model:</strong> stable-diffusion-3.5-large
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
              
              {/* Progress Bars */}
              {isGenerating && (
                <div className="mt-4 space-y-4">
                  {/* Phase Indicators */}
                  <div className="flex justify-between text-xs text-gray-500">
                    {generationProvider === 'integrated_diffusion' && (
                      <>
                        <div className={`flex items-center space-x-1 ${generationPhase === 'download' ? 'text-purple-600 font-medium' : ''}`}>
                          <div className={`w-2 h-2 rounded-full ${generationPhase === 'download' ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
                          <span>Download</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${generationPhase === 'load' ? 'text-purple-600 font-medium' : ''}`}>
                          <div className={`w-2 h-2 rounded-full ${generationPhase === 'load' ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
                          <span>Load</span>
                        </div>
                      </>
                    )}
                    <div className={`flex items-center space-x-1 ${generationPhase === 'generate' ? 'text-purple-600 font-medium' : ''}`}>
                      <div className={`w-2 h-2 rounded-full ${generationPhase === 'generate' ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
                      <span>Generate</span>
                    </div>
                  </div>
                  
                  {/* Download Progress Bar */}
                  <div className={`transition-opacity duration-300 ${generationPhase === 'download' ? 'opacity-100' : 'opacity-60'}`}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>📥 Downloading Model</span>
                      <span>{Math.round(downloadProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${downloadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Load Progress Bar */}
                  <div className={`transition-opacity duration-300 ${generationPhase === 'load' ? 'opacity-100' : 'opacity-60'}`}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>⚙️ Loading Model</span>
                      <span>{Math.round(loadProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${loadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Generate Progress Bar */}
                  <div className={`transition-opacity duration-300 ${generationPhase === 'generate' ? 'opacity-100' : 'opacity-60'}`}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>🎨 Generating Image</span>
                      <span>{Math.round(generateProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${generateProgress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Phase Description */}
                  <div className="text-xs text-gray-500">
                    {generationPhase === 'download' && (
                      <span>Downloading Stable Diffusion model (~4GB)...</span>
                    )}
                    {generationPhase === 'load' && (
                      <span>Loading model into memory...</span>
                    )}
                    {generationPhase === 'generate' && (
                      <span>Generating your image...</span>
                    )}
                    {generationPhase === 'complete' && (
                      <span>✅ Image generation complete!</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Results Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                              <h2 className="text-xl font-semibold mb-4">Response</h2>
              
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

        {/* Storyboard Tab */}
        {activeTab === 'storyboard' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Storyboard Generation</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Input Section */}
              <div className="space-y-6">
                {/* Story Prompt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Story Prompt
                  </label>
                  <textarea
                    value={storyPrompt}
                    onChange={(e) => setStoryPrompt(e.target.value)}
                    placeholder="Describe your story... e.g., 'A detective investigates a mysterious case in a neon-lit city'"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                </div>

                {/* Sample Story Prompts */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Sample Prompts
                    </label>
                    <button
                      onClick={() => setShowAllStoryPrompts(!showAllStoryPrompts)}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      {showAllStoryPrompts ? 'Show Less' : 'Show More'}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {[
                      "A detective investigates a mysterious case in a neon-lit city",
                      "A young wizard discovers their magical powers in an ancient forest",
                      "A space explorer encounters an alien civilization on a distant planet",
                      "A chef creates a masterpiece dish in a bustling kitchen"
                    ].slice(0, showAllStoryPrompts ? undefined : 4).map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => setStoryPrompt(prompt)}
                        className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-sm text-gray-700 transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                    {!showAllStoryPrompts && (
                      <div className="text-xs text-gray-500 text-center py-2">
                        + 4 more prompts available
                      </div>
                    )}
                    {showAllStoryPrompts && (
                      <>
                        <button
                          onClick={() => setStoryPrompt("A robot learns to paint in a post-apocalyptic art studio")}
                          className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-sm text-gray-700 transition-colors"
                        >
                          A robot learns to paint in a post-apocalyptic art studio
                        </button>
                        <button
                          onClick={() => setStoryPrompt("A time traveler visits different historical periods")}
                          className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-sm text-gray-700 transition-colors"
                        >
                          A time traveler visits different historical periods
                        </button>
                        <button
                          onClick={() => setStoryPrompt("A musician finds inspiration in a magical music shop")}
                          className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-sm text-gray-700 transition-colors"
                        >
                          A musician finds inspiration in a magical music shop
                        </button>
                        <button
                          onClick={() => setStoryPrompt("A superhero's origin story in a modern metropolis")}
                          className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-sm text-gray-700 transition-colors"
                        >
                          A superhero's origin story in a modern metropolis
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Story Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Story Style
                  </label>
                  <select
                    value={storyStyle}
                    onChange={(e) => setStoryStyle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cinematic">Cinematic</option>
                    <option value="anime">Anime</option>
                    <option value="cartoon">Cartoon</option>
                    <option value="photorealistic">Photorealistic</option>
                    <option value="oil_painting">Oil Painting</option>
                    <option value="digital_art">Digital Art</option>
                  </select>
                </div>

                {/* Number of Panels */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Panels
                  </label>
                  <select
                    value={numPanels}
                    onChange={(e) => setNumPanels(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={3}>3 Panels</option>
                    <option value={4}>4 Panels</option>
                    <option value={5}>5 Panels</option>
                    <option value={6}>6 Panels</option>
                  </select>
                </div>

                {/* Pick a Model */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Pick a Model
                  </label>
                  <div className="space-y-3">
                    {/* GPT-4 Vision Option */}
                    <div 
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        storyboardProvider === 'gpt-vision' 
                          ? 'border-blue-300 bg-blue-50' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => setStoryboardProvider('gpt-vision')}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">
                              GPT-4 Vision
                            </h4>
                            {storyboardProvider === 'gpt-vision' && (
                              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Best for creative storyboard generation with excellent prompt understanding.
                          </p>
                          <div className="mt-2 text-xs text-gray-500">
                            <strong>Model:</strong> gpt-4o
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stable Diffusion Option */}
                    <div 
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        storyboardProvider === 'integrated_diffusion' 
                          ? 'border-green-300 bg-green-50' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => setStoryboardProvider('integrated_diffusion')}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">
                              Stable Diffusion
                            </h4>
                            {storyboardProvider === 'integrated_diffusion' && (
                              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Best for style analysis, visual composition, and artistic characteristics.
                          </p>
                          <div className="mt-2 text-xs text-gray-500">
                            <strong>Model:</strong> stable-diffusion-3.5-large
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Generation Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">⏱️ Generation Time Expectations:</p>
                      <ul className="text-xs space-y-1">
                        <li>• <strong>1 panel:</strong> 2-3 minutes</li>
                        <li>• <strong>3 panels:</strong> 6-9 minutes</li>
                        <li>• <strong>5 panels:</strong> 10-15 minutes</li>
                        <li>• You can leave this page open and check back</li>
                        <li>• The process cannot be interrupted once started</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleStoryboardGeneration}
                  disabled={isGeneratingStory || !storyPrompt.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingStory ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating Storyboard...</span>
                    </>
                  ) : (
                    <>
                      <FileText size={16} />
                      <span>Generate Storyboard</span>
                    </>
                  )}
                </button>
                
                {/* Storyboard Progress Bars */}
                {isGeneratingStory && (
                  <div className="mt-4 space-y-4">
                    {/* Phase Indicators */}
                    <div className="flex justify-between text-xs text-gray-500">
                      {storyboardProvider === 'integrated_diffusion' && (
                        <>
                          <div className={`flex items-center space-x-1 ${storyPhase === 'download' ? 'text-indigo-600 font-medium' : ''}`}>
                            <div className={`w-2 h-2 rounded-full ${storyPhase === 'download' ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                            <span>Download</span>
                          </div>
                          <div className={`flex items-center space-x-1 ${storyPhase === 'load' ? 'text-indigo-600 font-medium' : ''}`}>
                            <div className={`w-2 h-2 rounded-full ${storyPhase === 'load' ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                            <span>Load</span>
                          </div>
                        </>
                      )}
                      <div className={`flex items-center space-x-1 ${storyPhase === 'generate' ? 'text-indigo-600 font-medium' : ''}`}>
                        <div className={`w-2 h-2 rounded-full ${storyPhase === 'generate' ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                        <span>Generate</span>
                      </div>
                    </div>
                    
                    {/* Download Progress Bar - Only for Stable Diffusion */}
                    {storyboardProvider === 'integrated_diffusion' && (
                      <div className={`transition-opacity duration-300 ${storyPhase === 'download' ? 'opacity-100' : 'opacity-60'}`}>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>📥 Downloading Model</span>
                          <span>{Math.round(storyDownloadProgress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${storyDownloadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {/* Load Progress Bar - Only for Stable Diffusion */}
                    {storyboardProvider === 'integrated_diffusion' && (
                      <div className={`transition-opacity duration-300 ${storyPhase === 'load' ? 'opacity-100' : 'opacity-60'}`}>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>⚙️ Loading Model</span>
                          <span>{Math.round(storyLoadProgress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${storyLoadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {/* Generate Progress Bar */}
                    <div className={`transition-opacity duration-300 ${storyPhase === 'generate' ? 'opacity-100' : 'opacity-60'}`}>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>🎬 Generating Storyboard</span>
                        <span>{Math.round(storyGenerateProgress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${storyGenerateProgress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Phase Description */}
                    <div className="text-xs text-gray-500">
                      {storyPhase === 'download' && storyboardProvider === 'integrated_diffusion' && (
                        <span>Downloading Stable Diffusion model (~4GB)...</span>
                      )}
                      {storyPhase === 'load' && storyboardProvider === 'integrated_diffusion' && (
                        <span>Loading model into memory... (This may be skipped if model is already loaded from previous operations)</span>
                      )}
                      {storyPhase === 'generate' && (
                        <span>🎬 Generating {numPanels} storyboard panels... Each panel takes 2-3 minutes. Please be patient!</span>
                      )}
                      {storyPhase === 'complete' && (
                        <span>✅ Storyboard generation complete!</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Results Section */}
              <div className="space-y-6">
                                  <h3 className="text-lg font-medium text-gray-900">Response</h3>
                
                {storyResult ? (
                  <div className="space-y-4">
                    {storyResult.panels?.map((panel: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
                            Panel {panel.panel_number}
                          </span>
                        </div>
                        {panel.image_data ? (
                          <img
                            src={`data:image/png;base64,${panel.image_data}`}
                            alt={`Panel ${panel.panel_number}`}
                            className="w-full h-40 object-contain rounded mb-2 bg-gray-100"
                          />
                        ) : panel.url ? (
                          <img
                            src={panel.url}
                            alt={`Panel ${panel.panel_number}`}
                            className="w-full h-40 object-contain rounded mb-2 bg-gray-100"
                          />
                        ) : (
                          <div className="w-full h-40 bg-gray-200 rounded mb-2 flex items-center justify-center">
                            <span className="text-gray-500">Image not available</span>
                          </div>
                        )}
                        <p className="text-sm text-gray-600">{panel.prompt}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <FileText className="mx-auto h-12 w-12 mb-4" />
                    <p>Enter a story prompt and click "Generate Storyboard" to create a visual narrative</p>
                    <p className="text-sm mt-2">Perfect for storytelling, concept development, and visual planning</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-semibold mb-4">Response Gallery</h2>
            
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
                            {image && image.base64 ? (
                              <img
                                src={`data:image/png;base64,${image.base64}`}
                                alt={`Generated image ${imageIndex + 1}`}
                                className="w-full h-32 object-contain rounded bg-gray-100"
                              />
                            ) : (
                              <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center">
                                <span className="text-gray-500 text-xs">Image not available</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                              {image && image.base64 && (
                                <button
                                  onClick={() => downloadImage(image.base64, `gallery-image-${resultIndex}-${imageIndex}.png`)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white text-gray-900 px-3 py-1 rounded text-sm font-medium"
                                >
                                  Download
                                </button>
                              )}
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