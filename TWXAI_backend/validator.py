
import requests
import hashlib
import logging
from typing import Tuple, Optional

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("RegulatoryValidator")

class RegulatoryValidator:
    """
    Validates regulatory URLs and tracks content changes using hashing.
    """
    def __init__(self, timeout: int = 10):
        self.timeout = timeout
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

    def check_url(self, url: str) -> bool:
        """
        Verifies if a URL is accessible (HTTP 200).
        """
        if not url: return False
        try:
            response = requests.head(url, headers=self.headers, timeout=self.timeout, allow_redirects=True)
            if response.status_code == 200:
                return True
            # Fallback to GET if HEAD fails (some servers block HEAD)
            response = requests.get(url, headers=self.headers, timeout=self.timeout, stream=True)
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"URL Validatou Error ({url}): {e}")
            return False

    def get_content_hash(self, url: str) -> Optional[str]:
        """
        Fetches content and returns a SHA-256 hash of the text body.
        Useful for detecting if the page content has changed.
        """
        if not url: return None
        try:
            response = requests.get(url, headers=self.headers, timeout=self.timeout)
            if response.status_code == 200:
                # Normalize content: remove whitespace/encoding issues for stable hash
                content = response.text.encode('utf-8')
                return hashlib.sha256(content).hexdigest()
        except Exception as e:
            logger.warning(f"Hash Generation Error ({url}): {e}")
        return None
