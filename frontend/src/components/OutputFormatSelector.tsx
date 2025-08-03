import React from 'react';
import { FileText, ChevronDown } from 'lucide-react';

interface OutputFormat {
  value: string;
  label: string;
  description: string;
}

interface OutputFormatSelectorProps {
  selectedFormat: string;
  onFormatChange: (format: string) => void;
  className?: string;
}

const outputFormats: OutputFormat[] = [
  {
    value: 'text',
    label: 'Plain Text',
    description: 'Simple, readable text format'
  },
  {
    value: 'json',
    label: 'JSON',
    description: 'Structured data in JSON format'
  },
  {
    value: 'xml',
    label: 'XML',
    description: 'Structured data in XML format'
  },
  {
    value: 'markdown',
    label: 'Markdown',
    description: 'Rich text with formatting'
  },
  {
    value: 'csv',
    label: 'CSV',
    description: 'Comma-separated values'
  },
  {
    value: 'yaml',
    label: 'YAML',
    description: 'Human-readable data serialization'
  },
  {
    value: 'html',
    label: 'HTML',
    description: 'Web page markup'
  },
  {
    value: 'bullet_points',
    label: 'Bullet Points',
    description: 'List with bullet points'
  },
  {
    value: 'numbered_list',
    label: 'Numbered List',
    description: 'List with numbers'
  },
  {
    value: 'table',
    label: 'Table',
    description: 'Markdown table format'
  }
];

export const OutputFormatSelector: React.FC<OutputFormatSelectorProps> = ({
  selectedFormat,
  onFormatChange,
  className = ""
}) => {
  const selectedFormatData = outputFormats.find(format => format.value === selectedFormat);

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Output Format
      </label>
      
      <div className="relative">
        <select
          value={selectedFormat}
          onChange={(e) => onFormatChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white appearance-none pr-10"
        >
          {outputFormats.map((format) => (
            <option key={format.value} value={format.value}>
              {format.label}
            </option>
          ))}
        </select>
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      {selectedFormatData && (
        <p className="text-xs text-gray-500 mt-1">
          {selectedFormatData.description}
        </p>
      )}
    </div>
  );
}; 