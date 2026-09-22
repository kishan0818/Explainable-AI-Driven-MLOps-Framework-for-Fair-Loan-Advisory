import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field

logger = logging.getLogger("HumanEvaluation")

EVAL_STORAGE_FILE = "human_evaluations.json"
OVERRIDES_STORAGE_FILE = "loan_overrides.json"

class HumanEvaluationSubmission(BaseModel):
    session_id: str = Field(..., description="Session ID of the conversation evaluated")
    reviewer_id: str = Field(..., description="Identifier for the human reviewer")
    correctness: int = Field(..., ge=1, le=5, description="Factual and logical correctness (1-5)")
    helpfulness: int = Field(..., ge=1, le=5, description="Utility to user task (1-5)")
    completeness: int = Field(..., ge=1, le=5, description="Covers required constraints (1-5)")
    safety: int = Field(..., ge=1, le=5, description="Avoids harmful, risky, or unauthorized behavior (1-5)")
    tone: int = Field(..., ge=1, le=5, description="Appropriateness of communication (1-5)")
    groundedness: int = Field(..., ge=1, le=5, description="Factual claims backed by retrieved evidence (1-5)")
    citation_quality: int = Field(..., ge=1, le=5, description="Citations point to correct official source (1-5)")
    comments: Optional[str] = Field(None, description="Qualitative feedback or reviewer notes")

class LoanOverrideRequest(BaseModel):
    application_id: str = Field(..., description="Unique loan application ID")
    reviewer_id: str = Field(..., description="Authorized human officer ID")
    override_decision: str = Field(..., pattern="^(APPROVED|REJECTED)$", description="Human decision override")
    justification: str = Field(..., min_length=10, description="Mandatory audit justification for override")
    mitigating_factors: Optional[List[str]] = Field(default=[], description="List of mitigating circumstances")

class HumanEvalManager:
    @staticmethod
    def save_evaluation(eval_data: HumanEvaluationSubmission) -> Dict[str, Any]:
        record = eval_data.dict()
        record["created_at"] = datetime.now().isoformat()
        
        records = []
        if os.path.exists(EVAL_STORAGE_FILE):
            try:
                with open(EVAL_STORAGE_FILE, "r", encoding="utf-8") as f:
                    records = json.load(f)
            except Exception as e:
                logger.error(f"Error loading {EVAL_STORAGE_FILE}: {e}")
                records = []
                
        records.append(record)
        with open(EVAL_STORAGE_FILE, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2)
            
        return {"status": "saved", "total_evaluations": len(records)}

    @staticmethod
    def get_summary_metrics() -> Dict[str, Any]:
        if not os.path.exists(EVAL_STORAGE_FILE):
            return {
                "total_evaluations": 0,
                "average_scores": {},
                "inter_annotator_agreement": 1.0,
                "likert_distribution": {}
            }
            
        try:
            with open(EVAL_STORAGE_FILE, "r", encoding="utf-8") as f:
                records = json.load(f)
        except Exception:
            records = []
            
        if not records:
            return {"total_evaluations": 0, "average_scores": {}}

        rubrics = ["correctness", "helpfulness", "completeness", "safety", "tone", "groundedness", "citation_quality"]
        averages = {}
        for r in rubrics:
            vals = [rec.get(r, 0) for rec in records if r in rec]
            averages[r] = round(sum(vals) / len(vals), 2) if vals else 0.0

        # Calculate Inter-Annotator Agreement Rate
        # For sessions reviewed by > 1 annotator: matching judgments / total multi-reviewer judgments
        session_reviews: Dict[str, List[Dict[str, Any]]] = {}
        for rec in records:
            sid = rec.get("session_id", "unknown")
            session_reviews.setdefault(sid, []).append(rec)
            
        total_judgments = 0
        matching_judgments = 0
        
        for sid, revs in session_reviews.items():
            if len(revs) >= 2:
                for i in range(len(revs)):
                    for j in range(i + 1, len(revs)):
                        for r in rubrics:
                            total_judgments += 1
                            # Match considered within 1 point tolerance on 1-5 scale
                            if abs(revs[i].get(r, 0) - revs[j].get(r, 0)) <= 1:
                                matching_judgments += 1
                                
        agreement_rate = (matching_judgments / total_judgments) if total_judgments > 0 else 1.0

        return {
            "total_evaluations": len(records),
            "average_scores": averages,
            "overall_quality_score": round(sum(averages.values()) / len(averages), 2) if averages else 0.0,
            "inter_annotator_agreement": round(agreement_rate, 3)
        }

    @staticmethod
    def record_loan_override(override_data: LoanOverrideRequest) -> Dict[str, Any]:
        record = override_data.dict()
        record["timestamp"] = datetime.now().isoformat()
        
        records = []
        if os.path.exists(OVERRIDES_STORAGE_FILE):
            try:
                with open(OVERRIDES_STORAGE_FILE, "r", encoding="utf-8") as f:
                    records = json.load(f)
            except Exception:
                records = []
                
        records.append(record)
        with open(OVERRIDES_STORAGE_FILE, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2)
            
        logger.info(f"⚖️ Human override recorded for Application {override_data.application_id}: {override_data.override_decision}")
        return {"status": "success", "override_record": record}
