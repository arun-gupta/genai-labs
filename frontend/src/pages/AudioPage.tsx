import React, { useState } from 'react';
import { Mic, Volume2, Download } from 'lucide-react';
import { VoiceInput } from '../components/VoiceInput';
import { VoiceOutput } from '../components/VoiceOutput';

export const AudioPage: React.FC = () => {
  const [transcript, setTranscript] = useState<string>('');
  const [ttsText, setTtsText] = useState<string>('');

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold text-gray-900">Audio</h1>
        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 border border-blue-200">New</span>
      </div>
      <p className="text-gray-600">Use your voice to dictate prompts and listen to AI responses with built-in speech capabilities.</p>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Speech-to-Text */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <Mic className="text-indigo-600" size={18} />
            <h2 className="text-lg font-semibold">Speech to Text</h2>
          </div>
          <VoiceInput onTranscript={(t) => setTranscript((prev) => (prev ? prev + ' ' : '') + t)} />
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Your transcript will appear here..."
            className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <div className="flex justify-end">
            <button
              onClick={() => setTranscript('')}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Text-to-Speech */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <Volume2 className="text-green-600" size={18} />
            <h2 className="text-lg font-semibold">Text to Speech</h2>
          </div>
          <textarea
            value={ttsText}
            onChange={(e) => setTtsText(e.target.value)}
            placeholder="Type anything to speak it aloud..."
            className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <div className="flex items-center justify-between">
            <VoiceOutput text={ttsText} />
            <button
              onClick={() => navigator.clipboard.writeText(ttsText)}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-2"
            >
              <Download size={14} />
              Copy Text
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-md font-semibold mb-2">Tips</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Use a Chromium-based browser for best speech recognition support.</li>
          <li>• Select a different voice in the Text-to-Speech panel to customize playback.</li>
          <li>• You can paste your transcript directly into Text to Speech and play it.</li>
        </ul>
      </div>
    </div>
  );
}
