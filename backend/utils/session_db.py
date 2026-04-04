from utils.supabase_client import supabase
import datetime

def create_session_db(session_id, user_id, mode="video"):
    """Creates the initial entry in the Supabase interview_sessions table."""
    try:
        data = {
            "session_id": session_id,
            "user_id": user_id,
            "status": "in_progress",
            "chat_messages": [],
            "overall_score": 0,
            "mode": mode
        }
        supabase.table("interview_sessions").insert(data).execute()
    except Exception as e:
        print(f"❌ Supabase Create Error: {e}")
        raise e

def save_interaction_db(session_id, question, answer, analysis, sentiment, environment):
    """Updates the session with new chat messages and latest scores."""
    try:
        response = supabase.table("interview_sessions").select("chat_messages").eq("session_id", session_id).execute()
        current_messages = response.data[0].get("chat_messages", []) if response.data else []

        ts = datetime.datetime.now().isoformat()
        current_messages.extend([
            {"id": f"q_{ts}", "role": "ai", "content": question, "timestamp": ts},
            {"id": f"a_{ts}", "role": "user", "content": answer, "timestamp": ts}
        ])

        raw_score = analysis.get("overall", 0)
        try:
            safe_score = int(round(float(raw_score)))
        except:
            safe_score = 0

        supabase.table("interview_sessions").update({
            "chat_messages": current_messages,
            "overall_score": safe_score
        }).eq("session_id", session_id).execute()
    except Exception as e:
        print(f"❌ Supabase Update Error: {e}")

def save_final_report(session_id, report):
    """Closes the session and saves the holistic LLM report, overriding initial scores."""
    try:
        # ⚡ Mapping Groq JSON to Supabase Columns
        # We explicitly save overall_score and scores (clarity/tech) from the LLM
        update_payload = {
            "status": "completed",
            "overall_score": report.get("overall_score", 0),
            "scores": report.get("scores", {}), 
            "strengths": report.get("strengths", []),
            "improvements": report.get("weaknesses", []), 
            "feedback": report.get("communication", ""),
            "topic_feedback": report.get("topic_feedback", {}),
            "final_recommendation": report.get("final_recommendation", "Consider")
        }
        
        supabase.table("interview_sessions").update(update_payload).eq("session_id", session_id).execute()
        print(f"✅ Supabase: Final Holistic report saved for {session_id}")
    except Exception as e:
        print(f"❌ Supabase Finalize Error: {e}")

def update_session_db(session_id, data):
    try:
        supabase.table("interview_sessions").update(data).eq("session_id", session_id).execute()
    except Exception as e:
        print(f"❌ Supabase Direct Update Error: {e}")