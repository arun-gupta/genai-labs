import React from 'react';
import { Copy, Users } from 'lucide-react';

interface MultipleCandidatesSelectorProps {
  numCandidates: number;
  onNumCandidatesChange: (value: number) => void;
  className?: string;
}

export const MultipleCandidatesSelector: React.FC<MultipleCandidatesSelectorProps> = ({
  numCandidates,
  onNumCandidatesChange,
  className = ""
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center space-x-2">
        <Users className="text-gray-500" size={20} />
        <h3 className="text-lg font-medium text-gray-900">Multiple Candidates</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Number of Candidates: {numCandidates}
          </label>
          <span className="text-xs text-gray-500">
            {numCandidates === 1 ? 'Single response' : `${numCandidates} variations`}
          </span>
        </div>
        
        <div className="relative">
          <input
            type="range"
            min="1"
            max="5"
            value={numCandidates}
            onChange={(e) => onNumCandidatesChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          
          {/* Custom slider marks */}
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
          </div>
        </div>
        
        <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
          <div className="flex items-start space-x-2">
            <Copy className="text-gray-400 mt-0.5" size={14} />
            <div>
              <p className="font-medium mb-1">How it works:</p>
              <ul className="space-y-1 text-gray-500">
                <li>• Generate multiple variations of the same prompt</li>
                <li>• Compare different approaches and styles</li>
                <li>• Choose the best response for your needs</li>
                <li>• Higher numbers may take longer to generate</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 