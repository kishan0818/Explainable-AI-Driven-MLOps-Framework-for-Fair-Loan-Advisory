"""
Simple test to check if frontend is working
"""

import requests
import json

def test_frontend():
    """Test frontend API"""
    print("Testing Frontend API...")
    
    test_data = {
        "name": "Test User",
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
    
    try:
        response = requests.post(
            "http://localhost:3000/api/predict",
            json=test_data,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                prediction = data.get('data', {})
                print(f"\n[OK] Frontend API Working!")
                print(f"Prediction: {prediction.get('prediction', 'N/A')}")
                print(f"Confidence: {prediction.get('confidence', 'N/A')}")
                print(f"Model Version: {prediction.get('modelVersion', 'N/A')}")
                return True
            else:
                print(f"[FAIL] Frontend API returned error")
                return False
        else:
            print(f"[FAIL] Frontend API failed with status: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"[FAIL] Frontend API request failed: {e}")
        return False

if __name__ == "__main__":
    test_frontend()
