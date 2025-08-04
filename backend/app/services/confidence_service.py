import re
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class ConfidenceService:
    """Service for calculating confidence scores for RAG answers."""
    
    def __init__(self):
        # Confidence thresholds
        self.high_similarity_threshold = 0.7
        self.medium_similarity_threshold = 0.4
        self.low_similarity_threshold = 0.1
        
        # Source quality weights
        self.source_count_weight = 0.3
        self.similarity_weight = 0.4
        self.answer_quality_weight = 0.3
        
    def calculate_source_confidence(self, sources: List[Dict[str, Any]]) -> float:
        """Calculate confidence based on source quality."""
        if not sources:
            return 0.0
        
        # Count of sources (more sources = higher confidence)
        source_count_score = min(len(sources) / 5.0, 1.0)  # Cap at 5 sources
        
        # Average similarity score
        similarity_scores = [source.get('similarity_score', 0.0) for source in sources]
        avg_similarity = sum(similarity_scores) / len(similarity_scores) if similarity_scores else 0.0
        
        # Normalize similarity score (convert from distance-based to 0-1 scale)
        normalized_similarity = max(0.0, min(1.0, (avg_similarity + 1.0) / 2.0))
        
        # Source diversity (different documents = higher confidence)
        unique_docs = len(set(source.get('document_id', '') for source in sources))
        diversity_score = min(unique_docs / 3.0, 1.0)  # Cap at 3 unique documents
        
        # Calculate weighted source confidence
        source_confidence = (
            source_count_score * 0.3 +
            normalized_similarity * 0.4 +
            diversity_score * 0.3
        )
        
        return min(1.0, max(0.0, source_confidence))
    
    def calculate_answer_quality_confidence(self, answer: str, question: str) -> float:
        """Calculate confidence based on answer quality indicators."""
        if not answer or not question:
            return 0.0
        
        # Check for "no relevant information" responses
        no_info_phrases = [
            "couldn't find any relevant information",
            "no relevant information",
            "cannot be found in the context",
            "not found in the uploaded documents",
            "please try rephrasing"
        ]
        
        answer_lower = answer.lower()
        for phrase in no_info_phrases:
            if phrase in answer_lower:
                return 0.1  # Very low confidence for no-info responses
        
        # Check answer length (too short might indicate poor answer)
        if len(answer.strip()) < 20:
            return 0.3
        
        # Check for uncertainty indicators
        uncertainty_phrases = [
            "might be", "could be", "possibly", "perhaps", "maybe",
            "it's unclear", "not clear", "uncertain", "unclear",
            "based on limited information", "partial information"
        ]
        
        uncertainty_count = sum(1 for phrase in uncertainty_phrases if phrase in answer_lower)
        uncertainty_penalty = min(uncertainty_count * 0.1, 0.3)
        
        # Check for source citations (good indicator)
        source_indicators = [
            "source:", "according to", "as mentioned in", "from the document",
            "based on", "per the", "as stated in"
        ]
        
        source_count = sum(1 for phrase in source_indicators if phrase in answer_lower)
        source_bonus = min(source_count * 0.1, 0.2)
        
        # Base confidence starts at 0.7 for good answers
        base_confidence = 0.7
        
        # Apply adjustments
        final_confidence = base_confidence - uncertainty_penalty + source_bonus
        
        return min(1.0, max(0.0, final_confidence))
    
    def calculate_overall_confidence(self, answer: str, question: str, sources: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate overall confidence score and breakdown."""
        source_confidence = self.calculate_source_confidence(sources)
        answer_confidence = self.calculate_answer_quality_confidence(answer, question)
        
        # Calculate weighted overall confidence
        overall_confidence = (
            source_confidence * self.source_count_weight +
            answer_confidence * self.answer_quality_weight
        )
        
        # Determine confidence level
        if overall_confidence >= 0.8:
            confidence_level = "high"
        elif overall_confidence >= 0.6:
            confidence_level = "medium"
        elif overall_confidence >= 0.4:
            confidence_level = "low"
        else:
            confidence_level = "very_low"
        
        # Generate confidence explanation
        explanation = self._generate_confidence_explanation(
            overall_confidence, source_confidence, answer_confidence, sources
        )
        
        return {
            "overall_confidence": round(overall_confidence, 3),
            "confidence_level": confidence_level,
            "source_confidence": round(source_confidence, 3),
            "answer_confidence": round(answer_confidence, 3),
            "explanation": explanation,
            "factors": {
                "source_count": len(sources),
                "avg_similarity": round(sum(s.get('similarity_score', 0.0) for s in sources) / len(sources), 3) if sources else 0.0,
                "unique_documents": len(set(s.get('document_id', '') for s in sources)),
                "answer_length": len(answer),
                "has_sources": ("source:" in answer.lower() or "according to" in answer.lower())
            }
        }
    
    def _generate_confidence_explanation(self, overall: float, source: float, answer: float, sources: List[Dict[str, Any]]) -> str:
        """Generate a human-readable explanation of the confidence score."""
        explanations = []
        
        # Source-based explanations
        if source >= 0.8:
            explanations.append("Strong source matches found")
        elif source >= 0.6:
            explanations.append("Good source matches available")
        elif source >= 0.4:
            explanations.append("Moderate source matches")
        else:
            explanations.append("Limited source matches")
        
        # Answer quality explanations
        if answer >= 0.8:
            explanations.append("Comprehensive answer provided")
        elif answer >= 0.6:
            explanations.append("Good answer quality")
        elif answer >= 0.4:
            explanations.append("Basic answer provided")
        else:
            explanations.append("Answer quality concerns")
        
        # Overall assessment
        if overall >= 0.8:
            explanations.append("High confidence in this response")
        elif overall >= 0.6:
            explanations.append("Moderate confidence in this response")
        elif overall >= 0.4:
            explanations.append("Low confidence - consider verifying")
        else:
            explanations.append("Very low confidence - response may be unreliable")
        
        return ". ".join(explanations) + "."

# Global instance
confidence_service = ConfidenceService() 