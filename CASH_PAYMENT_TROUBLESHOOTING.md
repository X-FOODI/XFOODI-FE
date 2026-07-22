# 🔧 Hướng Dẫn Xử Lý Lỗi Thanh Toán Tiền Mặt

## ❌ Vấn Đề: Real-time Cash Payment Không Hoạt Động

### 🔍 Triệu chứng:
- Nhân viên nhấn "Thu tiền mặt" nhưng không có gì xảy ra
- Trang checkout (khách hàng) không chuyển sang trang thành công
- Backend log **KHÔNG** thấy request `POST /api/payments/cash`
- Chỉ thấy polling: `GET /api/payments/public/.../status`

### 🎯 Nguyên nhân chính:

#### 1. **Phiên đăng nhập nhân viên hết hạn (401 Unauthorized)**
   - Access token bị expired
   - Hoặc token bị xóa khỏi localStorage/sessionStorage
   - Hoặc cookie auth bị clear

#### 2. **Dữ liệu không hợp lệ (400 Bad Request)**
   - `cashReceive` = 0 hoặc null
   - `orderId` không tồn tại
   - Backend validation failed

---

## ✅ Giải pháp

### 🔧 Bước 1: Kiểm tra console log (F12)

Khi nhấn "Thu tiền mặt", nhân viên cần mở **DevTools Console (F12)** và xem log:

```javascript
[Cash Payment] 🔍 Pre-flight check:
  - Order ID: xxx-xxx-xxx
  - Order Ref: ORD2607190002DJL
  - Cash received: 66000
  - Token exists: YES ✅  hoặc  ❌ NO
  - Token preview: eyJhbGciOiJIUzI1NiIs...
```

**Nếu `Token exists: ❌ NO`** → Đi đến Bước 2

**Nếu `Token exists: YES`** nhưng vẫn lỗi 401 → Token đã hết hạn → Đi đến Bước 2

**Nếu thấy lỗi 400** → Kiểm tra `Cash received` có > 0 không

---

### 🔧 Bước 2: Đăng xuất và đăng nhập lại

#### Cách đăng xuất:
1. Click **avatar/tên nhân viên** ở góc trên bên phải
2. Chọn **"Đăng xuất"**
3. Hoặc đi đến: `/login`

#### Cách đăng nhập lại:
1. Nhập **email** và **password** nhân viên
2. **Tích "Ghi nhớ đăng nhập"** để token không bị mất nhanh
3. Đăng nhập thành công → quay lại trang `/restaurant/live-orders`

---

### 🔧 Bước 3: Thử lại thanh toán

1. Khách hàng vẫn đang ở trang checkout (polling vẫn chạy)
2. Nhân viên đã đăng nhập lại → token mới hợp lệ
3. Nhân viên nhấn **"Thu tiền mặt"** lần nữa
4. **Kiểm tra backend log** phải thấy:
   ```
   >>> [2026-07-19T23:30:XX.XXX] POST /api/payments/cash
   [Cash Payment] Processing order: xxx-xxx-xxx
   [Cash Payment] Socket emit to restaurant_xxx: PAYMENT_COMPLETED
   ```
5. Trang checkout (khách hàng) phải nhận socket event và **tự động chuyển sang trang thành công**

---

## 🧪 Debug Checklist

### Backend Log (Phải thấy):
```
>>> [timestamp] POST /api/payments/cash
[Cash Payment] Processing order: {orderId}
[Cash Payment] Payment created: {paymentId}
[Cash Payment] Socket emit to restaurant_{restaurantId}: PAYMENT_COMPLETED
```

### Frontend Console Log (Nhân viên - F12):
```
[Cash Payment] 🔍 Pre-flight check:
  - Token exists: YES ✅
[Cash Payment] 📞 Calling POST /api/payments/cash...
[Cash Payment] ✅ API Response: { id: "...", status: 1, ... }
[Cash Payment] ✅ Payment completed successfully - order removed from KDS
```

### Frontend Console Log (Khách hàng - F12):
```
[Socket] Received PAYMENT_COMPLETED event
[Checkout] Payment completed, redirecting to success page...
Navigating to: /menu/TABLE_ID/checkout/success?paymentId=xxx
```

---

## 🚨 Nếu vẫn không hoạt động:

### 1. Kiểm tra Socket.io connection:
```javascript
// Trong console (F12) của trang live-orders
[Socket] Connected: NxJtVs0nsKOd-XRTAAAJ
[Socket] Joined room: restaurant_61c6e604-e301-4e79-a0c5-fd3a2ad63905
```

### 2. Kiểm tra localStorage:
```javascript
// Trong console (F12)
localStorage.getItem('accessToken')
sessionStorage.getItem('accessToken')
```

Nếu cả 2 đều null → phải đăng nhập lại

### 3. Kiểm tra network request:
- Mở **DevTools → Network tab**
- Filter: `cash`
- Nhấn "Thu tiền mặt"
- Phải thấy: `POST /api/payments/cash`
- Status: `200 OK` (không phải 401 hoặc 400)

---

## 📝 Ghi chú cho Dev:

### Code đã fix:
✅ Added pre-flight token check
✅ Added detailed console logging
✅ Added user-friendly error messages
✅ Added validation for `cashReceived > 0`
✅ Added specific handling for 401 (expired token) and 400 (bad data)

### Code cần staff làm:
⚠️ **ĐĂNG XUẤT + ĐĂNG NHẬP LẠI** khi gặp lỗi 401

### Flow hoàn chỉnh:
1. Khách hàng checkout → trang polling payment status
2. Khách nhấn "Gọi nhân viên thu tiền mặt" → socket emit `CALL_STAFF`
3. Live-orders page nhận socket → đánh dấu order sáng xanh + chuông khẩn cấp
4. Nhân viên nhấn "Thu tiền mặt" → mở modal
5. Nhân viên xác nhận → `POST /api/payments/cash`
6. Backend tạo payment → emit socket `PAYMENT_COMPLETED`
7. Trang checkout nhận socket → navigate to success page
8. Live-orders page nhận socket `ORDER_STATUS_CHANGED` → remove order từ KDS

---

## 🔗 Related Files:
- `XFOODI-FE/app/restaurant/live-orders/page.tsx` - Staff KDS page
- `XFOODI-FE/app/menu/[tableId]/checkout/page.tsx` - Customer checkout page
- `XFOODI-BE/src/models/routes/payments.ts` - Cash payment endpoint
- `XFOODI-BE/src/services/payment.service.ts` - Payment service logic
