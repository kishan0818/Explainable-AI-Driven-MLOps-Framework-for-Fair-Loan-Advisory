import os
import asyncio
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv(".env.local")

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

async def inspect_db():
    print(f"URL: {SUPABASE_URL}")
    print(f"KEY: {SUPABASE_KEY[:5]}..." if SUPABASE_KEY else "KEY: None")
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Missing config")
        return

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Fetch latest app
    print("Fetching latest loan application...")
    res = supabase.table("loan_applications").select("*").order("created_at", desc=True).limit(1).execute()
    
    if not res.data:
        print("No applications found.")
        return

    app = res.data[0]
    app_id = app['id']
    print(f"App ID: {app_id}")
    print(f"Status: {app.get('status')}")

    # Fetch Analysis Results
    print(f"\nFetching Analysis Results for {app_id}...")
    an_res = supabase.table("analysis_results").select("*").eq("application_id", app_id).execute()
    
    if an_res.data:
        analysis = an_res.data[0]
        print(f"Analysis Found: {analysis.get('id')}")
        print(f"ML Probability: {analysis.get('ml_probability')}")
        print(f"Risk Band: {analysis.get('risk_band')}")
    else:
        print("!! NO ANALYSIS RESULT FOUND !!")

    # Fetch Bank Suitability
    print(f"\nFetching Banks for {app_id}...")
    bs_res = supabase.table("bank_suitability").select("*").eq("application_id", app_id).execute()
    print(f"Banks count: {len(bs_res.data)}")

if __name__ == "__main__":
    asyncio.run(inspect_db())
