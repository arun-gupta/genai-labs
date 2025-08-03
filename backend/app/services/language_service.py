import re
from typing import Dict, List, Optional, Tuple
from langdetect import detect, detect_langs, DetectorFactory
from deep_translator import GoogleTranslator
import pycld2 as cld2
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set seed for consistent language detection
DetectorFactory.seed = 0

class LanguageService:
    """Service for language detection and translation."""
    
    def __init__(self):
        self.supported_languages = self._get_supported_languages()
    
    def _get_supported_languages(self) -> Dict[str, Dict[str, str]]:
        """Get supported languages with their codes and names."""
        return {
            'en': {'name': 'English', 'native': 'English'},
            'es': {'name': 'Spanish', 'native': 'Español'},
            'fr': {'name': 'French', 'native': 'Français'},
            'de': {'name': 'German', 'native': 'Deutsch'},
            'it': {'name': 'Italian', 'native': 'Italiano'},
            'pt': {'name': 'Portuguese', 'native': 'Português'},
            'ru': {'name': 'Russian', 'native': 'Русский'},
            'ja': {'name': 'Japanese', 'native': '日本語'},
            'ko': {'name': 'Korean', 'native': '한국어'},
            'zh': {'name': 'Chinese', 'native': '中文'},
            'ar': {'name': 'Arabic', 'native': 'العربية'},
            'hi': {'name': 'Hindi', 'native': 'हिन्दी'},
            'nl': {'name': 'Dutch', 'native': 'Nederlands'},
            'sv': {'name': 'Swedish', 'native': 'Svenska'},
            'da': {'name': 'Danish', 'native': 'Dansk'},
            'no': {'name': 'Norwegian', 'native': 'Norsk'},
            'fi': {'name': 'Finnish', 'native': 'Suomi'},
            'pl': {'name': 'Polish', 'native': 'Polski'},
            'tr': {'name': 'Turkish', 'native': 'Türkçe'},
            'he': {'name': 'Hebrew', 'native': 'עברית'},
            'th': {'name': 'Thai', 'native': 'ไทย'},
            'vi': {'name': 'Vietnamese', 'native': 'Tiếng Việt'},
            'id': {'name': 'Indonesian', 'native': 'Bahasa Indonesia'},
            'ms': {'name': 'Malay', 'native': 'Bahasa Melayu'},
            'fa': {'name': 'Persian', 'native': 'فارسی'},
            'ur': {'name': 'Urdu', 'native': 'اردو'},
            'bn': {'name': 'Bengali', 'native': 'বাংলা'},
            'ta': {'name': 'Tamil', 'native': 'தமிழ்'},
            'te': {'name': 'Telugu', 'native': 'తెలుగు'},
            'mr': {'name': 'Marathi', 'native': 'मराठी'},
            'gu': {'name': 'Gujarati', 'native': 'ગુજરાતી'},
            'kn': {'name': 'Kannada', 'native': 'ಕನ್ನಡ'},
            'ml': {'name': 'Malayalam', 'native': 'മലയാളം'},
            'pa': {'name': 'Punjabi', 'native': 'ਪੰਜਾਬੀ'},
            'or': {'name': 'Odia', 'native': 'ଓଡ଼ିଆ'},
            'as': {'name': 'Assamese', 'native': 'অসমীয়া'},
            'ne': {'name': 'Nepali', 'native': 'नेपाली'},
            'si': {'name': 'Sinhala', 'native': 'සිංහල'},
            'my': {'name': 'Burmese', 'native': 'မြန်မာ'},
            'km': {'name': 'Khmer', 'native': 'ខ្មែរ'},
            'lo': {'name': 'Lao', 'native': 'ລາວ'},
            'mn': {'name': 'Mongolian', 'native': 'Монгол'},
            'ka': {'name': 'Georgian', 'native': 'ქართული'},
            'am': {'name': 'Amharic', 'native': 'አማርኛ'},
            'sw': {'name': 'Swahili', 'native': 'Kiswahili'},
            'zu': {'name': 'Zulu', 'native': 'isiZulu'},
            'af': {'name': 'Afrikaans', 'native': 'Afrikaans'},
            'is': {'name': 'Icelandic', 'native': 'Íslenska'},
            'ga': {'name': 'Irish', 'native': 'Gaeilge'},
            'cy': {'name': 'Welsh', 'native': 'Cymraeg'},
            'eu': {'name': 'Basque', 'native': 'Euskara'},
            'ca': {'name': 'Catalan', 'native': 'Català'},
            'gl': {'name': 'Galician', 'native': 'Galego'},
            'ro': {'name': 'Romanian', 'native': 'Română'},
            'bg': {'name': 'Bulgarian', 'native': 'Български'},
            'hr': {'name': 'Croatian', 'native': 'Hrvatski'},
            'sr': {'name': 'Serbian', 'native': 'Српски'},
            'sk': {'name': 'Slovak', 'native': 'Slovenčina'},
            'sl': {'name': 'Slovenian', 'native': 'Slovenščina'},
            'et': {'name': 'Estonian', 'native': 'Eesti'},
            'lv': {'name': 'Latvian', 'native': 'Latviešu'},
            'lt': {'name': 'Lithuanian', 'native': 'Lietuvių'},
            'mt': {'name': 'Maltese', 'native': 'Malti'},
            'sq': {'name': 'Albanian', 'native': 'Shqip'},
            'mk': {'name': 'Macedonian', 'native': 'Македонски'},
            'bs': {'name': 'Bosnian', 'native': 'Bosanski'},
            'me': {'name': 'Montenegrin', 'native': 'Crnogorski'},
            'ky': {'name': 'Kyrgyz', 'native': 'Кыргызча'},
            'kk': {'name': 'Kazakh', 'native': 'Қазақша'},
            'uz': {'name': 'Uzbek', 'native': 'Oʻzbekcha'},
            'tg': {'name': 'Tajik', 'native': 'Тоҷикӣ'},
            'tk': {'name': 'Turkmen', 'native': 'Türkmençe'},
            'az': {'name': 'Azerbaijani', 'native': 'Azərbaycanca'},
            'hy': {'name': 'Armenian', 'native': 'Հայերեն'},
            'ku': {'name': 'Kurdish', 'native': 'Kurdî'},
            'ps': {'name': 'Pashto', 'native': 'پښتو'},
            'sd': {'name': 'Sindhi', 'native': 'سنڌي'},
            'bo': {'name': 'Tibetan', 'native': 'བོད་ཡིག'},
            'dz': {'name': 'Dzongkha', 'native': 'རྫོང་ཁ'},
            'ug': {'name': 'Uyghur', 'native': 'ئۇيغۇرچە'},
            'yi': {'name': 'Yiddish', 'native': 'יידיש'},
            'lb': {'name': 'Luxembourgish', 'native': 'Lëtzebuergesch'},
            'fo': {'name': 'Faroese', 'native': 'Føroyskt'},
            'sm': {'name': 'Samoan', 'native': 'Gagana Samoa'},
            'to': {'name': 'Tongan', 'native': 'Lea faka-Tonga'},
            'fj': {'name': 'Fijian', 'native': 'Vosa vaka-Viti'},
            'mi': {'name': 'Maori', 'native': 'Te Reo Māori'},
            'haw': {'name': 'Hawaiian', 'native': 'ʻŌlelo Hawaiʻi'},
            'co': {'name': 'Corsican', 'native': 'Corsu'},
            'sc': {'name': 'Sardinian', 'native': 'Sardu'},
            'vec': {'name': 'Venetian', 'native': 'Vèneto'},
            'fur': {'name': 'Friulian', 'native': 'Furlan'},
            'lld': {'name': 'Ladin', 'native': 'Ladin'},
            'rm': {'name': 'Romansh', 'native': 'Rumantsch'},
            'gsw': {'name': 'Swiss German', 'native': 'Schwiizertüütsch'},
            'bar': {'name': 'Bavarian', 'native': 'Boarisch'},
            'ksh': {'name': 'Colognian', 'native': 'Kölsch'},
            'nds': {'name': 'Low German', 'native': 'Plattdüütsch'},
            'pdc': {'name': 'Pennsylvania German', 'native': 'Pennsilfaanisch Deitsch'},
            'pfl': {'name': 'Palatinate German', 'native': 'Pälzisch'},
            'sxu': {'name': 'Upper Saxon', 'native': 'Obersächsisch'},
            'wae': {'name': 'Walser', 'native': 'Walser'},
            'als': {'name': 'Alemannic', 'native': 'Alemannisch'},
            'swg': {'name': 'Swabian', 'native': 'Schwäbisch'},
            'grc': {'name': 'Ancient Greek', 'native': 'Ἀρχαία ἑλληνικὴ'},
            'la': {'name': 'Latin', 'native': 'Latina'},
            'ang': {'name': 'Old English', 'native': 'Englisc'},
            'fro': {'name': 'Old French', 'native': 'Ancien français'},
            'goh': {'name': 'Old High German', 'native': 'Althochdeutsch'},
            'non': {'name': 'Old Norse', 'native': 'Norrænt'},
            'got': {'name': 'Gothic', 'native': '𐌲𐌿𐍄𐌹𐍃𐌺'},
            'sga': {'name': 'Old Irish', 'native': 'Sean-Ghaeilge'},
            'owl': {'name': 'Old Welsh', 'native': 'Hen Gymraeg'},
            'xcl': {'name': 'Classical Armenian', 'native': 'Գրաբար'},
            'peo': {'name': 'Old Persian', 'native': '𐎠𐎼𐎡𐎹'},
            'sa': {'name': 'Sanskrit', 'native': 'संस्कृतम्'},
            'pal': {'name': 'Pahlavi', 'native': '𐭯𐭠𐭧𐭫𐭥𐭩𐭪'},
            'ae': {'name': 'Avestan', 'native': '𐬀𐬎𐬯𐬙𐬀'},
            'hit': {'name': 'Hittite', 'native': '𒉈𒅆𒇷'},
            'akk': {'name': 'Akkadian', 'native': '𒀝𒅗𒁺𒌑'},
            'sux': {'name': 'Sumerian', 'native': '𒅴𒂠'},
            'egy': {'name': 'Egyptian', 'native': '𓂋𓏺𓈖 𓆎𓅓𓏏𓊖'},
            'cop': {'name': 'Coptic', 'native': 'Ⲙⲉⲧⲣⲉⲙⲛ̀ⲭⲏⲙⲓ'},
            'arc': {'name': 'Aramaic', 'native': 'ܐܪܡܝܐ'},
            'phn': {'name': 'Phoenician', 'native': '𐤃𐤁𐤓𐤉𐤌 𐤊𐤍𐤏𐤍𐤉𐤌'},
            'uga': {'name': 'Ugaritic', 'native': '𐎜𐎂𐎗𐎚'},
            'xpr': {'name': 'Parthian', 'native': '𐭀𐭓𐭔𐭊'},
            'xsc': {'name': 'Scythian', 'native': '𐎿𐎤𐎢𐎭𐎠'},
            'xss': {'name': 'Sarmatian', 'native': '𐎿𐎠𐎼𐎷𐎠𐎫'},
            'xme': {'name': 'Median', 'native': '𐎶𐎠𐎭'},
            'xbc': {'name': 'Bactrian', 'native': 'Αριαο'},
            'xhc': {'name': 'Hunnic', 'native': '𐰴𐰍𐰣'},
            'xav': {'name': 'Avar', 'native': 'Авар'},
            'xbu': {'name': 'Bulgar', 'native': '𐰉𐰆𐰞𐰍𐰺'},
            'xkh': {'name': 'Khazar', 'native': '𐰴𐰔𐰺'},
            'xpe': {'name': 'Pecheneg', 'native': '𐰯𐰲𐰤𐰴'},
            'xcu': {'name': 'Church Slavic', 'native': 'ⰔⰎⰑⰂⰡⰐⰠⰔⰍⰟ'},
            'xbm': {'name': 'Middle Breton', 'native': 'Brezhoneg krenn'},
            'xcb': {'name': 'Cumbric', 'native': 'Cumbraek'},
            'xga': {'name': 'Old Irish', 'native': 'Goídelc'},
            'xgl': {'name': 'Galician', 'native': 'Galego'},
            'xgm': {'name': 'Middle High German', 'native': 'Mittelhochdeutsch'},
            'xgo': {'name': 'Old Georgian', 'native': 'ძველი ქართული'},
            'xgr': {'name': 'Ancient Greek', 'native': 'Ἀρχαία ἑλληνικὴ'},
            'xhe': {'name': 'Ancient Hebrew', 'native': 'עברית עתיקה'},
            'xhi': {'name': 'Old Hindi', 'native': 'पुरानी हिंदी'},
            'xhr': {'name': 'Old Croatian', 'native': 'Staro hrvatski'},
            'xhu': {'name': 'Old Hungarian', 'native': 'Ómagyar'},
            'xhy': {'name': 'Old Armenian', 'native': 'Հին հայերեն'},
            'xid': {'name': 'Old Indonesian', 'native': 'Bahasa Indonesia Kuno'},
            'xja': {'name': 'Old Japanese', 'native': '上古日本語'},
            'xka': {'name': 'Old Georgian', 'native': 'ძველი ქართული'},
            'xko': {'name': 'Old Korean', 'native': '고대 한국어'},
            'xla': {'name': 'Latin', 'native': 'Latina'},
            'xlt': {'name': 'Old Lithuanian', 'native': 'Senasis lietuvių'},
            'xmk': {'name': 'Old Macedonian', 'native': 'Старомакедонски'},
            'xmn': {'name': 'Middle Mongolian', 'native': 'Дундад монгол'},
            'xmr': {'name': 'Old Marathi', 'native': 'जुनी मराठी'},
            'xms': {'name': 'Old Malay', 'native': 'Bahasa Melayu Kuno'},
            'xmy': {'name': 'Old Burmese', 'native': 'ပျူ'},
            'xne': {'name': 'Old Nepali', 'native': 'पुरानो नेपाली'},
            'xno': {'name': 'Old Norse', 'native': 'Norrænt'},
            'xoc': {'name': 'Old Occitan', 'native': 'Occitan ancian'},
            'xpe': {'name': 'Old Persian', 'native': '𐎠𐎼𐎡𐎹'},
            'xpl': {'name': 'Old Polish', 'native': 'Stary polski'},
            'xpt': {'name': 'Old Portuguese', 'native': 'Português antigo'},
            'xro': {'name': 'Old Romanian', 'native': 'Română veche'},
            'xru': {'name': 'Old Russian', 'native': 'Древнерусский'},
            'xsa': {'name': 'Old Sanskrit', 'native': 'प्राचीन संस्कृतम्'},
            'xsc': {'name': 'Old Scythian', 'native': '𐎿𐎤𐎢𐎭𐎠'},
            'xsk': {'name': 'Old Slovak', 'native': 'Starý slovenský'},
            'xsl': {'name': 'Old Slovenian', 'native': 'Stari slovenski'},
            'xsp': {'name': 'Old Spanish', 'native': 'Español antiguo'},
            'xsv': {'name': 'Old Swedish', 'native': 'Fornsvenska'},
            'xta': {'name': 'Old Tamil', 'native': 'பழைய தமிழ்'},
            'xtc': {'name': 'Old Telugu', 'native': 'పాత తెలుగు'},
            'xth': {'name': 'Old Thai', 'native': 'ภาษาไทยโบราณ'},
            'xtr': {'name': 'Old Turkish', 'native': 'Eski Türkçe'},
            'xuk': {'name': 'Old Ukrainian', 'native': 'Староукраїнська'},
            'xur': {'name': 'Old Urdu', 'native': 'پرانے اردو'},
            'xvi': {'name': 'Old Vietnamese', 'native': 'Tiếng Việt cổ'},
            'xzh': {'name': 'Old Chinese', 'native': '上古漢語'},
            'xzu': {'name': 'Old Zulu', 'native': 'IsiZulu esidala'},
        }
    
    def detect_language(self, text: str) -> Dict[str, any]:
        """Detect the language of the input text using multiple methods."""
        if not text or len(text.strip()) < 10:
            return {
                'detected_language': 'en',
                'confidence': 0.0,
                'method': 'fallback',
                'alternatives': []
            }
        
        results = {}
        
        # Method 1: langdetect
        try:
            langdetect_result = detect(text)
            langdetect_confidence = max([lang.prob for lang in detect_langs(text)])
            results['langdetect'] = {
                'language': langdetect_result,
                'confidence': langdetect_confidence
            }
        except Exception as e:
            logger.warning(f"langdetect failed: {e}")
            results['langdetect'] = {'language': 'en', 'confidence': 0.0}
        
        # Method 2: pycld2
        try:
            cld2_result = cld2.detect(text)
            if cld2_result[2]:
                cld2_lang = cld2_result[2][0][1]
                cld2_confidence = cld2_result[2][0][2]
            else:
                cld2_lang = 'en'
                cld2_confidence = 0.0
            results['pycld2'] = {
                'language': cld2_lang,
                'confidence': cld2_confidence / 100.0
            }
        except Exception as e:
            logger.warning(f"pycld2 failed: {e}")
            results['pycld2'] = {'language': 'en', 'confidence': 0.0}
        
        # Method 3: Simple heuristic (fallback)
        try:
            # Simple heuristic based on character sets
            if any(ord(char) > 127 for char in text[:100]):
                # Contains non-ASCII characters
                if any('\u4e00' <= char <= '\u9fff' for char in text[:100]):
                    results['heuristic'] = {'language': 'zh', 'confidence': 0.7}
                elif any('\u3040' <= char <= '\u309f' or '\u30a0' <= char <= '\u30ff' for char in text[:100]):
                    results['heuristic'] = {'language': 'ja', 'confidence': 0.7}
                elif any('\uac00' <= char <= '\ud7af' for char in text[:100]):
                    results['heuristic'] = {'language': 'ko', 'confidence': 0.7}
                elif any('\u0600' <= char <= '\u06ff' for char in text[:100]):
                    results['heuristic'] = {'language': 'ar', 'confidence': 0.7}
                else:
                    results['heuristic'] = {'language': 'en', 'confidence': 0.5}
            else:
                results['heuristic'] = {'language': 'en', 'confidence': 0.8}
        except Exception as e:
            logger.warning(f"heuristic detection failed: {e}")
            results['heuristic'] = {'language': 'en', 'confidence': 0.0}
        
        # Determine best result
        best_method = max(results.keys(), key=lambda k: results[k]['confidence'])
        best_result = results[best_method]
        
        # Get alternatives
        alternatives = []
        for method, result in results.items():
            if method != best_method and result['confidence'] > 0.3:
                alternatives.append({
                    'method': method,
                    'language': result['language'],
                    'confidence': result['confidence']
                })
        
        return {
            'detected_language': best_result['language'],
            'confidence': best_result['confidence'],
            'method': best_method,
            'alternatives': alternatives,
            'all_results': results
        }
    
    def translate_text(self, text: str, target_language: str, source_language: str = 'auto') -> Dict[str, any]:
        """Translate text to the target language."""
        if not text or not target_language:
            return {
                'translated_text': text,
                'source_language': source_language,
                'target_language': target_language,
                'confidence': 0.0,
                'error': 'Invalid input'
            }
        
        try:
            # Detect source language if auto
            if source_language == 'auto':
                detection = self.detect_language(text)
                source_language = detection['detected_language']
            
            # Don't translate if source and target are the same
            if source_language == target_language:
                return {
                    'translated_text': text,
                    'source_language': source_language,
                    'target_language': target_language,
                    'confidence': 1.0,
                    'no_translation_needed': True
                }
            
            # Translate using deep-translator
            translator = GoogleTranslator(source=source_language, target=target_language)
            translated_text = translator.translate(text)
            
            return {
                'translated_text': translated_text,
                'source_language': source_language,
                'target_language': target_language,
                'confidence': 0.9,  # deep-translator doesn't provide confidence scores
                'original_text': text
            }
            
        except Exception as e:
            logger.error(f"Translation failed: {e}")
            return {
                'translated_text': text,
                'source_language': source_language,
                'target_language': target_language,
                'confidence': 0.0,
                'error': str(e)
            }
    
    def get_supported_languages(self) -> Dict[str, Dict[str, str]]:
        """Get list of supported languages."""
        return self.supported_languages
    
    def get_language_name(self, language_code: str) -> str:
        """Get language name from language code."""
        return self.supported_languages.get(language_code, {}).get('name', language_code)
    
    def get_native_name(self, language_code: str) -> str:
        """Get native language name from language code."""
        return self.supported_languages.get(language_code, {}).get('native', language_code)
    
    def is_supported_language(self, language_code: str) -> bool:
        """Check if language is supported."""
        return language_code in self.supported_languages
    
    def get_language_family(self, language_code: str) -> str:
        """Get language family for the given language code."""
        # Simplified language families
        families = {
            'en': 'Germanic', 'de': 'Germanic', 'nl': 'Germanic', 'sv': 'Germanic', 
            'da': 'Germanic', 'no': 'Germanic', 'is': 'Germanic', 'af': 'Germanic',
            'fr': 'Romance', 'es': 'Romance', 'it': 'Romance', 'pt': 'Romance',
            'ro': 'Romance', 'ca': 'Romance', 'gl': 'Romance', 'oc': 'Romance',
            'ru': 'Slavic', 'pl': 'Slavic', 'uk': 'Slavic', 'bg': 'Slavic',
            'hr': 'Slavic', 'sr': 'Slavic', 'sk': 'Slavic', 'sl': 'Slavic',
            'zh': 'Sino-Tibetan', 'ja': 'Japonic', 'ko': 'Koreanic',
            'ar': 'Afro-Asiatic', 'he': 'Afro-Asiatic', 'fa': 'Indo-Iranian',
            'hi': 'Indo-Iranian', 'bn': 'Indo-Iranian', 'ur': 'Indo-Iranian',
            'th': 'Tai-Kadai', 'vi': 'Austroasiatic', 'id': 'Austronesian',
            'ms': 'Austronesian', 'tr': 'Turkic', 'az': 'Turkic', 'kk': 'Turkic',
            'uz': 'Turkic', 'ky': 'Turkic', 'tg': 'Indo-Iranian', 'tk': 'Turkic',
            'mn': 'Mongolic', 'ka': 'Kartvelian', 'hy': 'Indo-European',
            'am': 'Afro-Asiatic', 'sw': 'Niger-Congo', 'zu': 'Niger-Congo',
            'ne': 'Indo-Iranian', 'si': 'Indo-Iranian', 'my': 'Sino-Tibetan',
            'km': 'Austroasiatic', 'lo': 'Tai-Kadai', 'bo': 'Sino-Tibetan',
            'dz': 'Sino-Tibetan', 'ug': 'Turkic', 'yi': 'Germanic',
            'ku': 'Indo-Iranian', 'ps': 'Indo-Iranian', 'sd': 'Indo-Iranian'
        }
        return families.get(language_code, 'Other')


# Global language service instance
language_service = LanguageService() 