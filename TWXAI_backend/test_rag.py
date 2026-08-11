import os
import json
import logging
from dotenv import load_dotenv
from supabase import create_client, Client
from langchain_huggingface import HuggingFaceEmbeddings

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)

load_dotenv()
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    logger.error("Missing Supabase credentials.")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

try:
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
except Exception as e:
    logger.error(f"Failed to load embeddings: {e}")
    exit(1)

def test_query(test_name, query):
    print(f"\n{'='*50}\nTEST: {test_name}\nQUERY: '{query}'\n{'-'*50}")
    
    try:
        query_vector = embeddings.embed_query(query)
        res = supabase.rpc(
            'match_knowledge_base', 
            {'query_embedding': query_vector, 'match_threshold': 0.1, 'match_count': 3}
        ).execute()
        
        if res.data:
            for idx, item in enumerate(res.data):
                meta = item.get('metadata', {})
                name = meta.get('scheme_name') or meta.get('rule_name') or 'Unknown'
                sim = item.get('similarity', 0)
                print(f"[{idx+1}] MATCH: {name} (Similarity: {sim:.3f}, Type: {item.get('type')})")
        else:
            print("❌ No matches found in PGVector.")
            
    except Exception as e:
        print(f"❌ Error during search: {e}")

if __name__ == "__main__":
    queries = [
        ("Exact keyword query", "What is MUDRA?"),
        ("Semantic query (women entrepreneur)", "I am a woman entrepreneur looking for financial support to start a business."),
        ("Agriculture semantic query", "I need financing for farming activities."),
        ("Regulatory query", "What are the rules related to loan eligibility?"),
        ("No-result query", "How do I bake a chocolate cake?")
    ]
    
    for name, q in queries:
        test_query(name, q)
