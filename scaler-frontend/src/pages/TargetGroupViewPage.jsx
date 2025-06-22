import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { targetGroupsAPI } from '../lib/api'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { ArrowLeft, Edit, Server, MapPin, Key, Eye, RefreshCw } from 'lucide-react'

const TargetGroupViewPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [targetGroup, setTargetGroup] = useState(null)
  const [instances, setInstances] = useState([])
  const [loading, setLoading] = useState(true)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTargetGroup()
  }, [id])

  const fetchTargetGroup = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await targetGroupsAPI.getById(id)
      if (response.success) {
        setTargetGroup(response.data)
        // Auto-preview instances when loading the target group
        handlePreviewInstances(response.data)
      } else {
        setError(response.message || 'Failed to fetch target group')
      }
    } catch (error) {
      console.error('Error fetching target group:', error)
      setError(error.message || 'Failed to fetch target group')
    } finally {
      setLoading(false)
    }
  }

  const handlePreviewInstances = async (group = targetGroup) => {
    if (!group) return
    
    try {
      setPreviewLoading(true)
      const response = await targetGroupsAPI.preview(group.id)
      if (response.success) {
        setInstances(response.data.instances || [])
      } else {
        console.error('Failed to preview instances:', response.message)
        setInstances([])
      }
    } catch (error) {
      console.error('Error previewing instances:', error)
      setInstances([])
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleEdit = () => {
    navigate(`/targets/${id}/edit`)
  }

  const getEnvironmentColor = (tagValue) => {
    const env = tagValue.toLowerCase()
    if (env.includes('prod')) return 'bg-red-100 text-red-800 border-red-200'
    if (env.includes('staging') || env.includes('stage')) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    if (env.includes('dev')) return 'bg-green-100 text-green-800 border-green-200'
    if (env.includes('test')) return 'bg-blue-100 text-blue-800 border-blue-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="space-y-4">
              <div className="h-48 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-red-600 text-lg font-medium mb-2">Error loading target group</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/targets')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Target Groups
          </Button>
        </div>
      </div>
    )
  }

  if (!targetGroup) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-gray-600 text-lg font-medium mb-2">Target group not found</div>
          <Button onClick={() => navigate('/targets')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Target Groups
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
              {targetGroup.name}
            </h1>
            <p className="text-gray-600 mt-1">
              {targetGroup.description || 'No description provided'}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleEdit}
            className="border-gray-300 hover:bg-gray-50"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={() => handlePreviewInstances()}
            disabled={previewLoading}
            className="border-blue-300 hover:bg-blue-50"
          >
            {previewLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh Instances
          </Button>
        </div>
      </div>

      {/* Target Group Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Instance List */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  AWS EC2 Instances ({instances.length})
                </h2>
                <Badge 
                  variant="outline" 
                  className={`${getEnvironmentColor(targetGroup.aws_tag_value)} border`}
                >
                  {targetGroup.aws_tag_value}
                </Badge>
              </div>
              
              {previewLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : instances.length === 0 ? (
                <div className="text-center py-8">
                  <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No instances found</h3>
                  <p className="text-gray-600 mb-4">
                    No EC2 instances were found matching the tag criteria:
                  </p>
                  <div className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-md">
                    <Key className="h-4 w-4 text-gray-500 mr-2" />
                    <code className="text-sm font-mono">
                      {targetGroup.aws_tag_key} = {targetGroup.aws_tag_value}
                    </code>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    Make sure your AWS instances are tagged correctly and running.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {instances.map((instance, index) => (
                    <div key={instance.InstanceId || index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <Server className="h-5 w-5 text-blue-600" />
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {instance.Name || instance.InstanceId}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {instance.InstanceId}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                              instance.State?.Name === 'running' ? 'bg-green-500' : 
                              instance.State?.Name === 'stopped' ? 'bg-red-500' : 
                              'bg-yellow-500'
                            }`}></span>
                            {instance.State?.Name || 'unknown'}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {instance.Placement?.AvailabilityZone || 'unknown'}
                          </div>
                        </div>
                      </div>
                      {instance.PrivateIpAddress && (
                        <div className="mt-2 text-sm text-gray-600">
                          Private IP: <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {instance.PrivateIpAddress}
                          </code>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Configuration */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">AWS Region</label>
                  <div className="flex items-center mt-1">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                    <p className="text-sm text-gray-900">{targetGroup.region}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tag Filter</label>
                  <div className="mt-1">
                    <div className="inline-flex items-center px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                      <Key className="h-4 w-4 text-blue-600 mr-2" />
                      <code className="text-sm font-mono text-blue-800">
                        {targetGroup.aws_tag_key} = {targetGroup.aws_tag_value}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Metadata */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-sm text-gray-900">
                    {new Date(targetGroup.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-sm text-gray-900">
                    {new Date(targetGroup.updated_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Target Group ID</label>
                  <p className="text-sm font-mono text-gray-900">{targetGroup.id}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default TargetGroupViewPage 