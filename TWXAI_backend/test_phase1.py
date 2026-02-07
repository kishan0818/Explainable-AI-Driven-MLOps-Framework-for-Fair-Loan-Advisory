"""
Phase 1 Verification Script
Tests the authoritative /analyze-application endpoint
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_phase1_analysis():
    print("🚀 Starting Phase 1 Verification...")
    print("=" * 60)
    
    # 1. Health Check
    try:
        res = requests.get(f"{BASE_URL}/health")
        print(f"Health Status: {res.status_code} | {res.json()}")
    except Exception as e:
        print(f"❌ Backend not reachable: {e}")
        return

    # 2. Prepare Mock Payload
    payload = {
        "name": "Phase1 TestUser",
        "age": 35,
        "income": 60000,
        "loan_amount": 500000,
        "loan_type": "home_loan",
        "employment_type": "salaried",
        "existing_emi": 10000,
        "credit_score": 720,
        # Optional
        "months_employed": 36,
        "dti_ratio": 0.3
    }

    # 2.5 Test Dev Session (Expect 401 without token)
    print("\n🕵️ Testing /dev/session (Auth Check)...")
    headers = {"Authorization": "Bearer MOCK_TOKEN_FOR_DEV"}
    
    try:
        res = requests.get(f"{BASE_URL}/dev/session", headers=headers)
        if res.status_code == 401:
            print("   ✅ Auth Enforced (Got 401 as expected with invalid token)")
        elif res.status_code == 200:
            print(f"   ℹ️ Dev Session Accessible: {res.json()}")
        else:
            print(f"   ⚠️ Unexpected Status: {res.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")

    # 3. Call Endpoint (Requires Auth)
    print("\n📡 Sending Request to /analyze-application...")
    print(json.dumps(payload, indent=2))
    
    try:
        res = requests.post(f"{BASE_URL}/analyze-application", json=payload, headers=headers)
        
        if res.status_code == 401:
            print("\n⚠️ Auth Required. Automation limited without valid user token.")
            print("To verify manually, use the Frontend or Postman with a valid login token.")
        elif res.status_code == 200:
            data = res.json()
            print("\n✅ Success! Analysis Result:")
            print(f"   App ID: {data['application_id']}")
            print(f"   Risk: {data['risk_score']} ({data['risk_band']})")
            print(f"   ML Prob: {data['ml_probability']}")
            print(f"   Banks Found: {len(data['bank_suitability'])}")
            if data['bank_suitability']:
                print(f"   Top Bank: {data['bank_suitability'][0]['bank_name']} ({data['bank_suitability'][0]['suitability']})")
            print(f"   Improvements: {len(data['improvement_recommendations'])}")
            
            # Validation
            if data['risk_score'] is not None and data['bank_suitability'] is not None:
                 print("\n🎉 PHASE 1 VERIFICATION PASSED: Structure is authoritative.")
            else:
                 print("\n⚠️ Result incomplete.")
                 
        else:
            print(f"\n❌ Error {res.status_code}: {res.text}")
            
    except Exception as e:
        print(f"Request Error: {e}")

if __name__ == "__main__":
    test_phase1_analysis()
