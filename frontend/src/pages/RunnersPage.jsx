import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { runnersAPI } from '../lib/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Plus, Search, Edit, Trash2, Calendar, User, Eye, Code, Shield, Play } from 'lucide-react'

const RunnersPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [runners, setRunners] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionLoading, setActionLoading] = useState({})

  useEffect(() => {
    fetchRunners()
  }, [])

  const fetchRunners = async () => {
    try {
      setLoading(true)
      const response = await runnersAPI.getAll()
      if (response.success) {
        setRunners(response.runners)
      }
    } catch (error) {
      console.error('Error fetching runners:', error)
      alert('Failed to fetch runners. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRunner = () => {
    navigate('/runners/new')
  }

  const handleEditRunner = (runner) => {
    navigate(`/runners/${runner.id}/edit`)
  }

  const handleViewRunner = (runner) => {
    navigate(`/runners/${runner.id}`)
  }

  const handleDeleteRunner = (runner) => {
    if (confirm(`Are you sure you want to delete "${runner.name}"?`)) {
      deleteRunner(runner.id)
    }
  }

  const deleteRunner = async (id) => {
    try {
      setActionLoading(prev => ({ ...prev, [`delete_${id}`]: true }))
      const response = await runnersAPI.delete(id)
      if (response.success) {
        alert('Runner deleted successfully!')
        fetchRunners() // Refresh the list
      } else {
        alert('Failed to delete runner: ' + (response.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error deleting runner:', error)
      alert('Failed to delete runner. Please try again.')
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete_${id}`]: false }))
    }
  }

  const filteredRunners = runners.filter(runner => {
    const matchesSearch = runner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         runner.description?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
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
            Runners
          </h1>
          <p className="text-gray-600 mt-1">Manage script execution environments and templates</p>
        </div>
        {isAdmin && (
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleCreateRunner}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Runner
          </Button>
        )}
      </div>

      {/* Search Section */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search runners by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredRunners.length} runner{filteredRunners.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Runners Grid */}
      {filteredRunners.length === 0 ? (
        <Card className="p-12 text-center">
          <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No runners found' : 'No runners available'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm 
              ? 'Try adjusting your search terms.' 
              : 'Create your first runner to get started with custom script execution environments.'
            }
          </p>
          {isAdmin && !searchTerm && (
            <Button onClick={handleCreateRunner} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Runner
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRunners.map((runner) => (
            <Card key={runner.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {runner.name}
                      </h3>
                      {runner.created_by === null && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          <Shield className="h-3 w-3 mr-1" />
                          System
                        </Badge>
                      )}
                    </div>
                    {runner.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {runner.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    Created {formatDate(runner.created_at)}
                  </div>
                  {runner.created_by_name && (
                    <div className="flex items-center text-xs text-gray-500">
                      <User className="h-3 w-3 mr-1" />
                      By {runner.created_by_name}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewRunner(runner)}
                    className="flex-1"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  
                  {isAdmin && runner.created_by !== null && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRunner(runner)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRunner(runner)}
                        disabled={actionLoading[`delete_${runner.id}`]}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {actionLoading[`delete_${runner.id}`] ? (
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
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

export default RunnersPage 