# Google OAuth2 Setup Guide

## Bước 1: Tạo Google OAuth2 Credentials

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Vào **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client ID**
5. Chọn **Application type**: Web application
6. Nhập thông tin:
   - **Name**: Cinema Management
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000`
     - `http://localhost:8081`
   - **Authorized redirect URIs**:
     - `http://localhost:8081/api/login/oauth2/code/google`
7. Click **Create** và copy **Client ID** và **Client Secret**

## Bước 2: Cấu hình Backend

Cập nhật `application.properties`:

```properties
spring.security.oauth2.client.registration.google.client-id=YOUR_GOOGLE_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_GOOGLE_CLIENT_SECRET
```

**Thay thế `YOUR_GOOGLE_CLIENT_ID` và `YOUR_GOOGLE_CLIENT_SECRET` bằng giá trị thực từ Google Cloud Console.**

## Bước 3: Test OAuth2 Login

1. Start backend: `mvn spring-boot:run`
2. Start frontend: `npm run dev`
3. Truy cập `http://localhost:3000/login`
4. Click "Đăng nhập với Google"
5. Chọn tài khoản Google
6. Sau khi đăng nhập thành công, bạn sẽ được redirect về trang chủ

## Lưu ý

- URL callback phải khớp chính xác với cấu hình trong Google Cloud Console
- Cần enable **Google+ API** trong Google Cloud Console nếu chưa enable
- Trong production, thay đổi URLs thành domain thật của bạn
