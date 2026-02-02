
import os
import requests
import json
from dotenv import load_dotenv

# Try loading from .env first
load_dotenv()
api_key = os.getenv("PERPLEXITY_API_KEY")

# If not found, try reading .env.local from parent
if not api_key:
    try:
        with open("../.env.local", "r") as f:
            for line in f:
                if "PERPLEXITY_API_KEY" in line:
                    api_key = line.split("=")[1].strip()
                    break
    except Exception as e:
        print(f"Error reading .env.local: {e}")

print(f"API Key found: {api_key[:5]}...{api_key[-5:] if api_key else 'None'}")

if not api_key:
    print("CRITICAL: No API Key found.")
    exit(1)

url = "https://api.perplexity.ai/chat/completions"

payload = {
    "model": "sonar",
    "messages": [
        {"role": "system", "content": "Be precise."},
        {"role": "user", "content": "Test connection."}
    ]
}

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Response:", response.json()['choices'][0]['message']['content'])
    else:
        print("Error Response:", response.text)
except Exception as e:
    print(f"Request failed: {e}")
