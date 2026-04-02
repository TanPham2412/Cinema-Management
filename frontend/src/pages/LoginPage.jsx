import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setCredentials } from '../redux/slices/authSlice'
import api from '../services/api'
import toast from 'react-hot-toast'
import { Film, Mail, Lock, ArrowRight, Sparkles, ShieldCheck, ShieldX } from 'lucide-react'
import Fireworks from '../components/Fireworks'
import { R } from '../constants/roles'

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [step, setStep] = useState('login') // 'login' | '2fa' | 'locked'
  const [twoFactorEmail, setTwoFactorEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    if (user) {
      if (user.role === R.ADMIN) navigate('/d57')
      else if (user.role === R.STAFF) navigate('/d73')
      else navigate('/')
    }
  }, [user, navigate])

  const onChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleLoginSuccess = (token, userData) => {
    dispatch(setCredentials({ user: userData, token }))
    toast.success('Đăng nhập thành công!')
    if (userData.role === R.ADMIN) navigate('/d57')
    else if (userData.role === R.STAFF) navigate('/d73')
    else navigate('/')
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await api.post('/auth/login', formData)
      if (response.data.requiresTwoFactor) {
        setTwoFactorEmail(response.data.email)
        setStep('2fa')
      } else {
        handleLoginSuccess(response.data.token, response.data.user)
      }
    } catch (err) {
      if (err.response?.data?.locked) {
        setStep('locked')
        return
      }
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit2FA = async (e) => {
    e.preventDefault()
    if (otpCode.length !== 6) { toast.error('Vui lòng nhập đủ 6 chữ số'); return }
    setIsLoading(true)
    try {
      const response = await api.post('/auth/2fa/verify', { email: twoFactorEmail, code: otpCode })
      handleLoginSuccess(response.data.token, response.data.user)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mã xác thực không đúng')
      setOtpCode('')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cinema-darker via-cinema-dark to-cinema-gray flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Fireworks Effect */}
      <Fireworks />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-cinema-red opacity-10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-cinema-gold opacity-10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cinema-gold rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-cinema-red rounded-full animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-cinema-gold rounded-full animate-ping" style={{ animationDuration: '5s', animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Logo & Title */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-cinema-red blur-2xl opacity-50 animate-pulse"></div>
              <div className="relative p-4 bg-gradient-to-br from-cinema-red to-cinema-red-dark rounded-2xl shadow-2xl shadow-cinema-red/50">
                {step === 'locked' ? <ShieldX className="w-12 h-12 text-white" /> : step === '2fa' ? <ShieldCheck className="w-12 h-12 text-white" /> : <Film className="w-12 h-12 text-white" />}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <Sparkles className="w-5 h-5 text-cinema-gold animate-pulse" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-cinema-gold to-white bg-clip-text text-transparent animate-gradient">
                {step === 'locked' ? 'Tài khoản bị khóa' : step === '2fa' ? 'Xác thực 2 lớp' : 'Chào mừng trở lại'}
              </h2>
              <Sparkles className="w-5 h-5 text-cinema-gold animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
            <p className="text-gray-400 text-sm">
              {step === 'locked'
                ? 'Tài khoản này đã bị khóa bởi quản trị viên'
                : step === '2fa'
                ? 'Nhập mã 6 chữ số từ ứng dụng Google Authenticator'
                : 'Đăng nhập để tiếp tục trải nghiệm điện ảnh'}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-cinema-gray/50 backdrop-blur-xl rounded-2xl shadow-2xl p-5 sm:p-8 border border-cinema-gray-light">
          {step === 'locked' ? (
            /* Locked Account Screen */
            <div className="flex flex-col items-center text-center space-y-6 py-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/50">
                <ShieldX className="w-10 h-10 text-red-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-red-400">Tài khoản bị khóa</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Tài khoản của bạn đã bị khóa bởi quản trị viên.
                  <br />Vui lòng liên hệ hỗ trợ để được giải quyết.
                </p>
              </div>
              <div className="w-full pt-2">
                <button
                  type="button"
                  onClick={() => { setStep('login'); setFormData({ email: '', password: '' }) }}
                  className="w-full flex items-center justify-center py-3 px-4 border border-cinema-gray-light rounded-lg text-white font-medium bg-white/5 hover:bg-white/10 transition-all duration-300">
                  ← Quay lại đăng nhập
                </button>
              </div>
            </div>
          ) : step === 'login' ? (
            <form className="space-y-6" onSubmit={onSubmit}>
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Địa chỉ Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input id="email" name="email" type="email" required
                    className="w-full pl-11 pr-4 py-3 bg-cinema-gray-lighter border border-cinema-gray-light rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cinema-red focus:border-transparent transition-all duration-300"
                    placeholder="your@email.com" value={formData.email} onChange={onChange} />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input id="password" name="password" type="password" required
                    className="w-full pl-11 pr-4 py-3 bg-cinema-gray-lighter border border-cinema-gray-light rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cinema-red focus:border-transparent transition-all duration-300"
                    placeholder="••••••••" value={formData.password} onChange={onChange} />
                </div>
              </div>

              {/* Remember & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input id="remember" type="checkbox" className="w-4 h-4 bg-cinema-gray-lighter border-cinema-gray-light rounded text-cinema-red focus:ring-cinema-red focus:ring-2" />
                  <label htmlFor="remember" className="ml-2 text-sm text-gray-400">Ghi nhớ đăng nhập</label>
                </div>
                <Link to="/forgot-password" className="text-sm text-cinema-gold hover:text-cinema-gold-dark transition-colors">Quên mật khẩu?</Link>
              </div>

              {/* Submit Button */}
              <button type="submit" disabled={isLoading}
                className="group relative w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg text-white font-medium bg-gradient-to-r from-cinema-red to-cinema-red-dark hover:from-cinema-red-dark hover:to-cinema-red focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cinema-red transition-all duration-300 shadow-lg shadow-cinema-red/50 hover:shadow-xl hover:shadow-cinema-red/60 disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (<><span>Đăng nhập</span><ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" /></>)}
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-cinema-gray-light"></div></div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-cinema-gray/50 text-gray-400">Hoặc đăng nhập với</span>
                </div>
              </div>

              {/* Google Login Button */}
              <a href="https://api.plvcinema.xyz/api/oauth2/authorization/google"
                className="w-full flex items-center justify-center py-3 px-4 border border-cinema-gray-light rounded-lg text-white font-medium bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all duration-300 group">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="group-hover:text-cinema-gold transition-colors">Đăng nhập với Google</span>
              </a>
            </form>
          ) : (
            /* 2FA Step */
            <form className="space-y-6" onSubmit={onSubmit2FA}>
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cinema-red/20 border border-cinema-red/40 mb-3">
                  <ShieldCheck className="w-8 h-8 text-cinema-red" />
                </div>
                <p className="text-gray-300 text-sm">Mở ứng dụng <strong className="text-white">Google Authenticator</strong> và nhập mã 6 chữ số cho tài khoản <strong className="text-cinema-gold">{twoFactorEmail}</strong></p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Mã xác thực</label>
                <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} autoFocus
                  className="w-full px-4 py-4 bg-cinema-gray-lighter border border-cinema-gray-light rounded-lg text-white text-center text-xl sm:text-2xl tracking-[0.3em] sm:tracking-[0.5em] font-mono placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-cinema-red focus:border-transparent"
                  placeholder="000000" value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
              </div>
              <button type="submit" disabled={isLoading || otpCode.length !== 6}
                className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg text-white font-medium bg-gradient-to-r from-cinema-red to-cinema-red-dark hover:from-cinema-red-dark hover:to-cinema-red transition-all duration-300 shadow-lg shadow-cinema-red/50 disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Xác nhận'}
              </button>
              <button type="button" onClick={() => { setStep('login'); setOtpCode('') }}
                className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors">
                ← Quay lại đăng nhập
              </button>
            </form>
          )}

          {/* Register Link */}
          {step === 'login' && (
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">Chưa có tài khoản?{' '}
                <Link to="/register" className="text-cinema-gold hover:text-cinema-gold-dark font-medium transition-colors">Đăng ký ngay</Link>
              </p>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mt-8 mb-12">
          <div className="text-center">
            <div className="text-cinema-gold text-2xl font-bold mb-1">100+</div>
            <div className="text-gray-500 text-xs">Bộ phim</div>
          </div>
          <div className="text-center">
            <div className="text-cinema-gold text-2xl font-bold mb-1">50+</div>
            <div className="text-gray-500 text-xs">Rạp chiếu</div>
          </div>
          <div className="text-center">
            <div className="text-cinema-gold text-2xl font-bold mb-1">1M+</div>
            <div className="text-gray-500 text-xs">Thành viên</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
