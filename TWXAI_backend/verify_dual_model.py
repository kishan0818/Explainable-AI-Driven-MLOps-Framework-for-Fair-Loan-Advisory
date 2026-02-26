
import requests
import json
import random
import numpy as np

API_URL = "http://localhost:8000"

def verify_predict():
    print("\n--- Verifying Prediction & Dual Model ---")
    
    # Normal Request (Using known safe values)
    normal_payload = {
      "Income": 50000,
      "LoanAmount": 100000,
      "CreditScore": 750,
      "EmploymentStatus": 0, # Employed
      "LoanTerm": 12,
      "Age": 30,
      "Gender": "Male",
      "MaritalStatus": "Single",
      "EducationLevel": "Graduate",
      "ResidentialStatus": "Owned",
      "Dependents": 0,
      "DebtToIncomeRatio": 0.2,
      "LoanPurpose": "Business",
      "AccountBalance": 10000,
      "PaymentHistory": 1,
      "EmploymentHistory": 5
    }

    try:
        print("Sending Normal Request...")
        res = requests.post(f"{API_URL}/analyze-application", json=normal_payload)
        if res.status_code == 200:
            data = res.json()
            print(f"✅ Normal Prediction Status: {res.status_code}")
            print(f"   Active Model: {data.get('model_version')}")
        else:
            print(f"❌ Error: {res.text}")
    except Exception as e:
        print(f"❌ Request failed: {e}")

    # Drifted Request (Extreme values to trigger drift)
    print("\n--- Simulating Drift ---")
    drift_payload = normal_payload.copy()
    drift_payload["Income"] = 100000000 # Very high income
    drift_payload["LoanAmount"] = 500000000 # Very high loan
    drift_payload["CreditScore"] = 300 # Very low
    
    try:
        print("Sending Drifted Request...")
        res = requests.post(f"{API_URL}/analyze-application", json=drift_payload)
        if res.status_code == 200:
            data = res.json()
            print(f"✅ Drifted Prediction Status: {res.status_code}")
            print(f"   Active Model: {data.get('model_version')}")
            # We expect either a switch or at least a log in the backend. 
            # Ideally the model_version might change if switching logic triggered.
        else:
            print(f"❌ Error: {res.text}")
    except Exception as e:
        print(f"❌ Drift Request failed: {e}")

if __name__ == "__main__":
    verify_predict()
