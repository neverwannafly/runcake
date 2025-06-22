const fs = require('fs')
const path = require('path')
const { db } = require('./db')

// Create migrations table to track applied migrations
const createMigrationsTable = () => {
  const createTable = `
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT UNIQUE NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `
  db.exec(createTable)
}

// Get list of applied migrations
const getAppliedMigrations = () => {
  const stmt = db.prepare('SELECT filename FROM migrations ORDER BY filename')
  return stmt.all().map(row => row.filename)
}

// Mark migration as applied
const markMigrationApplied = (filename) => {
  const stmt = db.prepare('INSERT INTO migrations (filename) VALUES (?)')
  stmt.run(filename)
}

// Run pending migrations
const runMigrations = () => {
  console.log('🚀 Running database migrations...')
  
  // Ensure migrations table exists
  createMigrationsTable()
  
  // Get applied migrations
  const appliedMigrations = getAppliedMigrations()
  console.log(`📋 Applied migrations: ${appliedMigrations.length}`)
  
  // Get migration files
  const migrationsDir = path.join(__dirname, 'migrations')
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('📁 No migrations directory found, creating...')
    fs.mkdirSync(migrationsDir, { recursive: true })
    return
  }
  
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort()
  
  console.log(`📄 Found ${migrationFiles.length} migration files`)
  
  let appliedCount = 0
  
  for (const filename of migrationFiles) {
    if (appliedMigrations.includes(filename)) {
      console.log(`⏭️  Skipping already applied migration: ${filename}`)
      continue
    }
    
    console.log(`⚡ Applying migration: ${filename}`)
    
    try {
      const migrationPath = path.join(migrationsDir, filename)
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
      
      // Execute migration
      db.exec(migrationSQL)
      
      // Mark as applied
      markMigrationApplied(filename)
      
      console.log(`✅ Successfully applied: ${filename}`)
      appliedCount++
    } catch (error) {
      console.error(`❌ Error applying migration ${filename}:`, error.message)
      process.exit(1)
    }
  }
  
  if (appliedCount === 0) {
    console.log('📝 No new migrations to apply')
  } else {
    console.log(`🎉 Successfully applied ${appliedCount} new migration(s)`)
  }
}

module.exports = {
  runMigrations
}

// If run directly
if (require.main === module) {
  runMigrations()
} 