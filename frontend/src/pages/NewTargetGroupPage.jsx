import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { targetGroupsAPI, iamCredentialsAPI } from '../lib/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Card } from '../components/ui/card'
import { ArrowLeft, Save, Server, Key, Plus, Monitor } from 'lucide-react'

const NewTargetGroupPage = () => {
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    aws_tag_key: '',
    aws_tag_value: '',
    region: 'us-east-1',
    iam_credential_id: ''
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableCredentials, setAvailableCredentials] = useState([])
  const [credentialsLoading, setCredentialsLoading] = useState(true)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewResult, setPreviewResult] = useState(null)

  const awsRegions = [
    { value: 'us-east-1', label: 'US East (N. Virginia)' },
    { value: 'us-east-2', label: 'US East (Ohio)' },
    { value: 'us-west-1', label: 'US West (N. California)' },
    { value: 'us-west-2', label: 'US West (Oregon)' },
    { value: 'eu-west-1', label: 'Europe (Ireland)' },
    { value: 'eu-west-2', label: 'Europe (London)' },
    { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
    { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
    { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
    { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' }
  ]

  useEffect(() => {
    fetchCredentials()
  }, [])

  const fetchCredentials = async () => {
    try {
      setCredentialsLoading(true)
      const response = await iamCredentialsAPI.getAll()
      if (response.success) {
        setAvailableCredentials(response.data)
        // Auto-select first credential if available
        if (response.data.length === 1) {
          setFormData(prev => ({ ...prev, iam_credential_id: response.data[0].id.toString() }))
        }
      }
    } catch (error) {
      console.error('Error fetching credentials:', error)
    } finally {
      setCredentialsLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Target group name is required'
    }
    
    if (!formData.aws_tag_key.trim()) {
      newErrors.aws_tag_key = 'AWS tag key is required'
    }
    
    if (!formData.aws_tag_value.trim()) {
      newErrors.aws_tag_value = 'AWS tag value is required'
    }
    
    if (!formData.region) {
      newErrors.region = 'AWS region is required'
    }

    if (!formData.iam_credential_id) {
      newErrors.iam_credential_id = 'IAM credential is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePreview = async () => {
    if (!formData.aws_tag_key || !formData.aws_tag_value || !formData.iam_credential_id) {
      alert('Please fill in AWS tag configuration and select IAM credentials first.')
      return
    }

    try {
      setPreviewLoading(true)
      setPreviewResult(null)
      
      // Create a temporary target group for preview
      const tempTargetGroup = {
        name: formData.name || 'Preview',
        description: formData.description,
        aws_tag_key: formData.aws_tag_key,
        aws_tag_value: formData.aws_tag_value,
        region: formData.region,
        iam_credential_id: parseInt(formData.iam_credential_id)
      }

      const response = await targetGroupsAPI.create(tempTargetGroup)
      if (response.success) {
        const previewResponse = await targetGroupsAPI.preview(response.data.id)
        
        if (previewResponse.success) {
          setPreviewResult(previewResponse.data)
        } else {
          alert('Failed to preview instances: ' + (previewResponse.message || 'Unknown error'))
        }
        
        // Clean up the temporary target group
        await targetGroupsAPI.delete(response.data.id)
      } else {
        alert('Failed to create preview: ' + (response.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error previewing instances:', error)
      alert('Failed to preview instances. Please try again.')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setIsSubmitting(true)
      setErrors({})
      
      const response = await targetGroupsAPI.create({
        name: formData.name.trim(),
        description: formData.description.trim(),
        aws_tag_key: formData.aws_tag_key.trim(),
        aws_tag_value: formData.aws_tag_value.trim(),
        region: formData.region,
        iam_credential_id: parseInt(formData.iam_credential_id)
      })

      if (response.success) {
        navigate('/targets')
      } else {
        setErrors({ submit: response.message || 'Failed to create target group' })
      }
    } catch (error) {
      console.error('Error creating target group:', error)
      setErrors({ submit: error.message || 'Failed to create target group. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/targets')}
          className="p-2 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Create New Target Group
          </h1>
          <p className="text-gray-600 mt-1">
            Create a new AWS resource group for script execution
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-4xl">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Target Group Details</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Target Group Name *
              </label>
              <Input
                id="name"
                placeholder="Enter target group name (e.g., Production Web Servers)"
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
              <Textarea
                id="description"
                placeholder="Brief description of this target group and its purpose"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={isSubmitting}
                rows={3}
              />
            </div>

            {/* AWS Tag Configuration */}
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <Server className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium text-blue-900">AWS Tag Configuration</h3>
              </div>
              <p className="text-sm text-blue-700">
                This target group will include all EC2 instances that have the specified tag key and value.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tag Key */}
                <div className="space-y-2">
                  <label htmlFor="aws_tag_key" className="text-sm font-medium text-gray-700">
                    AWS Tag Key *
                  </label>
                  <Input
                    id="aws_tag_key"
                    placeholder="e.g., Environment, Team, Application"
                    value={formData.aws_tag_key}
                    onChange={(e) => handleInputChange('aws_tag_key', e.target.value)}
                    className={errors.aws_tag_key ? 'border-red-500 focus:border-red-500' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.aws_tag_key && (
                    <p className="text-sm text-red-600">{errors.aws_tag_key}</p>
                  )}
                </div>

                {/* Tag Value */}
                <div className="space-y-2">
                  <label htmlFor="aws_tag_value" className="text-sm font-medium text-gray-700">
                    AWS Tag Value *
                  </label>
                  <Input
                    id="aws_tag_value"
                    placeholder="e.g., production, dev, web-servers"
                    value={formData.aws_tag_value}
                    onChange={(e) => handleInputChange('aws_tag_value', e.target.value)}
                    className={errors.aws_tag_value ? 'border-red-500 focus:border-red-500' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.aws_tag_value && (
                    <p className="text-sm text-red-600">{errors.aws_tag_value}</p>
                  )}
                </div>
              </div>

              {/* Preview */}
              {formData.aws_tag_key && formData.aws_tag_value && (
                <div className="mt-4 p-3 bg-white rounded border border-blue-300">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Tag Filter:</span> Instances with tag{' '}
                    <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                      {formData.aws_tag_key} = {formData.aws_tag_value}
                    </code>
                  </p>
                </div>
              )}
            </div>

            {/* IAM Credentials */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="iam_credential_id" className="text-sm font-medium text-gray-700">
                  IAM Credentials *
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/iam-credentials/new')}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add New
                </Button>
              </div>
              {credentialsLoading ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  <div className="animate-pulse">Loading credentials...</div>
                </div>
              ) : availableCredentials.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Key className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-amber-800">
                      No IAM credentials found. You need to add AWS credentials first.
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => navigate('/iam-credentials/new')}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add IAM Credentials
                  </Button>
                </div>
              ) : (
                <select
                  id="iam_credential_id"
                  value={formData.iam_credential_id}
                  onChange={(e) => handleInputChange('iam_credential_id', e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.iam_credential_id ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                  disabled={isSubmitting}
                >
                  <option value="">Select IAM credentials...</option>
                  {availableCredentials.map((credential) => (
                    <option key={credential.id} value={credential.id}>
                      {credential.name} ({credential.region})
                    </option>
                  ))}
                </select>
              )}
              {errors.iam_credential_id && (
                <p className="text-sm text-red-600">{errors.iam_credential_id}</p>
              )}
              <p className="text-xs text-gray-600">
                AWS credentials used to discover and manage EC2 instances
              </p>
            </div>

            {/* AWS Region */}
            <div className="space-y-2">
              <label htmlFor="region" className="text-sm font-medium text-gray-700">
                AWS Region *
              </label>
              <select
                id="region"
                value={formData.region}
                onChange={(e) => handleInputChange('region', e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.region ? 'border-red-500 focus:border-red-500' : ''
                }`}
                disabled={isSubmitting}
              >
                {awsRegions.map((region) => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
              {errors.region && (
                <p className="text-sm text-red-600">{errors.region}</p>
              )}
              <p className="text-xs text-gray-600">
                Region where your EC2 instances are located (can override the credential's default region)
              </p>
            </div>

            {/* Preview Section */}
            {formData.aws_tag_key && formData.aws_tag_value && formData.iam_credential_id && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-blue-900">AWS Instance Preview</h3>
                    <p className="text-sm text-blue-700">
                      Test your tag configuration to see matching instances
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreview}
                    disabled={previewLoading}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    {previewLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Previewing...
                      </>
                    ) : (
                      <>
                        <Monitor className="h-4 w-4 mr-2" />
                        Preview Instances
                      </>
                    )}
                  </Button>
                </div>

                {previewResult && (
                  <div className="mt-4 p-3 bg-white rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        Found {previewResult.instances?.length || 0} instances
                      </h4>
                      <span className="text-xs text-gray-500">
                        Tag: {formData.aws_tag_key}={formData.aws_tag_value}
                      </span>
                    </div>
                    
                    {previewResult.instances && previewResult.instances.length > 0 ? (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {previewResult.instances.map((instance, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                            <span className="font-mono">{instance.instanceId}</span>
                            <span className="text-gray-600">{instance.instanceType}</span>
                            <span className={`px-2 py-1 rounded-full ${
                              instance.state === 'running' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {instance.state}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">
                        No running instances found with the specified tag configuration.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

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
                onClick={() => navigate('/targets')}
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
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Target Group
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

export default NewTargetGroupPage 