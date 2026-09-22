import json
import logging
from typing import List, Dict, Any

logger = logging.getLogger("RAGReranker")

class EvidenceReranker:
    """
    Reranks retrieved knowledge chunks using lexical-semantic cross-scoring
    to prioritize the most pertinent regulatory and scheme rules.
    """
    @classmethod
    def score_chunk(cls, query: str, chunk_content: str, metadata: Dict[str, Any]) -> float:
        query_lower = query.lower()
        query_terms = set(query_lower.split())
        content_lower = chunk_content.lower()
        
        # 1. Term overlap score
        matches = sum(1 for term in query_terms if term in content_lower)
        overlap_score = matches / max(len(query_terms), 1)
        
        # 2. Key phrase and entity weighting
        bonus = 0.0
        if any(w in query_lower for w in ["mudra", "pmay", "stand up", "kcc", "subsidy", "farmer", "women", "msme"]):
            scheme_name = (metadata.get("scheme_name") or metadata.get("name") or "").lower()
            if any(k in scheme_name for k in ["mudra", "pmay", "stand", "kisan", "credit"]):
                bonus += 0.3
                
        # 3. Base similarity score from vector match if present
        base_sim = float(metadata.get("similarity", 0.5))
        
        return round(0.4 * overlap_score + 0.4 * base_sim + bonus, 4)

    @classmethod
    def rerank(cls, query: str, chunks: List[str], top_k: int = 4) -> List[str]:
        """
        Reranks raw JSON or text chunks by relevance to query and returns top_k.
        """
        if not chunks:
            return []
            
        scored = []
        for c in chunks:
            try:
                # If stored as JSON string
                parsed = json.loads(c) if c.startswith("{") else {"content": c}
                meta = {k: v for k, v in parsed.items() if k != "content"}
                content = parsed.get("content", c)
                score = cls.score_chunk(query, content, meta)
                parsed["rerank_score"] = score
                scored.append((score, json.dumps(parsed) if c.startswith("{") else content))
            except Exception:
                score = cls.score_chunk(query, c, {})
                scored.append((score, c))
                
        scored.sort(key=lambda x: x[0], reverse=True)
        top_chunks = [item[1] for item in scored[:top_k]]
        logger.info(f"Reranker: Selected top {len(top_chunks)} chunks from {len(chunks)} candidates.")
        return top_chunks
