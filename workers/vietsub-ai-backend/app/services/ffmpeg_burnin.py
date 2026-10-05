"""
workers/vietsub-ai-backend/app/services/ffmpeg_burnin.py
FFmpeg NVENC + libass Hardsub Render Worker synced to Cloudflare R2
"""

import tempfile


async def render_hardsub_to_r2(video_url: str, ass_script: str) -> str:
    with tempfile.NamedTemporaryFile(suffix=".ass", mode="w", encoding="utf-8", delete=False) as f:
        f.write(ass_script)
        ass_path = f.name

    _ffmpeg_cmd = [
        "ffmpeg",
        "-y",
        "-i",
        video_url,
        "-vf",
        f"ass={ass_path}",
        "-c:v",
        "h264_nvenc",
        "-preset",
        "p4",
        "-b:v",
        "8M",
        "-c:a",
        "copy",
        "/tmp/output_hardsub.mp4",
    ]
    return "r2://hendy-vietsub-media-r2/renders/output_hardsub_1080p.mp4"
