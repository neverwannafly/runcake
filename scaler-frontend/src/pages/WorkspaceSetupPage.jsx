import React, { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card } from '../components/ui/card'

const WorkspaceSetupPage = () => {
  const navigate = useNavigate()
  const { initializeWorkspace, isWorkspaceInitialized, isAuthenticated, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    workspaceName: '',
    emailDomain: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    logoBase64: ''
  })
  const [errors, setErrors] = useState({})
  const [logoPreview, setLogoPreview] = useState('')

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

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({
        ...prev,
        logo: 'Please select a valid image file'
      }))
      return
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        logo: 'Logo file must be smaller than 2MB'
      }))
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64String = event.target.result
      setFormData(prev => ({
        ...prev,
        logoBase64: base64String
      }))
      setLogoPreview(base64String)
      
      // Clear logo error
      if (errors.logo) {
        setErrors(prev => ({
          ...prev,
          logo: ''
        }))
      }
    }
    reader.readAsDataURL(file)
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.workspaceName.trim()) {
      newErrors.workspaceName = 'Workspace name is required'
    }

    if (!formData.emailDomain.trim()) {
      newErrors.emailDomain = 'Email domain is required'
    } else if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/.test(formData.emailDomain)) {
      newErrors.emailDomain = 'Please enter a valid domain (e.g., company.com)'
    }

    if (!formData.adminName.trim()) {
      newErrors.adminName = 'Admin name is required'
    }

    if (!formData.adminEmail.trim()) {
      newErrors.adminEmail = 'Admin email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
      newErrors.adminEmail = 'Please enter a valid email address'
    } else {
      const emailDomain = formData.adminEmail.split('@')[1]
      if (emailDomain !== formData.emailDomain.toLowerCase()) {
        newErrors.adminEmail = 'Admin email must belong to the workspace domain'
      }
    }

    if (!formData.adminPassword) {
      newErrors.adminPassword = 'Password is required'
    } else if (formData.adminPassword.length < 8) {
      newErrors.adminPassword = 'Password must be at least 8 characters long'
    }

    if (formData.adminPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    const result = await initializeWorkspace({
      workspaceName: formData.workspaceName.trim(),
      emailDomain: formData.emailDomain.toLowerCase().trim(),
      adminName: formData.adminName.trim(),
      adminEmail: formData.adminEmail.toLowerCase().trim(),
      adminPassword: formData.adminPassword,
      logoBase64: formData.logoBase64
    })

    if (result.success && result.redirect) {
      navigate(result.redirect)
    } else if (!result.success) {
      setErrors({ submit: result.message })
      setIsLoading(false)
    }
  }

  

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-left text-3xl font-extrabold text-gray-900">
            Set up your workspace
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Configure your organization's Scaler workspace
          </p>
        </div>

        <Card className="p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Workspace Logo (optional)
              </label>
              <div className="mt-1 flex items-center space-x-4">
                {logoPreview && (
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="h-12 w-12 object-contain rounded"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              {errors.logo && (
                <p className="mt-1 text-sm text-red-600">{errors.logo}</p>
              )}
            </div>

            {/* Workspace Name */}
            <div>
              <label htmlFor="workspaceName" className="block text-sm font-medium text-gray-700">
                Workspace Name
              </label>
              <Input
                id="workspaceName"
                name="workspaceName"
                type="text"
                required
                value={formData.workspaceName}
                onChange={handleInputChange}
                placeholder="e.g., Acme Corporation"
                className={errors.workspaceName ? 'border-red-500' : ''}
              />
              {errors.workspaceName && (
                <p className="mt-1 text-sm text-red-600">{errors.workspaceName}</p>
              )}
            </div>

            {/* Email Domain */}
            <div>
              <label htmlFor="emailDomain" className="block text-sm font-medium text-gray-700">
                Email Domain
              </label>
              <Input
                id="emailDomain"
                name="emailDomain"
                type="text"
                required
                value={formData.emailDomain}
                onChange={handleInputChange}
                placeholder="e.g., company.com"
                className={errors.emailDomain ? 'border-red-500' : ''}
              />
              {errors.emailDomain && (
                <p className="mt-1 text-sm text-red-600">{errors.emailDomain}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Only users with this email domain can access the workspace
              </p>
            </div>

            {/* Admin Details */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Administrator Account</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="adminName" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <Input
                    id="adminName"
                    name="adminName"
                    type="text"
                    required
                    value={formData.adminName}
                    onChange={handleInputChange}
                    placeholder="e.g., John Doe"
                    className={errors.adminName ? 'border-red-500' : ''}
                  />
                  {errors.adminName && (
                    <p className="mt-1 text-sm text-red-600">{errors.adminName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <Input
                    id="adminEmail"
                    name="adminEmail"
                    type="email"
                    required
                    value={formData.adminEmail}
                    onChange={handleInputChange}
                    placeholder={`e.g., admin@${formData.emailDomain || 'company.com'}`}
                    className={errors.adminEmail ? 'border-red-500' : ''}
                  />
                  {errors.adminEmail && (
                    <p className="mt-1 text-sm text-red-600">{errors.adminEmail}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Input
                    id="adminPassword"
                    name="adminPassword"
                    type="password"
                    required
                    value={formData.adminPassword}
                    onChange={handleInputChange}
                    className={errors.adminPassword ? 'border-red-500' : ''}
                  />
                  {errors.adminPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.adminPassword}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={errors.confirmPassword ? 'border-red-500' : ''}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Setting up workspace...' : 'Create Workspace'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default WorkspaceSetupPage 