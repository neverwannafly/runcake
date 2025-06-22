import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { scriptsAPI } from '../lib/api'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { ArrowLeft, Play, Edit } from 'lucide-react'

const ScriptViewPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [script, setScript] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchScript()
  }, [id])

  const fetchScript = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await scriptsAPI.getById(id)
      if (response.success) {
        setScript(response.data)
      } else {
        setError(response.message || 'Failed to fetch script')
      }
    } catch (error) {
      console.error('Error fetching script:', error)
      setError(error.message || 'Failed to fetch script')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    navigate(`/scripts/${id}/edit`)
  }

  const handleExecute = () => {
    navigate(`/scripts/${id}/execute`)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="h-96 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded-lg"></div>
              <div className="h-32 bg-gray-200 rounded-lg"></div>
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
          <div className="text-red-600 text-lg font-medium mb-2">Error loading script</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/scripts')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Scripts
          </Button>
        </div>
      </div>
    )
  }

  if (!script) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-gray-600 text-lg font-medium mb-2">Script not found</div>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/scripts')}
            className="p-2 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              {script.name}
            </h1>
            <p className="text-gray-600 mt-1">
              {script.description || 'No description provided'}
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
            onClick={handleExecute}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Play className="h-4 w-4 mr-2" />
            Execute
          </Button>
        </div>
      </div>

      {/* Script Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Script Content</h2>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-auto">
                <pre className="text-sm font-mono whitespace-pre-wrap text-gray-800">
                  {script.content}
                </pre>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tags */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
              {script.tags && script.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {script.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-blue-100 text-blue-800">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No tags assigned</p>
              )}
            </div>
          </Card>

          {/* Metadata */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Runner</label>
                  <p className="text-sm text-gray-900">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      script.runner_name?.toLowerCase() === 'rails' 
                        ? 'bg-red-100 text-red-700' 
                        : script.runner_name?.toLowerCase() === 'python'
                        ? 'bg-green-100 text-green-700'
                        : script.runner_name?.toLowerCase().includes('node')
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {script.runner_name || 'Unknown Runner'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-sm text-gray-900">
                    {new Date(script.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-sm text-gray-900">
                    {new Date(script.updated_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Script ID</label>
                  <p className="text-sm font-mono text-gray-900">{script.id}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ScriptViewPage 