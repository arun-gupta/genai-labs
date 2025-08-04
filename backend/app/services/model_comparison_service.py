import asyncio
import time
import datetime
import uuid
from typing import List, Dict, Optional
from app.services.generation_service import GenerationService
from app.services.rag_service import rag_service
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
        self.rag_service = rag_service
        
        # Download required NLTK data with better error handling
        try:
            import ssl
            ssl._create_default_https_context = ssl._create_unverified_context
        except:
            pass
        
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            try:
                nltk.download('punkt', quiet=True)
            except Exception as e:
                logger.warning(f"Could not download punkt: {e}")
        
        try:
            nltk.data.find('corpora/stopwords')
        except LookupError:
            try:
                nltk.download('stopwords', quiet=True)
            except Exception as e:
                logger.warning(f"Could not download stopwords: {e}")
    
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
            # Try NLTK tokenization first, fallback to simple splitting
            try:
                sentences = sent_tokenize(summary)
            except Exception as e:
                logger.warning(f"NLTK sent_tokenize failed, using simple split: {e}")
                sentences = [s.strip() for s in summary.split('.') if s.strip()]
            
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
            if sentence_lengths:
                avg_length = sum(sentence_lengths) / len(sentence_lengths)
                length_variance = sum((length - avg_length)**2 for length in sentence_lengths) / len(sentence_lengths)
                consistency_score = max(0, 1 - (length_variance / 100))  # Normalize variance
            else:
                consistency_score = 0.5
            
            # Combined coherence score
            coherence_score = (transition_score * 0.6) + (consistency_score * 0.4)
            return min(coherence_score, 1.0)
            
        except Exception as e:
            logger.error(f"Error calculating coherence score: {str(e)}")
            return 0.5
    
    def _calculate_relevance_score(self, original_text: str, summary: str) -> float:
        """Calculate relevance score based on keyword overlap."""
        try:
            # Try NLTK tokenization first, fallback to simple splitting
            try:
                original_words = set(word.lower() for word in word_tokenize(original_text) 
                                   if word.isalnum() and len(word) > 3)
                summary_words = set(word.lower() for word in word_tokenize(summary) 
                                  if word.isalnum() and len(word) > 3)
            except Exception as e:
                logger.warning(f"NLTK word_tokenize failed, using simple split: {e}")
                original_words = set(word.lower() for word in original_text.split() 
                                   if word.isalnum() and len(word) > 3)
                summary_words = set(word.lower() for word in summary.split() 
                                  if word.isalnum() and len(word) > 3)
            
            # Remove common stop words (with fallback)
            try:
                stop_words = set(stopwords.words('english'))
            except Exception as e:
                logger.warning(f"Could not load stopwords, using empty set: {e}")
                stop_words = set()
            
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

    async def compare_generation_models(self, system_prompt: str, user_prompt: str, models: List[dict], 
                                      temperature: float = 0.7, max_tokens: Optional[int] = None,
                                      target_language: str = "en", translate_response: bool = False,
                                      output_format: str = "text") -> ModelComparisonResponse:
        """Compare multiple models for text generation."""
        start_time = time.time()
        comparison_id = str(uuid.uuid4())
        
        try:
            # Generate text with all models concurrently
            tasks = []
            for model_config in models:
                task = self._generate_text_with_model(
                    system_prompt, user_prompt, model_config, temperature, max_tokens,
                    target_language, translate_response, output_format
                )
                tasks.append(task)
            
            # Wait for all generations to complete
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
                        generated_text=f"Error: {str(result)}",
                        original_length=len(user_prompt.split()),
                        generated_length=0,
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
            comparison_metrics = self._calculate_generation_comparison_metrics(comparison_results)
            
            # Generate recommendations
            recommendations = self._generate_generation_recommendations(comparison_results, comparison_metrics)
            
            total_time = (time.time() - start_time) * 1000
            
            return ModelComparisonResponse(
                comparison_id=comparison_id,
                original_text=user_prompt,
                results=comparison_results,
                comparison_metrics=comparison_metrics,
                recommendations=recommendations,
                timestamp=datetime.datetime.utcnow().isoformat()
            )
            
        except Exception as e:
            logger.error(f"Error in generation model comparison: {str(e)}")
            raise Exception(f"Generation model comparison failed: {str(e)}")
    
    async def compare_rag_models(self, question: str, collection_names: List[str], models: List[dict],
                                temperature: float = 0.7, max_tokens: Optional[int] = None,
                                top_k: int = 5, similarity_threshold: float = -0.2,
                                filter_tags: List[str] = None) -> ModelComparisonResponse:
        """Compare multiple models for RAG question answering."""
        start_time = time.time()
        comparison_id = str(uuid.uuid4())
        
        try:
            # Generate answers with all models concurrently
            tasks = []
            for model_config in models:
                task = self._generate_rag_answer_with_model(
                    question, collection_names, model_config, temperature, max_tokens,
                    top_k, similarity_threshold, filter_tags
                )
                tasks.append(task)
            
            # Wait for all generations to complete
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
                        generated_text=f"Error: {str(result)}",
                        original_length=len(question.split()),
                        generated_length=0,
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
            comparison_metrics = self._calculate_rag_comparison_metrics(comparison_results)
            
            # Generate recommendations
            recommendations = self._generate_rag_recommendations(comparison_results, comparison_metrics)
            
            total_time = (time.time() - start_time) * 1000
            
            return ModelComparisonResponse(
                comparison_id=comparison_id,
                original_text=question,
                results=comparison_results,
                comparison_metrics=comparison_metrics,
                recommendations=recommendations,
                timestamp=datetime.datetime.utcnow().isoformat()
            )
            
        except Exception as e:
            logger.error(f"Error in RAG model comparison: {str(e)}")
            raise Exception(f"RAG model comparison failed: {str(e)}")

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

    async def _generate_text_with_model(self, system_prompt: str, user_prompt: str, model_config: dict,
                                      temperature: float, max_tokens: Optional[int],
                                      target_language: str, translate_response: bool,
                                      output_format: str) -> ModelComparisonResult:
        """Generate text with a specific model and calculate metrics."""
        start_time = time.time()
        
        try:
            # Generate text
            full_content = ""
            token_usage = None
            latency_ms = 0
            
            async for chunk in self.generation_service.generate_text_stream(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                model_provider=model_config["provider"],
                model_name=model_config["model"],
                temperature=temperature,
                max_tokens=max_tokens,
                target_language=target_language,
                translate_response=translate_response,
                output_format=output_format
            ):
                full_content += chunk.content
                if chunk.token_usage:
                    token_usage = chunk.token_usage
                if chunk.latency_ms:
                    latency_ms = chunk.latency_ms
            
            # Calculate quality metrics (using user prompt as reference)
            quality_metrics = self._calculate_quality_metrics(user_prompt, full_content)
            
            # Calculate generation length
            generated_length = len(full_content.split())
            original_length = len(user_prompt.split())
            
            return ModelComparisonResult(
                model_provider=model_config["provider"],
                model_name=model_config["model"],
                generated_text=full_content,
                original_length=original_length,
                generated_length=generated_length,
                token_usage=token_usage,
                latency_ms=latency_ms,
                quality_score=quality_metrics["quality_score"],
                coherence_score=quality_metrics["coherence_score"],
                relevance_score=quality_metrics["relevance_score"],
                timestamp=datetime.datetime.utcnow().isoformat()
            )
            
        except Exception as e:
            logger.error(f"Error generating text with model {model_config}: {str(e)}")
            raise e

    async def _generate_rag_answer_with_model(self, question: str, collection_names: List[str], 
                                            model_config: dict, temperature: float, 
                                            max_tokens: Optional[int], top_k: int,
                                            similarity_threshold: float, filter_tags: List[str]) -> ModelComparisonResult:
        """Generate RAG answer with a specific model and calculate metrics."""
        start_time = time.time()
        
        try:
            # Generate answer using RAG service
            full_content = ""
            token_usage = None
            latency_ms = 0
            sources = []
            confidence = None
            
            async for chunk in self.rag_service.ask_question_stream(
                question=question,
                collection_names=collection_names,
                model_provider=model_config["provider"],
                model_name=model_config["model"],
                temperature=temperature,
                max_tokens=max_tokens,
                top_k=top_k,
                similarity_threshold=similarity_threshold,
                filter_tags=filter_tags
            ):
                # Handle dictionary format from RAG service
                if isinstance(chunk, dict):
                    full_content += chunk.get("content", "")
                    if chunk.get("latency_ms"):
                        latency_ms = chunk.get("latency_ms")
                    if chunk.get("sources"):
                        sources = chunk.get("sources")
                    if chunk.get("confidence"):
                        confidence = chunk.get("confidence")
                else:
                    # Handle object format (fallback)
                    full_content += getattr(chunk, 'content', '')
                    if hasattr(chunk, 'token_usage'):
                        token_usage = chunk.token_usage
                    if hasattr(chunk, 'latency_ms'):
                        latency_ms = chunk.latency_ms
                    if hasattr(chunk, 'sources'):
                        sources = chunk.sources
                    if hasattr(chunk, 'confidence'):
                        confidence = chunk.confidence
            
            # Calculate quality metrics
            quality_metrics = self._calculate_rag_quality_metrics(question, full_content, sources, confidence)
            
            latency_ms = (time.time() - start_time) * 1000
            
            return ModelComparisonResult(
                model_provider=model_config["provider"],
                model_name=model_config["model"],
                generated_text=full_content,
                original_length=len(question.split()),
                generated_length=len(full_content.split()),
                token_usage=token_usage,
                latency_ms=latency_ms,
                quality_score=quality_metrics["overall_score"],
                coherence_score=quality_metrics["coherence_score"],
                relevance_score=quality_metrics["relevance_score"],
                timestamp=datetime.datetime.utcnow().isoformat()
            )
            
        except Exception as e:
            logger.error(f"Error generating RAG answer with model {model_config}: {str(e)}")
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
        """Calculate overall comparison metrics."""
        if not results:
            return {}
        
        # Calculate averages
        avg_latency = sum(r.latency_ms or 0 for r in results) / len(results)
        avg_quality = sum(r.quality_score or 0 for r in results) / len(results)
        avg_coherence = sum(r.coherence_score or 0 for r in results) / len(results)
        avg_relevance = sum(r.relevance_score or 0 for r in results) / len(results)
        avg_compression = sum(r.compression_ratio or 0 for r in results) / len(results)
        
        # Find best performers
        best_quality = max(results, key=lambda x: x.quality_score or 0)
        fastest = min(results, key=lambda x: x.latency_ms or float('inf'))
        most_compressed = min(results, key=lambda x: x.compression_ratio or float('inf'))
        
        return {
            "average_latency_ms": avg_latency,
            "average_quality_score": avg_quality,
            "average_coherence_score": avg_coherence,
            "average_relevance_score": avg_relevance,
            "average_compression_ratio": avg_compression,
            "best_quality_model": f"{best_quality.model_provider}/{best_quality.model_name}",
            "fastest_model": f"{fastest.model_provider}/{fastest.model_name}",
            "most_compressed_model": f"{most_compressed.model_provider}/{most_compressed.model_name}",
            "total_models": len(results)
        }

    def _calculate_generation_comparison_metrics(self, results: List[ModelComparisonResult]) -> Dict:
        """Calculate overall comparison metrics for generation."""
        if not results:
            return {}
        
        # Calculate averages
        avg_latency = sum(r.latency_ms or 0 for r in results) / len(results)
        avg_quality = sum(r.quality_score or 0 for r in results) / len(results)
        avg_coherence = sum(r.coherence_score or 0 for r in results) / len(results)
        avg_relevance = sum(r.relevance_score or 0 for r in results) / len(results)
        avg_length = sum(r.generated_length or 0 for r in results) / len(results)
        
        # Find best performers
        best_quality = max(results, key=lambda x: x.quality_score or 0)
        fastest = min(results, key=lambda x: x.latency_ms or float('inf'))
        longest = max(results, key=lambda x: x.generated_length or 0)
        
        return {
            "average_latency_ms": avg_latency,
            "average_quality_score": avg_quality,
            "average_coherence_score": avg_coherence,
            "average_relevance_score": avg_relevance,
            "average_generated_length": avg_length,
            "best_quality_model": f"{best_quality.model_provider}/{best_quality.model_name}",
            "fastest_model": f"{fastest.model_provider}/{fastest.model_name}",
            "longest_output_model": f"{longest.model_provider}/{longest.model_name}",
            "total_models": len(results)
        }

    def _calculate_rag_quality_metrics(self, question: str, answer: str, sources: List[dict], 
                                     confidence: dict) -> Dict[str, float]:
        """Calculate quality metrics for RAG answers."""
        # Calculate coherence score
        coherence_score = self._calculate_coherence_score(answer)
        
        # Calculate relevance score based on question-answer similarity
        relevance_score = self._calculate_relevance_score(question, answer)
        
        # Calculate source quality score
        source_quality_score = 0.0
        if sources:
            avg_similarity = sum(s.get('similarity_score', 0.0) for s in sources) / len(sources)
            source_diversity = len(set(s.get('document_id', '') for s in sources)) / len(sources)
            source_quality_score = (avg_similarity + source_diversity) / 2
        
        # Calculate confidence score
        confidence_score = 0.0
        if confidence:
            confidence_score = confidence.get('overall_confidence', 0.0)
        
        # Calculate overall score
        overall_score = (
            coherence_score * 0.3 +
            relevance_score * 0.3 +
            source_quality_score * 0.2 +
            confidence_score * 0.2
        )
        
        return {
            "overall_score": overall_score,
            "coherence_score": coherence_score,
            "relevance_score": relevance_score,
            "source_quality_score": source_quality_score,
            "confidence_score": confidence_score
        }

    def _calculate_rag_comparison_metrics(self, results: List[ModelComparisonResult]) -> Dict:
        """Calculate comparison metrics for RAG results."""
        if not results:
            return {}
        
        # Calculate averages
        avg_quality = sum(r.quality_score for r in results) / len(results)
        avg_coherence = sum(r.coherence_score for r in results) / len(results)
        avg_relevance = sum(r.relevance_score for r in results) / len(results)
        avg_latency = sum(r.latency_ms or 0 for r in results) / len(results)
        avg_length = sum(r.generated_length for r in results) / len(results)
        
        # Find best performers
        best_quality = max(results, key=lambda x: x.quality_score)
        fastest = min(results, key=lambda x: x.latency_ms or float('inf'))
        most_coherent = max(results, key=lambda x: x.coherence_score)
        most_relevant = max(results, key=lambda x: x.relevance_score)
        
        return {
            "average_quality": round(avg_quality, 3),
            "average_coherence": round(avg_coherence, 3),
            "average_relevance": round(avg_relevance, 3),
            "average_latency_ms": round(avg_latency, 2),
            "average_length": round(avg_length, 1),
            "best_quality_model": f"{best_quality.model_provider}/{best_quality.model_name}",
            "fastest_model": f"{fastest.model_provider}/{fastest.model_name}",
            "most_coherent_model": f"{most_coherent.model_provider}/{most_coherent.model_name}",
            "most_relevant_model": f"{most_relevant.model_provider}/{most_relevant.model_name}",
            "total_models": len(results)
        }

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

    def _generate_generation_recommendations(self, results: List[ModelComparisonResult], 
                                metrics: Dict) -> List[str]:
        """Generate recommendations based on generation comparison results."""
        recommendations = []
        
        try:
            if not results:
                return ["No models were successfully compared."]
            
            # Quality recommendations
            best_quality = max(results, key=lambda x: x.quality_score or 0)
            if best_quality.quality_score and best_quality.quality_score > 0.8:
                recommendations.append(f"🎯 **{best_quality.model_provider}/{best_quality.model_name}** provides the highest quality generation.")
            
            # Speed recommendations
            fastest = min(results, key=lambda x: x.latency_ms or float('inf'))
            if fastest.latency_ms and fastest.latency_ms < 2000:  # Less than 2 seconds
                recommendations.append(f"⚡ **{fastest.model_provider}/{fastest.model_name}** is the fastest option.")
            
            # Length recommendations
            longest = max(results, key=lambda x: x.generated_length or 0)
            if longest.generated_length and longest.generated_length > 100: # More than 100 words
                recommendations.append(f"📝 **{longest.model_provider}/{longest.model_name}** provides the longest output.")
            
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
            logger.error(f"Error generating generation recommendations: {str(e)}")
            return ["Unable to generate generation recommendations due to an error."]

    def _generate_rag_recommendations(self, results: List[ModelComparisonResult], 
                                    metrics: Dict) -> List[str]:
        """Generate recommendations for RAG model comparison."""
        if not results:
            return ["No models were successfully compared."]
        
        recommendations = []
        
        # Quality recommendations
        best_quality = max(results, key=lambda x: x.quality_score)
        recommendations.append(f"Best overall quality: {best_quality.model_provider}/{best_quality.model_name} (Score: {best_quality.quality_score:.2f})")
        
        # Speed recommendations
        fastest = min(results, key=lambda x: x.latency_ms or float('inf'))
        if fastest.latency_ms:
            recommendations.append(f"Fastest response: {fastest.model_provider}/{fastest.model_name} ({fastest.latency_ms:.0f}ms)")
        
        # Coherence recommendations
        most_coherent = max(results, key=lambda x: x.coherence_score)
        recommendations.append(f"Most coherent answer: {most_coherent.model_provider}/{most_coherent.model_name} (Score: {most_coherent.coherence_score:.2f})")
        
        # Relevance recommendations
        most_relevant = max(results, key=lambda x: x.relevance_score)
        recommendations.append(f"Most relevant answer: {most_relevant.model_provider}/{most_relevant.model_name} (Score: {most_relevant.relevance_score:.2f})")
        
        # Performance insights
        if metrics.get("average_quality", 0) > 0.7:
            recommendations.append("Overall model performance is excellent for this question.")
        elif metrics.get("average_quality", 0) > 0.5:
            recommendations.append("Overall model performance is good for this question.")
        else:
            recommendations.append("Consider refining the question or adding more relevant documents.")
        
        return recommendations


# Global model comparison service instance
model_comparison_service = ModelComparisonService()

def get_model_comparison_service() -> ModelComparisonService:
    """Get the global model comparison service instance."""
    return model_comparison_service 