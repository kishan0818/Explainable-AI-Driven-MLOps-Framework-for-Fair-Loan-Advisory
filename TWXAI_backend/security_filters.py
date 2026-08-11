import re
import logging
from typing import Dict, Tuple

logger = logging.getLogger("SecurityShield")

class SecurityShield:
    # Common PII pattern regexes
    PAN_REGEX = re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b", re.IGNORECASE)
    AADHAAR_REGEX = re.compile(r"\b[2-9]{1}[0-9]{3}[-\s]?[0-9]{4}[-\s]?[0-9]{4}\b")
    PHONE_REGEX = re.compile(r"\b(?:\+91[\-\s]?)?[6-9]\d{9}\b")
    EMAIL_REGEX = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")
    
    # Regex to catch "my name is X" or "i am X" or "myself X"
    NAME_PATTERNS = [
        re.compile(r"\b(?:my name is|i am|myself)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\b", re.IGNORECASE),
        re.compile(r"\b(?:caste|category)\s+(is\s+)?(general|sc|st|obc|weaker section|minority)\b", re.IGNORECASE)
    ]
    
    # Prompt injection patterns
    INJECTION_KEYWORDS = [
        "ignore previous instructions",
        "system instructions",
        "you are now a",
        "dan mode",
        "override rules",
        "ignore the prompt",
        "ignore guardrails",
        "system prompt",
        "jailbreak"
    ]
    
    @classmethod
    def detect_prompt_injection(cls, text: str) -> bool:
        """Checks if the text contains any common prompt injection indicators."""
        if not text:
            return False
        text_lower = text.lower()
        for kw in cls.INJECTION_KEYWORDS:
            if kw in text_lower:
                logger.warning(f"⚠️ Prompt injection attempt detected: '{kw}'")
                return True
        return False

    @classmethod
    def mask_input(cls, text: str) -> Tuple[str, Dict[str, str]]:
        """
        Scan text for PII, replace with placeholders, and return masked text and key-value mapping.
        """
        if not text:
            return "", {}
            
        mask_map = {}
        counter = 1
        masked_text = text
        
        # 1. Mask email
        for match in cls.EMAIL_REGEX.finditer(text):
            val = match.group(0)
            placeholder = f"[MASKED_EMAIL_{counter}]"
            mask_map[placeholder] = val
            masked_text = masked_text.replace(val, placeholder)
            counter += 1

        # 2. Mask Aadhaar
        for match in cls.AADHAAR_REGEX.finditer(text):
            val = match.group(0)
            placeholder = f"[MASKED_AADHAAR_{counter}]"
            mask_map[placeholder] = val
            masked_text = masked_text.replace(val, placeholder)
            counter += 1

        # 3. Mask PAN
        for match in cls.PAN_REGEX.finditer(text):
            val = match.group(0)
            placeholder = f"[MASKED_PAN_{counter}]"
            mask_map[placeholder] = val
            masked_text = masked_text.replace(val, placeholder)
            counter += 1

        # 4. Mask Phone
        for match in cls.PHONE_REGEX.finditer(text):
            val = match.group(0)
            placeholder = f"[MASKED_PHONE_{counter}]"
            mask_map[placeholder] = val
            masked_text = masked_text.replace(val, placeholder)
            counter += 1

        # 5. Mask Name & Caste patterns
        for pattern in cls.NAME_PATTERNS:
            for match in pattern.finditer(text):
                try:
                    val = match.group(1) # The name/value capture group
                    if val and val.lower() not in ["a", "the", "an", "is", "of", "looking", "want", "need", "to", "for"]:
                        placeholder = f"[MASKED_PII_{counter}]"
                        mask_map[placeholder] = val
                        masked_text = masked_text.replace(val, placeholder)
                        counter += 1
                except IndexError:
                    try:
                        val = match.group(2)
                        if val:
                            placeholder = f"[MASKED_PII_{counter}]"
                            mask_map[placeholder] = val
                            masked_text = masked_text.replace(val, placeholder)
                            counter += 1
                    except IndexError:
                        pass
                        
        if mask_map:
            logger.info(f"PII Masked: {list(mask_map.keys())}")
        return masked_text, mask_map

    @classmethod
    def unmask_output(cls, text: str, mask_map: Dict[str, str]) -> str:
        """
        Restores original values for all placeholders in the output text.
        """
        if not text or not mask_map:
            return text
            
        unmasked_text = text
        for placeholder, original in mask_map.items():
            unmasked_text = unmasked_text.replace(placeholder, original)
            
        return unmasked_text
