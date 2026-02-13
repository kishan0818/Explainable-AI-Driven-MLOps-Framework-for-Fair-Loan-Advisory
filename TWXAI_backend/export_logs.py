
import os
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client

# Load Env
load_dotenv(".env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def export_logs():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Supabase Config Missing")
        return

    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        print("Fetching MLOps Logs...")
        res = supabase.table("mlops_logs").select("*").order("created_at", desc=True).execute()
        
        if not res.data:
            print("⚠️ No logs found.")
            return
            
        df = pd.DataFrame(res.data)
        output_file = "mlops_log_export.csv"
        df.to_csv(output_file, index=False)
        
        print(f"✅ Logs exported to {output_file}")
        print(f"Total Records: {len(df)}")
        print(df.head())
        
    except Exception as e:
        print(f"❌ Export Failed: {e}")

if __name__ == "__main__":
    export_logs()
