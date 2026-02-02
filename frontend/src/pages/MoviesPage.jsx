const MoviesPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Danh sách phim</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div className="text-center text-gray-500 col-span-full">
          Đang tải danh sách phim...
        </div>
      </div>
    </div>
  )
}

export default MoviesPage
