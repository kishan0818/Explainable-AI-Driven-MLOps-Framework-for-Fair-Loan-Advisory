
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

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AdaptiveModelTrainer:
    def __init__(self, data_path, output_dir='results_rf_smote_controlled_pca1_wocs/models'):
        self.data_path = data_path
        self.output_dir = output_dir
        
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
            
        self.label_encoders = {}
        self.scaler = StandardScaler()
        
    def train_and_save(self):
        logger.info(f"Loading data from {self.data_path}")
        df = pd.read_csv(self.data_path)
        
        # --- Preprocessing ---
        if 'LoanID' in df.columns:
            df = df.drop('LoanID', axis=1)
            
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            if df[col].isnull().sum() > 0:
                 df[col] = df[col].fillna(df[col].median())
        
        categorical_cols = df.select_dtypes(include=['object']).columns
        for col in categorical_cols:
            if df[col].isnull().sum() > 0:
                df[col] = df[col].fillna(df[col].mode()[0])
                
        for col in categorical_cols:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col])
            self.label_encoders[col] = le
            
        X = df.drop('Default', axis=1)
        y = df['Default']
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        logger.info("Applying SMOTE...")
        smote = SMOTE(random_state=42)
        X_train_smote, y_train_smote = smote.fit_resample(X_train_scaled, y_train)
        
        logger.info("Training Adaptive XGBoost...")
        model = xgb.XGBClassifier(n_estimators=100, learning_rate=0.1, max_depth=6, random_state=42, use_label_encoder=False, eval_metric='logloss')
        model.fit(X_train_smote, y_train_smote)
        
        val_accuracy = model.score(X_test_scaled, y_test)
        logger.info(f"Validation Accuracy: {val_accuracy:.4f}")
        
        # Save Adaptive Model
        model_path = os.path.join(self.output_dir, 'xgboost_adaptive.json')
        model.save_model(model_path)
        logger.info(f"Adaptive Model saved to {model_path}")
        
if __name__ == "__main__":
    trainer = AdaptiveModelTrainer('d:\\TWXAI_integ\\TWXAI_backend\\synthetic_loans_noisy.csv')
    trainer.train_and_save()
