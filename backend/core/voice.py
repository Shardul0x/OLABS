import speech_recognition as sr


def get_voice_input():
    recognizer = sr.Recognizer()

    with sr.Microphone() as source:
        print("🎤 Speak now...")

        recognizer.adjust_for_ambient_noise(source)
        audio = recognizer.listen(source)

    try:
        print("🔍 Recognizing...")

        text = recognizer.recognize_google(audio)

        print("📝 You said:", text)

        return text

    except sr.UnknownValueError:
        print("❌ Could not understand audio")
        return ""

    except sr.RequestError as e:
        print("❌ API error:", e)
        return ""