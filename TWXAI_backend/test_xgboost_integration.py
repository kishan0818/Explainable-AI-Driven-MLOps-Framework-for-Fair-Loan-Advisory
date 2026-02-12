
import sys
import os
import pandas as pd
import warnings

# Suppress warnings
warnings.filterwarnings("ignore")

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'TWXAI_backend'))

# Mock env
os.environ["SUPABASE_URL"] = "https://mock.supabase.co"
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "mock"

# Import backend
import fastapi_backend

print("Loading ML components...")
try:
    fastapi_backend.load_ml_components()
except Exception as e:
    print(f"Warning during loading: {e}")

# Check XGBoost
if fastapi_backend.xgb_model:
    print("✅ XGBoost Model Loaded Successfully.")
else:
    print("❌ XGBoost Failed to Load.")
    exit(1)

# Import LoanApplication definition
from fastapi_backend import LoanApplication

# Create Mock App Input
app_in = LoanApplication(
    name="Validation Test User",
    age=35,
    income=45000.0,
    loan_amount=200000.0,
    loan_type="Personal Loan",
    employment_type="Salaried",
    existing_emi=5000.0,
    credit_score=720,
    months_employed=36,
    num_credit_lines=2,
    interest_rate=12.5,
    loan_term=24,
    education="Bachelor's",
    marital_status="Single",
    has_mortgage=False,
    has_dependents=True,
    loan_purpose="Debt Consolidation",
    has_co_signer=False
)

print("\n--- Testing Prediction Logic ---")

try:
    # 1. DTI
    dti = (app_in.existing_emi / app_in.income) if app_in.income > 0 else 0
    
    # 2. Prepare Dataframe
    input_data = {
        'Age': app_in.age,
        'Income': app_in.income,
        'LoanAmount': app_in.loan_amount,
        'CreditScore': app_in.credit_score or 700, 
        'MonthsEmployed': app_in.months_employed or 12,
        'NumCreditLines': app_in.num_credit_lines or 1,
        'InterestRate': app_in.interest_rate or 10.0,
        'LoanTerm': app_in.loan_term or 12,
        'DTIRatio': dti,
        'Education': app_in.education or "Bachelor's",
        'EmploymentType': app_in.employment_type if app_in.employment_type in ['Full-time', 'Unemployed', 'Self-employed', 'Contract'] else 'Full-time',
        'MaritalStatus': app_in.marital_status or 'Single',
        'HasMortgage': 'Yes' if app_in.has_mortgage else 'No', 
        'HasDependents': 'Yes' if app_in.has_dependents else 'No',
        'LoanPurpose': app_in.loan_purpose or 'Other',
        'HasCoSigner': 'Yes' if app_in.has_co_signer else 'No'
    }
    
    df_xgb = pd.DataFrame([input_data])
    
    # 3. Encode & Scale
    if fastapi_backend.xgb_encoders:
        for col, enc in fastapi_backend.xgb_encoders.items():
            if col in df_xgb.columns:
                try: 
                    df_xgb[col] = enc.transform(df_xgb[col])
                except: 
                    df_xgb[col] = 0
                    
    if fastapi_backend.xgb_scaler:
        arr_xgb = fastapi_backend.xgb_scaler.transform(df_xgb)
        probs = fastapi_backend.xgb_model.predict_proba(arr_xgb)[0]
    else:
        probs = fastapi_backend.xgb_model.predict_proba(df_xgb.values)[0]
        
    print(f"Prediction Result: Default Probability = {probs[0]:.4f}")
    print(f"Approval Probability = {probs[1]:.4f}")
    print("✅ Inference Successful")

except Exception as e:
    print(f"❌ Inference Failed: {e}")
    import traceback
    traceback.print_exc()
