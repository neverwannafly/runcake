-- Migration: Add workspace support and enhanced roles
-- Date: 2024-01-XX
-- Description: Add workspace table, update user roles, and support for domain-based access

-- Create workspace table
CREATE TABLE IF NOT EXISTS workspace (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email_domain TEXT NOT NULL UNIQUE, -- e.g., 'scaler.com'
    logo_base64 TEXT, -- Base64 encoded logo image
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Update users table to include workspace relationship and enhanced roles
ALTER TABLE users ADD COLUMN workspace_id INTEGER REFERENCES workspace(id);
ALTER TABLE users ADD COLUMN google_id TEXT; -- For Google OAuth
ALTER TABLE users ADD COLUMN avatar_url TEXT; -- Profile picture from Google
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1;

-- Update the role check constraint to include 'member' role
-- Note: SQLite doesn't support modifying constraints, so we'll handle this in application logic

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_workspace_id ON users(workspace_id);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_workspace_email_domain ON workspace(email_domain);

-- Verify the migration
-- SELECT COUNT(*) FROM workspace;
-- SELECT COUNT(*) FROM users WHERE workspace_id IS NOT NULL; 