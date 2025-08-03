import asyncio
import time
import datetime
import uuid
from typing import List, Dict, Optional
from app.services.generation_service import GenerationService
from app.services.input_processor import input_processor
from app.services.analytics_service import analytics_service
from app.models.requests import ModelComparisonResult, ModelComparisonResponse
import textstat
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
import re
import logging

logger = logging.getLogger(__name__)

class ModelComparisonService:
    def __init__(self):
        self.generation_service = GenerationService()
        
        # Download required NLTK data
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt')
        
        try:
            nltk.data.find('corpora/stopwords')
        except LookupError:
            nltk.download('stopwords')
    
    def _calculate_quality_metrics(self, original_text: str, summary: str) -> Dict[str, float]:
        """Calculate various quality metrics for the summary."""
        try:
            # Basic metrics
            original_length = len(original_text.split())
            summary_length = len(summary.split())
            compression_ratio = summary_length / original_length if original_length > 0 else 0
            
            # Readability metrics
            flesch_reading_ease = textstat.flesch_reading_ease(summary)
            flesch_kincaid_grade = textstat.flesch_kincaid_grade(summary)
            gunning_fog = textstat.gunning_fog(summary)
            
            # Coherence score (based on sentence flow)
            coherence_score = self._calculate_coherence_score(summary)
            
            # Relevance score (based on keyword overlap)
            relevance_score = self._calculate_relevance_score(original_text, summary)
            
            # Overall quality score (weighted combination)
            quality_score = self._calculate_overall_quality_score(
                compression_ratio, coherence_score, relevance_score, flesch_reading_ease
            )
            
            return {
                "quality_score": quality_score,
                "coherence_score": coherence_score,
                "relevance_score": relevance_score,
                "compression_ratio": compression_ratio,
                "flesch_reading_ease": flesch_reading_ease,
                "flesch_kincaid_grade": flesch_kincaid_grade,
                "gunning_fog": gunning_fog,
                "original_length": original_length,
                "summary_length": summary_length
            }
            
        except Exception as e:
            logger.error(f"Error calculating quality metrics: {str(e)}")
            return {
                "quality_score": 0.0,
                "coherence_score": 0.0,
                "relevance_score": 0.0,
                "compression_ratio": 0.0,
                "flesch_reading_ease": 0.0,
                "flesch_kincaid_grade": 0.0,
                "gunning_fog": 0.0,
                "original_length": len(original_text.split()),
                "summary_length": len(summary.split())
            }
    
    def _calculate_coherence_score(self, summary: str) -> float:
        """Calculate coherence score based on sentence flow and transitions."""
        try:
            sentences = sent_tokenize(summary)
            if len(sentences) < 2:
                return 1.0
            
            # Check for transition words
            transition_words = [
                'however', 'therefore', 'furthermore', 'moreover', 'additionally',
                'consequently', 'thus', 'hence', 'meanwhile', 'nevertheless',
                'nonetheless', 'in addition', 'on the other hand', 'for example',
                'in conclusion', 'to summarize', 'in summary'
            ]
            
            transition_count = 0
            for sentence in sentences:
                sentence_lower = sentence.lower()
                for word in transition_words:
                    if word in sentence_lower:
                        transition_count += 1
                        break
            
            # Calculate coherence based on transitions and sentence length consistency
            transition_score = min(transition_count / len(sentences), 1.0)
            
            # Check sentence length consistency
            sentence_lengths = [len(sent.split()) for sent in sentences]
            length_variance = sum((length - sum(sentence_lengths)/len(sentence_lengths))**2 for length in sentence_lengths) / len(sentence_lengths)
            consistency_score = max(0, 1 - (length_variance / 100))  # Normalize variance
            
            # Combined coherence score
            coherence_score = (transition_score * 0.6) + (consistency_score * 0.4)
            return min(coherence_score, 1.0)
            
        except Exception as e:
            logger.error(f"Error calculating coherence score: {str(e)}")
            return 0.5
    
    def _calculate_relevance_score(self, original_text: str, summary: str) -> float:
        """Calculate relevance score based on keyword overlap."""
        try:
            # Extract keywords from original text (simple approach)
            original_words = set(word.lower() for word in word_tokenize(original_text) 
                               if word.isalnum() and len(word) > 3)
            summary_words = set(word.lower() for word in word_tokenize(summary) 
                              if word.isalnum() and len(word) > 3)
            
            # Remove common stop words
            stop_words = set(stopwords.words('english'))
            original_keywords = original_words - stop_words
            summary_keywords = summary_words - stop_words
            
            if not original_keywords:
                return 0.5
            
            # Calculate overlap
            overlap = len(original_keywords.intersection(summary_keywords))
            relevance_score = overlap / len(original_keywords)
            
            return min(relevance_score, 1.0)
            
        except Exception as e:
            logger.error(f"Error calculating relevance score: {str(e)}")
            return 0.5
    
    def _calculate_overall_quality_score(self, compression_ratio: float, coherence_score: float, 
                                       relevance_score: float, readability_score: float) -> float:
        """Calculate overall quality score using weighted metrics."""
        try:
            # Normalize readability score (0-100 to 0-1)
            normalized_readability = max(0, min(1, readability_score / 100))
            
            # Weighted combination
            weights = {
                "compression": 0.25,  # Good compression is important
                "coherence": 0.30,    # Coherence is crucial
                "relevance": 0.30,    # Relevance is crucial
                "readability": 0.15   # Readability is nice to have
            }
            
            # Penalize extreme compression ratios
            compression_score = 1.0 - abs(compression_ratio - 0.3)  # Optimal around 30%
            compression_score = max(0, min(1, compression_score))
            
            overall_score = (
                compression_score * weights["compression"] +
                coherence_score * weights["coherence"] +
                relevance_score * weights["relevance"] +
                normalized_readability * weights["readability"]
            )
            
            return min(overall_score, 1.0)
            
        except Exception as e:
            logger.error(f"Error calculating overall quality score: {str(e)}")
            return 0.5
    
    async def compare_models(self, text: str, models: List[dict], max_length: int = 150,
                           temperature: float = 0.3, summary_type: str = "general") -> ModelComparisonResponse:
        """Compare multiple models for text summarization."""
        start_time = time.time()
        comparison_id = str(uuid.uuid4())
        
        try:
            # Process input text (no processing needed for plain text)
            processed_text = text
            
            # Generate summaries with all models concurrently
            tasks = []
            for model_config in models:
                task = self._generate_summary_with_model(
                    processed_text, model_config, max_length, temperature, summary_type
                )
                tasks.append(task)
            
            # Wait for all summaries to complete
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results and calculate metrics
            comparison_results = []
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    logger.error(f"Error with model {models[i]}: {str(result)}")
                    # Create error result
                    comparison_results.append(ModelComparisonResult(
                        model_provider=models[i].get("provider", "unknown"),
                        model_name=models[i].get("model", "unknown"),
                        summary=f"Error: {str(result)}",
                        original_length=len(processed_text.split()),
                        summary_length=0,
                        compression_ratio=0.0,
                        token_usage=None,
                        latency_ms=None,
                        quality_score=0.0,
                        coherence_score=0.0,
                        relevance_score=0.0,
                        timestamp=datetime.datetime.utcnow().isoformat()
                    ))
                else:
                    comparison_results.append(result)
            
            # Calculate comparison metrics
            comparison_metrics = self._calculate_comparison_metrics(comparison_results)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(comparison_results, comparison_metrics)
            
            total_time = (time.time() - start_time) * 1000
            
            return ModelComparisonResponse(
                comparison_id=comparison_id,
                original_text=processed_text,
                results=comparison_results,
                comparison_metrics=comparison_metrics,
                recommendations=recommendations,
                timestamp=datetime.datetime.utcnow().isoformat()
            )
            
        except Exception as e:
            logger.error(f"Error in model comparison: {str(e)}")
            raise Exception(f"Model comparison failed: {str(e)}")
    
    async def _generate_summary_with_model(self, text: str, model_config: dict, 
                                         max_length: int, temperature: float, 
                                         summary_type: str) -> ModelComparisonResult:
        """Generate summary with a specific model and calculate metrics."""
        start_time = time.time()
        
        try:
            # Create system prompt based on summary type
            system_prompt = self._create_summary_prompt(summary_type, max_length)
            
            # Generate summary
            full_content = ""
            token_usage = None
            latency_ms = 0
            
            async for chunk in self.generation_service.generate_text_stream(
                system_prompt=system_prompt,
                user_prompt=text,
                model_provider=model_config["provider"],
                model_name=model_config["model"],
                temperature=temperature,
                max_tokens=max_length * 2  # Allow more tokens for generation
            ):
                full_content += chunk.content
                if chunk.token_usage:
                    token_usage = chunk.token_usage
                if chunk.latency_ms:
                    latency_ms = chunk.latency_ms
            
            # Calculate quality metrics
            quality_metrics = self._calculate_quality_metrics(text, full_content)
            
            # Calculate compression ratio
            original_length = len(text.split())
            summary_length = len(full_content.split())
            compression_ratio = summary_length / original_length if original_length > 0 else 0
            
            return ModelComparisonResult(
                model_provider=model_config["provider"],
                model_name=model_config["model"],
                summary=full_content,
                original_length=original_length,
                summary_length=summary_length,
                compression_ratio=compression_ratio,
                token_usage=token_usage,
                latency_ms=latency_ms,
                quality_score=quality_metrics["quality_score"],
                coherence_score=quality_metrics["coherence_score"],
                relevance_score=quality_metrics["relevance_score"],
                timestamp=datetime.datetime.utcnow().isoformat()
            )
            
        except Exception as e:
            logger.error(f"Error generating summary with model {model_config}: {str(e)}")
            raise e
    
    def _create_summary_prompt(self, summary_type: str, max_length: int) -> str:
        """Create appropriate system prompt based on summary type."""
        base_prompt = f"Create a concise summary of the following text in approximately {max_length} words."
        
        if summary_type == "bullet_points":
            return base_prompt + " Format the summary as bullet points highlighting the key information."
        elif summary_type == "key_points":
            return base_prompt + " Focus on extracting the main ideas and key points from the text."
        elif summary_type == "extractive":
            return base_prompt + " Use extractive summarization by selecting the most important sentences from the text."
        else:  # general
            return base_prompt + " Provide a comprehensive yet concise summary that captures the main ideas."
    
    def _calculate_comparison_metrics(self, results: List[ModelComparisonResult]) -> Dict:
        """Calculate comparison metrics across all models."""
        try:
            if not results:
                return {}
            
            # Performance metrics
            latencies = [r.latency_ms for r in results if r.latency_ms]
            avg_latency = sum(latencies) / len(latencies) if latencies else 0
            
            # Quality metrics
            quality_scores = [r.quality_score for r in results if r.quality_score is not None]
            avg_quality = sum(quality_scores) / len(quality_scores) if quality_scores else 0
            
            coherence_scores = [r.coherence_score for r in results if r.coherence_score is not None]
            avg_coherence = sum(coherence_scores) / len(coherence_scores) if coherence_scores else 0
            
            relevance_scores = [r.relevance_score for r in results if r.relevance_score is not None]
            avg_relevance = sum(relevance_scores) / len(relevance_scores) if relevance_scores else 0
            
            # Compression metrics
            compression_ratios = [r.compression_ratio for r in results]
            avg_compression = sum(compression_ratios) / len(compression_ratios)
            
            # Find best performers
            best_quality = max(results, key=lambda x: x.quality_score or 0) if results else None
            fastest = min(results, key=lambda x: x.latency_ms or float('inf')) if results else None
            most_compressed = min(results, key=lambda x: x.compression_ratio) if results else None
            
            return {
                "average_latency_ms": avg_latency,
                "average_quality_score": avg_quality,
                "average_coherence_score": avg_coherence,
                "average_relevance_score": avg_relevance,
                "average_compression_ratio": avg_compression,
                "best_quality_model": f"{best_quality.model_provider}/{best_quality.model_name}" if best_quality else None,
                "fastest_model": f"{fastest.model_provider}/{fastest.model_name}" if fastest else None,
                "most_compressed_model": f"{most_compressed.model_provider}/{most_compressed.model_name}" if most_compressed else None,
                "total_models": len(results)
            }
            
        except Exception as e:
            logger.error(f"Error calculating comparison metrics: {str(e)}")
            return {}
    
    def _generate_recommendations(self, results: List[ModelComparisonResult], 
                                metrics: Dict) -> List[str]:
        """Generate recommendations based on comparison results."""
        recommendations = []
        
        try:
            if not results:
                return ["No models were successfully compared."]
            
            # Quality recommendations
            best_quality = max(results, key=lambda x: x.quality_score or 0)
            if best_quality.quality_score and best_quality.quality_score > 0.8:
                recommendations.append(f"🎯 **{best_quality.model_provider}/{best_quality.model_name}** provides the highest quality summary.")
            
            # Speed recommendations
            fastest = min(results, key=lambda x: x.latency_ms or float('inf'))
            if fastest.latency_ms and fastest.latency_ms < 2000:  # Less than 2 seconds
                recommendations.append(f"⚡ **{fastest.model_provider}/{fastest.model_name}** is the fastest option.")
            
            # Compression recommendations
            most_compressed = min(results, key=lambda x: x.compression_ratio)
            if most_compressed.compression_ratio < 0.2:
                recommendations.append(f"📝 **{most_compressed.model_provider}/{most_compressed.model_name}** provides the most concise summary.")
            
            # Balanced recommendations
            balanced_models = [r for r in results if r.quality_score and r.quality_score > 0.7 and 
                             r.latency_ms and r.latency_ms < 5000]
            if balanced_models:
                best_balanced = max(balanced_models, key=lambda x: x.quality_score)
                recommendations.append(f"⚖️ **{best_balanced.model_provider}/{best_balanced.model_name}** offers the best balance of quality and speed.")
            
            # Cost considerations (if token usage is available)
            cost_efficient = None
            for result in results:
                if result.token_usage and result.quality_score and result.quality_score > 0.7:
                    if not cost_efficient or result.token_usage.get('total_tokens', 0) < cost_efficient.token_usage.get('total_tokens', 0):
                        cost_efficient = result
            
            if cost_efficient:
                recommendations.append(f"💰 **{cost_efficient.model_provider}/{cost_efficient.model_name}** is the most cost-efficient option for good quality.")
            
            if not recommendations:
                recommendations.append("All models performed similarly. Choose based on your specific requirements.")
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")
            return ["Unable to generate recommendations due to an error."]


# Global model comparison service instance
model_comparison_service = ModelComparisonService() 