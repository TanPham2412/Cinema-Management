import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8081/api'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-white text-xl font-bold mb-2">Link không hợp lệ</h2>
          <p className="text-gray-400 text-sm mb-6">Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.</p>
          <Link to="/forgot-password" className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl px-6 py-3 transition-colors inline-block">
            Gửi lại link mới
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }
    setLoading(true)
    try {
      await axios.post(`${API_BASE}/auth/reset-password`, { token, newPassword })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      const msg = err.response?.data?.message || 'Link không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="bg-red-600 w-10 h-10 rounded-lg flex items-center justify-center text-xl">🎬</div>
            <span className="text-white text-2xl font-bold">LLMCinema</span>
          </Link>
        </div>

        <div className="bg-[#13131a] border border-white/10 rounded-2xl p-8 shadow-xl">
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                ✅
              </div>
              <h2 className="text-white text-xl font-bold mb-2">Đặt lại thành công!</h2>
              <p className="text-gray-400 text-sm mb-2">Mật khẩu của bạn đã được cập nhật.</p>
              <p className="text-gray-500 text-xs">Đang chuyển hướng đến trang đăng nhập...</p>
            </div>
          ) : (
            <>
              <h2 className="text-white text-2xl font-bold mb-2">Đặt lại mật khẩu</h2>
              <p className="text-gray-400 text-sm mb-6">Nhập mật khẩu mới cho tài khoản của bạn.</p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1.5 block">Mật khẩu mới</label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:border-red-500 transition-colors placeholder:text-gray-600"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 text-lg"
                    >
                      {showNew ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-1.5 block">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:border-red-500 transition-colors placeholder:text-gray-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 text-lg"
                    >
                      {showConfirm ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-60 text-white font-semibold rounded-xl py-3 transition-colors"
                >
                  {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
              ← Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
