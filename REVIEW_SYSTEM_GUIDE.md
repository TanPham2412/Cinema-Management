# 🌟 REVIEW & RATING SYSTEM

## Tổng quan

Hệ thống đánh giá phim cho phép **USER** đánh giá phim từ **1-10 sao** và để lại nhận xét. Rating của phim được tính **tự động** dựa trên **trung bình** của tất cả đánh giá.

---

## 🏗️ Database Schema

### Table: `reviews`
```sql
CREATE TABLE reviews (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,                -- FK to users
    movie_id BIGINT NOT NULL,               -- FK to movies
    rating INT NOT NULL CHECK (1-10),       -- 1-10 stars
    comment TEXT,                           -- Optional review text
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    UNIQUE(user_id, movie_id)              -- One review per user per movie
);
```

### Relationships
- **User (1) → Reviews (N)**: Một user có thể đánh giá nhiều phim
- **Movie (1) ← Reviews (N)**: Một phim có nhiều đánh giá
- **Constraint**: Mỗi user chỉ được đánh giá 1 lần cho mỗi phim

---

## 🎯 Backend API

### 1. **GET** `/api/reviews/movie/{movieId}` (Public)
Lấy tất cả đánh giá của một phim

**Response:**
```json
[
  {
    "id": 1,
    "userId": 10,
    "userName": "Phạm Minh Tân",
    "movieId": 5,
    "rating": 9,
    "comment": "Phim hay quá!",
    "createdAt": "2024-12-01T10:30:00",
    "updatedAt": "2024-12-01T10:30:00"
  }
]
```

---

### 2. **GET** `/api/reviews/movie/{movieId}/my-review` (Authenticated)
Lấy đánh giá của user hiện tại cho phim này

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": 1,
  "userId": 10,
  "userName": "Phạm Minh Tân",
  "movieId": 5,
  "rating": 9,
  "comment": "Phim hay quá!",
  "createdAt": "2024-12-01T10:30:00",
  "updatedAt": "2024-12-01T10:30:00"
}
```

---

### 3. **POST** `/api/reviews/movie/{movieId}` (Authenticated)
Tạo đánh giá mới

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "rating": 9,
  "comment": "Phim hay quá!"
}
```

**Validation:**
- `rating`: Required, 1-10
- `comment`: Optional, max 1000 ký tự

**Response:** ReviewResponseDTO

**Error Cases:**
- `400`: User đã đánh giá phim này rồi
- `404`: Movie không tồn tại

---

### 4. **PUT** `/api/reviews/{reviewId}` (Authenticated)
Cập nhật đánh giá của user

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "rating": 10,
  "comment": "Phim quá xuất sắc!"
}
```

**Response:** ReviewResponseDTO

**Error Cases:**
- `403`: User không có quyền sửa review này
- `404`: Review không tồn tại

---

### 5. **DELETE** `/api/reviews/{reviewId}` (Authenticated)
Xóa đánh giá của user

**Headers:** `Authorization: Bearer <token>`

**Response:** 204 No Content

**Error Cases:**
- `403`: User không có quyền xóa review này
- `404`: Review không tồn tại

---

### 6. **GET** `/api/reviews/my-reviews` (Authenticated)
Lấy tất cả đánh giá của user hiện tại

**Headers:** `Authorization: Bearer <token>`

**Response:** List<ReviewResponseDTO>

---

## 🔄 Automatic Rating Calculation

### Flow
1. User tạo/sửa/xóa review
2. Service tự động gọi `updateMovieRating(movieId)`
3. Calculate average: `SELECT AVG(rating) FROM reviews WHERE movie_id = ?`
4. Update Movie entity: `movie.setRating(average)`
5. Save movie với rating mới

### Example
```
Movie: "Avengers Endgame"
Reviews:
- User A: 10 sao
- User B: 9 sao
- User C: 8 sao

Average = (10 + 9 + 8) / 3 = 9.0
Movie.rating = 9.0
```

---

## 🎨 Frontend Components

### 1. **MovieReviews.jsx**
Component hiển thị reviews và form đánh giá

**Features:**
- ⭐ **Star Rating**: 10 sao interactive
- 📝 **Comment Form**: Textarea với character counter
- ✏️ **Edit/Delete**: User có thể sửa/xóa review của mình
- 📋 **Reviews List**: Hiển thị tất cả reviews theo thời gian
- 🔒 **Login Check**: Show login prompt nếu chưa đăng nhập

**Usage:**
```jsx
import MovieReviews from '../components/MovieReviews';

<MovieReviews movieId={movie.id} />
```

---

### 2. **MovieDetail.jsx**
Trang chi tiết phim có tích hợp reviews

**URL:** `/movies/:id`

**Sections:**
- Banner + Poster
- Movie Info (title, rating, genres, etc.)
- Description
- Cast & Crew
- Trailer
- **Reviews** (MovieReviews component)

---

## 🔐 Security

### Authentication
- JWT token trong `Authorization: Bearer <token>`
- User chỉ sửa/xóa được review của mình
- Admin không có quyền đặc biệt với reviews

### Validation
- Rating: 1-10 (enforced by DB constraint + DTO validation)
- Comment: Max 1000 characters
- One review per user per movie (DB unique constraint)

---

## 📊 Admin View

### Movie Management
- **Rating column** hiển thị rating từ user reviews
- Tooltip: "Đánh giá từ người dùng"
- Display: `rating.toFixed(1)` hoặc "Chưa có"
- **Admin KHÔNG nhập rating** nữa (field đã xóa khỏi form)

---

## 🧪 Testing Flow

### 1. Create Review
```bash
POST /api/reviews/movie/1
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "rating": 9,
  "comment": "Phim hay!"
}
```

### 2. Check Movie Rating
```bash
GET /api/movies/1

Response:
{
  "id": 1,
  "title": "Test Movie",
  "rating": 9.0,  # Auto-calculated
  ...
}
```

### 3. Update Review
```bash
PUT /api/reviews/1
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "rating": 10,
  "comment": "Phim xuất sắc!"
}
```

### 4. Check Updated Rating
```bash
GET /api/movies/1

Response:
{
  "id": 1,
  "title": "Test Movie",
  "rating": 10.0,  # Updated
  ...
}
```

---

## 🎯 User Flow

### Desktop Flow
1. User vào trang `/movies/1` (Movie Detail)
2. Scroll xuống section "Đánh giá phim"
3. Nếu chưa login → Show "Vui lòng đăng nhập để đánh giá"
4. Nếu đã login:
   - Chưa review → Show form với 10 sao + textarea
   - Đã review → Show review của mình với nút Edit/Delete
5. Click sao để rate → Nhập comment → "Gửi đánh giá"
6. Review được tạo → Movie rating tự động update
7. Scroll down xem tất cả reviews

### Mobile Flow
Same as desktop, responsive design

---

## 📝 Key Features

✅ **User-Generated Ratings**: Rating từ users, không phải admin  
✅ **One Review Per User**: Mỗi user chỉ review 1 lần/phim  
✅ **Edit/Delete**: User có thể sửa/xóa review  
✅ **Auto-Calculate**: Rating tự động tính trung bình  
✅ **Real-time Update**: Rating update ngay khi review thay đổi  
✅ **Comment Optional**: User có thể rate không cần comment  
✅ **10-Star System**: 1-10 sao thay vì 5 sao  
✅ **Responsive UI**: Beautiful star rating component  

---

## 🚀 Deployment Checklist

- [x] Create Review entity
- [x] Create ReviewRepository with custom queries
- [x] Create ReviewService with auto-rating logic
- [x] Create ReviewController with all endpoints
- [x] Update SecurityConfig for review endpoints
- [x] Create ReviewRequestDTO & ReviewResponseDTO
- [x] Remove rating field from MovieRequestDTO
- [x] Update MovieManagement.jsx (remove rating input)
- [x] Create reviewService.js (frontend)
- [x] Create MovieReviews.jsx component
- [x] Create MovieDetail.jsx page
- [x] Create database migration V2__create_reviews_table.sql
- [x] Update Movie entity relationship (if needed)

---

## 🐛 Troubleshooting

### Issue: "User đã đánh giá phim này"
**Cause:** UNIQUE constraint (user_id, movie_id)  
**Solution:** User phải UPDATE review cũ, không tạo mới

### Issue: Rating không update
**Cause:** Transaction rollback hoặc cache  
**Solution:** Check ReviewService.updateMovieRating() được gọi trong @Transactional

### Issue: 401 Unauthorized khi POST review
**Cause:** JWT token missing hoặc invalid  
**Solution:** Kiểm tra localStorage.getItem('token') và Authorization header

---

## 📚 Related Files

### Backend
- `Review.java` - Entity
- `ReviewRepository.java` - JPA Repository
- `ReviewService.java` - Business Logic
- `ReviewController.java` - REST API
- `ReviewRequestDTO.java` - Request DTO
- `ReviewResponseDTO.java` - Response DTO
- `SecurityConfig.java` - Security rules

### Frontend
- `reviewService.js` - API client
- `MovieReviews.jsx` - Review component
- `MovieDetail.jsx` - Movie detail page
- `MovieManagement.jsx` - Admin movie form (rating removed)

### Database
- `V2__create_reviews_table.sql` - Migration script

---

## 🎉 Summary

Hệ thống review hoàn chỉnh với:
- ⭐ User rating 1-10 sao
- 💬 Comment tùy chọn
- 🔄 Auto-calculate average rating
- ✏️ Edit/Delete own reviews
- 🔒 Authentication & Authorization
- 🎨 Beautiful UI components
- 📱 Responsive design

**Admin không còn nhập rating thủ công** - Tất cả rating đến từ users! 🚀
