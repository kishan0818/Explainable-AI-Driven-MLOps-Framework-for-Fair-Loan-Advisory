import json
import os

# Define input file path
INPUT_FILE = os.path.join(os.path.dirname(__file__), '../TWXAI_backend/data/bank_loan_data.json')

def seed_bank_profiles():
    try:
        with open(INPUT_FILE, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: Could not find {INPUT_FILE}")
        return

    # Schema: bank_name, risk_appetite, max_dti, min_cibil_preference, employment_flexibility, psl_focus
    
    # Mapping based on known profiles. 
    # NOTE: In a real scenario, this would be parsed dynamically if the JSON had this data.
    # Since the JSON is loan-centric, we map the known banks to their profiles manually strictly for the demo.
    
    banks = {
        "SBI": {
            "risk_appetite": "low",
            "max_dti": 50,
            "min_cibil_preference": 700,
            "employment_flexibility": "low",
            "psl_focus": "true"
        },
        "PNB": {
            "risk_appetite": "low",
            "max_dti": 50,
            "min_cibil_preference": 680,
            "employment_flexibility": "low",
            "psl_focus": "true"
        },
        "HDFC Bank": {
            "risk_appetite": "medium",
            "max_dti": 60,
            "min_cibil_preference": 720,
            "employment_flexibility": "medium",
            "psl_focus": "false"
        },
        "ICICI Bank": {
            "risk_appetite": "medium",
            "max_dti": 60,
            "min_cibil_preference": 710,
            "employment_flexibility": "medium",
            "psl_focus": "false"
        },
        "Axis Bank": {
            "risk_appetite": "medium",
            "max_dti": 60,
            "min_cibil_preference": 710,
            "employment_flexibility": "medium",
            "psl_focus": "false"
        }
    }

    print("-- SQL Seed Data for bank_profiles")
    print("DELETE FROM bank_profiles;") # Optional clean slate
    print("INSERT INTO bank_profiles (bank_name, risk_appetite, max_dti, min_cibil_preference, employment_flexibility, psl_focus) VALUES")
    
    values = []
    for name, b in banks.items():
        # SQL Boolean: true/false (no quotes)
        val = f"('{name}', '{b['risk_appetite']}', {b['max_dti']}, {b['min_cibil_preference']}, '{b['employment_flexibility']}', {b['psl_focus']})"
        values.append(val)
    
    print(",\n".join(values) + ";")

if __name__ == "__main__":
    seed_bank_profiles()
