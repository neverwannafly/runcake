const jwt = require('jsonwebtoken')
const { db } = require('../database/db')
const config = require('../../config')

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    })
  }

  jwt.verify(token, config.jwt.secret, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      })
    }

    // Get user from database
    const user = db.prepare(`
      SELECT id, email, name, role, workspace_id, is_active, google_id, avatar_url
      FROM users WHERE id = ?
    `).get(decoded.userId)
    
    if (!user) {
      return res.status(403).json({
        success: false,
        message: 'User not found'
      })
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated'
      })
    }

    req.user = user
    next()
  })
}

const requireAdmin = (req, res, next) => {
  // First authenticate the user
  authenticateToken(req, res, (err) => {
    if (err) {
      return next(err)
    }
    
    // Then check if user is admin
    if (req.user && req.user.role === 'admin') {
      next()
    } else {
      res.status(403).json({
        success: false,
        message: 'Admin access required'
      })
    }
  })
}

module.exports = {
  authenticateToken,
  requireAdmin
} 