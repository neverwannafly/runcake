import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { scriptsAPI } from '../lib/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Plus, Search, Play, Filter, Tag, Edit, Trash2, Calendar, User, Eye, Code, Shield } from 'lucide-react'

const ScriptsPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [scripts, setScripts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [availableTags, setAvailableTags] = useState([])
  const [actionLoading, setActionLoading] = useState({})

  useEffect(() => {
    fetchScripts()
  }, [])

  const fetchScripts = async () => {
    try {
      setLoading(true)
      const response = await scriptsAPI.getAll()
      if (response.success) {
        setScripts(response.data)
        
        // Extract all unique tags
        const allTags = new Set()
        response.data.forEach(script => {
          if (script.tags && Array.isArray(script.tags)) {
            script.tags.forEach(tag => allTags.add(tag))
          }
        })
        setAvailableTags(Array.from(allTags))
      }
    } catch (error) {
      console.error('Error fetching scripts:', error)
      alert('Failed to fetch scripts. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateScript = () => {
    navigate('/scripts/new')
  }

  const handleEditScript = (script) => {
    navigate(`/scripts/${script.id}/edit`)
  }

  const handleViewScript = (script) => {
    navigate(`/scripts/${script.id}`)
  }

  const handleDeleteScript = (script) => {
    if (confirm(`Are you sure you want to delete "${script.name}"?`)) {
      deleteScript(script.id)
    }
  }

  const deleteScript = async (id) => {
    try {
      setActionLoading(prev => ({ ...prev, [`delete_${id}`]: true }))
      const response = await scriptsAPI.delete(id)
      if (response.success) {
        alert('Script deleted successfully!')
        fetchScripts() // Refresh the list
      } else {
        alert('Failed to delete script: ' + (response.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error deleting script:', error)
      alert('Failed to delete script. Please try again.')
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete_${id}`]: false }))
    }
  }

  const handleExecuteScript = (script) => {
    navigate(`/scripts/${script.id}/execute`)
  }

  const handleTagClick = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const clearFilters = () => {
    setSelectedTags([])
    setSearchTerm('')
  }

  const filteredScripts = scripts.filter(script => {
    const matchesSearch = script.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTags = selectedTags.length === 0 || 
                       (script.tags && selectedTags.every(tag => script.tags.includes(tag)))
    
    return matchesSearch && matchesTags
  })

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
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
            Scripts
          </h1>
          <p className="text-gray-600 mt-1">Manage and execute your automation scripts</p>
        </div>
        {isAdmin && (
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleCreateScript}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Script
          </Button>
        )}
      </div>

      {/* Search and Filter Section */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search scripts by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>

          {/* Available Tags */}
          {availableTags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Filter by tags:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleTagClick(tag)}
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Active Filters */}
          {(selectedTags.length > 0 || searchTerm) && (
            <div className="flex items-center justify-between pt-2 border-t border-blue-200">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {filteredScripts.length} of {scripts.length} scripts shown
                </span>
                {selectedTags.length > 0 && (
                  <div className="flex gap-1">
                    {selectedTags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-700"
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Scripts Grid */}
      {filteredScripts.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || selectedTags.length > 0 ? 'No scripts found' : 'No scripts yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedTags.length > 0 
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'Get started by creating your first automation script.'
              }
            </p>
            {(!searchTerm && selectedTags.length === 0 && isAdmin) && (
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleCreateScript}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Script
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScripts.map((script) => (
            <Card key={script.id} className="group hover:shadow-lg transition-all duration-200 border-gray-200 hover:border-blue-300">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {script.name}
                      </h3>
                      {script.permission_level === 'admin_only' && (
                        <Shield className="h-4 w-4 text-amber-600 flex-shrink-0" title="Admin Only Script" />
                      )}
                    </div>
                    {script.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {script.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {script.tags && script.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {script.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {script.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{script.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                {/* Metadata */}
                <div className="space-y-2 mb-4 text-xs text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1.5" />
                    <span>Created {formatDate(script.created_at)}</span>
                  </div>
                  <div className="flex items-center">
                    <User className="h-3 w-3 mr-1.5" />
                    <span>By {script.created_by_name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center">
                    <Code className="h-3 w-3 mr-1.5" />
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
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
                  </div>
                  {script.permission_level === 'admin_only' && (
                    <div className="flex items-center">
                      <Shield className="h-3 w-3 mr-1.5" />
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                        Admin Only
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <Button 
                    size="sm" 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleExecuteScript(script)}
                  >
                    <Play className="h-3 w-3 mr-1.5" />
                    Execute
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="hover:bg-gray-50"
                    onClick={() => handleViewScript(script)}
                    title="View Script"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  {isAdmin && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="hover:bg-gray-50"
                        onClick={() => handleEditScript(script)}
                        title="Edit Script"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                        onClick={() => handleDeleteScript(script)}
                        disabled={actionLoading[`delete_${script.id}`]}
                        title="Delete Script"
                      >
                        {actionLoading[`delete_${script.id}`] ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-red-600"></div>
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default ScriptsPage 