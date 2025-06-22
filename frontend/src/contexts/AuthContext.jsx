import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI, workspaceAPI, getToken } from '../lib/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [workspace, setWorkspace] = useState(null)
  const [isWorkspaceInitialized, setIsWorkspaceInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check workspace status and user authentication on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // First check workspace status
        const workspaceResponse = await workspaceAPI.getStatus()
        if (workspaceResponse.success) {
          setIsWorkspaceInitialized(workspaceResponse.data.isInitialized)
          if (workspaceResponse.data.workspace) {
            setWorkspace(workspaceResponse.data.workspace)
          }
        }

        // Then check user authentication if workspace is initialized
        const token = getToken()
        if (token && workspaceResponse.data.isInitialized) {
          try {
            const response = await authAPI.getCurrentUser()
            if (response.success) {
              setUser(response.data.user)
              setIsAuthenticated(true)
              // Update workspace info if available
              if (response.data.workspace) {
                setWorkspace(response.data.workspace)
              }
            } else {
              // Token is invalid, remove it
              authAPI.logout()
            }
          } catch (error) {
            console.error('Failed to verify token:', error)
            // Token is invalid, remove it
            authAPI.logout()
          }
        } else if (token && !workspaceResponse.data.isInitialized) {
          // Clear token if workspace is not initialized
          authAPI.logout()
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
      }
      
      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  const login = async (email, password) => {
    try {
      setIsLoading(true)
      const response = await authAPI.login(email, password)
      
      if (response.success) {
        setUser(response.data.user)
        setIsAuthenticated(true)
        if (response.data.workspace) {
          setWorkspace(response.data.workspace)
        }
        return { success: true }
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        message: error.message || 'Login failed. Please try again.' 
      }
    } finally {
      setIsLoading(false)
    }
  }

  const googleLogin = async (credential) => {
    try {
      setIsLoading(true)
      const response = await authAPI.googleLogin(credential)
      
      if (response.success) {
        setUser(response.data.user)
        setIsAuthenticated(true)
        if (response.data.workspace) {
          setWorkspace(response.data.workspace)
        }
        return { success: true }
      } else {
        throw new Error(response.message || 'Google login failed')
      }
    } catch (error) {
      console.error('Google login error:', error)
      return { 
        success: false, 
        message: error.message || 'Google login failed. Please try again.' 
      }
    } finally {
      setIsLoading(false)
    }
  }

  const initializeWorkspace = async (workspaceData) => {
    try {
      setIsLoading(true)
      const response = await workspaceAPI.initialize(workspaceData)
      
      if (response.success) {
        setUser(response.data.user)
        setWorkspace(response.data.workspace)
        setIsAuthenticated(true)
        setIsWorkspaceInitialized(true)
        return { success: true, redirect: '/' }
      } else {
        throw new Error(response.message || 'Workspace initialization failed')
      }
    } catch (error) {
      console.error('Workspace initialization error:', error)
      return { 
        success: false, 
        message: error.message || 'Workspace initialization failed. Please try again.' 
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setIsAuthenticated(false)
      setIsLoading(false)
      // Keep workspace info for re-login
    }
  }

  const value = {
    user,
    workspace,
    isWorkspaceInitialized,
    isAuthenticated,
    isLoading,
    login,
    googleLogin,
    initializeWorkspace,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 