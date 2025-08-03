import re
from typing import Dict, List, Tuple
from textstat import textstat
import nltk
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.corpus import stopwords
from nltk.sentiment import SentimentIntensityAnalyzer
from collections import Counter
import math

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

try:
    nltk.data.find('vader_lexicon')
except LookupError:
    nltk.download('vader_lexicon')


class AnalyticsService:
    """Service for analyzing text and generating summarization metrics."""
    
    def __init__(self):
        try:
            self.stop_words = set(stopwords.words('english'))
            self.sentiment_analyzer = SentimentIntensityAnalyzer()
        except LookupError:
            # Fallback if NLTK data is not available
            self.stop_words = set(['a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'will', 'with'])
            self.sentiment_analyzer = None
    
    def analyze_text(self, original_text: str, summary_text: str) -> Dict:
        """Comprehensive text analysis for summarization."""
        return {
            "basic_metrics": self._calculate_basic_metrics(original_text, summary_text),
            "readability_scores": self._calculate_readability_scores(original_text, summary_text),
            "content_analysis": self._analyze_content(original_text, summary_text),
            "sentiment_analysis": self._analyze_sentiment(original_text, summary_text),
            "keyword_analysis": self._extract_keywords(original_text, summary_text),
            "summary_quality": self._assess_summary_quality(original_text, summary_text)
        }
    
    def _calculate_basic_metrics(self, original: str, summary: str) -> Dict:
        """Calculate basic text metrics."""
        # Simple tokenization fallback
        try:
            original_words = word_tokenize(original.lower())
            summary_words = word_tokenize(summary.lower())
            original_sentences = sent_tokenize(original)
            summary_sentences = sent_tokenize(summary)
        except LookupError:
            # Fallback to simple tokenization
            original_words = original.lower().split()
            summary_words = summary.lower().split()
            original_sentences = [s.strip() for s in original.split('.') if s.strip()]
            summary_sentences = [s.strip() for s in summary.split('.') if s.strip()]
        
        return {
            "original": {
                "characters": len(original),
                "words": len(original_words),
                "sentences": len(original_sentences),
                "paragraphs": len(original.split('\n\n')),
                "avg_sentence_length": len(original_words) / len(original_sentences) if original_sentences else 0,
                "avg_word_length": sum(len(word) for word in original_words) / len(original_words) if original_words else 0
            },
            "summary": {
                "characters": len(summary),
                "words": len(summary_words),
                "sentences": len(summary_sentences),
                "paragraphs": len(summary.split('\n\n')),
                "avg_sentence_length": len(summary_words) / len(summary_sentences) if summary_sentences else 0,
                "avg_word_length": sum(len(word) for word in summary_words) / len(summary_words) if summary_words else 0
            },
            "compression": {
                "character_ratio": len(summary) / len(original) if original else 0,
                "word_ratio": len(summary_words) / len(original_words) if original_words else 0,
                "sentence_ratio": len(summary_sentences) / len(original_sentences) if original_sentences else 0,
                "compression_percentage": (1 - len(summary_words) / len(original_words)) * 100 if original_words else 0
            }
        }
    
    def _calculate_readability_scores(self, original: str, summary: str) -> Dict:
        """Calculate various readability scores."""
        return {
            "original": {
                "flesch_reading_ease": textstat.flesch_reading_ease(original),
                "flesch_kincaid_grade": textstat.flesch_kincaid_grade(original),
                "gunning_fog": textstat.gunning_fog(original),
                "smog_index": textstat.smog_index(original),
                "automated_readability_index": textstat.automated_readability_index(original),
                "coleman_liau_index": textstat.coleman_liau_index(original),
                "linsear_write_formula": textstat.linsear_write_formula(original),
                "dale_chall_readability_score": textstat.dale_chall_readability_score(original)
            },
            "summary": {
                "flesch_reading_ease": textstat.flesch_reading_ease(summary),
                "flesch_kincaid_grade": textstat.flesch_kincaid_grade(summary),
                "gunning_fog": textstat.gunning_fog(summary),
                "smog_index": textstat.smog_index(summary),
                "automated_readability_index": textstat.automated_readability_index(summary),
                "coleman_liau_index": textstat.coleman_liau_index(summary),
                "linsear_write_formula": textstat.linsear_write_formula(summary),
                "dale_chall_readability_score": textstat.dale_chall_readability_score(summary)
            }
        }
    
    def _analyze_content(self, original: str, summary: str) -> Dict:
        """Analyze content characteristics."""
        # Simple tokenization fallback
        try:
            original_words = word_tokenize(original.lower())
            summary_words = word_tokenize(summary.lower())
        except LookupError:
            original_words = original.lower().split()
            summary_words = summary.lower().split()
        
        # Remove punctuation and stop words
        original_content_words = [word for word in original_words if word.isalpha() and word not in self.stop_words]
        summary_content_words = [word for word in summary_words if word.isalpha() and word not in self.stop_words]
        
        return {
            "vocabulary": {
                "original_unique_words": len(set(original_content_words)),
                "summary_unique_words": len(set(summary_content_words)),
                "vocabulary_diversity": len(set(original_content_words)) / len(original_content_words) if original_content_words else 0,
                "summary_vocabulary_retention": len(set(summary_content_words) & set(original_content_words)) / len(set(original_content_words)) if original_content_words else 0
            },
            "complexity": {
                "original_long_words": len([word for word in original_content_words if len(word) > 6]),
                "summary_long_words": len([word for word in summary_content_words if len(word) > 6]),
                "long_word_ratio": len([word for word in original_content_words if len(word) > 6]) / len(original_content_words) if original_content_words else 0
            }
        }
    
    def _analyze_sentiment(self, original: str, summary: str) -> Dict:
        """Analyze sentiment of original and summary."""
        if self.sentiment_analyzer is None:
            # Fallback sentiment analysis
            return {
                "original": {"neg": 0.0, "neu": 1.0, "pos": 0.0, "compound": 0.0},
                "summary": {"neg": 0.0, "neu": 1.0, "pos": 0.0, "compound": 0.0},
                "sentiment_preservation": {
                    "compound_difference": 0.0,
                    "sentiment_shift": 0.0
                }
            }
        
        original_sentiment = self.sentiment_analyzer.polarity_scores(original)
        summary_sentiment = self.sentiment_analyzer.polarity_scores(summary)
        
        return {
            "original": original_sentiment,
            "summary": summary_sentiment,
            "sentiment_preservation": {
                "compound_difference": abs(original_sentiment['compound'] - summary_sentiment['compound']),
                "sentiment_shift": summary_sentiment['compound'] - original_sentiment['compound']
            }
        }
    
    def _extract_keywords(self, original: str, summary: str) -> Dict:
        """Extract and analyze keywords."""
        # Simple tokenization fallback
        try:
            original_words = word_tokenize(original.lower())
            summary_words = word_tokenize(summary.lower())
        except LookupError:
            original_words = original.lower().split()
            summary_words = summary.lower().split()
        
        # Remove punctuation and stop words
        original_content_words = [word for word in original_words if word.isalpha() and word not in self.stop_words]
        summary_content_words = [word for word in summary_words if word.isalpha() and word not in self.stop_words]
        
        # Get word frequencies
        original_freq = Counter(original_content_words)
        summary_freq = Counter(summary_content_words)
        
        # Get top keywords
        original_top_keywords = original_freq.most_common(10)
        summary_top_keywords = summary_freq.most_common(10)
        
        # Calculate keyword overlap
        original_keywords = set(original_freq.keys())
        summary_keywords = set(summary_freq.keys())
        keyword_overlap = len(original_keywords & summary_keywords) / len(original_keywords) if original_keywords else 0
        
        return {
            "original_keywords": [{"word": word, "frequency": freq} for word, freq in original_top_keywords],
            "summary_keywords": [{"word": word, "frequency": freq} for word, freq in summary_top_keywords],
            "keyword_overlap_ratio": keyword_overlap,
            "keyword_preservation": len(original_keywords & summary_keywords)
        }
    
    def _assess_summary_quality(self, original: str, summary: str) -> Dict:
        """Assess the quality of the summary."""
        # Simple tokenization fallback
        try:
            original_words = word_tokenize(original.lower())
            summary_words = word_tokenize(summary.lower())
            summary_sentences = sent_tokenize(summary)
        except LookupError:
            original_words = original.lower().split()
            summary_words = summary.lower().split()
            summary_sentences = [s.strip() for s in summary.split('.') if s.strip()]
        
        # Calculate information density
        original_info_density = len([word for word in original_words if word.isalpha() and word not in self.stop_words]) / len(original_words) if original_words else 0
        summary_info_density = len([word for word in summary_words if word.isalpha() and word not in self.stop_words]) / len(summary_words) if summary_words else 0
        
        # Calculate coherence (simple measure based on sentence transitions)
        coherence_score = 0
        if len(summary_sentences) > 1:
            # Simple coherence based on sentence length consistency
            try:
                sentence_lengths = [len(word_tokenize(sent)) for sent in summary_sentences]
            except LookupError:
                sentence_lengths = [len(sent.split()) for sent in summary_sentences]
            coherence_score = 1 - (max(sentence_lengths) - min(sentence_lengths)) / max(sentence_lengths) if max(sentence_lengths) > 0 else 0
        
        return {
            "information_density": {
                "original": original_info_density,
                "summary": summary_info_density,
                "density_improvement": summary_info_density - original_info_density
            },
            "coherence_score": coherence_score,
            "quality_indicators": {
                "has_structure": len(summary.split('\n\n')) > 1 or len(summary.split('•')) > 1,
                "appropriate_length": 0.1 <= len(summary_words) / len(original_words) <= 0.5 if original_words else False,
                "maintains_key_concepts": len(set(summary_words) & set(original_words)) / len(set(original_words)) > 0.3 if original_words else False
            }
        }


# Global analytics service instance
analytics_service = AnalyticsService() 