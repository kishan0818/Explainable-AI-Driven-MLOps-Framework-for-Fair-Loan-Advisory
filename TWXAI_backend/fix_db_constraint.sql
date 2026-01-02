-- ==========================================
-- Fix for "violates check constraint" error
-- ==========================================

-- 1. Drop the existing restrictive constraint
ALTER TABLE loan_applications 
DROP CONSTRAINT IF EXISTS loan_applications_loan_type_check;

-- 2. Add the updated constraint allowing normalized IDs
ALTER TABLE loan_applications 
ADD CONSTRAINT loan_applications_loan_type_check 
CHECK (loan_type IN (
    -- New Canonical IDs (Matches bank_loan_data.json)
    'personal_loan', 
    'home_loan', 
    'education_loan', 
    'msme_loan', 
    'agriculture_loan',
    
    -- Legacy IDs (Kept for safety, though backend now normalizes)
    'personal', 
    'home', 
    'education', 
    'msme', 
    'agriculture'
));
