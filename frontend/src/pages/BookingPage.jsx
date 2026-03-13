const BookingPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Đặt vé</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Chọn ghế</h2>
            <div className="text-center text-gray-500">
              Sơ đồ ghế sẽ hiển thị ở đây
            </div>
          </div>
        </div>
        <div>
          <div className="card sticky top-20">
            <h2 className="text-xl font-semibold mb-4">Thông tin đặt vé</h2>
            <div className="text-gray-500">
              Thông tin đặt vé sẽ hiển thị ở đây
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingPage
