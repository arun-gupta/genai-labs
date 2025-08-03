import React from 'react';
import { 
  FileText, 
  Code, 
  FileCode, 
  FileType, 
  Table, 
  List, 
  Hash, 
  FileSpreadsheet,
  FileJson,
  FileCode2
} from 'lucide-react';

interface OutputFormat {
  value: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
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
    description: 'Simple, readable text format',
    icon: FileText
  },
  {
    value: 'json',
    label: 'JSON',
    description: 'Structured data in JSON format',
    icon: FileJson
  },
  {
    value: 'xml',
    label: 'XML',
    description: 'Structured data in XML format',
    icon: FileCode
  },
  {
    value: 'markdown',
    label: 'Markdown',
    description: 'Rich text with formatting',
    icon: FileType
  },
  {
    value: 'csv',
    label: 'CSV',
    description: 'Comma-separated values',
    icon: FileSpreadsheet
  },
  {
    value: 'yaml',
    label: 'YAML',
    description: 'Human-readable data serialization',
    icon: FileCode2
  },
  {
    value: 'html',
    label: 'HTML',
    description: 'Web page markup',
    icon: Code
  },
  {
    value: 'bullet_points',
    label: 'Bullet Points',
    description: 'List with bullet points',
    icon: List
  },
  {
    value: 'numbered_list',
    label: 'Numbered List',
    description: 'List with numbers',
    icon: Hash
  },
  {
    value: 'table',
    label: 'Table',
    description: 'Markdown table format',
    icon: Table
  }
];

export const OutputFormatSelector: React.FC<OutputFormatSelectorProps> = ({
  selectedFormat,
  onFormatChange,
  className = ""
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Output Format
      </label>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {outputFormats.map((format) => {
          const Icon = format.icon;
          const isSelected = selectedFormat === format.value;
          
          return (
            <button
              key={format.value}
              onClick={() => onFormatChange(format.value)}
              className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className="text-sm font-medium">{format.label}</span>
              </div>
              <p className="text-xs text-gray-500 leading-tight">
                {format.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}; 