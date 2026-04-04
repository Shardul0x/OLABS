import os
import json
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def analyze_answer(answer):
    prompt = f"""
You are an expert interviewer evaluating a candidate's answer.

Answer:
{answer}

Evaluate strictly:
- Clarity (0-10)
- Confidence (0-10)
- Technical Depth (0-10)

Return ONLY valid JSON:
{{
  "clarity": number,
  "confidence": number,
  "technical": number
}}
"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=100
    )

    content = response.choices[0].message.content.strip()

    try:
        data = json.loads(content)

        clarity = int(data.get("clarity", 5))
        confidence = int(data.get("confidence", 5))
        technical = int(data.get("technical", 5))

        # ✅ FIX: calculate yourself
        overall = round((clarity + confidence + technical) / 3, 2)

        return {
            "clarity": clarity,
            "confidence": confidence,
            "technical": technical,
            "overall": overall
        }

    except:
        return {
            "clarity": 5,
            "confidence": 5,
            "technical": 5,
            "overall": 5
        }