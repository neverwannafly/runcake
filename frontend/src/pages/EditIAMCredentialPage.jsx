import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { iamCredentialsAPI } from '../lib/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Card } from '../components/ui/card'
import { ArrowLeft, Save, Key, Shield, AlertTriangle, ExternalLink } from 'lucide-react'

const EditIAMCredentialPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    access_key_id: '',
    secret_access_key: '',
    region: 'us-east-1'
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

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
    fetchCredential()
  }, [id])

  const fetchCredential = async () => {
    try {
      setLoading(true)
      const response = await iamCredentialsAPI.getById(id)
      if (response.success) {
        const credential = response.data
        setFormData({
          name: credential.name || '',
          description: credential.description || '',
          access_key_id: credential.access_key_id || '',
          secret_access_key: credential.secret_access_key || '',
          region: credential.region || 'us-east-1'
        })
      } else {
        setErrors({ fetch: response.message || 'Failed to fetch IAM credential' })
      }
    } catch (error) {
      console.error('Error fetching credential:', error)
      setErrors({ fetch: error.message || 'Failed to fetch IAM credential' })
    } finally {
      setLoading(false)
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
      newErrors.name = 'Credential name is required'
    }
    
    if (!formData.access_key_id.trim()) {
      newErrors.access_key_id = 'Access Key ID is required'
    } else if (!/^AKIA[0-9A-Z]{16}$/.test(formData.access_key_id.trim())) {
      newErrors.access_key_id = 'Access Key ID must be in format: AKIA followed by 16 characters'
    }
    
    if (!formData.secret_access_key.trim()) {
      newErrors.secret_access_key = 'Secret Access Key is required'
    } else if (formData.secret_access_key.trim().length < 20) {
      newErrors.secret_access_key = 'Secret Access Key must be at least 20 characters'
    }
    
    if (!formData.region) {
      newErrors.region = 'AWS region is required'
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
      
      const response = await iamCredentialsAPI.update(id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        access_key_id: formData.access_key_id.trim(),
        secret_access_key: formData.secret_access_key.trim(),
        region: formData.region
      })

      if (response.success) {
        navigate('/iam-credentials')
      } else {
        setErrors({ submit: response.message || 'Failed to update IAM credential' })
      }
    } catch (error) {
      console.error('Error updating IAM credential:', error)
      setErrors({ submit: error.message || 'Failed to update IAM credential. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
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
          <div className="text-red-600 text-lg font-medium mb-2">Error loading credential</div>
          <p className="text-gray-600 mb-4">{errors.fetch}</p>
          <Button onClick={() => navigate('/iam-credentials')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to IAM Credentials
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
          onClick={() => navigate('/iam-credentials')}
          className="p-2 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Edit IAM Credential
          </h1>
          <p className="text-gray-600 mt-1">
            Update AWS access credentials for script execution
          </p>
        </div>
      </div>

      {/* Security Notice */}
      <Card className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <div className="font-medium mb-2">Security Best Practices:</div>
            <ul className="space-y-1 text-xs">
              <li>• Use IAM users with minimum required permissions (EC2:DescribeInstances, SSM:SendCommand)</li>
              <li>• Never share credentials or commit them to version control</li>
              <li>• Regularly rotate access keys and review permissions</li>
              <li>• Consider using temporary credentials or IAM roles when possible</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Help Link */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Key className="h-5 w-5 text-blue-600" />
            <div className="text-sm text-blue-800">
              <span className="font-medium">Need help managing AWS credentials?</span>
              <p className="text-xs mt-1">Follow the AWS documentation to rotate or update your IAM user credentials.</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
            onClick={() => window.open('https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            AWS Docs
          </Button>
        </div>
      </Card>

      {/* Form */}
      <Card className="max-w-4xl">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Credential Details</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Credential Name *
              </label>
              <Input
                id="name"
                placeholder="e.g., Production AWS Account, Development Environment"
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
                placeholder="Brief description of when and where these credentials should be used"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={isSubmitting}
                rows={3}
              />
            </div>

            {/* AWS Credentials Section */}
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium text-blue-900">AWS Access Credentials</h3>
              </div>
              
              {/* Access Key ID */}
              <div className="space-y-2">
                <label htmlFor="access_key_id" className="text-sm font-medium text-gray-700">
                  Access Key ID *
                </label>
                <Input
                  id="access_key_id"
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  value={formData.access_key_id}
                  onChange={(e) => handleInputChange('access_key_id', e.target.value)}
                  className={`font-mono ${errors.access_key_id ? 'border-red-500 focus:border-red-500' : ''}`}
                  disabled={isSubmitting}
                />
                {errors.access_key_id && (
                  <p className="text-sm text-red-600">{errors.access_key_id}</p>
                )}
                <p className="text-xs text-gray-600">
                  20-character string starting with "AKIA"
                </p>
              </div>

              {/* Secret Access Key */}
              <div className="space-y-2">
                <label htmlFor="secret_access_key" className="text-sm font-medium text-gray-700">
                  Secret Access Key *
                </label>
                <Input
                  id="secret_access_key"
                  type="password"
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                  value={formData.secret_access_key}
                  onChange={(e) => handleInputChange('secret_access_key', e.target.value)}
                  className={`font-mono ${errors.secret_access_key ? 'border-red-500 focus:border-red-500' : ''}`}
                  disabled={isSubmitting}
                />
                {errors.secret_access_key && (
                  <p className="text-sm text-red-600">{errors.secret_access_key}</p>
                )}
                <p className="text-xs text-gray-600">
                  40-character secret key (will be encrypted and stored securely)
                </p>
              </div>
            </div>

            {/* AWS Region */}
            <div className="space-y-2">
              <label htmlFor="region" className="text-sm font-medium text-gray-700">
                Default AWS Region *
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
                Primary region for AWS operations (can be overridden per target group)
              </p>
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
                onClick={() => navigate('/iam-credentials')}
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
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Credential
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

export default EditIAMCredentialPage 