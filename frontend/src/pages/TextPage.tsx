import React, { useState } from 'react';
import { GeneratePage } from './GeneratePage';
import { SummarizePage } from './SummarizePage';

export const TextPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generate' | 'summarize'>('generate');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Text AI</h1>
          <p className="text-gray-600">Generate and summarize text with advanced AI models</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('generate')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'generate'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Generate
            </button>
            <button
              onClick={() => setActiveTab('summarize')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'summarize'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Summarize
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'generate' && <GeneratePage />}
        {activeTab === 'summarize' && <SummarizePage />}
      </div>
    </div>
  );
};
