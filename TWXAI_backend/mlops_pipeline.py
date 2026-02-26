
import os
import json
import logging
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from supabase import create_client, Client
from scipy.stats import entropy
import shap
import xgboost as xgb
import joblib

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MLOps")

# Supabase Setup (Assumes env vars are loaded by main app)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

class ModelRegistry:
    """
    Manages interaction with the `model_registry` table.
    Fetches active models and logs new versions.
    """
    def __init__(self):
        if not SUPABASE_URL or not SUPABASE_KEY:
            logger.warning("Supabase credentials missing. MLOps Registry disabled.")
            self.client = None
        else:
            self.client = create_client(SUPABASE_URL, SUPABASE_KEY)

    def get_active_model(self, model_type: str = 'standard') -> Optional[Dict]:
        """Fetches the current PRIMARY model metadata for a given type."""
        if not self.client: return None
        try:
            res = self.client.table("model_registry")\
                .select("*")\
                .eq("model_type", model_type)\
                .eq("status", "primary")\
                .eq("is_active", True)\
                .limit(1)\
                .execute()
            if res.data:
                return res.data[0]
        except Exception as e:
            logger.error(f"Registry Fetch Error: {e}")
        return None

    def log_event(self, event_type: str, model_version: str, details: Dict, severity: str = 'info'):
        """Logs an MLOps event to `mlops_logs`."""
        if not self.client: return
        try:
            self.client.table("mlops_logs").insert({
                "event_type": event_type,
                "model_version": model_version,
                "details": details,
                "severity": severity
            }).execute()
        except Exception as e:
            logger.error(f"MLOps Log Error: {e}")

class DriftDetector:
    """
    Monitors feature distribution drift using KL Divergence.
    """
    """
    Monitors feature distribution drift using KL Divergence.
    """
    def __init__(self):
        try:
            # Load training data as reference for drift detection
            self.reference_data = pd.read_csv("loan_default_data.csv")
            # Drop target and non-feature columns if present
            if 'Default' in self.reference_data.columns:
                self.reference_data = self.reference_data.drop('Default', axis=1)
            if 'LoanID' in self.reference_data.columns:
                self.reference_data = self.reference_data.drop('LoanID', axis=1)
            logger.info("✅ Drift Detector: Reference data loaded.")
        except Exception as e:
            logger.warning(f"Drift Detector: Failed to load reference data: {e}")
            self.reference_data = None
            
        self.threshold = 0.1 # Threshold for drift alert

    def compute_drift(self, current_batch: pd.DataFrame) -> Dict[str, float]:
        """
        Computes KL divergence for numerical features between current batch and reference.
        Returns a dictionary of {feature: drift_score}.
        """
        if self.reference_data is None:
            return {}

        drift_scores = {}
        # Only check numerical columns present in both
        common_cols = list(set(self.reference_data.select_dtypes(include=np.number).columns) 
                           & set(current_batch.select_dtypes(include=np.number).columns))
        
        for col in common_cols:
            try:
                # Binning for entropy calculation
                ref_hist, bin_edges = np.histogram(self.reference_data[col], bins=10, density=True)
                curr_hist, _ = np.histogram(current_batch[col], bins=bin_edges, density=True)
                
                # Avoid div by zero
                ref_hist = np.where(ref_hist == 0, 1e-6, ref_hist)
                curr_hist = np.where(curr_hist == 0, 1e-6, curr_hist)

                kl_div = entropy(curr_hist, ref_hist)
                drift_scores[col] = float(kl_div)
            except Exception:
                continue
                
        return drift_scores

class FairnessMonitor:
    """
    Monitors bias metrics (Demographic Parity) using proxy attributes.
    """
    def __init__(self):
        self.history = [] # In-memory storage for recent predictions (for demo)

    def update(self, input_data: Dict, prediction: float, threshold: float = 0.5):
        """Adds a prediction to the monitor."""
        self.history.append({
            "age": input_data.get("Age", 0),
            "income": input_data.get("Income", 0),
            "gender": input_data.get("Gender", "Unknown"), # If available (proxy-safe)
            "prediction": 1 if prediction > threshold else 0
        })
        # Keep window size manageable
        if len(self.history) > 1000:
            self.history.pop(0)

    def check_demographic_parity(self, sensitive_attr: str = "age", group_a_condition: callable = None, group_b_condition: callable = None) -> float:
        """
        Calculates Disparate Impact Ratio = P(Approved|Group A) / P(Approved|Group B).
        Ideal is 1.0. < 0.8 is bias.
        """
        if not self.history: return 1.0
        
        df = pd.DataFrame(self.history)
        
        # Default Conditions (Example: Age < 30 vs Age >= 30)
        if sensitive_attr == "age":
            group_a = df[df['age'] < 30]
            group_b = df[df['age'] >= 30]
        elif sensitive_attr == "gender" and "gender" in df.columns:
             # Case insensitive check
             group_a = df[df['gender'].astype(str).str.lower() == 'female']
             group_b = df[df['gender'].astype(str).str.lower() == 'male']
        else:
            return 1.0 # Unknown attribute

        if len(group_a) == 0 or len(group_b) == 0:
            return 1.0

        rate_a = group_a['prediction'].mean()
        rate_b = group_b['prediction'].mean()
        
        if rate_b == 0: return 1.0
        
        return rate_a / rate_b

class DualModelController:
    """
    Main Controller.
    - Loads Standard (SM) and Adaptive (AM) models.
    - Routes predictions.
    - Manages Explainability (SHAP).
    """
    def __init__(self):
        self.registry = ModelRegistry()
        self.drift_detector = DriftDetector() # Ref data loaded later
        self.fairness_monitor = FairnessMonitor()
        
        self.sm_model = None
        self.am_model = None
        self.active_version = "1.0.0"
        
        self.explainer = None # SHAP explainer
        
        # Load Primary Model
        self.load_primary_model()
        # Load Adaptive Model
        self.load_adaptive_model()

    def load_primary_model(self):
        """Loads the model marked as PRIMARY in DB."""
        meta = self.registry.get_active_model('standard')
        if not meta:
            logger.warning("No active primary model found in registry. Using fallback.")
            return # Continue to try loading adaptive or defaults

        path = meta.get('path')
        version = meta.get('version')
        
        # In a real system, we'd download from S3/Storage. 
        # Here we assume local path relative to backend.
        full_path = os.path.join(os.getcwd(), 'TWXAI_backend', path) if not os.path.exists(path) else path
        
        if os.path.exists(full_path):
            try:
                # Load XGBoost JSON
                self.sm_model = xgb.XGBClassifier()
                self.sm_model.load_model(full_path)
                self.active_version = version
                logger.info(f"✅ Loaded Primary Model: {version}")
                
                # Initialize SHAP (TreeExplainer)
                # Note: We need some background data for proper initialization, 
                # but TreeExplainer works without it for XGBoost usually.
                self.explainer = shap.TreeExplainer(self.sm_model)
                
            except Exception as e:
                logger.error(f"Failed to load model file: {e}")
                self.sm_model = None
        else:
            logger.error(f"Model file not found: {full_path}")
            self.sm_model = None

    def load_adaptive_model(self):
        """Loads the Adaptive Model (Candidate)."""
        # Hardcoded path for now, or fetch from registry as 'adaptive'
        path = 'results_rf_smote_controlled_pca1_wocs/models/xgboost_adaptive.json'
        # Check current dir or subdirectory
        if os.path.exists(path):
            full_path = path
        else:
            full_path = os.path.join('TWXAI_backend', path)
        
        if os.path.exists(full_path):
            try:
                self.am_model = xgb.XGBClassifier()
                self.am_model.load_model(full_path)
                logger.info(f"✅ Loaded Adaptive Model: {path}")
            except Exception as e:
                logger.error(f"Failed to load adaptive model: {e}")
                self.am_model = None
        else:
            logger.info(f"Adaptive model not found at {full_path}. Skipping.")
            self.am_model = None

    def predict(self, model_input: Any, raw_input: pd.DataFrame, context: Dict = {}) -> Dict:
        """
        Predicts using the active model.
        
        Args:
            model_input: Preprocessed features ready for the model (numpy array or DF).
            raw_input: Raw features for Drift/Monitoring.
            context: Dict with metadata (e.g. user_id) for logging.
            
        Returns: {probability, model_version, shap_values, metrics}
        """
        if not self.sm_model:
            return {"probability": 0.5, "error": "No model loaded"}

        # 1. Predict
        try:
            # XGBoost predict_proba expects 2D array
            prob = float(self.sm_model.predict_proba(model_input)[0][1])
        except Exception as e:
            logger.error(f"Prediction execution failed: {e}")
            return {"probability": 0.5, "error": str(e)}
        
        # 2. Compute Explainability
        shap_values = None
        try:
            # SHAP TreeExplainer expects the same input as the model
            shap_values = self.explainer.shap_values(model_input)
            # If numpy, make it list for JSON serialization if needed, 
            # but usually we return array and handle conversion later.
        except Exception as e:
            logger.warning(f"SHAP calculation failed: {e}")
        
        # 3. Monitor Drift (Simple Sync Check)
        drift_scores = {}
        max_drift = 0.0
        try:
             # Ensure raw_input is DataFrame
             if isinstance(raw_input, dict):
                 raw_df = pd.DataFrame([raw_input])
             elif isinstance(raw_input, pd.DataFrame):
                 raw_df = raw_input
             else:
                 raw_df = None
             
             if raw_df is not None:
                drift_scores = self.drift_detector.compute_drift(raw_df) 
                if drift_scores:
                    max_drift = max(drift_scores.values())
        except Exception as e:
            logger.warning(f"Drift check failed: {e}")

        # --- AUTOMATED SWITCHING LOGIC ---
        # If Significant Drift Detected AND Adaptive Model Available -> Use Adaptive
        if max_drift > self.drift_detector.threshold and self.am_model:
            try:
                # Switch Prediction to Adaptive Model
                prob = float(self.am_model.predict_proba(model_input)[0][1])
                self.active_version = "Adaptive-v1"
                
                # Log the switch event
                self.registry.log_event("model_switch", self.active_version, 
                                      {"reason": "drift_detected", "drift_score": max_drift, "feature_drift": drift_scores}, 
                                      "warning")
            except Exception as e:
                logger.error(f"Adaptive model prediction failed: {e}")
                # Fallback to Standard (prob already calculated)
                
        elif max_drift > self.drift_detector.threshold and not self.am_model:
             # Log drift alert even if no switch possible
             self.registry.log_event("drift_alert", self.active_version, {"drift_score": max_drift}, "warning")

        # 4. Monitor Fairness
        # Update monitor
        self.fairness_monitor.update(context, prob)
        
        # Check Alert
        parity = self.fairness_monitor.check_demographic_parity("age")
        if parity < 0.8:
            self.registry.log_event("fairness_alert", self.active_version, {"type": "age_bias", "parity": parity}, "warning")
            
        return {
            "probability": prob,
            "model_version": self.active_version,
            "shap_values": shap_values, 
            "metrics": {
                "demographic_parity_age": parity
            }
        }
