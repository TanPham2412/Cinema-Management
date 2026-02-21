# 🚀 Hướng Dẫn Cài Đặt Chi Tiết - Cinema Management System

## 📋 Yêu Cầu Hệ Thống

- **Java**: JDK 21 trở lên
- **Node.js**: v18 trở lên
- **MySQL**: 8.0 trở lên (hoặc Docker)
- **Redis**: 6.0 trở lên (hoặc Docker)
- **Maven**: 3.8+ (hoặc dùng Maven Wrapper có sẵn)

## 🐳 Option 1: Sử Dụng Docker (Khuyến nghị cho Development)

### Bước 1: Cài đặt Docker Desktop

1. Tải Docker Desktop: https://www.docker.com/products/docker-desktop
2. Cài đặt và khởi động Docker Desktop

### Bước 2: Khởi động MySQL và Redis

```bash
# MySQL 8.0
docker run -d \
  --name mysql-cinema \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=your_password \
  -e MYSQL_DATABASE=cinema_management \
  mysql:8.0

# Redis
docker run -d \
  --name redis-cinema \
  -p 6379:6379 \
  redis:latest
```

### Bước 3: Kiểm tra containers đang chạy

```bash
docker ps
```

## 💾 Option 2: Cài Đặt Trực Tiếp

### MySQL

1. Tải và cài đặt MySQL: https://dev.mysql.com/downloads/installer/
2. Tạo database:

```sql
CREATE DATABASE cinema_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Redis

- **Windows**: Tải Redis từ https://github.com/microsoftarchive/redis/releases
- **macOS**: `brew install redis`
- **Linux**: `sudo apt-get install redis-server`

## ⚙️ Cấu Hình Backend

### Bước 1: Copy file cấu hình

```bash
cd cinema-management
cp src/main/resources/application.properties.example src/main/resources/application.properties
```

### Bước 2: Cập nhật thông tin database trong `application.properties`

```properties
# Database Configuration
spring.datasource.username=root
spring.datasource.password=your_password_here

# Redis Configuration (nếu thay đổi)
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.data.redis.password=

# JWT Secret (production: thay bằng secret key mạnh hơn)
jwt.secret=YOUR_VERY_LONG_SECRET_KEY_MINIMUM_256_BITS
```

### Bước 3: Cấu hình Google OAuth2 (Optional)

1. Truy cập https://console.cloud.google.com/
2. Tạo project mới hoặc chọn project có sẵn
3. Vào **APIs & Services > Credentials**
4. Tạo **OAuth 2.0 Client ID**:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:8081/api/login/oauth2/code/google`
5. Copy Client ID và Client Secret vào `application.properties`:

```properties
spring.security.oauth2.client.registration.google.client-id=YOUR_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_CLIENT_SECRET
```

### Bước 4: Cấu hình Email (Optional - để gửi vé qua email)

```properties
spring.mail.username=your_email@gmail.com
spring.mail.password=your_app_password
```

**Lưu ý**: Với Gmail, cần tạo **App Password** tại: https://myaccount.google.com/apppasswords

## 🏃 Chạy Ứng Dụng

### Backend

```bash
# Di chuyển vào thư mục backend
cd cinema-management

# Build và chạy
mvn clean install
mvn spring-boot:run

# Hoặc dùng Maven Wrapper (không cần cài Maven)
./mvnw clean install
./mvnw spring-boot:run
```

Backend sẽ chạy tại: **http://localhost:8081/api/**

### Frontend

```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

Frontend sẽ chạy tại: **http://localhost:5173/**

## ✅ Kiểm Tra Cài Đặt

### 1. Kiểm tra Backend

```bash
curl http://localhost:8081/api/
```

Hoặc mở trình duyệt: http://localhost:8081/api/

### 2. Kiểm tra Database

```bash
# Nếu dùng Docker
docker exec -it mysql-cinema mysql -uroot -p

# Trong MySQL shell
USE cinema_management;
SHOW TABLES;
```

Bạn sẽ thấy các bảng: `users`, `movies`, `cinemas`, `screens`, `seats`, `bookings`, v.v.

### 3. Kiểm tra Redis

```bash
# Nếu dùng Docker
docker exec -it redis-cinema redis-cli

# Test connection
PING
# Kết quả: PONG
```

## 🐛 Xử Lý Lỗi Thường Gặp

### Lỗi: "Failed to open the referenced table 'screens'"

**Nguyên nhân**: Field `rows` là MySQL reserved keyword (đã được fix trong code mới nhất)

**Giải pháp**: Pull code mới nhất - field đã được đổi thành `rowCount` với column name `row_count`

### Lỗi: "Access denied for user 'root'@'localhost'"

**Giải pháp**: Kiểm tra lại username và password trong `application.properties`

### Lỗi: "Could not connect to Redis"

**Giải pháp**: 
- Kiểm tra Redis đã chạy: `docker ps` hoặc `redis-cli ping`
- Kiểm tra port 6379 không bị chiếm

### Lỗi: "Port 8081 already in use"

**Giải pháp**: 
- Kill process đang dùng port 8081
- Hoặc đổi port trong `application.properties`: `server.port=8082`

## 📚 Tài Liệu API

Sau khi backend chạy, truy cập Swagger UI để xem API documentation:

**http://localhost:8081/api/swagger-ui.html** (nếu đã enable Swagger)

## 🔐 Tài Khoản Mặc Định

Sau khi chạy lần đầu, các tài khoản mặc định sẽ được tạo (nếu có data initialization):

- **Admin**: `admin@cinema.com` / `admin123`
- **Staff**: `staff@cinema.com` / `staff123`
- **User**: `user@cinema.com` / `user123`

## 🎯 Development Tips

### Hot Reload Backend

```bash
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Dspring.devtools.restart.enabled=true"
```

### Hot Reload Frontend

Frontend với Vite đã có hot reload sẵn khi chạy `npm run dev`

### Debug Mode

Thêm vào `application.properties`:
```properties
logging.level.Nhom5.cinema_management=DEBUG
spring.jpa.show-sql=true
```

## 📞 Hỗ Trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra lại các bước cài đặt
2. Xem phần "Xử Lý Lỗi Thường Gặp" ở trên
3. Kiểm tra logs trong terminal
4. Tạo issue trên GitHub repository

---

**Happy Coding! 🎬🍿**
