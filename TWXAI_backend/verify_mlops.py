
import sys
import os
import pandas as pd
import numpy as np
import warnings
import logging

# Suppress warnings
warnings.filterwarnings("ignore")

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'TWXAI_backend'))

# Load Env
from dotenv import load_dotenv
load_dotenv(os.path.join("TWXAI_backend", ".env"))

# Import backend
import fastapi_backend

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("VerifyMLOps")

def run_verification():
    print("\n--- 1. Loading Components ---")
    try:
        fastapi_backend.load_ml_components()
    except Exception as e:
        print(f"❌ Failed to load components: {e}")
        return

    controller = fastapi_backend.ml_controller
    if not controller:
        print("❌ MLOps Controller NOT initialized.")
        return
    
    if not controller.sm_model:
        print("⚠️ Controller initialized but SM Model is missing (DB issue?).")
    else:
        print(f"✅ Controller Active. Model Version: {controller.active_version}")

    print("\n--- 2. Preparing Mock Input ---")
    # Simulation of Data preparation in analyze_application
    input_data = {
        'Age': 35,
        'Income': 50000.0,
        'LoanAmount': 200000.0,
        'CreditScore': 720,
        'MonthsEmployed': 36,
        'NumCreditLines': 2,
        'InterestRate': 12.5,
        'LoanTerm': 24,
        'DTIRatio': 0.1,
        'Education': "Bachelor's",
        'EmploymentType': "Full-time",
        'MaritalStatus': "Single",
        'HasMortgage': 'No',
        'HasDependents': 'Yes',
        'LoanPurpose': "Education",
        'HasCoSigner': 'No',
        # Context
        'Gender': 'Male' 
    }
    
    df_raw = pd.DataFrame([input_data])
    print(f"Input Shape: {df_raw.shape}")
    
    # Encode & Scale (Simulating backend logic)
    # DROP Gender (Context only)
    df_model = df_raw.drop(columns=['Gender'], errors='ignore')
    
    if not fastapi_backend.xgb_encoders:
        print("⚠️ Encoders missing in backend. Attempting manual load...")
        try:
            import joblib
            path = os.path.join("results_rf_smote_controlled_pca1_wocs", "models", "xgboost_encoders.joblib")
            if os.path.exists(path):
                fastapi_backend.xgb_encoders = joblib.load(path)
                print(f"✅ Manual load success. Keys: {list(fastapi_backend.xgb_encoders.keys())}")
            else:
                print(f"❌ File not found: {path}")
        except Exception as e:
            print(f"❌ Manual load failed: {e}")

    df_encoded = df_model.copy()
    if fastapi_backend.xgb_encoders:
        print(f"Encoders available: {list(fastapi_backend.xgb_encoders.keys())}")
        for col, enc in fastapi_backend.xgb_encoders.items():
            if col in df_encoded.columns:
                print(f"Encoding {col} with {type(enc)}")
                try: 
                    # Reshape for sklearn encoders if needed
                    val = df_encoded[col].values.reshape(-1, 1)
                    # Handle different encoder types
                    if hasattr(enc, 'transform'):
                        trans = enc.transform(val)
                        # If OneHot, this might return multiple cols. 
                        # Assuming Ordinal or LabelEncoder for XGBoost simple usage here?
                        # Or maybe it expects a replacement?
                        # Let's see what it returns.
                        # For now, blindly assign and see type
                        if hasattr(trans, 'toarray'): trans = trans.toarray()
                        
                        # Flatten if 1D
                        if trans.shape[1] == 1:
                            trans = trans.ravel()
                            df_encoded[col] = trans
                        else:
                            print(f"⚠️ Encoder returned {trans.shape[1]} columns for {col}. Assigning object?")
                            df_encoded[col] = 0 # Fallback for now to avoid crash
                            
                except Exception as e: 
                    print(f"Encoding failed for {col}: {e}")
                    df_encoded[col] = 0
    else:
        print("⚠️ No encoders found in fastapi_backend.xgb_encoders")

    print("Data Sample after encoding:")
    print(df_encoded.head(1).T)
    print("Data Types:")
    print(df_encoded.dtypes)
    
    model_input = df_encoded.values
    if fastapi_backend.xgb_scaler:
        model_input = fastapi_backend.xgb_scaler.transform(df_encoded)
        print("✅ Data Scaled.")
        
    print("\n--- 3. Running Prediction via Controller ---")
    try:
        result = controller.predict(
            model_input=model_input,
            raw_input=df_raw,
            context=input_data
        )
        
        print("\n--- 4. Results ---")
        print(f"Probability: {result.get('probability')}")
        print(f"Model ID:    {result.get('model_version')}")
        
        metrics = result.get('metrics', {})
        print(f"Fairness Metric (Age Parity): {metrics.get('demographic_parity_age')}")
        
        if result.get('shap_values') is not None:
             print("✅ SHAP Values generated.")
        else:
             print("⚠️ SHAP Values missing.")
             
        if result.get('error'):
            print(f"❌ Error reported: {result.get('error')}")
        else:
            print("✅ Pipeline Success.")

    except Exception as e:
        print(f"❌ Execution Exception: {e}")

if __name__ == "__main__":
    run_verification()
