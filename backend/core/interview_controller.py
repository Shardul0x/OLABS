from core.question_generator import generate_question
from core.answer_analyzer import analyze_answer
from core.sentiment_analyzer import analyze_sentiment
from utils.session_history import save_interaction, load_history
from core.llm_report import generate_llm_report
from utils.session_db import save_final_report

class InterviewController:
    def __init__(self, session_id):
        self.session_id = session_id
        self.step = 0
        self.max_steps = 6
        self.current_question = None

        self.stages = [
            "resume",
            "resume",
            "cs",
            "cs",
            "dsa",
            "dsa"
        ]

    # ----------------------------
    # NEXT QUESTION
    # ----------------------------
    def next_question(self, previous_answer=None):
        if self.step >= self.max_steps:
            history = load_history(self.session_id)

            # limit logs (cost control)
            history = history[-6:]

            report = generate_llm_report(history)

            save_final_report(self.session_id, report)

            return "Interview complete.", report

        question_type = self.stages[self.step]

        question = generate_question(
            session_id=self.session_id,
            question_type=question_type,
            difficulty=self.get_difficulty(),
            previous_answer=previous_answer
        )

        self.current_question = question
        self.step += 1

        return question

    # ----------------------------
    # PROCESS ANSWER
    # ----------------------------
    def process_answer(self, answer, input_data=None):
        if self.current_question is None:
            return "No active question."

        if input_data is None:
            input_data = {}

        faces = input_data.get("faces_detected", 1)
        background_voice = input_data.get("background_voice", False)
        voice_level = input_data.get("voice_level", 0)

        # ANALYSIS
        analysis = analyze_answer(answer)
        sentiment = analyze_sentiment(answer)

        history = load_history(self.session_id)

        # COUNT PREVIOUS FLAGS
        face_count = sum(
            1 for h in history if h.get("environment", {}).get("faces_detected", 0) > 1
        )

        voice_count = sum(
            1 for h in history if h.get("environment", {}).get("background_voice", False)
        )

        warnings = []
        final_flags = []

        # ----------------------------
        # FACE DETECTION (STABLE)
        # ----------------------------
        recent_faces = [
            h.get("environment", {}).get("faces_detected", 1)
            for h in history[-3:]
        ]

        stable_faces = max([faces] + recent_faces)

        if stable_faces > 1 and recent_faces.count(1) < 2:
            if face_count < 2:
                warnings.append("⚠️ Multiple people detected")
            else:
                final_flags.append("🚨 Repeated multiple-person detection")
                analysis["confidence"] = max(0, analysis["confidence"] - 2)

        # ----------------------------
        # VOICE DETECTION
        # ----------------------------
        if background_voice and voice_level > 0.02:
            if voice_count < 2:
                warnings.append("⚠️ Background voice detected")
            else:
                final_flags.append("🚨 Repeated background voice")
                analysis["confidence"] = max(0, analysis["confidence"] - 1)

        # ----------------------------
        # SENTIMENT
        # ----------------------------
        if sentiment["tone"] == "confident":
            analysis["confidence"] = min(10, analysis["confidence"] + 1)
        elif sentiment["tone"] == "nervous":
            analysis["confidence"] = max(0, analysis["confidence"] - 1)

        # FINAL SCORE
        analysis["overall"] = round(
            (analysis["clarity"] + analysis["confidence"] + analysis["technical"]) / 3,
            2
        )

        environment = {
            "faces_detected": faces,
            "background_voice": background_voice,
            "voice_level": voice_level,
            "warnings": warnings,
            "final_flags": final_flags
        }

        # SAVE
        save_interaction(
            self.session_id,
            self.current_question,
            answer,
            analysis,
            sentiment,
            environment
        )

        print("\n--- ENVIRONMENT ---")
        print(environment)

        next_q = self.next_question(previous_answer=answer)

        return {
            "next_question": next_q,
            "analysis": analysis,
            "sentiment": sentiment,
            "environment": environment
        }

    # ----------------------------
    # DIFFICULTY
    # ----------------------------
    def get_difficulty(self):
        if self.step < 2:
            return "easy"
        elif self.step < 4:
            return "medium"
        else:
            return "hard"