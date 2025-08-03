import re
from typing import Dict, List, Tuple, Optional
from textstat import textstat
import nltk
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.corpus import stopwords
from nltk.sentiment import SentimentIntensityAnalyzer
from collections import Counter
import math
import ssl

# Fix SSL certificate issues for NLTK downloads
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

# Download required NLTK data (with SSL error handling)
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    try:
        nltk.download('punkt', quiet=True)
    except Exception:
        pass

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    try:
        nltk.download('stopwords', quiet=True)
    except Exception:
        pass

try:
    nltk.data.find('vader_lexicon')
except LookupError:
    try:
        nltk.download('vader_lexicon', quiet=True)
    except Exception:
        pass


class GenerationAnalyticsService:
    """Service for analyzing generated text and providing insights."""
    
    def __init__(self):
        try:
            self.stop_words = set(stopwords.words('english'))
            self.sentiment_analyzer = SentimentIntensityAnalyzer()
        except LookupError:
            # Fallback if NLTK data is not available
            self.stop_words = set(['a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'will', 'with'])
            self.sentiment_analyzer = None
    
    def analyze_generation(self, system_prompt: str, user_prompt: str, generated_text: str, output_format: str = "text") -> Dict:
        """Comprehensive analysis of generated text."""
        return {
            "prompt_analysis": self._analyze_prompts(system_prompt, user_prompt),
            "generation_metrics": self._calculate_generation_metrics(generated_text),
            "content_quality": self._analyze_content_quality(generated_text),
            "creativity_analysis": self._analyze_creativity(generated_text),
            "format_compliance": self._analyze_format_compliance(generated_text, output_format),
            "engagement_metrics": self._analyze_engagement(generated_text),
            "technical_analysis": self._analyze_technical_aspects(generated_text),
            "style_analysis": self._analyze_writing_style(generated_text),
            "coherence_analysis": self._analyze_coherence(generated_text),
            "diversity_metrics": self._analyze_diversity(generated_text)
        }
    
    def _analyze_prompts(self, system_prompt: str, user_prompt: str) -> Dict:
        """Analyze the input prompts."""
        # Simple tokenization fallback
        try:
            system_words = word_tokenize(system_prompt.lower())
            user_words = word_tokenize(user_prompt.lower())
        except LookupError:
            system_words = system_prompt.lower().split()
            user_words = user_prompt.lower().split()
        
        return {
            "system_prompt": {
                "length": len(system_prompt),
                "word_count": len(system_words),
                "complexity": self._calculate_complexity(system_prompt),
                "has_instructions": any(word in system_prompt.lower() for word in ['should', 'must', 'need', 'require', 'format', 'output']),
                "has_context": len(system_prompt) > 50
            },
            "user_prompt": {
                "length": len(user_prompt),
                "word_count": len(user_words),
                "complexity": self._calculate_complexity(user_prompt),
                "question_type": self._classify_question_type(user_prompt),
                "has_specific_request": any(word in user_prompt.lower() for word in ['write', 'create', 'generate', 'explain', 'describe', 'analyze'])
            },
            "prompt_relationship": {
                "system_user_ratio": len(system_prompt) / len(user_prompt) if user_prompt else 0,
                "total_prompt_length": len(system_prompt) + len(user_prompt),
                "instruction_clarity": self._assess_instruction_clarity(system_prompt, user_prompt)
            }
        }
    
    def _calculate_generation_metrics(self, generated_text: str) -> Dict:
        """Calculate basic generation metrics."""
        # Simple tokenization fallback
        try:
            words = word_tokenize(generated_text.lower())
            sentences = sent_tokenize(generated_text)
        except LookupError:
            words = generated_text.lower().split()
            sentences = [s.strip() for s in generated_text.split('.') if s.strip()]
        
        paragraphs = [p for p in generated_text.split('\n\n') if p.strip()]
        
        return {
            "basic_metrics": {
                "characters": len(generated_text),
                "words": len(words),
                "sentences": len(sentences),
                "paragraphs": len(paragraphs),
                "avg_sentence_length": len(words) / len(sentences) if sentences else 0,
                "avg_word_length": sum(len(word) for word in words) / len(words) if words else 0,
                "avg_paragraph_length": len(words) / len(paragraphs) if paragraphs else 0
            },
            "generation_efficiency": {
                "words_per_paragraph": len(words) / len(paragraphs) if paragraphs else 0,
                "sentences_per_paragraph": len(sentences) / len(paragraphs) if paragraphs else 0,
                "content_density": len([w for w in words if w.isalpha() and w not in self.stop_words]) / len(words) if words else 0
            }
        }
    
    def _analyze_content_quality(self, generated_text: str) -> Dict:
        """Analyze the quality of generated content."""
        # Simple tokenization fallback
        try:
            words = word_tokenize(generated_text.lower())
            sentences = sent_tokenize(generated_text)
        except LookupError:
            words = generated_text.lower().split()
            sentences = [s.strip() for s in generated_text.split('.') if s.strip()]
        
        content_words = [word for word in words if word.isalpha() and word not in self.stop_words]
        paragraphs = [p for p in generated_text.split('\n\n') if p.strip()]
        
        return {
            "vocabulary": {
                "unique_words": len(set(content_words)),
                "vocabulary_diversity": len(set(content_words)) / len(content_words) if content_words else 0,
                "word_frequency_distribution": self._calculate_word_frequency_distribution(content_words)
            },
            "complexity": {
                "long_words": len([word for word in content_words if len(word) > 6]),
                "long_word_ratio": len([word for word in content_words if len(word) > 6]) / len(content_words) if content_words else 0,
                "syllable_count": self._estimate_syllables(generated_text),
                "complexity_score": self._calculate_complexity(generated_text)
            },
            "structure": {
                "has_introduction": self._has_introduction(generated_text),
                "has_conclusion": self._has_conclusion(generated_text),
                "has_transitions": self._has_transitions(generated_text),
                "paragraph_coherence": self._assess_paragraph_coherence(paragraphs)
            }
        }
    
    def _analyze_creativity(self, generated_text: str) -> Dict:
        """Analyze creativity aspects of the generated text."""
        # Simple tokenization fallback
        try:
            words = word_tokenize(generated_text.lower())
        except LookupError:
            words = generated_text.lower().split()
        
        content_words = [word for word in words if word.isalpha() and word not in self.stop_words]
        
        return {
            "lexical_creativity": {
                "rare_words": len([word for word in content_words if len(word) > 8]),
                "unique_word_ratio": len(set(content_words)) / len(content_words) if content_words else 0,
                "vocabulary_richness": self._calculate_vocabulary_richness(content_words)
            },
            "syntactic_creativity": {
                "sentence_variety": self._calculate_sentence_variety(generated_text),
                "complex_sentences": self._count_complex_sentences(generated_text),
                "syntactic_diversity": self._calculate_syntactic_diversity(generated_text)
            },
            "semantic_creativity": {
                "metaphor_density": self._estimate_metaphor_density(generated_text),
                "abstract_concepts": self._count_abstract_concepts(generated_text),
                "creative_phrases": self._identify_creative_phrases(generated_text)
            }
        }
    
    def _analyze_format_compliance(self, generated_text: str, output_format: str) -> Dict:
        """Analyze compliance with the specified output format."""
        compliance_checks = {
            "text": self._check_text_format(generated_text),
            "json": self._check_json_format(generated_text),
            "xml": self._check_xml_format(generated_text),
            "markdown": self._check_markdown_format(generated_text),
            "csv": self._check_csv_format(generated_text),
            "yaml": self._check_yaml_format(generated_text),
            "html": self._check_html_format(generated_text),
            "bullet_points": self._check_bullet_points_format(generated_text),
            "numbered_list": self._check_numbered_list_format(generated_text),
            "table": self._check_table_format(generated_text)
        }
        
        return {
            "format_type": output_format,
            "compliance_score": compliance_checks.get(output_format, {}).get("score", 0),
            "format_validation": compliance_checks.get(output_format, {}),
            "format_suggestions": self._generate_format_suggestions(generated_text, output_format)
        }
    
    def _analyze_engagement(self, generated_text: str) -> Dict:
        """Analyze engagement potential of the generated text."""
        if self.sentiment_analyzer is None:
            sentiment_scores = {"neg": 0.0, "neu": 1.0, "pos": 0.0, "compound": 0.0}
        else:
            sentiment_scores = self.sentiment_analyzer.polarity_scores(generated_text)
        
        return {
            "sentiment": sentiment_scores,
            "emotional_appeal": {
                "positive_emotion_words": self._count_emotion_words(generated_text, "positive"),
                "negative_emotion_words": self._count_emotion_words(generated_text, "negative"),
                "emotional_intensity": abs(sentiment_scores["compound"])
            },
            "readability": {
                "flesch_reading_ease": textstat.flesch_reading_ease(generated_text),
                "flesch_kincaid_grade": textstat.flesch_kincaid_grade(generated_text),
                "gunning_fog": textstat.gunning_fog(generated_text),
                "smog_index": textstat.smog_index(generated_text)
            },
            "engagement_indicators": {
                "has_questions": "?" in generated_text,
                "has_exclamations": "!" in generated_text,
                "has_direct_address": any(word in generated_text.lower() for word in ["you", "your", "we", "our"]),
                "has_storytelling_elements": self._has_storytelling_elements(generated_text)
            }
        }
    
    def _analyze_technical_aspects(self, generated_text: str) -> Dict:
        """Analyze technical aspects of the generated text."""
        return {
            "code_analysis": {
                "has_code_blocks": "```" in generated_text or "<code>" in generated_text,
                "has_technical_terms": self._count_technical_terms(generated_text),
                "has_numbers": len(re.findall(r'\d+', generated_text)),
                "has_urls": len(re.findall(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', generated_text))
            },
            "structure_analysis": {
                "has_headers": len(re.findall(r'^#{1,6}\s', generated_text, re.MULTILINE)),
                "has_lists": len(re.findall(r'^[\*\-+]\s', generated_text, re.MULTILINE)) + len(re.findall(r'^\d+\.\s', generated_text, re.MULTILINE)),
                "has_bold": len(re.findall(r'\*\*.*?\*\*', generated_text)),
                "has_italic": len(re.findall(r'\*.*?\*', generated_text))
            },
            "language_features": {
                "has_quotes": generated_text.count('"') > 0,
                "has_parentheses": generated_text.count('(') > 0,
                "has_colons": generated_text.count(':') > 0,
                "has_semicolons": generated_text.count(';') > 0
            }
        }
    
    def _analyze_writing_style(self, generated_text: str) -> Dict:
        """Analyze the writing style of the generated text."""
        # Simple tokenization fallback
        try:
            sentences = sent_tokenize(generated_text)
        except LookupError:
            sentences = [s.strip() for s in generated_text.split('.') if s.strip()]
        
        return {
            "sentence_structure": {
                "avg_sentence_length": sum(len(s.split()) for s in sentences) / len(sentences) if sentences else 0,
                "sentence_variety": len(set(len(s.split()) for s in sentences)) / len(sentences) if sentences else 0,
                "complex_sentences": len([s for s in sentences if len(s.split()) > 20]),
                "simple_sentences": len([s for s in sentences if len(s.split()) <= 10])
            },
            "tone_analysis": {
                "formal_indicators": self._count_formal_indicators(generated_text),
                "casual_indicators": self._count_casual_indicators(generated_text),
                "academic_indicators": self._count_academic_indicators(generated_text),
                "conversational_indicators": self._count_conversational_indicators(generated_text)
            },
            "voice_analysis": {
                "active_voice": self._estimate_active_voice_ratio(generated_text),
                "passive_voice": self._estimate_passive_voice_ratio(generated_text),
                "first_person": len(re.findall(r'\b(I|me|my|mine|we|us|our|ours)\b', generated_text, re.IGNORECASE)),
                "second_person": len(re.findall(r'\b(you|your|yours)\b', generated_text, re.IGNORECASE)),
                "third_person": len(re.findall(r'\b(he|she|it|they|them|their|his|her|its)\b', generated_text, re.IGNORECASE))
            }
        }
    
    def _analyze_coherence(self, generated_text: str) -> Dict:
        """Analyze the coherence of the generated text."""
        paragraphs = [p for p in generated_text.split('\n\n') if p.strip()]
        
        return {
            "logical_flow": {
                "transition_words": self._count_transition_words(generated_text),
                "topic_consistency": self._assess_topic_consistency(paragraphs),
                "argument_structure": self._assess_argument_structure(generated_text)
            },
            "cohesion": {
                "pronoun_reference": self._assess_pronoun_reference(generated_text),
                "repetition_analysis": self._analyze_repetition(generated_text),
                "semantic_coherence": self._assess_semantic_coherence(generated_text)
            },
            "organization": {
                "has_clear_structure": self._has_clear_structure(generated_text),
                "paragraph_organization": self._assess_paragraph_organization(paragraphs),
                "logical_progression": self._assess_logical_progression(generated_text)
            }
        }
    
    def _analyze_diversity(self, generated_text: str) -> Dict:
        """Analyze diversity aspects of the generated text."""
        # Simple tokenization fallback
        try:
            words = word_tokenize(generated_text.lower())
        except LookupError:
            words = generated_text.lower().split()
        
        content_words = [word for word in words if word.isalpha() and word not in self.stop_words]
        paragraphs = [p for p in generated_text.split('\n\n') if p.strip()]
        
        return {
            "lexical_diversity": {
                "type_token_ratio": len(set(content_words)) / len(content_words) if content_words else 0,
                "hapax_legomena": len([word for word in set(content_words) if content_words.count(word) == 1]),
                "hapax_ratio": len([word for word in set(content_words) if content_words.count(word) == 1]) / len(set(content_words)) if content_words else 0
            },
            "semantic_diversity": {
                "concept_variety": self._count_unique_concepts(generated_text),
                "domain_coverage": self._assess_domain_coverage(generated_text),
                "perspective_diversity": self._assess_perspective_diversity(generated_text)
            },
            "structural_diversity": {
                "sentence_patterns": self._count_sentence_patterns(generated_text),
                "paragraph_variety": self._assess_paragraph_variety(paragraphs),
                "formatting_diversity": self._assess_formatting_diversity(generated_text)
            }
        }
    
    # Helper methods (implemented as stubs for now)
    def _calculate_complexity(self, text: str) -> float:
        """Calculate text complexity score."""
        try:
            words = word_tokenize(text.lower())
        except LookupError:
            words = text.lower().split()
        
        if not words:
            return 0.0
        
        long_words = len([w for w in words if len(w) > 6])
        sentences = len([s for s in text.split('.') if s.strip()])
        
        return (long_words / len(words) * 100) + (len(words) / sentences if sentences > 0 else 0)
    
    def _classify_question_type(self, prompt: str) -> str:
        """Classify the type of question/request."""
        prompt_lower = prompt.lower()
        if any(word in prompt_lower for word in ['explain', 'describe', 'what', 'how', 'why']):
            return "explanatory"
        elif any(word in prompt_lower for word in ['write', 'create', 'generate']):
            return "creative"
        elif any(word in prompt_lower for word in ['analyze', 'compare', 'evaluate']):
            return "analytical"
        elif any(word in prompt_lower for word in ['list', 'enumerate', 'itemize']):
            return "list"
        else:
            return "general"
    
    def _assess_instruction_clarity(self, system_prompt: str, user_prompt: str) -> float:
        """Assess the clarity of instructions."""
        clarity_indicators = ['should', 'must', 'need', 'require', 'format', 'output', 'include', 'provide']
        total_indicators = sum(1 for indicator in clarity_indicators if indicator in (system_prompt + user_prompt).lower())
        return min(total_indicators / 3, 1.0)  # Normalize to 0-1
    
    def _calculate_word_frequency_distribution(self, words: List[str]) -> Dict:
        """Calculate word frequency distribution."""
        if not words:
            return {}
        
        freq = Counter(words)
        total = len(words)
        return {
            "most_common": freq.most_common(5),
            "frequency_distribution": {word: count/total for word, count in freq.most_common(10)}
        }
    
    def _estimate_syllables(self, text: str) -> int:
        """Estimate syllable count."""
        # Simple estimation: count vowels and some consonant combinations
        vowels = 'aeiouy'
        syllable_count = 0
        text_lower = text.lower()
        
        for i, char in enumerate(text_lower):
            if char in vowels:
                if i == 0 or text_lower[i-1] not in vowels:
                    syllable_count += 1
        
        return syllable_count
    
    def _has_introduction(self, text: str) -> bool:
        """Check if text has an introduction."""
        first_paragraph = text.split('\n\n')[0] if text.split('\n\n') else ""
        intro_indicators = ['introduction', 'overview', 'summary', 'begin', 'start']
        return any(indicator in first_paragraph.lower() for indicator in intro_indicators)
    
    def _has_conclusion(self, text: str) -> bool:
        """Check if text has a conclusion."""
        last_paragraph = text.split('\n\n')[-1] if text.split('\n\n') else ""
        conclusion_indicators = ['conclusion', 'summary', 'finally', 'in conclusion', 'to conclude']
        return any(indicator in last_paragraph.lower() for indicator in conclusion_indicators)
    
    def _has_transitions(self, text: str) -> bool:
        """Check if text has transition words."""
        transition_words = ['however', 'therefore', 'furthermore', 'moreover', 'additionally', 'consequently']
        return any(word in text.lower() for word in transition_words)
    
    def _assess_paragraph_coherence(self, paragraphs: List[str]) -> float:
        """Assess coherence between paragraphs."""
        if len(paragraphs) < 2:
            return 1.0
        
        # Simple coherence measure based on shared words
        coherence_scores = []
        for i in range(len(paragraphs) - 1):
            words1 = set(paragraphs[i].lower().split())
            words2 = set(paragraphs[i+1].lower().split())
            if words1 and words2:
                overlap = len(words1 & words2)
                coherence_scores.append(overlap / min(len(words1), len(words2)))
        
        return sum(coherence_scores) / len(coherence_scores) if coherence_scores else 0.0
    
    def _calculate_vocabulary_richness(self, words: List[str]) -> float:
        """Calculate vocabulary richness."""
        if not words:
            return 0.0
        return len(set(words)) / len(words)
    
    def _calculate_sentence_variety(self, text: str) -> float:
        """Calculate sentence variety."""
        try:
            sentences = sent_tokenize(text)
        except LookupError:
            sentences = [s.strip() for s in text.split('.') if s.strip()]
        
        if len(sentences) < 2:
            return 0.0
        
        lengths = [len(s.split()) for s in sentences]
        return len(set(lengths)) / len(lengths)
    
    def _count_complex_sentences(self, text: str) -> int:
        """Count complex sentences."""
        try:
            sentences = sent_tokenize(text)
        except LookupError:
            sentences = [s.strip() for s in text.split('.') if s.strip()]
        
        return len([s for s in sentences if len(s.split()) > 20])
    
    def _calculate_syntactic_diversity(self, text: str) -> float:
        """Calculate syntactic diversity."""
        # Simplified measure based on sentence patterns
        try:
            sentences = sent_tokenize(text)
        except LookupError:
            sentences = [s.strip() for s in text.split('.') if s.strip()]
        
        if len(sentences) < 2:
            return 0.0
        
        patterns = []
        for sent in sentences:
            words = sent.split()
            if words:
                patterns.append(f"{words[0][:3]}_{len(words)}")
        
        return len(set(patterns)) / len(patterns)
    
    def _estimate_metaphor_density(self, text: str) -> float:
        """Estimate metaphor density."""
        # Simplified: look for common metaphorical expressions
        metaphor_indicators = ['like', 'as', 'metaphor', 'symbol', 'represents', 'stands for']
        count = sum(text.lower().count(indicator) for indicator in metaphor_indicators)
        return count / len(text.split()) if text.split() else 0.0
    
    def _count_abstract_concepts(self, text: str) -> int:
        """Count abstract concepts."""
        abstract_words = ['concept', 'idea', 'theory', 'principle', 'philosophy', 'notion', 'abstraction']
        return sum(text.lower().count(word) for word in abstract_words)
    
    def _identify_creative_phrases(self, text: str) -> List[str]:
        """Identify creative phrases."""
        # Simplified: look for unusual word combinations
        words = text.lower().split()
        creative_phrases = []
        for i in range(len(words) - 1):
            if len(words[i]) > 6 and len(words[i+1]) > 6:
                creative_phrases.append(f"{words[i]} {words[i+1]}")
        return creative_phrases[:5]  # Return top 5
    
    # Format checking methods
    def _check_text_format(self, text: str) -> Dict:
        return {"score": 1.0, "valid": True, "issues": []}
    
    def _check_json_format(self, text: str) -> Dict:
        try:
            import json
            json.loads(text)
            return {"score": 1.0, "valid": True, "issues": []}
        except:
            return {"score": 0.0, "valid": False, "issues": ["Invalid JSON format"]}
    
    def _check_xml_format(self, text: str) -> Dict:
        has_open = bool(re.search(r'<[^/][^>]*>', text))
        has_close = bool(re.search(r'</[^>]+>', text))
        score = 0.5 if has_open or has_close else 0.0
        return {"score": score, "valid": has_open and has_close, "issues": []}
    
    def _check_markdown_format(self, text: str) -> Dict:
        has_headers = bool(re.search(r'^#{1,6}\s', text, re.MULTILINE))
        has_bold = bool(re.search(r'\*\*.*?\*\*', text))
        has_italic = bool(re.search(r'\*.*?\*', text))
        score = (has_headers + has_bold + has_italic) / 3
        return {"score": score, "valid": score > 0, "issues": []}
    
    def _check_csv_format(self, text: str) -> Dict:
        lines = text.strip().split('\n')
        has_commas = any(',' in line for line in lines)
        return {"score": 1.0 if has_commas else 0.0, "valid": has_commas, "issues": []}
    
    def _check_yaml_format(self, text: str) -> Dict:
        try:
            import yaml
            yaml.safe_load(text)
            return {"score": 1.0, "valid": True, "issues": []}
        except:
            return {"score": 0.0, "valid": False, "issues": ["Invalid YAML format"]}
    
    def _check_html_format(self, text: str) -> Dict:
        has_open = bool(re.search(r'<[^/][^>]*>', text))
        has_close = bool(re.search(r'</[^>]+>', text))
        score = 0.5 if has_open or has_close else 0.0
        return {"score": score, "valid": has_open and has_close, "issues": []}
    
    def _check_bullet_points_format(self, text: str) -> Dict:
        has_bullets = bool(re.search(r'^[\*\-+•]\s', text, re.MULTILINE))
        return {"score": 1.0 if has_bullets else 0.0, "valid": has_bullets, "issues": []}
    
    def _check_numbered_list_format(self, text: str) -> Dict:
        has_numbers = bool(re.search(r'^\d+\.\s', text, re.MULTILINE))
        return {"score": 1.0 if has_numbers else 0.0, "valid": has_numbers, "issues": []}
    
    def _check_table_format(self, text: str) -> Dict:
        has_pipes = bool(re.search(r'\|', text))
        has_headers = bool(re.search(r'\|.*\|', text))
        score = 0.5 if has_pipes else 0.0
        return {"score": score, "valid": has_pipes and has_headers, "issues": []}
    
    def _generate_format_suggestions(self, text: str, format_type: str) -> List[str]:
        """Generate suggestions for improving format compliance."""
        suggestions = []
        if format_type == "json" and not text.strip().startswith('{'):
            suggestions.append("Add opening brace { to start JSON object")
        elif format_type == "markdown" and not re.search(r'^#{1,6}\s', text, re.MULTILINE):
            suggestions.append("Add headers using # syntax")
        elif format_type == "bullet_points" and not re.search(r'^[\*\-+•]\s', text, re.MULTILINE):
            suggestions.append("Add bullet points using * or - at line start")
        return suggestions
    
    def _count_emotion_words(self, text: str, emotion_type: str) -> int:
        """Count emotion words in text."""
        positive_words = ['happy', 'joy', 'excellent', 'wonderful', 'amazing', 'great', 'good']
        negative_words = ['sad', 'angry', 'terrible', 'awful', 'bad', 'horrible', 'disappointing']
        
        if emotion_type == "positive":
            return sum(text.lower().count(word) for word in positive_words)
        else:
            return sum(text.lower().count(word) for word in negative_words)
    
    def _has_storytelling_elements(self, text: str) -> bool:
        """Check for storytelling elements."""
        story_indicators = ['once', 'beginning', 'middle', 'end', 'character', 'plot', 'story']
        return any(indicator in text.lower() for indicator in story_indicators)
    
    def _count_technical_terms(self, text: str) -> int:
        """Count technical terms."""
        technical_words = ['algorithm', 'function', 'method', 'system', 'process', 'technology', 'implementation']
        return sum(text.lower().count(word) for word in technical_words)
    
    def _count_formal_indicators(self, text: str) -> int:
        """Count formal language indicators."""
        formal_words = ['furthermore', 'moreover', 'consequently', 'therefore', 'thus', 'hence']
        return sum(text.lower().count(word) for word in formal_words)
    
    def _count_casual_indicators(self, text: str) -> int:
        """Count casual language indicators."""
        casual_words = ['hey', 'cool', 'awesome', 'great', 'nice', 'fun']
        return sum(text.lower().count(word) for word in casual_words)
    
    def _count_academic_indicators(self, text: str) -> int:
        """Count academic language indicators."""
        academic_words = ['research', 'study', 'analysis', 'evidence', 'theory', 'hypothesis']
        return sum(text.lower().count(word) for word in academic_words)
    
    def _count_conversational_indicators(self, text: str) -> int:
        """Count conversational language indicators."""
        conversational_words = ['you', 'we', 'let\'s', 'imagine', 'suppose', 'think about']
        return sum(text.lower().count(word) for word in conversational_words)
    
    def _estimate_active_voice_ratio(self, text: str) -> float:
        """Estimate active voice ratio."""
        # Simplified: look for common active voice patterns
        active_patterns = ['is', 'are', 'was', 'were', 'has', 'have', 'had']
        total_verbs = len(re.findall(r'\b(is|are|was|were|has|have|had|do|does|did)\b', text, re.IGNORECASE))
        active_verbs = sum(text.lower().count(pattern) for pattern in active_patterns)
        return active_verbs / total_verbs if total_verbs > 0 else 0.0
    
    def _estimate_passive_voice_ratio(self, text: str) -> float:
        """Estimate passive voice ratio."""
        passive_patterns = ['is', 'are', 'was', 'were'] + ['by']
        passive_count = 0
        text_lower = text.lower()
        
        for i in range(len(passive_patterns) - 1):
            if passive_patterns[i] in text_lower and passive_patterns[i+1] in text_lower:
                passive_count += 1
        
        total_verbs = len(re.findall(r'\b(is|are|was|were|has|have|had|do|does|did)\b', text, re.IGNORECASE))
        return passive_count / total_verbs if total_verbs > 0 else 0.0
    
    def _count_transition_words(self, text: str) -> int:
        """Count transition words."""
        transitions = ['however', 'therefore', 'furthermore', 'moreover', 'additionally', 'consequently', 'meanwhile', 'nevertheless']
        return sum(text.lower().count(word) for word in transitions)
    
    def _assess_topic_consistency(self, paragraphs: List[str]) -> float:
        """Assess topic consistency across paragraphs."""
        if len(paragraphs) < 2:
            return 1.0
        
        # Simple measure: check for shared key words
        consistency_scores = []
        for i in range(len(paragraphs) - 1):
            words1 = set(paragraphs[i].lower().split())
            words2 = set(paragraphs[i+1].lower().split())
            if words1 and words2:
                overlap = len(words1 & words2)
                consistency_scores.append(overlap / min(len(words1), len(words2)))
        
        return sum(consistency_scores) / len(consistency_scores) if consistency_scores else 0.0
    
    def _assess_argument_structure(self, text: str) -> Dict:
        """Assess argument structure."""
        argument_indicators = ['because', 'since', 'therefore', 'thus', 'consequently', 'as a result']
        counter_indicators = ['however', 'but', 'although', 'despite', 'nevertheless']
        
        return {
            "argument_indicators": sum(text.lower().count(word) for word in argument_indicators),
            "counter_indicators": sum(text.lower().count(word) for word in counter_indicators),
            "has_clear_structure": len(argument_indicators) > 0 or len(counter_indicators) > 0
        }
    
    def _assess_pronoun_reference(self, text: str) -> float:
        """Assess pronoun reference clarity."""
        pronouns = ['he', 'she', 'it', 'they', 'this', 'that', 'these', 'those']
        pronoun_count = sum(text.lower().count(pronoun) for pronoun in pronouns)
        return min(pronoun_count / 10, 1.0)  # Normalize
    
    def _analyze_repetition(self, text: str) -> Dict:
        """Analyze repetition patterns."""
        words = text.lower().split()
        word_freq = Counter(words)
        repeated_words = [word for word, count in word_freq.items() if count > 2]
        
        return {
            "repeated_words": repeated_words[:5],
            "repetition_score": len(repeated_words) / len(set(words)) if words else 0.0
        }
    
    def _assess_semantic_coherence(self, text: str) -> float:
        """Assess semantic coherence."""
        # Simplified: check for related word clusters
        related_clusters = [
            ['technology', 'computer', 'software', 'system'],
            ['business', 'company', 'organization', 'management'],
            ['education', 'learning', 'teaching', 'student']
        ]
        
        coherence_score = 0
        for cluster in related_clusters:
            cluster_words = sum(text.lower().count(word) for word in cluster)
            if cluster_words > 1:
                coherence_score += 1
        
        return min(coherence_score / len(related_clusters), 1.0)
    
    def _has_clear_structure(self, text: str) -> bool:
        """Check if text has clear structure."""
        structure_indicators = ['first', 'second', 'third', 'finally', 'conclusion', 'introduction']
        return any(indicator in text.lower() for indicator in structure_indicators)
    
    def _assess_paragraph_organization(self, paragraphs: List[str]) -> float:
        """Assess paragraph organization."""
        if len(paragraphs) < 2:
            return 1.0
        
        # Check for logical paragraph lengths
        lengths = [len(p.split()) for p in paragraphs]
        avg_length = sum(lengths) / len(lengths)
        consistent_lengths = sum(1 for length in lengths if 0.5 * avg_length <= length <= 2 * avg_length)
        
        return consistent_lengths / len(paragraphs)
    
    def _assess_logical_progression(self, text: str) -> float:
        """Assess logical progression."""
        progression_indicators = ['first', 'then', 'next', 'finally', 'subsequently', 'afterward']
        return min(sum(text.lower().count(word) for word in progression_indicators) / 5, 1.0)
    
    def _count_unique_concepts(self, text: str) -> int:
        """Count unique concepts."""
        # Simplified: count unique nouns (words starting with capital letters)
        nouns = re.findall(r'\b[A-Z][a-z]+\b', text)
        return len(set(nouns))
    
    def _assess_domain_coverage(self, text: str) -> float:
        """Assess domain coverage."""
        domains = {
            'technology': ['computer', 'software', 'hardware', 'algorithm', 'system'],
            'business': ['company', 'market', 'profit', 'strategy', 'management'],
            'science': ['research', 'study', 'experiment', 'theory', 'hypothesis'],
            'education': ['learning', 'teaching', 'student', 'education', 'knowledge']
        }
        
        domain_scores = []
        for domain, keywords in domains.items():
            score = sum(text.lower().count(keyword) for keyword in keywords)
            domain_scores.append(score)
        
        return sum(domain_scores) / len(domain_scores) if domain_scores else 0.0
    
    def _assess_perspective_diversity(self, text: str) -> float:
        """Assess perspective diversity."""
        perspectives = ['I', 'we', 'you', 'they', 'he', 'she', 'it']
        used_perspectives = sum(1 for perspective in perspectives if perspective.lower() in text.lower())
        return used_perspectives / len(perspectives)
    
    def _count_sentence_patterns(self, text: str) -> int:
        """Count sentence patterns."""
        try:
            sentences = sent_tokenize(text)
        except LookupError:
            sentences = [s.strip() for s in text.split('.') if s.strip()]
        
        patterns = []
        for sent in sentences:
            words = sent.split()
            if words:
                # Create pattern based on first word and length
                patterns.append(f"{words[0][:3]}_{len(words)}")
        
        return len(set(patterns))
    
    def _assess_paragraph_variety(self, paragraphs: List[str]) -> float:
        """Assess paragraph variety."""
        if len(paragraphs) < 2:
            return 0.0
        
        lengths = [len(p.split()) for p in paragraphs]
        return len(set(lengths)) / len(lengths)
    
    def _assess_formatting_diversity(self, text: str) -> float:
        """Assess formatting diversity."""
        formatting_elements = [
            bool(re.search(r'^#{1,6}\s', text, re.MULTILINE)),  # Headers
            bool(re.search(r'\*\*.*?\*\*', text)),  # Bold
            bool(re.search(r'\*.*?\*', text)),  # Italic
            bool(re.search(r'^[\*\-+•]\s', text, re.MULTILINE)),  # Lists
            bool(re.search(r'^\d+\.\s', text, re.MULTILINE)),  # Numbered lists
            bool(re.search(r'\|', text))  # Tables
        ]
        
        return sum(formatting_elements) / len(formatting_elements)


# Global generation analytics service instance
generation_analytics_service = GenerationAnalyticsService() 