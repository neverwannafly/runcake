const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library')
const { db } = require('../database/db')
const config = require('../../config')
const { authenticateToken } = require('../middleware/auth')
const WorkspaceService = require('../services/workspaceService')

const router = express.Router()

// Initialize Google OAuth client
const googleClient = new OAuth2Client(config.google.clientId)

// Check workspace initialization status
router.get('/workspace/status', (req, res) => {
  try {
    const isInitialized = WorkspaceService.isWorkspaceInitialized()
    const workspace = isInitialized ? WorkspaceService.getWorkspace() : null

    res.json({
      success: true,
      data: {
        isInitialized,
        workspace: workspace ? {
          id: workspace.id,
          name: workspace.name,
          emailDomain: workspace.email_domain,
          logoBase64: workspace.logo_base64
        } : null
      }
    })
  } catch (error) {
    console.error('Error checking workspace status:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to check workspace status'
    })
  }
})

// Initialize workspace (first-time setup)
router.post('/workspace/initialize', async (req, res) => {
  try {
    const { workspaceName, emailDomain, adminEmail, adminPassword, adminName, logoBase64 } = req.body

    // Validate required fields
    if (!workspaceName || !emailDomain || !adminEmail || !adminPassword || !adminName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: workspaceName, emailDomain, adminEmail, adminPassword, adminName'
      })
    }

    // Check if workspace already exists
    if (WorkspaceService.isWorkspaceInitialized()) {
      return res.status(400).json({
        success: false,
        message: 'Workspace is already initialized'
      })
    }

    // Validate admin email belongs to workspace domain
    const adminEmailDomain = WorkspaceService.extractDomainFromEmail(adminEmail)
    if (adminEmailDomain !== emailDomain.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Admin email must belong to the workspace domain'
      })
    }

    // Create workspace
    const workspace = WorkspaceService.createWorkspace({
      name: workspaceName,
      emailDomain,
      logoBase64
    })

    // Hash admin password
    const passwordHash = await bcrypt.hash(adminPassword, 12)

    // Create admin user
    const insertUser = db.prepare(`
      INSERT INTO users (email, password_hash, name, role, workspace_id, is_active)
      VALUES (?, ?, ?, 'admin', ?, 1)
    `)

    const userResult = insertUser.run(adminEmail, passwordHash, adminName, workspace.id)

    // Get the created admin user
    const adminUser = db.prepare(`
      SELECT id, email, name, role, workspace_id, is_active, created_at
      FROM users WHERE id = ?
    `).get(userResult.lastInsertRowid)

    // Generate JWT token
    const token = jwt.sign(
      { userId: adminUser.id, email: adminUser.email, role: adminUser.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    )

    res.status(201).json({
      success: true,
      message: 'Workspace initialized successfully',
      data: {
        workspace: {
          id: workspace.id,
          name: workspace.name,
          emailDomain: workspace.email_domain,
          logoBase64: workspace.logo_base64
        },
        user: adminUser,
        token
      }
    })
  } catch (error) {
    console.error('Error initializing workspace:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initialize workspace'
    })
  }
})

// Google OAuth login
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required'
      })
    }

    // Check if workspace is initialized
    if (!WorkspaceService.isWorkspaceInitialized()) {
      return res.status(400).json({
        success: false,
        message: 'Workspace is not initialized. Please complete setup first.'
      })
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: config.google.clientId
    })

    const payload = ticket.getPayload()
    const { sub: googleId, email, name, picture } = payload

    // Check if email is allowed for this workspace
    if (!WorkspaceService.isEmailAllowed(email)) {
      const workspace = WorkspaceService.getWorkspace()
      return res.status(403).json({
        success: false,
        message: `Only users with @${workspace.email_domain} email addresses can access this workspace`
      })
    }

    // Check if user exists
    let user = db.prepare('SELECT * FROM users WHERE email = ? OR google_id = ?').get(email, googleId)

    const workspace = WorkspaceService.getWorkspace()

    if (!user) {
      // Create new user
      const randomPassword = Math.random().toString(36).substring(2, 15);
      const passwordHash = await bcrypt.hash(randomPassword, 12)

      const insertUser = db.prepare(`
        INSERT INTO users (email, name, google_id, avatar_url, role, workspace_id, is_active, password_hash)
        VALUES (?, ?, ?, ?, 'member', ?, 1, ?)
      `)

      const result = insertUser.run(email, name, googleId, picture, workspace.id, passwordHash)

      user = db.prepare(`
        SELECT id, email, name, role, workspace_id, google_id, avatar_url, is_active, created_at
        FROM users WHERE id = ?
      `).get(result.lastInsertRowid)
    } else {
      // Update existing user's Google info if needed
      if (!user.google_id || user.avatar_url !== picture) {
        db.prepare(`
          UPDATE users 
          SET google_id = COALESCE(?, google_id), 
              avatar_url = ?, 
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(googleId, picture, user.id)

        // Refresh user data
        user = db.prepare(`
          SELECT id, email, name, role, workspace_id, google_id, avatar_url, is_active, created_at
          FROM users WHERE id = ?
        `).get(user.id)
      }
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.'
      })
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    )

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token,
        workspace: {
          id: workspace.id,
          name: workspace.name,
          emailDomain: workspace.email_domain,
          logoBase64: workspace.logo_base64
        }
      }
    })
  } catch (error) {
    console.error('Google OAuth error:', error)
    res.status(500).json({
      success: false,
      message: 'Google authentication failed'
    })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      })
    }

    // Get user from database
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    )

    // Get workspace information
    const workspace = WorkspaceService.getWorkspace()

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token,
        workspace: workspace ? {
          id: workspace.id,
          name: workspace.name,
          emailDomain: workspace.email_domain,
          logoBase64: workspace.logo_base64
        } : null
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Get current user (verify token)
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  })
})

// Logout (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  })
})

// Get workspace information (authenticated)
router.get('/workspace', authenticateToken, (req, res) => {
  try {
    const stats = WorkspaceService.getWorkspaceStats()
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      })
    }

    res.json({
      success: true,
      data: {
        workspace: {
          id: stats.workspace.id,
          name: stats.workspace.name,
          emailDomain: stats.workspace.email_domain,
          logoBase64: stats.workspace.logo_base64,
          createdAt: stats.workspace.created_at
        },
        stats: {
          totalUsers: stats.total_users,
          adminUsers: stats.admin_users,
          memberUsers: stats.member_users,
          totalScripts: stats.total_scripts,
          totalTargetGroups: stats.total_target_groups
        }
      }
    })
  } catch (error) {
    console.error('Error fetching workspace:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workspace information'
    })
  }
})

// Update workspace (admin only)
router.put('/workspace', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can update workspace settings'
      })
    }

    const { name, emailDomain, logoBase64 } = req.body
    const workspace = WorkspaceService.getWorkspace()

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      })
    }

    const updatedWorkspace = WorkspaceService.updateWorkspace(workspace.id, {
      name,
      emailDomain,
      logoBase64
    })

    res.json({
      success: true,
      message: 'Workspace updated successfully',
      data: {
        workspace: {
          id: updatedWorkspace.id,
          name: updatedWorkspace.name,
          emailDomain: updatedWorkspace.email_domain,
          logoBase64: updatedWorkspace.logo_base64,
          updatedAt: updatedWorkspace.updated_at
        }
      }
    })
  } catch (error) {
    console.error('Error updating workspace:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update workspace'
    })
  }
})

// Get workspace users (admin only)
router.get('/workspace/users', authenticateToken, (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view user list'
      })
    }

    const workspace = WorkspaceService.getWorkspace()
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      })
    }

    const users = db.prepare(`
      SELECT id, email, name, role, google_id, avatar_url, is_active, created_at, updated_at
      FROM users 
      WHERE workspace_id = ?
      ORDER BY created_at DESC
    `).all(workspace.id)

    res.json({
      success: true,
      data: { users }
    })
  } catch (error) {
    console.error('Error fetching workspace users:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workspace users'
    })
  }
})

// Update user status (admin only)
router.put('/workspace/users/:userId', authenticateToken, (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can manage users'
      })
    }

    const { userId } = req.params
    const { isActive, role } = req.body
    const workspace = WorkspaceService.getWorkspace()

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      })
    }

    // Prevent admin from deactivating themselves
    if (parseInt(userId) === req.user.id && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account'
      })
    }

    // Validate role if provided
    if (role && !['admin', 'member'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be either "admin" or "member"'
      })
    }

    // Check if user exists and belongs to workspace
    const targetUser = db.prepare(`
      SELECT * FROM users WHERE id = ? AND workspace_id = ?
    `).get(userId, workspace.id)

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found in this workspace'
      })
    }

    // Update user
    const updateFields = []
    const updateValues = []

    if (typeof isActive === 'boolean') {
      updateFields.push('is_active = ?')
      updateValues.push(isActive ? 1 : 0)
    }

    if (role) {
      updateFields.push('role = ?')
      updateValues.push(role)
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      })
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP')
    updateValues.push(userId)

    db.prepare(`
      UPDATE users SET ${updateFields.join(', ')} WHERE id = ?
    `).run(...updateValues)

    // Get updated user
    const updatedUser = db.prepare(`
      SELECT id, email, name, role, google_id, avatar_url, is_active, created_at, updated_at
      FROM users WHERE id = ?
    `).get(userId)

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser }
    })
  } catch (error) {
    console.error('Error updating user:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    })
  }
})

// Proxy avatar images to avoid rate limiting
router.get('/avatar/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    
    // Get user's avatar URL from database (no workspace restriction for public access)
    const user = db.prepare('SELECT avatar_url FROM users WHERE id = ?')
      .get(userId)
    
    if (!user || !user.avatar_url) {
      return res.status(404).json({ success: false, message: 'Avatar not found' })
    }

    // Fetch and proxy the image
    const fetch = require('node-fetch')
    const response = await fetch(user.avatar_url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ScalerBot/1.0)',
        'Accept': 'image/*'
      }
    })
    
    if (!response.ok) {
      console.error(`Failed to fetch avatar: ${response.status} ${response.statusText}`)
      return res.status(404).json({ success: false, message: 'Avatar not available' })
    }

    // Get the image buffer
    const imageBuffer = await response.buffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    // Set proper headers for image response
    res.set({
      'Content-Type': contentType,
      'Content-Length': imageBuffer.length,
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    })

    // Send the image buffer
    res.send(imageBuffer)
  } catch (error) {
    console.error('Avatar proxy error:', error)
    res.status(500).json({ success: false, message: 'Failed to load avatar' })
  }
})

module.exports = router