"""
Test the frontend fix by making a prediction request
"""

import requests
import json

def test_prediction_response():
    """Test that the prediction response has all required fields"""
    print("Testing prediction response structure...")
    
    test_application = {
        "name": "Test User",
        "age": 30,
        "income": 50000,
        "loan_amount": 500000,  # Backend expects snake_case
        "loan_type": "home",    # Backend expects snake_case
        "employment_type": "salaried",  # Backend expects snake_case
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
        # Test backend directly
        print("\n1. Testing Backend Response...")
        response = requests.post(
            "http://localhost:8000/predict",
            json=test_application,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print("[OK] Backend response successful")
            
            # Check required fields
            required_fields = [
                'application_id', 'prediction', 'confidence', 'probability',
                'shap_values', 'risk_factors', 'recommendations', 
                'model_version', 'timestamp', 'rules_applied', 'schemes_suggested'
            ]
            
            missing_fields = []
            for field in required_fields:
                if field not in data:
                    missing_fields.append(field)
            
            if missing_fields:
                print(f"[WARNING] Missing fields: {missing_fields}")
            else:
                print("[OK] All required fields present")
            
            # Check array fields
            array_fields = ['shap_values', 'risk_factors', 'recommendations', 'rules_applied', 'schemes_suggested']
            for field in array_fields:
                if field in data:
                    if isinstance(data[field], list):
                        print(f"[OK] {field} is an array with {len(data[field])} items")
                    else:
                        print(f"[ERROR] {field} is not an array: {type(data[field])}")
                else:
                    print(f"[ERROR] {field} is missing")
            
            print(f"\nPrediction: {data.get('prediction', 'N/A')}")
            print(f"Confidence: {data.get('confidence', 'N/A'):.2f}")
            print(f"Risk Factors: {len(data.get('risk_factors', []))}")
            print(f"Recommendations: {len(data.get('recommendations', []))}")
            print(f"SHAP Values: {len(data.get('shap_values', []))}")
            print(f"Rules Applied: {len(data.get('rules_applied', []))}")
            print(f"Schemes Suggested: {len(data.get('schemes_suggested', []))}")
            
        else:
            print(f"[FAIL] Backend response failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"[FAIL] Backend request failed: {e}")
        return False
    
    try:
        # Test frontend API
        print("\n2. Testing Frontend API Response...")
        response = requests.post(
            "http://localhost:3000/api/predict",
            json=test_application,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                prediction = data.get('data', {})
                print("[OK] Frontend API response successful")
                
                # Check if arrays exist
                array_fields = ['shapValues', 'riskFactors', 'recommendations', 'rulesApplied', 'schemesSuggested']
                for field in array_fields:
                    if field in prediction:
                        if isinstance(prediction[field], list):
                            print(f"[OK] {field} is an array with {len(prediction[field])} items")
                        else:
                            print(f"[ERROR] {field} is not an array: {type(prediction[field])}")
                    else:
                        print(f"[ERROR] {field} is missing")
            else:
                print("[FAIL] Frontend API returned error")
                return False
        else:
            print(f"[FAIL] Frontend API failed: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"[FAIL] Frontend API request failed: {e}")
        return False
    
    print("\n" + "=" * 50)
    print("Frontend fix test completed!")
    return True

if __name__ == "__main__":
    test_prediction_response()
