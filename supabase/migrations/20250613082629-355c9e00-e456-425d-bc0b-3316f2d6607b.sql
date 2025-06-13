
-- Add additional columns to seller_onboarding table for business information
ALTER TABLE seller_onboarding 
ADD COLUMN IF NOT EXISTS gst_number text,
ADD COLUMN IF NOT EXISTS company_pan_number text,
ADD COLUMN IF NOT EXISTS authorization_certificates jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS bank_account_number text,
ADD COLUMN IF NOT EXISTS bank_ifsc_code text,
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS annual_turnover text,
ADD COLUMN IF NOT EXISTS years_in_business integer,
ADD COLUMN IF NOT EXISTS primary_product_categories text[],
ADD COLUMN IF NOT EXISTS certifications text[],
ADD COLUMN IF NOT EXISTS trade_license_number text;

-- Update the seller_documents table to handle authorization certificates
ALTER TABLE seller_documents 
ADD COLUMN IF NOT EXISTS document_name text,
ADD COLUMN IF NOT EXISTS expiry_date date,
ADD COLUMN IF NOT EXISTS issued_by text;

-- Create an enum for document types if it doesn't exist
DO $$ BEGIN
    CREATE TYPE document_type_enum AS ENUM (
        'authorization_certificate',
        'gst_certificate', 
        'pan_card',
        'trade_license',
        'bank_statement',
        'incorporation_certificate',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- First rename the existing document_type column and create a new one with the enum type
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'seller_documents' 
               AND column_name = 'document_type' 
               AND data_type = 'text') THEN
        
        -- Rename existing column
        ALTER TABLE seller_documents RENAME COLUMN document_type TO document_type_old;
        
        -- Add new column with enum type
        ALTER TABLE seller_documents ADD COLUMN document_type document_type_enum;
        
        -- Update new column with converted values
        UPDATE seller_documents 
        SET document_type = CASE 
            WHEN document_type_old = 'authorization_certificate' THEN 'authorization_certificate'::document_type_enum
            WHEN document_type_old = 'gst_certificate' THEN 'gst_certificate'::document_type_enum
            WHEN document_type_old = 'pan_card' THEN 'pan_card'::document_type_enum
            WHEN document_type_old = 'trade_license' THEN 'trade_license'::document_type_enum
            WHEN document_type_old = 'bank_statement' THEN 'bank_statement'::document_type_enum
            WHEN document_type_old = 'incorporation_certificate' THEN 'incorporation_certificate'::document_type_enum
            ELSE 'other'::document_type_enum
        END;
        
        -- Make the new column NOT NULL
        ALTER TABLE seller_documents ALTER COLUMN document_type SET NOT NULL;
        
        -- Drop the old column
        ALTER TABLE seller_documents DROP COLUMN document_type_old;
    END IF;
END $$;
