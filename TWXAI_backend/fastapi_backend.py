"""
FastAPI Backend for TWXAI Loan Prediction System
Phase 1: Stabilization & Consolidated Analysis Pipeline
"""

import os
import json
import logging
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, Header, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from supabase import create_client, Client
import httpx

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Configuration & Auth Setup ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY]):
    logger.critical("Missing Supabase configuration. Check .env file.")

# Initialize Supabase (Service Role)
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    logger.critical(f"Failed to initialize Supabase: {e}")
    supabase = None

security = HTTPBearer()

# --- Global Data ---
model = None
feature_selector = None
label_encoders = None
pca = None
rules_data = {}
schemes_data = {}
bank_loan_data = {}
bank_profiles = [] # Loaded from DB or Fallback

# --- LifeCycle & Loading ---
def load_ml_components():
    global model, feature_selector, label_encoders, pca, rules_data, schemes_data, bank_loan_data, bank_profiles
    try:
        # 1. Load ML Artifacts (Signal Only)
        model_dir = "results_rf_smote_controlled_pca1_wocs//models"
        base_dir = os.path.join("results_rf_smote_controlled_pca1_wocs", "models")
        if not os.path.exists(base_dir): base_dir = "models"

        model = joblib.load(os.path.join(base_dir, "rf_smote_model.joblib"))
        feature_selector = joblib.load(os.path.join(base_dir, "feature_selector.joblib"))
        label_encoders = joblib.load(os.path.join(base_dir, "label_encoders.joblib"))
        if os.path.exists(os.path.join(base_dir, "pca.joblib")):
            pca = joblib.load(os.path.join(base_dir, "pca.joblib"))
            
        # 2. Load JSON Helpers
        with open("rules.json", 'r') as f: rules_data = json.load(f)
        with open("schemes.json", 'r') as f: schemes_data = json.load(f)
            
        # 3. Load Bank Profiles (STRICT: DB ONLY)
        try:
            res = supabase.table("bank_profiles").select("*").execute()
            if res.data:
                bank_profiles = res.data
                logger.info(f"Loaded {len(bank_profiles)} bank profiles from DB")
            else:
                # EXPLICIT EMPTY STATE
                bank_profiles = []
                logger.warning("Bank Profiles table is empty. Bank Analysis will be UNAVAILABLE.")
        except Exception as e:
            logger.error(f"Bank Profiles DB fetch failed: {e}. Bank Analysis will be UNAVAILABLE.")
            bank_profiles = []
            
        # Load local bank data ONLY for context references (schema mapping), NOT profiles
        bank_data_path = os.path.join("data", "bank_loan_data.json")
        if os.path.exists(bank_data_path):
             with open(bank_data_path, 'r') as f:
                bank_loan_data = json.load(f)
        
        return True
    except Exception as e:
        logger.error(f"ML/Data Loading Error: {e}")
        return False

@asynccontextmanager
async def lifespan(app: FastAPI):
    if load_ml_components():
        logger.info("✅ System Components Loaded")
    else:
        logger.error("❌ Component Loading Failed")
    yield

app = FastAPI(title="TWXAI Analysis Engine", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# --- Data Models ---
class LoanApplication(BaseModel):
    name: str
    age: int = Field(..., ge=18, le=80)
    income: float = Field(..., gt=0)
    loan_amount: float = Field(..., gt=0)
    loan_type: str
    employment_type: str
    existing_emi: float = Field(0, ge=0)
    credit_score: Optional[int] = Field(None, ge=300, le=900)
    
    # Optional fields for ML
    months_employed: Optional[int] = None
    num_credit_lines: Optional[int] = None
    interest_rate: Optional[float] = None
    loan_term: Optional[int] = None
    education: Optional[str] = None
    marital_status: Optional[str] = None
    has_mortgage: Optional[bool] = None
    has_dependents: Optional[bool] = None
    loan_purpose: Optional[str] = None
    has_co_signer: Optional[bool] = None
    gender: Optional[str] = None
    caste_category: Optional[str] = None
    location_type: Optional[str] = None

class AnalysisResponse(BaseModel):
    application_id: str
    risk_score: float
    risk_band: str
    ml_probability: float
    decision_summary: str
    positive_factors: List[Dict[str, Any]]
    negative_factors: List[Dict[str, Any]]
    bank_suitability: List[Dict[str, Any]]
    scheme_recommendations: List[Dict[str, Any]]
    improvement_recommendations: List[Dict[str, Any]]

# --- Auth Helper ---
async def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    api_key = SUPABASE_ANON_KEY or SUPABASE_KEY
    
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={"Authorization": f"Bearer {token}", "apikey": api_key}
        )
        if res.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = res.json()
        return {"sub": user.get("id"), "email": user.get("email")}

# --- Core Logic Engines ---

def normalize_loan_type(raw_type: str) -> str:
    """Canonicalize loan type strings"""
    mapping = {
        "personal": "personal_loan", "Personal Loan": "personal_loan",
        "home": "home_loan", "Home Loan": "home_loan",
        "education": "education_loan", "Education Loan": "education_loan",
        "msme": "msme_loan", "MSME": "msme_loan",
        "agriculture": "agriculture_loan", "Agriculture Loan": "agriculture_loan"
    }
    return mapping.get(raw_type, raw_type)

def calculate_risk(app: LoanApplication, ml_prob: float, dti: float):
    """
    Deterministic Risk Engine (Phase 1)
    Combines ML Signal with Hard Guardrails
    """
    # 1. Base on ML 
    risk_score = (1.0 - ml_prob) * 100
    
    # 2. Apply Guardrails
    
    # Guardrail A: Credit Score
    if app.credit_score:
        if app.credit_score < 600:
            risk_score = max(risk_score, 80) # Force High Risk
        elif app.credit_score > 750:
            risk_score = min(risk_score, 40) # Force Low/Medium Risk
    else:
        # No Score = Uncertainty penalty
        risk_score = max(risk_score, 60) 

    # Guardrail B: DTI
    if dti > 0.6:
        risk_score = max(risk_score, 85) # Very High Risk

    # 3. Determine Band
    if risk_score < 40: band = "low"
    elif risk_score < 75: band = "medium"
    else: band = "high"
    
    return risk_score, band

def evaluate_banks(app: LoanApplication, dti: float, risk_band: str, canonical_type: str):
    """
    Bank Suitability Engine (Real)
    Scores banks based on profile match
    """
    results = []
    
    # Filter profiles by loan type
    if not bank_profiles:
        logger.warning("Bank Analysis Skipped: No profiles loaded.")
        return [{
            "bank_name": "System",
            "suitability": "bank_analysis_unavailable",
            "reason": "Bank profiles not loaded from database",
            "score": 0
        }]

    # Schema does not have loan_type, so we consider all seeded banks as relevant for now ( MVP )
    relevant_banks = bank_profiles
    
    if not relevant_banks:
        return []

    for bank in relevant_banks:
        score = 50 # Base
        reasons = []
        
        bank_name = bank.get('bank_name', 'Unknown Bank')
        
        # 1. Income Check
        # Simplified: Top tier banks prefer > 25k
        is_top_tier = bank_name.lower() in ['sbi', 'hdfc bank', 'icici bank', 'axis bank']
        if is_top_tier:
            if app.income > 30000: 
                score += 10
                reasons.append("Income meets premium bank criteria")
            else:
                score -= 10
                reasons.append("Income below preferred threshold")
        
        # 2. Credit Score Check
        if app.credit_score:
            if app.credit_score >= 750:
                score += 20
                reasons.append("Excellent credit score")
            elif app.credit_score < 650:
                score -= 20
                reasons.append("Credit score risk")
        else:
            if is_top_tier:
                score -= 15
                reasons.append("Credit history required")
            else:
                score += 5
                reasons.append("Alternative scoring accepted")

        # 3. DTI Check
        if dti < 0.3:
            score += 10
            reasons.append("Strong repayment capacity")
        elif dti > 0.5:
            score -= 20
            reasons.append("High existing debt")

        # 4. Map to Suitability
        if score >= 65: suitability = "high"
        elif score >= 40: suitability = "medium"
        else: suitability = "low"
        
        # Select primary reason
        reason_text = reasons[0] if reasons else "Standard eligibility check"
        if suitability == "low":
            # Find a negative reason
            neg = next((r for r in reasons if "risk" in r or "below" in r or "High" in r), reason_text)
            reason_text = neg
            
        results.append({
            "bank_name": bank_name,
            "suitability": suitability,
            "reason": reason_text,
            "score": score # Internal verify
        })
        
    # Sort by score desc
    results.sort(key=lambda x: x['score'], reverse=True)
    return results

def generate_improvements(app: LoanApplication, risk_score: float, dti: float):
    """
    Improvement Recommendation Engine
    """
    recs = []
    
    # Don't advise if already excellent
    if risk_score < 30: return recs
    
    # 1. DTI Advice
    if dti > 0.4:
        target_emi = app.income * 0.4
        recs.append({
            "recommendation_type": "reduce_obligations",
            "current_value": float(app.existing_emi),
            "recommended_value": float(target_emi),
            "message": f"Reduce monthly obligations to ₹{int(target_emi)} to improve approval chances."
        })
        
    # 2. Income Advice
    if app.loan_amount > (app.income * 20):
        # Loan is too huge
        target_income = app.loan_amount / 15
        recs.append({
            "recommendation_type": "increase_income",
            "current_value": float(app.income),
            "recommended_value": float(target_income),
            "message": "Your loan amount is high relative to income. Adding a co-signer with income helps."
        })
        
    # 3. Credit Score
    if app.credit_score and app.credit_score < 700:
        recs.append({
            "recommendation_type": "improve_credit_score",
            "current_value": float(app.credit_score),
            "recommended_value": 720.0,
            "message": "Pay down credit card balances to boost score above 720."
        })
        
    return recs[:3]

# --- Main Endpoint ---

def evaluate_rules(app: LoanApplication):
    """
    Rules Engine (Phase 2)
    Evaluates rules.json against application data
    """
    results = []
    if not rules_data or "rules" not in rules_data:
        return results

    for rule in rules_data["rules"]:
        outcome = "passed"
        reason = "All conditions met"
        
        # Evaluate conditions
        for cond in rule.get("conditions", []):
            field = cond.get("field")
            operator = cond.get("operator")
            value = cond.get("value")
            
            # Map app fields to rule fields
            app_val = None
            if hasattr(app, field):
                app_val = getattr(app, field)
            elif field == "monthly_income": app_val = app.income / 12
            elif field == "monthly_emi": app_val = app.existing_emi
            elif field == "applicant_age": app_val = app.age
            # Add more mappings as needed
            
            # Skip if field missing (or handle as fail/neutral?) 
            # For now, if field missing, we skip condition or assume pass? 
            # Strict mode: fail. Lenient: pass. Let's be lenient for optional fields.
            if app_val is None: continue
            
            # Logic
            matched = False
            if operator == "eq": matched = (app_val == value)
            elif operator == "gte": matched = (app_val >= value)
            elif operator == "gt": matched = (app_val > value)
            elif operator == "lte": matched = (app_val <= value)
            elif operator == "lt": matched = (app_val < value)
            elif operator == "in": matched = (app_val in value)
            
            if not matched:
                outcome = "failed"
                reason = f"Condition failed: {field} ({app_val}) {operator} {value}"
                break
        
        # Add result
        results.append({
            "rule_id": rule.get("id"),
            "description": rule.get("description"),
            "status": outcome,
            "severity": rule.get("severity", "soft"),
            "reason": reason
        })
        
    return results

def evaluate_schemes(app: LoanApplication):
    """
    Scheme Engine (Phase 2)
    Matches schemes.json eligibility
    """
    recommendations = []
    if not schemes_data or "schemes" not in schemes_data:
        return recommendations
        
    for scheme in schemes_data["schemes"]:
        eligible = True
        reasons = []
        
        # Check Eligibility Criteria
        elig = scheme.get("eligibility", {})
        
        # 1. Loan Type ?? (Not strictly in Scheme JSON, but implied by categories)
        # We'll skip loan type filter for now to show more results, or strict?
        # Let's map category loosely.
        
        # 2. Beneficiary Attributes
        desc = elig.get("beneficiaries", "").lower()
        
        # Gender Check
        if "women" in desc and app.gender and app.gender.lower() != "female":
             # Only strictly fail if EXCLUSIVE to women? 
             # Usually "women entrepreneurs" implies women.
             pass # Logic too fuzzy without structured data. 
             
        # Income/Amount Check?
        # Hard to parse free text "eligibility". 
        # Ideally schemes.json needs structured eligibility fields.
        # But Phase 2 constraint: "Use existing DB schema/JSON".
        # We will use simple keyword matching on description/eligibility text for now 
        # OR hardcode logic for specific IDs if permissible. 
        # DIRECTIVE says: "Match eligibility deterministically... Allowed: loan_type, income..."
        
        # Let's implement a safer, deterministic subset based on Schemes JSON "eligibility" dict if it existed structurely.
        # Looking at schemes.json, "eligibility" is mostly text. 
        # EXCEPT `government_schemes_integration` section in `rules.json` has `eligibility_matching_rules`.
        # Wait, the instruction says "Load schemes.json". 
        # BUT `rules.json` has `government_schemes_integration`.
        # Let's use `rules.json` -> `government_schemes_integration` for matching logic 
        # and `schemes.json` for details.
        
        pass 
    
    # REVISED STRATEGY for Schemes:
    # `rules.json` contains `government_schemes_integration` with structured rules.
    # We should use THAT to find eligible schemes, then look up details in `schemes.json`.
    
    match_rules = rules_data.get("government_schemes_integration", {}).get("eligibility_matching_rules", [])
    
    for rule in match_rules:
        scheme_id = rule.get("scheme")
        criteria = rule.get("eligibility", {})
        
        is_match = True
        
        # Loan Type
        req_types = criteria.get("loan_type", [])
        if isinstance(req_types, str): req_types = [req_types]
        
        # Normalize: "home_loan" -> "home" for matching rules.json
        start_type = normalize_loan_type(app.loan_type)
        simple_type = start_type.replace("_loan", "")
        
        # Simple check
        msg_types = [t.lower() for t in req_types]
        
        # Match against full type ("home_loan") OR simple type ("home")
        if req_types and start_type not in msg_types and simple_type not in msg_types and "all" not in msg_types:
             logger.debug(f"Scheme {scheme_id} Rejected: Loan Type Mismatch ({start_type} vs {req_types})")
             is_match = False
             
        # Income Check
        max_income = criteria.get("annual_income")
        if is_match and max_income and app.income * 12 > max_income:
            logger.debug(f"Scheme {scheme_id} Rejected: Income Too High ({app.income*12} > {max_income})")
            is_match = False

        # Max Loan Amount Check (Critical for Mudra)
        # Note: In rules.json, max_loan_amount is a sibling of eligibility, but we access it via criteria = rule.get("eligibility")?
        # WAIT: In rules.json, max_loan_amount is OUTSIDE eligibility object.
        # We need to access it from `rule`, not `criteria`.
        
        max_loan = rule.get("max_loan_amount")
        if is_match and max_loan and app.loan_amount > max_loan:
             logger.debug(f"Scheme {scheme_id} Rejected: Loan Amount Too High ({app.loan_amount} > {max_loan})")
             is_match = False
             
        if is_match:
            # Look up name and URL
            s_name = scheme_id
            s_url = ""
            for s in schemes_data.get("schemes", []):
                if s.get("id") == scheme_id:
                    s_name = s.get("name")
                    s_url = s.get("url", "")
                    break
            
            recommendations.append({
                "scheme_id": scheme_id,
                "scheme_name": s_name,
                "reason": "Matched eligibility criteria",
                "url": s_url
            })
    
    logger.info(f"Scheme Evaluation Complete. Found {len(recommendations)} matches.")
    return recommendations

def build_explanation(risk_score, risk_band, rules_res, schemes_res, improvements):
    """
    Explanation Builder (Phase 2.1 - Enhanced)
    Excludes PSL/Inclusion rules from negative factors.
    Uses advisory language.
    """
    # 1. Identify and Filter Rules
    # PSL/Inclusion categories that should NEVER be negative
    inclusion_categories = ["psl_compliance", "constitutional_compliance", "weaker_sections", "inclusion"]
    
    # Helper to check if rule is inclusion-related
    def is_inclusion_rule(r):
        # Check explicit category
        # Also check ID keywords if category missing? (e.g. "weaker_sections_...")
        # Since we don't have category in the result dict (only id/desc/status/severity/reason), 
        # we strictly rely on ID or we reload rules data? 
        # Actually `evaluate_rules` returns a subset: id, description, status, severity, reason.
        # It DOES NOT return category. 
        # Critical Fix: We need to identify these rules. 
        # Strategy: Checks for keywords in `rule_id` or `description`.
        rid = r.get("rule_id", "").lower()
        desc = r.get("description", "").lower()
        
        keywords = ["weaker_section", "sc_st", "transgender", "minority", "women", "inclusion", "constitutional", "senior", "handicap", "disability"]
        return any(k in rid for k in keywords) or any(k in desc for k in keywords)

    # Filter FAILED rules
    # Only "Compliance" or "Risk" failures should be negative.
    # "Inclusion" failures (e.g. not being SC/ST) are neutral.
    all_failed = [r for r in rules_res if r['status'] == 'failed']
    real_negative_rules = [r for r in all_failed if not is_inclusion_rule(r)]
    
    # PASSED rules
    # Inclusion rules that Pass are POSITIVE factors (boosters)
    all_passed = [r for r in rules_res if r['status'] == 'passed']
    inclusion_passed = [r for r in all_passed if is_inclusion_rule(r)]
    
    failed_hard = [r for r in real_negative_rules if r['severity'] == 'hard']
    failed_soft = [r for r in real_negative_rules if r['severity'] == 'soft']
    
    # 2. Build Decision Summary (Advisory Language)
    summary = f"Risk Score: {int(risk_score)} ({risk_band.upper()}). "
    
    violation_count = len(failed_hard) + len(failed_soft)
    
    if failed_hard:
        # Advisory wording for hard blocking rules
        summary += f"Eligibility gaps detected due to {violation_count} rule violations."
    elif risk_band == "high":
        summary += "Not recommended under current eligibility conditions due to high risk factors."
    elif violation_count > 0:
        summary += f"Eligibility gaps detected due to {violation_count} rule violations."
    else:
        summary += "Application meets eligibility criteria."
        
    return {
        "summary": summary,
        "failed_rules_filtered": failed_hard + failed_soft, # Safe list for negative_factors
        "passed_rules_boosters": inclusion_passed, # Add these to positive_factors
        "passed_rules_count": len(all_passed)
    }

# --- Main Endpoint ---

@app.post("/analyze-application", response_model=AnalysisResponse)
async def analyze_application(app_in: LoanApplication, user_payload: dict = Depends(verify_token)):
    user_id = user_payload.get("sub")
    user_email = user_payload.get("email")
    
    # 1. Sync User (Best Effort)
    try:
        supabase.table("users").upsert({"id": user_id, "email": user_email, "is_active": True}).execute()
    except: pass
    
    # 2. Normalize & Prepare
    canonical_type = normalize_loan_type(app_in.loan_type)
    dti = (app_in.existing_emi / app_in.income) if app_in.income > 0 else 0
    
    # 3. Get ML Signal
    try:
        # Preprocess
        df = pd.DataFrame([{
            'Age': app_in.age,
            'Income': app_in.income,
            'LoanAmount': app_in.loan_amount,
            'MonthsEmployed': app_in.months_employed or 12,
            'NumCreditLines': app_in.num_credit_lines or 1,
            'InterestRate': app_in.interest_rate or 10.0,
            'LoanTerm': app_in.loan_term or 12,
            'DTIRatio': dti,
            'Education': app_in.education or 'Bachelor',
            'EmploymentType': app_in.employment_type if app_in.employment_type in ['salaried', 'self_employed', 'business'] else 'salaried',
            'MaritalStatus': app_in.marital_status or 'Single',
            'HasMortgage': int(app_in.has_mortgage or False),
            'HasDependents': int(app_in.has_dependents or False),
            'LoanPurpose': app_in.loan_purpose or 'Personal',
            'HasCoSigner': int(app_in.has_co_signer or False),
            'MarketVolatilityIndex': 0.5,
            'EconomicUncertaintyScore': 0.5
        }])
        
        # Transform
        if label_encoders:
             for col, enc in label_encoders.items():
                 if col in df.columns: 
                     try: df[col] = enc.transform(df[col])
                     except: df[col] = 0
        if feature_selector:
             try: df = feature_selector.transform(df)
             except: pass
        if pca:
             try: df = pca.transform(df)
             except: pass
             
        # Predict
        probs = model.predict_proba(df)[0]
        ml_prob = float(probs[1]) # Probability of Approval
    except Exception as e:
        logger.error(f"ML Error: {e}")
        ml_prob = 0.5 # Neutral fallback
        
    # 4. Run Risk Engine
    risk_score, risk_band = calculate_risk(app_in, ml_prob, dti)
    
    # 5. Run Bank Engine
    bank_results = evaluate_banks(app_in, dti, risk_band, canonical_type)
    
    # 6. Run Improvement Engine
    improvements = generate_improvements(app_in, risk_score, dti)
    
    # 7. Run Rules & Schemes (Phase 2)
    rule_results = evaluate_rules(app_in)
    schemes_res = evaluate_schemes(app_in)
    
    logger.info(f"Analysis Debug - AppId: {user_id}")
    logger.info(f"Banks Available in DB: {len(bank_profiles)}")
    logger.info(f"Banks Matched: {len(bank_results)}")
    logger.info(f"Schemes Matched: {len(schemes_res)}")
    
    # 8. Build Explanation (Phase 2.1)
    explanation = build_explanation(risk_score, risk_band, rule_results, schemes_res, improvements)
    
    # Construct Factors
    # Positive: Standard Phase 1 + Passed Boosters (PSL) + Other Passed Rules (Limit 5 generic)
    boosters = [{"factor": f"Inclusion Algo: {r['description']}", "impact": "positive"} for r in explanation['passed_rules_boosters']]
    generic_passed = [{"factor": f"Passed Rule: {r['description']}", "impact": "positive"} for r in rule_results if r['status'] == 'passed' and r not in explanation['passed_rules_boosters']][:3]
    pos_factors = boosters + generic_passed 
    if len(pos_factors) > 10: pos_factors = pos_factors[:10]
    
    # Negative: FILTERED Failures only (Never PSL)
    filtered_negative = explanation['failed_rules_filtered']
    neg_factors = [{"factor": f"Rule Violation: {r['description']}", "impact": "negative"} for r in filtered_negative]
    if risk_band == "high": neg_factors.insert(0, {"factor": "High Risk Band", "impact": "negative"})
    
    # 9. Persist EVERYTHING
    
    # A. Loan Application
    try:
        app_data = {
            "user_id": user_id,
            "loan_type": canonical_type,
            "income": app_in.income,
            "loan_amount": app_in.loan_amount,
            "employment_type": app_in.employment_type,
            "existing_emi": app_in.existing_emi,
            "credit_score": app_in.credit_score,
            "status": "processed" 
        }
        res = supabase.table("loan_applications").insert(app_data).execute()
        app_id = res.data[0]['id']
    except Exception as e:
        logger.error(f"DB Write Error (App): {e}")
        raise HTTPException(status_code=500, detail="Database persistence failed")
        
    # B. Analysis Results
    
    # DB Constraints Safety (Calc before try to ensure available for fallback)
    try:
        safe_prob = max(0.0, min(1.0, float(ml_prob)))
    except:
        safe_prob = 0.0
        
    try:
        safe_score = max(0, min(100, int(risk_score)))
    except:
        safe_score = 0
        
    safe_band = risk_band.lower()
    if safe_band not in ['low', 'medium', 'high']:
        safe_band = 'medium' # Safe fallback

    try:
        an_data = {
            "application_id": app_id,
            "risk_score": safe_score,
            "risk_band": safe_band,
            "ml_probability": safe_prob,
            "decision_summary": explanation["summary"],
            "positive_factors": pos_factors,
            "negative_factors": neg_factors
        }
        logger.info(f"Inserting Analysis Data (Full): {an_data}")
        res = supabase.table("analysis_results").insert(an_data).execute()
        logger.info(f"Analysis Insert Success: {res}")
        
    except Exception as e:
        logger.error(f"DB Write Error (Full Analysis Payload Failed): {e}")
        logger.info("Attempting Fallback Insert (Core Fields Only)...")
        try:
            # Fallback: Maybe columns are missing? Try core fields only.
            fallback_data = {
                "application_id": app_id,
                "risk_score": safe_score,
                "risk_band": safe_band,
                "ml_probability": safe_prob
            }
            supabase.table("analysis_results").insert(fallback_data).execute()
            logger.info("Fallback Insert Success (Risk Score Saved)")
        except Exception as e2:
             logger.error(f"DB Write Error (Fallback Failed): {e2}")

    # C. Banks
    if bank_results:
        for b in bank_results:
            if b['suitability'] == "bank_analysis_unavailable": continue
            b_db = {
                "application_id": app_id,
                "bank_name": b['bank_name'],
                "suitability": b['suitability'],
                "reason": b['reason']
            }
            try: supabase.table("bank_suitability").insert(b_db).execute()
            except: pass
            
    # D. Improvements
    if improvements:
        for i in improvements:
            i_db = {
                "application_id": app_id,
                "recommendation_type": i['recommendation_type'],
                "current_value": i['current_value'],
                "recommended_value": i['recommended_value'],
                "message": i['message']
            }
            try: supabase.table("improvement_recommendations").insert(i_db).execute()
            except: pass
            
    # E. Schemes (Phase 2 Active)
    if schemes_res:
        for s in schemes_res:
            s_db = {
                 "application_id": app_id,
                 "scheme_id": s['scheme_id'],
                 "scheme_name": s['scheme_name'],
                 "reason": s['reason']
            }
            try: supabase.table("scheme_recommendations").insert(s_db).execute()
            except Exception as e: 
                logger.warning(f"Scheme Write Fail: {e}")
    
    return {
        "application_id": app_id,
        "risk_score": risk_score,
        "risk_band": risk_band,
        "ml_probability": ml_prob,
        "decision_summary": explanation["summary"],
        "positive_factors": an_data["positive_factors"],
        "negative_factors": an_data["negative_factors"],
        "bank_suitability": bank_results,
        "scheme_recommendations": schemes_res,
        "improvement_recommendations": improvements
    }

# Keep old health check
@app.get("/health")
def health():
    return {"status": "active", "phase": "1"}

@app.get("/reference-data")
def get_reference_data():
    return {"bank_data": bank_loan_data, "schemes": schemes_data.get("schemes", [])}

# --- Dev Helpers (Phase 1 Fix) ---
@app.get("/dev/session")
async def dev_session_check(user_payload: dict = Depends(verify_token)):
    """
    DEV-ONLY: Verifies auth token and returns minimal session info.
    Used to confirm frontend-backend auth flow during testing.
    """
    return {
        "user_id": user_payload.get("sub"),
        "access_token_present": True,
        "mode": "dev_verification"
    }
