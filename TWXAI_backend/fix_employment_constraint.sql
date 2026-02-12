-- Fix for "violates check constraint 'loan_applications_employment_type_check'"
-- This allows new values like 'unemployed', 'business', etc. to be saved.

-- 1. Drop the existing restrictive constraint
ALTER TABLE loan_applications 
DROP CONSTRAINT IF EXISTS loan_applications_employment_type_check;

-- 2. Add the updated constraint allowing all necessary values (including lowercase)
ALTER TABLE loan_applications 
ADD CONSTRAINT loan_applications_employment_type_check 
CHECK (employment_type IN (
    -- Frontend sends lowercase
    'salaried', 
    'self_employed', 
    'business', 
    'unemployed',
    
    -- Legacy/Capitalized (Safety)
    'Salaried', 
    'Self-Employed', 
    'Self_Employed',
    'Business', 
    'Unemployed'
));
