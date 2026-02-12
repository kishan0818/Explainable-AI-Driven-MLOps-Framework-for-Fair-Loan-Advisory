
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import os
import argparse
import logging
import time
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (accuracy_score, precision_score, recall_score, f1_score, 
                             roc_auc_score, roc_curve, confusion_matrix)
from imblearn.over_sampling import SMOTE
import warnings
import xgboost as xgb

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
warnings.filterwarnings('ignore')

class ModelEvaluator:
    def __init__(self, data_path, results_dir='results', use_gpu=True):
        self.data_path = data_path
        self.results_dir = results_dir
        self.use_gpu = use_gpu
        self.os_results_dir = os.path.join(os.getcwd(), results_dir)
        
        # Create results directory
        if not os.path.exists(self.os_results_dir):
            os.makedirs(self.os_results_dir)
            
        self.df = None
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
        self.X_train_smote = None
        self.y_train_smote = None
        self.models = {}
        self.results = []
        self.sensitive_features = None  # For fairness metrics

    def load_and_preprocess_data(self):
        logger.info(f"Loading data from {self.data_path}")
        try:
            self.df = pd.read_csv(self.data_path)
            
            # Basic Preprocessing (matching typical steps)
            # Drop ID if present
            if 'LoanID' in self.df.columns:
                self.df = self.df.drop('LoanID', axis=1)
                
            # Handle missing values (simple imputation)
            # Numeric: median
            numeric_cols = self.df.select_dtypes(include=[np.number]).columns
            for col in numeric_cols:
                if self.df[col].isnull().sum() > 0:
                     self.df[col] = self.df[col].fillna(self.df[col].median())
            
            # Categorical: mode
            categorical_cols = self.df.select_dtypes(include=['object']).columns
            for col in categorical_cols:
                if self.df[col].isnull().sum() > 0:
                    self.df[col] = self.df[col].fillna(self.df[col].mode()[0])

            # Define sensitive feature for fairness (Age < 30)
            self.df['IsYoung'] = (self.df['Age'] < 30).astype(int)

            # Encode Categoricals
            label_encoders = {}
            for col in categorical_cols:
                le = LabelEncoder()
                self.df[col] = le.fit_transform(self.df[col])
                label_encoders[col] = le
                
            # Split Data
            X = self.df.drop(['Default', 'IsYoung'], axis=1) 
            y = self.df['Default']
            
            # Use Stratified Split
            indices = np.arange(len(self.df))
            X_train, X_test, y_train, y_test, idx_train, idx_test = train_test_split(
                X, y, indices, test_size=0.2, random_state=42, stratify=y
            )
            
            self.X_train = X_train
            self.X_test = X_test
            self.y_train = y_train
            self.y_test = y_test
            
            # Sensitive feature for test set
            self.sensitive_features = self.df.iloc[idx_test]['IsYoung'].values

            # Scale Data
            scaler = StandardScaler()
            self.X_train = scaler.fit_transform(self.X_train)
            self.X_test = scaler.transform(self.X_test)
            
            logger.info("Data loaded and preprocessed.")
            logger.info(f"Training set: {self.X_train.shape}, Test set: {self.X_test.shape}")
            
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            raise

    def train_models(self):
        logger.info("Training models...")
        
        # 1. Logistic Regression (CPU - Benchmark)
        logger.info("Training Logistic Regression (Baseline)...")
        start = time.time()
        lr = LogisticRegression(random_state=42, max_iter=1000, n_jobs=-1)
        lr.fit(self.X_train, self.y_train)
        self.models['Logistic Regression'] = lr
        logger.info(f"LR trained in {time.time() - start:.2f}s")
        
        # 2. Random Forest (CPU - Benchmark)
        logger.info("Training Random Forest (Baseline)...")
        start = time.time()
        rf = RandomForestClassifier(random_state=42, n_estimators=60, n_jobs=-1) # Reduced estimators for speed
        rf.fit(self.X_train, self.y_train)
        self.models['Random Forest'] = rf
        logger.info(f"RF trained in {time.time() - start:.2f}s")
        
        # 3. XGBoost (GPU Accelerated)
        logger.info(f"Training XGBoost (GPU={self.use_gpu})...")
        start = time.time()
        xgb_params = {
            'n_estimators': 100,
            'learning_rate': 0.1,
            'max_depth': 6,
            'random_state': 42,
            'use_label_encoder': False,
            'eval_metric': 'logloss'
        }
        
        if self.use_gpu:
            xgb_params['tree_method'] = 'gpu_hist' # Or 'hist' with device='cuda' for newer versions
            # xgb_params['device'] = 'cuda'
        else:
            xgb_params['n_jobs'] = -1

        xgb_model = xgb.XGBClassifier(**xgb_params)
        xgb_model.fit(self.X_train, self.y_train)
        self.models['XGBoost (GPU)'] = xgb_model
        logger.info(f"XGBoost trained in {time.time() - start:.2f}s")
        
        # 4. XGBoost + SMOTE (GPU Accelerated)
        logger.info("Applying SMOTE...")
        smote = SMOTE(random_state=42)
        X_train_smote, y_train_smote = smote.fit_resample(self.X_train, self.y_train)
        self.X_train_smote, self.y_train_smote = X_train_smote, y_train_smote
        
        logger.info(f"Training XGBoost + SMOTE (GPU={self.use_gpu})...")
        start = time.time()
        xgb_smote = xgb.XGBClassifier(**xgb_params)
        xgb_smote.fit(X_train_smote, y_train_smote)
        self.models['XGBoost + SMOTE'] = xgb_smote
        logger.info(f"XGBoost+SMOTE trained in {time.time() - start:.2f}s")
        
        # Removed SVM as it typically requires O(N^2) or O(N^3) time and is not feasible for 250k+ rows in a "quick" script.

    def evaluate_models(self):
        logger.info("Evaluating models...")
        
        for name, model in self.models.items():
            start = time.time()
            y_pred = model.predict(self.X_test)
            y_prob = model.predict_proba(self.X_test)[:, 1]
            eval_time = time.time() - start
            
            acc = accuracy_score(self.y_test, y_pred)
            prec = precision_score(self.y_test, y_pred)
            rec = recall_score(self.y_test, y_pred)
            f1 = f1_score(self.y_test, y_pred)
            auc = roc_auc_score(self.y_test, y_prob)
            
            self.results.append({
                'Model': name,
                'Accuracy': acc,
                'Precision': prec,
                'Recall': rec,
                'F1': f1,
                'AUC': auc,
                'Time': eval_time,
                'y_prob': y_prob,
                'y_pred': y_pred
            })

    def print_dataset_summary(self):
        print("\n" + "="*30)
        print("SECTION 4: DATASET SUMMARY")
        print("="*30)
        total = len(self.df)
        neg, pos = self.df['Default'].value_counts()
        print(f"Total Samples:      {total}")
        print(f"Features:           {self.X_train.shape[1]}")
        print(f"Class Distribution: No Default (0): {neg} ({neg/total:.1%})")
        print(f"                    Default (1):    {pos} ({pos/total:.1%})")
        print(f"Imbalance Ratio:    1:{neg/pos:.2f}")

    def print_results_table(self):
        print("\n" + "="*80)
        print("SECTION 6: MODEL PERFORMANCE METRICS")
        print("="*80)
        print(f"{'MODEL':<25} | {'ACC':<6} | {'PREC':<6} | {'REC':<6} | {'F1':<6} | {'AUC':<6} | {'TIME(s)':<7}")
        print("-" * 95)
        for res in self.results:
            print(f"{res['Model']:<25} | {res['Accuracy']:.4f} | {res['Precision']:.4f} | {res['Recall']:.4f} | {res['F1']:.4f} | {res['AUC']:.4f} | {res['Time']:.2f}")

    def calculate_fairness_metrics(self):
        print("\n" + "="*60)
        print("SECTION 5: FAIRNESS METRICS (Sensitive Attribute: Age < 30)")
        print("="*60)
        
        print(f"{'MODEL':<25} | {'DEM_PAR':<8} | {'EQ_OPP':<8} | {'DISP_IMP':<8}")
        
        for res in self.results:
            y_pred = res['y_pred']
            
            group_a = self.sensitive_features == 1 # Young (Protected/Sensitive)
            group_b = self.sensitive_features == 0 # Older
            
            # Selection Rate (Positive Prediction Rate)
            sel_rate_a = np.mean(y_pred[group_a])
            sel_rate_b = np.mean(y_pred[group_b])
            dem_par_diff = abs(sel_rate_a - sel_rate_b)
            
            # Equal Opportunity (TPR difference)
            y_true_a = self.y_test.values[group_a]
            y_pred_a = y_pred[group_a]
            tpr_a = recall_score(y_true_a, y_pred_a, zero_division=0)
            
            y_true_b = self.y_test.values[group_b]
            y_pred_b = y_pred[group_b]
            tpr_b = recall_score(y_true_b, y_pred_b, zero_division=0)
            
            eq_opp_diff = abs(tpr_a - tpr_b)
            
            # Disparate Impact
            disp_impact = sel_rate_a / sel_rate_b if sel_rate_b > 0 else 0
            
            print(f"{res['Model']:<25} | {dem_par_diff:.4f}   | {eq_opp_diff:.4f}   | {disp_impact:.4f}")

    def generate_plots(self):
        logger.info("Generating plots...")
        
        # 1. Comparison Bar Plot
        metrics_df = pd.DataFrame(self.results).set_index('Model')[['Accuracy', 'Precision', 'Recall', 'F1', 'AUC']]
        plt.figure(figsize=(12, 6))
        metrics_df.plot(kind='bar', ax=plt.gca())
        plt.title('Model Comparison Metrics')
        plt.ylabel('Score')
        plt.ylim(0, 1.1)
        plt.legend(loc='lower right')
        plt.tight_layout()
        plt.savefig(os.path.join(self.os_results_dir, 'model_comparison.png'))
        plt.close()
        
        # 2. ROC Curves
        plt.figure(figsize=(10, 8))
        for res in self.results:
            fpr, tpr, _ = roc_curve(self.y_test, res['y_prob'])
            plt.plot(fpr, tpr, label=f"{res['Model']} (AUC = {res['AUC']:.2f})")
        plt.plot([0, 1], [0, 1], 'k--')
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.title('ROC Curves')
        plt.legend()
        plt.savefig(os.path.join(self.os_results_dir, 'roc_curves.png'))
        plt.close()
        
        # 3. SMOTE Comparison (XGB vs XGB+SMOTE)
        xgb_results = [r for r in self.results if 'XGBoost' in r['Model']]
        if xgb_results:
            xgb_df = pd.DataFrame(xgb_results).set_index('Model')[['Recall', 'F1', 'AUC']]
            plt.figure(figsize=(8, 6))
            xgb_df.plot(kind='bar', color=['skyblue', 'orange', 'green'], ax=plt.gca())
            plt.title('SMOTE Impact Analysis (XGBoost)')
            plt.ylabel('Score')
            plt.ylim(0, 1.1)
            plt.savefig(os.path.join(self.os_results_dir, 'smote_comparison.png'))
            plt.close()

        # 4. Feature Importance (XGB+SMOTE)
        if 'XGBoost + SMOTE' in self.models:
            model = self.models['XGBoost + SMOTE']
            importances = model.feature_importances_
            feature_names = self.df.drop(['Default', 'IsYoung'], axis=1).columns
            indices = np.argsort(importances)[::-1][:10]
            
            plt.figure(figsize=(10, 6))
            plt.title('Top 10 Feature Importances (XGBoost + SMOTE)')
            plt.barh(range(len(indices)), importances[indices], align='center')
            plt.yticks(range(len(indices)), [feature_names[i] for i in indices])
            plt.xlabel('Relative Importance')
            plt.tight_layout()
            plt.savefig(os.path.join(self.os_results_dir, 'feature_importance.png'))
            plt.close()

        # 5. Confusion Matrix (Best Model by F1)
        best_model_name = max(self.results, key=lambda x: x['F1'])['Model']
        best_res = next(r for r in self.results if r['Model'] == best_model_name)
        cm = confusion_matrix(self.y_test, best_res['y_pred'])
        
        plt.figure(figsize=(6, 5))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
        plt.title(f'Confusion Matrix ({best_model_name})')
        plt.ylabel('Actual')
        plt.xlabel('Predicted')
        plt.tight_layout()
        plt.savefig(os.path.join(self.os_results_dir, 'confusion_matrix.png'))
        plt.close()

def main():
    parser = argparse.ArgumentParser(description="Loan Approval Model Evaluation Script")
    parser.add_argument('--dataset', type=str, default='loan_default_data.csv', help='Path to dataset CSV')
    args = parser.parse_args()
    
    # Check if dataset exists
    if not os.path.exists(args.dataset):
        print(f"Error: Dataset {args.dataset} not found.")
        return

    # Check for GPU
    use_gpu = False
    try:
        import xgboost as xgb
        # basic check, assumes if installed it might work. 
        # Ideally we check xgb details but 'gpu_hist' fallback to cpu if not avail usually
        use_gpu = True
        print("XGBoost detected. Will attempt to use GPU acceleration.")
    except ImportError:
        print("XGBoost not found. Will run on CPU.")

    evaluator = ModelEvaluator(args.dataset, use_gpu=use_gpu)
    evaluator.load_and_preprocess_data()
    evaluator.print_dataset_summary()
    evaluator.train_models()
    evaluator.evaluate_models()
    evaluator.print_results_table()
    evaluator.calculate_fairness_metrics()
    evaluator.generate_plots()
    
    print(f"\nEvaluation complete. Results saved to {evaluator.os_results_dir}/")

if __name__ == "__main__":
    main()
