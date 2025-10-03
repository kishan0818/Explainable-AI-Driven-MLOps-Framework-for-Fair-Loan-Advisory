"""
Test the complete integration between frontend and backend
"""

import requests
import json
import time

def test_complete_integration():
    """Test the complete integration"""
    print("Testing TWXAI Complete Integration...")
    print("=" * 60)
    
    # Test data
    test_application = {
        "name": "John Doe",
        "age": 30,
        "income": 50000,
        "loanAmount": 500000,
        "loanType": "home",
        "employmentType": "salaried",
        "creditScore": 750,
        "dtiRatio": 0.3,
        "monthsEmployed": 24,
        "numCreditLines": 2,
        "interestRate": 12.0,
        "loanTerm": 24,
        "education": "Bachelor",
        "maritalStatus": "Single",
        "hasMortgage": False,
        "hasDependents": False,
        "loanPurpose": "Purchase",
        "hasCoSigner": False,
        "gender": "male",
        "casteCategory": "general",
        "locationType": "urban"
    }
    
    # Test 1: Backend Health
    print("\n1. Testing Backend Health...")
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("[OK] Backend is healthy")
            print(f"   Model loaded: {response.json().get('model_loaded', False)}")
        else:
            print(f"[FAIL] Backend health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"[FAIL] Backend not accessible: {e}")
        return False
    
    # Test 2: Backend Prediction
    print("\n2. Testing Backend Prediction...")
    try:
        response = requests.post(
            "http://localhost:8000/predict",
            json=test_application,
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            print("[OK] Backend prediction working")
            print(f"   Prediction: {data.get('prediction', 'N/A')}")
            print(f"   Confidence: {data.get('confidence', 'N/A'):.2f}")
            print(f"   Model version: {data.get('model_version', 'N/A')}")
            print(f"   Rules applied: {len(data.get('rules_applied', []))}")
            print(f"   Schemes suggested: {len(data.get('schemes_suggested', []))}")
        else:
            print(f"[FAIL] Backend prediction failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"[FAIL] Backend prediction error: {e}")
        return False
    
    # Test 3: Frontend API
    print("\n3. Testing Frontend API...")
    try:
        response = requests.post(
            "http://localhost:3000/api/predict",
            json=test_application,
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                prediction = data.get('data', {})
                print("[OK] Frontend API working")
                print(f"   Prediction: {prediction.get('prediction', 'N/A')}")
                print(f"   Confidence: {prediction.get('confidence', 'N/A'):.2f}")
                print(f"   Model version: {prediction.get('model_version', 'N/A')}")
            else:
                print("[FAIL] Frontend API returned error")
                return False
        else:
            print(f"[FAIL] Frontend API failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"[FAIL] Frontend API error: {e}")
        return False
    
    # Test 4: Frontend Health
    print("\n4. Testing Frontend Health...")
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("[OK] Frontend is accessible")
        else:
            print(f"[FAIL] Frontend health check failed: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"[FAIL] Frontend not accessible: {e}")
    
    print("\n" + "=" * 60)
    print("Integration test completed!")
    print("\nAccess Points:")
    print("- Frontend: http://localhost:3000")
    print("- Backend: http://localhost:8000")
    print("- API Docs: http://localhost:8000/docs")
    
    return True

if __name__ == "__main__":
    print("Waiting for services to start...")
    time.sleep(3)
    test_complete_integration()
