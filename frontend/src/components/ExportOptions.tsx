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
    <div className={`flex flex-wrap gap-3 items-center ${className}`}>
      {formats.map((format) => {
        const Icon = getFormatIcon(format);
        const isExporting = exporting === format;
        const tooltip = `${getFormatName(format)}: ${getFormatDescription(format)}`;
        return (
          <button
            key={format}
            onClick={() => handleExport(format)}
            disabled={isExporting || !content.generated_content}
            className={`p-2 rounded-lg border transition-all bg-white hover:bg-gray-50 flex flex-col items-center ${
              isExporting
                ? 'border-blue-300 bg-blue-50 cursor-not-allowed'
                : 'border-gray-200 hover:border-gray-300 cursor-pointer'
            }`}
            title={tooltip}
          >
            <Icon className={`w-6 h-6 ${isExporting ? 'text-blue-600' : 'text-gray-700'}`} />
            <span className="text-xs text-gray-600 mt-1 font-medium">
              {format}
            </span>
            {/* Optionally, show a spinner overlay if exporting */}
            {isExporting && (
              <span className="absolute top-0 right-0 animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></span>
            )}
          </button>
        );
      })}
    </div>
  );
}; 