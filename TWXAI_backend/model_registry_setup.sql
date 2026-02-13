-- =============================================================================
-- Phase 8: MLOps Model Registry & Logging Setup
-- =============================================================================

-- 1. Model Registry Table
-- Tracks all available model versions and their current status.
CREATE TABLE IF NOT EXISTS model_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_type TEXT NOT NULL CHECK (model_type IN ('standard', 'adaptive')),
    version TEXT NOT NULL, -- e.g., '1.0.0', '1.1.0-beta'
    status TEXT NOT NULL CHECK (status IN ('primary', 'secondary', 'archived', 'candidate')),
    path TEXT NOT NULL, -- Path to artifact (e.g., 'models/xgboost_v1.json')
    metrics JSONB DEFAULT '{}'::jsonb, -- Store accuracy, fairness metrics here
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_active BOOLEAN DEFAULT FALSE
);

-- Index for fast lookup of the active primary model
CREATE INDEX idx_model_registry_status ON model_registry(status);

-- 2. MLOps Logs Table
-- Tracks system events, switching decisions, and alerts.
CREATE TABLE IF NOT EXISTS mlops_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL CHECK (event_type IN ('prediction', 'drift_alert', 'fairness_alert', 'model_switch', 'system_info')),
    model_version TEXT NOT NULL, -- Reference to the model involved
    details JSONB DEFAULT '{}'::jsonb, -- Structured data about the event
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for time-series analysis of logs
CREATE INDEX idx_mlops_logs_created_at ON mlops_logs(created_at DESC);

-- 3. Insert Initial "Standard Model" Entry
-- This registers the current verified XGBoost model as the initial Primary.
INSERT INTO model_registry (model_type, version, status, path, metrics, is_active)
VALUES (
    'standard', 
    '1.0.0', 
    'primary', 
    'results_rf_smote_controlled_pca1_wocs/models/xgboost_features.json', 
    '{"accuracy": 0.85, "fairness_proxy": 0.98, "description": "Initial verified XGBoost model"}'::jsonb,
    TRUE
);

-- 4. Insert Initial Log
INSERT INTO mlops_logs (event_type, model_version, details, severity)
VALUES (
    'system_info', 
    '1.0.0', 
    '{"message": "MLOps system initialized. Standard Model v1.0.0 set as Primary."}'::jsonb, 
    'info'
);
