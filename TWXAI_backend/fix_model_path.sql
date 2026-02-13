-- Fix for incorrect model path in registry
UPDATE model_registry
SET path = 'results_rf_smote_controlled_pca1_wocs/models/xgboost_smote.json'
WHERE model_type = 'standard' AND version = '1.0.0';
