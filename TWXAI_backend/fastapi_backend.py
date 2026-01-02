"""
FastAPI Backend for TWXAI Loan Prediction System
Production Integration with Supabase and Real ML Inference
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
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET") # Keeping for legacy or if needed, though user said remove decode.
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY") # User requested this specific key

if not all([SUPABASE_URL, SUPABASE_KEY]):
    logger.critical("Missing Supabase configuration. Check .env file.")

# Initialize Supabase (Service Role)
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    logger.critical(f"Failed to initialize Supabase: {e}")
    supabase = None

security = HTTPBearer()

# --- Global ML Artifacts ---
model = None
feature_selector = None
label_encoders = None
pca = None
rules_data = {}
schemes_data = {}
bank_loan_data = {}

# ... (models) ...

# --- ML & Logic Helpers ---
def load_ml_components():
    global model, feature_selector, label_encoders, pca, rules_data, schemes_data, bank_loan_data
    try:
        model_dir = "results_rf_smote_controlled_pca1_wocs//models"
        # Fix path if double slash is issue, standardizing to os.path.join
        base_dir = os.path.join("results_rf_smote_controlled_pca1_wocs", "models")
        
        if not os.path.exists(base_dir):
            base_dir = "models" # Fallback if user moved it

        model = joblib.load(os.path.join(base_dir, "rf_smote_model.joblib"))
        feature_selector = joblib.load(os.path.join(base_dir, "feature_selector.joblib"))
        label_encoders = joblib.load(os.path.join(base_dir, "label_encoders.joblib"))
        if os.path.exists(os.path.join(base_dir, "pca.joblib")):
            pca = joblib.load(os.path.join(base_dir, "pca.joblib"))
            
        # Load JSONs
        with open("rules.json", 'r') as f:
            rules_data = json.load(f)
        with open("schemes.json", 'r') as f:
            schemes_data = json.load(f)
            
        # Phase 2: Load Bank Loan Data
        bank_data_path = os.path.join("data", "bank_loan_data.json")
        if os.path.exists(bank_data_path):
             with open(bank_data_path, 'r') as f:
                bank_loan_data = json.load(f)
        else:
             logger.warning(f"Bank Data not found at {bank_data_path}")
            
        return True
    except Exception as e:
        logger.error(f"ML Loading Error: {e}")
        return False

# ... (preprocess) ..

# --- Routes moved to bottom ---
class LoanApplication(BaseModel):
    name: str = Field(..., description="Applicant name")
    age: int = Field(..., ge=18, le=80, description="Applicant age")
    income: float = Field(..., gt=0, description="Monthly income")
    loan_amount: float = Field(..., gt=0, description="Requested loan amount")
    loan_type: str = Field(..., description="Type of loan (home_loan, personal_loan, education_loan, msme_loan, agriculture_loan)")
    employment_type: str = Field(..., description="Employment type (salaried, self_employed, business)")
    existing_emi: float = Field(0, ge=0, description="Existing monthly EMI obligations")
    credit_score: Optional[int] = Field(None, ge=300, le=900, description="CIBIL/Credit Score")
    # Additional fields required by ML preprocessor but maybe not in DB (will be inferred or optional)
    months_employed: Optional[int] = Field(None, ge=0)
    num_credit_lines: Optional[int] = Field(None, ge=0)
    interest_rate: Optional[float] = Field(None)
    loan_term: Optional[int] = Field(None)
    education: Optional[str] = Field(None)
    marital_status: Optional[str] = Field(None)
    has_mortgage: Optional[bool] = Field(None)
    has_dependents: Optional[bool] = Field(None)
    loan_purpose: Optional[str] = Field(None)
    has_co_signer: Optional[bool] = Field(None)
    gender: Optional[str] = Field(None)
    caste_category: Optional[str] = Field(None)
    location_type: Optional[str] = Field(None)

class BankSuitabilityResult(BaseModel):
    bank_name: str
    suitability: str
    reason: str

class SchemeRecommendationResult(BaseModel):
    scheme_id: str
    scheme_name: str
    reason: str

class ModelPrediction(BaseModel):
    application_id: str
    risk_score: float
    risk_band: str
    prediction: str  # approve/reject (based on ML prob)
    confidence: float
    positive_factors: List[str]
    negative_factors: List[str]
    bank_suitability: List[BankSuitabilityResult]
    schemes_suggested: List[SchemeRecommendationResult]
    timestamp: str

# --- Authentication Middleware ---
async def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Verify Supabase JWT via Remote Auth API (Strict)"""
    token = credentials.credentials
    
    # Use Anon Key if available, else fallback to Service Role Key (both valid for apikey header generally, though Anon is standard for client emulation)
    api_key = SUPABASE_ANON_KEY or SUPABASE_KEY
    
    if not api_key:
        logger.error("No API Key available for Auth Verification")
        raise HTTPException(status_code=500, detail="Server Configuration Error")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": api_key
                }
            )
            
        if response.status_code != 200:
            logger.warning(f"Auth Token Validation Failed: {response.text}")
            raise HTTPException(status_code=401, detail="Invalid token")
            
        user = response.json()
        
        # Normailize structure to what logic expects (payload vs user object)
        # The /user endpoint returns the User object directly.
        # We need to ensure we return something compatible with usage (user_payload.get("sub"))
        # User object has 'id', 'email', etc.
        # Construct a payload-like dict for compatibility
        return {
            "sub": user.get("id"),
            "email": user.get("email"),
            "app_metadata": user.get("app_metadata"),
            "user_metadata": user.get("user_metadata")
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Auth Verification Error: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

# --- ML & Logic Helpers ---
# load_ml_components defined at top of file

def preprocess_application(app: LoanApplication) -> pd.DataFrame:
    # Logic matching training data schema
    features = {
        'Age': app.age,
        'Income': app.income,
        'LoanAmount': app.loan_amount,
        'MonthsEmployed': app.months_employed or 12,
        'NumCreditLines': app.num_credit_lines or 1,
        'InterestRate': app.interest_rate or 10.0,
        'LoanTerm': app.loan_term or 12,
        'DTIRatio': (app.existing_emi / app.income) if app.income > 0 else 0, # Calculate DTI if not provided
        'Education': app.education or 'Bachelor',
        'EmploymentType': app.employment_type if app.employment_type in ['salaried', 'self_employed', 'business'] else 'salaried',
        'MaritalStatus': app.marital_status or 'Single',
        'HasMortgage': int(app.has_mortgage or False),
        'HasDependents': int(app.has_dependents or False),
        'LoanPurpose': app.loan_purpose or 'Personal',
        'HasCoSigner': int(app.has_co_signer or False),
        # Noise features if model expects them (checking previous code showed they were added)
        'MarketVolatilityIndex': 0.5, # Median value
        'EconomicUncertaintyScore': 0.5 # Median value
    }
    
    
    # Overwrite removed - DTI is computed in line 190
    # if app.dti_ratio is not None:
    #     features['DTIRatio'] = app.dti_ratio

    df = pd.DataFrame([features])
    
    # Encoders
    if label_encoders:
        for col, encoder in label_encoders.items():
            if col in df.columns:
                try:
                    df[col] = encoder.transform(df[col])
                except Exception:
                    # Handle unknown categories by setting to 0 or valid default
                    # In production, this should be more robust, but assuming 0 is safe for now
                    df[col] = 0
                    
    # Feature Selection
    if feature_selector:
        try:
             df = feature_selector.transform(df)
        except:
             pass 
             
    # PCA
    if pca:
        try:
            df = pca.transform(df)
        except:
            pass
            
    return df

def get_risk_factors(app: LoanApplication, prob_approve: float, dti: float):
    pos = []
    neg = []
    
    if prob_approve > 0.7: pos.append("High model confidence")
    if app.credit_score and app.credit_score > 750: pos.append("Excellent credit score")
    if dti < 0.3: pos.append("Low debt-to-income ratio")
    if app.income > 50000: pos.append("Healthy income level")
    
    if prob_approve < 0.5: neg.append("Model predicts default risk")
    if app.credit_score and app.credit_score < 650: neg.append("Low credit score")
    if dti > 0.5: neg.append("Critically high debt-to-income ratio")
    if app.existing_emi > (app.income * 0.6): neg.append("Over-leveraged income")

    return pos, neg

@asynccontextmanager
async def lifespan(app: FastAPI):
    if load_ml_components():
        logger.info("✅ ML Model & Data loaded successfully")
    else:
        logger.warning("⚠️ ML Model failed to load")
    yield

# --- App Definition ---
app = FastAPI(title="TWXAI Real Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handler for Validation Errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    logger.error(f"Validation Error: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": str(exc)},
    )

# --- Routes ---

@app.get("/")
def health():
    return {"status": "active", "db": "supabase_connected" if supabase else "failed", "model": "loaded" if model else "failed"}

@app.get("/reference-data")
def get_reference_data():
    """Serve bank loan data and schemes for frontend usage"""
    return {
        "bank_data": bank_loan_data,
        "schemes": schemes_data.get("schemes", [])
    }

@app.post("/predict", response_model=ModelPrediction)
async def predict(application: LoanApplication, user_payload: dict = Depends(verify_token)):
    user_id = user_payload.get("sub")
    
    # 1. Sync User to public.users (FK Requirement)
    try:
        user_email = user_payload.get("email")
        # Upsert user to ensure they exist for the FK constraint
        user_data = {
            "id": user_id,
            "email": user_email,
            "is_active": True
        }
        supabase.table("users").upsert(user_data).execute()
    except Exception as e:
        logger.error(f"User Sync Error (Non-critical if exists?): {e}")
        pass

    # --- Phase 3 Fix: Normalize Loan Type ---
    LOAN_TYPE_MAP = {
        "personal": "personal_loan",
        "Personal Loan": "personal_loan",
        "home": "home_loan",
        "Home Loan": "home_loan",
        "education": "education_loan",
        "Education Loan": "education_loan",
        "msme": "msme_loan",
        "MSME": "msme_loan",
        "agriculture": "agriculture_loan",
        "Agriculture Loan": "agriculture_loan"
    }
    
    canonical_loan_type = LOAN_TYPE_MAP.get(application.loan_type, application.loan_type)
    # ----------------------------------------

    # 2. Insert into loan_applications
    dti_val = (application.existing_emi / application.income) if application.income > 0 else 0
    
    app_data = {
        "user_id": user_id,
        "loan_type": canonical_loan_type, # Use canonical
        "income": application.income,
        "loan_amount": application.loan_amount,
        "employment_type": application.employment_type if application.employment_type in ['salaried', 'self_employed', 'business'] else 'salaried',
        "existing_emi": application.existing_emi,
        "credit_score": application.credit_score,
        "status": "processed" # Mark as processed immediately
    }
    
    try:
        res = supabase.table("loan_applications").insert(app_data).execute()
        if not res.data:
             raise HTTPException(status_code=500, detail="DB Insert Failed")
        app_id = res.data[0]['id']
    except Exception as e:
        logger.error(f"DB Insert Error: {e}")
        raise HTTPException(status_code=500, detail="Database Error")

    # 2. ML Inference
    processed_df = preprocess_application(application)
    try:
        probs = model.predict_proba(processed_df)[0]
        prob_reject, prob_approve = probs[0], probs[1]
    except Exception as e:
        logger.error(f"Inference Error: {e}")
        # Fallback if model fails (rare)
        prob_approve = 0.5
        prob_reject = 0.5

    # Logic Fix: Penalize confidence if no Credit Score (User Request)
    if application.credit_score is None:
        # Reduce approval probability by 10% to reflect uncertainty
        if prob_approve > 0.5:
             prob_approve *= 0.9
             prob_reject = 1.0 - prob_approve
    
    
    risk_score = prob_reject * 100
    if risk_score < 30: risk_band = "low"
    elif risk_score < 70: risk_band = "medium"
    else: risk_band = "high"

    pos_factors, neg_factors = get_risk_factors(application, prob_approve, dti_val)
    
    # 4. Bank Suitability (Phase 3 Fix: Always Run Logic)
    bank_results = []
    has_high_suitability_bank = False
    
    try:
        # Find matching loan type using CANONICAL ID
        loan_type_data = next((item for item in bank_loan_data.get("loan_types", []) 
                               if item["id"] == canonical_loan_type), None)
        
        if loan_type_data and "bank_comparison" in loan_type_data:
            banks = loan_type_data["bank_comparison"]
            
            for bank in banks:
                suitability = "medium"
                reasons = []
                
                # Logic: Bank Specific Rules vs User Profile
                
                # A. Credit Score Rules
                bank_name_lower = bank['bank'].lower()
                is_top_tier = bank_name_lower in ['sbi', 'hdfc bank', 'icici bank']
                
                if application.credit_score:
                    if application.credit_score >= 750:
                        reasons.append("Excellent credit score")
                        if risk_band == "low": suitability = "high"
                    elif application.credit_score < 650:
                        suitability = "low"
                        reasons.append("Credit score below preferred threshold")
                else:
                    # No Credit History
                    if is_top_tier:
                         suitability = "low"
                         reasons.append("Credit history typically required")
                    else:
                         reasons.append("May verify alternate income proofs")

                # B. Risk Band Impact
                if risk_band == "high":
                    suitability = "low"
                    reasons.append("High risk profile")
                elif risk_band == "low" and not reasons:
                    suitability = "high"
                    reasons.append("Strong profile match")

                # C. DTI Impact
                if dti_val > 0.5:
                     suitability = "low"
                     reasons.append("High DTI ratio")

                # Dedupe Reasons
                reasons = list(set(reasons))
                if not reasons: reasons.append("Standard eligibility met")
                
                if suitability == "high" or suitability == "medium":
                    has_high_suitability_bank = True

                bank_entry = {
                    "application_id": app_id,
                    "bank_name": bank['bank'],
                    "suitability": suitability,
                    "reason": "; ".join(reasons)
                }
                bank_results.append(bank_entry)
                supabase.table("bank_suitability").insert(bank_entry).execute()
        else:
             logger.warning(f"Loan Type {canonical_loan_type} not found in bank_loan_data")
             
    except Exception as e:
        logger.error(f"Bank Logic Error: {e}")

    # 5. Determine Final Decision & Schemes
    # Decision is APPROVE if at least one bank is viable, else REVIEW/REJECT
    
    final_decision = "approve" if has_high_suitability_bank else "reject"
    
    # If ML is super confident about rejection, override (but keep banks visible)
    if prob_approve < 0.2: 
        final_decision = "reject"
    
    # 6. Scheme Recommendations (If Rejected or High Risk)
    scheme_results = []
    if final_decision != "approve" or risk_band == "high" or application.credit_score is None:
        try:
            schemes = schemes_data.get("schemes", [])
            for scheme in schemes:
                # Basic matching logic
                is_match = False
                match_reason = ""
                
                # Category Match
                scheme_cat = scheme.get("category", "").lower() 
                app_cat_map = {
                    "business": "enterprise", 
                    "msme_loan": "enterprise",
                    "agriculture_loan": "agricultur", # Matches "Agricultural Credit", "Agricultural Insurance"
                    "home_loan": "housing", # Matches "Housing Finance..."
                    "education_loan": "education", # Matches "Education Loans"
                    "personal_loan": "urban livelihood" # Matches "Urban Livelihood..." (NULM)
                }
                required_cat = app_cat_map.get(canonical_loan_type, "general")
                
                # Loose match: e.g. "enterprise" in "Enterprise Development"
                if required_cat in scheme_cat or scheme_cat == "general":
                    is_match = True
                    match_reason = f"Matches your loan category ({required_cat})"

                # If match, add it
                if is_match:
                    # For API Response (Pydantic Model)
                    api_rec = {
                        "scheme_id": scheme.get("id", "generic"),
                        "scheme_name": scheme.get("name", "Unknown Scheme"),
                        "reason": match_reason
                    }
                    scheme_results.append(api_rec)
                    
                    # For DB Persistence (Schema likely app_id, scheme_id, scheme_name, reason)
                    db_rec = {
                        "application_id": app_id,
                        "scheme_id": scheme.get("id"), # Fix: Include scheme_id
                        "scheme_name": scheme.get("name", "Unknown Scheme"),
                        "reason": match_reason
                    }
                    supabase.table("scheme_recommendations").insert(db_rec).execute()
        except Exception as e:
            logger.error(f"Scheme insert error: {e}")

    # 7. Insert Analysis Results (Source of Truth)
    analysis_data = {
        "application_id": app_id,
        "risk_score": float(risk_score),
        "risk_band": risk_band,
        "ml_probability": float(prob_approve),
        "decision_summary": f"{final_decision}", # Store simple decision for now or kept detailed. User asked for distinct status.
        "positive_factors": json.loads(json.dumps(pos_factors)),
        "negative_factors": json.loads(json.dumps(neg_factors))
    }
    supabase.table("analysis_results").insert(analysis_data).execute()

    # CRITICAL FIX: Update loan_applications status to match final decision
    # This ensures Dashboard and DB are in sync with the logic that considers Bank Suitability
    supabase.table("loan_applications").update({"status": final_decision}).eq("id", app_id).execute()

    return {
        "application_id": app_id,
        "loan_type": canonical_loan_type,
        "risk_score": float(risk_score),
        "risk_band": risk_band,
        "prediction": final_decision, # Return the calculated decision (including bank logic)
        "confidence": float(prob_approve),
        "positive_factors": pos_factors,
        "negative_factors": neg_factors,
        "bank_suitability": bank_results,
        "schemes_suggested": scheme_results,
        "decision_summary": analysis_data["decision_summary"],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

if __name__ == "__main__":
    uvicorn.run("fastapi_backend:app", host="0.0.0.0", port=8000, reload=True)
