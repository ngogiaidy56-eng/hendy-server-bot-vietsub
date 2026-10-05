"""
workers/vietsub-ai-backend/app/main.py
Tier 5 FastAPI GPU Backend: Whisper STT -> GPT-4o Translation -> FFmpeg Burn-in
"""

from fastapi import FastAPI, Header
from pydantic import BaseModel
from typing import Optional
from app.services.whisper_stt import transcribe_word_timestamps
from app.services.gpt_translate import translate_cues_to_vietsub
from app.services.ffmpeg_burnin import render_hardsub_to_r2

app = FastAPI(title="Hendy Vietsub AI Backend (Tier 5)")


class VietsubPipelineRequest(BaseModel):
    video_url: str
    source_lang: str = "ja-JP"
    style_preset: str = "CyberNeon"
    burn_hardsub: bool = False


@app.post("/api/v1/vietsub/pipeline")
async def run_vietsub_pipeline(
    req: VietsubPipelineRequest,
    authorization: Optional[str] = Header(default=None),
):
    raw_segments = await transcribe_word_timestamps(req.video_url, req.source_lang)
    translated_cues, ass_script = await translate_cues_to_vietsub(
        raw_segments, req.source_lang, req.style_preset
    )
    r2_hardsub_key = None
    if req.burn_hardsub:
        r2_hardsub_key = await render_hardsub_to_r2(req.video_url, ass_script)

    return {
        "ok": True,
        "cues": translated_cues,
        "ass_script": ass_script,
        "r2_hardsub_key": r2_hardsub_key,
    }
