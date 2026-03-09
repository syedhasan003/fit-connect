"""
voice.py — Phase 5 Voice Layer (OpenAI)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STT: POST /ai/voice/transcribe  → OpenAI Whisper   (multilingual — Tamil / Hindi / English)
TTS: POST /ai/voice/speak       → OpenAI TTS-1     (English responses only)
CFG: GET  /ai/voice/config      → Provider info + defaults

Why OpenAI?
  • Whisper-1  → 99-language transcription, $0.006/min, auto-detects language
  • TTS-1      → Natural English voices (alloy / echo / nova / shimmer / etc.)
                 $15/1M chars — ~$0.0075 per typical voice exchange
  • Shares the same OPENAI_API_KEY already used for Central — zero new credentials

Swapping models:
  Update STT_MODEL / TTS_MODEL constants below.  No other code changes needed.
  OpenAI model strings: https://platform.openai.com/docs/models
"""

import logging
import os
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from fastapi.responses import Response
from openai import AsyncOpenAI
from pydantic import BaseModel

from app.deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai/voice", tags=["Voice"])


# ─────────────────────────────────────────────────────────────────────────────
# ★ MODEL CONSTANTS — update here when OpenAI retires a model
# ─────────────────────────────────────────────────────────────────────────────

# Speech-to-Text: https://platform.openai.com/docs/models/whisper
STT_MODEL = "whisper-1"

# Text-to-Speech: https://platform.openai.com/docs/models/tts
# tts-1 = low latency (good for real-time)
# tts-1-hd = higher quality (slightly slower, use for playback after response)
TTS_MODEL = "tts-1"

# Default English voice — options: alloy | echo | fable | onyx | nova | shimmer
# nova = warm/friendly female, great for coaching  |  onyx = deep male
TTS_DEFAULT_VOICE = os.getenv("TTS_VOICE", "nova")

# Audio format returned by /speak
TTS_AUDIO_FORMAT = "mp3"   # mp3 | opus | aac | flac | wav | pcm

# Max audio upload size (Whisper limit: 25 MB)
MAX_AUDIO_BYTES = 25 * 1024 * 1024

# Supported languages for Whisper transcription (ISO-639-1 codes).
# Whisper detects language automatically — this list is informational for /config.
# Full list: https://platform.openai.com/docs/guides/speech-to-text/supported-languages
STT_LANGUAGES = [
    {"code": "en", "label": "English"},
    {"code": "ta", "label": "Tamil"},
    {"code": "hi", "label": "Hindi"},
    {"code": "ar", "label": "Arabic"},
    {"code": "zh", "label": "Chinese (Mandarin)"},
    {"code": "fr", "label": "French"},
    {"code": "de", "label": "German"},
    {"code": "es", "label": "Spanish"},
    {"code": "it", "label": "Italian"},
    {"code": "ja", "label": "Japanese"},
    {"code": "ko", "label": "Korean"},
    {"code": "pt", "label": "Portuguese"},
    {"code": "ru", "label": "Russian"},
    {"code": "nl", "label": "Dutch"},
    {"code": "tr", "label": "Turkish"},
    {"code": "ur", "label": "Urdu"},
    {"code": "mr", "label": "Marathi"},
    {"code": "te", "label": "Telugu"},
    {"code": "bn", "label": "Bengali"},
    {"code": "gu", "label": "Gujarati"},
    {"code": "pa", "label": "Punjabi"},
    {"code": "ml", "label": "Malayalam"},
    {"code": "kn", "label": "Kannada"},
]

# Available TTS voices for /config (English only — Central always responds in English)
TTS_VOICES = [
    {"id": "nova",    "label": "Nova",    "description": "Warm friendly female — great for coaching"},
    {"id": "alloy",   "label": "Alloy",   "description": "Neutral, versatile"},
    {"id": "echo",    "label": "Echo",    "description": "Clear male"},
    {"id": "fable",   "label": "Fable",   "description": "Expressive British male"},
    {"id": "onyx",    "label": "Onyx",    "description": "Deep authoritative male"},
    {"id": "shimmer", "label": "Shimmer", "description": "Soft expressive female"},
]


# ─────────────────────────────────────────────────────────────────────────────
# Lazy async client
# ─────────────────────────────────────────────────────────────────────────────

_openai_client: Optional[AsyncOpenAI] = None


def _get_client() -> AsyncOpenAI:
    global _openai_client
    if _openai_client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY is not set on the server.")
        _openai_client = AsyncOpenAI(api_key=api_key)
        logger.info(f"[Voice] OpenAI client ready — STT={STT_MODEL} TTS={TTS_MODEL}")
    return _openai_client


# ─────────────────────────────────────────────────────────────────────────────
# POST /ai/voice/transcribe — Whisper STT
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(..., description="Audio blob — webm/opus, mp4, wav, mp3, m4a"),
    language: Optional[str] = Form(
        None,
        description=(
            "ISO-639-1 language hint, e.g. 'ta' for Tamil, 'hi' for Hindi. "
            "Omit to let Whisper auto-detect."
        ),
    ),
    current_user=Depends(get_current_user),
):
    """
    Transcribe audio via OpenAI Whisper.

    • Whisper supports 99 languages including Tamil (ta) and Hindi (hi).
    • When no language hint is passed Whisper auto-detects — useful for
      code-switched speech (Tamil + English in the same sentence).
    • The browser's MediaRecorder typically emits webm/opus — Whisper handles
      this natively.

    Returns: { "text": "...", "language": "<detected ISO-639-1 code>" }
    """
    audio_bytes = await audio.read()

    if len(audio_bytes) < 100:
        raise HTTPException(status_code=400, detail="Audio file too small or empty.")
    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio too large (max 25 MB).")

    # Preserve the original filename/mime so Whisper can detect format correctly.
    # Fall back to webm if the upload has no filename.
    filename = audio.filename or "recording.webm"
    content_type = audio.content_type or "audio/webm"

    try:
        client = _get_client()

        # Build the file tuple OpenAI's SDK expects: (filename, bytes, content_type)
        audio_file = (filename, audio_bytes, content_type)

        transcription = await client.audio.transcriptions.create(
            model=STT_MODEL,
            file=audio_file,
            language=language,          # None → auto-detect
            response_format="verbose_json",  # gives us detected language
        )

        text          = (transcription.text or "").strip()
        detected_lang = getattr(transcription, "language", language or "auto")

        logger.info(
            f"[STT] user={current_user.id} model={STT_MODEL} "
            f"size={len(audio_bytes)}B lang={detected_lang} → '{text[:60]}…'"
        )

        return {"text": text, "language": detected_lang}

    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[STT] error: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# POST /ai/voice/speak — TTS-1
# ─────────────────────────────────────────────────────────────────────────────

class SpeakRequest(BaseModel):
    text:  str
    voice: Optional[str]  = None   # override TTS_DEFAULT_VOICE, e.g. "onyx"
    speed: Optional[float] = 1.0   # 0.25 – 4.0


@router.post("/speak")
async def speak_text(
    body: SpeakRequest,
    current_user=Depends(get_current_user),
):
    """
    Synthesise English speech via OpenAI TTS.

    Central always responds in English so TTS is English-only.
    Returns MP3 audio bytes — the frontend creates an objectURL and plays it
    via a standard <audio> element with no client-side changes required.

    Text is capped at 4096 characters (OpenAI limit).
    """
    text = body.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")

    # OpenAI TTS accepts up to 4096 characters
    if len(text) > 4096:
        text = text[:4096]

    voice = body.voice or TTS_DEFAULT_VOICE
    speed = max(0.25, min(4.0, body.speed or 1.0))

    logger.info(
        f"[TTS] user={current_user.id} model={TTS_MODEL} "
        f"voice={voice} speed={speed} chars={len(text)}"
    )

    try:
        client = _get_client()

        response = await client.audio.speech.create(
            model=TTS_MODEL,
            voice=voice,
            input=text,
            speed=speed,
            response_format=TTS_AUDIO_FORMAT,
        )

        audio_bytes = response.content

        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Cache-Control": "no-cache",
                "X-Content-Type-Options": "nosniff",
            },
        )

    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"[TTS] error: {e}")
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# GET /ai/voice/config — provider info for the frontend
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/config")
async def voice_config(current_user=Depends(get_current_user)):
    """
    Return current provider, model names, voice options, and supported languages.
    The frontend can surface this in a Settings / voice preferences panel.
    """
    return {
        "provider":           "openai",
        "stt_model":          STT_MODEL,
        "tts_model":          TTS_MODEL,
        "default_voice":      TTS_DEFAULT_VOICE,
        "tts_audio_format":   TTS_AUDIO_FORMAT,
        "max_audio_bytes":    MAX_AUDIO_BYTES,
        "stt_languages":      STT_LANGUAGES,
        "tts_voices":         TTS_VOICES,
        "notes": {
            "stt": "Whisper auto-detects language when no hint is passed — ideal for code-switched speech (Tamil + English).",
            "tts": "Central always responds in English; TTS is English-only.",
            "swap": "To change models, update STT_MODEL / TTS_MODEL / TTS_DEFAULT_VOICE constants in voice.py.",
        },
    }
