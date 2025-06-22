import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { scriptsAPI, runnersAPI } from '../lib/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { ArrowLeft, Save, X } from 'lucide-react'

const EditScriptPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    tags: [],
    runner_id: 1,
    permission_level: 'member_allowed'
  })
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [runners, setRunners] = useState([])
  const [loadingRunners, setLoadingRunners] = useState(true)

  useEffect(() => {
    fetchScript()
    fetchRunners()
  }, [id])

  const fetchRunners = async () => {
    try {
      const response = await runnersAPI.getAll()
      if (response.success) {
        setRunners(response.runners)
      }
    } catch (error) {
      console.error('Error fetching runners:', error)
    } finally {
      setLoadingRunners(false)
    }
  }

  const fetchScript = async () => {
    try {
      setIsLoading(true)
      const response = await scriptsAPI.getById(id)
      if (response.success) {
        const script = response.data
        setFormData({
          name: script.name,
          description: script.description || '',
          content: script.content,
          tags: script.tags || [],
          runner_id: script.runner_id || 1,
          permission_level: script.permission_level || 'member_allowed'
        })
      } else {
        setErrors({ fetch: response.message || 'Failed to fetch script' })
      }
    } catch (error) {
      console.error('Error fetching script:', error)
      setErrors({ fetch: error.message || 'Failed to fetch script' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleAddTag = (e) => {
    e.preventDefault()
    const tag = tagInput.trim().toLowerCase()
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Script name is required'
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Script content is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setIsSubmitting(true)
      setErrors({})
      
      const response = await scriptsAPI.update(id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        content: formData.content.trim(),
        tags: formData.tags,
        runner_id: formData.runner_id,
        permission_level: formData.permission_level
      })

      if (response.success) {
        navigate(`/scripts/${id}`)
      } else {
        setErrors({ submit: response.message || 'Failed to update script' })
      }
    } catch (error) {
      console.error('Error updating script:', error)
      setErrors({ submit: error.message || 'Failed to update script. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="max-w-4xl">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  if (errors.fetch) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-red-600 text-lg font-medium mb-2">Error loading script</div>
          <p className="text-gray-600 mb-4">{errors.fetch}</p>
          <Button onClick={() => navigate('/scripts')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Scripts
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={() => navigate(`/scripts/${id}`)}
          className="p-2 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Edit Script
          </h1>
          <p className="text-gray-600 mt-1">
            Modify your automation script
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-4xl">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Script Details</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Script Name *
              </label>
              <Input
                id="name"
                placeholder="Enter script name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={errors.name ? 'border-red-500 focus:border-red-500' : ''}
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description
              </label>
              <Input
                id="description"
                placeholder="Brief description of what this script does"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Runner Selection */}
            <div className="space-y-2">
              <label htmlFor="runner_id" className="text-sm font-medium text-gray-700">
                Script Runner *
              </label>
              {loadingRunners ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    <span className="text-sm text-gray-500">Loading runners...</span>
                  </div>
                </div>
              ) : (
                <select
                  id="runner_id"
                  value={formData.runner_id}
                  onChange={(e) => handleInputChange('runner_id', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {runners.map(runner => (
                    <option key={runner.id} value={runner.id}>
                      {runner.name} - {runner.description || 'Custom execution environment'}
                    </option>
                  ))}
                </select>
              )}
              {!loadingRunners && (
                <p className="text-xs text-gray-500">
                  {(() => {
                    const selectedRunner = runners.find(r => r.id === formData.runner_id)
                    return selectedRunner?.description || 'Custom script execution environment'
                  })()}
                </p>
              )}
            </div>

            {/* Permission Level */}
            <div className="space-y-2">
              <label htmlFor="permission_level" className="text-sm font-medium text-gray-700">
                Permission Level *
              </label>
              <select
                id="permission_level"
                value={formData.permission_level}
                onChange={(e) => handleInputChange('permission_level', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                disabled={isSubmitting}
              >
                <option value="member_allowed">Member Allowed - All users can view and execute</option>
                <option value="admin_only">Admin Only - Only administrators can view and execute</option>
              </select>
              <p className="text-xs text-gray-500">
                {formData.permission_level === 'member_allowed' 
                  ? 'This script will be visible and executable by all workspace members.'
                  : 'This script will only be visible and executable by administrators.'
                }
              </p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label htmlFor="tags" className="text-sm font-medium text-gray-700">
                Tags
              </label>
              <div className="flex space-x-2">
                <Input
                  id="tags"
                  placeholder="Add a tag and press Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddTag(e)
                    }
                  }}
                  disabled={isSubmitting}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleAddTag}
                  disabled={isSubmitting}
                >
                  Add Tag
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-red-600"
                        onClick={() => !isSubmitting && handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium text-gray-700">
                Script Content *
              </label>
              <Textarea
                id="content"
                placeholder={(() => {
                  const selectedRunner = runners.find(r => r.id === formData.runner_id)
                  if (selectedRunner?.name?.toLowerCase() === 'rails') {
                    return `# Rails Runner Script
puts "Hello from Rails!"
User.count
# Add your Ruby code here...
# This will run in Rails application context`
                  } else if (selectedRunner?.name?.toLowerCase() === 'python') {
                    return `# Python Script
import os
print("Hello from Python!")
print(f"Current directory: {os.getcwd()}")
# Add your Python code here...`
                  } else if (selectedRunner?.name?.toLowerCase().includes('node')) {
                    return `// Node.js Script
const fs = require('fs');
console.log('Hello from Node.js!');
console.log('Current directory:', process.cwd());
// Add your JavaScript code here...`
                  } else {
                    return `#!/bin/bash
echo "Hello World"
# Add your bash commands here...`
                  }
                })()}
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                className={`min-h-[300px] font-mono text-sm ${errors.content ? 'border-red-500 focus:border-red-500' : ''}`}
                disabled={isSubmitting}
              />
              {errors.content && (
                <p className="text-sm text-red-600">{errors.content}</p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/scripts/${id}`)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}

export default EditScriptPage 