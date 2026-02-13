
import requests
from bs4 import BeautifulSoup
import re
import logging
from typing import Dict, Optional

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("RegulatoryScraper")

class RegulatoryScraper:
    """
    Extracts structured content from government scheme pages.
    """
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

    def fetch_page_content(self, url: str) -> Optional[str]:
        """
        Fetches and cleans text content from a URL.
        Returns normalized text string.
        """
        try:
            response = requests.get(url, headers=self.headers, timeout=15)
            if response.status_code != 200:
                logger.warning(f"Failed to fetch {url}: Status {response.status_code}")
                return None
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Remove scripts, styles, nav, footer
            for script in soup(["script", "style", "nav", "footer", "header"]):
                script.decompose()

            # Get text
            text = soup.get_text()
            
            # Normalize whitespace
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            clean_text = '\n'.join(chunk for chunk in chunks if chunk)
            
            return clean_text
            
        except Exception as e:
            logger.error(f"Scraping Error ({url}): {e}")
            return None

    def extract_keywords(self, text: str) -> Dict[str, bool]:
        """
        Simple keyword check for eligibility criteria presence.
        """
        if not text: return {}
        
        text_lower = text.lower()
        return {
            "eligibility_mentioned": "eligibility" in text_lower or "who can apply" in text_lower,
            "documents_mentioned": "document" in text_lower or "required" in text_lower,
            "interest_rate_mentioned": "interest" in text_lower or "subsidy" in text_lower
        }
