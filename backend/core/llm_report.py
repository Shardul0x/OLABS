from groq import Groq
import os
from dotenv import load_dotenv
import json

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_llm_report(session_logs):
    summary = ""

    for i, log in enumerate(session_logs):
        summary += f"""
Q{i+1}: {log.get("question")}
Topic: {log.get("topic", "general")}
Answer: {log.get("answer")}
"""

    prompt = f"""
You are a Senior Technical Recruiter at a Top Tier Tech Company. 
Evaluate this interview transcript with extreme precision.

CRITICAL EVALUATION RULES:
1. If the candidate provides actual code logic (like heaps, pointers, OCP principles), evaluate the correctness.
2. If the candidate explains complex concepts (like moving reliability to the application layer for UDP), give high Technical marks.
3. IGNORE per-question scores. Provide a HOLISTIC score for the whole session.
4. DO NOT provide generic feedback like "Good eye contact". Be technical.

{summary}

Return JSON ONLY.
Scale: 1-100 (where 90+ is A+, 80+ is A, 70+ is B, 60+ is C).

Return format:
{{
  "overall_score": 0-100,
  "scores": {{
    "clarity": 0-100,
    "confidence": 0-100,
    "technical": 0-100
  }},
  "strengths": ["Specific technical strength 1", "Specific technical strength 2"],
  "weaknesses": ["Specific technical area to improve 1", "Specific technical area to improve 2"],
  "topic_feedback": {{
    "DSA": "Specific feedback on their heap/array logic...",
    "System Design": "Feedback on UDP/Reliability logic...",
    "ML": "Feedback on Random Forest explanation..."
  }},
  "communication": "Full narrative summary of their technical articulation.",
  "final_recommendation": "Strong Hire / Hire / Consider / Reject"
}}
"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )

    content = response.choices[0].message.content.strip()

    try:
        return json.loads(content)
    except:
        return {
            "overall_score": 50,
            "scores": {"clarity": 50, "confidence": 50, "technical": 50},
            "strengths": ["Completed session"],
            "weaknesses": ["Analysis failed"],
            "topic_feedback": {},
            "communication": "Average",
            "final_recommendation": "Consider"
        }