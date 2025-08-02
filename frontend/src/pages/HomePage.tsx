import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, FileText, Brain, Server, ArrowRight, Sparkles } from 'lucide-react';

export const HomePage: React.FC = () => {
  const features = [
    {
      title: 'Text Generation',
      description: 'Generate creative and informative text using various LLM models with custom prompts.',
      icon: Zap,
      path: '/generate',
      color: 'bg-blue-500',
    },
    {
      title: 'Text Summarization',
      description: 'Summarize long texts efficiently while maintaining key information and context.',
      icon: FileText,
      path: '/summarize',
      color: 'bg-green-500',
    },
  ];

  const models = [
    {
      name: 'OpenAI',
      description: 'GPT-4, GPT-3.5 Turbo, and more',
      icon: Brain,
      requiresKey: true,
    },
    {
      name: 'Anthropic',
      description: 'Claude models for advanced reasoning',
      icon: Brain,
      requiresKey: true,
    },
    {
      name: 'Ollama',
      description: 'Local models for privacy and speed',
      icon: Server,
      requiresKey: false,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-12">
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
          Support for both cloud-hosted and local models with real-time streaming responses.
        </p>
        <div className="flex items-center justify-center space-x-4">
          <Link
            to="/generate"
            className="btn-primary flex items-center space-x-2"
          >
            <Zap size={16} />
            <span>Start Generating</span>
            <ArrowRight size={16} />
          </Link>
          <Link
            to="/summarize"
            className="btn-secondary flex items-center space-x-2"
          >
            <FileText size={16} />
            <span>Try Summarization</span>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Features</h2>
          <p className="text-gray-600">
            Explore different AI capabilities with our intuitive interface
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.path}
                to={feature.path}
                className="card hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start space-x-4">
                  <div className={`${feature.color} p-3 rounded-lg text-white`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 mt-2">{feature.description}</p>
                    <div className="flex items-center text-primary-600 mt-4 group-hover:text-primary-700 transition-colors">
                      <span className="text-sm font-medium">Try it now</span>
                      <ArrowRight size={16} className="ml-1" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Models Section */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Supported Models</h2>
          <p className="text-gray-600">
            Choose from a variety of language models to suit your needs
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {models.map((model) => {
            const Icon = model.icon;
            return (
              <div key={model.name} className="card text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Icon className="text-gray-600" size={24} />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {model.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3">{model.description}</p>
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {model.requiresKey ? 'API Key Required' : 'Local Model'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Getting Started */}
      <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Getting Started</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Configure your API keys in the backend environment file to use cloud models, 
            or set up Ollama locally for private, offline AI processing.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link
              to="/generate"
              className="btn-primary flex items-center space-x-2"
            >
              <Zap size={16} />
              <span>Start Experimenting</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}; 