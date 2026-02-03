import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { login, reset } from '../redux/slices/authSlice'
import toast from 'react-hot-toast'
import { Film, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react'
import Fireworks from '../components/Fireworks'

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  )

  useEffect(() => {
    if (isError) {
      toast.error(message)
    }

    if (isSuccess || user) {
      navigate('/')
      toast.success('Đăng nhập thành công!')
    }

    dispatch(reset())
  }, [user, isError, isSuccess, message, navigate, dispatch])

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }))
  }

  const onSubmit = (e) => {
    e.preventDefault()
    dispatch(login(formData))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cinema-darker via-cinema-dark to-cinema-gray flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Fireworks Effect */}
      <Fireworks />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-cinema-red opacity-10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-cinema-gold opacity-10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        {/* Floating particles */}
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
                <Film className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <Sparkles className="w-5 h-5 text-cinema-gold animate-pulse" />
              <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-cinema-gold to-white bg-clip-text text-transparent animate-gradient">
                Chào mừng trở lại
              </h2>
              <Sparkles className="w-5 h-5 text-cinema-gold animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
            <p className="text-gray-400 text-sm">
              Đăng nhập để tiếp tục trải nghiệm điện ảnh
            </p>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-cinema-gray/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-cinema-gray-light">
          <form className="space-y-6" onSubmit={onSubmit}>
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Địa chỉ Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-cinema-gray-lighter border border-cinema-gray-light rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cinema-red focus:border-transparent transition-all duration-300"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={onChange}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-cinema-gray-lighter border border-cinema-gray-light rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cinema-red focus:border-transparent transition-all duration-300"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={onChange}
                />
              </div>
            </div>

            {/* Remember & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="w-4 h-4 bg-cinema-gray-lighter border-cinema-gray-light rounded text-cinema-red focus:ring-cinema-red focus:ring-2"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-400">
                  Ghi nhớ đăng nhập
                </label>
              </div>
              <Link to="/forgot-password" className="text-sm text-cinema-gold hover:text-cinema-gold-dark transition-colors">
                Quên mật khẩu?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg text-white font-medium bg-gradient-to-r from-cinema-red to-cinema-red-dark hover:from-cinema-red-dark hover:to-cinema-red focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cinema-red transition-all duration-300 shadow-lg shadow-cinema-red/50 hover:shadow-xl hover:shadow-cinema-red/60 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Chưa có tài khoản?{' '}
              <Link 
                to="/register" 
                className="text-cinema-gold hover:text-cinema-gold-dark font-medium transition-colors"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mt-8">
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
