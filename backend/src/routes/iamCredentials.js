const express = require('express')
const { db } = require('../database/db')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// Get all IAM credentials
router.get('/', authenticateToken, (req, res) => {
  try {
    const credentials = db.prepare(`
      SELECT ic.id, ic.name, ic.description, ic.region, ic.created_at, ic.updated_at,
             u.name as created_by_name
      FROM iam_credentials ic
      LEFT JOIN users u ON ic.created_by = u.id
      ORDER BY ic.created_at DESC
    `).all()

    res.json({
      success: true,
      data: credentials
    })
  } catch (error) {
    console.error('Error fetching IAM credentials:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch IAM credentials'
    })
  }
})

// Get IAM credential by ID
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params

    const credential = db.prepare(`
      SELECT ic.id, ic.name, ic.description, ic.region, ic.created_at, ic.updated_at,
             u.name as created_by_name
      FROM iam_credentials ic
      LEFT JOIN users u ON ic.created_by = u.id
      WHERE ic.id = ?
    `).get(id)

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'IAM credential not found'
      })
    }

    res.json({
      success: true,
      data: credential
    })
  } catch (error) {
    console.error('Error fetching IAM credential:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch IAM credential'
    })
  }
})

// Create new IAM credential
router.post('/', authenticateToken, (req, res) => {
  try {
    const { name, description, access_key_id, secret_access_key, region } = req.body

    if (!name || !access_key_id || !secret_access_key) {
      return res.status(400).json({
        success: false,
        message: 'Name, access key ID, and secret access key are required'
      })
    }

    const insertStmt = db.prepare(`
      INSERT INTO iam_credentials (name, description, access_key_id, secret_access_key, region, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    const result = insertStmt.run(
      name,
      description || null,
      access_key_id,
      secret_access_key,
      region || 'us-east-1',
      req.user.id
    )

    const newCredential = db.prepare(`
      SELECT ic.id, ic.name, ic.description, ic.region, ic.created_at, ic.updated_at,
             u.name as created_by_name
      FROM iam_credentials ic
      LEFT JOIN users u ON ic.created_by = u.id
      WHERE ic.id = ?
    `).get(result.lastInsertRowid)

    res.status(201).json({
      success: true,
      message: 'IAM credential created successfully',
      data: newCredential
    })
  } catch (error) {
    console.error('Error creating IAM credential:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create IAM credential'
    })
  }
})

// Update IAM credential
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params
    const { name, description, access_key_id, secret_access_key, region } = req.body

    const existingCredential = db.prepare('SELECT created_by FROM iam_credentials WHERE id = ?').get(id)
    if (!existingCredential) {
      return res.status(404).json({
        success: false,
        message: 'IAM credential not found'
      })
    }

    if (existingCredential.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      })
    }

    const updateStmt = db.prepare(`
      UPDATE iam_credentials 
      SET name = ?, description = ?, access_key_id = ?, secret_access_key = ?, region = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)

    updateStmt.run(name, description, access_key_id, secret_access_key, region, id)

    const updatedCredential = db.prepare(`
      SELECT ic.id, ic.name, ic.description, ic.region, ic.created_at, ic.updated_at,
             u.name as created_by_name
      FROM iam_credentials ic
      LEFT JOIN users u ON ic.created_by = u.id
      WHERE ic.id = ?
    `).get(id)

    res.json({
      success: true,
      message: 'IAM credential updated successfully',
      data: updatedCredential
    })
  } catch (error) {
    console.error('Error updating IAM credential:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update IAM credential'
    })
  }
})

// Delete IAM credential
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params

    const existingCredential = db.prepare('SELECT created_by FROM iam_credentials WHERE id = ?').get(id)
    if (!existingCredential) {
      return res.status(404).json({
        success: false,
        message: 'IAM credential not found'
      })
    }

    if (existingCredential.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      })
    }

    // Check if credential is being used by any target groups
    const usageCount = db.prepare('SELECT COUNT(*) as count FROM target_groups WHERE iam_credential_id = ?').get(id)
    if (usageCount.count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete IAM credential that is being used by target groups'
      })
    }

    const deleteStmt = db.prepare('DELETE FROM iam_credentials WHERE id = ?')
    deleteStmt.run(id)

    res.json({
      success: true,
      message: 'IAM credential deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting IAM credential:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete IAM credential'
    })
  }
})

module.exports = router 