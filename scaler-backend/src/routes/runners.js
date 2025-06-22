const express = require('express')
const router = express.Router()
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const { db } = require('../database/db')

// Get all runners
router.get('/', authenticateToken, (req, res) => {
  try {
    const runners = db.prepare(`
      SELECT r.*, u.name as created_by_name
      FROM runners r
      LEFT JOIN users u ON r.created_by = u.id
      ORDER BY r.name ASC
    `).all()

    res.json({
      success: true,
      runners
    })
  } catch (error) {
    console.error('Error fetching runners:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch runners'
    })
  }
})

// Get a specific runner
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params

    const runner = db.prepare(`
      SELECT r.*, u.name as created_by_name
      FROM runners r
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.id = ?
    `).get(id)

    if (!runner) {
      return res.status(404).json({
        success: false,
        message: 'Runner not found'
      })
    }

    res.json({
      success: true,
      runner
    })
  } catch (error) {
    console.error('Error fetching runner:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch runner'
    })
  }
})

// Create a new runner (admin only)
router.post('/', requireAdmin, (req, res) => {
  try {
    const { name, description, init_code } = req.body
    const userId = req.user.id

    // Validate required fields
    if (!name || !init_code) {
      return res.status(400).json({
        success: false,
        message: 'Name and init_code are required'
      })
    }

    // Validate that init_code contains {{SCRIPT_CONTENT}} placeholder
    if (!init_code.includes('{{SCRIPT_CONTENT}}')) {
      return res.status(400).json({
        success: false,
        message: 'Init code must contain {{SCRIPT_CONTENT}} placeholder'
      })
    }

    // Check if runner name already exists
    const existingRunner = db.prepare('SELECT id FROM runners WHERE name = ?').get(name)
    if (existingRunner) {
      return res.status(400).json({
        success: false,
        message: 'A runner with this name already exists'
      })
    }

    const result = db.prepare(`
      INSERT INTO runners (name, description, init_code, created_by)
      VALUES (?, ?, ?, ?)
    `).run(name, description || null, init_code, userId)

    const newRunner = db.prepare(`
      SELECT r.*, u.name as created_by_name
      FROM runners r
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.id = ?
    `).get(result.lastInsertRowid)

    res.status(201).json({
      success: true,
      message: 'Runner created successfully',
      runner: newRunner
    })
  } catch (error) {
    console.error('Error creating runner:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create runner'
    })
  }
})

// Update a runner (admin only)
router.put('/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params
    const { name, description, init_code } = req.body

    // Check if runner exists
    const existingRunner = db.prepare('SELECT * FROM runners WHERE id = ?').get(id)
    if (!existingRunner) {
      return res.status(404).json({
        success: false,
        message: 'Runner not found'
      })
    }

    // Prevent updating system runners (created_by is NULL)
    if (existingRunner.created_by === null) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify system runners'
      })
    }

    // Validate required fields
    if (!name || !init_code) {
      return res.status(400).json({
        success: false,
        message: 'Name and init_code are required'
      })
    }

    // Validate that init_code contains {{SCRIPT_CONTENT}} placeholder
    if (!init_code.includes('{{SCRIPT_CONTENT}}')) {
      return res.status(400).json({
        success: false,
        message: 'Init code must contain {{SCRIPT_CONTENT}} placeholder'
      })
    }

    // Check if new name conflicts with existing runner (excluding current one)
    if (name !== existingRunner.name) {
      const nameConflict = db.prepare('SELECT id FROM runners WHERE name = ? AND id != ?').get(name, id)
      if (nameConflict) {
        return res.status(400).json({
          success: false,
          message: 'A runner with this name already exists'
        })
      }
    }

    db.prepare(`
      UPDATE runners 
      SET name = ?, description = ?, init_code = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, description || null, init_code, id)

    const updatedRunner = db.prepare(`
      SELECT r.*, u.name as created_by_name
      FROM runners r
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.id = ?
    `).get(id)

    res.json({
      success: true,
      message: 'Runner updated successfully',
      runner: updatedRunner
    })
  } catch (error) {
    console.error('Error updating runner:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update runner'
    })
  }
})

// Delete a runner (admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params

    // Check if runner exists
    const existingRunner = db.prepare('SELECT * FROM runners WHERE id = ?').get(id)
    if (!existingRunner) {
      return res.status(404).json({
        success: false,
        message: 'Runner not found'
      })
    }

    // Prevent deleting system runners (created_by is NULL)
    if (existingRunner.created_by === null) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete system runners'
      })
    }

    // Check if runner is being used by any scripts
    const scriptsUsingRunner = db.prepare('SELECT COUNT(*) as count FROM scripts WHERE runner_id = ?').get(id)
    if (scriptsUsingRunner.count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete runner. It is currently used by ${scriptsUsingRunner.count} script(s)`
      })
    }

    db.prepare('DELETE FROM runners WHERE id = ?').run(id)

    res.json({
      success: true,
      message: 'Runner deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting runner:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete runner'
    })
  }
})

module.exports = router 