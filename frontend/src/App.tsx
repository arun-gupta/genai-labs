import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { HomePage } from './pages/HomePage';
import { GeneratePage } from './pages/GeneratePage';
import { SummarizePage } from './pages/SummarizePage';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/summarize" element={<SummarizePage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App; 