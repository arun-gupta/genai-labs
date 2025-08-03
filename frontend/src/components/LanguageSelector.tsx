import React, { useState, useEffect } from 'react';
import { Globe, Languages, Check } from 'lucide-react';
import { SupportedLanguages } from '../types/api';
import { apiService } from '../services/api';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (languageCode: string) => void;
  placeholder?: string;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  placeholder = "Select language...",
  className = ""
}) => {
  const [languages, setLanguages] = useState<SupportedLanguages | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLanguages = async () => {
      setLoading(true);
      try {
        const data = await apiService.getSupportedLanguages();
        setLanguages(data);
      } catch (error) {
        console.error('Failed to fetch languages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  const getSelectedLanguageName = () => {
    if (!languages || !selectedLanguage) return placeholder;
    const lang = languages.languages[selectedLanguage];
    return lang ? `${lang.name} (${lang.native})` : placeholder;
  };

  const filteredFamilies = languages ? Object.entries(languages.families).filter(([family, langs]) => {
    if (!searchTerm) return true;
    return langs.some(lang => 
      lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lang.native.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lang.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) : [];

  const handleLanguageSelect = (languageCode: string) => {
    onLanguageChange(languageCode);
    setIsOpen(false);
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">Loading languages...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <div className="flex items-center space-x-2">
          <Languages className="w-4 h-4 text-gray-500" />
          <span className={selectedLanguage ? 'text-gray-900' : 'text-gray-500'}>
            {getSelectedLanguageName()}
          </span>
        </div>
        <Globe className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search languages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="overflow-y-auto max-h-80">
            {filteredFamilies.map(([family, familyLanguages]) => (
              <div key={family} className="border-b border-gray-100 last:border-b-0">
                <div className="px-3 py-2 bg-gray-50 text-sm font-medium text-gray-700 border-b border-gray-200">
                  {family}
                </div>
                {familyLanguages
                  .filter(lang => 
                    !searchTerm || 
                    lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    lang.native.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    lang.code.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((language) => (
                    <button
                      key={language.code}
                      onClick={() => handleLanguageSelect(language.code)}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${
                        selectedLanguage === language.code ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                      }`}
                    >
                      <div>
                        <div className="font-medium">{language.name}</div>
                        <div className="text-sm text-gray-500">{language.native}</div>
                      </div>
                      {selectedLanguage === language.code && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </button>
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 