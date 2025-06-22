-- Add permission level to scripts table
-- Permission levels: 'admin_only', 'member_allowed'
-- Default is 'member_allowed' for backward compatibility

ALTER TABLE scripts ADD COLUMN permission_level TEXT DEFAULT 'member_allowed' CHECK (permission_level IN ('admin_only', 'member_allowed'));

-- Update existing scripts to be admin_only if needed (optional, can be customized)
-- For now, we'll keep all existing scripts as member_allowed for backward compatibility 