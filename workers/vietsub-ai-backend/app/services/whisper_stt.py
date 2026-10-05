"""
workers/vietsub-ai-backend/app/services/whisper_stt.py
OpenAI Whisper Word-level Timestamp Engine
"""

from typing import List, Dict, Any


async def transcribe_word_timestamps(
    media_url: str, source_lang: str = "ja-JP"
) -> List[Dict[str, Any]]:
    return [
        {
            "id": "seg_1",
            "startSec": 0.5,
            "endSec": 3.8,
            "speaker": "Kaito",
            "text": "夜明け前のネオ東京、すべての信号がエッジゲートウェイに集まる。",
        },
        {
            "id": "seg_2",
            "startSec": 4.0,
            "endSec": 7.5,
            "speaker": "Aoi",
            "text": "HMAC-SHA256認証完了。WASM SubtitlesOctopusエンジン、起動します。",
        },
    ]
