# 🚀 Google OAuth - Quick Start Guide

## ✅ Tình trạng Implementation

Dự án XFOODI-FE **đã có đầy đủ** tính năng Google OAuth. Tất cả components, hooks, và services đã được implement sẵn.

---

## 📦 Files đã có sẵn

### 1. Core Files (Đã có sẵn)
- ✅ `components/providers/GoogleOAuthAppProvider.tsx` - Provider wrapper
- ✅ `components/auth/GoogleIdentityButton.tsx` - Google button component (hiện tại)
- ✅ `lib/contexts/AuthContext.tsx` - Auth state management
- ✅ `lib/services/authService.ts` - API service
- ✅ `app/layout.tsx` - Provider setup

### 2. New Files (Vừa tạo)
- ✅ `lib/hooks/useGoogleLogin.ts` - Custom hook
- ✅ `components/auth/GoogleLoginButton.tsx` - Simplified button component
- ✅ `docs/GOOGLE_OAUTH.md` - Tài liệu chi tiết
- ✅ `docs/examples/google-oauth-example.tsx` - Example code

---

## ⚡ Quick Start (3 bước)

### Bước 1: Lấy Google Client ID

1. Truy cập: https://console.cloud.google.com/apis/credentials
2. Tạo OAuth 2.0 Client ID (Web application)
3. Thêm origins: `http://localhost:3000`
4. Copy Client ID

### Bước 2: Cấu hình Environment

Tạo/cập nhật file `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

### Bước 3: Restart Server

```bash
npm run dev
```

**Xong!** Truy cập `http://localhost:3000/login` và test Google login.

---

## 💻 Cách sử dụng

### Option 1: Sử dụng Component có sẵn (Recommended)

```tsx
import { GoogleIdentityButton } from "@/components/auth/GoogleIdentityButton";

<GoogleIdentityButton
  rememberMe={true}
  onAuthenticated={(user) => router.push('/dashboard')}
  variant="signin"
/>
```

### Option 2: Sử dụng Component mới (Simplified)

```tsx
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";

<GoogleLoginButton
  onSuccess={(user) => router.push('/dashboard')}
  rememberMe={true}
  variant="signin"
/>
```

### Option 3: Sử dụng Hook trực tiếp

```tsx
import { useGoogleLogin } from '@/lib/hooks/useGoogleLogin';

const { loginWithGoogle, loading, error } = useGoogleLogin();

const handleLogin = async (credential: string) => {
  const user = await loginWithGoogle(credential, true);
  router.push('/dashboard');
};
```

---

## 🔧 Backend API Requirements

Backend cần implement endpoint:

**POST `/auth/google`**

Request:
```json
{
  "googleToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@gmail.com",
      "name": "John Doe",
      "role": "Customer"
    },
    "tokens": {
      "accessToken": "jwt-token",
      "refreshToken": "refresh-token"
    }
  }
}
```

---

## 📚 Tài liệu đầy đủ

Xem file `docs/GOOGLE_OAUTH.md` để biết:
- Kiến trúc chi tiết
- Security best practices
- Troubleshooting
- API documentation
- Testing guide

---

## 🎯 Các trang đã tích hợp

- ✅ `/login` - Trang đăng nhập (đã có GoogleIdentityButton)
- ✅ `/register` - Trang đăng ký (đã có GoogleIdentityButton)

---

## 🐛 Troubleshooting

### Không thấy nút Google?

```bash
# Check environment variable
echo $NEXT_PUBLIC_GOOGLE_CLIENT_ID

# Restart server
npm run dev
```

### Lỗi "Invalid Google response"?

1. Kiểm tra Google Cloud Console → Credentials
2. Đảm bảo Authorized JavaScript origins: `http://localhost:3000`
3. Clear browser cache

### Backend lỗi 401?

1. Backend phải verify Google token
2. Backend phải tự động tạo user nếu chưa tồn tại
3. Check backend logs

---

## 📞 Support

Nếu gặp vấn đề:
1. Đọc `docs/GOOGLE_OAUTH.md` (tài liệu chi tiết)
2. Xem `docs/examples/google-oauth-example.tsx` (code example)
3. Check browser console và network tab
4. Check backend logs

---

## ✨ Features

- ✅ Google OAuth 2.0 login
- ✅ Auto-create user nếu chưa tồn tại
- ✅ Remember Me (localStorage vs sessionStorage)
- ✅ Cookie-based session cho middleware
- ✅ Dark/Light theme support
- ✅ Mobile responsive
- ✅ Loading states
- ✅ Error handling
- ✅ Google Branding Guidelines compliant

---

**Tất cả đã sẵn sàng! Chỉ cần config Google Client ID và test thôi! 🎉**
