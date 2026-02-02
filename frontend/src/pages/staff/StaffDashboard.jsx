const StaffDashboard = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Staff Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Bán vé tại quầy</h2>
          <button className="btn-primary w-full">Tạo đơn hàng mới</button>
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Soát vé</h2>
          <button className="btn-primary w-full">Quét mã QR</button>
        </div>
      </div>
    </div>
  )
}

export default StaffDashboard
