-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- IAM Credentials table (shared credentials)
CREATE TABLE IF NOT EXISTS iam_credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    access_key_id TEXT NOT NULL,
    secret_access_key TEXT NOT NULL,
    region TEXT DEFAULT 'us-east-1',
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Scripts table
CREATE TABLE IF NOT EXISTS scripts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    runner_type TEXT DEFAULT 'bash' CHECK (runner_type IN ('bash', 'rails')),
    tags TEXT, -- JSON string array
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Target Groups table (AWS resource tags)
CREATE TABLE IF NOT EXISTS target_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    aws_tag_key TEXT NOT NULL,
    aws_tag_value TEXT NOT NULL,
    region TEXT DEFAULT 'us-east-1',
    iam_credential_id INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (iam_credential_id) REFERENCES iam_credentials(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Script Executions table (audit log)
CREATE TABLE IF NOT EXISTS script_executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    script_id INTEGER NOT NULL,
    target_group_id INTEGER NOT NULL,
    execution_mode TEXT DEFAULT 'all' CHECK (execution_mode IN ('all', 'random')),
    instance_ids TEXT, -- JSON string array of target instance IDs
    command_id TEXT, -- AWS SSM command ID
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed', 'cancelled')),
    output TEXT,
    error_message TEXT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    executed_by INTEGER NOT NULL,
    FOREIGN KEY (script_id) REFERENCES scripts(id) ON DELETE CASCADE,
    FOREIGN KEY (target_group_id) REFERENCES target_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (executed_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_scripts_created_by ON scripts(created_by);
CREATE INDEX IF NOT EXISTS idx_target_groups_created_by ON target_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_target_groups_iam_credential ON target_groups(iam_credential_id);
CREATE INDEX IF NOT EXISTS idx_script_executions_script_id ON script_executions(script_id);
CREATE INDEX IF NOT EXISTS idx_script_executions_target_group_id ON script_executions(target_group_id);
CREATE INDEX IF NOT EXISTS idx_script_executions_executed_by ON script_executions(executed_by);
CREATE INDEX IF NOT EXISTS idx_script_executions_status ON script_executions(status);
CREATE INDEX IF NOT EXISTS idx_script_executions_started_at ON script_executions(started_at); 