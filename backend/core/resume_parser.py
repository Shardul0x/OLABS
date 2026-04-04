from utils.text_extractor import extract_text_from_pdf


def parse_resume(file_path):
    text = extract_text_from_pdf(file_path)

    if "Error extracting text" in text:
        return {"error": text}

    return {
        "raw_text": text
    }