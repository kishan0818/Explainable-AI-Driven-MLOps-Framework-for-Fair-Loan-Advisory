import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(url, key)

res = supabase.table("loan_applications").select("*").execute()
print(f"Total Loan Applications: {len(res.data)}")
if len(res.data) > 0:
    print(f"Latest App ID: {res.data[-1].get('id')}, User ID: {res.data[-1].get('user_id')}")

# Check analysis results
res_analysis = supabase.table("analysis_results").select("*").execute()
print(f"Total Analysis Results: {len(res_analysis.data)}")
