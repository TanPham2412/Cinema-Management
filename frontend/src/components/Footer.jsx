import { Film, Mail, Phone, MapPin, Facebook, Instagram, Youtube } from 'lucide-react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-cinema-dark to-cinema-darker border-t border-cinema-gray-light">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-cinema-red to-cinema-red-dark rounded-xl shadow-lg shadow-cinema-red/50">
                <Film className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-cinema-red to-cinema-gold bg-clip-text text-transparent">
                PLVCinema
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Hệ thống rạp chiếu phim hiện đại, mang đến trải nghiệm điện ảnh đẳng cấp quốc tế
            </p>
            <div className="flex space-x-3">
              <a href="#" className="w-10 h-10 rounded-full bg-cinema-gray-light hover:bg-cinema-red flex items-center justify-center transition-colors duration-300 group">
                <Facebook className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-cinema-gray-light hover:bg-cinema-red flex items-center justify-center transition-colors duration-300 group">
                <Instagram className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-cinema-gray-light hover:bg-cinema-red flex items-center justify-center transition-colors duration-300 group">
                <Youtube className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4 relative inline-block">
              Liên kết nhanh
              <div className="absolute -bottom-2 left-0 w-12 h-1 bg-gradient-to-r from-cinema-red to-cinema-gold rounded-full"></div>
            </h4>
            <ul className="space-y-3 text-sm mt-6">
              <li>
                <Link to="/" className="text-gray-400 hover:text-cinema-gold transition-colors flex items-center space-x-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-cinema-red group-hover:bg-cinema-gold transition-colors"></span>
                  <span>Trang chủ</span>
                </Link>
              </li>
              <li>
                <Link to="/movies" className="text-gray-400 hover:text-cinema-gold transition-colors flex items-center space-x-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-cinema-red group-hover:bg-cinema-gold transition-colors"></span>
                  <span>Phim đang chiếu</span>
                </Link>
              </li>
              <li>
                <Link to="/cinemas" className="text-gray-400 hover:text-cinema-gold transition-colors flex items-center space-x-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-cinema-red group-hover:bg-cinema-gold transition-colors"></span>
                  <span>Hệ thống rạp</span>
                </Link>
              </li>
              <li>
                <Link to="/promotions" className="text-gray-400 hover:text-cinema-gold transition-colors flex items-center space-x-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-cinema-red group-hover:bg-cinema-gold transition-colors"></span>
                  <span>Ưu đãi</span>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4 relative inline-block">
              Hỗ trợ
              <div className="absolute -bottom-2 left-0 w-12 h-1 bg-gradient-to-r from-cinema-red to-cinema-gold rounded-full"></div>
            </h4>
            <ul className="space-y-3 text-sm mt-6">
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-cinema-gold transition-colors flex items-center space-x-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-cinema-red group-hover:bg-cinema-gold transition-colors"></span>
                  <span>Điều khoản sử dụng</span>
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-cinema-gold transition-colors flex items-center space-x-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-cinema-red group-hover:bg-cinema-gold transition-colors"></span>
                  <span>Chính sách bảo mật</span>
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-400 hover:text-cinema-gold transition-colors flex items-center space-x-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-cinema-red group-hover:bg-cinema-gold transition-colors"></span>
                  <span>Câu hỏi thường gặp</span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-cinema-gold transition-colors flex items-center space-x-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-cinema-red group-hover:bg-cinema-gold transition-colors"></span>
                  <span>Liên hệ</span>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4 relative inline-block">
              Liên hệ
              <div className="absolute -bottom-2 left-0 w-12 h-1 bg-gradient-to-r from-cinema-red to-cinema-gold rounded-full"></div>
            </h4>
            <ul className="space-y-4 text-sm mt-6">
              <li className="flex items-start space-x-3 text-gray-400">
                <Mail className="w-5 h-5 text-cinema-gold mt-0.5 flex-shrink-0" />
                <span>support@cinemachain.vn</span>
              </li>
              <li className="flex items-start space-x-3 text-gray-400">
                <Phone className="w-5 h-5 text-cinema-gold mt-0.5 flex-shrink-0" />
                <span>Hotline: 1900 xxxx</span>
              </li>
              <li className="flex items-start space-x-3 text-gray-400">
                <MapPin className="w-5 h-5 text-cinema-gold mt-0.5 flex-shrink-0" />
                <span>Hà Nội, Việt Nam</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-cinema-gray-light mt-12 pt-8">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500">
              &copy; 2026 <span className="text-cinema-gold font-medium">PLVCinema</span>. All rights reserved.
            </p>
            <p className="text-sm text-gray-500">
              Made with <span className="text-cinema-red">❤️</span> by <span className="text-cinema-gold font-medium">Nhóm 5</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
