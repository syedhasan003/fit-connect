"""
voice.py — Phase 5 Voice Layer (Google Cloud)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STT: POST /ai/voice/transcribe  → Google Cloud Speech-to-Text v2  (Chirp 2)
TTS: POST /ai/voice/speak       → Google Cloud Text-to-Speech       (Neural2)
CFG: GET  /ai/voice/config      → Available voices + defaults

Why Google Cloud?
  • Chirp 2  → single model, 20+ languages, auto-detect, $0.016/min
  • Neural2  → near-human quality voices, 15+ languages, $16/1M chars
  • Both support Hindi, Arabic, French, Spanish, German out of the box

Auth (checked in priority order):
  1. GOOGLE_CLOUD_CREDENTIALS_JSON  — service-account JSON as env string (containers/Render)
  2. GOOGLE_APPLICATION_CREDENTIALS — path to service-account JSON file  (standard GCP)
  3. Application Default Credentials                                      (GCP infra / gcloud auth)
"""

import asyncio
import json
import logging
import os
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from app.deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai/voice", tags=["Voice"])


# ─────────────────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────────────────

# Region where Chirp 2 is available: us-central1 | europe-west4 | asia-southeast1
GCP_REGION  = os.getenv("GOOGLE_CLOUD_REGION", "us-central1")
GCP_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT") or os.getenv("GCLOUD_PROJECT", "")

# Default TTS language / voice (override via env for non-English markets)
TTS_LANGUAGE = os.getenv("TTS_LANGUAGE", "en-US")

# Neural2 voice map: language_code → canonical voice name.
# Falls back to WaveNet for languages not yet in Neural2.
NEURAL2_VOICES: dict[str, str] = {
    "en-US": "en-US-Neural2-C",   # warm female — ideal for coaching
    "en-GB": "en-GB-Neural2-C",
    "en-AU": "en-AU-Neural2-C",
    "en-IN": "en-IN-Neural2-A",
    "hi-IN": "hi-IN-Neural2-A",
    "fr-FR": "fr-FR-Neural2-C",
    "fr-CA": "fr-CA-Neural2-A",
    "de-DE": "de-DE-Neural2-C",
    "es-ES": "es-ES-Neural2-C",
    "es-US": "es-US-Neural2-A",
    "it-IT": "it-IT-Neural2-A",
    "ja-JP": "ja-JP-Neural2-B",
    "ko-KR": "ko-KR-Neural2-A",
    "pt-BR": "pt-BR-Neural2-A",
    # Languages where Neural2 isn't available yet → WaveNet (same $4/M chars as Standard but better)
    "pt-PT": "pt-PT-Wavenet-A",
    "ar-XA": "ar-XA-Wavenet-A",
    "cmn-CN": "cmn-CN-Wavenet-A",
    "nl-NL": "nl-NL-Wavenet-A",
    "pl-PL": "pl-PL-Wavenet-A",
    "ru-RU": "ru-RU-Wavenet-A",
    "sv-SE": "sv-SE-Wavenet-A",
    "tr-TR": "tr-TR-Wavenet-A",
    "ur-IN": "ur-IN-Wavenet-A",
}

DEFAULT_VOICE = NEURAL2_VOICES.get(TTS_LANGUAGE, "en-US-Neural2-C")

# Languages Chirp 2 supports for auto-detection in streaming/sync mode.
# IMPORTANT: These must be BCP-47 codes that Chirp 2 actually supports.
# ar-XA  is a TTS voice code only — Chirp 2 needs ar-EG for Arabic.
# cmn-CN is legacy pinyin notation — Chirp 2 needs zh-Hans-CN.
STT_LANGUAGES = [
    # English variants
    "en-US", "en-GB", "en-IN", "en-AU",
    # Hindi + major Indian languages (India-first market)
    "hi-IN", "mr-IN", "ta-IN", "te-IN", "bn-BD",
    "gu-IN", "pa-IN", "kn-IN", "ml-IN", "ur-IN",
    # Arabic (Egyptian — Chirp 2 supported code, NOT ar-XA)
    "ar-EG",
    # European
    "fr-FR", "fr-CA",
    "es-ES", "es-US",
    "de-DE",
    "it-IT",
    "pt-BR",
    "nl-NL",
    "pl-PL",
    "ru-RU",
    "tr-TR",
    # East Asian
    "ja-JP",
    "ko-KR",
    "zh-Hans-CN",   # Mandarin (Simplified) — was cmn-CN
]

# File-size cap: Google STT v2 inline audio limit is 10 MB
MAX_AUDIO_BYTES = 10 * 1024 * 1024


# ─────────────────────────────────────────────────────────────────────────────
# Lazy clients + credentials
# ─────────────────────────────────────────────────────────────────────────────

_credentials = None
_stt_client  = None
_tts_client  = None


def _get_credentials():
    """Return google-auth Credentials or None (falls back to ADC)."""
    global _credentials
    if _credentials is not None:
        return _credentials

    json_str = os.getenv("GOOGLE_CLOUD_CREDENTIALS_JSON")
    if json_str:
        from google.oauth2 import service_account
        info = json.loads(json_str)
        _credentials = service_account.Credentials.from_service_account_info(
            info,
            scopes=["https://www.googleapis.com/auth/cloud-platform"],
        )
        logger.info("[Voice] Using service-account credentials from env JSON")
        return _credentials

    # GOOGLE_APPLICATION_CREDENTIALS file path or ADC will be picked up automatically
    return None  # let the SDK sort it out


def _get_stt():
    """Lazy async STT client pointed at the Chirp 2 regional endpoint."""
    global _stt_client
    if _stt_client is None:
        from google.api_core.client_options import ClientOptions
        from google.cloud.speech_v2 import SpeechAsyncClient

        endpoint = f"{GCP_REGION}-speech.googleapis.com"
        opts     = ClientOptions(api_endpoint=endpoint)
        creds    = _get_credentials()

        if creds:
            _stt_client = SpeechAsyncClient(credentials=creds, client_options=opts)
        else:
            _stt_client = SpeechAsyncClient(client_options=opts)

        logger.info(f"[STT] Client ready → {endpoint}")
    return _stt_client


def _get_tts():
    """Lazy sync TTS client (called via run_in_executor to avoid blocking the loop)."""
    global _tts_client
    if _tts_client is None:
        from google.cloud import texttospeech
        creds = _get_credentials()

        if creds:
            _tts_client = texttospeech.TextToSpeechClient(credentials=creds)
        else:
            _tts_client = texttospeech.TextToSpeechClient()

        logger.info("[TTS] Client ready (Neural2)")
    return _tts_client


# ─────────────────────────────────────────────────────────────────────────────
# POST /ai/voice/transcribe — Chirp 2 STT
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(..., description="Audio blob (webm/opus from MediaRecorder)"),
    language: Optional[str] = Form(None, description="ISO-639-1 hint, e.g. 'hi-IN'. Omit for auto-detect."),
    current_user=Depends(get_current_user),
):
    """
    Transcribe audio using Google Cloud STT v2 (Chirp 2).

    Chirp 2 uses AutoDetectDecodingConfig so it handles webm/opus, WAV, FLAC,
    OGG, MP3 natively — no format conversion needed.

    Passing multiple language_codes enables automatic language identification.
    Returns: { "text": "...", "language": "<detected or passed code>" }
    """
    if not GCP_PROJECT:
        raise HTTPException(
            status_code=503,
            detail="GOOGLE_CLOUD_PROJECT is not configured on the server.",
        )

    audio_bytes = await audio.read()

    if len(audio_bytes) < 100:
        raise HTTPException(status_code=400, detail="Audio file too small or empty.")
    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio too large (max 10 MB).")

    try:
        from google.cloud.speech_v2.types import cloud_speech

        client       = _get_stt()
        lang_codes   = [language] if language else STT_LANGUAGES
        recognizer   = f"projects/{GCP_PROJECT}/locations/{GCP_REGION}/recognizers/_"

        config = cloud_speech.RecognitionConfig(
            auto_decoding_config=cloud_speech.AutoDetectDecodingConfig(),
            language_codes=lang_codes,
            model="chirp_2",
        )
        request = cloud_speech.RecognizeRequest(
            recognizer=recognizer,
            config=config,
            content=audio_bytes,
        )

        response     = await client.recognize(request=request)
        text         = ""
        detected_lang = language or "auto"

        for result in response.results:
            if result.alternatives:
                text += result.alternatives[0].transcript
            if hasattr(result, "language_code") and result.language_code:
                detected_lang = result.language_code

        text = text.strip()
        logger.info(
            f"[STT] user={current_user.id} size={len(audio_bytes)}B "
            f"lang={detected_lang} → '{text[:60]}…'"
        )
        return {"text": text, "language": detected_lang}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[STT] error: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# POST /ai/voice/speak — Neural2 TTS
# ─────────────────────────────────────────────────────────────────────────────

class SpeakRequest(BaseModel):
    text: str
    voice: Optional[str]          = None   # exact voice name, e.g. "hi-IN-Neural2-A"
    speed: Optional[float]        = 1.0    # 0.25–4.0
    language_code: Optional[str]  = None   # e.g. "hi-IN" → picks matching Neural2 voice


@router.post("/speak")
async def speak_text(
    body: SpeakRequest,
    current_user=Depends(get_current_user),
):
    """
    Synthesise speech via Google Cloud TTS (Neural2 / WaveNet voices).

    Returns MP3 audio bytes. The frontend creates an objectURL and plays it
    via a standard <audio> element — no changes needed on the client side.
    """
    text = body.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")

    # Google TTS accepts up to 5000 bytes; stay safe at 4000 chars
    if len(text) > 4000:
        text = text[:4000]

    lang_code  = body.language_code or TTS_LANGUAGE
    voice_name = body.voice or NEURAL2_VOICES.get(lang_code, DEFAULT_VOICE)
    speed      = max(0.25, min(4.0, body.speed or 1.0))

    logger.info(
        f"[TTS] user={current_user.id} voice={voice_name} "
        f"lang={lang_code} chars={len(text)}"
    )

    try:
        from google.cloud import texttospeech

        tts = _get_tts()

        synthesis_input = texttospeech.SynthesisInput(text=text)
        voice_params    = texttospeech.VoiceSelectionParams(
            language_code=lang_code,
            name=voice_name,
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=speed,
        )

        # TTS client is synchronous — offload to thread pool so we don't block the loop
        loop     = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: tts.synthesize_speech(
                input=synthesis_input,
                voice=voice_params,
                audio_config=audio_config,
            ),
        )

        return Response(
            content=response.audio_content,
            media_type="audio/mpeg",
            headers={
                "Cache-Control": "no-cache",
                "X-Content-Type-Options": "nosniff",
            },
        )

    except Exception as e:
        logger.error(f"[TTS] error: {e}")
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# GET /ai/voice/config — voice catalogue for the frontend
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/config")
async def voice_config(current_user=Depends(get_current_user)):
    """Return provider info, available voices, and current defaults."""
    return {
        "provider":        "google_cloud",
        "stt_model":       "chirp_2",
        "tts_model":       "neural2",
        "default_voice":   DEFAULT_VOICE,
        "default_language": TTS_LANGUAGE,
        "stt_languages":   STT_LANGUAGES,
        "voices": [
            {"id": "en-US-Neural2-C", "lang": "en-US", "label": "Aria (US)",      "description": "Warm female — great for coaching"},
            {"id": "en-GB-Neural2-C", "lang": "en-GB", "label": "Sophie (UK)",    "description": "British female"},
            {"id": "en-IN-Neural2-A", "lang": "en-IN", "label": "Priya (IN-EN)",  "description": "Indian English female"},
            {"id": "hi-IN-Neural2-A", "lang": "hi-IN", "label": "Ananya (HI)",    "description": "Hindi female"},
            {"id": "ar-XA-Wavenet-A", "lang": "ar-XA", "label": "Layla (AR)",     "description": "Arabic female"},
            {"id": "fr-FR-Neural2-C", "lang": "fr-FR", "label": "Camille (FR)",   "description": "French female"},
            {"id": "de-DE-Neural2-C", "lang": "de-DE", "label": "Lena (DE)",      "description": "German female"},
            {"id": "es-US-Neural2-A", "lang": "es-US", "label": "Sofia (ES-US)",  "description": "Spanish (US) female"},
            {"id": "pt-BR-Neural2-A", "lang": "pt-BR", "label": "Beatriz (BR)",   "description": "Brazilian Portuguese female"},
            {"id": "ja-JP-Neural2-B", "lang": "ja-JP", "label": "Yuki (JA)",      "description": "Japanese female"},
            {"id": "ko-KR-Neural2-A", "lang": "ko-KR", "label": "Jisoo (KO)",     "description": "Korean female"},
        ],
    }
