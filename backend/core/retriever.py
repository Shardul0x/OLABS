from core.rag_pipeline import load_vector_store
from core.global_rag import load_global_index


def retrieve_all(query, session_id, k=2):
    results = []

    # Session data (resume + user pdf)
    try:
        session_store = load_vector_store(session_id)
        session_docs = session_store.similarity_search(query, k=k)
        results.extend([doc.page_content for doc in session_docs])
    except:
        pass

    # Global knowledge (books)
    global_store = load_global_index()
    global_docs = global_store.similarity_search(query, k=k)
    results.extend([doc.page_content for doc in global_docs])

    return results