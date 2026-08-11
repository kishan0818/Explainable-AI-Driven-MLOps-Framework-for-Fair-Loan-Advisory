import os
import logging

logger = logging.getLogger("Observability")

# Initialize global Langfuse client if credentials are in env
try:
    if os.getenv("LANGFUSE_PUBLIC_KEY") and os.getenv("LANGFUSE_SECRET_KEY"):
        # pyrefly: ignore [missing-import]
        from langfuse import Langfuse
        # This registers the client globally for decorated functions
        Langfuse()
except Exception:
    pass

def get_telemetry_handler():
    """
    Returns the Langfuse CallbackHandler if credentials are configured.
    Otherwise returns None.
    """
    try:
        # pyrefly: ignore [missing-import]
        from langfuse.langchain import CallbackHandler
        
        public_key = os.getenv("LANGFUSE_PUBLIC_KEY")
        secret_key = os.getenv("LANGFUSE_SECRET_KEY")
        
        if public_key and secret_key:
            handler = CallbackHandler(
                public_key=public_key
            )
            logger.info("✅ Langfuse Observability Handler Initialized successfully.")
            return handler
        else:
            logger.warning("⚠️ Langfuse keys missing. Observability metrics will not be collected.")
            return None
    except ImportError:
        logger.warning("⚠️ Langfuse package not installed. Skipping telemetry handler setup.")
        return None
    except Exception as e:
        logger.error(f"Error initializing Langfuse Handler: {e}")
        return None
