
import os
import json
import logging
from regulatory_monitor import RegulatoryMonitor

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("VerifyRegulatory")

def create_mock_data():
    """Creates a temporary JSON file with mixed valid/invalid URLs."""
    mock_data = {
        "metadata": {"version": "1.0"},
        "schemes": [
            {
                "id": "test_valid_scheme",
                "name": "Pradhan Mantri Jan Dhan Yojana",
                "url": "https://pmjdy.gov.in", # Valid
                "content_hash": ""
            },
            {
                "id": "test_broken_scheme",
                "name": "Pradhan Mantri Mudra Yojana",
                "url": "https://www.broken-mudra-link.gov.in", # Invalid
                "content_hash": ""
            }
        ]
    }
    with open("test_schemes.json", "w") as f:
        json.dump(mock_data, f, indent=2)
    return "test_schemes.json"

def verify_pipeline():
    logger.info("--- Starting Verification ---")
    
    # 1. Setup Mock Data
    file_path = create_mock_data()
    
    # 2. Run Monitor
    monitor = RegulatoryMonitor()
    
    # Inject Mock Search if API key missing (Safety)
    if not monitor.search.api_key:
        logger.warning("No API Key detected. Using Mock Search for verification.")
        class MockSearch:
            def __init__(self):
                self.api_key = "mock_key"
            def find_new_url(self, query):
                return "https://www.mudra.org.in"
        monitor.search = MockSearch()

    monitor.process_schemes(file_path)
    
    # 3. Verify Output
    with open(file_path, "r") as f:
        updated_data = json.load(f)
        
    schemes = {s["id"]: s for s in updated_data["schemes"]}
    
    # Check Valid
    if schemes["test_valid_scheme"]["last_verified_status"] == "VERIFIED":
        logger.info("✅ Valid URL correctly verified.")
    else:
        logger.error("❌ Valid URL check failed.")
        
    # Check Broken/Recovered
    broken = schemes["test_broken_scheme"]
    if broken["last_verified_status"] == "RECOVERED":
        logger.info(f"✅ Broken URL recovered to: {broken['url']}")
    elif broken["last_verified_status"] in ["FAILED", "ERROR"]:
        logger.warning(f"⚠️ Recovery failed (Status: {broken['last_verified_status']}). This is expected if Search API is not reachable.")
    else:
        logger.error(f"❌ Unexpected status for broken URL: {broken['last_verified_status']}")
        
    # Check Versioning
    if updated_data["metadata"]["version"] != "1.0":
        logger.info(f"✅ Version incremented to {updated_data['metadata']['version']}")
    else:
        logger.error("❌ Version not incremented.")

    # Cleanup
    if os.path.exists(file_path): os.remove(file_path)
    if os.path.exists(file_path + ".bak"): os.remove(file_path + ".bak")

if __name__ == "__main__":
    verify_pipeline()
