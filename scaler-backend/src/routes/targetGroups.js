const express = require('express')
const { db } = require('../database/db')
const { authenticateToken } = require('../middleware/auth')
const AWSService = require('../services/awsService')

const router = express.Router()

// Get all target groups
router.get('/', authenticateToken, (req, res) => {
  try {
    const targetGroups = db.prepare(`
      SELECT tg.*, ic.name as credential_name, u.name as created_by_name
      FROM target_groups tg
      LEFT JOIN iam_credentials ic ON tg.iam_credential_id = ic.id
      LEFT JOIN users u ON tg.created_by = u.id
      ORDER BY tg.created_at DESC
    `).all()

    res.json({
      success: true,
      data: targetGroups
    })
  } catch (error) {
    console.error('Error fetching target groups:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch target groups'
    })
  }
})

// Get target group by ID
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params

    const targetGroup = db.prepare(`
      SELECT tg.*, ic.name as credential_name, u.name as created_by_name
      FROM target_groups tg
      LEFT JOIN iam_credentials ic ON tg.iam_credential_id = ic.id
      LEFT JOIN users u ON tg.created_by = u.id
      WHERE tg.id = ?
    `).get(id)

    if (!targetGroup) {
      return res.status(404).json({
        success: false,
        message: 'Target group not found'
      })
    }

    res.json({
      success: true,
      data: targetGroup
    })
  } catch (error) {
    console.error('Error fetching target group:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch target group'
    })
  }
})

// Preview AWS instances for a target group
router.get('/:id/preview', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Get target group and its credentials
    const targetGroup = db.prepare(`
      SELECT tg.*, ic.*
      FROM target_groups tg
      JOIN iam_credentials ic ON tg.iam_credential_id = ic.id
      WHERE tg.id = ?
    `).get(id)

    if (!targetGroup) {
      return res.status(404).json({
        success: false,
        message: 'Target group not found'
      })
    }

    // Create AWS service instance
    console.log('hello');
    console.log(targetGroup)
    const awsService = new AWSService({
      access_key_id: targetGroup.access_key_id,
      secret_access_key: targetGroup.secret_access_key,
      region: targetGroup.region
    })

    // Fetch instances by tag
    const result = await awsService.getInstancesByTag(
      targetGroup.aws_tag_key,
      targetGroup.aws_tag_value
    )

    res.json({
      success: result.success,
      data: {
        targetGroup: {
          id: targetGroup.id,
          name: targetGroup.name,
          description: targetGroup.description,
          aws_tag_key: targetGroup.aws_tag_key,
          aws_tag_value: targetGroup.aws_tag_value,
          region: targetGroup.region
        },
        instances: result.instances,
        total: result.total,
        error: result.error
      }
    })
  } catch (error) {
    console.error('Error previewing instances:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to preview instances',
      error: error.message
    })
  }
})

// Create new target group
router.post('/', authenticateToken, (req, res) => {
  try {
    const { name, description, aws_tag_key, aws_tag_value, region, iam_credential_id } = req.body

    if (!name || !aws_tag_key || !aws_tag_value || !iam_credential_id) {
      return res.status(400).json({
        success: false,
        message: 'Name, AWS tag key, AWS tag value, and IAM credential ID are required'
      })
    }

    // Verify IAM credential exists
    const credential = db.prepare('SELECT id FROM iam_credentials WHERE id = ?').get(iam_credential_id)
    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Invalid IAM credential ID'
      })
    }

    const insertStmt = db.prepare(`
      INSERT INTO target_groups (name, description, aws_tag_key, aws_tag_value, region, iam_credential_id, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const result = insertStmt.run(
      name,
      description || null,
      aws_tag_key,
      aws_tag_value,
      region || 'us-east-1',
      iam_credential_id,
      req.user.id
    )

    const newTargetGroup = db.prepare(`
      SELECT tg.*, ic.name as credential_name, u.name as created_by_name
      FROM target_groups tg
      LEFT JOIN iam_credentials ic ON tg.iam_credential_id = ic.id
      LEFT JOIN users u ON tg.created_by = u.id
      WHERE tg.id = ?
    `).get(result.lastInsertRowid)

    res.status(201).json({
      success: true,
      message: 'Target group created successfully',
      data: newTargetGroup
    })
  } catch (error) {
    console.error('Error creating target group:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create target group'
    })
  }
})

// Update target group
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params
    const { name, description, aws_tag_key, aws_tag_value, region, iam_credential_id } = req.body

    // Check if target group exists
    const existingGroup = db.prepare('SELECT created_by FROM target_groups WHERE id = ?').get(id)
    if (!existingGroup) {
      return res.status(404).json({
        success: false,
        message: 'Target group not found'
      })
    }

    // Check permissions (only creator or admin can update)
    if (existingGroup.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      })
    }

    const updateStmt = db.prepare(`
      UPDATE target_groups 
      SET name = ?, description = ?, aws_tag_key = ?, aws_tag_value = ?, region = ?, iam_credential_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)

    updateStmt.run(name, description, aws_tag_key, aws_tag_value, region, iam_credential_id, id)

    const updatedGroup = db.prepare(`
      SELECT tg.*, ic.name as credential_name, u.name as created_by_name
      FROM target_groups tg
      LEFT JOIN iam_credentials ic ON tg.iam_credential_id = ic.id
      LEFT JOIN users u ON tg.created_by = u.id
      WHERE tg.id = ?
    `).get(id)

    res.json({
      success: true,
      message: 'Target group updated successfully',
      data: updatedGroup
    })
  } catch (error) {
    console.error('Error updating target group:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update target group'
    })
  }
})

// Delete target group
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params

    const existingGroup = db.prepare('SELECT created_by FROM target_groups WHERE id = ?').get(id)
    if (!existingGroup) {
      return res.status(404).json({
        success: false,
        message: 'Target group not found'
      })
    }

    if (existingGroup.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      })
    }

    const deleteStmt = db.prepare('DELETE FROM target_groups WHERE id = ?')
    deleteStmt.run(id)

    res.json({
      success: true,
      message: 'Target group deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting target group:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete target group'
    })
  }
})

module.exports = router 