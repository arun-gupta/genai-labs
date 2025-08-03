import React from 'react';
import { Globe, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { LanguageDetection } from '../types/api';

interface LanguageDetectionProps {
  detection: LanguageDetection | null;
  isLoading?: boolean;
  className?: string;
}

export const LanguageDetectionDisplay: React.FC<LanguageDetectionProps> = ({
  detection,
  isLoading = false,
  className = ""
}) => {
  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 text-sm text-gray-600 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span>Detecting language...</span>
      </div>
    );
  }

  if (!detection) {
    return null;
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (confidence >= 0.6) return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    return <AlertCircle className="w-4 h-4 text-red-600" />;
  };

  const getLanguageName = (code: string) => {
    const languageNames: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'nl': 'Dutch',
      'sv': 'Swedish',
      'da': 'Danish',
      'no': 'Norwegian',
      'fi': 'Finnish',
      'pl': 'Polish',
      'tr': 'Turkish',
      'he': 'Hebrew',
      'th': 'Thai',
      'vi': 'Vietnamese',
      'id': 'Indonesian',
      'ms': 'Malay',
      'fa': 'Persian',
      'ur': 'Urdu',
      'bn': 'Bengali',
      'ta': 'Tamil',
      'te': 'Telugu',
      'mr': 'Marathi',
      'gu': 'Gujarati',
      'kn': 'Kannada',
      'ml': 'Malayalam',
      'pa': 'Punjabi',
      'or': 'Odia',
      'as': 'Assamese',
      'ne': 'Nepali',
      'si': 'Sinhala',
      'my': 'Burmese',
      'km': 'Khmer',
      'lo': 'Lao',
      'mn': 'Mongolian',
      'ka': 'Georgian',
      'am': 'Amharic',
      'sw': 'Swahili',
      'zu': 'Zulu',
      'af': 'Afrikaans',
      'is': 'Icelandic',
      'ga': 'Irish',
      'cy': 'Welsh',
      'eu': 'Basque',
      'ca': 'Catalan',
      'gl': 'Galician',
      'ro': 'Romanian',
      'bg': 'Bulgarian',
      'hr': 'Croatian',
      'sr': 'Serbian',
      'sk': 'Slovak',
      'sl': 'Slovenian',
      'et': 'Estonian',
      'lv': 'Latvian',
      'lt': 'Lithuanian',
      'mt': 'Maltese',
      'sq': 'Albanian',
      'mk': 'Macedonian',
      'bs': 'Bosnian',
      'me': 'Montenegrin',
      'ky': 'Kyrgyz',
      'kk': 'Kazakh',
      'uz': 'Uzbek',
      'tg': 'Tajik',
      'tk': 'Turkmen',
      'az': 'Azerbaijani',
      'hy': 'Armenian',
      'ku': 'Kurdish',
      'ps': 'Pashto',
      'sd': 'Sindhi',
      'bo': 'Tibetan',
      'dz': 'Dzongkha',
      'ug': 'Uyghur',
      'yi': 'Yiddish',
      'lb': 'Luxembourgish',
      'fo': 'Faroese',
      'sm': 'Samoan',
      'to': 'Tongan',
      'fj': 'Fijian',
      'mi': 'Maori',
      'haw': 'Hawaiian',
      'co': 'Corsican',
      'sc': 'Sardinian',
      'vec': 'Venetian',
      'fur': 'Friulian',
      'lld': 'Ladin',
      'rm': 'Romansh',
      'gsw': 'Swiss German',
      'bar': 'Bavarian',
      'ksh': 'Colognian',
      'nds': 'Low German',
      'pdc': 'Pennsylvania German',
      'pfl': 'Palatinate German',
      'sxu': 'Upper Saxon',
      'wae': 'Walser',
      'als': 'Alemannic',
      'swg': 'Swabian',
      'grc': 'Ancient Greek',
      'la': 'Latin',
      'ang': 'Old English',
      'fro': 'Old French',
      'goh': 'Old High German',
      'non': 'Old Norse',
      'got': 'Gothic',
      'sga': 'Old Irish',
      'owl': 'Old Welsh',
      'xcl': 'Classical Armenian',
      'peo': 'Old Persian',
      'sa': 'Sanskrit',
      'pal': 'Pahlavi',
      'ae': 'Avestan',
      'hit': 'Hittite',
      'akk': 'Akkadian',
      'sux': 'Sumerian',
      'egy': 'Egyptian',
      'cop': 'Coptic',
      'arc': 'Aramaic',
      'phn': 'Phoenician',
      'uga': 'Ugaritic',
      'xpr': 'Parthian',
      'xsc': 'Scythian',
      'xss': 'Sarmatian',
      'xme': 'Median',
      'xbc': 'Bactrian',
      'xhc': 'Hunnic',
      'xav': 'Avar',
      'xbu': 'Bulgar',
      'xkh': 'Khazar',
      'xpe': 'Pecheneg',
      'xcu': 'Church Slavic',
      'xbm': 'Middle Breton',
      'xcb': 'Cumbric',
      'xga': 'Old Irish',
      'xgl': 'Galician',
      'xgm': 'Middle High German',
      'xgo': 'Old Georgian',
      'xgr': 'Ancient Greek',
      'xhe': 'Ancient Hebrew',
      'xhi': 'Old Hindi',
      'xhr': 'Old Croatian',
      'xhu': 'Old Hungarian',
      'xhy': 'Old Armenian',
      'xid': 'Old Indonesian',
      'xja': 'Old Japanese',
      'xka': 'Old Georgian',
      'xko': 'Old Korean',
      'xla': 'Latin',
      'xlt': 'Old Lithuanian',
      'xmk': 'Old Macedonian',
      'xmn': 'Middle Mongolian',
      'xmr': 'Old Marathi',
      'xms': 'Old Malay',
      'xmy': 'Old Burmese',
      'xne': 'Old Nepali',
      'xno': 'Old Norse',
      'xoc': 'Old Occitan',
      'xpl': 'Old Polish',
      'xpt': 'Old Portuguese',
      'xro': 'Old Romanian',
      'xru': 'Old Russian',
      'xsa': 'Old Sanskrit',
      'xsk': 'Old Slovak',
      'xsl': 'Old Slovenian',
      'xsp': 'Old Spanish',
      'xsv': 'Old Swedish',
      'xta': 'Old Tamil',
      'xtc': 'Old Telugu',
      'xth': 'Old Thai',
      'xtr': 'Old Turkish',
      'xuk': 'Old Ukrainian',
      'xur': 'Old Urdu',
      'xvi': 'Old Vietnamese',
      'xzh': 'Old Chinese',
      'xzu': 'Old Zulu',
    };
    return languageNames[code] || code.toUpperCase();
  };

  return (
    <div className={`bg-gray-50 rounded-lg p-3 ${className}`}>
      <div className="flex items-center space-x-2 mb-2">
        <Globe className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-gray-700">Language Detection</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getConfidenceIcon(detection.confidence)}
            <span className="text-sm font-medium">
              {getLanguageName(detection.detected_language)}
            </span>
          </div>
          <span className={`text-sm font-medium ${getConfidenceColor(detection.confidence)}`}>
            {Math.round(detection.confidence * 100)}% confidence
          </span>
        </div>
        
        <div className="text-xs text-gray-500">
          Detected using: {detection.method}
        </div>
        
        {detection.alternatives && detection.alternatives.length > 0 && (
          <div className="mt-2">
            <div className="text-xs text-gray-500 mb-1">Alternative detections:</div>
            <div className="space-y-1">
              {detection.alternatives.slice(0, 3).map((alt, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">
                    {getLanguageName(alt.language)} ({alt.method})
                  </span>
                  <span className="text-gray-500">
                    {Math.round(alt.confidence * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {detection.confidence < 0.6 && (
          <div className="flex items-center space-x-2 text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
            <Info className="w-3 h-3" />
            <span>Low confidence detection. Consider manual language selection.</span>
          </div>
        )}
      </div>
    </div>
  );
}; 