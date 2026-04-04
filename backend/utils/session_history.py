import os
import json
from utils.session_db import save_interaction_db

def get_history_path(session_id):
    return f"data/sessions/{session_id}/history.json"

def load_history(session_id):
    path = get_history_path(session_id)
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return []

def save_interaction(session_id, question, answer, analysis, sentiment, environment):
    path = get_history_path(session_id)
    history = load_history(session_id)

    data = {
        "question": question,
        "answer": answer,
        "analysis": analysis,
        "sentiment": sentiment,
        "environment": environment
    }

    history.append(data)

    with open(path, "w") as f:
        json.dump(history, f, indent=2)

    # Trigger cloud sync
    save_interaction_db(session_id, question, answer, analysis, sentiment, environment)