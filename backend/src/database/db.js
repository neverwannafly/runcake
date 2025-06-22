const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const config = require('../../config')

class DatabaseManager {
  constructor() {
    this.db = null
    this.initialize()
  }

  initialize() {
    // Ensure database directory exists
    const dbDir = path.dirname(config.database.path)
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    // Initialize database connection
    this.db = new Database(config.database.path)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')

    // Initialize schema
    this.initializeSchema()
    this.runMigrations()
  }

  initializeSchema() {
    const schemaPath = path.join(__dirname, 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    // Split by semicolon and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim())
    
    statements.forEach(statement => {
      if (statement.trim()) {
        this.db.exec(statement + ';')
      }
    })

    console.log('Database schema initialized successfully')
  }

  runMigrations() {
    // Create migrations table to track applied migrations
    const createMigrationsTable = `
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT UNIQUE NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
    this.db.exec(createMigrationsTable)

    // Get applied migrations
    const appliedStmt = this.db.prepare('SELECT filename FROM migrations ORDER BY filename')
    const appliedMigrations = appliedStmt.all().map(row => row.filename)

    // Get migration files
    const migrationsDir = path.join(__dirname, 'migrations')
    
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true })
      console.log('Created migrations directory')
      return
    }
    
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort()
    
    if (migrationFiles.length === 0) {
      return
    }

    console.log(`Found ${migrationFiles.length} migration files`)
    
    let appliedCount = 0
    const markMigrationStmt = this.db.prepare('INSERT INTO migrations (filename) VALUES (?)')
    
    for (const filename of migrationFiles) {
      if (appliedMigrations.includes(filename)) {
        continue
      }
      
      console.log(`Applying migration: ${filename}`)
      
      try {
        const migrationPath = path.join(migrationsDir, filename)
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
        
        // Execute migration
        this.db.exec(migrationSQL)
        
        // Mark as applied
        markMigrationStmt.run(filename)
        
        console.log(`✅ Applied migration: ${filename}`)
        appliedCount++
      } catch (error) {
        console.error(`❌ Error applying migration ${filename}:`, error.message)
        throw error
      }
    }
    
    if (appliedCount > 0) {
      console.log(`Applied ${appliedCount} new migration(s)`)
    }
  }

  getConnection() {
    return this.db
  }

  close() {
    if (this.db) {
      this.db.close()
    }
  }
}

// Create singleton instance
const dbManager = new DatabaseManager()

module.exports = {
  db: dbManager.getConnection(),
  close: () => dbManager.close()
} 