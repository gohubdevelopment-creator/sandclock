import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import { API_BASE_URL } from '../config/api'

const API_URL = `${API_BASE_URL}/api`

interface Package {
  id: number
  name: string
  description: string
  min_investment: number
  max_investment: number
  roi_percentage: number
  duration_days: number
  clauses: string
  gradient: string
  is_active: number
}

interface User {
  id: number
  name: string
  email: string
  balance: number
  role: string
  status: string
  created_at: string
}

interface Stats {
  totalUsers: number
  totalInvestments: number
  totalValue: number
  activeInvestments: number
}

const Admin = () => {
  const { user, token } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<Stats | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [investments, setInvestments] = useState<any[]>([])
  const [editingPackage, setEditingPackage] = useState<Package | null>(null)
  const [showPackageForm, setShowPackageForm] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [balanceAmount, setBalanceAmount] = useState('')
  const [balanceType, setBalanceType] = useState<'add' | 'subtract' | 'set'>('add')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [packageForm, setPackageForm] = useState({
    name: '',
    description: '',
    min_investment: '',
    max_investment: '',
    roi_percentage: '',
    duration_days: '',
    clauses: '',
    gradient: 'from-cyan-400 via-teal-300 to-blue-500',
    is_active: true
  })

  const gradientOptions = [
    'from-cyan-400 via-teal-300 to-blue-500',
    'from-yellow-200 via-green-200 to-yellow-300',
    'from-purple-400 via-pink-500 to-red-500',
    'from-blue-400 via-indigo-500 to-purple-500',
    'from-green-400 via-emerald-500 to-teal-500',
    'from-orange-400 via-red-500 to-pink-500',
    'from-rose-400 via-fuchsia-500 to-indigo-500'
  ]

  useEffect(() => {
    if (user?.role === 'admin' && token) {
      fetchAllData()
    }
  }, [user, token])

  const fetchAllData = async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([
        fetchStats(),
        fetchPackages(),
        fetchUsers(),
        fetchInvestments()
      ])
    } catch (err: any) {
      console.error('Admin fetch error:', err)
      setError(err.message || 'Failed to connect to server. Make sure the backend is running on http://localhost:3001')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    const res = await fetch(`${API_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || `Failed to fetch stats (${res.status})`)
    }
    const data = await res.json()
    setStats(data)
  }

  const fetchPackages = async () => {
    const res = await fetch(`${API_URL}/admin/packages`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || `Failed to fetch packages (${res.status})`)
    }
    const data = await res.json()
    setPackages(data)
  }

  const fetchUsers = async () => {
    const res = await fetch(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || `Failed to fetch users (${res.status})`)
    }
    const data = await res.json()
    setUsers(data)
  }

  const fetchInvestments = async () => {
    const res = await fetch(`${API_URL}/admin/investments`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || `Failed to fetch investments (${res.status})`)
    }
    const data = await res.json()
    setInvestments(data)
  }

  const handlePackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingPackage
      ? `${API_URL}/admin/packages/${editingPackage.id}`
      : `${API_URL}/admin/packages`
    const method = editingPackage ? 'PUT' : 'POST'

    await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...packageForm,
        min_investment: parseFloat(packageForm.min_investment),
        max_investment: packageForm.max_investment ? parseFloat(packageForm.max_investment) : null,
        roi_percentage: parseFloat(packageForm.roi_percentage),
        duration_days: parseInt(packageForm.duration_days)
      })
    })

    fetchPackages()
    setShowPackageForm(false)
    setEditingPackage(null)
    resetForm()
  }

  const resetForm = () => {
    setPackageForm({
      name: '',
      description: '',
      min_investment: '',
      max_investment: '',
      roi_percentage: '',
      duration_days: '',
      clauses: '',
      gradient: 'from-cyan-400 via-teal-300 to-blue-500',
      is_active: true
    })
  }

  const editPackage = (pkg: Package) => {
    setEditingPackage(pkg)
    setPackageForm({
      name: pkg.name,
      description: pkg.description || '',
      min_investment: pkg.min_investment.toString(),
      max_investment: pkg.max_investment?.toString() || '',
      roi_percentage: pkg.roi_percentage.toString(),
      duration_days: pkg.duration_days.toString(),
      clauses: pkg.clauses || '',
      gradient: pkg.gradient,
      is_active: pkg.is_active === 1
    })
    setShowPackageForm(true)
  }

  const deletePackage = async (id: number) => {
    if (confirm('Are you sure you want to delete this package?')) {
      await fetch(`${API_URL}/admin/packages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchPackages()
    }
  }

  // User management functions
  const suspendUser = async (userId: number) => {
    await fetch(`${API_URL}/admin/users/${userId}/suspend`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    })
    fetchUsers()
    fetchStats()
  }

  const activateUser = async (userId: number) => {
    await fetch(`${API_URL}/admin/users/${userId}/activate`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    })
    fetchUsers()
  }

  const deleteUser = async (userId: number) => {
    if (confirm('Are you sure you want to delete this user? This will delete all their investments and transactions.')) {
      await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchUsers()
      fetchStats()
      fetchInvestments()
    }
  }

  const updateBalance = async () => {
    if (!selectedUser || !balanceAmount) return

    await fetch(`${API_URL}/admin/users/${selectedUser.id}/balance`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        amount: parseFloat(balanceAmount),
        type: balanceType
      })
    })

    fetchUsers()
    setShowUserModal(false)
    setSelectedUser(null)
    setBalanceAmount('')
  }

  const openUserModal = (u: User) => {
    setSelectedUser(u)
    setBalanceAmount('')
    setBalanceType('add')
    setShowUserModal(true)
  }

  // Calculate expected return for display
  const calculateExpectedReturn = (amount: string, roi: string) => {
    const a = parseFloat(amount) || 0
    const r = parseFloat(roi) || 0
    return (a * (1 + r / 100)).toFixed(2)
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  const tabs = ['overview', 'packages', 'users', 'investments']

  return (
    <section className="px-4 sm:px-6 lg:px-16 py-6 sm:py-8 bg-black min-h-[calc(100vh-200px)]">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="flex gap-2 sm:gap-4 mb-6 sm:mb-8 border-b border-white/10 pb-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium capitalize transition-colors text-sm sm:text-base whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-green-500 text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400">Loading admin data...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchAllData}
              className="bg-red-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-400"
            >
              Retry
            </button>
          </div>
        )}

        {/* Overview Tab */}
        {!loading && !error && activeTab === 'overview' && stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-black border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <p className="text-gray-400 text-xs sm:text-sm mb-2">Total Users</p>
              <p className="text-white text-xl sm:text-3xl font-bold">{stats.totalUsers}</p>
            </div>
            <div className="bg-black border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <p className="text-gray-400 text-xs sm:text-sm mb-2">Total Investments</p>
              <p className="text-white text-xl sm:text-3xl font-bold">{stats.totalInvestments}</p>
            </div>
            <div className="bg-black border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <p className="text-gray-400 text-xs sm:text-sm mb-2">Total Value</p>
              <p className="text-green-500 text-xl sm:text-3xl font-bold">${stats.totalValue.toLocaleString()}</p>
            </div>
            <div className="bg-black border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <p className="text-gray-400 text-xs sm:text-sm mb-2">Active Investments</p>
              <p className="text-white text-xl sm:text-3xl font-bold">{stats.activeInvestments}</p>
            </div>
          </div>
        )}

        {/* Packages Tab */}
        {!loading && !error && activeTab === 'packages' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Investment Packages</h2>
              <button
                onClick={() => {
                  resetForm()
                  setEditingPackage(null)
                  setShowPackageForm(true)
                }}
                className="bg-green-500 text-black px-4 py-2 rounded-lg font-medium hover:bg-green-400"
              >
                Add Package
              </button>
            </div>

            {showPackageForm && (
              <form onSubmit={handlePackageSubmit} className="bg-black border border-white/10 rounded-2xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {editingPackage ? 'Edit Package' : 'Create Package'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Name</label>
                    <input
                      type="text"
                      value={packageForm.name}
                      onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">ROI Percentage (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={packageForm.roi_percentage}
                      onChange={(e) => setPackageForm({ ...packageForm, roi_percentage: e.target.value })}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Min Investment ($)</label>
                    <input
                      type="number"
                      value={packageForm.min_investment}
                      onChange={(e) => setPackageForm({ ...packageForm, min_investment: e.target.value })}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Max Investment ($)</label>
                    <input
                      type="number"
                      value={packageForm.max_investment}
                      onChange={(e) => setPackageForm({ ...packageForm, max_investment: e.target.value })}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Duration (days)</label>
                    <input
                      type="number"
                      value={packageForm.duration_days}
                      onChange={(e) => setPackageForm({ ...packageForm, duration_days: e.target.value })}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Gradient</label>
                    <select
                      value={packageForm.gradient}
                      onChange={(e) => setPackageForm({ ...packageForm, gradient: e.target.value })}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500"
                    >
                      {gradientOptions.map((g) => (
                        <option key={g} value={g}>{g.split(' ')[0].replace('from-', '')}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-gray-400 text-sm mb-2">Description</label>
                    <textarea
                      value={packageForm.description}
                      onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500"
                      rows={2}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-gray-400 text-sm mb-2">Clauses/Terms</label>
                    <textarea
                      value={packageForm.clauses}
                      onChange={(e) => setPackageForm({ ...packageForm, clauses: e.target.value })}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500"
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={packageForm.is_active}
                      onChange={(e) => setPackageForm({ ...packageForm, is_active: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label className="text-gray-400 text-sm">Active</label>
                  </div>
                </div>

                {/* ROI Preview */}
                {packageForm.min_investment && packageForm.roi_percentage && (
                  <div className="mt-4 p-4 bg-white/5 rounded-xl">
                    <p className="text-gray-400 text-sm mb-2">ROI Preview</p>
                    <p className="text-white">
                      Investing <span className="text-green-500">${packageForm.min_investment}</span> will return{' '}
                      <span className="text-green-500">
                        ${calculateExpectedReturn(packageForm.min_investment, packageForm.roi_percentage)}
                      </span>{' '}
                      after {packageForm.duration_days || '?'} days
                    </p>
                  </div>
                )}

                <div className="flex gap-4 mt-6">
                  <button
                    type="submit"
                    className="bg-green-500 text-black px-6 py-2 rounded-lg font-medium hover:bg-green-400"
                  >
                    {editingPackage ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPackageForm(false)
                      setEditingPackage(null)
                    }}
                    className="border border-white/10 text-white px-6 py-2 rounded-lg font-medium hover:bg-white/5"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {packages.map((pkg) => (
                <div key={pkg.id} className="bg-black border border-white/10 rounded-2xl p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${pkg.gradient}`} />
                    <div>
                      <h3 className="text-white font-semibold">{pkg.name}</h3>
                      <p className="text-gray-400 text-sm">
                        {pkg.roi_percentage}% ROI • {pkg.duration_days} days • ${pkg.min_investment} min
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${pkg.is_active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                      {pkg.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button onClick={() => editPackage(pkg)} className="text-gray-400 hover:text-white">Edit</button>
                    <button onClick={() => deletePackage(pkg.id)} className="text-red-400 hover:text-red-300">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {!loading && !error && activeTab === 'users' && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl font-semibold text-white">User Management</h2>
              <p className="text-gray-400 text-sm">{users.length} users</p>
            </div>

            {/* Mobile: Card View */}
            <div className="md:hidden space-y-4">
              {users.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  No users yet
                </div>
              ) : (
                users.map((u) => (
                  <div key={u.id} className="bg-black border border-white/10 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-white font-medium mb-1">{u.name}</p>
                        <p className="text-gray-500 text-xs sm:text-sm">{u.email}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        u.status === 'active'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {u.status || 'active'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Balance</p>
                        <p className="text-green-500 font-medium">${u.balance.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Joined</p>
                        <p className="text-gray-400">{new Date(u.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => openUserModal(u)}
                        className="px-3 py-1.5 text-xs bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
                      >
                        Edit Balance
                      </button>
                      {u.status === 'suspended' ? (
                        <button
                          onClick={() => activateUser(u.id)}
                          className="px-3 py-1.5 text-xs bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
                        >
                          Activate
                        </button>
                      ) : (
                        <button
                          onClick={() => suspendUser(u.id)}
                          className="px-3 py-1.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30"
                        >
                          Suspend
                        </button>
                      )}
                      <button
                        onClick={() => deleteUser(u.id)}
                        className="px-3 py-1.5 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop: Table View */}
            <div className="hidden md:block bg-black border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="text-left text-gray-400 text-sm p-4">User</th>
                    <th className="text-left text-gray-400 text-sm p-4">Balance</th>
                    <th className="text-left text-gray-400 text-sm p-4">Status</th>
                    <th className="text-left text-gray-400 text-sm p-4">Joined</th>
                    <th className="text-right text-gray-400 text-sm p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4">
                        <div>
                          <p className="text-white font-medium">{u.name}</p>
                          <p className="text-gray-500 text-sm">{u.email}</p>
                        </div>
                      </td>
                      <td className="text-green-500 p-4 font-medium">${u.balance.toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          u.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {u.status || 'active'}
                        </span>
                      </td>
                      <td className="text-gray-400 p-4">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openUserModal(u)}
                            className="px-3 py-1.5 text-xs bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
                          >
                            Edit Balance
                          </button>
                          {u.status === 'suspended' ? (
                            <button
                              onClick={() => activateUser(u.id)}
                              className="px-3 py-1.5 text-xs bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
                            >
                              Activate
                            </button>
                          ) : (
                            <button
                              onClick={() => suspendUser(u.id)}
                              className="px-3 py-1.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30"
                            >
                              Suspend
                            </button>
                          )}
                          <button
                            onClick={() => deleteUser(u.id)}
                            className="px-3 py-1.5 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {users.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  No users yet
                </div>
              )}
            </div>
          </div>
        )}

        {/* Investments Tab */}
        {!loading && !error && activeTab === 'investments' && (
          <>
            {/* Mobile: Card View */}
            <div className="md:hidden space-y-4">
              {investments.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  No investments yet
                </div>
              ) : (
                investments.map((inv) => (
                  <div key={inv.id} className="bg-black border border-white/10 rounded-xl p-4">
                    <div className="mb-3">
                      <p className="text-white font-medium mb-1">{inv.user_name}</p>
                      <p className="text-gray-500 text-xs">{inv.user_email}</p>
                    </div>
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-xs">Package</span>
                        <span className="text-white text-sm">{inv.package_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-xs">Amount</span>
                        <span className="text-white text-sm">${inv.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-xs">Expected Return</span>
                        <span className="text-green-500 text-sm">${inv.expected_return.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-xs">End Date</span>
                        <span className="text-gray-400 text-sm">{new Date(inv.end_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div>
                      <span className={`px-2 py-1 rounded text-xs ${inv.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop: Table View */}
            <div className="hidden md:block bg-black border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="text-left text-gray-400 text-sm p-4">User</th>
                    <th className="text-left text-gray-400 text-sm p-4">Package</th>
                    <th className="text-left text-gray-400 text-sm p-4">Amount</th>
                    <th className="text-left text-gray-400 text-sm p-4">Expected Return</th>
                    <th className="text-left text-gray-400 text-sm p-4">Status</th>
                    <th className="text-left text-gray-400 text-sm p-4">End Date</th>
                  </tr>
                </thead>
                <tbody>
                  {investments.map((inv) => (
                    <tr key={inv.id} className="border-b border-white/5">
                      <td className="p-4">
                        <div>
                          <p className="text-white">{inv.user_name}</p>
                          <p className="text-gray-500 text-xs">{inv.user_email}</p>
                        </div>
                      </td>
                      <td className="text-white p-4">{inv.package_name}</td>
                      <td className="text-white p-4">${inv.amount.toLocaleString()}</td>
                      <td className="text-green-500 p-4">${inv.expected_return.toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${inv.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="text-gray-400 p-4">{new Date(inv.end_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {investments.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  No investments yet
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* User Balance Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-black border border-white/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-md w-full my-4">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-white pr-2">Edit User Balance</h2>
              <button
                onClick={() => {
                  setShowUserModal(false)
                  setSelectedUser(null)
                }}
                className="text-gray-400 hover:text-white flex-shrink-0"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6 p-4 bg-white/5 rounded-xl">
              <p className="text-gray-400 text-sm">User</p>
              <p className="text-white font-medium">{selectedUser.name}</p>
              <p className="text-gray-500 text-sm">{selectedUser.email}</p>
              <p className="text-green-500 font-bold mt-2">Current Balance: ${selectedUser.balance.toLocaleString()}</p>
            </div>

            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2">Action</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setBalanceType('add')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    balanceType === 'add' ? 'bg-green-500 text-black' : 'border border-white/10 text-white'
                  }`}
                >
                  Add
                </button>
                <button
                  onClick={() => setBalanceType('subtract')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    balanceType === 'subtract' ? 'bg-red-500 text-white' : 'border border-white/10 text-white'
                  }`}
                >
                  Subtract
                </button>
                <button
                  onClick={() => setBalanceType('set')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    balanceType === 'set' ? 'bg-blue-500 text-white' : 'border border-white/10 text-white'
                  }`}
                >
                  Set
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-400 text-sm mb-2">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-green-500"
                  placeholder="Enter amount"
                />
              </div>
              {balanceAmount && (
                <p className="text-gray-400 text-sm mt-2">
                  New balance will be:{' '}
                  <span className="text-green-500 font-medium">
                    ${balanceType === 'set'
                      ? parseFloat(balanceAmount).toLocaleString()
                      : balanceType === 'add'
                      ? (selectedUser.balance + parseFloat(balanceAmount)).toLocaleString()
                      : (selectedUser.balance - parseFloat(balanceAmount)).toLocaleString()}
                  </span>
                </p>
              )}
            </div>

            <button
              onClick={updateBalance}
              disabled={!balanceAmount}
              className="w-full bg-green-500 text-black font-semibold py-2.5 sm:py-3 rounded-xl hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              Update Balance
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default Admin
