import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# These names MUST match the names in your .env file exactly
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Critical Error: Supabase URL or Key is missing from .env")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)