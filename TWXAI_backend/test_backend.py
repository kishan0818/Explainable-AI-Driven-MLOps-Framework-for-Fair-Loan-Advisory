"""
Test script for the FastAPI backend
"""

import requests
import json
import time

def test_backend():
    """Test the backend endpoints"""
    base_url = "http://localhost:8000"
    
    print("Testing TWXAI Backend...")
    print("=" * 50)
    
    # Test 1: Health check
    print("\n1. Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print("[OK] Health check passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"[FAIL] Health check failed: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"[FAIL] Health check failed: {e}")
        return False
    
    # Test 2: Model status
    print("\n2. Testing model status endpoint...")
    try:
        response = requests.get(f"{base_url}/model/status", timeout=5)
        if response.status_code == 200:
            print("[OK] Model status endpoint working")
            data = response.json()
            print(f"   Model version: {data.get('model_version', 'N/A')}")
            print(f"   Status: {data.get('status', 'N/A')}")
            print(f"   Accuracy: {data.get('accuracy', 'N/A')}%")
        else:
            print(f"[FAIL] Model status failed: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"[FAIL] Model status failed: {e}")
    
    # Test 3: Prediction endpoint
    print("\n3. Testing prediction endpoint...")
    test_application = {
        "name": "John Doe",
        "age": 30,
        "income": 50000,
        "loan_amount": 500000,
        "loan_type": "home",
        "employment_type": "salaried",
        "credit_score": 750,
        "dti_ratio": 0.3,
        "months_employed": 24,
        "num_credit_lines": 2,
        "interest_rate": 12.0,
        "loan_term": 24,
        "education": "Bachelor",
        "marital_status": "Single",
        "has_mortgage": False,
        "has_dependents": False,
        "loan_purpose": "Purchase",
        "has_co_signer": False,
        "gender": "male",
        "caste_category": "general",
        "location_type": "urban"
    }
    
    try:
        response = requests.post(
            f"{base_url}/predict",
            json=test_application,
            timeout=10
        )
        if response.status_code == 200:
            print("[OK] Prediction endpoint working")
            data = response.json()
            print(f"   Application ID: {data.get('application_id', 'N/A')}")
            print(f"   Prediction: {data.get('prediction', 'N/A')}")
            print(f"   Confidence: {data.get('confidence', 'N/A'):.2f}")
            print(f"   Model version: {data.get('model_version', 'N/A')}")
            
            # Show SHAP values
            shap_values = data.get('shap_values', [])
            if shap_values:
                print("   Top SHAP features:")
                for i, shap in enumerate(shap_values[:3]):
                    print(f"     {i+1}. {shap['feature']}: {shap['impact']:.3f}")
            
            # Show rules applied
            rules_applied = data.get('rules_applied', [])
            if rules_applied:
                print(f"   Rules applied: {len(rules_applied)}")
            
            # Show schemes suggested
            schemes_suggested = data.get('schemes_suggested', [])
            if schemes_suggested:
                print(f"   Schemes suggested: {len(schemes_suggested)}")
                for scheme in schemes_suggested[:2]:
                    print(f"     - {scheme['name']} (Score: {scheme['match_score']})")
        else:
            print(f"[FAIL] Prediction failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"[FAIL] Prediction failed: {e}")
    
    print("\n" + "=" * 50)
    print("Backend testing completed!")

if __name__ == "__main__":
    # Wait a bit for the server to start
    print("Waiting for backend to start...")
    time.sleep(3)
    test_backend()
