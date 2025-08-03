import React, { useState } from 'react';
import { Download, FileText, FileCode, FileSpreadsheet } from 'lucide-react';
import { apiService } from '../services/api';

interface ExportOptionsProps {
  content: {
    system_prompt: string;
    user_prompt: string;
    generated_content: string | string[];
    metadata: {
      model_provider: string;
      model_name: string;
      timestamp: string;
      token_usage?: any;
      latency_ms?: number;
    };
    analytics?: any;
  };
  className?: string;
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({
  content,
  className = ""
}) => {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (format: 'pdf' | 'word' | 'markdown' | 'html') => {
    if (!content.generated_content) {
      alert('No content to export');
      return;
    }

    setExporting(format);
    try {
      const blob = await apiService.exportContent(format, content);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `generated_content.${format === 'word' ? 'docx' : format === 'html' ? 'html' : format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Export to ${format} failed:`, error);
      alert(`Failed to export to ${format.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return FileText;
      case 'word': return FileSpreadsheet;
      case 'markdown': return FileCode;
      case 'html': return FileCode;
      default: return Download;
    }
  };

  const getFormatName = (format: string) => {
    switch (format) {
      case 'pdf': return 'PDF Document';
      case 'word': return 'Word Document';
      case 'markdown': return 'Markdown File';
      case 'html': return 'HTML File';
      default: return format.toUpperCase();
    }
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'pdf': return 'Professional document with formatting';
      case 'word': return 'Editable document for Microsoft Word';
      case 'markdown': return 'Plain text with markdown formatting';
      case 'html': return 'Web page format for browsers';
      default: return '';
    }
  };

  const formats: Array<'pdf' | 'word' | 'markdown' | 'html'> = ['pdf', 'word', 'markdown', 'html'];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-2">
        <Download className="text-gray-500" size={20} />
        <h3 className="text-lg font-medium text-gray-900">Export Options</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {formats.map((format) => {
          const Icon = getFormatIcon(format);
          const isExporting = exporting === format;
          
          return (
            <button
              key={format}
              onClick={() => handleExport(format)}
              disabled={isExporting || !content.generated_content}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                isExporting
                  ? 'border-blue-300 bg-blue-50 cursor-not-allowed'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 cursor-pointer'
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <Icon className={`w-5 h-5 ${
                  isExporting ? 'text-blue-600' : 'text-gray-500'
                }`} />
                <span className="font-medium text-gray-900">
                  {getFormatName(format)}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">
                {getFormatDescription(format)}
              </p>
              
              {isExporting ? (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Exporting...</span>
                </div>
              ) : (
                <div className="text-xs text-gray-500">
                  Click to download
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {!content.generated_content && (
        <div className="text-center py-4 text-sm text-gray-500">
          Generate content first to enable export options
        </div>
      )}
    </div>
  );
}; 