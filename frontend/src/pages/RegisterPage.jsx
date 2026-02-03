import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { register, reset } from '../redux/slices/authSlice'
import toast from 'react-hot-toast'
import { Film, Mail, Lock, User, Phone, ArrowRight, CheckCircle, Sparkles } from 'lucide-react'
import Fireworks from '../components/Fireworks'

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
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
      toast.success('Đăng ký thành công!')
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

    if (formData.password !== formData.confirmPassword) {
      toast.error('Mật khẩu không khớp!')
      return
    }

    const userData = {
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      phoneNumber: formData.phoneNumber,
    }

    dispatch(register(userData))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cinema-darker via-cinema-dark to-cinema-gray flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      {/* Fireworks Effect */}
      <Fireworks />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-cinema-red opacity-10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-cinema-gold opacity-10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute w-64 h-64 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cinema-red opacity-5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cinema-gold rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-cinema-red rounded-full animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-cinema-gold rounded-full animate-ping" style={{ animationDuration: '5s', animationDelay: '2s' }}></div>
        <div className="absolute top-2/3 right-1/4 w-2 h-2 bg-cinema-red rounded-full animate-ping" style={{ animationDuration: '6s', animationDelay: '3s' }}></div>
      </div>

      <div className="max-w-2xl w-full relative z-10">
        {/* Logo & Title */}
        <div className="text-center mb-8">
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
              <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-cinema-gold to-white bg-clip-text text-transparent">
                Tạo tài khoản mới
              </h2>
              <Sparkles className="w-5 h-5 text-cinema-gold animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
            <p className="text-gray-400 text-sm">
              Tham gia cộng đồng yêu điện ảnh cùng hàng triệu thành viên
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Benefits Section */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-cinema-gray/50 backdrop-blur-xl rounded-xl p-4 border border-cinema-gray-light">
              <CheckCircle className="w-8 h-8 text-cinema-gold mb-3" />
              <h3 className="text-white font-semibold mb-2">Đặt vé nhanh chóng</h3>
              <p className="text-gray-400 text-sm">Đặt vé online tiện lợi, chọn ghế theo ý thích</p>
            </div>
            <div className="bg-cinema-gray/50 backdrop-blur-xl rounded-xl p-4 border border-cinema-gray-light">
              <CheckCircle className="w-8 h-8 text-cinema-gold mb-3" />
              <h3 className="text-white font-semibold mb-2">Ưu đãi độc quyền</h3>
              <p className="text-gray-400 text-sm">Nhận voucher, giảm giá dành riêng cho thành viên</p>
            </div>
            <div className="bg-cinema-gray/50 backdrop-blur-xl rounded-xl p-4 border border-cinema-gray-light">
              <CheckCircle className="w-8 h-8 text-cinema-gold mb-3" />
              <h3 className="text-white font-semibold mb-2">Tích điểm thưởng</h3>
              <p className="text-gray-400 text-sm">Đổi điểm lấy vé xem phim miễn phí</p>
            </div>
          </div>

          {/* Registration Form */}
          <div className="lg:col-span-2 bg-cinema-gray/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-cinema-gray-light">
            <form className="space-y-5" onSubmit={onSubmit}>
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                  Họ và tên
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-cinema-gray-lighter border border-cinema-gray-light rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cinema-gold focus:border-transparent transition-all duration-300"
                    placeholder="Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={onChange}
                  />
                </div>
              </div>

              {/* Email */}
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
                    className="w-full pl-11 pr-4 py-3 bg-cinema-gray-lighter border border-cinema-gray-light rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cinema-gold focus:border-transparent transition-all duration-300"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={onChange}
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300 mb-2">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    className="w-full pl-11 pr-4 py-3 bg-cinema-gray-lighter border border-cinema-gray-light rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cinema-gold focus:border-transparent transition-all duration-300"
                    placeholder="0123456789"
                    value={formData.phoneNumber}
                    onChange={onChange}
                  />
                </div>
              </div>

              {/* Password */}
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
                    className="w-full pl-11 pr-4 py-3 bg-cinema-gray-lighter border border-cinema-gray-light rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cinema-gold focus:border-transparent transition-all duration-300"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={onChange}
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-cinema-gray-lighter border border-cinema-gray-light rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cinema-gold focus:border-transparent transition-all duration-300"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={onChange}
                  />
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  className="w-4 h-4 mt-1 bg-cinema-gray-lighter border-cinema-gray-light rounded text-cinema-gold focus:ring-cinema-gold focus:ring-2"
                />
                <label htmlFor="terms" className="ml-2 text-sm text-gray-400">
                  Tôi đồng ý với{' '}
                  <Link to="/terms" className="text-cinema-gold hover:text-cinema-gold-dark">
                    Điều khoản sử dụng
                  </Link>
                  {' '}và{' '}
                  <Link to="/privacy" className="text-cinema-gold hover:text-cinema-gold-dark">
                    Chính sách bảo mật
                  </Link>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg text-white font-medium bg-gradient-to-r from-cinema-gold to-cinema-gold-dark hover:from-cinema-gold-dark hover:to-cinema-gold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cinema-gold transition-all duration-300 shadow-lg shadow-cinema-gold/50 hover:shadow-xl hover:shadow-cinema-gold/60 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Đăng ký tài khoản</span>
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Đã có tài khoản?{' '}
                <Link 
                  to="/login" 
                  className="text-cinema-red hover:text-cinema-red-dark font-medium transition-colors"
                >
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
