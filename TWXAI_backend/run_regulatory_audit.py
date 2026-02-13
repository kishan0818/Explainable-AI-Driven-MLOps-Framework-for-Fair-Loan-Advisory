
import logging
from regulatory_monitor import RegulatoryMonitor

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("RegulatoryAudit")

def run_audit():
    logger.info("--- Starting Regulatory Audit (Production) ---")
    monitor = RegulatoryMonitor()
    
    # Audit Schemes
    logger.info("Auditing Schemes...")
    monitor.process_schemes("schemes.json")
    
    # Audit Rules
    logger.info("Auditing Rules...")
    monitor.process_rules("rules.json")
    
    logger.info("--- Audit Complete ---")
    logger.info("Check 'regulatory_audit_log.csv' for details.")

if __name__ == "__main__":
    run_audit()
