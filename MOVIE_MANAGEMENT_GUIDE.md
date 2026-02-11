# Hướng Dẫn Sử Dụng Chức Năng Quản Lý Phim

## Tổng Quan

Hệ thống quản lý phim đã được implement hoàn chỉnh với các tính năng:
- ✅ CRUD phim (Create, Read, Update, Delete)
- ✅ Quản lý thể loại phim (many-to-many relationship)
- ✅ Upload poster và banner
- ✅ Search và filter phim
- ✅ Admin dashboard
- ✅ Role-based access control (chỉ ADMIN mới có quyền)

## Backend Architecture

### 1. Entities

**Movie.java** - Entity chính
- `id`: Long (PK)
- `title`: String (Tên phim)
- `description`: TEXT (Mô tả)
- `director`: String (Đạo diễn)
- `cast`: String (Diễn viên)
- `duration`: Integer (Thời lượng phút)
- `genres`: Set<Genre> (Many-to-Many với Genre)
- `language`: String (Ngôn ngữ)
- `country`: String (Quốc gia)
- `releaseDate`: LocalDate (Ngày phát hành)
- `posterUrl`: String (URL poster)
- `trailerUrl`: String (URL trailer)
- `bannerUrl`: String (URL banner)
- `rating`: Double (Đánh giá 0-10)
- `ageRating`: String (P, K, T13, T16, T18, C)
- `status`: Enum (NOW_SHOWING, COMING_SOON, ENDED)
- `createdAt`: LocalDateTime (Auto)
- `updatedAt`: LocalDateTime (Auto)

**Genre.java** - Entity thể loại
- `id`: Long (PK)
- `name`: String (Tên thể loại - unique)
- `description`: TEXT (Mô tả)
- `slug`: String (URL-friendly name)
- `movies`: Set<Movie> (Many-to-Many với Movie)

### 2. DTOs

- **MovieRequestDTO**: Dùng cho create/update movie
- **MovieResponseDTO**: Dùng cho response data
- **MovieSearchDTO**: Dùng cho search/filter
- **GenreDTO**: Dùng cho genre data

### 3. Repositories

**MovieRepository**:
- Extends JpaRepository và JpaSpecificationExecutor
- Custom queries: search, filter by genre, status, rating, date range
- Methods: `findNowShowingMovies()`, `findUpcomingMovies()`, `findTopRatedMovies()`

**GenreRepository**:
- Basic CRUD operations
- `findByName()`, `findBySlug()`, `existsByName()`

### 4. Services

**MovieService**:
- `getAllMovies()`: Pagination support
- `getMovieById()`: Get single movie
- `searchMovies()`: Dynamic search với Specification
- `createMovie()`: Validate và create
- `updateMovie()`: Update existing movie
- `deleteMovie()`: Soft check screenings trước khi xóa
- `getNowShowingMovies()`, `getUpcomingMovies()`, `getTopRatedMovies()`

**GenreService**:
- CRUD operations
- Auto-generate slug từ name (Vietnamese-friendly)
- Validate không xóa genre đang được dùng

**FileStorageService**:
- `storeFile()`: Upload file với validation
- `deleteFile()`: Xóa file
- Support: jpg, jpeg, png, gif, webp
- Max size: 10MB

### 5. Controllers

**MovieController** (`/api/movies`):

Public endpoints:
- `GET /movies` - Danh sách phim (pagination)
- `GET /movies/{id}` - Chi tiết phim
- `GET /movies/search` - Search với nhiều filter
- `GET /movies/now-showing` - Phim đang chiếu
- `GET /movies/upcoming` - Phim sắp chiếu
- `GET /movies/top-rated` - Phim rating cao

Admin only endpoints:
- `POST /movies` - Tạo phim mới
- `PUT /movies/{id}` - Cập nhật phim
- `DELETE /movies/{id}` - Xóa phim
- `POST /movies/upload-poster` - Upload poster
- `POST /movies/upload-banner` - Upload banner

**GenreController** (`/api/genres`):
- `GET /genres` - Public: Danh sách thể loại
- `GET /genres/{id}` - Public: Chi tiết thể loại
- `POST /genres` - Admin: Tạo thể loại
- `PUT /genres/{id}` - Admin: Cập nhật
- `DELETE /genres/{id}` - Admin: Xóa

### 6. Security Configuration

- Public access: `/movies/**`, `/genres`, `/uploads/**`
- Admin only: All POST/PUT/DELETE operations
- JWT authentication required for admin operations
- CORS enabled for localhost:3000, localhost:5173

## Frontend Architecture

### 1. Services

**movieService.js**:
```javascript
- getMovies(params)
- getMovieById(id)
- searchMovies(searchParams)
- getNowShowing()
- getComingSoon()
- getTopRated()
- createMovie(movieData)      // Admin
- updateMovie(id, movieData)   // Admin
- deleteMovie(id)              // Admin
- uploadPoster(file)           // Admin
- uploadBanner(file)           // Admin
```

**genreService.js**:
```javascript
- getAllGenres()
- getGenreById(id)
- createGenre(genreData)       // Admin
- updateGenre(id, genreData)   // Admin
- deleteGenre(id)              // Admin
```

### 2. Admin Pages

**MovieManagement.jsx** (`/admin/movies`):
Features:
- Table view với poster thumbnails
- Search bar (tìm theo tên, đạo diễn, diễn viên)
- Filter by status (NOW_SHOWING, COMING_SOON, ENDED)
- Create/Edit modal với:
  - Upload poster và banner (preview)
  - Multi-select genres (checkbox style)
  - Full form validation
  - Date picker cho release date
  - Rating input (0-10)
  - Age rating dropdown
- Delete với confirmation
- Responsive design

**GenreManagement.jsx** (`/admin/genres`):
Features:
- Card grid layout
- Create/Edit modal
- Auto-generate slug từ Vietnamese name
- Validation không xóa genre đang dùng
- Display movies count per genre

**AdminDashboard.jsx** (`/admin`):
Features:
- Stats cards (revenue, tickets, movies, cinemas)
- Menu grid với icons
- Quick navigation to all management pages
- Beautiful gradient design

### 3. Routes

```javascript
/admin                    - Dashboard (ADMIN only)
/admin/movies            - Movie Management (ADMIN only)
/admin/genres            - Genre Management (ADMIN only)
```

## Cách Sử Dụng

### 1. Start Backend

```bash
cd cinema-management/cinema-management
mvn spring-boot:run
```

Backend sẽ chạy trên: `http://localhost:8081/api`

### 2. Start Frontend

```bash
cd cinema-management/frontend
npm run dev
```

Frontend sẽ chạy trên: `http://localhost:3000`

### 3. Đăng Nhập Admin

1. Truy cập: `http://localhost:3000/login`
2. Đăng nhập với tài khoản ADMIN (cần tạo user với role ADMIN trong database)
3. Click "Dashboard" ở header

### 4. Thêm Thể Loại (Bắt Buộc Trước)

1. Từ Admin Dashboard, click "Quản lý Thể loại"
2. Click "Thêm thể loại"
3. Nhập:
   - Tên thể loại: "Hành động"
   - Mô tả: "Phim hành động gay cấn"
4. Slug tự động generate: "hanh-dong"
5. Click "Thêm"

Thêm các thể loại khác: Tình cảm, Kinh dị, Hài, Phiêu lưu, Khoa học viễn tưởng...

### 5. Thêm Phim

1. Từ Admin Dashboard, click "Quản lý Phim"
2. Click "Thêm phim"
3. Upload Poster:
   - Click vào khung "Upload Poster"
   - Chọn file ảnh (JPG/PNG, max 10MB)
   - Preview hiển thị ngay
4. Upload Banner (Optional):
   - Click vào khung "Upload Banner"
   - Chọn file ảnh
5. Điền thông tin:
   - **Tên phim**: "Avatar: The Way of Water" ⭐
   - **Mô tả**: Mô tả chi tiết về phim ⭐
   - **Đạo diễn**: "James Cameron" ⭐
   - **Diễn viên**: "Sam Worthington, Zoe Saldana" ⭐
   - **Thời lượng**: 192 phút ⭐
   - **Ngày phát hành**: 2022-12-16 ⭐
   - **Ngôn ngữ**: "Tiếng Anh" ⭐
   - **Quốc gia**: "Mỹ" ⭐
   - **Đánh giá**: 8.5
   - **Phân loại tuổi**: T13
   - **Trạng thái**: Đang chiếu ⭐
   - **Trailer URL**: https://youtube.com/...
6. Chọn thể loại (có thể chọn nhiều):
   - Click vào "Hành động", "Phiêu lưu", "Khoa học viễn tưởng"
   - Các thể loại đã chọn sẽ highlight đỏ
7. Click "Thêm phim"

⭐ = Bắt buộc

### 6. Sửa Phim

1. Trong table danh sách phim, click icon ✏️ (Pencil)
2. Modal mở với data đã filled
3. Chỉnh sửa bất kỳ field nào
4. Upload poster/banner mới nếu muốn
5. Click "Cập nhật"

### 7. Xóa Phim

1. Click icon 🗑️ (Trash) 
2. Confirm dialog hiện lên
3. Click "OK" để xóa
4. **Lưu ý**: Không thể xóa phim đang có suất chiếu

### 8. Search và Filter

**Search bar**:
- Nhập tên phim, đạo diễn, hoặc diễn viên
- Enter hoặc click "Tìm kiếm"

**Filter by status**:
- Dropdown: Chọn "Đang chiếu", "Sắp chiếu", "Đã kết thúc"
- Click "Tìm kiếm"

**Reset**:
- Xóa keyword và chọn "Tất cả trạng thái"
- Click "Tìm kiếm"

## API Testing với Postman

### 1. Get All Movies
```
GET http://localhost:8081/api/movies?page=0&size=10&sortBy=releaseDate&sortDirection=DESC
```

### 2. Search Movies
```
GET http://localhost:8081/api/movies/search?keyword=avatar&status=NOW_SHOWING&genreId=1&minRating=8.0
```

### 3. Create Movie (Admin)
```
POST http://localhost:8081/api/movies
Headers:
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json

Body:
{
  "title": "Avatar: The Way of Water",
  "description": "Jake Sully lives with his newfound family...",
  "director": "James Cameron",
  "cast": "Sam Worthington, Zoe Saldana, Sigourney Weaver",
  "duration": 192,
  "genreIds": [1, 3, 5],
  "language": "Tiếng Anh",
  "country": "Mỹ",
  "releaseDate": "2022-12-16",
  "posterUrl": "/uploads/movies/posters/abc123.jpg",
  "trailerUrl": "https://www.youtube.com/watch?v=d9MyW72ELq0",
  "bannerUrl": "/uploads/movies/banners/def456.jpg",
  "rating": 8.5,
  "ageRating": "T13",
  "status": "NOW_SHOWING"
}
```

### 4. Upload Poster (Admin)
```
POST http://localhost:8081/api/movies/upload-poster
Headers:
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: multipart/form-data

Body (form-data):
  file: <select image file>
```

Response:
```json
{
  "url": "/uploads/movies/posters/uuid-filename.jpg"
}
```

## Database Schema

### Table: movies
```sql
CREATE TABLE movies (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  director VARCHAR(255),
  cast VARCHAR(255),
  duration INT,
  language VARCHAR(100),
  country VARCHAR(100),
  release_date DATE NOT NULL,
  poster_url VARCHAR(500),
  trailer_url VARCHAR(500),
  banner_url VARCHAR(500),
  rating DOUBLE,
  age_rating VARCHAR(10),
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Table: genres
```sql
CREATE TABLE genres (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  slug VARCHAR(100)
);
```

### Table: movie_genres (Join Table)
```sql
CREATE TABLE movie_genres (
  movie_id BIGINT,
  genre_id BIGINT,
  PRIMARY KEY (movie_id, genre_id),
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
);
```

## Tính Năng Đã Implement

### Backend ✅
- [x] Movie entity với many-to-many Genre
- [x] Genre entity
- [x] DTOs (Request, Response, Search)
- [x] Repositories với custom queries
- [x] Services với business logic
- [x] Controllers với REST APIs
- [x] File upload service (local storage)
- [x] Security configuration
- [x] Validation
- [x] Error handling

### Frontend ✅
- [x] Movie Management page
- [x] Genre Management page
- [x] Admin Dashboard
- [x] Services (movieService, genreService)
- [x] Routes configuration
- [x] File upload với preview
- [x] Search và filter
- [x] CRUD operations
- [x] Responsive design
- [x] Cinema theme UI

## Các Tính Năng Có Thể Mở Rộng

1. **Cloud Storage**: Migrate từ local storage sang AWS S3 hoặc Cloudinary
2. **Image Optimization**: Resize và compress images tự động
3. **Batch Operations**: Bulk delete, bulk update status
4. **Export/Import**: Export danh sách phim ra Excel/CSV
5. **Version History**: Track changes của movie data
6. **Draft Mode**: Lưu phim dạng draft trước khi publish
7. **Scheduling**: Tự động chuyển status dựa trên releaseDate
8. **Analytics**: Xem thống kê views, bookings per movie
9. **Reviews**: Cho phép users review movies
10. **Recommendations**: Gợi ý phim dựa trên genres

## Troubleshooting

### Backend không start:
```
Error: Table 'cinema_management.movies' doesn't exist
```
Solution: Đổi `spring.jpa.hibernate.ddl-auto=update` thành `create` lần đầu, sau đó đổi lại `update`

### File upload failed:
```
Error: Could not store file
```
Solution: Kiểm tra permissions của folder `uploads/movies`

### Cannot delete movie:
```
Error: Không thể xóa phim đang có suất chiếu
```
Solution: Xóa tất cả screenings của phim trước

### Cannot delete genre:
```
Error: Không thể xóa thể loại đang được sử dụng
```
Solution: Remove genre từ tất cả movies trước

## Liên Hệ

Nếu có lỗi hoặc câu hỏi, vui lòng tạo issue hoặc liên hệ team.
