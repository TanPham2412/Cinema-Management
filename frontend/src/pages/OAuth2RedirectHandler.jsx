import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setCredentials } from '../redux/slices/authSlice'
import { jwtDecode } from 'jwt-decode'
import toast from 'react-hot-toast'

const OAuth2RedirectHandler = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    const error = searchParams.get('error')

    if (error) {
      toast.error('Đăng nhập Google thất bại. Vui lòng thử lại!')
      navigate('/login')
      return
    }

    if (token) {
      try {
        // Decode token để lấy user info
        const decoded = jwtDecode(token)
        
        // Lưu token vào localStorage
        localStorage.setItem('token', token)
        
        // Set user info vào Redux store
        dispatch(setCredentials({
          user: {
            email: decoded.sub,
            fullName: decoded.name || decoded.sub,
            role: decoded.role || 'CUSTOMER'
          },
          token
        }))
        
        toast.success('Đăng nhập thành công!')
        navigate('/')
      } catch (error) {
        toast.error('Token không hợp lệ!')
        navigate('/login')
      }
    } else {
      navigate('/login')
    }
  }, [searchParams, navigate, dispatch])

  return (
    <div className="min-h-screen bg-gradient-to-br from-cinema-darker via-cinema-dark to-cinema-gray flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-cinema-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  )
}

export default OAuth2RedirectHandler
