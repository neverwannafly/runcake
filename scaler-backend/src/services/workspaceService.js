const { db } = require('../database/db')

class WorkspaceService {
  /**
   * Check if workspace is initialized (any workspace exists)
   */
  static isWorkspaceInitialized() {
    try {
      const workspace = db.prepare('SELECT id FROM workspace LIMIT 1').get()
      return !!workspace
    } catch (error) {
      console.error('Error checking workspace initialization:', error)
      return false
    }
  }

  /**
   * Get the current workspace
   */
  static getWorkspace() {
    try {
      return db.prepare('SELECT * FROM workspace LIMIT 1').get()
    } catch (error) {
      console.error('Error fetching workspace:', error)
      return null
    }
  }

  /**
   * Create initial workspace
   */
  static createWorkspace({ name, emailDomain, logoBase64 }) {
    try {
      // Validate email domain format
      if (!this.isValidEmailDomain(emailDomain)) {
        throw new Error('Invalid email domain format')
      }

      // Validate logo size if provided
      if (logoBase64 && !this.isValidLogoSize(logoBase64)) {
        throw new Error('Logo file too large. Maximum size is 2MB')
      }

      const insertStmt = db.prepare(`
        INSERT INTO workspace (name, email_domain, logo_base64)
        VALUES (?, ?, ?)
      `)

      const result = insertStmt.run(name, emailDomain.toLowerCase(), logoBase64)

      return db.prepare('SELECT * FROM workspace WHERE id = ?').get(result.lastInsertRowid)
    } catch (error) {
      console.error('Error creating workspace:', error)
      throw error
    }
  }

  /**
   * Update workspace
   */
  static updateWorkspace(id, { name, emailDomain, logoBase64 }) {
    try {
      // Validate email domain format
      if (emailDomain && !this.isValidEmailDomain(emailDomain)) {
        throw new Error('Invalid email domain format')
      }

      // Validate logo size if provided
      if (logoBase64 && !this.isValidLogoSize(logoBase64)) {
        throw new Error('Logo file too large. Maximum size is 2MB')
      }

      const updateStmt = db.prepare(`
        UPDATE workspace 
        SET name = COALESCE(?, name),
            email_domain = COALESCE(?, email_domain),
            logo_base64 = COALESCE(?, logo_base64),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)

      updateStmt.run(
        name || null,
        emailDomain ? emailDomain.toLowerCase() : null,
        logoBase64 || null,
        id
      )

      return db.prepare('SELECT * FROM workspace WHERE id = ?').get(id)
    } catch (error) {
      console.error('Error updating workspace:', error)
      throw error
    }
  }

  /**
   * Check if email belongs to workspace domain
   */
  static isEmailAllowed(email) {
    try {
      const workspace = this.getWorkspace()
      if (!workspace) return false

      const emailDomain = email.split('@')[1]?.toLowerCase()
      return emailDomain === workspace.email_domain
    } catch (error) {
      console.error('Error checking email domain:', error)
      return false
    }
  }

  /**
   * Extract domain from email
   */
  static extractDomainFromEmail(email) {
    return email.split('@')[1]?.toLowerCase()
  }

  /**
   * Validate email domain format
   */
  static isValidEmailDomain(domain) {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/
    return domainRegex.test(domain)
  }

  /**
   * Validate logo base64 size (max 2MB)
   */
  static isValidLogoSize(base64String) {
    if (!base64String) return true
    
    // Remove data URL prefix if present
    const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '')
    
    // Calculate size in bytes (base64 is ~33% larger than original)
    const sizeInBytes = (base64Data.length * 3) / 4
    const maxSizeInBytes = 2 * 1024 * 1024 // 2MB
    
    return sizeInBytes <= maxSizeInBytes
  }

  /**
   * Get workspace statistics
   */
  static getWorkspaceStats() {
    try {
      const workspace = this.getWorkspace()
      if (!workspace) return null

      const stats = db.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE workspace_id = ? AND is_active = 1) as total_users,
          (SELECT COUNT(*) FROM users WHERE workspace_id = ? AND role = 'admin' AND is_active = 1) as admin_users,
          (SELECT COUNT(*) FROM users WHERE workspace_id = ? AND role = 'member' AND is_active = 1) as member_users,
          (SELECT COUNT(*) FROM scripts WHERE created_by IN (SELECT id FROM users WHERE workspace_id = ?)) as total_scripts,
          (SELECT COUNT(*) FROM target_groups WHERE created_by IN (SELECT id FROM users WHERE workspace_id = ?)) as total_target_groups
      `).get(workspace.id, workspace.id, workspace.id, workspace.id, workspace.id)

      return {
        workspace,
        ...stats
      }
    } catch (error) {
      console.error('Error fetching workspace stats:', error)
      return null
    }
  }
}

module.exports = WorkspaceService 