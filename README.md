# Cinema Chain Management System - Hệ thống Quản lý Chuỗi Rạp Chiếu Phim

## 📋 Mô tả dự án

Hệ thống quản lý chuỗi rạp chiếu phim toàn diện với các tính năng:
- ✅ Quản lý phim, rạp, suất chiếu
- ✅ Đặt vé online với chọn ghế trực quan
- ✅ Giữ ghế thời gian thực (WebSocket + Redis)
- ✅ Tích hợp thanh toán VNPAY/MoMo
- ✅ Hệ thống tích điểm thành viên
- ✅ Dynamic Pricing (giá vé linh hoạt)
- ✅ Dashboard thống kê doanh thu
- ✅ POS cho nhân viên bán vé tại quầy

## 🛠️ Công nghệ sử dụng

### Backend
- Java 21
- Spring Boot 4.0.2
- Spring Security + JWT
- Spring Data JPA
- WebSocket (STOMP)
- Redis (Seat Locking)
- MySQL 8.0
- Maven

### Frontend
- React 18
- Redux Toolkit
- React Router v6
- Tailwind CSS
- Axios
- SockJS + STOMP
- Vite

## 📁 Cấu trúc dự án

```
cinema-management/
├── cinema-management/          # Backend (Spring Boot)
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/Nhom5/cinema_management/
│   │   │   │   ├── model/              # Entity classes
│   │   │   │   ├── repository/         # JPA Repositories
│   │   │   │   ├── controller/         # REST Controllers
│   │   │   │   ├── service/            # Business Logic
│   │   │   │   ├── config/             # Configuration
│   │   │   │   ├── security/           # JWT & Security
│   │   │   │   ├── dto/                # Data Transfer Objects
│   │   │   │   └── exception/          # Exception Handling
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   └── pom.xml
│
└── frontend/                   # Frontend (React)
    ├── src/
    │   ├── components/         # Reusable components
    │   ├── pages/              # Page components
    │   ├── redux/              # Redux store & slices
    │   ├── services/           # API services
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

## 🚀 Hướng dẫn cài đặt

### ⭐ Cách 1: Chạy toàn bộ bằng Docker (Khuyến nghị)

**Yêu cầu duy nhất**: [Docker Desktop](https://www.docker.com/products/docker-desktop/)

```bash
# 1. Clone project
git clone <repository-url>
cd cinema-management

# 2. Tạo file cấu hình
cp .env.example .env
```

Mở file `.env` và điền thông tin (bắt buộc nếu dùng Google Login):
```env
MYSQL_ROOT_PASSWORD=cinema123
JWT_SECRET=2e5f4c9a1b2d4e6f8a0c1e4f6a8c0e2f4a6c8e0f2a2c6e8f0a2c4e6f8a0c2e4f
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

```bash
# 3. Build và khởi động toàn bộ hệ thống
docker compose up -d --build
```

⏳ Lần đầu build mất khoảng 5-10 phút. Sau khi xong:

- **Web**: http://localhost:3000
- **API**: http://localhost:8081/api

#### Tài khoản mặc định (tự động tạo khi khởi động)
| Email | Password | Role |
|-------|----------|------|
| admin@cinema.com | Admin@123 | Admin |
| staff@cinema.com | Staff@123 | Staff |

#### Lệnh Docker thường dùng

```bash
docker compose up -d --build  # Lần đầu hoặc sau khi sửa code
docker compose up -d          # Các lần sau (không build lại)
docker compose down           # Tắt tất cả
docker compose logs backend   # Xem log backend
docker compose logs -f        # Xem log realtime tất cả services
docker compose ps             # Kiểm tra trạng thái containers
docker compose down -v        # Tắt và xóa toàn bộ dữ liệu (reset DB)
```

---

### Cách 2: Chạy dev local (code nhanh, hot-reload)

Dùng Docker chỉ cho database/redis, chạy backend và frontend trực tiếp trên máy.

**Yêu cầu**: [Docker Desktop](https://www.docker.com/products/docker-desktop/), Java JDK 21, Node.js 18+

```bash
# Bước 1: Khởi động MySQL + Redis bằng Docker
docker compose up -d mysql redis

# Bước 2: Chạy Backend (terminal 1)
cd cinema-management
.\mvnw spring-boot:run        # Windows
./mvnw spring-boot:run        # Linux/Mac

# Bước 3: Chạy Frontend (terminal 2)
cd frontend
npm install
npm run dev
```

- **Web**: http://localhost:5173
- **API**: http://localhost:8081/api

> **Kết nối MySQL Workbench**: host `127.0.0.1`, port `3307`, user `root`, password `cinema123`

---

### Cách 3: Chạy thủ công (cần cài đầy đủ MySQL, Redis riêng)

**Yêu cầu hệ thống:**
- Java JDK 21
- Node.js 18+
- MySQL 8.0
- Redis Server
- Maven 3.8+

### 1. Cài đặt Database

```sql
CREATE DATABASE cinema_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Cấu hình Backend

1. Mở file `cinema-management/src/main/resources/application.properties.example (xóa đi .example, chỉ giữ lại thành application.properties)`
2. Cập nhật thông tin database:

```properties
spring.datasource.username=root
spring.datasource.password=your_password
```

3. Cập nhật JWT Secret (production):
```properties
jwt.secret=YourVeryLongSecretKeyForJWTTokenGenerationMinimum512Bits
```

4. Cấu hình email (nếu sử dụng):
```properties
spring.mail.username=your_email@gmail.com
spring.mail.password=your_app_password
```

### 3. Khởi động Redis

```bash
# Windows
redis-server

# Linux/Mac
redis-server
```

### 4. Chạy Backend

```bash
cd cinema-management/cinema-management
mvnw spring-boot:run

# Hoặc
./mvnw spring-boot:run  # Linux/Mac
```

Backend sẽ chạy tại: `http://localhost:8080/api`

### 5. Cài đặt & Chạy Frontend

```bash
cd frontend

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:3000`

## 📊 Database Schema

### Các bảng chính:
- **users**: Thông tin người dùng, tích điểm
- **cinemas**: Chuỗi rạp chiếu phim
- **screens**: Phòng chiếu trong rạp
- **seats**: Ghế ngồi (VIP, Thường, Đôi)
- **movies**: Thông tin phim
- **screenings**: Suất chiếu
- **bookings**: Đơn đặt vé
- **booking_seats**: Chi tiết ghế đã đặt
- **payments**: Thanh toán
- **combos**: Bắp nước
- **booking_combos**: Combo đã mua

## 🔐 Phân quyền

### Roles:
- **CUSTOMER**: Khách hàng - Đặt vé, xem lịch sử
- **STAFF**: Nhân viên - Bán vé tại quầy, soát vé
- **ADMIN**: Quản trị viên - Quản lý toàn bộ hệ thống

## 🌐 API Endpoints (Dự kiến)

### Authentication
- POST `/api/auth/register` - Đăng ký
- POST `/api/auth/login` - Đăng nhập
- POST `/api/auth/refresh` - Refresh token

### Movies
- GET `/api/movies` - Danh sách phim
- GET `/api/movies/{id}` - Chi tiết phim
- GET `/api/movies/now-showing` - Phim đang chiếu
- GET `/api/movies/coming-soon` - Phim sắp chiếu

### Screenings
- GET `/api/screenings/{id}/seats` - Sơ đồ ghế

### Bookings
- POST `/api/bookings` - Tạo đơn đặt vé
- GET `/api/bookings/my-bookings` - Lịch sử đặt vé
- PUT `/api/bookings/{id}/cancel` - Hủy vé

### Admin
- POST `/api/admin/movies` - Thêm phim
- POST `/api/admin/screenings` - Tạo suất chiếu
- GET `/api/admin/statistics` - Thống kê

## 🔄 Real-time Features

### WebSocket Endpoints
- `/ws` - WebSocket connection
- `/topic/seats` - Subscribe to seat updates
- `/app/seat-selection` - Send seat selection

## 🎨 Tính năng nổi bật

### 1. Real-time Seat Locking
- Sử dụng WebSocket để đồng bộ trạng thái ghế
- Redis lưu trữ ghế đang được chọn
- Tự động release sau 10 phút

### 2. Dynamic Pricing
- Giá vé thay đổi theo:
  - Khung giờ (sáng, chiều, tối)
  - Loại ghế (VIP, thường, đôi)
  - Ngày trong tuần

### 3. Loyalty Program
- Tích điểm mỗi giao dịch
- 4 hạng thẻ: Bronze, Silver, Gold, Platinum
- Đổi điểm lấy quà

## 📱 Screenshots (Coming soon)

- Home page
- Movie listing
- Seat selection
- Booking summary
- Admin dashboard

## 🤝 Nhóm phát triển

**Nhóm 5** - Cinema Management System

## 📝 License

This project is for educational purposes.

## 🐛 Báo lỗi

Nếu phát hiện lỗi, vui lòng tạo issue trên GitHub repository.

---

**Note**: Đây là project học tập. Trong môi trường production cần bổ sung:
- SSL/HTTPS
- Rate limiting
- Monitoring & Logging
- CI/CD Pipeline
- Backup strategy
- Load balancing
