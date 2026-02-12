
import pandas as pd
import numpy as np
import logging
import os
import json
import joblib
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from imblearn.over_sampling import SMOTE
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class XGBoostTrainer:
    def __init__(self, data_path, output_dir='results_rf_smote_controlled_pca1_wocs/models'):
        self.data_path = data_path
        self.output_dir = output_dir
        
        # Ensure output directory exists
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
            
        self.label_encoders = {}
        self.scaler = StandardScaler()
        
    def train_and_save(self):
        logger.info(f"Loading data from {self.data_path}")
        df = pd.read_csv(self.data_path)
        
        # --- Preprocessing (Must match model_evaluation.py EXACTLY) ---
        
        # Drop ID
        if 'LoanID' in df.columns:
            df = df.drop('LoanID', axis=1)
            
        # Handle Missing Values
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            if df[col].isnull().sum() > 0:
                 df[col] = df[col].fillna(df[col].median()) # Median imputation
        
        categorical_cols = df.select_dtypes(include=['object']).columns
        for col in categorical_cols:
            if df[col].isnull().sum() > 0:
                df[col] = df[col].fillna(df[col].mode()[0]) # Mode imputation
                
        # Encode Categoricals
        for col in categorical_cols:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col])
            self.label_encoders[col] = le
            
        # Split Features/Target
        X = df.drop('Default', axis=1)
        y = df['Default']
        
        # Split Data (to ensure we validate on unseen data before saving)
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        
        # Scale Data
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Apply SMOTE
        logger.info("Applying SMOTE...")
        smote = SMOTE(random_state=42)
        X_train_smote, y_train_smote = smote.fit_resample(X_train_scaled, y_train)
        
        # Train XGBoost
        logger.info("Training XGBoost...")
        # Use CPU-compatible tree method for broad compatibility unless specifically needing GPU speed for inference (usually CPU inference is fast enough for single reqs)
        # But we can train with GPU if available.
        
        params = {
            'n_estimators': 100,
            'learning_rate': 0.1,
            'max_depth': 6,
            'random_state': 42,
            'use_label_encoder': False,
            'eval_metric': 'logloss'
        }
        
        # Check for GPU
        try:
            import xgboost as xgb
            # We will use 'hist' which is fast on CPU too, or 'gpu_hist' if creating specifically for GPU env.
            # For production safety (inference might be CPU), let's stick to standard or 'hist'.
            # 'hist' is very fast.
            params['tree_method'] = 'hist' 
        except:
            pass

        model = xgb.XGBClassifier(**params)
        model.fit(X_train_smote, y_train_smote)
        
        # Validate
        val_accuracy = model.score(X_test_scaled, y_test)
        logger.info(f"Validation Accuracy: {val_accuracy:.4f}")
        
        # --- Save Artifacts ---
        
        # 1. Save XGBoost Model (JSON for interoperability)
        model_path = os.path.join(self.output_dir, 'xgboost_smote.json')
        model.save_model(model_path)
        logger.info(f"Model saved to {model_path}")
        
        # 2. Save Scaler (Joblib)
        scaler_path = os.path.join(self.output_dir, 'xgboost_scaler.joblib')
        joblib.dump(self.scaler, scaler_path)
        logger.info(f"Scaler saved to {scaler_path}")
        
        # 3. Save Label Encoders (Joblib)
        encoders_path = os.path.join(self.output_dir, 'xgboost_encoders.joblib')
        joblib.dump(self.label_encoders, encoders_path)
        logger.info(f"Encoders saved to {encoders_path}")
        
        # 4. Save Feature Names (for backend alignment check)
        features_path = os.path.join(self.output_dir, 'xgboost_features.json')
        with open(features_path, 'w') as f:
            json.dump(list(X.columns), f)
        logger.info(f"Feature names saved to {features_path}")

if __name__ == "__main__":
    trainer = XGBoostTrainer('loan_default_data.csv')
    trainer.train_and_save()
