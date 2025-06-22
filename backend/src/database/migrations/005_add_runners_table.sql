-- Migration: Add runners table and update scripts to use runner_id
-- Date: 2024-01-XX
-- Description: Add support for custom runners with init code

-- Create runners table
CREATE TABLE IF NOT EXISTS runners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    init_code TEXT NOT NULL,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default runners
INSERT INTO runners (name, description, init_code, created_by) VALUES 
(
    'bash',
    'Standard Bash script runner',
    '#!/bin/bash
set -e

# Execute the script content directly
{{SCRIPT_CONTENT}}',
    NULL
),
(
    'rails',
    'Ruby on Rails runner for executing Ruby code in Rails context',
    '#!/bin/bash
set -e

# Function to find Rails root directory
find_rails_root() {
  local current_dir="$PWD"
  
  # Common Rails deployment paths to check
  local paths=(
    "/var/app/current"           # AWS Elastic Beanstalk
    "/home/deploy/current"       # Capistrano deployment
    "/app"                       # Docker containers
    "/var/www/html"             # Traditional web server
    "/home/webapp"              # Custom deployment
    "/opt/app"                  # Custom deployment
    "$current_dir"              # Current directory
  )
  
  for path in "${paths[@]}"; do
    if [[ -f "$path/config/application.rb" && -f "$path/Gemfile" ]]; then
      echo "$path"
      return 0
    fi
  done
  
  # If not found in common paths, search from current directory up
  while [[ "$current_dir" != "/" ]]; do
    if [[ -f "$current_dir/config/application.rb" && -f "$current_dir/Gemfile" ]]; then
      echo "$current_dir"
      return 0
    fi
    current_dir="$(dirname "$current_dir")"
  done
  
  return 1
}

# Function to find Rails executable
find_rails_executable() {
  local rails_root="$1"
  
  # Check for bundler first (most common in production)
  if command -v bundle >/dev/null 2>&1; then
    if [[ -f "$rails_root/Gemfile" ]]; then
      echo "bundle exec rails"
      return 0
    fi
  fi
  
  # Check for rbenv rails (Elastic Beanstalk)
  if [[ -f "/opt/elasticbeanstalk/.rbenv/shims/rails" ]]; then
    echo "/opt/elasticbeanstalk/.rbenv/shims/rails"
    return 0
  fi
  
  # Check for system rails
  if command -v rails >/dev/null 2>&1; then
    echo "rails"
    return 0
  fi
  
  # Check for bin/rails in Rails root
  if [[ -f "$rails_root/bin/rails" ]]; then
    echo "./bin/rails"
    return 0
  fi
  
  return 1
}

# Find Rails application root
echo "🔍 Looking for Rails application..."
RAILS_ROOT=$(find_rails_root)
if [[ $? -ne 0 ]]; then
  echo "❌ Error: Could not find Rails application root directory"
  echo "Searched common paths but no config/application.rb and Gemfile found"
  exit 1
fi

echo "✅ Found Rails application at: $RAILS_ROOT"

# Change to Rails root directory
cd "$RAILS_ROOT" || {
  echo "❌ Error: Could not change to Rails directory: $RAILS_ROOT"
  exit 1
}

# Find Rails executable
echo "🔍 Looking for Rails executable..."
RAILS_CMD=$(find_rails_executable "$RAILS_ROOT")
if [[ $? -ne 0 ]]; then
  echo "❌ Error: Could not find Rails executable"
  echo "Tried: bundle exec rails, /opt/elasticbeanstalk/.rbenv/shims/rails, rails, ./bin/rails"
  exit 1
fi

echo "✅ Found Rails executable: $RAILS_CMD"

# Load environment variables if they exist
if [[ -f "/tmp/paramstore_env.sh" ]]; then
  echo "📝 Loading environment variables from /tmp/paramstore_env.sh"
  source /tmp/paramstore_env.sh
fi

if [[ -f ".env" ]]; then
  echo "📝 Loading environment variables from .env"
  export $(grep -v "^#" .env | xargs)
fi

# Set Rails environment if not already set
export RAILS_ENV=${RAILS_ENV:-production}
echo "🌍 Rails environment: $RAILS_ENV"

# Ensure proper home directory
export HOME=${HOME:-/home/webapp}

echo "🚀 Creating temporary Rails script file..."

# Create temporary Ruby script file
TEMP_FILE="/tmp/rails_script_$(date +%s)_$$.rb"

# Create temporary Ruby script file with proper content
cat > "$TEMP_FILE" << ''RUBY_SCRIPT_EOF''
{{SCRIPT_CONTENT}}
RUBY_SCRIPT_EOF

# Verify the script file was created
if [[ ! -f "$TEMP_FILE" ]]; then
  echo "❌ Error: Failed to create temporary script file"
  exit 1
fi

echo "✅ Temporary script created at: $TEMP_FILE"
echo "🚀 Executing Rails runner script..."
echo "----------------------------------------"

# Execute the Rails runner command with the script file
$RAILS_CMD runner "$TEMP_FILE"
RAILS_EXIT_CODE=$?

echo "----------------------------------------"

# Clean up temporary file
echo "🧹 Cleaning up temporary script file..."
rm -f "$TEMP_FILE"

if [[ $RAILS_EXIT_CODE -eq 0 ]]; then
  echo "✅ Rails runner execution completed successfully"
else
  echo "❌ Rails runner execution failed with exit code: $RAILS_EXIT_CODE"
  exit $RAILS_EXIT_CODE
fi',
    NULL
);

-- Add runner_id column to scripts table
ALTER TABLE scripts ADD COLUMN runner_id INTEGER;

-- Update existing scripts to use the appropriate runner_id based on runner_type
UPDATE scripts SET runner_id = (
    SELECT id FROM runners WHERE name = scripts.runner_type
) WHERE runner_type IS NOT NULL;

-- Set default runner_id to bash for any scripts that don't have one
UPDATE scripts SET runner_id = (
    SELECT id FROM runners WHERE name = 'bash'
) WHERE runner_id IS NULL;

-- Make runner_id NOT NULL after setting defaults
-- Note: SQLite doesn't support adding NOT NULL constraint directly, so we'll handle this in the application

-- Add foreign key constraint (handled in application logic for SQLite compatibility)
-- FOREIGN KEY (runner_id) REFERENCES runners(id) ON DELETE RESTRICT

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_scripts_runner_id ON scripts(runner_id);
CREATE INDEX IF NOT EXISTS idx_runners_name ON runners(name);

-- Note: We'll remove the runner_type column in a future migration after ensuring all data is migrated
-- For now, we'll keep both columns during the transition period 