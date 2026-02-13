
import os
import json
import csv
import logging
from datetime import datetime
from typing import Dict, Any, List

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("GovernanceManager")

class GovernanceManager:
    """
    Manages version control, audit logging, and safe updates for JSON resources.
    """
    def __init__(self, log_file: str = "regulatory_audit_log.csv"):
        self.log_file = log_file
        self._ensure_log_file()

    def _ensure_log_file(self):
        """Creates the CSV log file with headers if it doesn't exist."""
        if not os.path.exists(self.log_file):
            with open(self.log_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(["Timestamp", "Action", "Target", "Status", "Details", "Version_From", "Version_To"])

    def log_action(self, action: str, target: str, status: str, details: str, v_from: str = "", v_to: str = ""):
        """Appends an entry to the audit log."""
        try:
            with open(self.log_file, 'a', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow([
                    datetime.utcnow().isoformat(),
                    action,
                    target,
                    status,
                    details,
                    v_from,
                    v_to
                ])
        except Exception as e:
            logger.error(f"Failed to write log: {e}")

    def increment_version(self, current_version: str) -> str:
        """Increments semantic version (Patch level). 1.0 -> 1.0.1"""
        try:
            parts = current_version.split('.')
            if len(parts) >= 3:
                parts[2] = str(int(parts[2]) + 1)
            elif len(parts) == 2:
                parts.append('1') # 1.0 -> 1.0.1
            else:
                return current_version + ".1"
            return ".".join(parts)
        except:
            return current_version # Fallback

    def safe_save(self, file_path: str, data: Dict, old_data: Dict = None):
        """
        Safely saves JSON with backup and version increment.
        """
        try:
            # 1. Create Backup
            if os.path.exists(file_path):
                backup_path = file_path + ".bak"
                with open(file_path, 'r', encoding='utf-8') as f:
                    old_content = f.read()
                with open(backup_path, 'w', encoding='utf-8') as f:
                    f.write(old_content)
            
            # 2. Increment Version in Metadata
            old_ver = "0.0.0"
            if old_data and "metadata" in old_data:
                old_ver = old_data["metadata"].get("version", "1.0")
            
            new_ver = self.increment_version(old_ver)
            if "metadata" not in data: data["metadata"] = {}
            data["metadata"]["version"] = new_ver
            data["metadata"]["last_updated"] = datetime.utcnow().strftime("%Y-%m-%d")

            # 3. Write New File
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            self.log_action("SAVE", file_path, "SUCCESS", "File updated successfully", old_ver, new_ver)
            return True, new_ver

        except Exception as e:
            self.log_action("SAVE", file_path, "FAILED", str(e))
            return False, None
