import os
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from utils.text_extractor import extract_text_from_pdf
from utils.session_manager import get_session_path


# ----------------------------
# LOAD TEXT FROM SESSION
# ----------------------------
def load_session_text(session_id):
    session_path = get_session_path(session_id)

    all_text = []

    print("Loading session PDFs...")

    if not os.path.exists(session_path):
        print("⚠️ Session path not found")
        return []

    files = os.listdir(session_path)
    print("Files found:", files)

    for file in files:
        if file.endswith(".pdf"):
            file_path = os.path.join(session_path, file)

            print("Processing:", file)

            text = extract_text_from_pdf(file_path)

            if text.strip():
                all_text.append(text)
            else:
                print(f"⚠️ Empty text in {file}")

    print("Total documents loaded:", len(all_text))

    return all_text


# ----------------------------
# SPLIT TEXT
# ----------------------------
def split_texts(texts):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100
    )

    chunks = []
    for text in texts:
        chunks.extend(splitter.split_text(text))

    print("Total chunks created:", len(chunks))
    return chunks


# ----------------------------
# BUILD VECTOR STORE
# ----------------------------
def build_vector_store(session_id):
    texts = load_session_text(session_id)

    if len(texts) == 0:
        raise Exception("❌ No text found to build vector store")

    chunks = split_texts(texts)

    print("Loading embeddings model...")
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    print("Creating FAISS index...")
    vectorstore = FAISS.from_texts(chunks, embeddings)

    save_path = os.path.join(get_session_path(session_id), "faiss_index")
    vectorstore.save_local(save_path)

    print("✅ Vector store saved")

    return len(chunks)


# ----------------------------
# LOAD VECTOR STORE
# ----------------------------
def load_vector_store(session_id):
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    path = os.path.join(get_session_path(session_id), "faiss_index")

    if not os.path.exists(path):
        raise Exception("❌ FAISS index not found. Build it first.")

    return FAISS.load_local(path, embeddings, allow_dangerous_deserialization=True)


# ----------------------------
# RETRIEVE CONTEXT
# ----------------------------
def retrieve_context(query, session_id, k=3):
    print("\nSearching for:", query)

    vectorstore = load_vector_store(session_id)
    docs = vectorstore.similarity_search(query, k=k)

    results = [doc.page_content for doc in docs]

    print("Retrieved", len(results), "chunks")

    return results