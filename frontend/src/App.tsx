import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { HomePage } from './pages/HomePage';
import { TextPage } from './pages/TextPage';
import { RAGPage } from './pages/RAGPage';
import { ModelsPage } from './pages/ModelsPage';
import { VisionPage } from './pages/VisionPage';
import { VideoPage } from './pages/VideoPage';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="pt-24 pb-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/text" element={<TextPage />} />
          <Route path="/rag" element={<RAGPage />} />
          <Route path="/vision" element={<VisionPage />} />
          <Route path="/video" element={<VideoPage />} />
          <Route path="/models" element={<ModelsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App; 