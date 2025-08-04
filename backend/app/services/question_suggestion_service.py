import re
from typing import List, Dict, Any
from app.services.rag_service import rag_service
import logging

logger = logging.getLogger(__name__)

class QuestionSuggestionService:
    """Service for generating intelligent question suggestions based on document content."""
    
    def __init__(self):
        self.common_question_templates = [
            "What is {topic}?",
            "How does {topic} work?",
            "What are the main features of {topic}?",
            "What services does {topic} offer?",
            "What are the requirements for {topic}?",
            "How do I {action}?",
            "What are the benefits of {topic}?",
            "What are the key points about {topic}?",
            "Can you explain {topic}?",
            "What should I know about {topic}?"
        ]
        
        self.action_templates = [
            "get started",
            "contact support",
            "file a complaint",
            "request maintenance",
            "pay rent",
            "renew lease",
            "report issues"
        ]
    
    def extract_topics_from_text(self, text: str) -> List[str]:
        """Extract potential topics from document text."""
        # Simple topic extraction based on common patterns
        topics = []
        
        # Look for company names (capitalized words)
        company_pattern = r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Management|Company|Corp|Inc|LLC|Ltd)\b'
        companies = re.findall(company_pattern, text)
        topics.extend(companies)
        
        # Look for service-related terms that have substantial content
        service_terms = [
            'property management', 'leasing', 'maintenance', 'rental', 
            'tenant', 'landlord', 'property', 'management', 'services',
            'repairs', 'inspections', 'advertising', 'showings'
        ]
        
        for term in service_terms:
            if term.lower() in text.lower():
                # Count how many times this term appears to gauge importance
                count = text.lower().count(term.lower())
                if count >= 2:  # Only include terms that appear multiple times
                    topics.append(term.title())
        
        # Look for section headers (lines with colons or numbered items)
        # Improved pattern to avoid very long matches and focus on meaningful headers
        header_pattern = r'^\d+\.\s*([^:\n]{3,30}):?$|^([A-Z][^:\n]{3,30}):$'
        headers = re.findall(header_pattern, text, re.MULTILINE)
        for header in headers:
            if header[0]:  # numbered items
                clean_header = header[0].strip()
                # Filter out headers that are too generic or don't make good questions
                if (len(clean_header) <= 30 and 
                    clean_header.lower() not in ['parties', 'agreement', 'terms', 'conditions', 'section'] and
                    not clean_header.isupper()):  # Avoid all-caps headers
                    topics.append(clean_header)
            elif header[1]:  # colon headers
                clean_header = header[1].strip()
                # Filter out headers that are too generic or don't make good questions
                if (len(clean_header) <= 30 and 
                    clean_header.lower() not in ['parties', 'agreement', 'terms', 'conditions', 'section'] and
                    not clean_header.isupper()):  # Avoid all-caps headers
                    topics.append(clean_header)
        
        # Look for common business terms (capitalized phrases) that appear multiple times
        business_terms_pattern = r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b'
        business_terms = re.findall(business_terms_pattern, text)
        
        # Filter business terms to avoid very long ones and count frequency
        term_freq = {}
        for term in business_terms:
            if 3 <= len(term) <= 50 and term not in topics:
                # Avoid terms that are just common words
                if not term.lower() in ['the', 'and', 'for', 'with', 'this', 'that', 'will', 'shall', 'have', 'been', 'from', 'they', 'their']:
                    term_freq[term] = term_freq.get(term, 0) + 1
        
        # Only include terms that appear at least twice
        for term, freq in term_freq.items():
            if freq >= 2:
                topics.append(term)
        
        # Remove duplicates and limit to top topics
        unique_topics = list(set(topics))
        # Sort by length (prefer shorter, cleaner topics)
        unique_topics.sort(key=len)
        return unique_topics[:8]  # Limit to top 8 topics instead of 10
    
    def generate_suggestions_for_collection(self, collection_name: str = "default") -> List[Dict[str, Any]]:
        """Generate question suggestions for a specific collection."""
        try:
            # Get collection info
            collections = rag_service.get_collections()
            target_collection = None
            
            for collection in collections:
                if collection.collection_name == collection_name:
                    target_collection = collection
                    break
            
            if not target_collection or target_collection.document_count == 0:
                return []
            
            # Get sample documents to analyze
            collection = rag_service.chroma_client.get_collection(name=collection_name)
            sample_docs = collection.get(limit=min(10, target_collection.document_count))
            
            # Extract topics from sample documents
            all_topics = []
            for doc in sample_docs['documents']:
                topics = self.extract_topics_from_text(doc)
                all_topics.extend(topics)
            
            # Get unique topics and their frequency
            topic_freq = {}
            for topic in all_topics:
                topic_freq[topic] = topic_freq.get(topic, 0) + 1
            
            # Sort by frequency
            sorted_topics = sorted(topic_freq.items(), key=lambda x: x[1], reverse=True)
            top_topics = [topic for topic, freq in sorted_topics[:5]]
            
            # Generate suggestions
            suggestions = []
            
            # Topic-based suggestions (limit to 8 to make room for actions)
            seen_topics = set()
            for topic in top_topics[:8]:
                if topic not in seen_topics:  # Avoid duplicates
                    seen_topics.add(topic)
                    # Use only one template per topic to avoid duplicates
                    question = self.common_question_templates[0].format(topic=topic)
                    suggestions.append({
                        "question": question,
                        "type": "topic",
                        "topic": topic,
                        "confidence": 0.4  # Lower confidence since we don't know if RAG can answer
                    })
            
            # Action-based suggestions (always include these)
            for action in self.action_templates:
                suggestions.append({
                    "question": f"How do I {action}?",
                    "type": "action",
                    "action": action,
                    "confidence": 0.2  # Lower confidence for generic actions
                })
            
            # Add document-specific action suggestions
            document_actions = [
                "contact Real Property Management",
                "request property maintenance", 
                "pay rent or security deposit",
                "renew or terminate lease",
                "report property issues",
                "schedule property inspection"
            ]
            
            for action in document_actions:
                suggestions.append({
                    "question": f"How do I {action}?",
                    "type": "action",
                    "action": action,
                    "confidence": 0.3  # Slightly higher confidence for document-specific actions
                })
            
            # Collection-specific suggestions
            if target_collection.document_count > 0:
                suggestions.append({
                    "question": f"What documents are in the {collection_name} collection?",
                    "type": "collection",
                    "confidence": 0.6  # Higher confidence for collection info
                })
                
                suggestions.append({
                    "question": f"Summarize the main topics in {collection_name}",
                    "type": "summary",
                    "confidence": 0.5  # Medium confidence for summaries
                })
            
            # Limit to top suggestions
            return suggestions[:20]  # Increased limit to accommodate all types
            
        except Exception as e:
            logger.error(f"Error generating suggestions: {str(e)}")
            return []
    
    def generate_suggestions_for_document(self, document_id: str, collection_name: str = "default") -> List[Dict[str, Any]]:
        """Generate question suggestions for a specific document."""
        try:
            # Get the specific document
            collection = rag_service.chroma_client.get_collection(name=collection_name)
            results = collection.get(where={"document_id": document_id})
            
            if not results['documents']:
                return []
            
            # Combine all chunks for the document
            document_text = " ".join(results['documents'])
            
            # Extract topics
            topics = self.extract_topics_from_text(document_text)
            
            # Generate document-specific suggestions
            suggestions = []
            
            for topic in topics[:5]:  # Top 5 topics
                suggestions.append({
                    "question": f"What does this document say about {topic}?",
                    "type": "document_topic",
                    "topic": topic,
                    "confidence": 0.4  # Lower confidence since we don't know if RAG can answer
                })
            
            # Add general document questions
            suggestions.extend([
                {
                    "question": "What is the main purpose of this document?",
                    "type": "document_purpose",
                    "confidence": 0.5  # Medium confidence
                },
                {
                    "question": "What are the key points in this document?",
                    "type": "document_summary",
                    "confidence": 0.4  # Lower confidence
                },
                {
                    "question": "Who is this document for?",
                    "type": "document_audience",
                    "confidence": 0.3  # Lower confidence
                }
            ])
            
            return suggestions[:10]
            
        except Exception as e:
            logger.error(f"Error generating document suggestions: {str(e)}")
            return []

# Global instance
question_suggestion_service = QuestionSuggestionService() 