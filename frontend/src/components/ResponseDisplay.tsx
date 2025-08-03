import React from 'react';
import { Clock, Zap, Copy, Check } from 'lucide-react';
import { TokenUsage } from '../types/api';
import { VoiceOutput } from './VoiceOutput';

interface ResponseDisplayProps {
  content: string;
  isStreaming: boolean;
  tokenUsage?: TokenUsage;
  latencyMs?: number;
  modelName: string;
  modelProvider: string;
}

export const ResponseDisplay: React.FC<ResponseDisplayProps> = ({
  content,
  isStreaming,
  tokenUsage,
  latencyMs,
  modelName,
  modelProvider,
}) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const formatLatency = (ms: number) => {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    }
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">Response</h3>
          {isStreaming && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600">Streaming...</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <VoiceOutput
            text={content}
            disabled={isStreaming || !content}
            className="text-xs"
          />
          <button
            onClick={copyToClipboard}
            className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <>
                <Check size={16} />
                <span className="text-sm">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span className="text-sm">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Response Content */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="prose prose-sm max-w-none">
          {content ? (
            <div className="whitespace-pre-wrap text-gray-800">{content}</div>
          ) : (
            <div className="text-gray-500 italic">
              {isStreaming ? 'Generating response...' : 'No response yet'}
            </div>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <Zap className="text-gray-400" size={16} />
          <div>
            <div className="text-gray-500">Model</div>
            <div className="font-medium text-gray-900">
              {modelName} ({modelProvider})
            </div>
          </div>
        </div>

        {latencyMs && (
          <div className="flex items-center space-x-2">
            <Clock className="text-gray-400" size={16} />
            <div>
              <div className="text-gray-500">Latency</div>
              <div className="font-medium text-gray-900">
                {formatLatency(latencyMs)}
              </div>
            </div>
          </div>
        )}

        {tokenUsage && (
          <div className="flex items-center space-x-2">
            <Zap className="text-gray-400" size={16} />
            <div>
              <div className="text-gray-500">Tokens</div>
              <div className="font-medium text-gray-900">
                {tokenUsage.total_tokens} total
              </div>
              <div className="text-xs text-gray-500">
                {tokenUsage.prompt_tokens} prompt + {tokenUsage.completion_tokens} completion
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 