import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { runnersAPI } from '../lib/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { ArrowLeft, Save, Code, AlertCircle, Shield } from 'lucide-react'

const EditRunnerPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [runner, setRunner] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    init_code: ''
  })
  const [errors, setErrors] = useState({})

  // Redirect if not admin
  if (user?.role !== 'admin') {
    navigate('/runners')
    return null
  }

  useEffect(() => {
    fetchRunner()
  }, [id])

  const fetchRunner = async () => {
    try {
      setLoading(true)
      const response = await runnersAPI.getById(id)
      if (response.success) {
        const runnerData = response.runner
        setRunner(runnerData)
        setFormData({
          name: runnerData.name,
          description: runnerData.description || '',
          init_code: runnerData.init_code
        })
      } else {
        alert('Runner not found')
        navigate('/runners')
      }
    } catch (error) {
      console.error('Error fetching runner:', error)
      alert('Failed to fetch runner details')
      navigate('/runners')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Runner name is required'
    }

    if (!formData.init_code.trim()) {
      newErrors.init_code = 'Initialization code is required'
    } else if (!formData.init_code.includes('{{SCRIPT_CONTENT}}')) {
      newErrors.init_code = 'Init code must contain {{SCRIPT_CONTENT}} placeholder'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setSaving(true)
      const response = await runnersAPI.update(id, formData)
      
      if (response.success) {
        alert('Runner updated successfully!')
        navigate(`/runners/${id}`)
      } else {
        alert('Failed to update runner: ' + (response.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error updating runner:', error)
      alert('Failed to update runner. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!runner) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Runner not found</h2>
          <p className="text-gray-600 mt-2">The runner you're trying to edit doesn't exist.</p>
          <Button onClick={() => navigate('/runners')} className="mt-4">
            Back to Runners
          </Button>
        </div>
      </div>
    )
  }

  const isSystemRunner = runner.created_by === null

  if (isSystemRunner) {
    return (
      <div className="p-6">
        <div className="text-center">
          <Shield className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Cannot Edit System Runner</h2>
          <p className="text-gray-600 mt-2">System runners cannot be modified to maintain system stability.</p>
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button onClick={() => navigate('/runners')} variant="outline">
              Back to Runners
            </Button>
            <Button onClick={() => navigate(`/runners/${id}`)}>
              View Runner
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate(`/runners/${id}`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Runner
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Edit Runner
            </h1>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Custom Runner
            </Badge>
          </div>
          <p className="text-gray-600 mt-1">Modify the script execution environment</p>
        </div>
      </div>

      {/* Main Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Runner Name *
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Python, Node.js, Custom Bash"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of what this runner does"
              />
            </div>
          </div>

          {/* Initialization Code */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Initialization Code *</h3>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-blue-900">Required Template Variable</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Your initialization code must include the <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">{'{{SCRIPT_CONTENT}}'}</code> placeholder. 
                    This will be replaced with the actual script content during execution.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Textarea
                id="init_code"
                name="init_code"
                value={formData.init_code}
                onChange={handleInputChange}
                placeholder="#!/bin/bash&#10;# Your initialization code here&#10;# Must include {{SCRIPT_CONTENT}} placeholder&#10;&#10;{{SCRIPT_CONTENT}}"
                rows={15}
                className={`font-mono text-sm ${errors.init_code ? 'border-red-500' : ''}`}
              />
              {errors.init_code && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.init_code}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/runners/${id}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
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
      </Card>
    </div>
  )
}

export default EditRunnerPage 