import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { runnersAPI } from '../lib/api'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { ArrowLeft, Edit, Trash2, Calendar, User, Shield, Code, Play } from 'lucide-react'

const RunnerViewPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [runner, setRunner] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    fetchRunner()
  }, [id])

  const fetchRunner = async () => {
    try {
      setLoading(true)
      const response = await runnersAPI.getById(id)
      if (response.success) {
        setRunner(response.runner)
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

  const handleEdit = () => {
    navigate(`/runners/${id}/edit`)
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${runner.name}"?`)) {
      return
    }

    try {
      setDeleteLoading(true)
      const response = await runnersAPI.delete(id)
      if (response.success) {
        alert('Runner deleted successfully!')
        navigate('/runners')
      } else {
        alert('Failed to delete runner: ' + (response.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error deleting runner:', error)
      alert('Failed to delete runner. Please try again.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
          <p className="text-gray-600 mt-2">The runner you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/runners')} className="mt-4">
            Back to Runners
          </Button>
        </div>
      </div>
    )
  }

  const isSystemRunner = runner.created_by === null
  const canEdit = isAdmin && !isSystemRunner
  const canDelete = isAdmin && !isSystemRunner

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/runners')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Runners
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{runner.name}</h1>
            {isSystemRunner && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Shield className="h-3 w-3 mr-1" />
                System Runner
              </Badge>
            )}
          </div>
          {runner.description && (
            <p className="text-gray-600 mt-2">{runner.description}</p>
          )}
        </div>
        {(canEdit || canDelete) && (
          <div className="flex items-center gap-2">
            {canEdit && (
                             <Button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                {deleteLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Runner Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metadata Card */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                         <Play className="h-5 w-5 text-blue-600" />
            Runner Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Name</label>
              <p className="text-gray-900 mt-1">{runner.name}</p>
            </div>
            {runner.description && (
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="text-gray-900 mt-1">{runner.description}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700">Type</label>
              <p className="text-gray-900 mt-1">
                {isSystemRunner ? 'System Runner' : 'Custom Runner'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Created</label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">{formatDate(runner.created_at)}</span>
              </div>
            </div>
            {runner.created_by_name && (
              <div>
                <label className="text-sm font-medium text-gray-700">Created By</label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{runner.created_by_name}</span>
                </div>
              </div>
            )}
            {runner.updated_at && runner.updated_at !== runner.created_at && (
              <div>
                <label className="text-sm font-medium text-gray-700">Last Updated</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{formatDate(runner.updated_at)}</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Init Code Card */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Code className="h-5 w-5 text-blue-600" />
            Initialization Code
          </h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono overflow-x-auto">
              {runner.init_code}
            </pre>
          </div>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium text-blue-900">Template Variable</p>
                <p className="text-sm text-blue-700 mt-1">
                  The <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">{'{{SCRIPT_CONTENT}}'}</code> placeholder 
                  will be replaced with the actual script content during execution.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Usage Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Information</h3>
        <div className="prose prose-sm max-w-none text-gray-600">
          <p>
            This runner defines the execution environment and initialization code for scripts. 
            When a script is executed with this runner, the script content will replace the 
            <code>{'{{SCRIPT_CONTENT}}'}</code> placeholder in the initialization code above.
          </p>
          {isSystemRunner && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-900">System Runner</p>
                  <p className="text-sm text-amber-700 mt-1">
                    This is a built-in system runner that cannot be modified or deleted. 
                    It provides essential functionality for script execution.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default RunnerViewPage 