import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { 
  Plus, 
  Search, 
  Cloud, 
  Server, 
  Activity, 
  TrendingUp, 
  MapPin, 
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  Key,
  Monitor
} from 'lucide-react'
import { targetGroupsAPI } from '../lib/api'

const TargetGroupsPage = () => {
  const navigate = useNavigate()
  const [targetGroups, setTargetGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionLoading, setActionLoading] = useState({})
  const [stats, setStats] = useState({
    total: 0,
    environments: {},
    regions: {}
  })

  useEffect(() => {
    fetchTargetGroups()
  }, [])

  const fetchTargetGroups = async () => {
    try {
      setLoading(true)
      const response = await targetGroupsAPI.getAll()
      if (response.success) {
        setTargetGroups(response.data)
        calculateStats(response.data)
      }
    } catch (error) {
      console.error('Error fetching target groups:', error)
      alert('Failed to fetch target groups. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTargetGroup = () => {
    navigate('/targets/new')
  }

  const handleEditTargetGroup = (group) => {
    navigate(`/targets/${group.id}/edit`)
  }

  const handleViewTargetGroup = (group) => {
    navigate(`/targets/${group.id}`)
  }

  const handleDeleteTargetGroup = (group) => {
    if (confirm(`Are you sure you want to delete "${group.name}"?`)) {
      deleteTargetGroup(group.id)
    }
  }

  const handlePreviewTargetGroup = async (group) => {
    try {
      setActionLoading(prev => ({ ...prev, [`preview_${group.id}`]: true }))
      const response = await targetGroupsAPI.preview(group.id)
      if (response.success) {
        const instances = response.data.instances || []
        alert(`AWS Instance Preview for "${group.name}"\n\nFound ${instances.length} running instances matching tag: ${group.aws_tag_key}=${group.aws_tag_value}\n\nInstances:\n${instances.map(i => `• ${i.instanceId} (${i.instanceType}) - ${i.state}`).join('\n') || 'No instances found'}`)
      } else {
        alert(`Failed to preview instances for "${group.name}": ${response.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error previewing target group:', error)
      alert('Failed to preview instances. Please try again.')
    } finally {
      setActionLoading(prev => ({ ...prev, [`preview_${group.id}`]: false }))
    }
  }

  const deleteTargetGroup = async (id) => {
    try {
      setActionLoading(prev => ({ ...prev, [`delete_${id}`]: true }))
      const response = await targetGroupsAPI.delete(id)
      if (response.success) {
        alert('Target group deleted successfully!')
        fetchTargetGroups() // Refresh the list
      } else {
        alert('Failed to delete target group: ' + (response.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error deleting target group:', error)
      alert('Failed to delete target group. Please try again.')
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete_${id}`]: false }))
    }
  }



  const calculateStats = (groups) => {
    const environments = {}
    const regions = {}

    groups.forEach(group => {
      // Extract environment from tag key/value for demo purposes
      const env = group.aws_tag_value.toLowerCase()
      environments[env] = (environments[env] || 0) + 1
      
      regions[group.region] = (regions[group.region] || 0) + 1
    })

    setStats({
      total: groups.length,
      environments,
      regions
    })
  }

  const filteredGroups = targetGroups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.aws_tag_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.aws_tag_value.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Target Groups
          </h1>
          <p className="text-gray-600 mt-1">Manage AWS resource groups for script execution</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleCreateTargetGroup}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Target Group
        </Button>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Groups</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <div className="h-12 w-12 bg-blue-200 rounded-lg flex items-center justify-center">
              <Server className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Environments</p>
              <p className="text-2xl font-bold text-green-900">{Object.keys(stats.environments).length}</p>
            </div>
            <div className="h-12 w-12 bg-green-200 rounded-lg flex items-center justify-center">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Regions</p>
              <p className="text-2xl font-bold text-purple-900">{Object.keys(stats.regions).length}</p>
            </div>
            <div className="h-12 w-12 bg-purple-200 rounded-lg flex items-center justify-center">
              <MapPin className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">AWS Integration</p>
              <p className="text-lg font-bold text-orange-900">Active</p>
            </div>
            <div className="h-12 w-12 bg-orange-200 rounded-lg flex items-center justify-center">
              <Cloud className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search target groups by name, description, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>
      </Card>

      {/* Target Groups Grid */}
      {filteredGroups.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Server className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No target groups found' : 'No target groups yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Try adjusting your search to find what you\'re looking for.'
                : 'Get started by creating your first target group to organize your AWS resources.'
              }
            </p>
            {!searchTerm && (
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleCreateTargetGroup}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Target Group
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <Card key={group.id} className="group hover:shadow-lg transition-all duration-200 border-gray-200 hover:border-blue-300">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {group.name}
                    </h3>
                    {group.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {group.description}
                      </p>
                    )}
                  </div>
                  <Badge 
                    className={`${getEnvironmentColor(group.aws_tag_value)} border text-xs font-medium`}
                  >
                    {group.aws_tag_value}
                  </Badge>
                </div>

                {/* AWS Tag Info */}
                <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Tag:</span> {group.aws_tag_key} = {group.aws_tag_value}
                  </div>
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Region:</span> {group.region}
                  </div>
                </div>

                {/* Metadata */}
                <div className="space-y-2 mb-4 text-xs text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1.5" />
                    <span>Created {formatDate(group.created_at)}</span>
                  </div>
                  <div className="flex items-center">
                    <User className="h-3 w-3 mr-1.5" />
                    <span>By {group.created_by_name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center">
                    <Key className="h-3 w-3 mr-1.5" />
                    <span>Using {group.credential_name || 'Default'} credentials</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <Button 
                    size="sm" 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleViewTargetGroup(group)}
                  >
                    <Eye className="h-3 w-3 mr-1.5" />
                    View
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                    onClick={() => handlePreviewTargetGroup(group)}
                    disabled={actionLoading[`preview_${group.id}`]}
                    title="Preview AWS Instances"
                  >
                    {actionLoading[`preview_${group.id}`] ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-green-600"></div>
                    ) : (
                      <Monitor className="h-3 w-3" />
                    )}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="hover:bg-gray-50"
                    onClick={() => handleEditTargetGroup(group)}
                    title="Edit Target Group"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                    onClick={() => handleDeleteTargetGroup(group)}
                    disabled={actionLoading[`delete_${group.id}`]}
                    title="Delete Target Group"
                  >
                    {actionLoading[`delete_${group.id}`] ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-red-600"></div>
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default TargetGroupsPage 