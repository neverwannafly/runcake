import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { runnersAPI } from '../lib/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Card } from '../components/ui/card'
import { ArrowLeft, Save, Code, AlertCircle } from 'lucide-react'

const NewRunnerPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    init_code: ''
  })
  const [errors, setErrors] = useState({})

  // Redirect if not admin
  if (user?.role !== 'admin') {
    navigate('/runners')
    return null
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
        [name]: null
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Runner name is required'
    }

    if (!formData.init_code.trim()) {
      newErrors.init_code = 'Initialization code is required'
    } else if (!formData.init_code.includes('{{SCRIPT_CONTENT}}')) {
      newErrors.init_code = 'Init code must contain {{SCRIPT_CONTENT}} placeholder'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      const response = await runnersAPI.create(formData)
      
      if (response.success) {
        alert('Runner created successfully!')
        navigate(`/runners/${response.runner.id}`)
      } else {
        alert('Failed to create runner: ' + (response.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error creating runner:', error)
      alert('Failed to create runner. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const exampleRunners = [
    {
      name: 'Python',
      description: 'Execute Python scripts with virtual environment support',
      init_code: `#!/bin/bash
# Python Runner with virtual environment
python3 -m venv /tmp/script_env
source /tmp/script_env/bin/activate
pip install --quiet requests

# Execute the script
python3 << 'EOF'
{{SCRIPT_CONTENT}}
EOF

# Cleanup
deactivate
rm -rf /tmp/script_env`
    },
    {
      name: 'Node.js',
      description: 'Execute Node.js scripts with npm package support',
      init_code: `#!/bin/bash
# Node.js Runner
cd /tmp
npm init -y > /dev/null 2>&1
npm install --silent axios

# Execute the script
node << 'EOF'
{{SCRIPT_CONTENT}}
EOF

# Cleanup
rm -rf node_modules package*.json`
    },
    {
      name: 'Docker',
      description: 'Execute scripts inside a Docker container',
      init_code: `#!/bin/bash
# Docker Runner
cat > /tmp/script.sh << 'EOF'
{{SCRIPT_CONTENT}}
EOF

# Run in Ubuntu container
docker run --rm -v /tmp/script.sh:/script.sh ubuntu:latest bash /script.sh

# Cleanup
rm -f /tmp/script.sh`
    }
  ]

  const loadExample = (example) => {
    setFormData({
      name: example.name,
      description: example.description,
      init_code: example.init_code
    })
    setErrors({})
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex-col items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/runners')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Runners
        </Button>
        <div>
          <h1 className="mt-4 text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Create New Runner
          </h1>
          <p className="text-gray-600 mt-1">Define a custom script execution environment</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Runner Name *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Python, Node.js, Custom Bash"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of what this runner does"
                  />
                </div>
              </div>

              {/* Initialization Code */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Initialization Code *</h3>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Required Template Variable</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Your initialization code must include the <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">{'{{SCRIPT_CONTENT}}'}</code> placeholder. 
                        This will be replaced with the actual script content during execution.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Textarea
                    id="init_code"
                    name="init_code"
                    value={formData.init_code}
                    onChange={handleInputChange}
                    placeholder="#!/bin/bash&#10;# Your initialization code here&#10;# Must include {{SCRIPT_CONTENT}} placeholder&#10;&#10;{{SCRIPT_CONTENT}}"
                    rows={15}
                    className={`font-mono text-sm ${errors.init_code ? 'border-red-500' : ''}`}
                  />
                  {errors.init_code && (
                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.init_code}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/runners')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Runner
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Examples Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Example Runners</h3>
            <p className="text-sm text-gray-600 mb-4">
              Click on any example to load it into the form as a starting point.
            </p>
            <div className="space-y-3">
              {exampleRunners.map((example, index) => (
                <div
                  key={index}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => loadExample(example)}
                >
                  <h4 className="font-medium text-gray-900">{example.name}</h4>
                  <p className="text-xs text-gray-600 mt-1">{example.description}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tips</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Use <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">#!/bin/bash</code> as the first line for shell scripts</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Set up any required dependencies or environment before the script content</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Clean up temporary files or resources after execution</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Test your runner thoroughly before using it in production</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default NewRunnerPage 