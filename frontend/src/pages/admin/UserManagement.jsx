import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Users, Search, Shield, User, ChevronLeft, ChevronRight, Ban, CheckCircle, Edit2, X } from 'lucide-react'
import api from '../../services/api'

const ROLE_BADGES = {
  ADMIN:    { label: 'Admin',     color: 'bg-cinema-red/20 text-cinema-red border-cinema-red/30' },
  STAFF:    { label: 'Nhân viên', color: 'bg-blue-500/20 text-blue-400 border-blue-400/30' },
  CUSTOMER: { label: 'Khách hàng', color: 'bg-green-500/20 text-green-400 border-green-400/30' },
}

const TIER_COLORS = {
  BRONZE:   'text-amber-600',
  SILVER:   'text-gray-300',
  GOLD:     'text-cinema-gold',
  PLATINUM: 'text-blue-300',
}

const EMPTY_EDIT = { fullName: '', phoneNumber: '', role: 'CUSTOMER' }

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState('')
  const [total, setTotal] = useState(0)
  const [editUser, setEditUser] = useState(null)   // user object being edited
  const [editForm, setEditForm] = useState(EMPTY_EDIT)
  const [saving, setSaving] = useState(false)
  const pageSize = 15

  useEffect(() => { fetchUsers() }, [page, roleFilter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/users', { params: { page, size: pageSize, role: roleFilter || undefined, keyword: search || undefined } })
      const data = response.data
      setUsers(data.content || data || [])
      setTotalPages(data.totalPages || 1)
      setTotal(data.totalElements || (data.length ?? 0))
    } catch {
      setError('Không thể tải danh sách người dùng')
      setUsers([])
      setTotalPages(1)
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(0)
    fetchUsers()
  }

  const toggleStatus = async (user) => {
    try {
      await api.put(`/admin/users/${user.id}/toggle-status`)
    } catch {}
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, enabled: !u.enabled } : u))
  }

  const openEdit = (user) => {
    setEditUser(user)
    setEditForm({ fullName: user.fullName || '', phoneNumber: user.phoneNumber || '', role: user.role || 'CUSTOMER' })
  }

  const saveUserEdit = async () => {
    if (!editUser) return
    setSaving(true)
    try {
      const res = await api.put(`/admin/users/${editUser.id}`, editForm)
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...res.data } : u))
      setEditUser(null)
    } catch {
      alert('Lưu thất bại. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('vi-VN')
  }

  return (
    <div className="min-h-screen bg-cinema-darker">
      <div className="bg-cinema-gray border-b border-cinema-gray-light">
        <div className="container mx-auto px-4 py-5 flex items-center gap-3">
          <Link to="/admin" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <Users className="w-6 h-6 text-green-400" />
          <h1 className="text-2xl font-bold text-white">Quản lý Người dùng</h1>
          <span className="ml-auto text-gray-400 text-sm">{total} người dùng</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">{error}</div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-48">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text" placeholder="Tìm theo tên, email..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-cinema-gray border border-cinema-gray-light text-white rounded-lg focus:outline-none focus:border-cinema-red text-sm"
              />
            </div>
            <button type="submit" className="px-4 py-2.5 bg-cinema-red text-white rounded-lg hover:bg-cinema-red-dark text-sm">Tìm</button>
          </form>
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(0) }}
            className="px-3 py-2.5 bg-cinema-gray border border-cinema-gray-light text-gray-300 rounded-lg focus:outline-none focus:border-cinema-red text-sm">
            <option value="">Tất cả vai trò</option>
            <option value="ADMIN">Admin</option>
            <option value="STAFF">Nhân viên</option>
            <option value="CUSTOMER">Khách hàng</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-cinema-gray rounded-xl border border-cinema-gray-light overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-cinema-gray-light">
              <tr className="text-gray-400">
                <th className="text-left px-4 py-3">Người dùng</th>
                <th className="text-left px-4 py-3">Vai trò</th>
                <th className="text-left px-4 py-3">Hạng thành viên</th>
                <th className="text-left px-4 py-3">Điểm tích lũy</th>
                <th className="text-left px-4 py-3">Ngày đăng ký</th>
                <th className="text-left px-4 py-3">Trạng thái</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cinema-gray-light">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(7)].map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-cinema-gray-light rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-500">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  Không tìm thấy người dùng
                </td></tr>
              ) : (
                users.map(user => {
                  const role = ROLE_BADGES[user.role] || ROLE_BADGES.CUSTOMER
                  const tierColor = TIER_COLORS[user.membershipTier] || 'text-gray-400'
                  return (
                    <tr key={user.id} className="hover:bg-cinema-gray-lighter/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-cinema-red/20 flex items-center justify-center text-cinema-red font-bold text-sm">
                            {(user.fullName?.[0] || user.email?.[0] || '?').toUpperCase()}
                          </div>
                          <div>
                            <div className="text-white font-medium">{user.fullName || '—'}</div>
                            <div className="text-gray-400 text-xs">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${role.color}`}>{role.label}</span>
                      </td>
                      <td className={`px-4 py-3 font-semibold ${tierColor}`}>{user.membershipTier || '—'}</td>
                      <td className="px-4 py-3 text-gray-300">{(user.loyaltyPoints || 0).toLocaleString()} đ</td>
                      <td className="px-4 py-3 text-gray-400">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.enabled !== false ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {user.enabled !== false ? 'Hoạt động' : 'Bị khóa'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {user.role !== 'ADMIN' && (
                            <button onClick={() => openEdit(user)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-cinema-gray-light transition-colors"
                              title="Sửa thông tin">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {user.role !== 'ADMIN' && (
                            <button onClick={() => toggleStatus(user)}
                              className={`p-1.5 rounded-lg transition-colors ${user.enabled !== false ? 'text-gray-400 hover:text-red-400 hover:bg-cinema-gray-light' : 'text-gray-400 hover:text-green-400 hover:bg-cinema-gray-light'}`}
                              title={user.enabled !== false ? 'Khóa tài khoản' : 'Mở tài khoản'}>
                              {user.enabled !== false ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 py-4 border-t border-cinema-gray-light">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1 text-gray-400 hover:text-white disabled:opacity-40">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-gray-400 text-sm">Trang {page + 1} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1 text-gray-400 hover:text-white disabled:opacity-40">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-cinema-gray rounded-xl border border-cinema-gray-light w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-cinema-gray-light">
              <h3 className="text-lg font-semibold text-white">Sửa thông tin người dùng</h3>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="text-xs text-gray-400 mb-1">Email (không thể sửa)</div>
                <div className="px-3 py-2 bg-cinema-darker/50 rounded-lg text-gray-400 text-sm">{editUser.email}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Họ và tên</label>
                <input type="text" value={editForm.fullName}
                  onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))}
                  className="w-full px-3 py-2 bg-cinema-darker border border-cinema-gray-light text-white rounded-lg focus:outline-none focus:border-cinema-red text-sm"
                  placeholder="Nhập họ và tên" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Số điện thoại</label>
                <input type="text" value={editForm.phoneNumber}
                  onChange={e => setEditForm(f => ({ ...f, phoneNumber: e.target.value }))}
                  className="w-full px-3 py-2 bg-cinema-darker border border-cinema-gray-light text-white rounded-lg focus:outline-none focus:border-cinema-red text-sm"
                  placeholder="Nhập số điện thoại" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Vai trò</label>
                <select value={editForm.role}
                  onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2 bg-cinema-darker border border-cinema-gray-light text-white rounded-lg focus:outline-none focus:border-cinema-red text-sm">
                  <option value="CUSTOMER">Khách hàng</option>
                  <option value="STAFF">Nhân viên</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-cinema-gray-light">
              <button onClick={() => setEditUser(null)}
                className="flex-1 px-4 py-2 bg-cinema-gray-light text-gray-300 rounded-lg hover:bg-cinema-gray-lighter text-sm">
                Hủy
              </button>
              <button onClick={saveUserEdit} disabled={saving}
                className="flex-1 px-4 py-2 bg-cinema-red text-white rounded-lg hover:bg-cinema-red-dark text-sm disabled:opacity-50">
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement
