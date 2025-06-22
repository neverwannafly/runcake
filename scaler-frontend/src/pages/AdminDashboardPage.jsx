import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { 
  Users, 
  Shield, 
  UserCheck, 
  UserX, 
  Crown,
  Trash2,
  Settings,
  Activity,
  FileText,
  Target,
  Key
} from 'lucide-react'
import { workspaceAPI, authAPI } from '../lib/api'

const AdminDashboardPage = () => {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [workspaceStats, setWorkspaceStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [usersResponse, workspaceResponse] = await Promise.all([
        workspaceAPI.getUsers(),
        workspaceAPI.get()
      ])

      if (usersResponse.success) {
        setUsers(usersResponse.data.users)
      }

      if (workspaceResponse.success) {
        setWorkspaceStats(workspaceResponse.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      setActionLoading(`role-${userId}`)
      const response = await workspaceAPI.updateUser(userId, { role: newRole })
      
      if (response.success) {
        setUsers(users.map(u => 
          u.id === userId ? { ...u, role: newRole } : u
        ))
      }
    } catch (error) {
      console.error('Error updating user role:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleStatusToggle = async (userId, isActive) => {
    try {
      setActionLoading(`status-${userId}`)
      const response = await workspaceAPI.updateUser(userId, { isActive })
      
      if (response.success) {
        setUsers(users.map(u => 
          u.id === userId ? { ...u, is_active: isActive } : u
        ))
      }
    } catch (error) {
      console.error('Error updating user status:', error)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const stats = workspaceStats?.stats || {}

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Manage users, permissions, and workspace settings
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Users</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalUsers || 0}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-600 text-sm font-medium">Admin Users</p>
              <p className="text-2xl font-bold text-amber-900">{stats.adminUsers || 0}</p>
            </div>
            <Crown className="h-8 w-8 text-amber-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Scripts</p>
              <p className="text-2xl font-bold text-green-900">{stats.totalScripts || 0}</p>
            </div>
            <FileText className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Target Groups</p>
              <p className="text-2xl font-bold text-purple-900">{stats.totalTargetGroups || 0}</p>
            </div>
            <Target className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Users Management */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Joined</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((userData) => (
                <tr key={userData.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {userData.avatar_url ? (
                          <img
                            src={authAPI.getAvatarUrl(userData.id)}
                            alt="User Avatar"
                            className="h-10 w-10 rounded-full"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                        ) : null}
                        <div 
                          className={`h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center ${userData.avatar_url ? 'hidden' : ''}`}
                        >
                          <span className="text-sm font-semibold text-white">
                            {userData.name?.[0] || userData.email?.[0] || 'U'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{userData.name}</p>
                        <p className="text-sm text-gray-500">{userData.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <Badge variant={userData.role === 'admin' ? 'default' : 'secondary'}>
                        {userData.role === 'admin' ? (
                          <>
                            <Crown className="h-3 w-3 mr-1" />
                            Admin
                          </>
                        ) : (
                          <>
                            <Users className="h-3 w-3 mr-1" />
                            Member
                          </>
                        )}
                      </Badge>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={userData.is_active ? 'success' : 'destructive'}>
                      {userData.is_active ? (
                        <>
                          <UserCheck className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <UserX className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {new Date(userData.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      {userData.id !== user.id && (
                        <>
                          {/* Role Toggle */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRoleChange(
                              userData.id, 
                              userData.role === 'admin' ? 'member' : 'admin'
                            )}
                            disabled={actionLoading === `role-${userData.id}`}
                            className="text-xs"
                          >
                            {actionLoading === `role-${userData.id}` ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-600"></div>
                            ) : userData.role === 'admin' ? (
                              <>
                                <Users className="h-3 w-3 mr-1" />
                                Make Member
                              </>
                            ) : (
                              <>
                                <Crown className="h-3 w-3 mr-1" />
                                Make Admin
                              </>
                            )}
                          </Button>

                          {/* Status Toggle */}
                          <Button
                            variant={userData.is_active ? "destructive" : "default"}
                            size="sm"
                            onClick={() => handleStatusToggle(userData.id, !userData.is_active)}
                            disabled={actionLoading === `status-${userData.id}`}
                            className="text-xs"
                          >
                            {actionLoading === `status-${userData.id}` ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                            ) : userData.is_active ? (
                              <>
                                <UserX className="h-3 w-3 mr-1" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3 w-3 mr-1" />
                                Activate
                              </>
                            )}
                          </Button>
                        </>
                      )}
                      
                      {userData.id === user.id && (
                        <Badge variant="outline" className="text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default AdminDashboardPage 