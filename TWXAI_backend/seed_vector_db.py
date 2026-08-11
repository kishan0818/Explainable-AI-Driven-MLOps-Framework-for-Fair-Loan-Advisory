import os
import json
import logging
from dotenv import load_dotenv
from supabase import create_client, Client
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    logger.error("Missing Supabase credentials in .env file.")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

def check_rpc():
    try:
        # A simple check to see if the table exists (this will throw an error if not)
        supabase.table("knowledge_base").select("id").limit(1).execute()
        return True
    except Exception as e:
        logger.error(f"Failed to access knowledge_base table: {e}")
        logger.error("PLEASE RUN THE SQL MIGRATION IN YOUR SUPABASE DASHBOARD FIRST!")
        return False

def format_scheme(scheme):
    """Convert a scheme dict into a meaningful text chunk."""
    content = f"Scheme Name: {scheme.get('name', 'Unknown')}\n"
    content += f"Category: {scheme.get('category', 'General')}\n"
    content += f"Description: {scheme.get('description', '')}\n"
    
    eligibility = scheme.get("eligibility", {})
    if eligibility:
        content += "Eligibility Rules:\n"
        for k, v in eligibility.items():
            if isinstance(v, dict):
                content += f"- {k}: {json.dumps(v)}\n"
            elif isinstance(v, list):
                content += f"- {k}: {', '.join(map(str, v))}\n"
            else:
                content += f"- {k}: {v}\n"
    return content

def format_rule(rule):
    """Convert a rule dict into a meaningful text chunk."""
    content = f"Rule Description: {rule.get('description', '')}\n"
    content += f"Category: {rule.get('category', 'General')}\n"
    content += f"Target Group: {rule.get('target_group', 'All')}\n"
    content += f"Source: {rule.get('regulatory_source', 'General Policy')}\n"
    
    conditions = rule.get("conditions", [])
    if conditions:
        content += "Conditions:\n"
        if isinstance(conditions, list):
            for cond in conditions:
                content += f"- {json.dumps(cond)}\n"
        elif isinstance(conditions, dict):
            for k, v in conditions.items():
                content += f"- {k}: {v}\n"
    return content

def main():
    if not check_rpc():
        return

    logger.info("Initializing embedding model (all-MiniLM-L6-v2)...")
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    # We use a text splitter for extremely long schemes if any exist,
    # but for most structured JSON, we just want to ensure we don't exceed model context.
    # all-MiniLM-L6-v2 context window is 256 tokens, so roughly 1000 characters.
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=150,
        separators=["\n\n", "\n", ".", " ", ""]
    )

    documents = []
    
    # 1. Load and process Schemes
    schemes_count = 0
    try:
        with open("schemes.json", "r", encoding="utf-8") as f:
            data = json.load(f)
            schemes = data.get("schemes", [])
            for s in schemes:
                full_text = format_scheme(s)
                chunks = text_splitter.split_text(full_text)
                for i, chunk in enumerate(chunks):
                    metadata = {
                        "scheme_id": s.get("id"),
                        "scheme_name": s.get("name"),
                        "category": s.get("category"),
                        "source": "schemes.json",
                        "document_type": "scheme",
                        "chunk_index": i
                    }
                    documents.append({
                        "type": "scheme",
                        "content": chunk,
                        "metadata": metadata
                    })
                schemes_count += 1
        logger.info(f"Loaded {schemes_count} schemes -> {len(documents)} scheme chunks.")
    except Exception as e:
        logger.error(f"Error loading schemes.json: {e}")

    # 2. Load and process Rules
    rules_count = 0
    start_rule_idx = len(documents)
    try:
        with open("rules.json", "r", encoding="utf-8") as f:
            data = json.load(f)
            rules = data.get("rules", [])
            for r in rules:
                full_text = format_rule(r)
                chunks = text_splitter.split_text(full_text)
                for i, chunk in enumerate(chunks):
                    metadata = {
                        "rule_id": r.get("id"),
                        "rule_name": r.get("description", "")[:50], # fallback name
                        "category": r.get("category"),
                        "source": "rules.json",
                        "document_type": "rule",
                        "chunk_index": i
                    }
                    documents.append({
                        "type": "rule",
                        "content": chunk,
                        "metadata": metadata
                    })
                rules_count += 1
        logger.info(f"Loaded {rules_count} rules -> {len(documents) - start_rule_idx} rule chunks.")
    except Exception as e:
        logger.error(f"Error loading rules.json: {e}")

    total_chunks = len(documents)
    if total_chunks == 0:
        logger.warning("No documents to process. Exiting.")
        return

    logger.info(f"Generating embeddings for {total_chunks} chunks. This may take a moment...")
    
    # Generate embeddings in one go (or batch them if too large)
    texts = [doc["content"] for doc in documents]
    vectors = embeddings.embed_documents(texts)
    
    for i, doc in enumerate(documents):
        doc["embedding"] = vectors[i]

    logger.info("Upserting documents to Supabase...")
    
    # Idempotency: Delete existing to avoid duplicates if re-run
    try:
        supabase.table("knowledge_base").delete().neq("id", -1).execute()
        logger.info("Cleared existing knowledge_base table.")
    except Exception as e:
        logger.warning(f"Could not clear table, duplicates might occur: {e}")

    # Insert in batches of 100
    batch_size = 100
    inserted_count = 0
    failed_count = 0
    
    for i in range(0, len(documents), batch_size):
        batch = documents[i:i+batch_size]
        try:
            res = supabase.table("knowledge_base").insert(batch).execute()
            inserted_count += len(res.data)
        except Exception as e:
            logger.error(f"Failed to insert batch {i//batch_size}: {e}")
            failed_count += len(batch)

    # Print summary
    print("\n" + "="*50)
    print("VECTOR SEEDING SUMMARY")
    print("="*50)
    print(f"Schemes indexed: {schemes_count}")
    print(f"Rules indexed:   {rules_count}")
    print(f"Total chunks:    {total_chunks}")
    print(f"Successfully inserted: {inserted_count}")
    print(f"Failures:        {failed_count}")
    print("="*50)

if __name__ == "__main__":
    main()
