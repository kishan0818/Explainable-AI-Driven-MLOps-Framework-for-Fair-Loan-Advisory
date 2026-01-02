import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def verify_connection():
    print("Testing Supabase Connectivity...")
    
    if not SUPABASE_URL:
        print("❌ Error: SUPABASE_URL is missing in .env")
        return
    
    if not SUPABASE_KEY:
        print("❌ Error: SUPABASE_SERVICE_ROLE_KEY is missing in .env")
        return

    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Simple query to check connection (fetch 1 user)
        # Note: We are using service role key, so we can access auth.users or public tables
        # Let's try to query bank_profiles since it's a public table likely to be empty or exist
        response = supabase.table("bank_profiles").select("count", count="exact").execute()
        
        print(f"✅ Connection Successful! URL: {SUPABASE_URL}")
        print(f"✅ Table 'bank_profiles' access confirmed.")
        
    except Exception as e:
        print(f"❌ Connection Failed: {str(e)}")

if __name__ == "__main__":
    verify_connection()
