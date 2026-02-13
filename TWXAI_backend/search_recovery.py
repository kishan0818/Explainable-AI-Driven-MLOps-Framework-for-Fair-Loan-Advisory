
import os
import requests
import logging
import json
from typing import Optional, List
from dotenv import load_dotenv

# Load Env
load_dotenv()

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SearchRecovery")

class SearchRecovery:
    """
    Recovers broken links by searching Google for the scheme/rule name.
    Prioritizes official government domains (.gov.in, .nic.in).
    """
    def __init__(self):
        self.api_key = os.getenv("SERPAPI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.engine = "google" # serpapi parameter
        
        # Trusted Domains
        self.whitelist = [".gov.in", ".nic.in", ".org.in", ".rbi.org.in", ".nabard.org", ".sidbi.in"]

    def _is_trusted(self, url: str) -> bool:
        """Checks if URL belongs to a trusted domain."""
        return any(domain in url for domain in self.whitelist)

    def find_new_url(self, query: str) -> Optional[str]:
        """
        Searches for the query and returns the first result from a trusted domain.
        """
        if not self.api_key:
            logger.warning("No Search API Key found. Recovery disabled.")
            return None

        try:
            # Using SerpApi (Google Search Results)
            from serpapi import GoogleSearch
            search = GoogleSearch({
                "engine": "google",
                "q": f"{query} official website india",
                "gl": "in",
                "hl": "en",
                "api_key": self.api_key
            })
            results = search.get_dict()
            
            if "organic_results" in results:
                for result in results["organic_results"]:
                    link = result.get("link")
                    if link and self._is_trusted(link):
                        logger.info(f"Recovered URL for '{query}': {link}")
                        return link
                        
            logger.info(f"No trusted URL found for '{query}'")
            return None

        except ImportError:
            # Fallback if serpapi lib not found (should be installed)
            logger.error("serpapi library not found.")
            return None
        except Exception as e:
            logger.error(f"Search API Error: {e}")
            return None

# Mock for testing if no key provided
class MockSearchRecovery:
    def find_new_url(self, query: str) -> Optional[str]:
        logger.info(f"[MOCK] Searching for {query}...")
        return "https://www.myscheme.gov.in" # Placeholder
