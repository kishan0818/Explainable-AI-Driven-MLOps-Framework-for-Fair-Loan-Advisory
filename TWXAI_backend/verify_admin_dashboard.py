import requests
import os
import json

# Configuration
API_URL = "http://localhost:8000"
ADMIN_SECRET = "twxai_admin"  # Default secret used in backend

def test_admin_stats():
    print(f"\n--- Testing GET {API_URL}/admin/stats ---")
    headers = {"X-Admin-Secret": ADMIN_SECRET}
    try:
        res = requests.get(f"{API_URL}/admin/stats", headers=headers)
        if res.status_code == 200:
            print("✅ Success!")
            print(json.dumps(res.json(), indent=2))
        else:
            print(f"❌ Failed: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_regulatory_logs():
    print(f"\n--- Testing GET {API_URL}/admin/logs/regulatory ---")
    headers = {"X-Admin-Secret": ADMIN_SECRET}
    try:
        res = requests.get(f"{API_URL}/admin/logs/regulatory", headers=headers)
        if res.status_code == 200:
            print("✅ Success!")
            data = res.json()
            print(f"Logs found: {len(data.get('logs', []))}")
            if data['logs']:
                print("Last log:", data['logs'][0])
        else:
            print(f"❌ Failed: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_mlops_logs():
    print(f"\n--- Testing GET {API_URL}/admin/logs/mlops ---")
    headers = {"X-Admin-Secret": ADMIN_SECRET}
    try:
        res = requests.get(f"{API_URL}/admin/logs/mlops", headers=headers)
        if res.status_code == 200:
            print("✅ Success!")
            data = res.json()
            print(f"Logs found: {len(data.get('logs', []))}")
        else:
            print(f"❌ Failed: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_unauthorized_access():
    print(f"\n--- Testing Unauthorized Access ---")
    try:
        res = requests.get(f"{API_URL}/admin/stats") # No header
        if res.status_code == 403 or res.status_code == 422: # 422 because Header(...) is required
            print(f"✅ Success: Request rejected with {res.status_code}")
        else:
            print(f"❌ Failed: Expected 403/422, got {res.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_admin_stats()
    test_regulatory_logs()
    test_mlops_logs()
    test_unauthorized_access()
