import os
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from utils.text_extractor import extract_text_from_pdf

GLOBAL_PATH = "data/global_index"
BOOKS_PATH = "data/core_books"


# ----------------------------
# EMBEDDINGS (CENTRALIZED)
# ----------------------------
def get_embeddings():
    return HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )


# ----------------------------
# CLEAN TEXT (REMOVE GARBAGE)
# ----------------------------
def clean_text(text):
    cleaned_lines = []

    for line in text.split("\n"):
        line = line.strip()

        # ❌ REMOVE USELESS GFG FOOTER / NOISE
        if (
            "geeksforgeeks" in line.lower()
            or "please write" in line.lower()
            or "contribute@" in line.lower()
            or "quiz on" in line.lower()
            or "references" in line.lower()
            or "http" in line.lower()
            or "copyright" in line.lower()
            or len(line) < 30   # remove very small useless lines
        ):
            continue

        cleaned_lines.append(line)

    return "\n".join(cleaned_lines)


# ----------------------------
# BUILD GLOBAL INDEX (ONLY ONCE)
# ----------------------------
def build_global_index():
    print("📚 Building global knowledge base...")

    texts = []

    if not os.path.exists(BOOKS_PATH):
        print("❌ core_books folder not found!")
        return

    for file in os.listdir(BOOKS_PATH):
        file_path = os.path.join(BOOKS_PATH, file)

        if not file.endswith(".pdf"):
            continue

        print(f"Processing: {file}")

        raw_text = extract_text_from_pdf(file_path)
        text = clean_text(raw_text)

        if not text.strip():
            print(f"⚠️ Skipping empty file: {file}")
            continue

        texts.append(f"[BOOK: {file}]\n{text}")

    if not texts:
        print("❌ No valid text found in PDFs")
        return

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100
    )

    chunks = []
    for text in texts:
        chunks.extend(splitter.split_text(text))

    print(f"🔹 Total clean chunks created: {len(chunks)}")

    embeddings = get_embeddings()

    vectorstore = FAISS.from_texts(chunks, embeddings)
    vectorstore.save_local(GLOBAL_PATH)

    print("✅ Global knowledge base ready")


# ----------------------------
# ENSURE INDEX EXISTS
# ----------------------------
def ensure_global_index():
    if os.path.exists(GLOBAL_PATH):
        print("✅ Global index already exists. Skipping build.")
    else:
        build_global_index()


# ----------------------------
# LOAD GLOBAL INDEX
# ----------------------------
def load_global_index():
    ensure_global_index()

    embeddings = get_embeddings()

    return FAISS.load_local(
        GLOBAL_PATH,
        embeddings,
        allow_dangerous_deserialization=True
    )