import os
import uuid
import json
import shutil
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import aiofiles

from analyzer.video_processor import process_video

app = FastAPI(title="Golf Swing Analyzer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
SESSIONS_DIR = Path("sessions")
UPLOAD_DIR.mkdir(exist_ok=True)
SESSIONS_DIR.mkdir(exist_ok=True)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


@app.post("/api/analyze")
async def analyze_swing(
    video: UploadFile = File(...),
    view: str = Form(default="dtl"),
):
    if not video.content_type or video.content_type.split("/")[0] != "video":
        # also accept application/octet-stream for .mov
        if video.filename and not any(
            video.filename.lower().endswith(ext) for ext in [".mp4", ".mov", ".avi"]
        ):
            raise HTTPException(400, "Unsupported file type. Use MP4, MOV or AVI.")

    session_id = str(uuid.uuid4())
    ext = Path(video.filename).suffix.lower() if video.filename else ".mp4"
    video_path = UPLOAD_DIR / f"{session_id}{ext}"

    # Save uploaded file
    async with aiofiles.open(video_path, "wb") as f:
        content = await video.read()
        await f.write(content)

    try:
        result = process_video(str(video_path), view=view)
    except Exception as e:
        video_path.unlink(missing_ok=True)
        raise HTTPException(500, f"Analysis failed: {str(e)}")

    # Persist session
    session_data = {
        "id": session_id,
        "date": datetime.utcnow().isoformat(),
        "filename": video.filename,
        "view": view,
        "video_url": f"/uploads/{session_id}{ext}",
        **result,
    }
    # Don't persist base64 keyframes in the index (store separately)
    session_file = SESSIONS_DIR / f"{session_id}.json"
    async with aiofiles.open(session_file, "w") as f:
        await f.write(json.dumps(session_data, indent=2))

    return session_data


@app.get("/api/sessions")
async def list_sessions():
    sessions = []
    for path in sorted(SESSIONS_DIR.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True):
        try:
            with open(path) as f:
                data = json.load(f)
            # Return summary only (no keyframes)
            sessions.append({
                "id": data["id"],
                "date": data["date"],
                "filename": data.get("filename"),
                "view": data.get("view"),
                "scores": data.get("scores"),
                "video_url": data.get("video_url"),
            })
        except Exception:
            continue
    return sessions


@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str):
    path = SESSIONS_DIR / f"{session_id}.json"
    if not path.exists():
        raise HTTPException(404, "Session not found")
    with open(path) as f:
        return json.load(f)


@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str):
    path = SESSIONS_DIR / f"{session_id}.json"
    if not path.exists():
        raise HTTPException(404, "Session not found")
    path.unlink()
    for ext in [".mp4", ".mov", ".avi"]:
        vp = UPLOAD_DIR / f"{session_id}{ext}"
        vp.unlink(missing_ok=True)
    return {"deleted": session_id}
