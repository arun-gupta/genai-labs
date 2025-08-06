import React, { useState } from 'react';

export const SummarizePage: React.FC = () => {
  const [text, setText] = useState('');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Summarize Page (Minimal)</h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to summarize..."
        className="w-full h-32 p-2 border rounded"
      />
      <p className="mt-4">Text length: {text.length}</p>
    </div>
  );
}; 