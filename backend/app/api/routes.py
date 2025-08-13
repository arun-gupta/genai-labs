from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form, Depends
from fastapi.responses import StreamingResponse, Response
from sse_starlette.sse import EventSourceResponse
from typing import Optional
from app.models.requests import (
    GenerateRequest, SummarizeRequest, ModelProvider, RAGQuestionRequest, 
    RAGQuestionResponse, DocumentUploadRequest, DocumentUploadResponse, 
    CollectionInfo, DeleteDocumentRequest, ModelComparisonRequest, 
    ModelComparisonResponse, GenerationComparisonRequest, RAGModelComparisonRequest,
    ImageAnalysisRequest, ImageAnalysisResponse, ImageComparisonRequest, ImageComparisonResponse,
    ImageGenerationRequest, ImageGenerationResponse, ImageVariationRequest, ImageEditRequest
)
from app.models.responses import GenerationResponse, SummarizeResponse, StreamChunk, ErrorResponse
from app.services.generation_service import GenerationService
from app.services.input_processor import input_processor
from app.services.analytics_service import analytics_service
from app.services.generation_analytics_service import generation_analytics_service
from app.services.language_service import language_service
from app.services.model_availability_service import model_availability_service
from app.services.prompt_template_service import prompt_template_service
from app.services.export_service import export_service
from app.services.rag_service import rag_service
from app.services.model_comparison_service import ModelComparisonService, get_model_comparison_service
from app.services.question_suggestion_service import question_suggestion_service
from app.services.document_analytics_service import document_analytics_service
from app.services.image_analysis_service import image_analysis_service
from app.services.image_generation_service import image_generation_service
from app.services.integrated_diffusion_service import integrated_diffusion_service
import json
import time
import datetime
import io
import logging
import base64
import numpy as np
import wave
import audioop
import speech_recognition as sr
import pyttsx3
import gtts
import asyncio
import edge_tts
import tempfile
import os
import re
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


def normalize_text_for_tts(text: str) -> str:
    """Normalize text for better TTS pronunciation."""
    # Convert numbers to words
    text = re.sub(r'\b(\d+)\b', lambda m: _number_to_words(int(m.group(1))), text)
    
    # Convert common abbreviations
    abbreviations = {
        'Mr.': 'Mister',
        'Mrs.': 'Missus',
        'Dr.': 'Doctor',
        'Prof.': 'Professor',
        'vs.': 'versus',
        'etc.': 'et cetera',
        'i.e.': 'that is',
        'e.g.': 'for example',
        'a.m.': 'A M',
        'p.m.': 'P M',
        'U.S.A.': 'U S A',
        'U.K.': 'U K',
        'U.S.': 'U S',
        'A.I.': 'A I',
        'M.L.': 'M L',
        'PhD': 'P H D',
        'CEO': 'C E O',
        'CFO': 'C F O',
        'CTO': 'C T O',
        'HR': 'H R',
        'IT': 'I T',
        'TV': 'T V',
        'PC': 'P C',
        'CD': 'C D',
        'DVD': 'D V D',
        'USB': 'U S B',
        'WiFi': 'Wi Fi',
        'GPS': 'G P S',
        'DNA': 'D N A',
        'RNA': 'R N A',
        'COVID': 'Covid',
        'NASA': 'N A S A',
        'FBI': 'F B I',
        'CIA': 'C I A',
        'IRS': 'I R S',
        'FDA': 'F D A',
        'EPA': 'E P A',
        'UN': 'U N',
        'EU': 'E U',
        'UNESCO': 'U N E S C O',
        'WHO': 'W H O',
        'UNICEF': 'U N I C E F',
        'NATO': 'N A T O',
        'EU': 'E U',
        'IMF': 'I M F',
        'WTO': 'W T O',
        'UN': 'U N',
        'UNESCO': 'U N E S C O',
        'WHO': 'W H O',
        'UNICEF': 'U N I C E F',
        'NATO': 'N A T O',
        'EU': 'E U',
        'IMF': 'I M F',
        'WTO': 'W T O'
    }
    
    for abbr, full in abbreviations.items():
        text = re.sub(r'\b' + re.escape(abbr) + r'\b', full, text, flags=re.IGNORECASE)
    
    # Convert symbols to words
    symbols = {
        '@': 'at',
        '#': 'number',
        '$': 'dollars',
        '%': 'percent',
        '&': 'and',
        '+': 'plus',
        '=': 'equals',
        '<': 'less than',
        '>': 'greater than',
        '|': 'or',
        '~': 'approximately',
        '^': 'to the power of',
        '°': 'degrees',
        '©': 'copyright',
        '®': 'registered trademark',
        '™': 'trademark',
        '€': 'euros',
        '£': 'pounds',
        '¥': 'yen',
        '¢': 'cents',
        '∞': 'infinity',
        '≠': 'not equal to',
        '≤': 'less than or equal to',
        '≥': 'greater than or equal to',
        '±': 'plus or minus',
        '÷': 'divided by',
        '×': 'times',
        '√': 'square root of',
        '²': 'squared',
        '³': 'cubed',
        '¼': 'one fourth',
        '½': 'one half',
        '¾': 'three fourths',
        '⅓': 'one third',
        '⅔': 'two thirds',
        '⅕': 'one fifth',
        '⅖': 'two fifths',
        '⅗': 'three fifths',
        '⅘': 'four fifths',
        '⅙': 'one sixth',
        '⅚': 'five sixths',
        '⅛': 'one eighth',
        '⅜': 'three eighths',
        '⅝': 'five eighths',
        '⅞': 'seven eighths'
    }
    
    for symbol, word in symbols.items():
        text = text.replace(symbol, f' {word} ')
    
    # Clean up extra spaces
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text


def _number_to_words(n: int) -> str:
    """Convert numbers to words for better pronunciation."""
    if n == 0:
        return "zero"
    
    units = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"]
    teens = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"]
    tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]
    
    if n < 10:
        return units[n]
    elif n < 20:
        return teens[n - 10]
    elif n < 100:
        if n % 10 == 0:
            return tens[n // 10]
        else:
            return f"{tens[n // 10]} {units[n % 10]}"
    elif n < 1000:
        if n % 100 == 0:
            return f"{units[n // 100]} hundred"
        else:
            return f"{units[n // 100]} hundred {_number_to_words(n % 100)}"
    elif n < 1000000:
        if n % 1000 == 0:
            return f"{_number_to_words(n // 1000)} thousand"
        else:
            return f"{_number_to_words(n // 1000)} thousand {_number_to_words(n % 1000)}"
    else:
        return str(n)  # For very large numbers, just return as string


def process_ssml(text: str, style: str = "", emotion: str = "", speed: float = 1.0, pitch: float = 0, voice: str = "") -> str:
    """Process text with SSML markup for enhanced TTS."""
    # Check if text already contains SSML markup
    if text.strip().startswith('<speak'):
        # If text already has SSML, ensure it has proper namespace
        if 'xmlns=' not in text:
            # Add namespace to existing SSML
            text = text.replace('<speak>', '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">')
        return text
    
    # Only generate SSML if we actually have speed/pitch modifications
    # Otherwise, return plain text to avoid SSML issues
    if speed == 1.0 and pitch == 0:
        return text
    
    # Start with basic SSML wrapper
    ssml = f'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">'
    
    # Add prosody for speed and pitch only (Edge TTS doesn't support style in prosody)
    prosody_attrs = []
    
    if speed != 1.0:
        prosody_attrs.append(f'rate="{speed:.1f}"')
    if pitch != 0:
        prosody_attrs.append(f'pitch="{pitch:+d}%"')
    
    # Note: Edge TTS doesn't support 'style' or 'emotion' attributes in prosody tags
    # These would cause the tags to be spoken literally
    # We'll handle speaking styles through voice selection instead
    
    # Add the text with prosody if we have attributes
    if prosody_attrs:
        ssml += f'<prosody {" ".join(prosody_attrs)}>'
        ssml += text
        ssml += '</prosody>'
    else:
        ssml += text
    
    ssml += '</speak>'
    return ssml


def detect_text_language(text: str) -> str:
    """Detect the language of the input text."""
    try:
        from langdetect import detect
        
        # For very short text or common English phrases, default to English
        text_lower = text.lower().strip()
        common_english_phrases = ['hi', 'hello', 'hey', 'how are you', 'good morning', 'good afternoon', 'good evening', 'thank you', 'thanks', 'bye', 'goodbye']
        
        if len(text.split()) <= 3 or any(phrase in text_lower for phrase in common_english_phrases):
            return 'en-US'
        
        detected_lang = detect(text)
        
        # Map detected language codes to TTS language codes
        lang_mapping = {
            'en': 'en-US',
            'es': 'es-ES', 
            'fr': 'fr-FR',
            'de': 'de-DE',
            'it': 'it-IT',
            'pt': 'pt-BR',
            'ru': 'ru-RU',
            'ja': 'ja-JP',
            'ko': 'ko-KR',
            'zh': 'zh-CN',
            'ar': 'ar-SA',
            'hi': 'hi-IN',
            'nl': 'nl-NL',
            'sv': 'sv-SE',
            'no': 'no-NO',
            'da': 'da-DK',
            'fi': 'fi-FI',
            'pl': 'pl-PL',
            'tr': 'tr-TR',
            'he': 'he-IL',
            'th': 'th-TH',
            'vi': 'vi-VN',
            'id': 'id-ID',
            'ms': 'ms-MY',
            'fa': 'fa-IR',
            'ur': 'ur-PK',
            'bn': 'bn-IN',
            'te': 'te-IN',
            'ta': 'ta-IN',
            'gu': 'gu-IN',
            'kn': 'kn-IN',
            'ml': 'ml-IN',
            'pa': 'pa-IN',
            'or': 'or-IN',
            'as': 'as-IN',
            'ne': 'ne-NP',
            'si': 'si-LK',
            'my': 'my-MM',
            'km': 'km-KH',
            'lo': 'lo-LA',
            'mn': 'mn-MN',
            'ka': 'ka-GE',
            'hy': 'hy-AM',
            'az': 'az-AZ',
            'kk': 'kk-KZ',
            'ky': 'ky-KG',
            'uz': 'uz-UZ',
            'tg': 'tg-TJ',
            'tk': 'tk-TM',
            'ug': 'ug-CN',
            'bo': 'bo-CN',
            'dz': 'dz-BT',
            'jv': 'jv-ID',
            'su': 'su-ID',
            'ceb': 'ceb-PH',
            'war': 'war-PH',
            'tl': 'tl-PH',
            'hmn': 'hmn-US',
            'haw': 'haw-US',
            'mi': 'mi-NZ',
            'sm': 'sm-WS',
            'to': 'to-TO',
            'fj': 'fj-FJ',
            'ch': 'ch-GU',
            'co': 'co-FR',
            'eu': 'eu-ES',
            'gl': 'gl-ES',
            'cy': 'cy-GB',
            'ga': 'ga-IE',
            'mt': 'mt-MT',
            'sq': 'sq-AL',
            'mk': 'mk-MK',
            'sr': 'sr-RS',
            'hr': 'hr-HR',
            'bs': 'bs-BA',
            'sl': 'sl-SI',
            'et': 'et-EE',
            'lv': 'lv-LV',
            'lt': 'lt-LT',
            'is': 'is-IS',
            'fo': 'fo-FO',
            'kl': 'kl-GL',
            'iu': 'iu-CA',
            'oj': 'oj-CA',
            'cr': 'cr-CA',
            'gn': 'gn-PY',
            'qu': 'qu-PE',
            'ay': 'ay-BO',
            'sw': 'sw-TZ',
            'zu': 'zu-ZA',
            'af': 'af-ZA',
            'xh': 'xh-ZA',
            'st': 'st-ZA',
            'tn': 'tn-BW',
            'ts': 'ts-ZA',
            've': 've-ZA',
            'ny': 'ny-MW',
            'sn': 'sn-ZW',
            'rw': 'rw-RW',
            'lg': 'lg-UG',
            'ak': 'ak-GH',
            'tw': 'tw-GH',
            'ee': 'ee-GH',
            'yo': 'yo-NG',
            'ig': 'ig-NG',
            'ha': 'ha-NG',
            'so': 'so-SO',
            'am': 'am-ET',
            'ti': 'ti-ET',
            'om': 'om-ET',
            'aa': 'aa-ET',
            'ss': 'ss-SZ',
            'nr': 'nr-ZA',
            'nso': 'nso-ZA',
            'tso': 'tso-ZA',
            'venda': 've-ZA',
            'tswana': 'tn-BW',
            'sesotho': 'st-ZA',
            'setswana': 'tn-BW',
            'sepedi': 'nso-ZA',
            'xitsonga': 'tso-ZA',
            'tsivenda': 've-ZA',
            'isizulu': 'zu-ZA',
            'isixhosa': 'xh-ZA',
            'isindebele': 'nr-ZA',
            'siswati': 'ss-SZ',
            'isixhosa': 'xh-ZA',
            'isizulu': 'zu-ZA',
            'isindebele': 'nr-ZA',
            'siswati': 'ss-SZ',
            'isixhosa': 'xh-ZA',
            'isizulu': 'zu-ZA',
            'isindebele': 'nr-ZA',
            'siswati': 'ss-SZ'
        }
        
        return lang_mapping.get(detected_lang, 'en-US')
    except Exception as e:
        logger.warning(f"Language detection failed: {e}")
        return 'en-US'  # Default to English


def filter_voices_by_criteria(voices: List[Dict[str, Any]], gender: str = "", age: str = "", model: str = "", language: str = "") -> List[Dict[str, Any]]:
    """Filter voices based on gender, age, model, and language criteria."""
    filtered = voices
    
    if gender:
        gender_lower = gender.lower()
        filtered = [v for v in filtered if gender_lower == v.get("gender", "").lower()]
    
    if age:
        age_lower = age.lower()
        # Map age categories to voice characteristics
        age_keywords = {
            "child": ["child", "young", "kid"],
            "young": ["young", "teen", "youth"],
            "adult": ["adult", "mature", "professional"],
            "elderly": ["elderly", "senior", "mature", "wise"]
        }
        
        if age_lower in age_keywords:
            keywords = age_keywords[age_lower]
            filtered = [v for v in filtered if any(kw in v.get("name", "").lower() for kw in keywords)]
    
    if model:
        filtered = [v for v in filtered if v.get("model", "").lower() == model.lower()]
    
    if language:
        # Simple language filtering - match language code prefix
        target_lang_code = language.split('-')[0].lower()
        
        # Very simple filtering - just check if language contains the target code
        filtered = [v for v in filtered if target_lang_code in v.get("language", "").lower()]
        
        # Sort voices by quality/priority for the selected language
        filtered = sort_voices_by_quality(filtered, language)
    
    return filtered


def sort_voices_by_quality(voices: List[Dict[str, Any]], language: str) -> List[Dict[str, Any]]:
    """Sort voices by quality and preference for the given language."""
    def voice_score(voice: Dict[str, Any]) -> int:
        score = 0
        voice_lang = voice.get("language", "").lower()
        voice_name = voice.get("name", "").lower()
        voice_model = voice.get("model", "").lower()
        
        # Prefer Edge TTS (highest quality)
        if voice_model == "edge":
            score += 100
        
        # Prefer exact language matches
        if voice_lang == language.lower():
            score += 50
        
        # Prefer voices with the language in the name
        if language.split('-')[0].lower() in voice_name:
            score += 25
        
        # Prefer female voices (often better quality)
        if "female" in voice.get("gender", "").lower():
            score += 10
        
        # Prefer neural voices (Edge TTS)
        if "neural" in voice_name:
            score += 20
        
        # Prefer voices with clear language indicators
        if any(lang in voice_name for lang in ["hindi", "spanish", "french", "german", "italian", "japanese", "chinese"]):
            score += 15
        
        return score
    
    return sorted(voices, key=voice_score, reverse=True)

router = APIRouter()
generation_service = GenerationService()


@router.post("/generate", response_model=GenerationResponse)
async def generate_text(request: GenerateRequest):
    """Generate text using the specified model."""
    try:
        start_time = time.time()
        
        # Collect the full response for non-streaming
        full_content = ""
        token_usage = None
        latency_ms = 0
        
        async for chunk in generation_service.generate_text_stream(
            system_prompt=request.system_prompt,
            user_prompt=request.user_prompt,
            model_provider=request.model_provider.value,
            model_name=request.model_name,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        ):
            full_content += chunk.content
            if chunk.token_usage:
                token_usage = chunk.token_usage
            if chunk.latency_ms:
                latency_ms = chunk.latency_ms
        
        return GenerationResponse(
            content=full_content,
            model_provider=request.model_provider.value,
            model_name=request.model_name or "default",
            token_usage=token_usage,
            latency_ms=latency_ms,
            timestamp=datetime.datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate/stream")
async def generate_text_stream(request: GenerateRequest):
    """Generate text with streaming response."""
    async def generate():
        try:
            async for chunk in generation_service.generate_text_stream(
                system_prompt=request.system_prompt,
                user_prompt=request.user_prompt,
                model_provider=request.model_provider.value,
                model_name=request.model_name,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                target_language=request.target_language or "en",
                translate_response=request.translate_response or False,
                output_format=request.output_format.value,
                num_candidates=request.num_candidates
            ):
                yield {
                    "event": "chunk",
                    "data": chunk.model_dump_json()
                }
                
                if chunk.is_complete:
                    break
                    
        except Exception as e:
            error_chunk = StreamChunk(
                content=f"Error: {str(e)}",
                is_complete=True
            )
            yield {
                "event": "error",
                "data": error_chunk.model_dump_json()
            }
    
    return EventSourceResponse(generate())


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_text(request: SummarizeRequest):
    """Summarize text using the specified model."""
    try:
        start_time = time.time()
        
        # Process input based on type
        try:
            processed_text = input_processor.validate_input(
                text=request.text,
                url=request.url,
                file_content=request.file_content,
                file_type=request.file_type
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
        # Collect the full response for non-streaming
        full_summary = ""
        token_usage = None
        latency_ms = 0
        
        async for chunk in generation_service.summarize_text_stream(
            text=processed_text,
            model_provider=request.model_provider.value,
            model_name=request.model_name,
            max_length=request.max_length,
            temperature=request.temperature,
            summary_type=request.summary_type
        ):
            full_summary += chunk.content
            if chunk.token_usage:
                token_usage = chunk.token_usage
            if chunk.latency_ms:
                latency_ms = chunk.latency_ms
        
        # Calculate compression ratio
        original_length = len(processed_text.split())
        summary_length = len(full_summary.split())
        compression_ratio = original_length / summary_length if summary_length > 0 else 0
        
        return SummarizeResponse(
            summary=full_summary,
            original_length=original_length,
            summary_length=summary_length,
            compression_ratio=compression_ratio,
            model_provider=request.model_provider.value,
            model_name=request.model_name or "default",
            token_usage=token_usage,
            latency_ms=latency_ms,
            timestamp=datetime.datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/summarize/stream")
async def summarize_text_stream(request: SummarizeRequest):
    """Summarize text with streaming response."""
    async def generate():
        try:
            # Process input based on type
            try:
                processed_text = input_processor.validate_input(
                    text=request.text,
                    url=request.url,
                    file_content=request.file_content,
                    file_type=request.file_type
                )
            except ValueError as e:
                error_chunk = StreamChunk(
                    content=f"Error: {str(e)}",
                    is_complete=True
                )
                yield {
                    "event": "error",
                    "data": error_chunk.model_dump_json()
                }
                return
            
            async for chunk in generation_service.summarize_text_stream(
                text=processed_text,
                model_provider=request.model_provider.value,
                model_name=request.model_name,
                max_length=request.max_length,
                temperature=request.temperature,
                summary_type=request.summary_type,
                target_language=request.target_language,
                translate_summary=request.translate_summary,
                output_format=request.output_format.value
            ):
                yield {
                    "event": "chunk",
                    "data": chunk.model_dump_json()
                }
                
                if chunk.is_complete:
                    break
                    
        except Exception as e:
            error_chunk = StreamChunk(
                content=f"Error: {str(e)}",
                is_complete=True
            )
            yield {
                "event": "error",
                "data": error_chunk.model_dump_json()
            }
    
    return EventSourceResponse(generate())


@router.post("/summarize/file")
async def summarize_file(
    file: UploadFile = File(...),
    model_provider: str = Form(...),
    model_name: str = Form(""),
    max_length: int = Form(150),
    temperature: float = Form(0.3),
    summary_type: str = Form("general")
):
    """Summarize uploaded file using the specified model."""
    try:
        # Read file content
        file_content = await file.read()
        
        # Determine file type from extension
        file_type = file.filename.split('.')[-1].lower() if '.' in file.filename else 'txt'
        
        # Process the file
        try:
            processed_text = input_processor.extract_text_from_file(file_content, file_type)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"File processing failed: {str(e)}")
        
        # Create request object
        request = SummarizeRequest(
            text=None,
            url=None,
            file_content=file_content,
            file_type=file_type,
            model_provider=ModelProvider(model_provider),
            model_name=model_name if model_name else None,
            max_length=max_length,
            temperature=temperature,
            summary_type=summary_type,
            stream=False
        )
        
        # Process the request
        start_time = time.time()
        
        # Collect the full response
        full_summary = ""
        token_usage = None
        latency_ms = 0
        
        async for chunk in generation_service.summarize_text_stream(
            text=processed_text,
            model_provider=request.model_provider.value,
            model_name=request.model_name,
            max_length=request.max_length,
            temperature=request.temperature,
            summary_type=request.summary_type
        ):
            full_summary += chunk.content
            if chunk.token_usage:
                token_usage = chunk.token_usage
            if chunk.latency_ms:
                latency_ms = chunk.latency_ms
        
        # Calculate compression ratio
        original_length = len(processed_text.split())
        summary_length = len(full_summary.split())
        compression_ratio = original_length / summary_length if summary_length > 0 else 0
        
        return SummarizeResponse(
            summary=full_summary,
            original_length=original_length,
            summary_length=summary_length,
            compression_ratio=compression_ratio,
            model_provider=request.model_provider.value,
            model_name=request.model_name or "default",
            token_usage=token_usage,
            latency_ms=latency_ms,
            timestamp=datetime.datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analytics")
async def analyze_summary(request: dict):
    """Analyze summary and provide comprehensive analytics."""
    try:
        original_text = request.get("original_text", "")
        summary_text = request.get("summary_text", "")
        
        if not original_text or not summary_text:
            raise HTTPException(status_code=400, detail="Both original_text and summary_text are required")
        
        analytics = analytics_service.analyze_text(original_text, summary_text)
        
        return {
            "analytics": analytics,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics failed: {str(e)}")


@router.post("/analytics/generation")
async def analyze_generation(request: dict):
    """Analyze generated text and provide comprehensive analytics."""
    try:
        system_prompt = request.get("system_prompt", "")
        user_prompt = request.get("user_prompt", "")
        generated_text = request.get("generated_text", "")
        output_format = request.get("output_format", "text")
        
        if not generated_text:
            raise HTTPException(status_code=400, detail="generated_text is required")
        
        analytics = generation_analytics_service.analyze_generation(
            system_prompt, user_prompt, generated_text, output_format
        )
        
        return {
            "analytics": analytics,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation analytics failed: {str(e)}")


@router.get("/templates")
async def get_prompt_templates():
    """Get all available prompt templates."""
    try:
        templates = prompt_template_service.get_all_templates()
        categories = prompt_template_service.get_categories()
        
        return {
            "templates": templates,
            "categories": categories
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get templates: {str(e)}")


@router.get("/templates/{category}")
async def get_templates_by_category(category: str):
    """Get templates filtered by category."""
    try:
        templates = prompt_template_service.get_templates_by_category(category)
        return {
            "templates": templates,
            "category": category
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get templates: {str(e)}")


@router.post("/templates/fill")
async def fill_template(request: dict):
    """Fill a template with provided variables."""
    try:
        template_id = request.get("template_id")
        variables = request.get("variables", {})
        
        if not template_id:
            raise HTTPException(status_code=400, detail="template_id is required")
        
        result = prompt_template_service.fill_template(template_id, variables)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fill template: {str(e)}")


@router.post("/export/{format_type}")
async def export_content(format_type: str, request: dict):
    """Export content to various formats (pdf, word, markdown)."""
    try:
        if format_type not in ["pdf", "word", "markdown"]:
            raise HTTPException(status_code=400, detail="Invalid format. Supported: pdf, word, markdown")
        
        content = request.get("content", {})
        if not content:
            raise HTTPException(status_code=400, detail="Content is required")
        
        if format_type == "pdf":
            file_content = export_service.export_to_pdf(content)
            return StreamingResponse(
                io.BytesIO(file_content),
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename=generated_content.pdf"}
            )
        elif format_type == "word":
            file_content = export_service.export_to_word(content)
            return StreamingResponse(
                io.BytesIO(file_content),
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                headers={"Content-Disposition": f"attachment; filename=generated_content.docx"}
            )
        elif format_type == "markdown":
            file_content = export_service.export_to_markdown(content)
            return StreamingResponse(
                io.BytesIO(file_content.encode('utf-8')),
                media_type="text/markdown",
                headers={"Content-Disposition": f"attachment; filename=generated_content.md"}
            )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.post("/detect-language")
async def detect_language(request: dict):
    """Detect the language of the input text."""
    try:
        text = request.get("text", "")
        
        if not text:
            raise HTTPException(status_code=400, detail="Text is required")
        
        detection = language_service.detect_language(text)
        
        return {
            "detection": detection,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Language detection failed: {str(e)}")


@router.post("/translate")
async def translate_text(request: dict):
    """Translate text to the target language."""
    try:
        text = request.get("text", "")
        target_language = request.get("target_language", "en")
        source_language = request.get("source_language", "auto")
        
        if not text:
            raise HTTPException(status_code=400, detail="Text is required")
        
        if not target_language:
            raise HTTPException(status_code=400, detail="Target language is required")
        
        translation = language_service.translate_text(text, target_language, source_language)
        
        return {
            "translation": translation,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")


@router.get("/languages")
async def get_supported_languages():
    """Get list of supported languages."""
    try:
        languages = language_service.get_supported_languages()
        
        # Group languages by family for better organization
        language_families = {}
        for code, info in languages.items():
            family = language_service.get_language_family(code)
            if family not in language_families:
                language_families[family] = []
            
            language_families[family].append({
                "code": code,
                "name": info["name"],
                "native": info["native"]
            })
        
        return {
            "languages": languages,
            "families": language_families,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get languages: {str(e)}")


@router.get("/models")
async def get_available_models():
    """Get available model providers and their configurations."""
    # Get Ollama models with availability status
    ollama_models_data = await model_availability_service.get_models_with_availability()
    
    # Check if API keys are configured
    from app.core.config import settings
    
    def is_api_key_configured(provider: str) -> bool:
        """Check if API key is configured for a provider."""
        if provider == "openai":
            return bool(settings.openai_api_key and settings.openai_api_key.strip())
        elif provider == "anthropic":
            return bool(settings.anthropic_api_key and settings.anthropic_api_key.strip())
        elif provider == "google":
            # Add Google API key check when implemented
            return False
        elif provider == "mistral":
            # Add Mistral API key check when implemented
            return False
        return False
    
    def get_configured_models(provider: str) -> list:
        """Get the list of models for a provider, highlighting the configured one."""
        if provider == "openai":
            # Current OpenAI models with the configured one first
            all_models = ["gpt-5", "gpt-4o", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"]
            configured_model = settings.openai_model
            # Move configured model to front if it exists
            if configured_model in all_models:
                all_models.remove(configured_model)
                all_models.insert(0, configured_model)
            return all_models
        elif provider == "anthropic":
            # Current Anthropic models with the configured one first
            all_models = ["claude-sonnet-4", "claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229", "claude-3-sonnet-20240229"]
            configured_model = settings.anthropic_model
            # Move configured model to front if it exists
            if configured_model in all_models:
                all_models.remove(configured_model)
                all_models.insert(0, configured_model)
            return all_models
        elif provider == "google":
            return ["gemini-pro", "gemini-flash", "gemini-ultra"]
        elif provider == "mistral":
            return ["mistral-large", "mistral-medium", "mistral-small"]
        return []
    
    return {
        "providers": [
            {
                "id": "openai",
                "name": "OpenAI",
                "models": get_configured_models("openai"),
                "requires_api_key": True,
                "api_key_configured": is_api_key_configured("openai"),
                "configured_model": settings.openai_model,
                "description": "Leading AI research company with state-of-the-art language models"
            },
            {
                "id": "anthropic",
                "name": "Anthropic",
                "models": get_configured_models("anthropic"),
                "requires_api_key": True,
                "api_key_configured": is_api_key_configured("anthropic"),
                "configured_model": settings.anthropic_model,
                "description": "AI safety-focused company with Claude models"
            },
            {
                "id": "google",
                "name": "Google AI",
                "models": ["gemini-pro", "gemini-flash", "gemini-ultra"],
                "requires_api_key": True,
                "api_key_configured": is_api_key_configured("google"),
                "description": "Google's advanced multimodal AI models"
            },
            {
                "id": "mistral",
                "name": "Mistral AI",
                "models": ["mistral-large", "mistral-medium", "mistral-small"],
                "requires_api_key": True,
                "api_key_configured": is_api_key_configured("mistral"),
                "description": "European AI company with efficient language models"
            },
            {
                "id": "ollama",
                "name": "Ollama (Local)",
                "models": [model["name"] for model in ollama_models_data.get("models", []) if model.get("is_available", False)],
                "requires_api_key": False,
                "api_key_configured": True,
                "description": "Local AI models running on your machine"
            }
        ],
        "ollama_models": ollama_models_data,
        "summary_types": [
            {"id": "general", "name": "General Summary", "description": "Standard summary of main points"},
            {"id": "bullet_points", "name": "Bullet Points", "description": "Key points in bullet format"},
            {"id": "key_points", "name": "Key Points", "description": "Extract main ideas and key points"},
            {"id": "extractive", "name": "Extractive", "description": "Select important sentences from text"},
            {"id": "executive", "name": "Executive Summary", "description": "High-level summary for decision-makers with recommendations"},
            {"id": "technical", "name": "Technical Summary", "description": "Technical details, specifications, and methodologies"},
            {"id": "news", "name": "News Summary", "description": "News-style summary following 5W1H format"}
        ],
        "supported_file_types": [
            {"extension": "txt", "name": "Text File", "description": "Plain text files"},
            {"extension": "pdf", "name": "PDF Document", "description": "PDF documents"},
            {"extension": "docx", "name": "Word Document", "description": "Microsoft Word documents"},
            {"extension": "xlsx", "name": "Excel Spreadsheet", "description": "Microsoft Excel files"},
            {"extension": "md", "name": "Markdown", "description": "Markdown files"}
        ]
    }


@router.get("/models/image-generation")
async def get_image_generation_providers():
    """Get available providers specifically for image generation."""
    return {
        "providers": [
            {
                "id": "integrated_diffusion",
                "name": "OllamaDiffuser (Local)",
                "models": ["stable-diffusion-xl-base-1.0", "stable-diffusion-v1-5", "stable-diffusion-2-1"],
                "requires_api_key": False,
                "description": "Local image generation using OllamaDiffuser with pre-downloaded models"
            },
            {
                "id": "stable_diffusion", 
                "name": "Stable Diffusion WebUI",
                "models": ["stable-diffusion-1.5", "stable-diffusion-2.1", "stable-diffusion-xl", "flux.1-schnell", "flux.1-dev"],
                "requires_api_key": False,
                "description": "Local image generation via AUTOMATIC1111 Stable Diffusion WebUI"
            },
            {
                "id": "openai",
                "name": "OpenAI DALL-E",
                "models": ["dall-e-3", "dall-e-2"],
                "requires_api_key": True,
                "description": "OpenAI's DALL-E models for high-quality image generation"
            }
        ]
    }


# RAG Endpoints
@router.post("/rag/upload", response_model=DocumentUploadResponse)
async def upload_document_for_rag(
    file: UploadFile = File(...),
    collection_name: str = Form("default"),
    tags: Optional[str] = Form("")
):
    """Upload a document for RAG processing."""
    try:
        file_content = await file.read()
        
        # Parse tags from JSON string
        tag_list = []
        if tags:
            try:
                tag_list = json.loads(tags)
            except json.JSONDecodeError:
                # If not JSON, treat as comma-separated string
                tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
        
        result = await rag_service.upload_document(
            file_content=file_content,
            file_name=file.filename,
            collection_name=collection_name,
            tags=tag_list
        )
        
        return DocumentUploadResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rag/question", response_model=RAGQuestionResponse)
async def ask_rag_question(request: RAGQuestionRequest):
    """Ask a question about uploaded documents."""
    try:
        result = await rag_service.ask_question(
            question=request.question,
            collection_name=request.collection_name,
            model_provider=request.model_provider.value,
            model_name=request.model_name,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            top_k=request.top_k,
            similarity_threshold=request.similarity_threshold,
            filter_tags=request.filter_tags,
            collection_names=request.collection_names
        )
        
        return RAGQuestionResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rag/question/stream")
async def ask_rag_question_stream(request: RAGQuestionRequest):
    """Ask a question about uploaded documents with streaming response."""
    async def generate():
        try:
            async for chunk in rag_service.ask_question_stream(
                question=request.question,
                collection_name=request.collection_name,
                model_provider=request.model_provider.value,
                model_name=request.model_name,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                top_k=request.top_k,
                similarity_threshold=request.similarity_threshold,
                filter_tags=request.filter_tags,
                collection_names=request.collection_names
            ):
                yield {
                    "event": "chunk",
                    "data": json.dumps(chunk)
                }
                
                if chunk.get("is_complete", False):
                    break
                    
        except Exception as e:
            error_chunk = {
                "content": f"Error: {str(e)}",
                "is_complete": True,
                "sources": []
            }
            yield {
                "event": "error",
                "data": json.dumps(error_chunk)
            }
    
    return EventSourceResponse(generate())


@router.get("/rag/collections")
async def get_rag_collections():
    """Get information about all RAG collections."""
    try:
        collections = rag_service.get_collections()
        return {"collections": collections}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/rag/debug/collections")
async def debug_rag_collections():
    """Debug endpoint to list all collections and their document counts."""
    try:
        collections_info = rag_service.list_all_collections()
        return {"debug_info": collections_info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/rag/document")
async def delete_rag_document(request: DeleteDocumentRequest):
    """Delete a document from RAG collection."""
    try:
        result = rag_service.delete_document(
            document_id=request.document_id,
            collection_name=request.collection_name
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/rag/collection/{collection_name}")
async def delete_rag_collection(collection_name: str):
    """Delete an entire RAG collection."""
    try:
        result = rag_service.delete_collection(collection_name=collection_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/rag/suggestions/{collection_name}")
async def get_question_suggestions(collection_name: str):
    """Get question suggestions for a collection."""
    try:
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"API: Generating suggestions for collection: {collection_name}")
        
        suggestions = question_suggestion_service.generate_suggestions_for_collection(collection_name)
        
        logger.info(f"API: Generated {len(suggestions)} suggestions for collection: {collection_name}")
        return {"suggestions": suggestions}
    except Exception as e:
        logger.error(f"API: Error generating suggestions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/rag/suggestions/{collection_name}/document/{document_id}")
async def get_document_question_suggestions(collection_name: str, document_id: str):
    """Get question suggestions for a specific document."""
    try:
        suggestions = question_suggestion_service.generate_suggestions_for_document(document_id, collection_name)
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/rag/analytics/{collection_name}/document/{document_id}")
async def get_document_analytics(collection_name: str, document_id: str):
    """Get analytics for a specific document."""
    try:
        # Get the document content from ChromaDB
        collection = rag_service.chroma_client.get_collection(name=collection_name)
        results = collection.get(where={"document_id": document_id})
        
        if not results['documents']:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Combine all chunks for the document
        document_text = " ".join(results['documents'])
        
        # Get file name from metadata
        file_name = results['metadatas'][0].get('file_name', 'Unknown') if results['metadatas'] else 'Unknown'
        
        # Analyze the document
        analytics = document_analytics_service.analyze_document_content(document_text, file_name)
        
        return {"analytics": analytics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Model Comparison Endpoints
@router.post("/summarize/compare", response_model=ModelComparisonResponse)
async def compare_summarization_models(
    text: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    file_content: Optional[UploadFile] = File(None),
    models: str = Form(...),
    max_length: int = Form(150),
    temperature: float = Form(0.3),
    summary_type: str = Form("general"),
    target_language: Optional[str] = Form("en"),
    translate_summary: bool = Form(False),
    model_comparison_service: ModelComparisonService = Depends(get_model_comparison_service)
):
    """Compare multiple models for text summarization."""
    try:
        # Parse models JSON string
        try:
            models_list = json.loads(models)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid models format")
        
        # Extract text from request
        text_content = None
        if text:
            text_content = text
        elif url:
            # Process URL to extract text
            try:
                text_content, _ = input_processor.extract_text_from_url(url)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to process URL: {str(e)}")
        elif file_content:
            # Process file content
            try:
                file_bytes = await file_content.read()
                file_type = file_content.filename.split('.')[-1].lower() if '.' in file_content.filename else 'txt'
                text_content = input_processor.extract_text_from_file(file_bytes, file_type)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")
        else:
            raise HTTPException(status_code=400, detail="No text, URL, or file content provided")
        
        # Validate models
        if not models_list or len(models_list) < 2:
            raise HTTPException(status_code=400, detail="At least 2 models must be specified for comparison")
        
        # Compare models
        result = await model_comparison_service.compare_models(
            text=text_content,
            models=models_list,
            max_length=max_length,
            temperature=temperature,
            summary_type=summary_type
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate/compare", response_model=ModelComparisonResponse)
async def compare_generation_models(
    request: ModelComparisonRequest,
    model_comparison_service: ModelComparisonService = Depends(get_model_comparison_service)
):
    """
    Compare multiple models for text generation.
    """
    try:
        # Compare models for generation
        result = await model_comparison_service.compare_generation_models(
            system_prompt=request.system_prompt,
            user_prompt=request.user_prompt,
            models=request.models,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            target_language=request.target_language,
            translate_response=request.translate_response,
            output_format=request.output_format
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error in generation model comparison: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rag/compare", response_model=ModelComparisonResponse)
async def compare_rag_models(
    request: RAGModelComparisonRequest,
    model_comparison_service: ModelComparisonService = Depends(get_model_comparison_service)
):
    """
    Compare multiple models for RAG question answering.
    """
    try:
        # Compare models for RAG
        result = await model_comparison_service.compare_rag_models(
            question=request.question,
            collection_names=request.collection_names,
            models=request.models,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            top_k=request.top_k,
            similarity_threshold=request.similarity_threshold,
            filter_tags=request.filter_tags
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error in RAG model comparison: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Image Analysis Endpoints
@router.post("/vision/analyze", response_model=ImageAnalysisResponse)
async def analyze_image(
    image: UploadFile = File(...),
    analysis_type: str = Form("describe"),
    model_provider: str = Form(...),
    model_name: Optional[str] = Form(None),
    custom_prompt: Optional[str] = Form(None),
    temperature: float = Form(0.3)
):
    """Analyze image content using vision models."""
    try:
        # Read image bytes
        image_bytes = await image.read()
        
        # Route to appropriate service based on provider
        if model_provider == "openai":
            result = await image_analysis_service.analyze_image(
                image_bytes=image_bytes,
                analysis_type=analysis_type,
                model_provider=model_provider,
                model_name=model_name or "gpt-4-vision-preview",
                custom_prompt=custom_prompt,
                temperature=temperature
            )
        elif model_provider == "integrated_diffusion":
            result = await integrated_diffusion_service.analyze_image_content(
                image_data=image_bytes,
                analysis_type=analysis_type
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported model provider: {model_provider}")
        
        return ImageAnalysisResponse(**result)
        
    except Exception as e:
        logger.error(f"Error in image analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vision/compare", response_model=ImageComparisonResponse)
async def compare_images(
    images: list[UploadFile] = File(...),
    comparison_type: str = Form("similarity"),
    model_provider: str = Form(...),
    model_name: Optional[str] = Form(None),
    temperature: float = Form(0.3)
):
    """Compare multiple images using vision models."""
    try:
        # Read image bytes from all uploaded files
        image_bytes_list = []
        for img in images:
            image_bytes = await img.read()
            image_bytes_list.append(image_bytes)
        
        result = await image_analysis_service.compare_images(
            images=image_bytes_list,
            comparison_type=comparison_type,
            model_provider=model_provider,
            model_name=model_name,
            temperature=temperature
        )
        
        return ImageComparisonResponse(**result)
        
    except Exception as e:
        logger.error(f"Error in image comparison: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Image Generation Endpoints
@router.post("/generate/image", response_model=ImageGenerationResponse)
async def generate_image(request: ImageGenerationRequest):
    """Generate images from text prompts."""
    try:
        result = await image_generation_service.generate_image(
            prompt=request.prompt,
            model_provider=request.model_provider.value,
            model_name=request.model_name,
            size=request.size,
            quality=request.quality,
            style=request.style,
            num_images=request.num_images,
            temperature=request.temperature
        )
        
        return ImageGenerationResponse(**result)
        
    except Exception as e:
        logger.error(f"Error in image generation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate/image/variations", response_model=ImageGenerationResponse)
async def generate_image_variations(
    image: UploadFile = File(...),
    model_provider: str = Form(...),
    model_name: Optional[str] = Form(None),
    size: str = Form("1024x1024"),
    num_variations: int = Form(1)
):
    """Generate variations of an existing image."""
    try:
        # Read image bytes
        image_bytes = await image.read()
        
        result = await image_generation_service.generate_image_variations(
            image_bytes=image_bytes,
            model_provider=model_provider,
            model_name=model_name,
            size=size,
            num_variations=num_variations
        )
        
        return ImageGenerationResponse(**result)
        
    except Exception as e:
        logger.error(f"Error in image variation generation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate/image/edit", response_model=ImageGenerationResponse)
async def edit_image(
    image: UploadFile = File(...),
    mask: Optional[UploadFile] = File(None),
    prompt: str = Form(...),
    model_provider: str = Form(...),
    model_name: Optional[str] = Form(None),
    size: str = Form("1024x1024")
):
    """Edit an existing image using inpainting/outpainting."""
    try:
        # Read image bytes
        image_bytes = await image.read()
        
        # Read mask bytes if provided
        mask_bytes = None
        if mask:
            mask_bytes = await mask.read()
        
        result = await image_generation_service.edit_image(
            image_bytes=image_bytes,
            mask_bytes=mask_bytes,
            prompt=prompt,
            model_provider=model_provider,
            model_name=model_name,
            size=size
        )
        
        return ImageGenerationResponse(**result)
        
    except Exception as e:
        logger.error(f"Error in image editing: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Integrated Diffusion Endpoints
@router.get("/diffusion/health")
async def diffusion_health_check():
    """Check integrated diffusion service health."""
    try:
        health = await integrated_diffusion_service.health_check()
        return health
        
    except Exception as e:
        logger.error(f"Error in diffusion health check: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))




@router.post("/generate/storyboard")
async def generate_storyboard(request: dict):
    """Generate a multi-panel storyboard from a story prompt."""
    try:
        story_prompt = request.get("story_prompt", "")
        style = request.get("style", "cinematic")
        num_panels = request.get("num_panels", 5)
        provider = request.get("provider", "integrated_diffusion")  # Default to integrated_diffusion for backwards compatibility
        
        if not story_prompt:
            raise HTTPException(status_code=400, detail="Story prompt is required")
        
        # For storyboard, we need to generate multiple images, so we'll use the image generation service
        # and create panels individually
        if provider == "openai":
            panels = []
            for i in range(num_panels):
                panel_prompt = f"Panel {i+1}: {story_prompt}, {style} style"
                
                # Use the existing image generation service
                from app.services.image_generation_service import ImageGenerationService
                image_service = ImageGenerationService()
                panel_result = await image_service.generate_image(
                    prompt=panel_prompt,
                    model_provider="openai",
                    model_name="dall-e-3",
                    size="1024x1024",
                    style=style
                )
                
                panels.append({
                    "panel_number": i + 1,
                    "prompt": panel_prompt,
                    "image_data": panel_result.get("image_data"),
                    "url": panel_result.get("url")
                })
            
            result = {
                "type": "storyboard",
                "story_prompt": story_prompt,
                "style": style,
                "num_panels": num_panels,
                "provider": provider,
                "panels": panels
            }
        else:
            # Use integrated_diffusion_service for other providers
            result = await integrated_diffusion_service.generate_storyboard(
                story_prompt=story_prompt,
                style=style,
                num_panels=num_panels
            )
        
        return result
        
    except Exception as e:
        logger.error(f"Error in storyboard generation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Video Generation Endpoints
@router.post("/generate/video")
async def generate_video(request: dict):
    """Generate video from text prompt."""
    try:
        prompt = request.get("prompt", "")
        style = request.get("style", "")
        width = request.get("width", 512)
        height = request.get("height", 512)
        duration = request.get("duration", 3)
        fps = request.get("fps", 24)
        num_videos = request.get("num_videos", 1)
        
        if not prompt:
            raise HTTPException(status_code=400, detail="Video prompt is required")
        
        result = await integrated_diffusion_service.generate_text_to_video(
            prompt=prompt,
            style=style,
            width=width,
            height=height,
            duration=duration,
            fps=fps,
            num_videos=num_videos
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Video generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate/video/stream")
async def generate_video_stream(request: dict):
    """Generate video from text prompt with progress streaming."""
    async def generate():
        try:
            prompt = request.get("prompt", "")
            style = request.get("style", "")
            width = request.get("width", 512)
            height = request.get("height", 512)
            duration = request.get("duration", 3)
            fps = request.get("fps", 24)
            num_videos = request.get("num_videos", 1)
            
            if not prompt:
                yield {
                    "event": "error",
                    "data": json.dumps({"error": "Video prompt is required"})
                }
                return
            
            # Progress tracking variables
            progress_data = {
                "download_progress": 0,
                "load_progress": 0,
                "generate_progress": 0
            }
            
            def progress_callback(phase: str, progress: float):
                if phase == "download":
                    progress_data["download_progress"] = progress
                elif phase == "load":
                    progress_data["load_progress"] = progress
                elif phase == "generate":
                    progress_data["generate_progress"] = progress
            
            # Send initial progress
            yield {
                "event": "progress",
                "data": json.dumps(progress_data)
            }
            
            # Create a task for video generation
            import asyncio
            task = asyncio.create_task(
                integrated_diffusion_service.generate_text_to_video(
                    prompt=prompt,
                    style=style,
                    width=width,
                    height=height,
                    duration=duration,
                    fps=fps,
                    num_videos=num_videos,
                    progress_callback=progress_callback
                )
            )
            
            # Monitor progress and send updates
            while not task.done():
                yield {
                    "event": "progress",
                    "data": json.dumps(progress_data)
                }
                await asyncio.sleep(0.5)  # Send progress every 500ms
            
            # Get the result
            result = await task
            
            # Send final progress update
            progress_data["download_progress"] = 100
            progress_data["load_progress"] = 100
            progress_data["generate_progress"] = 100
            yield {
                "event": "progress",
                "data": json.dumps(progress_data)
            }
            
            # Send final result
            yield {
                "event": "complete",
                "data": json.dumps(result)
            }
            
        except Exception as e:
            logger.error(f"Video generation failed: {e}")
            yield {
                "event": "error",
                "data": json.dumps({"error": str(e)})
            }
    
    return EventSourceResponse(generate())


@router.post("/generate/animation")
async def generate_animation(request: dict):
    """Generate animation from text prompt."""
    try:
        prompt = request.get("prompt", "")
        style = request.get("style", "")
        width = request.get("width", 512)
        height = request.get("height", 512)
        num_frames = request.get("num_frames", 24)
        fps = request.get("fps", 24)
        
        if not prompt:
            raise HTTPException(status_code=400, detail="Animation prompt is required")
        
        result = await integrated_diffusion_service.generate_animation(
            prompt=prompt,
            style=style,
            width=width,
            height=height,
            num_frames=num_frames,
            fps=fps
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Animation generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/enhance/video")
async def enhance_video(
    video: UploadFile = File(...),
    enhancement_type: str = Form("upscale")
):
    """Enhance video with various effects."""
    try:
        video_data = await video.read()
        
        result = await integrated_diffusion_service.enhance_video(
            video_data=video_data,
            enhancement_type=enhancement_type
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Video enhancement failed: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 


# =================== Speech Processing Endpoints ===================

@router.get("/sample-speech")
async def get_sample_speech():
    """Serve a sample speech file for testing STT functionality."""
    try:
        # Path to the sample speech file (local to the project)
        sample_path = os.path.join(os.path.dirname(__file__), "..", "..", "speech-sample.mp3")
        
        if not os.path.exists(sample_path):
            raise HTTPException(status_code=404, detail="Sample speech file not found")
        
        # Read the file and return it
        with open(sample_path, "rb") as f:
            audio_data = f.read()
        
        return Response(
            content=audio_data,
            media_type="audio/mp3",
            headers={"Content-Disposition": "attachment; filename=speech-sample.mp3"}
        )
        
    except Exception as e:
        logger.error(f"Failed to serve sample speech: {e}")
        raise HTTPException(status_code=500, detail="Failed to serve sample speech file")

@router.post("/audio/speech-to-text")
async def speech_to_text(
    file: UploadFile = File(...),
    language: str = Form("en-US"),
    model: str = Form("google")  # google, whisper, sphinx
):
    """Convert speech audio to text using various speech recognition models."""
    try:
        logger.info(f"STT request: language={language}, model={model}")
        
        # Read the uploaded audio file
        audio_data = await file.read()
        
        if model == "google":
            # Use Google Speech Recognition
            recognizer = sr.Recognizer()
            
            # Determine file extension from uploaded file
            file_extension = os.path.splitext(file.filename)[1].lower() if file.filename else '.wav'
            
            # Create temporary file with appropriate extension
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
                temp_file.write(audio_data)
                temp_file_path = temp_file.name
            
            try:
                # Convert audio to WAV if it's not already WAV format
                if file_extension not in ['.wav', '.wave']:
                    try:
                        from pydub import AudioSegment
                        
                        # Load the audio file
                        if file_extension == '.mp3':
                            audio_segment = AudioSegment.from_mp3(temp_file_path)
                        elif file_extension == '.m4a':
                            audio_segment = AudioSegment.from_file(temp_file_path, format='m4a')
                        elif file_extension == '.ogg':
                            audio_segment = AudioSegment.from_ogg(temp_file_path)
                        else:
                            # Try to load with pydub's automatic format detection
                            audio_segment = AudioSegment.from_file(temp_file_path)
                        
                        # Export as WAV
                        wav_path = temp_file_path + '.wav'
                        audio_segment.export(wav_path, format='wav')
                        
                        # Use the converted WAV file
                        temp_file_path = wav_path
                        
                    except ImportError:
                        logger.warning("pydub not available, trying with original file format")
                    except Exception as e:
                        logger.warning(f"Audio conversion failed: {e}, trying with original file")
                
                with sr.AudioFile(temp_file_path) as source:
                    audio = recognizer.record(source)
                
                # Perform speech recognition
                text = recognizer.recognize_google(audio, language=language)
                logger.info(f"Google STT successful: {len(text)} characters")
                
                return {
                    "text": text,
                    "confidence": 0.95,  # Google doesn't provide confidence
                    "language": language,
                    "model": model
                }
                
            finally:
                # Clean up temporary files
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
                # Also clean up converted WAV file if it was created
                if temp_file_path.endswith('.wav') and temp_file_path != os.path.splitext(temp_file_path)[0]:
                    converted_wav = temp_file_path
                    if os.path.exists(converted_wav):
                        os.unlink(converted_wav)
                
        elif model == "whisper":
            # Use OpenAI Whisper (requires OpenAI API key)
            try:
                import openai
                client = openai.OpenAI()
                
                # Create temporary file for Whisper API
                with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
                    temp_file.write(audio_data)
                    temp_file_path = temp_file.name
                
                try:
                    with open(temp_file_path, "rb") as audio_file:
                        transcript = client.audio.transcriptions.create(
                            model="whisper-1",
                            file=audio_file,
                            language=language.split("-")[0] if "-" in language else "en"
                        )
                    
                    logger.info(f"Whisper STT successful: {len(transcript.text)} characters")
                    
                    return {
                        "text": transcript.text,
                        "confidence": 0.98,  # Whisper doesn't provide confidence
                        "language": language,
                        "model": model
                    }
                    
                finally:
                    os.unlink(temp_file_path)
                    
            except ImportError:
                raise HTTPException(status_code=400, detail="OpenAI not available for Whisper")
                
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported STT model: {model}")
            
    except sr.UnknownValueError:
        raise HTTPException(status_code=400, detail="Speech could not be understood")
    except sr.RequestError as e:
        raise HTTPException(status_code=500, detail=f"STT service error: {str(e)}")
    except Exception as e:
        logger.error(f"STT failed: {e}")
        raise HTTPException(status_code=500, detail=f"STT processing failed: {str(e)}")


@router.post("/audio/text-to-speech")
async def text_to_speech(
    text: str = Form(...),
    voice: str = Form("en-US-AriaNeural"),  # Default Edge TTS voice
    speed: float = Form(1.0),
    pitch: float = Form(0),
    volume: float = Form(100),
    model: str = Form("edge"),  # edge, gtts, pyttsx3
    gender: str = Form(""),  # male, female, neutral
    style: str = Form(""),  # formal, casual, cheerful, sad, angry, etc.
    use_ssml: bool = Form(False),  # Enable SSML processing
    normalize_text: bool = Form(True),  # Enable text normalization
    output_format: str = Form("mp3"),  # mp3, wav, ogg, m4a
    language: str = Form(""),  # Target language for TTS
    translate_text: bool = Form(True)  # Enable text translation
):
    """Convert text to speech using various TTS models."""
    try:
        logger.info(f"TTS request: voice={voice}, model={model}, text_length={len(text)}")
        
        # Always detect the language of the input text
        detected_lang = detect_text_language(text)
        logger.info(f"Detected language: {detected_lang}")
        
        # Translate text if output language is different from detected language
        if translate_text and language and detected_lang != language:
            try:
                from deep_translator import GoogleTranslator
                translated_text = GoogleTranslator(source=detected_lang.split('-')[0], target=language.split('-')[0]).translate(text)
                logger.info(f"Translated text from {detected_lang} to {language}: {text[:50]}... → {translated_text[:50]}...")
                text = translated_text
            except Exception as e:
                logger.warning(f"Translation failed: {e}, using original text")
                # If translation fails, use original text
        
        # Check if text contains SSML markup
        is_ssml = text.strip().startswith('<speak')
        
        # Apply text normalization if enabled (but skip if SSML is present)
        if normalize_text and not is_ssml:
            original_text = text
            text = normalize_text_for_tts(text)
            logger.info(f"Text normalized: {len(original_text)} -> {len(text)} chars")
        elif normalize_text and is_ssml:
            logger.info(f"Text normalization skipped due to SSML markup")
        
        # Apply SSML processing if enabled
        if use_ssml:
            original_text = text
            text = process_ssml(text, "", "", speed, pitch, voice)
            if text != original_text:
                logger.info(f"SSML processing applied (use_ssml: {use_ssml})")
            else:
                logger.info(f"SSML already present in text, using as-is")
        
        # Note: Speaking styles and emotions are handled through voice selection, not SSML
        # This prevents SSML tags from being spoken literally
        
        if model == "edge":
            # Use Microsoft Edge TTS (high quality, free)
            try:
                # Only override user's voice selection if they haven't explicitly chosen a voice
                # or if the voice doesn't match the selected gender
                user_selected_voice = voice
                
                # Get available voices once for style selection
                available_voices = []
                if style and not text.strip().startswith('<speak'):
                    try:
                        # Get available voices for the target language
                        edge_voices = await edge_tts.list_voices()
                        
                        for v in edge_voices:
                            available_voices.append({
                                "name": v["Name"],
                                "language": v["Locale"],
                                "gender": v["Gender"]
                            })
                        
                        # Filter voices by language if specified
                        if language:
                            target_lang = language.split('-')[0].lower()
                            available_voices = [v for v in available_voices 
                                              if target_lang in v["language"].lower()]
                        
                        logger.info(f"Found {len(available_voices)} available voices for language {language}")
                        
                    except Exception as e:
                        logger.warning(f"Failed to get available voices: {e}")
                        available_voices = []
                
                # Handle style-based voice selection
                if style and available_voices and not text.strip().startswith('<speak'):
                    try:
                        # Check if user's selected voice matches their gender preference
                        user_voice_matches_gender = True
                        if gender:
                            # Find the user's selected voice in available voices
                            user_voice_info = next((v for v in available_voices if v["name"] == user_selected_voice), None)
                            if user_voice_info:
                                user_voice_matches_gender = user_voice_info["gender"].lower() == gender.lower()
                        
                        # Only override if user's voice doesn't match their gender preference
                        if not user_voice_matches_gender:
                            # Select voice by style
                            style_voice = select_voice_by_style(available_voices, style, language)
                            if style_voice:
                                voice = style_voice
                                logger.info(f"Overriding user voice '{user_selected_voice}' with style voice '{voice}' for style '{style}'")
                            else:
                                logger.info(f"Keeping user's selected voice '{user_selected_voice}' as no suitable style voice found")
                        else:
                            logger.info(f"Keeping user's selected voice '{user_selected_voice}' as it matches gender preference")
                    except Exception as e:
                        logger.warning(f"Failed to select voice by style: {e}, using original voice")
                

                
                logger.info(f"Using Edge TTS voice: {voice} for language: {detected_lang}")
                
                # Check if text contains SSML markup
                is_ssml = text.strip().startswith('<speak')
                
                if is_ssml:
                    # For SSML, pass the text with voice parameter but without rate/volume (SSML handles these)
                    communicate = edge_tts.Communicate(text, voice)
                else:
                    # For plain text, use voice parameter with rate and volume
                    rate_str = f"{int((speed-1.0)*100):+d}%" if speed != 1.0 else "+0%"
                    volume_str = f"{int(volume-100):+d}%" if volume != 100 else "+0%"
                    communicate = edge_tts.Communicate(text, voice, rate=rate_str, volume=volume_str)
                
                # Generate audio data
                audio_data = b""
                async for chunk in communicate.stream():
                    if chunk["type"] == "audio":
                        audio_data += chunk["data"]
                
                # Convert audio format if needed
                if output_format != "mp3":
                    try:
                        from pydub import AudioSegment
                        import io
                        
                        # Load the audio data (Edge TTS returns MP3)
                        audio_segment = AudioSegment.from_mp3(io.BytesIO(audio_data))
                        
                        # Export in the requested format
                        output_buffer = io.BytesIO()
                        if output_format == "wav":
                            audio_segment.export(output_buffer, format="wav")
                            mime_type = "audio/wav"
                        elif output_format == "ogg":
                            audio_segment.export(output_buffer, format="ogg")
                            mime_type = "audio/ogg"
                        elif output_format == "m4a":
                            audio_segment.export(output_buffer, format="mp4")
                            mime_type = "audio/mp4"
                        else:
                            # Fallback to MP3
                            output_buffer = io.BytesIO(audio_data)
                            mime_type = "audio/mp3"
                            output_format = "mp3"
                        
                        audio_data = output_buffer.getvalue()
                        
                    except Exception as e:
                        logger.warning(f"Format conversion failed: {e}, using MP3")
                        mime_type = "audio/mp3"
                        output_format = "mp3"
                else:
                    mime_type = "audio/mp3"
                
                # Convert to base64
                b64 = base64.b64encode(audio_data).decode('utf-8')
                data_url = f"data:{mime_type};base64,{b64}"
                
                logger.info(f"Edge TTS successful: {len(audio_data)} bytes, format: {output_format}")
                
                return {
                    "audio_base64": data_url,
                    "format": output_format,
                    "voice": voice,
                    "model": model,
                    "text_length": len(text),
                    "applied_settings": {
                        "voice": voice,
                        "speed": speed,
                        "pitch": pitch,
                        "volume": volume,
                        "gender": gender,
                        "style": style,
                        "language": language,
                        "translation_applied": translate_text and language and detected_lang != language,
                        "ssml_used": use_ssml,
                        "text_normalized": normalize_text,
                        "output_format": output_format
                    }
                }
                
            except Exception as e:
                logger.error(f"Edge TTS failed: {e}")
                raise HTTPException(status_code=500, detail=f"Edge TTS failed: {str(e)}")
                
        elif model == "gtts":
            # Use Google Text-to-Speech
            try:
                # Use detected language or extract from voice name
                gtts_lang = detected_lang.split("-")[0] if detected_lang else (voice.split("-")[0] if "-" in voice else "en")
                tts = gtts.gTTS(text=text, lang=gtts_lang, slow=False)
                logger.info(f"gTTS using language: {gtts_lang}")
                
                # Generate audio data
                with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
                    tts.save(temp_file.name)
                    with open(temp_file.name, "rb") as f:
                        audio_data = f.read()
                    os.unlink(temp_file.name)
                
                # Convert to base64
                b64 = base64.b64encode(audio_data).decode('utf-8')
                data_url = f"data:audio/mp3;base64,{b64}"
                
                logger.info(f"gTTS successful: {len(audio_data)} bytes")
                
                return {
                    "audio_base64": data_url,
                    "format": "mp3",
                    "voice": voice,
                    "model": model,
                    "text_length": len(text),
                    "applied_settings": {
                        "voice": voice,
                        "speed": speed,
                        "pitch": pitch,
                        "volume": volume,
                        "gender": gender,
                        "style": style,
                        "language": language,
                        "translation_applied": translate_text and language and detected_lang != language,
                        "ssml_used": use_ssml,
                        "text_normalized": normalize_text
                    }
                }
                
            except Exception as e:
                logger.error(f"gTTS failed: {e}")
                raise HTTPException(status_code=500, detail=f"gTTS failed: {str(e)}")
                
        elif model == "pyttsx3":
            # Use pyttsx3 (offline, system voices)
            try:
                engine = pyttsx3.init()
                
                # Set voice properties
                engine.setProperty('rate', int(200 * speed))  # Speed
                engine.setProperty('volume', volume / 100)    # Volume
                
                # Get available voices
                voices = engine.getProperty('voices')
                if voices:
                    engine.setProperty('voice', voices[0].id)  # Use first available voice
                
                # Generate audio to temporary file
                with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
                    engine.save_to_file(text, temp_file.name)
                    engine.runAndWait()
                    
                    with open(temp_file.name, "rb") as f:
                        audio_data = f.read()
                    os.unlink(temp_file.name)
                
                # Convert to base64
                b64 = base64.b64encode(audio_data).decode('utf-8')
                data_url = f"data:audio/wav;base64,{b64}"
                
                logger.info(f"pyttsx3 successful: {len(audio_data)} bytes")
                
                return {
                    "audio_base64": data_url,
                    "format": "wav",
                    "voice": "system",
                    "model": model,
                    "text_length": len(text),
                    "applied_settings": {
                        "voice": "system",
                        "speed": speed,
                        "pitch": pitch,
                        "volume": volume,
                        "gender": gender,
                        "style": style,
                        "language": language,
                        "translation_applied": translate_text and language and detected_lang != language,
                        "ssml_used": use_ssml,
                        "text_normalized": normalize_text
                    }
                }
                
            except Exception as e:
                logger.error(f"pyttsx3 failed: {e}")
                raise HTTPException(status_code=500, detail=f"pyttsx3 failed: {str(e)}")
                
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported TTS model: {model}")
            
    except Exception as e:
        logger.error(f"TTS failed: {e}")
        raise HTTPException(status_code=500, detail=f"TTS processing failed: {str(e)}")


@router.get("/audio/tts/voices")
async def get_tts_voices(
    gender: str = "",
    model: str = "",
    language: str = ""
):
    """Get available TTS voices with optional filtering."""
    try:
        voices = []
        
        # Edge TTS voices (high quality, free)
        try:
            edge_voices = await edge_tts.list_voices()
            for voice in edge_voices:
                voices.append({
                    "name": voice["Name"],
                    "language": voice["Locale"],
                    "gender": voice["Gender"],
                    "model": "edge",
                    "style": _extract_style_from_voice_name(voice["Name"])
                })
        except Exception as e:
            logger.warning(f"Could not fetch Edge TTS voices: {e}")
        
        # System voices (pyttsx3)
        try:
            engine = pyttsx3.init()
            system_voices = engine.getProperty('voices')
            for voice in system_voices:
                voices.append({
                    "name": voice.name,
                    "language": voice.languages[0] if voice.languages else "en",
                    "gender": "Unknown",
                    "model": "pyttsx3",
                    "style": "neutral"
                })
        except Exception as e:
            logger.warning(f"Could not fetch system voices: {e}")
        
        # Apply filtering if criteria provided
        if gender or model or language:
            try:
                voices = filter_voices_by_criteria(voices, gender, "", model, language)
                logger.info(f"Filtered voices for criteria - gender: {gender}, model: {model}, language: {language}")
                logger.info(f"Found {len(voices)} voices after filtering")
            except Exception as e:
                logger.error(f"Error filtering voices: {e}")
                # Return all voices if filtering fails
                voices = []
        
        # Log available voices for debugging
        if language:
            logger.info(f"Available voices for language '{language}': {[v['name'] for v in voices]}")
        
        return {"voices": voices}
        
    except Exception as e:
        logger.error(f"Failed to get voices: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get voices: {str(e)}")





def _extract_style_from_voice_name(voice_name: str) -> str:
    """Extract speaking style from voice name."""
    name_lower = voice_name.lower()
    
    if any(word in name_lower for word in ["formal", "professional", "business"]):
        return "formal"
    elif any(word in name_lower for word in ["casual", "friendly", "conversational"]):
        return "casual"
    elif any(word in name_lower for word in ["excited", "energetic", "enthusiastic"]):
        return "excited"
    elif any(word in name_lower for word in ["calm", "relaxed", "gentle"]):
        return "calm"
    else:
        return "neutral"


def select_voice_by_style(voices: List[Dict[str, Any]], target_style: str, target_language: str = "") -> str:
    """Select a voice that matches the desired speaking style and language."""
    if not target_style:
        return voices[0]["name"] if voices else ""
    
    # Map our style names to voice characteristics
    style_keywords = {
        'cheerful': ['cheerful', 'happy', 'bright', 'energetic'],
        'sad': ['sad', 'melancholic', 'somber', 'serious'],
        'angry': ['angry', 'frustrated', 'stern', 'harsh'],
        'friendly': ['friendly', 'warm', 'casual', 'conversational'],
        'terrified': ['terrified', 'scared', 'fearful', 'nervous'],
        'shouting': ['shouting', 'loud', 'booming', 'powerful'],
        'unfriendly': ['unfriendly', 'cold', 'formal', 'distant'],
        'whispering': ['whispering', 'soft', 'gentle', 'quiet'],
        'hopeful': ['hopeful', 'optimistic', 'positive', 'encouraging'],
        'casual': ['casual', 'friendly', 'conversational', 'relaxed'],
        'excited': ['excited', 'energetic', 'enthusiastic', 'cheerful'],
        'calm': ['calm', 'relaxed', 'gentle', 'peaceful']
    }
    
    keywords = style_keywords.get(target_style.lower(), [target_style.lower()])
    
    # First, try to find a voice that matches both style and language
    if target_language:
        for voice in voices:
            voice_name_lower = voice["name"].lower()
            voice_lang = voice.get("language", "").lower()
            
            if (any(keyword in voice_name_lower for keyword in keywords) and 
                target_language.lower() in voice_lang):
                return voice["name"]
    
    # If no match found, try to find any voice with the style
    for voice in voices:
        voice_name_lower = voice["name"].lower()
        if any(keyword in voice_name_lower for keyword in keywords):
            return voice["name"]
    
    # Fallback to first available voice
    return voices[0]["name"] if voices else ""





# =================== Audio/Music Endpoints ===================

def _wav_bytes_from_float32(mono_signal: np.ndarray, sample_rate: int = 44100) -> bytes:
    # Clip and convert to 16-bit PCM
    clipped = np.clip(mono_signal, -1.0, 1.0)
    pcm16 = (clipped * 32767.0).astype(np.int16)
    with io.BytesIO() as buffer:
        with wave.open(buffer, 'wb') as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)  # 16-bit
            wf.setframerate(sample_rate)
            wf.writeframes(pcm16.tobytes())
        return buffer.getvalue()


@router.post("/audio/generate/music")
async def generate_music(request: dict):
    """Generate a simple WAV melody from a text prompt (demo)."""
    try:
        prompt = request.get("prompt", "")
        duration = int(request.get("duration", 8))  # seconds
        tempo_bpm = int(request.get("tempo", 100))
        sample_rate = 44100

        # Parse the enhanced prompt to extract instrument, genre, mood, and key
        prompt_parts = prompt.split(":")
        if len(prompt_parts) >= 2:
            # Extract the descriptive part after the colon
            description = prompt_parts[1].strip()
            # Parse the prefix for instrument, genre, mood, key
            prefix = prompt_parts[0].strip()
            prefix_words = prefix.split()
            
            # Extract parameters from the prefix
            instrument = "piano"  # default
            genre = "cinematic"   # default
            mood = "uplifting"    # default
            key = "C"             # default
            
            # Look for instrument keywords (check all words in prefix)
            instrument_keywords = ["piano", "guitar", "strings", "drums", "synth", "orchestra", "jazz", "electronic"]
            for word in prefix_words:
                if word.lower() in instrument_keywords:
                    instrument = word.lower()
                    break
            
            # Look for genre keywords (check all words in prefix)
            genre_keywords = ["cinematic", "rock", "pop", "jazz", "classical", "electronic", "ambient", "folk"]
            for word in prefix_words:
                if word.lower() in genre_keywords:
                    genre = word.lower()
                    break
            
            # Look for mood keywords (check all words in prefix)
            mood_keywords = ["uplifting", "melancholic", "energetic", "relaxing", "dramatic", "mysterious", "romantic", "epic"]
            for word in prefix_words:
                if word.lower() in mood_keywords:
                    mood = word.lower()
                    break
            
            # Look for key (usually the last word before "key")
            for i, word in enumerate(prefix_words):
                if word.lower() == "key" and i > 0:
                    key = prefix_words[i-1]
                    break
        else:
            # Fallback to old prompt analysis
            description = prompt
            instrument = "piano"
            genre = "cinematic"
            mood = "uplifting"
            key = "C"

        logger.info(f"Music generation parameters: instrument={instrument}, genre={genre}, mood={mood}, key={key}")
        logger.info(f"Description: {description}")
        logger.info(f"Full prompt: '{prompt}'")
        logger.info(f"Prefix words: {prefix_words}")

        # Enhanced prompt analysis for musical characteristics
        prompt_lower = description.lower()
        
        # Determine scale/mode based on mood keywords
        if any(k in prompt_lower for k in ["sad", "minor", "melancholy", "dark", "somber", "gloomy"]):
            scale = [0, 2, 3, 5, 7, 8, 10]  # natural minor intervals
            root_hz = 220.0  # A3
        elif any(k in prompt_lower for k in ["mysterious", "mystical", "ethereal", "ambient"]):
            scale = [0, 2, 3, 5, 7, 8, 10]  # minor scale for mystery
            root_hz = 196.0  # G3
        elif any(k in prompt_lower for k in ["epic", "heroic", "triumphant", "orchestral"]):
            scale = [0, 2, 4, 5, 7, 9, 11]  # major scale
            root_hz = 329.63  # E4 (higher for epic feel)
        elif any(k in prompt_lower for k in ["chill", "lo-fi", "relaxed", "calm"]):
            scale = [0, 2, 4, 5, 7, 9, 11]  # major scale
            root_hz = 174.61  # F3 (lower for chill)
        elif any(k in prompt_lower for k in ["energetic", "fast", "upbeat", "dance"]):
            scale = [0, 2, 4, 5, 7, 9, 11]  # major scale
            root_hz = 261.63  # C4
        elif any(k in prompt_lower for k in ["latin", "salsa", "tropical"]):
            scale = [0, 2, 4, 5, 7, 9, 11]  # major scale
            root_hz = 246.94  # B3
        elif any(k in prompt_lower for k in ["electronic", "synth", "digital"]):
            scale = [0, 2, 4, 5, 7, 9, 11]  # major scale
            root_hz = 261.63  # C4
        elif any(k in prompt_lower for k in ["acoustic", "folk", "organic"]):
            scale = [0, 2, 4, 5, 7, 9, 11]  # major scale
            root_hz = 220.0  # A3
        elif any(k in prompt_lower for k in ["retro", "8-bit", "chiptune", "arcade"]):
            scale = [0, 2, 4, 5, 7, 9, 11]  # major scale
            root_hz = 261.63  # C4
        else:
            # Default to major scale
            scale = [0, 2, 4, 5, 7, 9, 11]  # major scale intervals
            root_hz = 261.63  # C4

        # Adjust tempo based on prompt
        if any(k in prompt_lower for k in ["slow", "relaxed", "ambient", "chill"]):
            tempo_bpm = max(60, tempo_bpm - 20)
        elif any(k in prompt_lower for k in ["fast", "energetic", "dance", "upbeat"]):
            tempo_bpm = min(160, tempo_bpm + 20)

        # Note timing
        beats_per_sec = tempo_bpm / 60.0
        beat_len = 1.0 / beats_per_sec
        
        # Vary note length based on style
        if any(k in prompt_lower for k in ["ambient", "drone", "atmospheric"]):
            note_len = beat_len * 2  # longer notes
        elif any(k in prompt_lower for k in ["fast", "energetic", "dance"]):
            note_len = beat_len * 0.5  # shorter notes
        else:
            note_len = beat_len  # quarter notes

        t = np.linspace(0, note_len, int(sample_rate * note_len), endpoint=False)

        # Instrument-specific sound generation functions
        def generate_piano_tone(freq, t):
            """Generate piano-like tone with attack and decay"""
            tone = 0.6 * np.sin(2 * np.pi * freq * t)
            # Add piano-like envelope (quick attack, slow decay)
            attack_samples = int(0.01 * sample_rate)  # 10ms attack
            decay_samples = int(0.5 * sample_rate)    # 500ms decay
            env = np.ones_like(t)
            env[:attack_samples] = np.linspace(0, 1, attack_samples)
            env[attack_samples:] = np.exp(-np.linspace(0, 3, len(env) - attack_samples))
            return tone * env

        def generate_guitar_tone(freq, t):
            """Generate guitar-like tone with harmonics"""
            # Add harmonics for guitar-like sound
            tone = 0.5 * np.sin(2 * np.pi * freq * t)
            tone += 0.3 * np.sin(2 * np.pi * freq * 2 * t)  # 2nd harmonic
            tone += 0.2 * np.sin(2 * np.pi * freq * 3 * t)  # 3rd harmonic
            # Guitar-like envelope
            attack_samples = int(0.02 * sample_rate)  # 20ms attack
            decay_samples = int(0.8 * sample_rate)    # 800ms decay
            env = np.ones_like(t)
            env[:attack_samples] = np.linspace(0, 1, attack_samples)
            env[attack_samples:] = np.exp(-np.linspace(0, 2, len(env) - attack_samples))
            return tone * env

        def generate_strings_tone(freq, t):
            """Generate strings-like tone with vibrato"""
            # Add vibrato for strings
            vibrato_freq = 5.0  # 5 Hz vibrato
            vibrato_depth = 0.02  # 2% frequency modulation
            freq_mod = freq * (1 + vibrato_depth * np.sin(2 * np.pi * vibrato_freq * t))
            tone = 0.4 * np.sin(2 * np.pi * freq_mod * t)
            # Strings envelope (slow attack, long sustain)
            attack_samples = int(0.1 * sample_rate)  # 100ms attack
            env = np.ones_like(t)
            env[:attack_samples] = np.linspace(0, 1, attack_samples)
            return tone * env

        def generate_drums_tone(freq, t):
            """Generate drum-like percussive sound"""
            # For drums, we'll create percussive patterns instead of melodic tones
            # Create a drum pattern with kick, snare, and hi-hat
            kick_freq = 60.0
            snare_freq = 200.0
            hihat_freq = 800.0
            
            # Create drum pattern (kick on 1, snare on 3, hi-hat on every beat)
            drum_pattern = []
            for i in range(num_notes):
                if i % 4 == 0:  # Kick drum
                    tone = 0.8 * np.exp(-np.linspace(0, 5, len(t))) * np.sin(2 * np.pi * kick_freq * t)
                elif i % 4 == 2:  # Snare drum
                    tone = 0.6 * np.exp(-np.linspace(0, 3, len(t))) * (np.sin(2 * np.pi * snare_freq * t) + np.random.normal(0, 0.3, len(t)))
                else:  # Hi-hat
                    tone = 0.4 * np.exp(-np.linspace(0, 1, len(t))) * (np.sin(2 * np.pi * hihat_freq * t) + np.random.normal(0, 0.5, len(t)))
                drum_pattern.append(tone)
            return drum_pattern

        def generate_synth_tone(freq, t):
            """Generate synth-like tone with filter sweep"""
            # Add filter sweep effect
            filter_freq = 0.5  # 0.5 Hz filter sweep
            filter_depth = 0.3
            freq_mod = freq * (1 + filter_depth * np.sin(2 * np.pi * filter_freq * t))
            tone = 0.5 * np.sin(2 * np.pi * freq_mod * t)
            # Add some harmonics for synth character
            tone += 0.2 * np.sin(2 * np.pi * freq_mod * 2 * t)
            # Synth envelope
            attack_samples = int(0.05 * sample_rate)  # 50ms attack
            decay_samples = int(0.3 * sample_rate)    # 300ms decay
            env = np.ones_like(t)
            env[:attack_samples] = np.linspace(0, 1, attack_samples)
            env[attack_samples:] = np.exp(-np.linspace(0, 2, len(env) - attack_samples))
            return tone * env

        def generate_orchestra_tone(freq, t):
            """Generate orchestra-like tone with multiple instruments"""
            # Combine strings and brass-like sounds
            strings = 0.3 * np.sin(2 * np.pi * freq * t)
            brass = 0.2 * np.sin(2 * np.pi * freq * t) + 0.1 * np.sin(2 * np.pi * freq * 2 * t)
            woodwind = 0.2 * np.sin(2 * np.pi * freq * 1.5 * t)
            tone = strings + brass + woodwind
            # Orchestra envelope
            attack_samples = int(0.15 * sample_rate)  # 150ms attack
            env = np.ones_like(t)
            env[:attack_samples] = np.linspace(0, 1, attack_samples)
            return tone * env

        def generate_jazz_tone(freq, t):
            """Generate jazz-like tone with swing and blues notes"""
            # Add blues notes (flattened 3rd, 5th, 7th)
            blues_third = freq * (2 ** (3.5 / 12.0))  # Between minor and major third
            blues_fifth = freq * (2 ** (6.5 / 12.0))  # Between perfect and diminished fifth
            blues_seventh = freq * (2 ** (9.5 / 12.0))  # Between major and minor seventh
            
            # Jazz chord with blues notes
            tone = 0.4 * np.sin(2 * np.pi * freq * t)  # Root
            tone += 0.2 * np.sin(2 * np.pi * blues_third * t)  # Blues third
            tone += 0.15 * np.sin(2 * np.pi * blues_fifth * t)  # Blues fifth
            tone += 0.1 * np.sin(2 * np.pi * blues_seventh * t)  # Blues seventh
            
            # Jazz envelope (smooth attack, long sustain)
            attack_samples = int(0.08 * sample_rate)  # 80ms attack
            env = np.ones_like(t)
            env[:attack_samples] = np.linspace(0, 1, attack_samples)
            return tone * env

        def generate_electronic_tone(freq, t):
            """Generate electronic-like tone with digital effects"""
            # Add digital harmonics and filtering
            tone = 0.5 * np.sin(2 * np.pi * freq * t)
            tone += 0.3 * np.sin(2 * np.pi * freq * 2 * t)  # 2nd harmonic
            tone += 0.2 * np.sin(2 * np.pi * freq * 4 * t)  # 4th harmonic
            
            # Add digital distortion
            tone = np.tanh(tone * 2) * 0.5  # Soft clipping
            
            # Electronic envelope (quick attack, medium decay)
            attack_samples = int(0.02 * sample_rate)  # 20ms attack
            decay_samples = int(0.2 * sample_rate)    # 200ms decay
            env = np.ones_like(t)
            env[:attack_samples] = np.linspace(0, 1, attack_samples)
            env[attack_samples:] = np.exp(-np.linspace(0, 2, len(env) - attack_samples))
            return tone * env

        # Select tone generation function based on instrument
        if instrument == "piano":
            tone_generator = generate_piano_tone
        elif instrument == "guitar":
            tone_generator = generate_guitar_tone
        elif instrument == "strings":
            tone_generator = generate_strings_tone
        elif instrument == "drums":
            tone_generator = generate_drums_tone
        elif instrument == "synth":
            tone_generator = generate_synth_tone
        elif instrument == "orchestra":
            tone_generator = generate_orchestra_tone
        elif instrument == "jazz":
            tone_generator = generate_jazz_tone
        elif instrument == "electronic":
            tone_generator = generate_electronic_tone
        else:
            # Default to piano for other instruments
            tone_generator = generate_piano_tone

        # Build melody with more variation based on prompt
        num_notes = max(1, int(duration / note_len))
        melody = []
        
        # Create more sophisticated patterns based on prompt description and instrument
        if instrument == "drums":
            # Special handling for drums - use the drum pattern generator
            melody = tone_generator(None, t)  # freq not needed for drums
        else:
            # Enhanced melodic generation based on prompt description
            if any(k in prompt_lower for k in ["jazz", "quartet", "smooth", "walking", "brush"]):
                # Jazz-style patterns with more sophisticated note selection
                jazz_patterns = [
                    [0, 2, 4, 7],  # Major triad + 7th
                    [0, 3, 7, 10], # Minor triad + 7th
                    [0, 4, 7, 11], # Major 7th chord
                    [0, 3, 6, 10], # Diminished chord
                    [0, 2, 5, 9],  # Suspended chord
                ]
                
                for i in range(num_notes):
                    # Use jazz chord patterns
                    pattern = jazz_patterns[i % len(jazz_patterns)]
                    chord_notes = []
                    for degree in pattern:
                        freq = root_hz * (2 ** (degree / 12.0))
                        chord_notes.append(freq)
                    
                    # Create chord progression
                    for j, freq in enumerate(chord_notes):
                        tone = tone_generator(freq, t)
                        if j == 0:  # Root note
                            melody.append(tone)
                        else:  # Add harmony notes with reduced volume
                            harmony_tone = tone * 0.3
                            if len(melody) > 0:
                                melody[-1] += harmony_tone
                            else:
                                melody.append(harmony_tone)
                                
            elif any(k in prompt_lower for k in ["epic", "orchestral", "heroic", "cinematic"]):
                # Epic orchestral patterns with dramatic progressions
                epic_pattern = [0, 4, 7, 12, 7, 4, 0, 7, 12, 16, 12, 7]  # Ascending/descending pattern
                for i in range(num_notes):
                    degree = epic_pattern[i % len(epic_pattern)]
                    freq = root_hz * (2 ** (degree / 12.0))
                    tone = tone_generator(freq, t)
                    melody.append(tone)
                    
            elif any(k in prompt_lower for k in ["ambient", "drone", "atmospheric", "meditation"]):
                # Long sustained notes with subtle variations
                for i in range(num_notes):
                    degree = scale[i % len(scale)]
                    freq = root_hz * (2 ** (degree / 12.0))
                    # Add subtle frequency modulation for ambient feel
                    freq_mod = freq * (1 + 0.01 * np.sin(2 * np.pi * 0.1 * i))
                    tone = tone_generator(freq_mod, t)
                    melody.append(tone)
                    
            elif any(k in prompt_lower for k in ["rock", "anthem", "powerful", "guitar"]):
                # Rock-style patterns with power chords
                rock_pattern = [0, 7, 0, 7, 12, 7, 0, 7]  # Power chord progression
                for i in range(num_notes):
                    degree = rock_pattern[i % len(rock_pattern)]
                    freq = root_hz * (2 ** (degree / 12.0))
                    tone = tone_generator(freq, t)
                    melody.append(tone)
                    
            elif any(k in prompt_lower for k in ["electronic", "synth", "dance", "pulsing"]):
                # Electronic patterns with arpeggios
                arp_pattern = [0, 4, 7, 12, 7, 4, 0, 4, 7, 12, 16, 12]  # Arpeggio pattern
                for i in range(num_notes):
                    degree = arp_pattern[i % len(arp_pattern)]
                    freq = root_hz * (2 ** (degree / 12.0))
                    tone = tone_generator(freq, t)
                    melody.append(tone)
                    
            else:
                # Enhanced standard pattern with more musical variation
                # Use a more sophisticated progression
                progression = [0, 4, 7, 12, 7, 4, 0, 7, 12, 16, 12, 7, 4, 0]
                for i in range(num_notes):
                    degree = progression[i % len(progression)]
                    freq = root_hz * (2 ** (degree / 12.0))
                    tone = tone_generator(freq, t)
                    melody.append(tone)

        signal = np.concatenate(melody)
        # Ensure exact duration length
        target_len = int(sample_rate * duration)
        if signal.size < target_len:
            signal = np.pad(signal, (0, target_len - signal.size))
        else:
            signal = signal[:target_len]

        wav_bytes = _wav_bytes_from_float32(signal, sample_rate)
        b64 = base64.b64encode(wav_bytes).decode('utf-8')
        data_url = f"data:audio/wav;base64,{b64}"
        return {"audio_base64": data_url, "format": "wav", "duration": duration, "tempo": tempo_bpm}
    except Exception as e:
        logger.error(f"Music generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/audio/process")
async def process_audio(
    file: UploadFile = File(...),
    normalize: bool = Form(False),
    reverse: bool = Form(False),
    speed: float = Form(1.0),
    pitch: float = Form(1.0),
    reverb: int = Form(0),
    echo: int = Form(0),
    volume: float = Form(1.0),
    fade_in: float = Form(0.0),
    fade_out: float = Form(0.0),
    # EQ parameters
    eq_low: float = Form(0.0),      # Low frequency boost/cut in dB
    eq_mid: float = Form(0.0),      # Mid frequency boost/cut in dB
    eq_high: float = Form(0.0),     # High frequency boost/cut in dB
    # Compression parameters
    compression_threshold: float = Form(-20.0),  # Threshold in dB
    compression_ratio: float = Form(4.0),        # Compression ratio
    compression_attack: float = Form(10.0),      # Attack time in ms
    compression_release: float = Form(100.0),    # Release time in ms
    output_format: str = Form("wav"),
    sample_rate: int = Form(44100)
):
    """Apply advanced audio processing to uploaded audio file."""
    try:
        # Log received parameters for debugging
        logger.info(f"Audio processing parameters: speed={speed}, pitch={pitch}, volume={volume}, reverb={reverb}, echo={echo}")
        logger.info(f"Pitch parameter type: {type(pitch)}, value: {pitch}")
        logger.info(f"Speed parameter type: {type(speed)}, value: {speed}")
        
        # Verify pitch parameter is valid
        if not isinstance(pitch, (int, float)):
            logger.error(f"Invalid pitch parameter type: {type(pitch)}")
            pitch = 1.0
        if pitch <= 0:
            logger.error(f"Invalid pitch value: {pitch}")
            pitch = 1.0
        
        # Test audioop functionality
        try:
            test_data = b'\x00\x00' * 1000  # Simple test audio data
            test_result = audioop.ratecv(test_data, 2, 1, 44100, 22050, None)
            logger.info(f"Audioop test successful: {len(test_result[0])} bytes")
        except Exception as e:
            logger.error(f"Audioop test failed: {e}")
        
        # Test pitch processing
        try:
            test_pitch_data = b'\x00\x00' * 1000
            test_pitch_result = audioop.ratecv(test_pitch_data, 2, 1, 44100, 88200, None)  # 2x pitch
            logger.info(f"Pitch test successful: {len(test_pitch_result[0])} bytes")
            
            # Create a simple sine wave test for pitch
            import math
            test_freq = 440  # A4 note
            test_duration = 1.0  # 1 second
            test_samples = int(44100 * test_duration)
            test_audio = bytearray()
            
            for i in range(test_samples):
                sample = int(32767 * 0.3 * math.sin(2 * math.pi * test_freq * i / 44100))
                test_audio.extend(sample.to_bytes(2, byteorder='little', signed=True))
            
            # Test pitch change on this sine wave
            test_pitch_result = audioop.ratecv(bytes(test_audio), 2, 1, 44100, 88200, None)  # 2x pitch
            logger.info(f"Sine wave pitch test successful: original={len(test_audio)}, pitched={len(test_pitch_result[0])}")
            
        except Exception as e:
            logger.error(f"Pitch test failed: {e}")
            import traceback
            logger.error(f"Pitch test traceback: {traceback.format_exc()}")
        
        raw = await file.read()
        logger.info(f"File received: {file.filename}, size: {len(raw)} bytes")
        
        with wave.open(io.BytesIO(raw), 'rb') as wf:
            nch = wf.getnchannels()
            sw = wf.getsampwidth()
            fr = wf.getframerate()
            frames = wf.readframes(wf.getnframes())
            logger.info(f"Audio file info: channels={nch}, sample_width={sw}, frame_rate={fr}, frames={len(frames)}")

        # Work in mono for simplicity
        if nch > 1:
            frames = audioop.tomono(frames, sw, 0.5, 0.5)
            nch_out = 1
        else:
            nch_out = 1

        processed = frames
        logger.info(f"Initial processing: len(processed)={len(processed)}")

        # Normalize (apply first to establish baseline)
        if normalize:
            logger.info("Applying normalization")
            rms = audioop.rms(processed, sw) or 1
            target_rms = 5000
            gain = min(4.0, max(0.25, target_rms / rms))
            processed = audioop.mul(processed, sw, gain)

        # EQ processing (apply after normalization)
        if abs(eq_low) > 0.1 or abs(eq_mid) > 0.1 or abs(eq_high) > 0.1:
            logger.info(f"Applying EQ: low={eq_low}dB, mid={eq_mid}dB, high={eq_high}dB")
            try:
                # Convert audio to numpy array for processing
                audio_array = np.frombuffer(processed, dtype=np.int16)
                
                # Simple 3-band EQ using FFT
                # This is a simplified implementation - in practice you'd use proper filter design
                fft_data = np.fft.fft(audio_array.astype(np.float32))
                freqs = np.fft.fftfreq(len(audio_array), 1/fr)
                
                # Apply EQ gains to different frequency bands
                # Low frequencies (below 250Hz)
                low_mask = np.abs(freqs) < 250
                fft_data[low_mask] *= 10**(eq_low/20)
                
                # Mid frequencies (250Hz - 4kHz)
                mid_mask = (np.abs(freqs) >= 250) & (np.abs(freqs) < 4000)
                fft_data[mid_mask] *= 10**(eq_mid/20)
                
                # High frequencies (above 4kHz)
                high_mask = np.abs(freqs) >= 4000
                fft_data[high_mask] *= 10**(eq_high/20)
                
                # Convert back to time domain
                processed_array = np.real(np.fft.ifft(fft_data)).astype(np.int16)
                processed = processed_array.tobytes()
                
                logger.info(f"EQ applied successfully")
            except Exception as e:
                logger.error(f"Error during EQ processing: {e}")
                import traceback
                logger.error(f"Traceback: {traceback.format_exc()}")

        # Compression processing (apply after EQ)
        if compression_threshold < 0:  # Only apply if threshold is set
            logger.info(f"Applying compression: threshold={compression_threshold}dB, ratio={compression_ratio}:1")
            try:
                # Convert audio to numpy array
                audio_array = np.frombuffer(processed, dtype=np.int16)
                
                # Convert to float for processing
                audio_float = audio_array.astype(np.float32) / 32768.0
                
                # Calculate RMS in sliding windows for compression
                window_size = int(fr * 0.01)  # 10ms window
                compressed = np.zeros_like(audio_float)
                
                for i in range(len(audio_float)):
                    # Calculate RMS of recent samples
                    start_idx = max(0, i - window_size)
                    rms = np.sqrt(np.mean(audio_float[start_idx:i+1]**2))
                    
                    # Convert RMS to dB
                    rms_db = 20 * np.log10(max(rms, 1e-10))
                    
                    # Apply compression if above threshold
                    if rms_db > compression_threshold:
                        # Calculate gain reduction
                        excess_db = rms_db - compression_threshold
                        gain_reduction_db = excess_db * (1 - 1/compression_ratio)
                        gain_reduction = 10**(gain_reduction_db/20)
                        
                        # Apply gain reduction
                        compressed[i] = audio_float[i] * gain_reduction
                    else:
                        compressed[i] = audio_float[i]
                
                # Convert back to int16
                processed_array = (compressed * 32768.0).astype(np.int16)
                processed = processed_array.tobytes()
                
                logger.info(f"Compression applied successfully")
            except Exception as e:
                logger.error(f"Error during compression processing: {e}")
                import traceback
                logger.error(f"Traceback: {traceback.format_exc()}")

        # Pitch shift (apply before speed to avoid conflicts)
        if abs(pitch - 1.0) > 1e-3:
            logger.info(f"=== PITCH PROCESSING START ===")
            logger.info(f"Applying pitch change: {pitch}x")
            logger.info(f"Current frame rate: {fr}")
            logger.info(f"Current audio length: {len(processed)} bytes")
            
            try:
                # Create a simple test to verify pitch processing works
                test_tone = b'\x00\x00' * 1000  # Simple test data
                test_pitch_fr = int(44100 * pitch)
                test_result = audioop.ratecv(test_tone, 2, 1, 44100, test_pitch_fr, None)
                logger.info(f"Pitch test successful: input={len(test_tone)}, output={len(test_result[0])}, pitch={pitch}")
                
                # Use a more effective pitch shifting approach
                # First, change the sample rate to change pitch
                pitch_fr = int(fr * pitch)
                logger.info(f"Pitch frame rate: {pitch_fr} (original: {fr})")
                
                # Validate the new frame rate
                if pitch_fr <= 0:
                    logger.error(f"Invalid pitch frame rate: {pitch_fr}")
                else:
                    # Convert to the new sample rate
                    logger.info(f"Converting audio from {fr}Hz to {pitch_fr}Hz")
                    converted, _ = audioop.ratecv(processed, sw, nch_out, fr, pitch_fr, None)
                    processed = converted
                    fr = pitch_fr
                    logger.info(f"After pitch change: len(processed)={len(processed)}, new_fr={fr}")
                    
                    # Verify the change was applied
                    if len(processed) > 0:
                        logger.info(f"Pitch change successful: {pitch}x applied")
                        logger.info(f"Audio length changed from {len(frames)} to {len(processed)} bytes")
                    else:
                        logger.error("Pitch change failed: processed audio is empty")
            except Exception as e:
                logger.error(f"Error during pitch processing: {e}")
                import traceback
                logger.error(f"Traceback: {traceback.format_exc()}")
            logger.info(f"=== PITCH PROCESSING END ===")
        else:
            logger.info("No pitch change applied")

        # Speed adjustment (apply after pitch to avoid conflicts)
        if abs(speed - 1.0) > 1e-3:
            logger.info(f"Applying speed change: {speed}x, original_fr={fr}")
            try:
                # Calculate new frame rate based on speed
                new_fr = int(fr * speed)
                logger.info(f"New frame rate: {new_fr}")
                
                # Ensure we have valid audio data
                if len(processed) > 0 and new_fr > 0:
                    converted, _ = audioop.ratecv(processed, sw, nch_out, fr, new_fr, None)
                    processed = converted
                    fr = new_fr
                    logger.info(f"After speed change: len(processed)={len(processed)}, new_fr={fr}")
                else:
                    logger.error(f"Invalid audio data for speed processing: len={len(processed)}, new_fr={new_fr}")
            except Exception as e:
                logger.error(f"Error during speed processing: {e}")
        else:
            logger.info("No speed change applied")

        # Enhanced reverb effect
        if reverb > 0:
            logger.info(f"Applying reverb: {reverb}%")
            try:
                reverb_strength = reverb / 100.0
                # Create multiple delay taps for more realistic reverb
                delays = [0.05, 0.1, 0.15, 0.2]  # 50ms, 100ms, 150ms, 200ms
                decay_factors = [0.8, 0.6, 0.4, 0.2]
                
                for i, delay_time in enumerate(delays):
                    delay_samples = int(fr * delay_time)
                    if len(processed) > delay_samples:
                        # Create delayed signal
                        delayed = processed[delay_samples:] + b'\x00' * delay_samples
                        # Apply decay factor
                        decayed = audioop.mul(delayed, sw, decay_factors[i] * reverb_strength)
                        # Mix with original
                        processed = audioop.add(processed, decayed, sw)
                
                logger.info(f"Reverb applied with {len(delays)} delay taps")
            except Exception as e:
                logger.error(f"Error during reverb processing: {e}")
        else:
            logger.info("No reverb applied")

        # Enhanced echo effect
        if echo > 0:
            logger.info(f"Applying echo: {echo}%")
            try:
                echo_strength = echo / 100.0
                # Create multiple echo taps for more realistic echo
                echo_delays = [0.3, 0.6, 0.9]  # 300ms, 600ms, 900ms
                echo_decays = [0.7, 0.5, 0.3]
                
                for i, delay_time in enumerate(echo_delays):
                    delay_samples = int(fr * delay_time)
                    if len(processed) > delay_samples:
                        # Create delayed signal
                        delayed = processed[delay_samples:] + b'\x00' * delay_samples
                        # Apply decay factor
                        decayed = audioop.mul(delayed, sw, echo_decays[i] * echo_strength)
                        # Mix with original
                        processed = audioop.add(processed, decayed, sw)
                
                logger.info(f"Echo applied with {len(echo_delays)} echo taps")
            except Exception as e:
                logger.error(f"Error during echo processing: {e}")
        else:
            logger.info("No echo applied")

        # Fade in effect
        if fade_in > 0:
            fade_samples = int(fr * fade_in)
            if fade_samples > 0 and len(processed) > fade_samples:
                logger.info(f"Applying fade in: {fade_in}s ({fade_samples} samples)")
                logger.info(f"Audio length before fade: {len(processed)} bytes")
                logger.info(f"Current frame rate: {fr}Hz")
                try:
                    # Apply envelope to the beginning of the audio
                    fade_data = processed[:fade_samples]
                    
                    # Determine correct data type based on sample width
                    if sw == 1:
                        dtype = np.int8
                    elif sw == 2:
                        dtype = np.int16
                    elif sw == 4:
                        dtype = np.int32
                    else:
                        dtype = np.int16  # Default fallback
                    
                    fade_array = np.frombuffer(fade_data, dtype=dtype)
                    actual_samples = len(fade_array)
                    logger.info(f"Fade data extracted: {actual_samples} samples, range: {fade_array.min()} to {fade_array.max()}, dtype: {dtype}")
                    
                    # Create fade-in envelope with correct length
                    envelope = np.linspace(0, 1, actual_samples)
                    logger.info(f"Fade envelope created: {len(envelope)} samples, range: {envelope[0]:.3f} to {envelope[-1]:.3f}")
                    
                    # Apply envelope
                    faded_array = (fade_array * envelope).astype(dtype)
                    logger.info(f"Fade applied: {len(faded_array)} samples, range: {faded_array.min()} to {faded_array.max()}")
                    
                    # Replace the beginning with faded data
                    processed = faded_array.tobytes() + processed[fade_samples:]
                    logger.info(f"Fade in applied successfully, new length: {len(processed)} bytes")
                except Exception as e:
                    logger.error(f"Error during fade in processing: {e}")
                    import traceback
                    logger.error(f"Traceback: {traceback.format_exc()}")

        # Fade out effect
        if fade_out > 0:
            fade_samples = int(fr * fade_out)
            if fade_samples > 0 and len(processed) > fade_samples:
                logger.info(f"Applying fade out: {fade_out}s ({fade_samples} samples)")
                logger.info(f"Audio length before fade out: {len(processed)} bytes")
                logger.info(f"Current frame rate: {fr}Hz")
                try:
                    # Apply envelope to the end of the audio
                    fade_data = processed[-fade_samples:]
                    
                    # Determine correct data type based on sample width
                    if sw == 1:
                        dtype = np.int8
                    elif sw == 2:
                        dtype = np.int16
                    elif sw == 4:
                        dtype = np.int32
                    else:
                        dtype = np.int16  # Default fallback
                    
                    fade_array = np.frombuffer(fade_data, dtype=dtype)
                    actual_samples = len(fade_array)
                    logger.info(f"Fade out data extracted: {actual_samples} samples, range: {fade_array.min()} to {fade_array.max()}, dtype: {dtype}")
                    
                    # Create fade-out envelope with correct length
                    envelope = np.linspace(1, 0, actual_samples)
                    logger.info(f"Fade out envelope created: {len(envelope)} samples, range: {envelope[0]:.3f} to {envelope[-1]:.3f}")
                    
                    # Apply envelope
                    faded_array = (fade_array * envelope).astype(dtype)
                    logger.info(f"Fade out applied: {len(faded_array)} samples, range: {faded_array.min()} to {faded_array.max()}")
                    
                    # Replace the end with faded data
                    processed = processed[:-fade_samples] + faded_array.tobytes()
                    logger.info(f"Fade out applied successfully, new length: {len(processed)} bytes")
                except Exception as e:
                    logger.error(f"Error during fade out processing: {e}")
                    import traceback
                    logger.error(f"Traceback: {traceback.format_exc()}")

        # Volume adjustment (apply near the end to avoid being overridden)
        if abs(volume - 1.0) > 1e-3:
            logger.info(f"Applying volume: {volume}")
            processed = audioop.mul(processed, sw, volume)

        # Reverse
        if reverse:
            processed = processed[::-1]

        # Resample if needed
        if fr != sample_rate:
            converted, _ = audioop.ratecv(processed, sw, nch_out, fr, sample_rate, None)
            processed = converted
            fr = sample_rate

        # Write output in specified format
        with io.BytesIO() as buffer:
            if output_format.lower() == "wav":
                with wave.open(buffer, 'wb') as wf:
                    wf.setnchannels(nch_out)
                    wf.setsampwidth(sw)
                    wf.setframerate(fr)
                    wf.writeframes(processed)
                output_bytes = buffer.getvalue()
                mime_type = "audio/wav"
            elif output_format.lower() == "mp3":
                # For MP3, we'd need additional libraries like pydub
                # For now, return WAV and note the limitation
                with wave.open(buffer, 'wb') as wf:
                    wf.setnchannels(nch_out)
                    wf.setsampwidth(sw)
                    wf.setframerate(fr)
                    wf.writeframes(processed)
                output_bytes = buffer.getvalue()
                mime_type = "audio/wav"  # Fallback to WAV
            elif output_format.lower() == "flac":
                # For FLAC, we'd need additional libraries
                # For now, return WAV and note the limitation
                with wave.open(buffer, 'wb') as wf:
                    wf.setnchannels(nch_out)
                    wf.setsampwidth(sw)
                    wf.setframerate(fr)
                    wf.writeframes(processed)
                output_bytes = buffer.getvalue()
                mime_type = "audio/wav"  # Fallback to WAV
            else:
                # Default to WAV
                with wave.open(buffer, 'wb') as wf:
                    wf.setnchannels(nch_out)
                    wf.setsampwidth(sw)
                    wf.setframerate(fr)
                    wf.writeframes(processed)
                output_bytes = buffer.getvalue()
                mime_type = "audio/wav"

        b64 = base64.b64encode(output_bytes).decode('utf-8')
        data_url = f"data:{mime_type};base64,{b64}"
        return {
            "audio_base64": data_url, 
            "format": output_format, 
            "sample_rate": fr,
            "effects_applied": {
                "normalize": normalize,
                "reverse": reverse,
                "speed": speed,
                "pitch": pitch,
                "reverb": reverb,
                "echo": echo,
                "volume": volume,
                "fade_in": fade_in,
                "fade_out": fade_out,
                "eq_low": eq_low,
                "eq_mid": eq_mid,
                "eq_high": eq_high,
                "compression_threshold": compression_threshold,
                "compression_ratio": compression_ratio,
                "compression_attack": compression_attack,
                "compression_release": compression_release
            }
        }
    except Exception as e:
        logger.error(f"Audio processing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 