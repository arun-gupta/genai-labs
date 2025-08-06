import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, FileText, Brain, Server, ArrowRight, Sparkles, Search, BarChart3, Mic, Download, Code, Globe, Github, Eye, GitCompare } from 'lucide-react';

export const HomePage: React.FC = () => {
  const features = [
    {
      title: 'Text Generation',
      description: 'Generate creative and informative text using various LLM models with custom prompts.',
      icon: Zap,
      path: '/generate',
      color: 'bg-blue-500',
      highlights: ['12+ Writing Styles', 'Model Comparison', 'Real-time Streaming']
    },
    {
      title: 'Text Summarization',
      description: 'Summarize text, URLs, and documents with multiple input methods and summary styles.',
      icon: FileText,
      path: '/summarize',
      color: 'bg-green-500',
      highlights: ['Model Comparison', 'Analytics', 'Multi-language Support']
    },
    {
      title: 'Q&A over Documents',
      description: 'Upload documents and ask questions to get AI-powered answers based on your content.',
      icon: Search,
      path: '/rag',
      color: 'bg-purple-500',
      highlights: ['Smart Suggestions', 'Source Citations', 'Collection Management']
    },
    {
      title: 'Vision AI',
      description: 'Analyze images and generate new ones using AI vision models and image generation.',
      icon: Eye,
      path: '/vision',
      color: 'bg-orange-500',
      highlights: ['Image Analysis', 'Text-to-Image', 'Image Gallery']
    },
  ];

  const capabilities = [
    {
      title: 'Voice Features',
      description: 'Speech-to-text and text-to-speech capabilities',
      icon: Mic,
      color: 'text-blue-600'
    },
    {
      title: 'Model Comparison',
      description: 'Side-by-side performance analysis and metrics',
      icon: GitCompare,
      color: 'text-purple-600'
    },
    {
      title: 'Model Explorer',
      description: 'Browse and manage 20+ open-source LLM models',
      icon: Brain,
      color: 'text-green-600'
    },
    {
      title: 'Export Options',
      description: 'Export results in PDF, Word, Markdown, and HTML formats',
      icon: Download,
      color: 'text-orange-600'
    },
    {
      title: 'Real-time Analytics',
      description: 'Live token usage tracking and performance metrics',
      icon: BarChart3,
      color: 'text-orange-600'
    }
  ];

  const models = [
    {
      name: 'OpenAI',
      description: 'GPT-4, GPT-3.5 Turbo, and more',
      icon: Brain,
      requiresKey: true,
      models: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo'],
      features: ['Advanced reasoning', 'Code generation', 'Real-time streaming']
    },
    {
      name: 'Anthropic',
      description: 'Claude models for advanced reasoning',
      icon: Brain,
      requiresKey: true,
      models: ['claude-3-sonnet', 'claude-3-haiku', 'claude-2.1'],
      features: ['Constitutional AI', 'Safety-focused', 'Long context']
    },
    {
      name: 'Ollama (Local)',
      description: '20+ open-source models for privacy and speed',
      icon: Server,
      requiresKey: false,
      models: ['GPT-OSS-20B', 'Mistral-7B', 'Qwen3-8B', 'Llama-3.1'],
      features: ['Offline processing', 'Privacy-first', 'Latest OSS models']
    },
  ];

  const modelCategories = [
    {
      title: 'High Performance',
      models: ['GPT-OSS-20B', 'Qwen3-8B', 'Mistral-7B', 'GPT-4'],
      icon: Zap,
      color: 'text-blue-600'
    },
    {
      title: 'Coding & Development',
      models: ['DeepSeek Coder', 'Code Llama', 'GPT-4', 'Claude-3'],
      icon: Code,
      color: 'text-green-600'
    },
    {
      title: 'Reasoning & Analysis',
      models: ['GPT-OSS-20B', 'Qwen3-8B', 'Phi-3', 'Claude-3'],
      icon: Brain,
      color: 'text-purple-600'
    },
    {
      title: 'Multilingual',
      models: ['Qwen3-8B', 'BLOOM', 'Mistral-7B', 'GPT-4'],
      icon: Globe,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-12">
      {/* GitHub Link */}
      <div className="flex justify-end">
        <a
          href="https://github.com/arun-gupta/genai-labs"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
          title="View on GitHub"
        >
          <Github size={20} />
          <span className="text-sm font-medium">GitHub</span>
        </a>
      </div>

      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
            <Sparkles className="text-white" size={28} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">GenAI Lab</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Experiment with different GenAI use cases using large language models. 
          Support for 20+ open-source models including GPT-OSS-20B, Mistral-7B, and Qwen3-8B, plus cloud models with real-time streaming responses.
        </p>
        <div className="flex items-center justify-center space-x-4">
          <Link
            to="/generate"
            className="btn-primary flex items-center space-x-2"
          >
            <Zap size={16} />
            <span>Get Started</span>
            <ArrowRight size={16} />
          </Link>
          <Link
            to="/models"
            className="btn-secondary flex items-center space-x-2"
          >
            <Brain size={16} />
            <span>Explore Models</span>
          </Link>
        </div>
      </div>

      {/* Main Features Section */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Core Features</h2>
          <p className="text-gray-600">
            Four powerful AI capabilities to enhance your workflow
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.path}
                to={feature.path}
                className="card hover:shadow-lg transition-all duration-200 group border-2 border-transparent hover:border-primary-200 flex flex-col h-full"
              >
                <div className="flex-1 space-y-2.5">
                  <div className={`${feature.color} p-2.5 rounded-lg text-white w-fit`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 mt-1 mb-2 text-sm">{feature.description}</p>
                    <div className="space-y-1">
                      {feature.highlights.map((highlight, index) => (
                        <div key={index} className="flex items-center text-xs text-gray-500">
                          <div className="w-1 h-1 bg-primary-400 rounded-full mr-1.5"></div>
                          {highlight}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center text-primary-600 group-hover:text-primary-700 transition-colors pt-1.5 border-t border-gray-100 mt-auto">
                  <span className="text-xs font-medium">Try it now</span>
                  <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Additional Capabilities */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Additional Capabilities</h2>
          <p className="text-gray-600">
            Enhanced features available across all tools
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {capabilities.map((capability) => {
            const Icon = capability.icon;
            return (
              <div key={capability.title} className="card text-center hover:shadow-md transition-shadow">
                <div className="flex justify-center mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gray-50`}>
                    <Icon className={capability.color} size={20} />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  {capability.title}
                </h3>
                <p className="text-xs text-gray-600">{capability.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Models Section */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Supported Models</h2>
          <p className="text-gray-600">
            Choose from 20+ open-source models including the latest GPT-OSS-20B, Mistral-7B, and Qwen3-8B, plus cloud models
          </p>
        </div>
        
        {/* Model Providers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {models.map((model) => {
            const Icon = model.icon;
            return (
              <div key={model.name} className="card hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-primary-200">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Icon className="text-gray-600" size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {model.name}
                      </h3>
                      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {model.requiresKey ? 'API Key Required' : 'Local Model'}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm">{model.description}</p>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Available Models:</h4>
                      <div className="flex flex-wrap gap-1">
                        {model.models.map((modelName, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">
                            {modelName}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Key Features:</h4>
                      <div className="space-y-1">
                        {model.features.map((feature, index) => (
                          <div key={index} className="flex items-center text-xs text-gray-600">
                            <div className="w-1 h-1 bg-primary-400 rounded-full mr-2"></div>
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Featured Models */}
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Featured Models</h3>
            <p className="text-gray-600 text-sm">
              Latest and most powerful open-source models
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card text-center hover:shadow-md transition-shadow border-2 border-blue-200 bg-blue-50">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-100">
                  <Brain className="text-blue-600" size={24} />
                </div>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">GPT-OSS-20B</h4>
              <p className="text-sm text-gray-600 mb-2">OpenAI's open-weight model</p>
              <div className="text-xs text-blue-600 font-medium">20B Parameters • Advanced Reasoning</div>
            </div>
            
            <div className="card text-center hover:shadow-md transition-shadow border-2 border-green-200 bg-green-50">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-100">
                  <Zap className="text-green-600" size={24} />
                </div>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Mistral-7B</h4>
              <p className="text-sm text-gray-600 mb-2">High-performance reasoning model</p>
              <div className="text-xs text-green-600 font-medium">7B Parameters • Excellent Performance</div>
            </div>
            
            <div className="card text-center hover:shadow-md transition-shadow border-2 border-orange-200 bg-orange-50">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-orange-100">
                  <Globe className="text-orange-600" size={24} />
                </div>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Qwen3-8B</h4>
              <p className="text-sm text-gray-600 mb-2">Alibaba's multilingual model</p>
              <div className="text-xs text-orange-600 font-medium">8B Parameters • Multilingual</div>
            </div>
          </div>
        </div>

        {/* Model Categories */}
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Model Categories</h3>
            <p className="text-gray-600 text-sm">
              Models organized by their primary capabilities
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {modelCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.title} className="card text-center hover:shadow-md transition-shadow">
                  <div className="flex justify-center mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-50">
                      <Icon className={category.color} size={20} />
                    </div>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    {category.title}
                  </h4>
                  <div className="space-y-1">
                    {category.models.slice(0, 3).map((model, index) => (
                      <div key={index} className="text-xs text-gray-600">
                        {model}
                      </div>
                    ))}
                    {category.models.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{category.models.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Ready to Get Started?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Configure your API keys in the backend environment file to use cloud models, 
            or set up Ollama locally for private, offline AI processing with 20+ open-source models including GPT-OSS-20B, Mistral, and Qwen3.
          </p>
          <div className="flex items-center justify-center space-x-4 flex-wrap">
            <Link
              to="/generate"
              className="btn-primary flex items-center space-x-2"
            >
              <Zap size={16} />
              <span>Text Generation</span>
            </Link>
            <Link
              to="/summarize"
              className="btn-secondary flex items-center space-x-2"
            >
              <FileText size={16} />
              <span>Text Summarization</span>
            </Link>
            <Link
              to="/rag"
              className="btn-secondary flex items-center space-x-2"
            >
              <Search size={16} />
              <span>Q&A over Documents</span>
            </Link>
            <Link
              to="/vision"
              className="btn-secondary flex items-center space-x-2"
            >
              <Eye size={16} />
              <span>Vision AI</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}; 