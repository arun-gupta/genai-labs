import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, FileText, Home, Database, Search, Eye, Github } from 'lucide-react';

export const Navigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    {
      path: '/',
      label: 'Home',
      icon: Home,
    },
    {
      path: '/generate',
      label: 'Generate',
      icon: Zap,
    },
    {
      path: '/summarize',
      label: 'Summarize',
      icon: FileText,
    },
    {
      path: '/rag',
      label: 'Q&A',
      icon: Search,
    },
    {
      path: '/vision',
      label: 'Vision',
      icon: Eye,
    },
    {
      path: '/models',
      label: 'Models',
      icon: Database,
    },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Zap className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold text-gray-900">GenAI Lab</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* GitHub Link - Far Right */}
          <div className="flex items-center">
            <a
              href="https://github.com/arun-gupta/genai-labs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              title="View on GitHub"
            >
              <Github size={16} />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}; 