import os
from utils.supabase_client import supabase

def save_resume(file_bytes, session_id, user_id, filename="resume.pdf"):
    session_path = f"data/sessions/{session_id}"
    os.makedirs(session_path, exist_ok=True)

    # 1. Save Locally for FAISS
    file_path = os.path.join(session_path, filename)
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # 2. Upload to Supabase Storage
    try:
        supabase_path = f"resumes/{user_id}/{session_id}.pdf"
        
        supabase.storage.from_("documents").upload(
            file=file_path,
            path=supabase_path,
            file_options={"content-type": "application/pdf", "upsert": "true"}
        )
        
        # 3. Get Public URL and link it to the session
        public_url = supabase.storage.from_("documents").get_public_url(supabase_path)
        
        # ⚡ FIX: Used .eq("session_id", session_id) instead of "id"
        supabase.table("interview_sessions").update({
            "resume_url": public_url
        }).eq("session_id", session_id).execute()
        
        print(f"✅ Resume uploaded to Supabase: {public_url}")
        
    except Exception as e:
        print(f"⚠️ Cloud sync failed. Please ensure you created a bucket named 'documents' in Supabase: {e}")

    return file_path

def save_manual_pdf(file_bytes, session_id, filename):
    """Handles additional documents (cover letters, portfolios, etc)."""
    session_path = f"data/sessions/{session_id}"
    os.makedirs(session_path, exist_ok=True)
    
    file_path = os.path.join(session_path, filename)
    with open(file_path, "wb") as f:
        f.write(file_bytes)
        
    return file_path