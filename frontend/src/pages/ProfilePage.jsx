const ProfilePage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Trang cá nhân</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Thông tin tài khoản</h2>
          <div className="text-gray-500">Thông tin sẽ hiển thị ở đây</div>
        </div>
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Lịch sử đặt vé</h2>
            <div className="text-gray-500">Danh sách vé đã đặt sẽ hiển thị ở đây</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
