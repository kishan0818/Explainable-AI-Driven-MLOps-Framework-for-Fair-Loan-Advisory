import sys
import os
import pandas as pd
import warnings
import random
import json

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

if not fastapi_backend.xgb_model:
    print("❌ XGBoost Failed to Load. Exiting.")
    exit(1)

print("✅ XGBoost Model Loaded. Starting Randomized Search...")

# Defined Ranges/Options for all attributes
ranges = {
    "Age": [21, 25, 30, 35, 45, 55],
    "Income": [20000, 30000, 50000, 80000, 120000, 200000],
    "LoanAmount": [50000, 100000, 200000, 500000, 1000000, 2000000],
    "CreditScore": [600, 650, 700, 720, 750, 800, 850],
    "MonthsEmployed": [6, 12, 24, 36, 60, 120],
    "NumCreditLines": [0, 1, 2, 5, 10],
    "InterestRate": [8.0, 10.0, 12.0, 15.0, 18.0, 24.0],
    "LoanTerm": [12, 24, 36, 48, 60],
    "ExistingEMI": [0, 5000, 10000, 20000, 50000], # Used to calc DTI
    "Education": ["High School", "Bachelor's", "Master's", "PhD"],
    "EmploymentType": ["Full-time", "Self-employed", "Unemployed"], # Model values
    "MaritalStatus": ["Single", "Married", "Divorced", "Widowed"],
    "HasMortgage": ["Yes", "No"],
    "HasDependents": ["Yes", "No"],
    "LoanPurpose": ["Personal", "Education", "Home", "Business", "Auto"],
    "HasCoSigner": ["Yes", "No"]
}

# Mapping inputs back to raw form if needed, but here we use model-ready strings mostly.
# We will construct the `input_data` dictionary directly.

passing_profiles = []
num_iterations = 20000

print(f"Sampling {num_iterations} random profiles...")

for i in range(num_iterations):
    
    # Randomly sample features
    age = random.choice(ranges["Age"])
    inc = random.choice(ranges["Income"])
    amt = random.choice(ranges["LoanAmount"])
    score = random.choice(ranges["CreditScore"])
    months = random.choice(ranges["MonthsEmployed"])
    num_lines = random.choice(ranges["NumCreditLines"])
    rate = random.choice(ranges["InterestRate"])
    term = random.choice(ranges["LoanTerm"])
    emi = random.choice(ranges["ExistingEMI"])
    
    # Logical constraints
    if emi > inc * 0.8: continue # Skip unrealistic high EMI
    
    dti = (emi / inc) if inc > 0 else 0
    
    edu = random.choice(ranges["Education"])
    emp = random.choice(ranges["EmploymentType"])
    mar = random.choice(ranges["MaritalStatus"])
    mort = random.choice(ranges["HasMortgage"])
    dep = random.choice(ranges["HasDependents"])
    purpose = random.choice(ranges["LoanPurpose"])
    cosign = random.choice(ranges["HasCoSigner"])

    # Prepare Dataframe
    input_data = {
        'Age': age,
        'Income': inc,
        'LoanAmount': amt,
        'CreditScore': score,
        'MonthsEmployed': months,
        'NumCreditLines': num_lines,
        'InterestRate': rate,
        'LoanTerm': term,
        'DTIRatio': dti,
        'Education': edu,
        'EmploymentType': emp,
        'MaritalStatus': mar,
        'HasMortgage': mort,
        'HasDependents': dep,
        'LoanPurpose': purpose,
        'HasCoSigner': cosign
    }
    
    df_xgb = pd.DataFrame([input_data])
    
    try:
        # Encode & Scale
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
            
        prob = float(probs[1])
        
        if prob > 0.5:
            # Save Raw Attributes
            profile = input_data.copy()
            profile["ExistingEMI"] = emi
            profile["Probability"] = f"{prob:.4f}"
            profile["DTIRatio"] = f"{dti:.2f}"
            
            passing_profiles.append(profile)
            
            if len(passing_profiles) >= 100: # Capture up to 100 diverse profiles
                break
                
    except Exception as e:
        pass

print(f"\nFound {len(passing_profiles)} eligible profiles (capped at 100):")
print("-" * 80)
# Print a few samples
for p in passing_profiles[:10]:
    print(f"Inc: {p['Income']} | Amt: {p['LoanAmount']} | Score: {p['CreditScore']} | Prob: {p['Probability']}")
print("...")
print("-" * 80)

# Save to file
output_file = "eligible_profiles.json"
with open(output_file, 'w') as f:
    json.dump(passing_profiles, f, indent=2)
    
print(f"\n✅ Profiles saved to {output_file}")
