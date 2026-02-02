const HomePage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-12">
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white rounded-lg p-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Chào mừng đến CinemaChain
          </h1>
          <p className="text-xl mb-6">
            Đặt vé xem phim online nhanh chóng và tiện lợi
          </p>
          <a href="/movies" className="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Xem phim ngay
          </a>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6">Phim đang chiếu</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Movie cards will be loaded here */}
          <div className="text-center text-gray-500 col-span-full">
            Đang tải phim...
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold mb-6">Phim sắp chiếu</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Coming soon movies will be loaded here */}
          <div className="text-center text-gray-500 col-span-full">
            Đang tải phim...
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
