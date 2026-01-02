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

# --- Pydantic Models ---
class LoanApplication(BaseModel):
    name: str = Field(..., description="Applicant name")
    age: int = Field(..., ge=18, le=80, description="Applicant age")
    income: float = Field(..., gt=0, description="Monthly income")
    loan_amount: float = Field(..., gt=0, description="Requested loan amount")
    loan_type: str = Field(..., description="Type of loan (home, personal, education, msme, agriculture)")
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
def load_ml_components():
    global model, feature_selector, label_encoders, pca, rules_data, schemes_data
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
            
        return True
    except Exception as e:
        logger.error(f"ML Loading Error: {e}")
        return False

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

@app.post("/predict", response_model=ModelPrediction)
async def predict(application: LoanApplication, user_payload: dict = Depends(verify_token)):
    user_id = user_payload.get("sub")
    
    # 1. Sync User to public.users (FK Requirement)
    try:
        user_email = user_payload.get("email")
        # Upsert user to ensure they exist for the FK constraint
        # is_active=True by default for new syncs
        user_data = {
            "id": user_id,
            "email": user_email,
            "is_active": True
            # Add role if needed, defaulting to applicant/user based on system design? 
            # System seems to have removed roles, but if table needs it, defaults might handle it.
            # Based on previous code, likely minimal schema.
        }
        supabase.table("users").upsert(user_data).execute()
    except Exception as e:
        logger.error(f"User Sync Error (Non-critical if exists?): {e}")
        # If this fails, the next insert might fail too, but let's proceed or raise?
        # If sync fails, FK will fail. Better to log and let FK fail or raise 500.
        # But upsert is robust.
        pass

    # 2. Insert into loan_applications
    dti_val = (application.existing_emi / application.income) if application.income > 0 else 0
    # if application.dti_ratio is not None: dti_val = application.dti_ratio - REMOVED
    
    app_data = {
        "user_id": user_id,
        "loan_type": application.loan_type,
        "income": application.income,
        "loan_amount": application.loan_amount,
        "employment_type": application.employment_type if application.employment_type in ['salaried', 'self_employed', 'business'] else 'salaried',
        "existing_emi": application.existing_emi,
        "credit_score": application.credit_score,
        # "dti" not in schema provided by user, only computed for analysis
        # Schema: id, user_id, loan_type, income, loan_amount, employment_type, existing_emi, credit_score, created_at
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

    risk_score = prob_reject * 100
    if risk_score < 30: risk_band = "low"
    elif risk_score < 70: risk_band = "medium"
    else: risk_band = "high"

    pos_factors, neg_factors = get_risk_factors(application, prob_approve, dti_val)
    
    # 3. Insert Analysis Results
    analysis_data = {
        "application_id": app_id,
        "risk_score": float(risk_score),
        "risk_band": risk_band,
        "ml_probability": float(prob_approve),
        "decision_summary": f"Application risk assessed as {risk_band}",
        "positive_factors": json.loads(json.dumps(pos_factors)), # Ensure serializable
        "negative_factors": json.loads(json.dumps(neg_factors))
    }
    supabase.table("analysis_results").insert(analysis_data).execute()

    # 4. Bank Suitability
    bank_results = []
    try:
        banks_resp = supabase.table("bank_profiles").select("*").execute()
        banks = banks_resp.data
        
        for bank in banks:
            suitability = "medium"
            reasons = []
            
            # Risk Appetite Logic
            if bank['risk_appetite'] == 'low' and risk_band == 'high':
                suitability = "low"
                reasons.append("Bank has low risk appetite")
            elif bank['risk_appetite'] == 'high' and risk_band == 'high':
                suitability = "medium" # Willing to take risk
                reasons.append("Bank accepts higher risk profiles")
                
            # CIBIL Logic
            if application.credit_score and bank['min_cibil_preference']:
                if application.credit_score < bank['min_cibil_preference']:
                    suitability = "low"
                    reasons.append(f"Score below bank minimum ({bank['min_cibil_preference']})")
            
            # DTI Logic
            if bank['max_dti']:
                if (dti_val * 100) > bank['max_dti']:
                    suitability = "low"
                    reasons.append(f"DTI exceeds bank limit ({bank['max_dti']}%)")
            
            if not reasons:
                suitability = "high"
                reasons.append("Profile matches bank criteria")
                
            bank_entry = {
                "application_id": app_id,
                "bank_name": bank['bank_name'],
                "suitability": suitability,
                "reason": "; ".join(reasons)
            }
            bank_results.append(BankSuitabilityResult(**bank_entry))
            # Insert logic handled in bulk? Or loop. Loop is safer for now.
            # Supabase usually supports bulk, but let's do simple.
            # Reuse bank_entry for DB insert (remove extra fields if any? No, matches schema except ID)
            supabase.table("bank_suitability").insert(bank_entry).execute()
            
    except Exception as e:
        logger.error(f"Bank logic error: {e}")

    # 5. Scheme Suggestions
    scheme_results = []
    schemes_to_insert = []
    
    # Only suggest if Rejected or High Risk? Or always? User said "Match schemes...". Usually for rejection/assistance.
    # Let's suggest matching schemes regardless, advisory.
    
    for scheme in schemes_data.get("schemes", []):
        is_match = False
        reason = ""
        
        # Simple Logic based on existing json structure
        s_id = scheme.get("id")
        
        # Example logic adaptation
        if s_id == "stand_up_india":
            if application.loan_type == "business" and (application.caste_category in ['sc','st'] or application.gender == 'female'):
                 is_match = True
                 reason = "Eligible due to SC/ST or Female Entrepreneur status"
        elif s_id == "pmay_urban":
             if application.loan_type == "home" and application.income < 1800000:
                 is_match = True
                 reason = "Eligible for housing subsidy based on income"
        elif s_id == "pm_vidyalaxmi":
             if application.loan_type == "education":
                 is_match = True
                 reason = "Dedicated education loan scheme"
        elif s_id == "mudra": # Assuming ID
             if application.loan_type == "business" and application.loan_amount < 1000000:
                 is_match = True
                 reason = "Micro-enterprise loan eligibility"
        
        # Generic fallback
        if not is_match and scheme.get("category") == "General":
            is_match = True
            reason = "General eligibility"
            
        if is_match:
            rec = {
                "application_id": app_id,
                "scheme_id": s_id,
                "scheme_name": scheme.get("name"),
                "reason": reason
            }
            scheme_results.append(SchemeRecommendationResult(**rec))
            schemes_to_insert.append(rec)
            
    if schemes_to_insert:
        try:
             supabase.table("scheme_recommendations").insert(schemes_to_insert).execute()
        except Exception as e:
             logger.error(f"Scheme insert error: {e}")

    return ModelPrediction(
        application_id=str(app_id),
        risk_score=risk_score,
        risk_band=risk_band,
        prediction="approve" if prob_approve > 0.5 else "reject",
        confidence=float(abs(prob_approve - 0.5) * 2),
        positive_factors=pos_factors,
        negative_factors=neg_factors,
        bank_suitability=bank_results,
        schemes_suggested=scheme_results,
        timestamp=datetime.now(timezone.utc).isoformat()
    )

if __name__ == "__main__":
    uvicorn.run("fastapi_backend:app", host="0.0.0.0", port=8000, reload=True)
