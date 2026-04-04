import sys
import os

# Ensure the backend directory is in the python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from core.global_rag import build_global_index

if __name__ == "__main__":
    print(f"Starting indexer from: {backend_dir}")
    build_global_index()