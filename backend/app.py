import os
import uvicorn
import traceback
from typing import List, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from core.interview_controller import InterviewController
from utils.session_manager import create_session
from utils.file_handler import save_resume, save_manual_pdf
from core.rag_pipeline import build_vector_store


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    print("🛑 Server shutting down...")


app = FastAPI(title="HireMind AI Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sessions: dict[str, InterviewController] = {}


@app.get("/")
async def health_check():
    return {
        "status": "Neural Engine Online",
        "port": 8000,
        "face_monitor": {
            "running": False,
            "faces_right_now": 1,
        }
    }


@app.post("/start-interview")
@app.post("/api/start")
async def start_interview_api(
    request: Request,
    user_id: str = Form("default_user"),
    mode: str = Form("video"),
    additional_docs: Optional[List[UploadFile]] = File(None)
):
    try:
        form = await request.form()
        resume_file = form.get("file") or form.get("resume")

        if not resume_file:
            raise HTTPException(status_code=400, detail="Resume file is missing.")

        try:
            session_metadata = create_session(user_id, mode)
        except TypeError:
            session_metadata = create_session()

        session_id = session_metadata["session_id"]

        file_bytes = await resume_file.read()
        try:
            save_resume(file_bytes, session_id, user_id, resume_file.filename)
        except TypeError:
            save_resume(file_bytes, session_id)

        if additional_docs:
            for doc in additional_docs:
                doc_bytes = await doc.read()
                save_manual_pdf(doc_bytes, session_id, doc.filename)

        build_vector_store(session_id)

        controller = InterviewController(session_id)
        sessions[session_id] = controller

        # ✅ next_question() now returns a dict
        first_result = controller.next_question()

        return {
            "session_id":     session_id,
            "first_question": first_result["next_question"],
            "status":         "success"
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/stop-monitor")
@app.post("/api/stop")
async def stop_monitor(session_id: str = Form(...)):
    return {"status": "Hardware released"}


@app.post("/submit-answer")
@app.post("/api/answer")
async def submit_answer(
    session_id: str = Form(...),
    answer: str = Form(...),
    faces_detected: int = Form(1),
):
    try:
        if not answer or not answer.strip():
            return {"error": "Answer cannot be empty", "next_question": None}

        if session_id not in sessions:
            sessions[session_id] = InterviewController(session_id)

        controller = sessions[session_id]

        # ✅ result is always a clean dict now
        result = controller.process_answer(
            answer,
            input_data={"faces_detected": faces_detected}
        )

        result["faces_used"] = faces_detected
        return result

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)