import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { ArrowLeft, Save, Monitor } from 'lucide-react'
import { targetGroupsAPI, iamCredentialsAPI } from '../lib/api'

const EditTargetGroupPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [iamCredentials, setIamCredentials] = useState([])
  const [previewInstances, setPreviewInstances] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    aws_tag_key: '',
    aws_tag_value: '',
    region: 'us-east-1',
    iam_credential_id: ''
  })
  const [errors, setErrors] = useState({})

  const regions = [
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
    'eu-west-1', 'eu-west-2', 'eu-central-1',
    'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1'
  ]

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [targetGroupResponse, credentialsResponse] = await Promise.all([
        targetGroupsAPI.getById(id),
        iamCredentialsAPI.getAll()
      ])

      if (targetGroupResponse.success) {
        const targetGroup = targetGroupResponse.data
        setFormData({
          name: targetGroup.name || '',
          description: targetGroup.description || '',
          aws_tag_key: targetGroup.aws_tag_key || '',
          aws_tag_value: targetGroup.aws_tag_value || '',
          region: targetGroup.region || 'us-east-1',
          iam_credential_id: targetGroup.iam_credential_id || ''
        })
      } else {
        alert('Failed to fetch target group: ' + (targetGroupResponse.message || 'Unknown error'))
        navigate('/targets')
        return
      }

      if (credentialsResponse.success) {
        setIamCredentials(credentialsResponse.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      alert('Failed to load data. Please try again.')
      navigate('/targets')
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
        [name]: ''
      }))
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

    if (!formData.iam_credential_id) {
      newErrors.iam_credential_id = 'IAM credential is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePreview = async () => {
    if (!formData.aws_tag_key || !formData.aws_tag_value || !formData.iam_credential_id) {
      alert('Please fill in AWS tag key, tag value, and select IAM credentials before previewing.')
      return
    }

    try {
      setPreviewLoading(true)
      const response = await targetGroupsAPI.preview(id)
      if (response.success) {
        const instances = response.data.instances || []
        setPreviewInstances(instances)
        alert(`Preview Results:\n\nFound ${instances.length} running instances matching tag: ${formData.aws_tag_key}=${formData.aws_tag_value}\n\nInstances:\n${instances.map(i => `• ${i.instanceId} (${i.instanceType}) - ${i.state}`).join('\n') || 'No instances found'}`)
      } else {
        alert('Preview failed: ' + (response.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error previewing instances:', error)
      alert('Failed to preview instances. Please check your configuration.')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setSaving(true)
      const response = await targetGroupsAPI.update(id, formData)
      
      if (response.success) {
        alert('Target group updated successfully!')
        navigate('/targets')
      } else {
        alert('Failed to update target group: ' + (response.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error updating target group:', error)
      alert('Failed to update target group. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/targets')} className="p-2 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Edit Target Group
            </h1>
            <p className="text-gray-600 mt-1">Update your AWS resource group configuration</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <Card className="shadow-sm border-gray-200">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Basic Information
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Group Name *
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Production Web Servers"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Input
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Optional description of this target group"
                />
              </div>
            </div>

            {/* AWS Configuration */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                AWS Configuration
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AWS Tag Key *
                  </label>
                  <Input
                    name="aws_tag_key"
                    value={formData.aws_tag_key}
                    onChange={handleInputChange}
                    placeholder="e.g., Environment"
                    className={errors.aws_tag_key ? 'border-red-500' : ''}
                  />
                  {errors.aws_tag_key && <p className="text-red-500 text-sm mt-1">{errors.aws_tag_key}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AWS Tag Value *
                  </label>
                  <Input
                    name="aws_tag_value"
                    value={formData.aws_tag_value}
                    onChange={handleInputChange}
                    placeholder="e.g., production"
                    className={errors.aws_tag_value ? 'border-red-500' : ''}
                  />
                  {errors.aws_tag_value && <p className="text-red-500 text-sm mt-1">{errors.aws_tag_value}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AWS Region *
                </label>
                <select
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {regions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IAM Credentials *
                </label>
                <div className="flex gap-2">
                  <select
                    name="iam_credential_id"
                    value={formData.iam_credential_id}
                    onChange={handleInputChange}
                    className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.iam_credential_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select IAM credentials...</option>
                    {iamCredentials.map(cred => (
                      <option key={cred.id} value={cred.id}>
                        {cred.name} ({cred.region})
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/iam-credentials/new')}
                    className="whitespace-nowrap"
                  >
                    Add New
                  </Button>
                </div>
                {errors.iam_credential_id && <p className="text-red-500 text-sm mt-1">{errors.iam_credential_id}</p>}
              </div>
            </div>

            {/* Preview Section */}
            {formData.aws_tag_key && formData.aws_tag_value && formData.iam_credential_id && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-blue-900">AWS Instance Preview</h3>
                    <p className="text-sm text-blue-700">
                      Test your updated configuration to see matching instances
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

                {previewInstances.length > 0 && (
                  <div className="mt-4 p-3 bg-white rounded border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Found {previewInstances.length} matching instances:
                    </h4>
                    <div className="space-y-1 text-sm text-blue-800">
                      {previewInstances.slice(0, 5).map((instance, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{instance.instanceId}</span>
                          <span className="text-blue-600">{instance.instanceType} - {instance.state}</span>
                        </div>
                      ))}
                      {previewInstances.length > 5 && (
                        <div className="text-blue-600 font-medium">
                          ... and {previewInstances.length - 5} more instances
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/targets')}
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
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Target Group
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default EditTargetGroupPage 