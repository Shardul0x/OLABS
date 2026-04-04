import os
import uuid
import json
from datetime import datetime
from utils.session_db import create_session_db

BASE_DIR = "data/sessions"

def create_session(user_id, mode="video"):
    """Generates a session ID, sets up local folders, and initializes the DB."""
    # Create a unique but readable session ID
    session_id = f"SES-{str(uuid.uuid4())[:8].upper()}"
    session_path = os.path.join(BASE_DIR, session_id)

    # Setup local directory architecture
    os.makedirs(session_path, exist_ok=True)
    os.makedirs(os.path.join(session_path, "docs"), exist_ok=True)
    os.makedirs(os.path.join(session_path, "faiss_index"), exist_ok=True)

    metadata = {
        "session_id": session_id,
        "user_id": user_id,
        "created_at": str(datetime.now()),
        "name": f"Interview {session_id}"
    }

    # Save local metadata file
    with open(os.path.join(session_path, "meta.json"), "w") as f:
        json.dump(metadata, f)

    # ⚡ Initialize the database row with the correct session_id
    create_session_db(session_id, user_id, mode)

    return metadata

def get_session_path(session_id):
    return os.path.join(BASE_DIR, session_id)