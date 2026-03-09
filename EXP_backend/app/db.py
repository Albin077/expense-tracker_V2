import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("SUPABASE_DB_URL")

if not DATABASE_URL:
    raise RuntimeError("SUPABASE_DB_URL missing")

def get_db():
    try:
        conn = psycopg2.connect(
            DATABASE_URL,
            sslmode="require",   # required for Supabase external connections
            cursor_factory=RealDictCursor  # return rows as dictionaries
        )
        yield conn
    finally:
        conn.close()