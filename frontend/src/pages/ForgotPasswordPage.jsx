import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8081/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) {
      setError('Vui lòng nhập email')
      return
    }
    setLoading(true)
    try {
      await axios.post(`${API_BASE}/auth/forgot-password`, { email: email.trim() })
      setSent(true)
    } catch {
      setError('Có lỗi xảy ra. Vui lòng thử lại.')
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
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                ✉️
              </div>
              <h2 className="text-white text-xl font-bold mb-2">Kiểm tra email của bạn</h2>
              <p className="text-gray-400 text-sm mb-6">
                Nếu địa chỉ <span className="text-white font-medium">{email}</span> tồn tại trong hệ thống,
                chúng tôi đã gửi link đặt lại mật khẩu. Link có hiệu lực trong <strong className="text-white">15 phút</strong>.
              </p>
              <p className="text-gray-500 text-xs mb-6">Không thấy email? Kiểm tra thư mục Spam hoặc thử lại.</p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="text-red-500 hover:text-red-400 text-sm transition-colors"
              >
                Thử lại với email khác
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-white text-2xl font-bold mb-2">Quên mật khẩu?</h2>
              <p className="text-gray-400 text-sm mb-6">
                Nhập email của bạn và chúng tôi sẽ gửi link để đặt lại mật khẩu.
              </p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1.5 block">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-red-500 transition-colors placeholder:text-gray-600"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-60 text-white font-semibold rounded-xl py-3 transition-colors"
                >
                  {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
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
