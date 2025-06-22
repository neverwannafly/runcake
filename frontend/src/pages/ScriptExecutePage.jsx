import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { scriptsAPI, targetGroupsAPI } from '../lib/api'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Server, 
  Code, 
  Target,
  Zap,
  AlertTriangle,
  Users,
  User,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const ScriptExecutePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [script, setScript] = useState(null)
  const [targetGroups, setTargetGroups] = useState([])
  const [selectedTargetGroup, setSelectedTargetGroup] = useState('')
  const [executionMode, setExecutionMode] = useState('random')
  const [templateVariables, setTemplateVariables] = useState({})
  const [templateVariableErrors, setTemplateVariableErrors] = useState({})
  const [showAllInstancesConfirm, setShowAllInstancesConfirm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [id])

  const { user } = useAuth();

  // Ensure non-admin users can't use 'all' execution mode
  useEffect(() => {
    if (user && user.role !== 'admin' && executionMode === 'all') {
      setExecutionMode('random')
    }
  }, [user, executionMode])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [scriptResponse, targetGroupsResponse] = await Promise.all([
        scriptsAPI.getById(id),
        targetGroupsAPI.getAll()
      ])

      if (scriptResponse.success) {
        setScript(scriptResponse.data)
        
        // Initialize template variables if the script has any
        if (scriptResponse.data.templateVariables && scriptResponse.data.templateVariables.length > 0) {
          const initialVariables = {}
          scriptResponse.data.templateVariables.forEach(variable => {
            initialVariables[variable.name] = ''
          })
          setTemplateVariables(initialVariables)
        }
      } else {
        setError(scriptResponse.message || 'Failed to fetch script')
        return
      }

      if (targetGroupsResponse.success) {
        setTargetGroups(targetGroupsResponse.data)
      } else {
        setError(targetGroupsResponse.message || 'Failed to fetch target groups')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError(error.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleExecute = async () => {
    if (!selectedTargetGroup || !script) return
    
    // Check if user is trying to execute on all instances and show confirmation
    if (executionMode === 'all') {
      setShowAllInstancesConfirm(true)
      return
    }
    
    await executeScript()
  }

  const executeScript = async () => {
    // Validate template variables
    if (script.templateVariables && script.templateVariables.length > 0) {
      const errors = {}
      let hasErrors = false
      
      script.templateVariables.forEach(variable => {
        if (variable.required && (!templateVariables[variable.name] || templateVariables[variable.name].trim() === '')) {
          errors[variable.name] = 'This field is required'
          hasErrors = true
        }
      })
      
      setTemplateVariableErrors(errors)
      if (hasErrors) return
    }
    
    try {
      setExecuting(true)
      setExecutionResult(null)
      setShowAllInstancesConfirm(false)
      
      // Prepare template variables - only send non-empty values
      const varsToSend = {}
      Object.entries(templateVariables).forEach(([key, value]) => {
        if (value.trim() !== '') {
          varsToSend[key] = value.trim()
        }
      })
      
      const response = await scriptsAPI.execute(script.id, parseInt(selectedTargetGroup), executionMode, varsToSend)
      
      if (response.success) {
        setExecutionResult({
          status: 'started',
          executionId: response.data.executionId,
          message: response.message || 'Script execution started successfully'
        })
        
        // Poll for execution status
        pollExecutionStatus(script.id, response.data.executionId)
      } else {
        setExecutionResult({
          status: 'failed',
          message: response.message || 'Failed to start script execution'
        })
      }
    } catch (error) {
      console.error('Error executing script:', error)
      setExecutionResult({
        status: 'failed',
        message: error.message || 'Failed to execute script'
      })
    } finally {
      setExecuting(false)
    }
  }

  const pollExecutionStatus = async (scriptId, executionId) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await scriptsAPI.getExecutionStatus(scriptId, executionId)
        if (response.success) {
          const execution = response.data
          
          setExecutionResult(prev => ({
            ...prev,
            status: execution.status,
            output: execution.output,
            errorMessage: execution.error_message,
            instanceIds: execution.instance_ids || [],
            completedAt: execution.completed_at
          }))
          
          // Stop polling if execution is complete
          if (['success', 'failed', 'cancelled', 'timeout'].includes(execution.status)) {
            clearInterval(pollInterval)
          }
        }
      } catch (error) {
        console.error('Error polling execution status:', error)
        clearInterval(pollInterval)
      }
    }, 2000) // Poll every 2 seconds
    
    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 300000)
  }

    if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div className="text-lg text-gray-600">Loading script details...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-16">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <AlertTriangle className="mx-auto h-16 w-16 text-red-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading data</h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <Button onClick={() => navigate('/scripts')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Scripts
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!script) {
    return (
      <div className="p-6">
        <div className="text-center py-16">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <AlertTriangle className="mx-auto h-16 w-16 text-red-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Script not found</h3>
            <p className="text-gray-500 mb-6">The script you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/scripts')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Scripts
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const selectedTarget = targetGroups.find(tg => tg.id === parseInt(selectedTargetGroup));

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/scripts')} className="p-2 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent flex items-center">
              <Zap className="mr-3 h-8 w-8 text-blue-600" />
              Execute Script
            </h1>
            <p className="mt-1 text-gray-600">Run your script on selected target groups</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Script Details */}
        <div className="lg:col-span-1">
          <Card className="shadow-sm border-gray-200 h-fit">
            <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Code className="mr-2 h-5 w-5 text-blue-600" />
                Script Details
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{script.name}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {script.description || 'No description provided'}
                  </p>
                </div>
                
                {script.tags && script.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {script.tags.map((tag) => (
                      <Badge key={tag} className="bg-blue-100 text-blue-800 border-blue-200">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created by:</span>
                    <span className="font-medium text-gray-900">{script.created_by_name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created:</span>
                    <span className="text-gray-700">{new Date(script.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Execution Panel */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {/* Target Group Selection */}
            <Card className="shadow-sm border-gray-200">
              <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Target className="mr-2 h-5 w-5 text-blue-600" />
                  Select Target Group
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Choose the server group where you want to execute this script
                </p>
              </div>
              <div className="p-6">
                {targetGroups.length === 0 ? (
                  <div className="text-center py-8">
                    <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No target groups available</h3>
                    <p className="text-gray-600 mb-4">You need to create a target group first.</p>
                    <Button onClick={() => navigate('/targets/new')} className="bg-blue-600 hover:bg-blue-700">
                      Create Target Group
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {targetGroups.map((group) => (
                      <div
                        key={group.id}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          selectedTargetGroup === group.id.toString()
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                        }`}
                        onClick={() => setSelectedTargetGroup(group.id.toString())}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{group.name}</h4>
                            <p className="text-sm text-gray-600 mb-2">{group.description || 'No description'}</p>
                            <div className="text-xs text-gray-500">
                              <div className="flex items-center mb-1">
                                <Server className="mr-1 h-3 w-3" />
                                Tag: {group.aws_tag_key}={group.aws_tag_value}
                              </div>
                              <div>Region: {group.region}</div>
                            </div>
                          </div>
                          {selectedTargetGroup === group.id.toString() && (
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Execution Mode Selection */}
            {selectedTargetGroup && (
              <Card className="shadow-sm border-gray-200">
                <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Users className="mr-2 h-5 w-5 text-blue-600" />
                    Execution Mode
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Choose how to execute the script on your target instances
                  </p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user?.role === 'admin' && (
                      <div
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          executionMode === 'all'
                            ? 'border-red-500 bg-red-50 shadow-md'
                            : 'border-gray-200 hover:border-red-300 hover:shadow-sm'
                        }`}
                        onClick={() => setExecutionMode('all')}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <Users className="h-5 w-5 text-red-600 mr-2" />
                              <h4 className="font-semibold text-gray-900">All Instances</h4>
                              <Badge className="ml-2 bg-red-100 text-red-800 border-red-200 text-xs">⚠️ Caution</Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              Execute the script on all instances in the target group simultaneously (requires confirmation)
                            </p>
                          </div>
                          {executionMode === 'all' && (
                            <CheckCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                      </div>
                    )}

                    <div
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        executionMode === 'random'
                          ? 'border-orange-500 bg-orange-50 shadow-md'
                          : 'border-gray-200 hover:border-orange-300 hover:shadow-sm'
                      }`}
                      onClick={() => setExecutionMode('random')}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <User className="h-5 w-5 text-orange-600 mr-2" />
                            <h4 className="font-semibold text-gray-900">Random Instance</h4>
                            <Badge className="ml-2 bg-green-100 text-green-800 border-green-200 text-xs">Recommended</Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Execute the script on one randomly selected instance from the target group (safer for testing)
                          </p>
                        </div>
                        {executionMode === 'random' && (
                          <CheckCircle className="h-5 w-5 text-orange-600" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Template Variables */}
            {selectedTargetGroup && script.templateVariables && script.templateVariables.length > 0 && (
              <Card className="shadow-sm border-gray-200">
                <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Code className="mr-2 h-5 w-5 text-blue-600" />
                    Template Variables
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    This script uses template variables. Please provide values for the required fields.
                  </p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {script.templateVariables.map((variable) => {
                      const isPassword = variable.name.toLowerCase().includes('pass') || 
                                       variable.name.toLowerCase().includes('secret') ||
                                       variable.name.toLowerCase().includes('key') ||
                                       variable.name.toLowerCase().includes('token')
                      
                      return (
                        <div key={variable.name} className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 flex items-center">
                            {variable.name}
                            {variable.required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </label>
                          <Input
                            type={isPassword ? 'password' : 'text'}
                            placeholder={variable.example || `Enter ${variable.name}`}
                            value={templateVariables[variable.name] || ''}
                            onChange={(e) => {
                              setTemplateVariables(prev => ({
                                ...prev,
                                [variable.name]: e.target.value
                              }))
                              // Clear error when user starts typing
                              if (templateVariableErrors[variable.name]) {
                                setTemplateVariableErrors(prev => ({
                                  ...prev,
                                  [variable.name]: ''
                                }))
                              }
                            }}
                            className={templateVariableErrors[variable.name] ? 'border-red-500 focus:border-red-500' : ''}
                            disabled={executing}
                          />
                          {templateVariableErrors[variable.name] && (
                            <p className="text-sm text-red-600">{templateVariableErrors[variable.name]}</p>
                          )}
                          {variable.description && (
                            <p className="text-xs text-gray-500">{variable.description}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Template Preview */}
                  {Object.keys(templateVariables).some(key => templateVariables[key].trim() !== '') && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Variable Preview:</h4>
                      <div className="space-y-1">
                        {Object.entries(templateVariables)
                          .filter(([, value]) => value.trim() !== '')
                          .map(([key, value]) => {
                            const isSecretVar = key.toLowerCase().includes('pass') || 
                                              key.toLowerCase().includes('secret') ||
                                              key.toLowerCase().includes('key') ||
                                              key.toLowerCase().includes('token')
                            return (
                              <div key={key} className="flex justify-between text-xs">
                                <span className="text-gray-600">{key}:</span>
                                <span className="text-gray-900 font-mono">
                                  {isSecretVar ? '••••••••' : value}
                                </span>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Execute Button */}
            {selectedTargetGroup && (
              <Card className="shadow-sm border-gray-200">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Ready to Execute</h3>
                      <p className="text-sm text-gray-600">
                        Execute "{script.name}" on "{selectedTarget?.name}" ({executionMode === 'all' ? 'all instances' : 'random instance'})
                        {script.templateVariables && script.templateVariables.length > 0 && (
                          <span className="block mt-1 text-xs text-blue-600">
                            Using {Object.keys(templateVariables).filter(key => templateVariables[key].trim() !== '').length} template variable(s)
                          </span>
                        )}
                      </p>
                    </div>
                    <Button
                      onClick={handleExecute}
                      disabled={executing || !selectedTargetGroup || (script.templateVariables && script.templateVariables.length > 0 && Object.values(templateVariableErrors).some(error => error))}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg"
                    >
                      {executing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Starting...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Execute Script
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Execution Result */}
            {executionResult && (
              <Card className="shadow-sm border-gray-200">
                <div className={`p-6 border-b ${
                  executionResult.status === 'success' 
                    ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200' 
                    : executionResult.status === 'failed'
                    ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-200'
                    : executionResult.status === 'running'
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200'
                    : 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200'
                }`}>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    {executionResult.status === 'success' ? (
                      <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                    ) : executionResult.status === 'failed' ? (
                      <XCircle className="mr-2 h-5 w-5 text-red-600" />
                    ) : executionResult.status === 'running' ? (
                      <RefreshCw className="mr-2 h-5 w-5 text-blue-600 animate-spin" />
                    ) : (
                      <Clock className="mr-2 h-5 w-5 text-yellow-600" />
                    )}
                    Execution {
                      executionResult.status === 'success' ? 'Completed Successfully' :
                      executionResult.status === 'failed' ? 'Failed' :
                      executionResult.status === 'running' ? 'In Progress' :
                      executionResult.status === 'pending' ? 'Starting...' :
                      executionResult.status === 'timeout' ? 'Timed Out' :
                      executionResult.status === 'cancelled' ? 'Cancelled' :
                      'Started'
                    }
                  </h2>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Target: {selectedTarget?.name}</p>
                    <p>Mode: {executionMode === 'all' ? 'All instances' : 'Random instance'}</p>
                    {executionResult.instanceIds && executionResult.instanceIds.length > 0 && (
                      <p>Instances: {executionResult.instanceIds.join(', ')}</p>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  {executionResult.status === 'running' && (
                    <div className="flex items-center space-x-2 text-blue-600 mb-4">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Script is executing... Please wait.</span>
                    </div>
                  )}
                  
                  {executionResult.message && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Message:</h4>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {executionResult.message}
                      </p>
                    </div>
                  )}

                  {executionResult.output && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Output:</h4>
                      <pre className="text-sm bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                        {executionResult.output}
                      </pre>
                    </div>
                  )}

                  {executionResult.errorMessage && (
                    <div className="mb-4">
                      <h4 className="font-medium text-red-900 mb-2">Error:</h4>
                      <pre className="text-sm bg-red-50 text-red-700 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap border border-red-200">
                        {executionResult.errorMessage}
                      </pre>
                    </div>
                  )}

                  {executionResult.completedAt && (
                    <div className="text-xs text-gray-500 flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      Completed at: {new Date(executionResult.completedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* All Instances Confirmation Dialog */}
      {showAllInstancesConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-amber-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Execute on All Instances?</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-3">
                You are about to execute "<strong>{script.name}</strong>" on <strong>ALL instances</strong> in the target group "<strong>{selectedTarget?.name}</strong>".
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>⚠️ Warning:</strong> This action cannot be undone and will affect all matching instances simultaneously. 
                  Please ensure you have tested this script thoroughly.
                </p>
              </div>
              {script.templateVariables && script.templateVariables.length > 0 && Object.keys(templateVariables).some(key => templateVariables[key].trim() !== '') && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium mb-2">Template Variables:</p>
                  <div className="space-y-1">
                    {Object.entries(templateVariables)
                      .filter(([, value]) => value.trim() !== '')
                      .map(([key, value]) => {
                        const isSecretVar = key.toLowerCase().includes('pass') || 
                                          key.toLowerCase().includes('secret') ||
                                          key.toLowerCase().includes('key') ||
                                          key.toLowerCase().includes('token')
                        return (
                          <div key={key} className="flex justify-between text-xs">
                            <span className="text-blue-700">{key}:</span>
                            <span className="text-blue-900 font-mono">
                              {isSecretVar ? '••••••••' : value}
                            </span>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowAllInstancesConfirm(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={executeScript}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={executing}
              >
                {executing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Executing...
                  </>
                ) : (
                  'Yes, Execute on All'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScriptExecutePage 