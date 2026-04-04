import os
import random
from dotenv import load_dotenv
from groq import Groq

from core.retriever import retrieve_all

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def generate_question(
    session_id,
    question_type="resume",
    difficulty="medium",
    previous_answer=None
):

    # ----------------------------
    # BASE INTERVIEW STYLE
    # ----------------------------
    base_style = f"""
You are a strict but professional technical interviewer.

Ask ONE clear and concise interview question.

Rules:
- No introduction
- No explanations
- No markdown
- No headings
- No formatting symbols
- Sound like real spoken interview
- Difficulty: {difficulty}
"""

    # ----------------------------
    # RESUME (RAG)
    # ----------------------------
    if question_type == "resume":

        query = "projects experience skills resume"

        context_chunks = retrieve_all(query, session_id)
        context = "\n".join(context_chunks)

        follow_up = ""
        if previous_answer:
            follow_up = f"""
Candidate's previous answer:
{previous_answer}

Ask a follow-up question based on it.
"""

        prompt = f"""
{base_style}

Context:
{context}

{follow_up}

Focus on:
- Projects
- Skills
- Real-world implementation

Return ONLY the question.

STRICT RULES:
- No markdown
- No titles
- No extra text
"""

    # ----------------------------
    # CS (HYBRID)
    # ----------------------------
    elif question_type == "cs":

        topic = random.choice(["os", "cn", "dbms", "oop"])
        print("Selected topic:", topic)

        # ---------- OOP (LLM) ----------
        if topic == "oop":

            follow_up = ""
            if previous_answer:
                follow_up = f"""
Candidate's previous answer:
{previous_answer}

Ask a follow-up question.
"""

            prompt = f"""
{base_style}

Topic: Object-Oriented Programming

Focus on:
- Encapsulation
- Inheritance
- Polymorphism
- Abstraction
- SOLID principles

{follow_up}

Return ONLY the question.

STRICT RULES:
- No markdown
- No extra text
"""

        # ---------- OS / CN / DBMS (RAG) ----------
        else:

            query_map = {
                "os": "operating system scheduling deadlock memory paging",
                "cn": "computer networks osi tcp udp http dns routing",
                "dbms": "dbms normalization indexing transactions sql joins"
            }

            query = query_map[topic]

            context_chunks = retrieve_all(query, session_id)
            context = "\n".join(context_chunks)

            follow_up = ""
            if previous_answer:
                follow_up = f"""
Candidate's previous answer:
{previous_answer}

Ask a follow-up question.
"""

            prompt = f"""
{base_style}

Topic: {topic}

Context:
{context}

{follow_up}

Ask a conceptual or scenario-based question.

Return ONLY the question.

STRICT RULES:
- No markdown
- No extra text
"""

    # ----------------------------
    # DSA (LLM ONLY - CLEAN)
    # ----------------------------
    elif question_type == "dsa":

        prompt = f"""
You are a DSA interviewer.

Ask ONE coding interview question.

Rules:
- Difficulty: {difficulty}
- Keep it short (max 8-10 lines)
- No markdown
- No headings
- No long explanations

Include:
- Problem statement
- Ask time and space complexity

Make it sound like spoken interview question.

Return ONLY the question.
"""

    # ----------------------------
    # FALLBACK
    # ----------------------------
    else:
        prompt = "Ask a general technical interview question."

    # ----------------------------
    # LLM CALL
    # ----------------------------
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=200   # 🔥 optimized (no overflow, no cut)
    )

    return response.choices[0].message.content.strip()