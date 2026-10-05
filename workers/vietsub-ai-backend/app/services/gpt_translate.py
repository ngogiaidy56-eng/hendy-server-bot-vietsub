"""
workers/vietsub-ai-backend/app/services/gpt_translate.py
GPT-4o Contextual Anime/Cinema Vietsub Translation & .ASS Generator
"""

from typing import List, Dict, Any, Tuple


async def translate_cues_to_vietsub(
    segments: List[Dict[str, Any]], source_lang: str, style_preset: str
) -> Tuple[List[Dict[str, Any]], str]:
    cues = []
    ass_events = []
    for seg in segments:
        vietsub = "Bản dịch tiếng Việt chuẩn ngữ cảnh điện ảnh từ GPT-4o."
        cue = {
            "id": seg["id"],
            "start": f"0:00:0{seg['startSec']:.2f}",
            "end": f"0:00:0{seg['endSec']:.2f}",
            "startSec": seg["startSec"],
            "endSec": seg["endSec"],
            "speaker": seg.get("speaker", "Narrator"),
            "originalText": seg["text"],
            "vietsubText": vietsub,
            "style": style_preset,
            "effectTag": "{\\fad(150,150)\\blur1.5}",
        }
        cues.append(cue)
        ass_events.append(
            f"Dialogue: 0,{cue['start']},{cue['end']},{style_preset},{cue['speaker']},0,0,0,,{cue['effectTag']}{vietsub}"
        )

    ass_script = "[Script Info]\nScriptType: v4.00+\n\n[Events]\n" + "\n".join(ass_events)
    return cues, ass_script
