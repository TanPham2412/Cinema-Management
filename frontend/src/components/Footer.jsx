const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">CinemaChain</h3>
            <p className="text-gray-400 text-sm">
              Hệ thống quản lý chuỗi rạp chiếu phim hiện đại
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Liên kết</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="text-gray-400 hover:text-white">Trang chủ</a></li>
              <li><a href="/movies" className="text-gray-400 hover:text-white">Phim</a></li>
              <li><a href="/cinemas" className="text-gray-400 hover:text-white">Rạp</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-white">Điều khoản</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Chính sách</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">FAQ</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Liên hệ</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Email: support@cinemachain.com</li>
              <li>Hotline: 1900 xxxx</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm text-gray-400">
          <p>&copy; 2026 CinemaChain. All rights reserved. Nhóm 5</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
