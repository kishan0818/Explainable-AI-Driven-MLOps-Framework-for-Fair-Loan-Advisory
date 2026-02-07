
import sys
import os
import json
import logging
from datetime import datetime

# Change Directory to TWXAI_backend to match server environment
# This ensures relative paths in fastapi_backend (like "rules.json") work correctly
TARGET_DIR = os.path.join(os.getcwd(), "TWXAI_backend")
if os.path.exists(TARGET_DIR):
    os.chdir(TARGET_DIR)
    sys.path.append(TARGET_DIR)
else:
    # Already in subdir?
    if os.path.exists("fastapi_backend.py"):
         sys.path.append(os.getcwd())
    else:
         print(f"❌ Cannot find TWXAI_backend directory. CWD: {os.getcwd()}")
         sys.exit(1)

try:
    # Direct import since we are now "inside" the package dir
    from fastapi_backend import (
        LoanApplication, 
        evaluate_rules, 
        evaluate_schemes, 
        build_explanation,
        load_ml_components,
        rules_data,
        schemes_data
    )
    import fastapi_backend as backend
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

# Initialize
print("🚀 Initializing Phase 2 Verification...")
if backend.load_ml_components():
    print("✅ ML & JSON Components Loaded")
else:
    print("⚠️ ML Component Load Failed (Expected if environment mismatch).")
    print("   Attempting manual load of Rules and Schemes for verification...")
    try:
        with open("rules.json", 'r') as f: backend.rules_data = json.load(f)
        with open("schemes.json", 'r') as f: backend.schemes_data = json.load(f)
        print("✅ Rules and Schemes manually loaded.")
    except Exception as e:
        print(f"❌ Critical: Could not load JSONs: {e}")
        sys.exit(1)

def run_test_case(name, app_data, expected_rule_status=None, expected_schemes=None):
    print(f"\n🧪 Test Case: {name}")
    print("-" * 40)
    
    # 1. Create Model
    try:
        app = LoanApplication(**app_data)
    except Exception as e:
        print(f"❌ Validation Error: {e}")
        return

    # 2. Run Rules
    print("   Evaluating Rules...")
    rule_results = evaluate_rules(app)
    
    # Check
    failed = [r for r in rule_results if r['status'] == 'failed']
    passed = [r for r in rule_results if r['status'] == 'passed']
    
    print(f"   -> {len(passed)} Rules Passed")
    print(f"   -> {len(failed)} Rules Failed")
    
    for f in failed:
        print(f"      ❌ FAILED: [{f['severity'].upper()}] {f['description']} -> {f['reason']}")
    for p in passed[:3]: # Show a few
        print(f"      ✅ PASSED: {p['description']}")

    # 3. Run Schemes
    print("   Evaluating Schemes...")
    schemes = evaluate_schemes(app)
    print(f"   -> {len(schemes)} Schemes Matched")
    for s in schemes:
        print(f"      🌟 MATCH: {s['scheme_name']} ({s['scheme_id']})")
        
    # 4. Explanation
    expl = build_explanation(75.5, "medium", rule_results, schemes, [])
    print(f"   Explanation Summary: {expl['summary']}")

# --- Cases ---

# Case 1: Ideal Borrower (Should Pass All Hard Rules)
run_test_case("Ideal Borrower - Home Loan", {
    "name": "Amit Sharma",
    "age": 35,
    "income": 80000,
    "loan_amount": 2500000,
    "loan_type": "home_loan",
    "employment_type": "salaried",
    "existing_emi": 15000,
    "credit_score": 780,
    "months_employed": 60,
    "gender": "male",
    "location_type": "urban"
})

# Case 2: Rule Failure - High DTI (Hard Rule)
run_test_case("High DTI Failure", {
    "name": "High Debt User",
    "age": 40,
    "income": 50000,
    "loan_amount": 1000000,
    "loan_type": "personal_loan",
    "employment_type": "salaried",
    "existing_emi": 35000, # 70% DTI
    "credit_score": 650
})

# Case 3: Priority Sector - Woman Entrepreneur
run_test_case("Woman Entrepreneur & Scheme", {
    "name": "Priya Singh",
    "age": 28,
    "income": 40000,
    "loan_amount": 500000,
    "loan_type": "business",
    "employment_type": "self_employed",
    "existing_emi": 5000,
    "credit_score": 700,
    "gender": "female",
    "loan_purpose": "business_expansion"
})

# Case 4: Senior Citizen (Constitutional Compliance)
run_test_case("Senior Citizen Benefits", {
    "name": "Senior User",
    "age": 65,
    "income": 30000,
    "loan_amount": 200000,
    "loan_type": "personal",
    "employment_type": "retired",
    "existing_emi": 0,
    "credit_score": 750
})

# Case 4 ...
run_test_case("Senior Citizen Benefits", {
    "name": "Senior User",
    "age": 65,
    "income": 30000,
    "loan_amount": 200000,
    "loan_type": "personal",
    "employment_type": "retired",
    "existing_emi": 0,
    "credit_score": 750
})

print("\n📦 Generating Sample JSON for Report (Phase 2.1 Verification)...")
# Mock a payload that triggered false negatives (e.g. General Category User failng SC/ST rule)
test_app = LoanApplication(**{
    "name": "General Category User",
    "age": 30,
    "income": 50000,
    "loan_amount": 1000000,
    "loan_type": "personal",
    "employment_type": "salaried",
    "existing_emi": 5000,
    "credit_score": 720,
    "caste_category": "general", # Should fail SC/ST rule
    "gender": "male" # Should fail Transgender/Women rules
})

# Run backend logic manually to get full objects
r_res = evaluate_rules(test_app)
s_res = evaluate_schemes(test_app)
# Simulating Risk Engine output for context
risk_score, risk_band = 45.0, "medium" 

expl = build_explanation(risk_score, risk_band, r_res, s_res, [])

# Construct Factors as per backend logic
boosters = [{"factor": f"Inclusion Algo: {r['description']}", "impact": "positive"} for r in expl['passed_rules_boosters']]
generic_passed = [{"factor": f"Passed Rule: {r['description']}", "impact": "positive"} for r in r_res if r['status'] == 'passed' and r not in expl['passed_rules_boosters']][:3]
pos_factors = boosters + generic_passed 

filtered_negative = expl['failed_rules_filtered']
neg_factors = [{"factor": f"Rule Violation: {r['description']}", "impact": "negative"} for r in filtered_negative]

response_mock = {
    "application_id": "phase2-1-verify-uuid",
    "risk_score": risk_score,
    "risk_band": risk_band,
    "ml_probability": 0.55,
    "prediction": "reject" if (risk_band == "high" or filtered_negative) else "approve",
    "decision_summary": expl["summary"],
    "positive_factors": pos_factors,
    "negative_factors": neg_factors,
    "bank_suitability": [],
    "scheme_recommendations": s_res,
    "improvement_recommendations": []
}


json_output = json.dumps(response_mock, indent=2)
print(json_output)

# Save to file for easy reading
with open("phase2_1_verify.json", "w", encoding="utf-8") as f:
    f.write(json_output)
print("\n💾 JSON Saved to phase2_1_verify.json")

# Assertions
print("\n🔎 Verifying Ethics & Wording...")
if "Rejected" in expl["summary"]:
    print("❌ FAILED: 'Rejected' found in summary.")
else:
    print("✅ PASSED: Summary uses advisory language.")
    
# Check for PSL in negative factors
psl_keywords = ["SC/ST", "Transgender", "Weaker Sections"]
found_psl_neg = False
for nf in neg_factors:
    txt = nf['factor']
    if any(k in txt for k in psl_keywords):
        print(f"❌ FAILED: PSL Rule found in negative factors: {txt}")
        found_psl_neg = True

if not found_psl_neg:
    print("✅ PASSED: No PSL/Inclusion rules in negative factors.")
    
print("\n✅ Verification Complete.")
