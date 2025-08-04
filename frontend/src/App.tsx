import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { HomePage } from './pages/HomePage';
import { GeneratePage } from './pages/GeneratePage';
import { SummarizePage } from './pages/SummarizePage';
import { RAGPage } from './pages/RAGPage';
import { ModelsPage } from './pages/ModelsPage';
import { VisionPage } from './pages/VisionPage';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/summarize" element={<SummarizePage />} />
          <Route path="/rag" element={<RAGPage />} />
          <Route path="/vision" element={<VisionPage />} />
          <Route path="/models" element={<ModelsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App; 