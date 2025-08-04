import re
from typing import List, Dict, Any, Optional
from collections import Counter
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class DocumentAnalyticsService:
    """Service for analyzing documents and extracting insights."""
    
    def __init__(self):
        # Common business terms and entities
        self.business_entities = [
            'company', 'corporation', 'llc', 'inc', 'ltd', 'management', 'services',
            'property', 'real estate', 'leasing', 'maintenance', 'tenant', 'landlord',
            'contract', 'agreement', 'policy', 'procedure', 'regulation', 'compliance'
        ]
        
        # Document types
        self.document_types = {
            'agreement': ['agreement', 'contract', 'lease', 'terms', 'conditions'],
            'policy': ['policy', 'procedure', 'guideline', 'rule', 'regulation'],
            'manual': ['manual', 'guide', 'handbook', 'instructions', 'how-to'],
            'report': ['report', 'analysis', 'summary', 'review', 'assessment'],
            'form': ['form', 'application', 'request', 'submission', 'documentation']
        }
        
    def analyze_document_content(self, text: str, file_name: str) -> Dict[str, Any]:
        """Analyze document content and extract insights."""
        try:
            # Basic statistics
            stats = self._calculate_basic_stats(text)
            
            # Extract key topics
            topics = self._extract_topics(text)
            
            # Identify entities
            entities = self._extract_entities(text)
            
            # Determine document type
            doc_type = self._classify_document_type(text, file_name)
            
            # Extract key phrases
            key_phrases = self._extract_key_phrases(text)
            
            # Generate summary
            summary = self._generate_summary(text, topics, entities)
            
            # Calculate readability
            readability = self._calculate_readability(text)
            
            return {
                "file_name": file_name,
                "analysis_timestamp": datetime.utcnow().isoformat(),
                "document_type": doc_type,
                "statistics": stats,
                "topics": topics,
                "entities": entities,
                "key_phrases": key_phrases,
                "summary": summary,
                "readability": readability,
                "insights": self._generate_insights(stats, topics, entities, doc_type)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing document: {str(e)}")
            return {
                "file_name": file_name,
                "error": str(e),
                "analysis_timestamp": datetime.utcnow().isoformat()
            }
    
    def _calculate_basic_stats(self, text: str) -> Dict[str, Any]:
        """Calculate basic document statistics."""
        words = text.split()
        sentences = re.split(r'[.!?]+', text)
        paragraphs = [p for p in text.split('\n\n') if p.strip()]
        
        # Count different types of content
        numbers = len(re.findall(r'\d+', text))
        dates = len(re.findall(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}', text))
        emails = len(re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text))
        urls = len(re.findall(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', text))
        
        return {
            "word_count": len(words),
            "sentence_count": len([s for s in sentences if s.strip()]),
            "paragraph_count": len(paragraphs),
            "character_count": len(text),
            "average_words_per_sentence": len(words) / max(len([s for s in sentences if s.strip()]), 1),
            "average_sentence_length": len(text) / max(len([s for s in sentences if s.strip()]), 1),
            "numbers_found": numbers,
            "dates_found": dates,
            "emails_found": emails,
            "urls_found": urls,
            "estimated_reading_time_minutes": max(1, len(words) // 200)  # Average reading speed
        }
    
    def _extract_topics(self, text: str) -> List[Dict[str, Any]]:
        """Extract main topics from the document."""
        topics = []
        
        # Look for section headers
        headers = re.findall(r'^\d+\.\s*([^:\n]{3,50}):?$|^([A-Z][^:\n]{3,50}):$', text, re.MULTILINE)
        for header in headers:
            topic = header[0] if header[0] else header[1]
            if topic and len(topic.strip()) > 3:
                topics.append({
                    "topic": topic.strip(),
                    "type": "section_header",
                    "frequency": text.lower().count(topic.lower()),
                    "importance": "high"
                })
        
        # Look for business terms
        for term in self.business_entities:
            count = text.lower().count(term.lower())
            if count >= 2:  # Only include terms that appear multiple times
                topics.append({
                    "topic": term.title(),
                    "type": "business_term",
                    "frequency": count,
                    "importance": "medium" if count >= 5 else "low"
                })
        
        # Look for capitalized phrases (potential proper nouns)
        proper_nouns = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', text)
        noun_counts = Counter(proper_nouns)
        
        for noun, count in noun_counts.most_common(10):
            if count >= 2 and len(noun) > 3:
                topics.append({
                    "topic": noun,
                    "type": "proper_noun",
                    "frequency": count,
                    "importance": "medium" if count >= 3 else "low"
                })
        
        # Remove duplicates and sort by frequency
        unique_topics = {}
        for topic in topics:
            key = topic["topic"].lower()
            if key not in unique_topics or topic["frequency"] > unique_topics[key]["frequency"]:
                unique_topics[key] = topic
        
        return sorted(unique_topics.values(), key=lambda x: x["frequency"], reverse=True)[:15]
    
    def _extract_entities(self, text: str) -> Dict[str, List[str]]:
        """Extract entities from the document."""
        entities = {
            "companies": [],
            "people": [],
            "locations": [],
            "dates": [],
            "contact_info": []
        }
        
        # Extract company names
        company_pattern = r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Management|Company|Corp|Inc|LLC|Ltd|Group|Solutions|Services)\b'
        companies = re.findall(company_pattern, text)
        entities["companies"] = list(set(companies))
        
        # Extract people names (simple pattern)
        people_pattern = r'\b[A-Z][a-z]+\s+[A-Z][a-z]+\b'
        people = re.findall(people_pattern, text)
        # Filter out common words that might match
        common_words = ['Real Property', 'Property Management', 'Owner Manual', 'Owner Manual']
        entities["people"] = [p for p in set(people) if p not in common_words][:10]
        
        # Extract locations (addresses, cities, states)
        location_pattern = r'\b[A-Z][a-z]+,\s*[A-Z]{2}\s+\d{5}\b|\b[A-Z][a-z]+,\s*[A-Z]{2}\b'
        locations = re.findall(location_pattern, text)
        entities["locations"] = list(set(locations))
        
        # Extract dates
        date_pattern = r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}'
        dates = re.findall(date_pattern, text)
        entities["dates"] = list(set(dates))[:10]
        
        # Extract contact information
        phone_pattern = r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b'
        phones = re.findall(phone_pattern, text)
        entities["contact_info"] = phones
        
        return entities
    
    def _classify_document_type(self, text: str, file_name: str) -> str:
        """Classify the type of document."""
        text_lower = text.lower()
        file_lower = file_name.lower()
        
        scores = {}
        for doc_type, keywords in self.document_types.items():
            score = sum(text_lower.count(keyword) for keyword in keywords)
            scores[doc_type] = score
        
        # Check file extension
        if any(ext in file_lower for ext in ['.pdf', '.docx', '.txt']):
            if 'agreement' in file_lower or 'contract' in file_lower:
                return 'agreement'
            elif 'manual' in file_lower or 'guide' in file_lower:
                return 'manual'
            elif 'policy' in file_lower or 'procedure' in file_lower:
                return 'policy'
            elif 'report' in file_lower or 'analysis' in file_lower:
                return 'report'
            elif 'form' in file_lower or 'application' in file_lower:
                return 'form'
        
        # Return the type with highest score, or 'document' if no clear match
        if scores:
            best_type = max(scores, key=scores.get)
            return best_type if scores[best_type] > 0 else 'document'
        
        return 'document'
    
    def _extract_key_phrases(self, text: str) -> List[str]:
        """Extract key phrases from the document."""
        # Look for phrases in quotes
        quoted_phrases = re.findall(r'"([^"]{10,50})"', text)
        
        # Look for important sentences (containing key words)
        sentences = re.split(r'[.!?]+', text)
        important_sentences = []
        
        key_words = ['important', 'critical', 'essential', 'required', 'must', 'shall', 'will', 'policy', 'procedure']
        
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) > 20 and any(word in sentence.lower() for word in key_words):
                important_sentences.append(sentence[:100] + "..." if len(sentence) > 100 else sentence)
        
        # Combine and return unique phrases
        phrases = quoted_phrases + important_sentences[:5]
        return list(set(phrases))
    
    def _generate_summary(self, text: str, topics: List[Dict], entities: Dict[str, List[str]]) -> str:
        """Generate a brief summary of the document."""
        if not text:
            return "No content available for analysis."
        
        # Get the most important topics
        main_topics = [t["topic"] for t in topics[:3] if t["importance"] in ["high", "medium"]]
        
        # Get document type
        doc_type = self._classify_document_type(text, "")
        
        # Generate summary based on content
        summary_parts = []
        
        if main_topics:
            summary_parts.append(f"This {doc_type} covers: {', '.join(main_topics)}.")
        
        if entities["companies"]:
            summary_parts.append(f"Key organizations mentioned: {', '.join(entities['companies'][:3])}.")
        
        stats = self._calculate_basic_stats(text)
        summary_parts.append(f"Document contains {stats['word_count']} words across {stats['sentence_count']} sentences.")
        
        if not summary_parts:
            summary_parts.append("This document contains general information and business content.")
        
        return " ".join(summary_parts)
    
    def _calculate_readability(self, text: str) -> Dict[str, Any]:
        """Calculate readability metrics."""
        words = text.split()
        sentences = [s for s in re.split(r'[.!?]+', text) if s.strip()]
        
        if not words or not sentences:
            return {"score": 0, "level": "unknown", "complexity": "unknown"}
        
        # Calculate average words per sentence
        avg_words_per_sentence = len(words) / len(sentences)
        
        # Calculate average word length
        avg_word_length = sum(len(word) for word in words) / len(words)
        
        # Simple readability score (Flesch Reading Ease formula)
        # Formula: 206.835 - (1.015 × ASL) - (84.6 × ASW)
        # Where ASL = average sentence length, ASW = average syllables per word
        # For simplicity, we'll estimate syllables as word length / 3
        avg_syllables_per_word = avg_word_length / 3
        
        readability_score = 206.835 - (1.015 * avg_words_per_sentence) - (84.6 * avg_syllables_per_word)
        readability_score = max(0, min(100, readability_score))
        
        # Determine complexity level
        if readability_score >= 80:
            level = "easy"
            complexity = "simple"
        elif readability_score >= 60:
            level = "moderate"
            complexity = "moderate"
        elif readability_score >= 40:
            level = "difficult"
            complexity = "complex"
        else:
            level = "very_difficult"
            complexity = "very_complex"
        
        return {
            "score": round(readability_score, 1),
            "level": level,
            "complexity": complexity,
            "avg_words_per_sentence": round(avg_words_per_sentence, 1),
            "avg_word_length": round(avg_word_length, 1)
        }
    
    def _generate_insights(self, stats: Dict, topics: List[Dict], entities: Dict, doc_type: str) -> List[str]:
        """Generate insights about the document."""
        insights = []
        
        # Document size insights
        if stats["word_count"] > 1000:
            insights.append("This is a comprehensive document with detailed information.")
        elif stats["word_count"] < 200:
            insights.append("This is a brief document with concise information.")
        
        # Topic insights
        high_importance_topics = [t for t in topics if t["importance"] == "high"]
        if high_importance_topics:
            insights.append(f"Key focus areas: {', '.join([t['topic'] for t in high_importance_topics[:3]])}")
        
        # Entity insights
        if entities["companies"]:
            insights.append(f"References {len(entities['companies'])} organizations.")
        
        if entities["contact_info"]:
            insights.append("Contains contact information.")
        
        # Readability insights
        readability = self._calculate_readability(" ".join([t["topic"] for t in topics]))
        if readability["complexity"] in ["complex", "very_complex"]:
            insights.append("This document uses technical language and may require specialized knowledge.")
        
        # Document type insights
        if doc_type == "agreement":
            insights.append("This appears to be a legal or contractual document.")
        elif doc_type == "policy":
            insights.append("This document outlines policies or procedures.")
        elif doc_type == "manual":
            insights.append("This is an instructional or reference document.")
        
        return insights[:5]  # Limit to 5 insights

# Global instance
document_analytics_service = DocumentAnalyticsService() 