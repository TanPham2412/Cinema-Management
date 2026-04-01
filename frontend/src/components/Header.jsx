import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../redux/slices/authSlice'
import { Film, User, LogOut, LayoutDashboard, Ticket, Home, Video, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'

const Header = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = () => {
    dispatch(logout())
    setIsMenuOpen(false)
    navigate('/login')
  }

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false)
  }, [navigate])

  // Prevent body scroll when menu open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isMenuOpen])

  return (
    <header className="bg-gradient-to-r from-cinema-darker via-cinema-dark to-cinema-darker backdrop-blur-lg border-b border-cinema-gray-light sticky top-0 z-50 shadow-xl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group" onClick={() => setIsMenuOpen(false)}>
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-cinema-red to-cinema-red-dark rounded-xl shadow-lg shadow-cinema-red/50 group-hover:shadow-cinema-red/70 transition-all duration-300">
              <Film className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cinema-red to-cinema-gold bg-clip-text text-transparent">
                LLMCinema
              </span>
              <div className="text-[10px] sm:text-xs text-gray-500 -mt-1">Premium Experience</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-cinema-gray-light rounded-lg transition-all duration-300 group"
            >
              <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Trang chủ</span>
            </Link>
            <Link
              to="/movies"
              className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-cinema-gray-light rounded-lg transition-all duration-300 group"
            >
              <Video className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Phim</span>
            </Link>
            <Link
              to="/cinemas"
              className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-cinema-gray-light rounded-lg transition-all duration-300 group"
            >
              <Ticket className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Rạp</span>
            </Link>
          </nav>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                {(user.role === 'ADMIN' || user.role === 'STAFF') && (
                  <Link
                    to={user.role === 'ADMIN' ? '/admin' : '/staff'}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-cinema-gold hover:bg-cinema-gray-light rounded-lg transition-all duration-300"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden lg:inline">Dashboard</span>
                  </Link>
                )}
                {(user.role === 'ADMIN' || user.role === 'STAFF') && (
                  <span className="hidden lg:flex items-center space-x-2 px-4 py-2 text-gray-500 cursor-default rounded-lg">
                    <User className="w-4 h-4" />
                    <span>{user.fullName}</span>
                  </span>
                )}
                {user.role !== 'ADMIN' && user.role !== 'STAFF' && (
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-cinema-gold hover:bg-cinema-gray-light rounded-lg transition-all duration-300"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden lg:inline">{user.fullName}</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-cinema-red hover:bg-cinema-gray-light rounded-lg transition-all duration-300"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:inline">Đăng xuất</span>
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="px-5 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link 
                  to="/register" 
                  className="px-5 py-2 bg-gradient-to-r from-cinema-red to-cinema-red-dark hover:from-cinema-red-dark hover:to-cinema-red text-white rounded-lg font-medium transition-all duration-300 shadow-lg shadow-cinema-red/50 hover:shadow-xl hover:shadow-cinema-red/60"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>

          {/* Mobile: action buttons + hamburger */}
          <div className="flex md:hidden items-center space-x-2">
            {!user && (
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="px-3 py-1.5 text-sm text-gray-300 hover:text-white transition-colors"
              >
                Đăng nhập
              </Link>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-300 hover:text-white hover:bg-cinema-gray-light rounded-lg transition-colors"
              aria-label="Menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-cinema-darker/95 backdrop-blur-lg overflow-y-auto">
          <nav className="container mx-auto px-4 py-6 space-y-1">
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-cinema-gray-light rounded-lg transition-all"
            >
              <Home className="w-5 h-5" />
              <span className="text-base font-medium">Trang chủ</span>
            </Link>
            <Link
              to="/movies"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-cinema-gray-light rounded-lg transition-all"
            >
              <Video className="w-5 h-5" />
              <span className="text-base font-medium">Phim</span>
            </Link>
            <Link
              to="/cinemas"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-cinema-gray-light rounded-lg transition-all"
            >
              <Ticket className="w-5 h-5" />
              <span className="text-base font-medium">Rạp</span>
            </Link>

            <div className="border-t border-cinema-gray-light my-4"></div>

            {user ? (
              <>
                {(user.role === 'ADMIN' || user.role === 'STAFF') && (
                  <Link
                    to={user.role === 'ADMIN' ? '/admin' : '/staff'}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-cinema-gold hover:bg-cinema-gray-light rounded-lg transition-all"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="text-base font-medium">Dashboard</span>
                  </Link>
                )}
                {user.role !== 'ADMIN' && user.role !== 'STAFF' && (
                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-cinema-gold hover:bg-cinema-gray-light rounded-lg transition-all"
                  >
                    <User className="w-5 h-5" />
                    <span className="text-base font-medium">{user.fullName}</span>
                  </Link>
                )}
                {(user.role === 'ADMIN' || user.role === 'STAFF') && (
                  <div className="flex items-center space-x-3 px-4 py-3 text-gray-500">
                    <User className="w-5 h-5" />
                    <span className="text-base">{user.fullName}</span>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-cinema-red hover:bg-cinema-gray-light rounded-lg transition-all w-full"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-base font-medium">Đăng xuất</span>
                </button>
              </>
            ) : (
              <div className="space-y-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center w-full px-4 py-3 text-gray-300 hover:text-white border border-cinema-gray-light rounded-lg transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-cinema-red to-cinema-red-dark text-white rounded-lg font-medium"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

export default Header
