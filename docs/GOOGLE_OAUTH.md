# 🔐 Google OAuth Implementation Guide

## 📋 Tổng quan

Dự án XFOODI-FE đã tích hợp đầy đủ Google OAuth 2.0 cho phép người dùng đăng nhập bằng tài khoản Google. Implementation tuân thủ Google Branding Guidelines và best practices về bảo mật.

---

## 🎯 Tính năng

- ✅ Đăng nhập Google OAuth 2.0
- ✅ Tự động tạo tài khoản nếu chưa tồn tại
- ✅ Lưu session với localStorage (Remember Me) hoặc sessionStorage
- ✅ Lưu accessToken vào httpOnly-style cookie cho middleware
- ✅ Tích hợp với AuthContext global state
- ✅ Hỗ trợ Dark/Light theme
- ✅ Responsive trên mobile
- ✅ Loading states và error handling
- ✅ Tuân thủ Google Branding Guidelines

---

## 🚀 Cấu hình

### 1. Cài đặt thư viện

Thư viện đã được cài đặt sẵn trong `package.json`:

```json
{
  "dependencies": {
    "@react-oauth/google": "^0.13.5"
  }
}
```

Nếu cần cài đặt lại:

```bash
npm install @react-oauth/google
```

### 2. Lấy Google Client ID

#### Bước 1: Truy cập Google Cloud Console
Mở [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

#### Bước 2: Tạo OAuth 2.0 Client ID
1. Click **"Create Credentials"** → **"OAuth client ID"**
2. Chọn **Application type**: **Web application**
3. Đặt tên: `XFOODI Frontend`

#### Bước 3: Cấu hình Authorized origins và redirect URIs

**Authorized JavaScript origins:**
```
http://localhost:3000
https://yourdomain.com
https://demo.xfoodi.com
```

**Authorized redirect URIs:**
```
http://localhost:3000
https://yourdomain.com
https://demo.xfoodi.com
```

#### Bước 4: Copy Client ID
Sau khi tạo, copy **Client ID** (dạng: `xxxxx.apps.googleusercontent.com`)

### 3. Cấu hình Environment Variables

Tạo file `.env.local` (hoặc cập nhật file hiện tại):

```bash
# Google OAuth 2.0
NEXT_PUBLIC_GOOGLE_CLIENT_ID=1014072333198-06iras1d6vnqps978glvqflfr9s7ptn0.apps.googleusercontent.com

# API Base URL (backend sẽ nhận POST /auth/google)
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

**Lưu ý:**
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Client ID từ Google Cloud Console
- `NEXT_PUBLIC_API_BASE_URL`: URL backend API (đã có sẵn trong dự án)

---

## 🏗️ Kiến trúc

### 1. Provider Setup

File: `app/layout.tsx`

```tsx
import { GoogleOAuthAppProvider } from "@/components/providers/GoogleOAuthAppProvider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <GoogleOAuthAppProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </GoogleOAuthAppProvider>
      </body>
    </html>
  );
}
```

### 2. Custom Hook: `useGoogleLogin`

File: `lib/hooks/useGoogleLogin.ts`

Hook xử lý logic đăng nhập Google:

```tsx
import { useGoogleLogin } from '@/lib/hooks/useGoogleLogin';

function MyComponent() {
  const { loginWithGoogle, loading, error } = useGoogleLogin();

  const handleGoogleSuccess = async (credential: string) => {
    try {
      const user = await loginWithGoogle(credential, true); // rememberMe = true
      router.push('/dashboard');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return <div>...</div>;
}
```

**API:**
- `loginWithGoogle(googleToken, rememberMe)`: Xử lý đăng nhập
- `loading`: Boolean state khi đang xử lý
- `error`: String error message nếu có lỗi
- `clearError()`: Reset error state

### 3. Component: `GoogleLoginButton`

File: `components/auth/GoogleLoginButton.tsx`

Component nút đăng nhập Google:

```tsx
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';

function LoginPage() {
  const router = useRouter();

  const handleSuccess = (user: User) => {
    router.push('/dashboard');
  };

  return (
    <GoogleLoginButton
      onSuccess={handleSuccess}
      rememberMe={true}
      variant="signin"
    />
  );
}
```

**Props:**
- `onSuccess: (user: User) => void` - Callback khi đăng nhập thành công
- `onError?: (error: Error) => void` - Callback khi có lỗi (optional)
- `rememberMe?: boolean` - Lưu localStorage (true) hay sessionStorage (false)
- `disabled?: boolean` - Disable button
- `variant?: 'signin' | 'signup'` - Text hiển thị ("Sign in with Google" hoặc "Sign up with Google")
- `width?: number` - Custom width (default: 320px)

### 4. Auth Service

File: `lib/services/authService.ts`

Service xử lý API call:

```typescript
async loginWithGoogle(googleToken: string, rememberMe = true): Promise<User> {
  // POST { googleToken } lên backend /auth/google
  const response = await axiosInstance.post('/auth/google', { googleToken });
  
  // Parse response: { success, data: { user, tokens: { accessToken, refreshToken } } }
  const { user, tokens } = parseAuthLoginPayload(response.data);
  
  // Lưu vào storage + cookie
  return finalizeLoginSession(user, tokens, rememberMe);
}
```

### 5. Auth Context

File: `lib/contexts/AuthContext.tsx`

Global state management:

```tsx
const { loginWithGoogle, user, loading } = useAuth();

// Sử dụng
const user = await loginWithGoogle(googleToken, rememberMe);
```

---

## 🔌 Backend API Requirements

### Endpoint: `POST /auth/google`

**Request:**
```json
{
  "googleToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjI3..." // Google credential JWT
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@gmail.com",
      "name": "John Doe",
      "role": "Customer",
      "avatar": "https://..."
    },
    "tokens": {
      "accessToken": "jwt-access-token",
      "refreshToken": "jwt-refresh-token"
    }
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Google sign-in failed or account not registered"
}
```

**Backend Implementation Notes:**
1. Verify Google JWT token bằng Google API
2. Extract email từ Google token
3. Tìm hoặc tạo user trong database
4. Generate accessToken và refreshToken
5. Return user info và tokens

---

## 📱 Sử dụng trong Pages

### Trang Login (`app/login/page.tsx`)

```tsx
import { GoogleIdentityButton } from "@/components/auth/GoogleIdentityButton";

export default function LoginPage() {
  const router = useRouter();
  const [remember, setRemember] = useState(true);

  const navigateAfterLogin = (user: User) => {
    redirectAfterLogin(router, user, null);
  };

  return (
    <div>
      {/* Form đăng nhập email/password */}
      <form>...</form>

      {/* Divider */}
      <div className="relative mt-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-900">hoặc</span>
        </div>
      </div>

      {/* Google Login Button */}
      <GoogleIdentityButton
        rememberMe={remember}
        onAuthenticated={navigateAfterLogin}
        variant="signin"
      />
    </div>
  );
}
```

### Trang Register (`app/register/page.tsx`)

```tsx
import { GoogleIdentityButton } from "@/components/auth/GoogleIdentityButton";

export default function RegisterPage() {
  const router = useRouter();

  const navigateAfterGoogle = (user: User) => {
    redirectAfterLogin(router, user, null);
  };

  return (
    <div>
      {/* Form đăng ký */}
      <form>...</form>

      {/* Divider */}
      <div className="relative mt-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-900">hoặc</span>
        </div>
      </div>

      {/* Google Signup Button */}
      <GoogleIdentityButton
        rememberMe={true}
        onAuthenticated={navigateAfterGoogle}
        variant="signup"
      />
    </div>
  );
}
```

---

## 🎨 Styling & Theming

### Dark/Light Mode Support

Component tự động hỗ trợ dark/light mode thông qua Tailwind CSS và CSS variables:

```css
/* globals.css */
:root {
  --primary: #ff6b35;
  --bg-light-base: #ffffff;
  --bg-dark-base: #0f0f0f;
}

[data-theme="dark"] {
  /* Dark theme colors */
}
```

### Google Branding Guidelines

Component tuân thủ [Google Branding Guidelines](https://developers.google.com/identity/branding-guidelines):

✅ Sử dụng official Google button từ `@react-oauth/google`  
✅ Không thay đổi màu sắc logo Google  
✅ Không crop hoặc modify logo  
✅ Text: "Sign in with Google" hoặc "Sign up with Google"  
✅ Kích thước tối thiểu: 44px height (touch-friendly)  

---

## 🔒 Security Best Practices

### 1. Token Storage

**✅ ĐÚNG:**
```typescript
// Lưu accessToken vào cookie (httpOnly-style)
document.cookie = `accessToken=${token}; path=/; SameSite=Lax`;

// Lưu user info vào localStorage/sessionStorage
localStorage.setItem('userInfo', JSON.stringify(user));
```

**❌ SAI:**
```typescript
// KHÔNG lưu accessToken vào localStorage (dễ bị XSS)
localStorage.setItem('accessToken', token); // ❌
```

### 2. Google Token Validation

**Frontend:**
- Chỉ gửi `googleToken` (credential JWT) lên backend
- KHÔNG decode hoặc trust thông tin từ JWT ở frontend
- KHÔNG gửi email trực tiếp từ Google profile

**Backend:**
- PHẢI verify Google JWT token bằng Google API
- PHẢI validate token signature
- PHẢI check token expiration
- PHẢI check token audience (Client ID)

### 3. HTTPS Only (Production)

```bash
# Production environment
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

---

## 🧪 Testing

### Local Development

1. Start backend server:
```bash
cd backend
dotnet run
```

2. Start frontend:
```bash
npm run dev
```

3. Mở browser: `http://localhost:3000/login`

4. Click "Sign in with Google"

5. Chọn tài khoản Google

6. Kiểm tra:
   - ✅ Redirect về trang chủ sau khi đăng nhập
   - ✅ User info hiển thị đúng
   - ✅ Token được lưu vào cookie
   - ✅ Refresh page vẫn giữ session

### Debug

**Check Google Client ID:**
```bash
# In terminal
echo $NEXT_PUBLIC_GOOGLE_CLIENT_ID
```

**Check browser console:**
```javascript
// In browser DevTools Console
console.log(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
```

**Check network requests:**
1. Mở DevTools → Network tab
2. Click "Sign in with Google"
3. Kiểm tra request `POST /auth/google`
4. Xem request body: `{ googleToken: "..." }`
5. Xem response: `{ success: true, data: { user, tokens } }`

---

## 🐛 Troubleshooting

### Lỗi: "NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured"

**Nguyên nhân:** Chưa set environment variable

**Giải pháp:**
```bash
# Tạo file .env.local
echo "NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id" > .env.local

# Restart dev server
npm run dev
```

### Lỗi: "Invalid Google response"

**Nguyên nhân:** Google không trả về credential

**Giải pháp:**
1. Kiểm tra Google Cloud Console → Credentials
2. Đảm bảo Authorized JavaScript origins đúng
3. Đảm bảo Authorized redirect URIs đúng
4. Clear browser cache và thử lại

### Lỗi: "Google sign-in failed or account not registered"

**Nguyên nhân:** Backend không verify được Google token hoặc user chưa tồn tại

**Giải pháp:**
1. Kiểm tra backend logs
2. Đảm bảo backend verify Google token đúng cách
3. Đảm bảo backend tự động tạo user nếu chưa tồn tại

### Lỗi: "Cannot connect to server"

**Nguyên nhân:** Backend không chạy hoặc CORS issue

**Giải pháp:**
```bash
# Kiểm tra backend đang chạy
curl http://localhost:5000/api/health

# Kiểm tra CORS settings trong backend
# Đảm bảo allow origin: http://localhost:3000
```

---

## 📚 Tài liệu tham khảo

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Branding Guidelines](https://developers.google.com/identity/branding-guidelines)
- [@react-oauth/google Documentation](https://www.npmjs.com/package/@react-oauth/google)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

## 📝 Checklist Implementation

- [x] Cài đặt `@react-oauth/google`
- [x] Cấu hình `GoogleOAuthProvider` trong `layout.tsx`
- [x] Tạo hook `useGoogleLogin` tại `lib/hooks/useGoogleLogin.ts`
- [x] Tạo component `GoogleLoginButton` tại `components/auth/GoogleLoginButton.tsx`
- [x] Tích hợp vào trang `/login`
- [x] Tích hợp vào trang `/register`
- [x] Cập nhật `.env.example` với hướng dẫn
- [x] Implement `loginWithGoogle` trong `authService.ts`
- [x] Implement `loginWithGoogle` trong `AuthContext.tsx`
- [x] Lưu token vào cookie (không localStorage)
- [x] Hỗ trợ Dark/Light theme
- [x] Responsive mobile
- [x] Error handling
- [x] Loading states
- [x] Tuân thủ Google Branding Guidelines

---

## 🎉 Kết luận

Dự án XFOODI-FE đã có implementation Google OAuth hoàn chỉnh và production-ready. Tất cả components, hooks, và services đã được tạo sẵn và tuân thủ best practices về bảo mật, UX, và Google guidelines.

**Để sử dụng:**
1. Lấy Google Client ID từ Google Cloud Console
2. Thêm vào `.env.local`
3. Restart dev server
4. Test đăng nhập Google tại `/login` hoặc `/register`

**Liên hệ:** Nếu có vấn đề, kiểm tra phần Troubleshooting hoặc xem backend logs.
