import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { 
  Plus, 
  Search, 
  Key, 
  Shield, 
  MapPin, 
  Edit,
  Trash2,
  Calendar,
  User,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react'
import { iamCredentialsAPI } from '../lib/api'

const IAMCredentialsPage = () => {
  const navigate = useNavigate()
  const [credentials, setCredentials] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionLoading, setActionLoading] = useState({})
  const [visibleSecrets, setVisibleSecrets] = useState({})

  useEffect(() => {
    fetchCredentials()
  }, [])

  const fetchCredentials = async () => {
    try {
      setLoading(true)
      const response = await iamCredentialsAPI.getAll()
      if (response.success) {
        setCredentials(response.data)
      }
    } catch (error) {
      console.error('Error fetching credentials:', error)
      alert('Failed to fetch IAM credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCredential = () => {
    navigate('/iam-credentials/new')
  }

  const handleEditCredential = (credential) => {
    navigate(`/iam-credentials/${credential.id}/edit`)
  }

  const handleDeleteCredential = (credential) => {
    if (confirm(`Are you sure you want to delete "${credential.name}"? This action cannot be undone.`)) {
      deleteCredential(credential.id)
    }
  }

  const deleteCredential = async (id) => {
    try {
      setActionLoading(prev => ({ ...prev, [`delete_${id}`]: true }))
      const response = await iamCredentialsAPI.delete(id)
      if (response.success) {
        alert('IAM credential deleted successfully!')
        fetchCredentials() // Refresh the list
      } else {
        alert('Failed to delete IAM credential: ' + (response.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error deleting credential:', error)
      alert('Failed to delete IAM credential. Please try again.')
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete_${id}`]: false }))
    }
  }

  const toggleSecretVisibility = (id) => {
    setVisibleSecrets(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const filteredCredentials = credentials.filter(cred =>
    cred.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cred.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cred.region.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const maskSecret = (secret) => {
    if (!secret) return ''
    return secret.substring(0, 8) + '*'.repeat(Math.max(0, secret.length - 16)) + secret.substring(Math.max(8, secret.length - 8))
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
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
            IAM Credentials
          </h1>
          <p className="text-gray-600 mt-1">Manage AWS access credentials for your target groups</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleCreateCredential}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Credential
        </Button>
      </div>

      {/* Security Notice */}
      <Card className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div className="text-sm text-amber-800">
            <span className="font-medium">Security Notice:</span> IAM credentials are encrypted and stored securely. 
            Only use credentials with minimum required permissions for EC2 and SSM operations.
          </div>
        </div>
      </Card>

      {/* Search */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search credentials by name, description, or region..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>
      </Card>

      {/* Credentials Grid */}
      {filteredCredentials.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Key className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No credentials found' : 'No IAM credentials yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Try adjusting your search to find what you\'re looking for.'
                : 'Add your first AWS IAM credentials to start managing target groups.'
              }
            </p>
            {!searchTerm && (
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleCreateCredential}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Credential
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCredentials.map((credential) => (
            <Card key={credential.id} className="group hover:shadow-lg transition-all duration-200 border-gray-200 hover:border-blue-300">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Key className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {credential.name}
                      </h3>
                    </div>
                    {credential.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {credential.description}
                      </p>
                    )}
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <Shield className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>

                {/* AWS Details */}
                <div className="space-y-3 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Region</label>
                    <div className="flex items-center mt-1">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900 font-mono">{credential.region}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Access Key ID</label>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-gray-900 font-mono">
                        {maskSecret(credential.access_key_id)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Secret Access Key</label>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-gray-900 font-mono">
                        {visibleSecrets[credential.id] ? credential.secret_access_key : maskSecret(credential.secret_access_key)}
                      </span>
                      <button
                        onClick={() => toggleSecretVisibility(credential.id)}
                        className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title={visibleSecrets[credential.id] ? 'Hide secret' : 'Show secret'}
                      >
                        {visibleSecrets[credential.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div className="space-y-2 mb-4 text-xs text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1.5" />
                    <span>Created {formatDate(credential.created_at)}</span>
                  </div>
                  <div className="flex items-center">
                    <User className="h-3 w-3 mr-1.5" />
                    <span>By {credential.created_by_name || 'Unknown'}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 hover:bg-gray-50"
                    onClick={() => handleEditCredential(credential)}
                    title="Edit Credential"
                  >
                    <Edit className="h-3 w-3 mr-1.5" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                    onClick={() => handleDeleteCredential(credential)}
                    disabled={actionLoading[`delete_${credential.id}`]}
                    title="Delete Credential"
                  >
                    {actionLoading[`delete_${credential.id}`] ? (
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

export default IAMCredentialsPage 