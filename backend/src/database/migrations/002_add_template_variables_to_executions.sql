-- Migration: Add template variables support to script executions
-- Date: 2024-01-XX
-- Description: Add support for script templating with variables

-- Add template_variables column to store variable values for each execution
ALTER TABLE script_executions ADD COLUMN template_variables TEXT;

-- Verify the migration
-- SELECT COUNT(*) FROM script_executions WHERE template_variables IS NULL; 