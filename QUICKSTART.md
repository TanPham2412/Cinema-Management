# ⚡ Quick Start - Cinema Management System

Muốn chạy ngay? Làm theo 4 bước này!

## 📦 Prerequisites

- Java 21+
- Node.js 18+
- Docker Desktop (hoặc MySQL 8.0 + Redis)

## 🚀 4 Bước Setup Nhanh

### 1️⃣ Clone Repository

```bash
git clone <repository-url>
cd cinema-management
```

### 2️⃣ Khởi động Database (Docker)

```bash
# MySQL
docker run -d --name mysql-cinema -p 3306:3306 -e MYSQL_ROOT_PASSWORD=mypassword -e MYSQL_DATABASE=cinema_management mysql:8.0

# Redis  
docker run -d --name redis-cinema -p 6379:6379 redis:latest
```

### 3️⃣ Cấu hình Backend

```bash
cd cinema-management

# Copy và chỉnh sửa file config
cp src/main/resources/application.properties.example src/main/resources/application.properties

# Mở application.properties và sửa password:
# spring.datasource.password=mypassword

# Chạy backend
mvn spring-boot:run
```

✅ Backend chạy tại: **http://localhost:8081/api/**

### 4️⃣ Chạy Frontend

Mở terminal mới:

```bash
cd frontend
npm install
npm run dev
```

✅ Frontend chạy tại: **http://localhost:5173/**

## 🎉 Done!

Mở trình duyệt: **http://localhost:5173/**

## 🆘 Gặp lỗi?

### Port đã được sử dụng

```bash
# Backend (port 8081)
netstat -ano | findstr :8081
taskkill /PID <PID> /F

# Frontend (port 5173)  
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Database connection failed

```bash
# Kiểm tra MySQL container
docker ps
docker logs mysql-cinema

# Restart container
docker restart mysql-cinema
```

### Xem log chi tiết

```bash
# Backend logs
mvn spring-boot:run

# Docker logs
docker logs -f mysql-cinema
docker logs -f redis-cinema
```

## 📚 Cần hướng dẫn chi tiết?

Xem file `SETUP_GUIDE.md` để biết thêm chi tiết về:
- Cấu hình Google OAuth2
- Cấu hình Email
- Production deployment
- Troubleshooting

## 💡 Tips

- Sử dụng MySQL Workbench để quản lý database
- Sử dụng Redis Insight để monitor Redis
- Enable debug logs trong `application.properties` nếu cần troubleshoot

---

**Happy Coding! 🎬🍿**
