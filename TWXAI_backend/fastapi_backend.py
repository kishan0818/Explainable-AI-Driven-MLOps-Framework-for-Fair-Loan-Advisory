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

class ExplainabilityFactor(BaseModel):
    factor: str
    feature: str
    impact: str  # high | medium | low
    direction: str  # positive | negative

class ImprovementRecommendation(BaseModel):
    recommendation_type: str
    current_value: float
    recommended_value: float
    message: str

class ModelPrediction(BaseModel):
    application_id: str
    risk_score: float
    risk_band: str
    prediction: str  # approve/reject (based on ML prob)
    ml_probability: float  # Changed from confidence to match DB
    positive_factors: List[ExplainabilityFactor]  # Changed from List[str] to structured objects
    negative_factors: List[ExplainabilityFactor]  # Changed from List[str] to structured objects
    bank_suitability: List[BankSuitabilityResult]
    scheme_recommendations: List[SchemeRecommendationResult]  # Changed from schemes_suggested to match DB
    improvement_recommendations: List[ImprovementRecommendation]  # NEW: Counterfactual guidance
    decision_summary: str
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

def generate_explainability_factors(app: LoanApplication, prob_approve: float, dti: float):
    """Generate structured XAI factors with feature attribution"""
    pos_factors = []
    neg_factors = []
    
    # Credit Score Analysis
    if app.credit_score:
        if app.credit_score >= 750:
            pos_factors.append({
                "factor": "Excellent credit score demonstrates strong repayment history",
                "feature": "credit_score",
                "impact": "high",
                "direction": "positive"
            })
        elif app.credit_score >= 700:
            pos_factors.append({
                "factor": "Good credit score indicates reliable borrower",
                "feature": "credit_score",
                "impact": "medium",
                "direction": "positive"
            })
        elif app.credit_score < 650:
            neg_factors.append({
                "factor": "Low credit score indicates higher default risk",
                "feature": "credit_score",
                "impact": "high",
                "direction": "negative"
            })
    else:
        neg_factors.append({
            "factor": "No credit history available for assessment",
            "feature": "credit_score",
            "impact": "medium",
            "direction": "negative"
        })
    
    # DTI Ratio Analysis
    if dti < 0.3:
        pos_factors.append({
            "factor": "Low debt-to-income ratio shows healthy financial management",
            "feature": "existing_emi",
            "impact": "high",
            "direction": "positive"
        })
    elif dti > 0.5:
        neg_factors.append({
            "factor": "High debt-to-income ratio increases default probability",
            "feature": "existing_emi",
            "impact": "high",
            "direction": "negative"
        })
    
    # Loan-to-Income Ratio
    loan_to_income = app.loan_amount / app.income if app.income > 0 else 999
    if loan_to_income > 8:
        neg_factors.append({
            "factor": "Loan amount significantly exceeds monthly income capacity",
            "feature": "loan_amount",
            "impact": "high",
            "direction": "negative"
        })
    elif loan_to_income < 5:
        pos_factors.append({
            "factor": "Loan amount is reasonable relative to income",
            "feature": "loan_amount",
            "impact": "medium",
            "direction": "positive"
        })
    
    # Income Level
    if app.income >= 50000:
        pos_factors.append({
            "factor": "Strong income level supports loan repayment capacity",
            "feature": "income",
            "impact": "medium",
            "direction": "positive"
        })
    elif app.income < 20000:
        neg_factors.append({
            "factor": "Low income may limit repayment capacity",
            "feature": "income",
            "impact": "medium",
            "direction": "negative"
        })
    
    # Co-applicant/Co-signer
    if app.has_co_signer:
        pos_factors.append({
            "factor": "Co-applicant reduces lender risk through shared responsibility",
            "feature": "has_co_signer",
            "impact": "medium",
            "direction": "positive"
        })
    elif not app.has_co_signer and app.loan_amount > 500000:
        neg_factors.append({
            "factor": "Large loan without co-applicant increases risk profile",
            "feature": "has_co_signer",
            "impact": "medium",
            "direction": "negative"
        })
    
    # ML Model Confidence
    if prob_approve > 0.7:
        pos_factors.append({
            "factor": "AI model shows high confidence in approval prediction",
            "feature": "ml_probability",
            "impact": "high",
            "direction": "positive"
        })
    elif prob_approve < 0.5:
        neg_factors.append({
            "factor": "AI model predicts elevated default risk",
            "feature": "ml_probability",
            "impact": "high",
            "direction": "negative"
        })
    
    return pos_factors, neg_factors

def generate_improvement_recommendations(
    app: LoanApplication, 
    prob_approve: float, 
    dti: float,
    risk_band: str,
    app_id: str
) -> List[Dict[str, Any]]:
    """
    Generate counterfactual recommendations for loan approval improvement
    Returns list of actionable recommendations with specific numeric targets
    """
    recommendations = []
    
    # Only generate recommendations for rejected or borderline cases
    if prob_approve >= 0.7:
        return recommendations  # Strong approval - no recommendations needed
    
    # 1. Reduce Loan Amount (if loan-to-income ratio is high)
    loan_to_income = app.loan_amount / app.income if app.income > 0 else 999
    if loan_to_income > 6:
        # Calculate recommended loan amount (5x monthly income)
        recommended_amount = int(app.income * 5)
        recommendations.append({
            "recommendation_type": "reduce_loan_amount",
            "current_value": float(app.loan_amount),
            "recommended_value": float(recommended_amount),
            "message": f"Reducing loan amount to ₹{recommended_amount:,} (5× monthly income) significantly improves approval chances by lowering default risk."
        })
    
    # 2. Improve Credit Score
    if app.credit_score and app.credit_score < 700:
        target_score = 700 if app.credit_score < 650 else 750
        recommendations.append({
            "recommendation_type": "improve_credit_score",
            "current_value": float(app.credit_score),
            "recommended_value": float(target_score),
            "message": f"Improving credit score to {target_score}+ reduces perceived default risk and increases approval likelihood."
        })
    elif not app.credit_score:
        recommendations.append({
            "recommendation_type": "improve_credit_score",
            "current_value": 0.0,
            "recommended_value": 700.0,
            "message": "Building a credit history with score 700+ significantly improves approval chances for institutional loans."
        })
    
    # 3. Increase Income (if income is low relative to loan)
    if app.income < 30000 and app.loan_amount > 200000:
        target_income = int(app.loan_amount / 5)
        recommendations.append({
            "recommendation_type": "increase_income",
            "current_value": float(app.income),
            "recommended_value": float(target_income),
            "message": f"Increasing monthly income to ₹{target_income:,} through additional income sources improves loan eligibility."
        })
    
    # 4. Add Co-applicant
    if not app.has_co_signer and (app.loan_amount > 500000 or risk_band == "high"):
        recommendations.append({
            "recommendation_type": "add_coapplicant",
            "current_value": 0.0,
            "recommended_value": 1.0,
            "message": "Adding a co-applicant with stable income reduces lender risk and significantly improves approval chances."
        })
    
    # 5. Wait Period (if recently employed or multiple recent applications)
    if app.months_employed and app.months_employed < 6:
        recommendations.append({
            "recommendation_type": "wait_period",
            "current_value": float(app.months_employed or 0),
            "recommended_value": 12.0,
            "message": "Waiting until 12+ months of employment establishes income stability and improves approval likelihood."
        })
    
    # Limit to top 3 most impactful recommendations
    return recommendations[:3]

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


# ... (Previous imports and setup remain unchanged up to line 311)

@app.post("/predict", response_model=ModelPrediction)
async def predict(application: LoanApplication, user_payload: dict = Depends(verify_token)):
    user_id = user_payload.get("sub")
    
    # 1. Sync User to public.users (FK Requirement)
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
        "status": "processed" # Mark as processed initially
    }
    
    try:
        res = supabase.table("loan_applications").insert(app_data).execute()
        if not res.data:
             raise HTTPException(status_code=500, detail="DB Insert Failed")
        app_id = res.data[0]['id']
    except Exception as e:
        logger.error(f"DB Insert Error: {e}")
        raise HTTPException(status_code=500, detail="Database Error")

    # 3. ML Inference
    processed_df = preprocess_application(application)
    try:
        probs = model.predict_proba(processed_df)[0]
        prob_reject, prob_approve = probs[0], probs[1]
    except Exception as e:
        logger.error(f"Inference Error: {e}")
        # Fallback if model fails (should be rare)
        prob_approve = 0.5
        prob_reject = 0.5

    # Logic Fix: Penalize confidence if no Credit Score (User Request)
    if application.credit_score is None:
        # Reduce approval probability by 5% to reflect uncertainty (Relaxed from 10%)
        if prob_approve > 0.5:
             prob_approve *= 0.95
             prob_reject = 1.0 - prob_approve
    
    risk_score = prob_reject * 100
    if risk_score < 30: risk_band = "low"
    elif risk_score < 70: risk_band = "medium"
    else: risk_band = "high"

    pos_factors, neg_factors = generate_explainability_factors(application, prob_approve, dti_val)
    
    # 4. Bank Suitability (PERSONALIZED LOGIC)
    bank_results = []
    has_high_suitability_bank = False
    
    try:
        # Find matching loan type using CANONICAL ID
        loan_type_data = next((item for item in bank_loan_data.get("loan_types", []) 
                               if item["id"] == canonical_loan_type), None)
        
        if loan_type_data and "bank_comparison" in loan_type_data:
            banks = loan_type_data["bank_comparison"]
            
            for bank in banks:
                suitability = "medium" # Default start, but logic will override
                reasons = []
                
                # Logic: Bank Specific Rules vs User Profile
                bank_name_lower = bank['bank'].lower()
                is_top_tier = bank_name_lower in ['sbi', 'hdfc bank', 'icici bank']
                
                # A. Credit Score Rules
                if application.credit_score:
                    if application.credit_score >= 750:
                        reasons.append("Excellent credit score matches top-tier criteria")
                    elif application.credit_score >= 700:
                        reasons.append("Good credit score")
                    elif application.credit_score < 650:
                        suitability = "low"
                        reasons.append("Credit score below preferred threshold")
                else:
                    # No Credit History
                    if is_top_tier:
                         suitability = "low"
                         reasons.append("Credit history typically required for this bank")
                    else:
                         reasons.append("Bank may verify alternate income proofs")

                # B. Risk Band Impact
                if risk_band == "high":
                    suitability = "low"
                    reasons.append("High risk profile flagged by AI")
                elif risk_band == "low" and not "Credit score below preferred threshold" in reasons:
                    # Upgrade to high if low risk and no major blockers
                    suitability = "high"
                    reasons.append("Strong AI safety rating")

                # C. DTI Impact
                if dti_val > 0.5:
                     suitability = "low"
                     reasons.append(f"High DTI ratio ({int(dti_val*100)}%)")
                elif dti_val < 0.3:
                     reasons.append("Healthy debt-to-income ratio")

                # D. Income Thresholds (Example)
                if is_top_tier and application.income < 25000:
                     suitability = "low"
                     reasons.append("Income below tier-1 bank preference")

                # Consolidate Reason
                # If low suitability, prioritize negative reasons. If high, positive.
                if suitability == "low":
                    # Filter for negative reasons only if possible, or show top blocker
                    neg_reasons = [r for r in reasons if "below" in r or "High" in r or "required" in r]
                    final_reason = neg_reasons[0] if neg_reasons else (reasons[0] if reasons else "Does not meet primary criteria")
                elif suitability == "high":
                    pos_reasons = [r for r in reasons if "Excellent" in r or "Strong" in r or "Healthy" in r]
                    final_reason = pos_reasons[0] if pos_reasons else "Strong profile match"
                else:
                    final_reason = reasons[0] if reasons else "Meets standard eligibility"

                if suitability == "high":
                    has_high_suitability_bank = True

                bank_entry = {
                    "application_id": app_id,
                    "bank_name": bank['bank'],
                    "suitability": suitability,
                    "reason": final_reason
                }
                bank_results.append(bank_entry)
                supabase.table("bank_suitability").insert(bank_entry).execute()
        else:
             logger.warning(f"Loan Type {canonical_loan_type} not found in bank_loan_data")
             
    except Exception as e:
        logger.error(f"Bank Logic Error: {e}")

    # 5. Determine Final Decision & Schemes
    # Decision is APPROVE if ML Confident AND (High Suitability Bank OR Medium/Low Risk)
    
    # Relaxed Decision Logic:
    # Lower threshold to 0.45 (was 0.5)
    
    ml_confidence_high = prob_approve > 0.6
    final_decision = "approve"
    
    if prob_approve < 0.45:
        final_decision = "reject"
    elif not has_high_suitability_bank and risk_band == "high":
        # Even if > 0.45, if it's high risk calculate (likely <70 score), check if we can savage it
        # If score is nearing 0.45, it means risk score is ~55 which is Medium. 
        # High risk > 70 => prob_approve < 0.3. So this block handles contradictions if logic changes.
        final_decision = "reject"
        
    # 6. Scheme Recommendations (Strict Matching via rules.json)
    scheme_results = []
    # Always check schemes, but prioritize them if rejected
    try:
        schemes = schemes_data.get("schemes", [schemes_data]) if isinstance(schemes_data, list) else schemes_data.get("schemes", [])
        
        # Get Allowed Categories for this Loan Type from rules_data
        # rules.json structure: "government_schemes_integration" -> "scheme_categories" -> { "category": ["id", ...] }
        # Map canonical_loan_type to rules category keys
        
        loan_cat_map = {
            "agriculture_loan": "agriculture_rural",
            "msme_loan": "msme_business",
            "home_loan": "housing",
            "education_loan": "education",
            # personal_loan maps to welfare schemes if applicable
            "personal_loan": ["women_empowerment", "minority_welfare", "sc_st_welfare"] 
        }
        
        target_cats = loan_cat_map.get(canonical_loan_type)
        if isinstance(target_cats, str): target_cats = [target_cats]
        elif target_cats is None: target_cats = []
        
        # Extract allowed scheme sub-IDs (e.g. "mudra_yojana") from rules
        allowed_scheme_groups = []
        scheme_cats_config = rules_data.get("government_schemes_integration", {}).get("scheme_categories", {})
        
        for cat in target_cats:
            allowed_scheme_groups.extend(scheme_cats_config.get(cat, []))
            
        # Also need to match scheme.id against these groups OR scheme.category
        
        for scheme in schemes:
            is_match = False
            match_reason = ""
            
            scheme_id = scheme.get("id", "").lower()
            
            # 1. Direct Rule Match (Best)
            # Check if scheme_id starts with any allowed group (e.g. matches 'mudra_shishu' to 'mudra_yojana' loosely or strict list?)
            # The rules.json lists ["mudra_yojana", "cgtmse"] etc.
            # schemes.json has ids "stand_up_india", "pmay_urban", "mudra_card", "pmmy" (Pradhan Mantri Mudra Yojana)
            
            # We do a containment check or keyword match against allowed groups
            if any(group in scheme_id or group in scheme.get("name", "").lower().replace(" ", "_") for group in allowed_scheme_groups):
                is_match = True
                match_reason = f"Recommended scheme for {canonical_loan_type.replace('_', ' ')}"
            
            # 2. Strict Category Backup
            # If rules mapping missed it, check the scheme's internal category very strictly
            if not is_match:
                scheme_cat = scheme.get("category", "").lower()
                clean_loan_type = canonical_loan_type.replace("_loan", "")
                
                # Only allow specific keywords
                strict_keywords = {
                    "home_loan": ["housing", "home"],
                    "education_loan": ["education", "student"],
                    "agriculture_loan": ["agriculture", "farmer", "crop"],
                    "msme_loan": ["enterprise", "business", "msme", "mudra"],
                    "personal_loan": ["livelihood", "skill", "inclusion"] # Very limited
                }
                
                keywords = strict_keywords.get(canonical_loan_type, [])
                if any(k in scheme_cat for k in keywords):
                    is_match = True
                     # Double check it is NOT conflicting (e.g. don't show business scheme for home loan)
                    match_reason = f"Matches {clean_loan_type} category"

            # 3. Filter specific demographics (e.g. Women only schemes)
            if is_match:
                if "women" in scheme_id or "women" in scheme.get("name", "").lower():
                     if application.gender and application.gender.lower() != "female":
                         is_match = False # Gender mismatch
                
                # Check for SC/ST if available
                # (Skipping complex demographic checks for now to avoid over-filtering, relying on main category)
            
            if is_match:
                # For API Response
                api_rec = {
                    "scheme_id": scheme.get("id", "generic"),
                    "scheme_name": scheme.get("name", "Unknown Scheme"),
                    "reason": match_reason
                }
                scheme_results.append(api_rec)
                
                # For DB Persistence
                db_rec = {
                    "application_id": app_id,
                    "scheme_id": scheme.get("id"),
                    "scheme_name": scheme.get("name", "Unknown Scheme"),
                    "reason": match_reason
                }
                supabase.table("scheme_recommendations").insert(db_rec).execute()
    except Exception as e:
        logger.error(f"Scheme insert error: {e}")

    # 7. Insert Analysis Results (Source of Truth)
    # Generate contextual decision summary
    loan_to_income = application.loan_amount / application.income if application.income > 0 else 999
    
    if final_decision == "approve":
        if prob_approve > 0.75:
            decision_summary = f"Strong approval likelihood ({int(prob_approve*100)}%) based on excellent credit profile and low risk indicators."
        else:
            decision_summary = f"Moderate approval likelihood ({int(prob_approve*100)}%) - profile meets basic criteria with some areas of concern."
    else:
        # For rejections, highlight primary reason
        if dti_val > 0.5:
            decision_summary = f"Approval likelihood is low ({int(prob_approve*100)}%) due to high debt-to-income ratio - reducing existing obligations is recommended."
        elif application.credit_score and application.credit_score < 650:
            decision_summary = f"Approval likelihood is low ({int(prob_approve*100)}%) due to credit score below threshold - improving credit history is essential."
        elif loan_to_income > 8:
            decision_summary = f"Approval likelihood is low ({int(prob_approve*100)}%) due to loan amount significantly exceeding income capacity."
        else:
            decision_summary = f"Approval likelihood is low ({int(prob_approve*100)}%) based on overall risk assessment - review improvement recommendations."
    
    # Mapping: confidence = prob_approve
    analysis_data = {
        "application_id": app_id,
        "risk_score": float(risk_score),
        "risk_band": risk_band,
        "ml_probability": float(prob_approve), # This IS the confidence
        "decision_summary": decision_summary,
        "positive_factors": json.loads(json.dumps(pos_factors)),
        "negative_factors": json.loads(json.dumps(neg_factors))
    }
    supabase.table("analysis_results").insert(analysis_data).execute()

    # 8. Generate and Persist Improvement Recommendations
    improvement_recs = generate_improvement_recommendations(
        application, prob_approve, dti_val, risk_band, app_id
    )

    for rec in improvement_recs:
        rec_data = {
            "application_id": app_id,
            "recommendation_type": rec["recommendation_type"],
            "current_value": rec["current_value"],
            "recommended_value": rec["recommended_value"],
            "message": rec["message"]
        }
        try:
            supabase.table("improvement_recommendations").insert(rec_data).execute()
        except Exception as e:
            logger.error(f"Failed to insert recommendation: {e}")

    # Sync Status
    supabase.table("loan_applications").update({"status": final_decision}).eq("id", app_id).execute()

    return {
        "application_id": app_id,
        "loan_type": canonical_loan_type,
        "risk_score": float(risk_score),
        "risk_band": risk_band,
        "prediction": final_decision,
        "ml_probability": float(prob_approve),  # Changed from confidence to match DB
        "positive_factors": pos_factors,
        "negative_factors": neg_factors,
        "bank_suitability": bank_results,
        "scheme_recommendations": scheme_results,  # Changed from schemes_suggested to match DB
        "improvement_recommendations": improvement_recs,  # NEW: Counterfactual guidance
        "decision_summary": decision_summary,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# --- RAG / Chatbot Route ---
class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    answer: str
    related_schemes: List[str] = []
    related_rules: List[str] = []

@app.post("/chat", response_model=ChatResponse)
async def chat_rag(request: ChatRequest):
    """
    RAG Endpoint using Perplexity API
    Context: rules.json and schemes.json
    """
    PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
    if not PERPLEXITY_API_KEY:
        # Check .env.local if not in .env (hack for integration)
        try:
            with open("../.env.local", "r") as f:
                for line in f:
                    if "PERPLEXITY_API_KEY" in line:
                         PERPLEXITY_API_KEY = line.split("=")[1].strip()
                         break
        except:
             pass
             
    if not PERPLEXITY_API_KEY:
        raise HTTPException(status_code=500, detail="Perplexity API Key missing")

    # Prepare Context (summarized or full)
    # We strip very large texts to save tokens if needed, but these files are small enough.
    # Convert JSON to string
    context_str = f"RULES_DATA: {json.dumps(rules_data)[:15000]}... \n SCHEMES_DATA: {json.dumps(schemes_data)[:10000]}..."
    
    system_prompt = f"""You are an intelligent assistant for a Loan Application Platform called TWXAI. 
    You have access to the following OFFICIAL documents:
    1. Rules Data (RBI guidelines, eligibility, compliance)
    2. Government Schemes (Details of schemes like MUDRA, PMAY, etc.)
    
    CONTEXT:
    {context_str}
    
    INSTRUCTIONS:
    - Answer the user's query based strictly on the provided Context.
    - If the user asks about eligibility, cite the specific rule or scheme.
    - If the query is general (e.g. "What is a home loan?"), answer generally but mention relevant schemes if applicable.
    - Be concise and professional.
    """
    
    payload = {
        "model": "sonar",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": request.query}
        ]
    }
    
    headers = {
        "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
        "Content-Type": "application/json"
    }
    
    answer = "I'm sorry, I couldn't process your request at the moment."
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post("https://api.perplexity.ai/chat/completions", json=payload, headers=headers, timeout=30.0)
            
        if resp.status_code == 200:
            res_json = resp.json()
            answer = res_json['choices'][0]['message']['content']
        else:
            logger.error(f"Perplexity API Error: {resp.text}")
            answer = "I am currently unable to access the knowledge base. Please try again later."
            
    except Exception as e:
        logger.error(f"RAG Error: {e}")
        answer = "An error occurred while generating the response."

    # Heuristic for related items
    related_s = []
    related_r = []
    
    lower_ans = answer.lower()
    # Simple extraction of mentioned schemes
    if "mudra" in lower_ans: related_s.append("mudra")
    if "pmay" in lower_ans: related_s.append("pmay_urban")
    
    return {
        "answer": answer,
        "related_schemes": related_s,
        "related_rules": related_r
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("fastapi_backend:app", host="0.0.0.0", port=8000, reload=True)
