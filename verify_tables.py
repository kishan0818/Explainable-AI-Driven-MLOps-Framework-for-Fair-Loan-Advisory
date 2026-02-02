import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load env from TWXAI_backend/.env
load_dotenv("TWXAI_backend/.env")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")

if not url or not key:
    print("Error: credentials not found in env")
    exit(1)

supabase: Client = create_client(url, key)

print(f"Connecting to {url}...")

tables_to_check = ["users", "loan_applications", "bank_suitability"]
missing = []

for t in tables_to_check:
    try:
        # Try to select 1 row, if table doesn't exist it usually throws 404 or 400
        res = supabase.table(t).select("*").limit(1).execute()
        print(f"✅ Table '{t}' exists.")
    except Exception as e:
        print(f"❌ Table '{t}' check failed: {e}")
        missing.append(t)

if missing:
    print("\nCRITICAL: The following tables are missing or inaccessible:")
    for m in missing:
        print(f" - {m}")
    print("\nPlease run the setup_database.sql script in your Supabase SQL Editor!")
else:
    print("\nAll tables verified.")
