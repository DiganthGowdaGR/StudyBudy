"""TTS service - Groq text-to-speech using Canopy Labs Orpheus"""
import time

import httpx

from config import GROQ_API_KEY

# Groq OpenAI-compatible speech endpoint.
TTS_URL = "https://api.groq.com/openai/v1/audio/speech"
TTS_MODEL = "canopylabs/orpheus-v1-english"
TTS_VOICE = "autumn"  # Valid voices: autumn, diana, hannah, austin, daniel, ...
MAX_TTS_ATTEMPTS = 3
RETRY_BACKOFF_SECONDS = (0.6, 1.2)


class TTSUpstreamError(RuntimeError):
    """Raised when upstream TTS provider responds with a non-recoverable error."""

    def __init__(self, status_code: int, detail: str):
        super().__init__(detail)
        self.status_code = int(status_code)
        self.detail = detail


def text_to_speech(text: str) -> bytes:
    """Convert text to speech using Groq Orpheus TTS. Returns WAV audio bytes."""
    input_text = str(text or "").strip()
    if not input_text:
        raise ValueError("Text is required for TTS.")

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": TTS_MODEL,
        "input": input_text,
        "voice": TTS_VOICE,
        "response_format": "wav",
    }

    for attempt in range(MAX_TTS_ATTEMPTS):
        try:
            with httpx.Client() as client:
                response = client.post(
                    TTS_URL,
                    json=payload,
                    headers=headers,
                    timeout=30.0,
                )
                response.raise_for_status()
                return response.content
        except httpx.HTTPStatusError as exc:
            status_code = int(exc.response.status_code)
            response_text = str(exc.response.text or "").strip()

            # Retry only for rate limiting, then bubble exact status back to caller.
            if status_code == 429 and attempt < MAX_TTS_ATTEMPTS - 1:
                wait_seconds = RETRY_BACKOFF_SECONDS[min(attempt, len(RETRY_BACKOFF_SECONDS) - 1)]
                time.sleep(wait_seconds)
                continue

            detail = response_text[:500] if response_text else f"Groq TTS request failed with status {status_code}."
            raise TTSUpstreamError(status_code=status_code, detail=detail) from exc
        except httpx.HTTPError as exc:
            if attempt < MAX_TTS_ATTEMPTS - 1:
                wait_seconds = RETRY_BACKOFF_SECONDS[min(attempt, len(RETRY_BACKOFF_SECONDS) - 1)]
                time.sleep(wait_seconds)
                continue

            raise RuntimeError("Failed to connect to Groq TTS service.") from exc

    raise RuntimeError("Unable to generate speech at the moment.")
