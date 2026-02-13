
import os
import json
import logging
from validator import RegulatoryValidator
from search_recovery import SearchRecovery
from scraper import RegulatoryScraper
from governance import GovernanceManager

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("RegulatoryMonitor")

class RegulatoryMonitor:
    def __init__(self):
        self.validator = RegulatoryValidator()
        self.search = SearchRecovery()
        self.scraper = RegulatoryScraper()
        self.governance = GovernanceManager()

    def load_json(self, path: str) -> dict:
        if not os.path.exists(path): return {}
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def process_schemes(self, file_path: str = "schemes.json"):
        logger.info(f"Starting audit for {file_path}")
        data = self.load_json(file_path)
        if not data or "schemes" not in data:
            logger.error("Invalid schemes JSON structure")
            return

        updated_schemes = []
        changes_made = False

        for scheme in data["schemes"]:
            sid = scheme.get("id", "approx")
            url = scheme.get("url")
            name = scheme.get("name")
            
            logger.info(f"Checking Scheme: {name} ({sid})")

            try:
                # 1. Validation
                is_valid = self.validator.check_url(url)
                
                new_url = url
                status = "VERIFIED"
                notes = "URL Accessible"

                if not is_valid:
                    logger.warning(f"❌ Broken URL: {url}")
                    self.governance.log_action("VALIDATION", sid, "BROKEN", f"URL Unreachable: {url}")
                    
                    # 2. Recovery
                    recovered_url = self.search.find_new_url(name)
                    if recovered_url:
                        logger.info(f"✅ Recovered URL: {recovered_url}")
                        new_url = recovered_url
                        status = "RECOVERED"
                        notes = f"Updated URL from {url} to {recovered_url}"
                        changes_made = True
                    else:
                        status = "FAILED"
                        notes = "Could not recover URL"
                
                # 3. Content Check (Scraping)
                # Only scrape if valid or recovered
                if status in ["VERIFIED", "RECOVERED"] and new_url:
                    current_hash = scheme.get("content_hash")
                    new_hash = self.validator.get_content_hash(new_url)
                    
                    if new_hash and new_hash != current_hash:
                        logger.info(f"⚠️ Content Change Detected for {sid}")
                        content = self.scraper.fetch_page_content(new_url)
                        keywords = self.scraper.extract_keywords(content)
                        
                        # Update metadata
                        scheme["content_hash"] = new_hash
                        scheme["last_content_check"] = keywords
                        notes += " | Content Updated"
                        changes_made = True
                        self.governance.log_action("CONTENT", sid, "CHANGED", f"Hash change detected. Keywords: {keywords}")

                # Update Scheme Object
                scheme["url"] = new_url
                scheme["last_verified_status"] = status
                scheme["last_verified_notes"] = notes
            
            except Exception as e:
                logger.error(f"Error processing {sid}: {e}")
                scheme["last_verified_status"] = "ERROR"
                scheme["last_verified_notes"] = str(e)
            
            updated_schemes.append(scheme)

        # 4. Save if changes
        if changes_made:
            logger.info("Changes detected. Saving file...")
            data["schemes"] = updated_schemes
            success, version = self.governance.safe_save(file_path, data)
            if success:
                logger.info(f"✅ Schemes updated to version {version}")
        else:
            logger.info("No actionable changes found.")

    def process_rules(self, file_path: str = "rules.json"):
        logger.info(f"Starting audit for {file_path}")
        data = self.load_json(file_path)
        if not data or "metadata" not in data:
            logger.error("Invalid rules JSON structure")
            return

        changes_made = False
        sources = data["metadata"].get("source_documents", [])
        updated_sources = []
        
        # Check Source Documents
        for url in sources:
            logger.info(f"Checking Rule Source: {url}")
            try:
                is_valid = self.validator.check_url(url)
                if not is_valid:
                    logger.warning(f"❌ Broken Rule Source: {url}")
                    self.governance.log_action("VALIDATION", "rules.json", "BROKEN", f"Source Unreachable: {url}")
                    # Attempt recovery? (Maybe complex for generic PDF links, simplified for now)
                else:
                    self.governance.log_action("VALIDATION", "rules.json", "VERIFIED", f"Source Accessible: {url}")
            except Exception as e:
                logger.error(f"Error checking {url}: {e}")
            
            # Keep URL (we don't remove broken ones automatically yet, just log)
            updated_sources.append(url)

        # 4. Save if changes (Logic can be extended to update URLs if recovery implemented for docs)
        # For now, we mainly audit rules.
        if changes_made:
             success, version = self.governance.safe_save(file_path, data)

if __name__ == "__main__":
    monitor = RegulatoryMonitor()
    # Check if files exist before running default
    if os.path.exists("schemes.json"):
        monitor.process_schemes("schemes.json")
    if os.path.exists("rules.json"):
        monitor.process_rules("rules.json")
