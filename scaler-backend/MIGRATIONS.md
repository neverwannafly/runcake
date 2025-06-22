# Database Migrations

This document explains how to use the database migration system in the Scaler backend.

## Overview

The migration system allows you to version and track database schema changes. Migrations are automatically applied when the application starts, and you can also run them manually.

## Migration Files

Migration files are stored in `src/database/migrations/` and follow the naming convention:
```
001_description_of_change.sql
002_another_change.sql
```

## Available Commands

### Automatic Migrations
Migrations run automatically when the application starts:
```bash
npm run dev  # or npm start
```

### Manual Migrations
To run migrations manually:
```bash
npm run migrate
```

## Current Migrations

### 001_add_runner_type_to_scripts.sql
- **Purpose**: Adds support for different script execution runners (bash, rails)
- **Changes**: 
  - Adds `runner_type` column to `scripts` table
  - Sets default value to 'bash'
  - Adds CHECK constraint to enforce valid values ('bash', 'rails')

## Migration Status

The system tracks which migrations have been applied in the `migrations` table:
```sql
SELECT * FROM migrations;
```

## Creating New Migrations

1. Create a new `.sql` file in `src/database/migrations/`
2. Use incremental numbering (e.g., `002_`, `003_`, etc.)
3. Include descriptive comment headers
4. Test the migration before committing

### Example Migration File:
```sql
-- Migration: Add new feature
-- Date: 2024-01-XX
-- Description: Brief description of what this migration does

-- Your SQL statements here
ALTER TABLE some_table ADD COLUMN new_column TEXT;

-- Optional verification queries (commented out)
-- SELECT COUNT(*) FROM some_table WHERE new_column IS NOT NULL;
```

## Troubleshooting

### Node.js Version Issues
If you get native module compilation errors:
```bash
npm rebuild better-sqlite3
```

### Migration Failures
If a migration fails:
1. Check the error message
2. Fix the SQL in the migration file
3. Remove the failed migration from the `migrations` table if necessary:
   ```sql
   DELETE FROM migrations WHERE filename = 'failed_migration.sql';
   ```
4. Run the migration again

### Reset Database
To completely reset the database (⚠️ **WARNING: This will delete all data**):
```bash
rm database/scaler.db*
npm run init-db
```

## Best Practices

1. **Always backup** your database before running migrations in production
2. **Test migrations** thoroughly in development first
3. **Keep migrations small** and focused on a single change
4. **Use descriptive names** for migration files
5. **Add comments** to explain complex changes
6. **Never modify existing migrations** that have been applied to production 