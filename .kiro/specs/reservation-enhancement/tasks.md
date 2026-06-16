# Implementation Plan: Reservation Enhancement

## Overview

Triển khai nâng cấp hệ thống đặt bàn XFOODI theo 10 nhóm tính năng: email notification, trạng thái CHECKED_IN/COMPLETED, check-in logic, date range filter, reminder cron job, chỉnh sửa reservation, hoàn cọc, dashboard stats, QR check-in, và payment deadline enforcement. Backend dùng Node.js/Express/Prisma (TypeScript), Frontend dùng Next.js 15 + Ant Design.

---

## Tasks

- [x] 1. Chuẩn bị DB Schema và seed data
  - Chạy migration SQL thêm cột `completedAt` và `reminderSentAt` vào bảng `Reservations`
  - Thêm seed records cho 2 `StatusValue` mới: `CHECKED_IN` (màu `#6366f1`) và `COMPLETED` (màu `#3b82f6`) với `statusType.code = 'RESERVATION'`
  - Kiểm tra và tạo model `Refund` trong Prisma schema nếu chưa tồn tại, với các trường: `id`, `reservationId`, `amount`, `status`, `metadata`, `createdAt`, `updatedAt`, relation đến `Reservation` và `Payment[]`
  - Cập nhật Prisma Client sau migration
  - _Requirements: 2.1, 7.1, 10.1_

- [x] 2. Backend — MailService và email templates
  - [x] 2.1 Implement helper `sendWithRetry` và 4 hàm email mới trong `src/lib/email.ts`
    - Thêm `sendWithRetry<T>(fn, maxAttempts=3, delayMs=10000)` với logic retry và delay
    - Implement `sendReservationConfirmationEmail(to, details)` — template tiếng Việt gồm: confirmationCode, time, numberOfGuests, restaurantName, depositAmount, tableAssignments (nếu có)
    - Implement `sendReservationCancellationEmail(to, details & {cancelledAt, refundAmount?, refundEstimateDays?})`
    - Implement `sendReservationReminderEmail(to, details)` — nội dung nhắc nhở 2 tiếng trước
    - Implement `sendRefundNotificationEmail(to, {restaurantName, confirmationCode, refundAmount, estimatedDays, reason?})`
    - Nếu thất bại sau 3 lần: ghi `NotificationLog` record với `{reservationId, email, reason, attempts: 3, status: 'FAILED'}`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 5.2, 7.3_

  - [ ]* 2.2 Viết property test cho email retry bound (Property 2)
    - **Property 2: Email Retry Bound**
    - **Validates: Requirements 1.7, 1.3**
    - Dùng `fast-check`: mock fn luôn throw, assert `sendWithRetry` gọi fn đúng 3 lần không hơn

  - [ ]* 2.3 Viết property test cho email content completeness (Property 1)
    - **Property 1: Email Content Completeness**
    - **Validates: Requirements 1.2, 1.4**
    - Dùng `fast-check`: generate ngẫu nhiên `ReservationEmailDetails`, assert rendered HTML chứa đủ các trường bắt buộc

- [x] 3. Backend — Mở rộng `ReservationService` (state machine, check-in, complete, update)
  - [x] 3.1 Implement `validateTransition` và fix `checkIn()` trong `ReservationService`
    - Thêm hằng số `ALLOWED_TRANSITIONS` (PENDING→CONFIRMED/CANCELLED, CONFIRMED→CHECKED_IN/CANCELLED, CHECKED_IN→COMPLETED/CANCELLED)
    - Implement `validateTransition(from, to)`: throw HTTP 422 `{ error: "Invalid transition", from, to }` nếu không hợp lệ
    - Fix `checkIn(code, actorId?)`: đổi status từ `CONFIRMED` → `CHECKED_IN` (không phải CONFIRMED như hiện tại), set `checkedInAt`, append `statusHistory` entry
    - Xử lý edge cases: 409 nếu đã CHECKED_IN, 422 nếu sai status, 404 nếu không tìm thấy
    - Gửi welcome email không blocking sau check-in thành công
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 3.2 Viết property test cho status transition enforcement (Property 3)
    - **Property 3: Status Transition Enforcement**
    - **Validates: Requirements 2.2, 2.3**
    - Dùng `fast-check`: với mọi cặp (from, to) ngoài allowed set, `validateTransition` phải throw

  - [x] 3.3 Implement `completeReservation()`, `updateStatus()` với status history, và `statusHistory` append
    - Thêm `completeReservation(id, actorId?)`: CHECKED_IN → COMPLETED, set `completedAt = now()`
    - Cập nhật `updateStatus()` để gọi `validateTransition` và append `statusHistory`
    - _Requirements: 2.2, 2.4, 2.5_

  - [ ]* 3.4 Viết property test cho status history append invariant (Property 4) và completedAt (Property 5)
    - **Property 4: Status History Append Invariant**
    - **Property 5: completedAt Set on COMPLETED Transition**
    - **Validates: Requirements 2.4, 2.5**

  - [ ]* 3.5 Viết property test cho check-in produces CHECKED_IN (Property 6)
    - **Property 6: Check-In Produces CHECKED_IN (not CONFIRMED)**
    - **Validates: Requirements 3.1**

  - [x] 3.6 Implement `updateReservation(id, dto, actorId?)` — PATCH /reservations/:id
    - Validate status: chỉ cho PENDING/CONFIRMED, trả 422 nếu CHECKED_IN/COMPLETED/CANCELLED
    - Validate quyền: customer là chủ hoặc restaurant staff, trả 403 nếu không hợp lệ
    - Validate body không rỗng, trả 400 nếu không có trường hợp lệ
    - Nếu `time` hoặc `tableIds` thay đổi: re-run availability check (±90 min buffer, exclude current reservation), trả 409 nếu conflict
    - Recalculate `depositAmount` nếu `numberOfGuests` hoặc `tableIds` thay đổi
    - Gửi modification email sau khi update thành công
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

  - [ ]* 3.7 Viết property test cho update rejected for terminal statuses (Property 31)
    - **Property 31: Update Rejected for Terminal Statuses**
    - **Validates: Requirements 6.5**
    - Dùng `fast-check`: với status ∈ {CHECKED_IN, COMPLETED, CANCELLED}, assert updateReservation trả 422

- [x] 4. Backend — `ReservationService`: cancel với refund, stats, và availability
  - [x] 4.1 Mở rộng `cancel()` để xử lý refund
    - Kiểm tra payment COMPLETED với purpose DEPOSIT
    - Tính `cancellationFee` dựa vào `cancellationFeePercent` trong restaurant metadata
    - Late cancellation rule: nếu `cancellationTimestamp >= (reservation.time - 2 hours)` → fee = 100%
    - Atomic: tạo `Refund` record trước, sau đó set status CANCELLED
    - Nếu Refund persist fail: return HTTP 500, không đổi status, log error với reservationId
    - Gửi refund notification email không blocking
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

  - [ ]* 4.2 Viết property test cho refund amount formula (Property 25)
    - **Property 25: Refund Amount Formula Correctness**
    - **Validates: Requirements 7.5, 7.7**
    - Dùng `fast-check`: với D ∈ [0, 10_000_000], P ∈ [0, 100], assert `MAX(0, FLOOR(D × (100 − P) / 100))`

  - [ ]* 4.3 Viết property test cho late cancellation 100% fee (Property 26)
    - **Property 26: Late Cancellation 100% Fee**
    - **Validates: Requirements 7.6**
    - Dùng `fast-check`: với `cancellationTimestamp >= (reservation.time - 2h)`, refund phải bằng 0

  - [x] 4.4 Implement `getStats(restaurantId, period)` — GET /reservations/stats
    - Hỗ trợ `period`: `today`, `this_week`, `this_month` (UTC+7)
    - Trả về: `totalReservations`, `confirmedCount`, `checkedInCount`, `completedCount`, `cancelledCount`, `checkInRate`, `totalDepositCollected`
    - Tính `checkInRate = ROUND(checkedInCount / (totalReservations - cancelledCount) × 100, 1)`, trả 0.0 nếu denominator = 0
    - Trả 400 nếu `period` không hợp lệ, 404 nếu `restaurantId` không tồn tại
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

  - [ ]* 4.5 Viết property test cho stats period scope correctness (Property 27)
    - **Property 27: Stats Period Scope Correctness**
    - **Validates: Requirements 8.3, 8.4, 8.5**

  - [ ]* 4.6 Viết property test cho checkInRate formula (Property 28)
    - **Property 28: checkInRate Formula**
    - **Validates: Requirements 8.8**
    - Dùng `fast-check` với total, cancelled, checkedIn, assert công thức ROUND(I / (T-C) × 100, 1)

  - [x] 4.7 Cập nhật `checkAvailability()` và `createReservation()` với deposit/QR/deadline
    - Cập nhật `createReservation()`: đảm bảo `confirmationCode` unique (max 10 attempts, HTTP 500 nếu hết), set `paymentDeadline = createdAt + 30min` nếu `depositAmount > 0` (null nếu = 0), gọi QRService, gửi confirmation email
    - _Requirements: 10.1, 10.2, 12.1, 12.2, 12.3, 12.4, 9.2, 9.9, 13.1, 13.2, 13.3_

  - [ ]* 4.8 Viết property test cho availability filter (Properties 7, 8, 9)
    - **Property 7: Availability Filter — No Double-Booking**
    - **Property 8: Availability Filter — Capacity and Active Constraints**
    - **Property 9: Availability Check Idempotence**
    - **Validates: Requirements 13.1, 13.2, 13.4, 13.5**

  - [ ]* 4.9 Viết property test cho deposit calculation (Properties 10, 11, 12, 13)
    - **Property 10: Deposit Calculation — Linear Scaling (Table Case)**
    - **Property 11: Deposit Calculation — Linear Scaling (No-Table Case)**
    - **Property 12: Deposit Calculation Non-Negativity**
    - **Property 13: Deposit Recalculation Idempotence**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**
    - Dùng `fast-check`: array of capacities, assert `SUM(ci × 25000)` và `guests × 25000`

  - [ ]* 4.10 Viết property test cho confirmation code (Properties 14, 15, 16)
    - **Property 14: Confirmation Code Format**
    - **Property 15: Confirmation Code Uniqueness**
    - **Property 16: Confirmation Code Round-Trip**
    - **Validates: Requirements 12.1, 12.2, 12.5**
    - Dùng `fast-check`: 500 iterations, assert regex `^[0-9A-F]{6}$` và hex round-trip

- [x] 5. Backend — QRService (mới)
  - [x] 5.1 Tạo `src/services/qr.service.ts` với `generateReservationQR(confirmationCode)`
    - Import `qrcode` library, tạo QR data URL với `errorCorrectionLevel: 'M'`, `width: 256`
    - Store URL vào `reservation.metadata.qrCodeUrl`
    - Nếu generation fail: log error, để `metadata.qrCodeUrl = null`, không block reservation creation
    - _Requirements: 9.2, 9.9_

  - [ ]* 5.2 Viết property test cho QR generation failure handling (Property 30)
    - **Property 30: QR Generation Failure Does Not Block Reservation**
    - **Validates: Requirements 9.9**
    - Mock `qrcode.toDataURL` throw exception, assert reservation vẫn được tạo với `metadata.qrCodeUrl = null`

  - [ ]* 5.3 Viết property test cho QR content contains confirmation code (Property 29)
    - **Property 29: QR Code Content Contains Confirmation Code**
    - **Validates: Requirements 9.1, 9.4**

- [x] 6. Backend — CronJobManager và cron jobs
  - [x] 6.1 Cài đặt `node-cron` và tạo `src/cron/reservationCron.ts`
    - Thêm `node-cron` vào dependencies trong `package.json`
    - Implement `startReservationCronJobs()` khởi động 2 jobs: ReminderJob (every 15 min) và DeadlineJob (every 5 min)
    - Gọi `startReservationCronJobs()` trong `src/index.ts` (hoặc `server.ts`) sau khi server start
    - Mỗi job run được wrap trong try/catch, exception không kill server
    - _Requirements: 5.1, 10.3_

  - [x] 6.2 Implement `ReminderJob` logic
    - Query: `status = CONFIRMED`, `reminderSentAt IS NULL`, `time BETWEEN (now + 105min) AND (now + 135min)`, `restaurant.isActive = true`
    - Bỏ qua reservation status CANCELLED dù `reminderSentAt` null
    - Gửi `sendReservationReminderEmail()`, set `reminderSentAt = now` nếu thành công
    - Nếu fail lần 1: log `{attempt: 1, reservationId, failedAt}` vào metadata, không set `reminderSentAt` (retry lần sau)
    - Nếu retry fail: log `{attempt: 2, failedAt}`, đánh dấu `reminderFailed: true` trong metadata
    - Tenant isolation: lấy danh sách tenant từ `centralPrisma`, chạy trong context từng tenant
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 6.3 Viết property test cho reminder job identification correctness (Property 20)
    - **Property 20: Reminder Job Identification Correctness**
    - **Validates: Requirements 5.1, 5.3, 5.5**
    - Dùng `fast-check`: tạo tập reservation với các thuộc tính ngẫu nhiên, assert chỉ đúng subset được select

  - [ ]* 6.4 Viết property test cho reminder idempotence (Property 21)
    - **Property 21: Reminder Idempotence (reminderSentAt prevents duplicates)**
    - **Validates: Requirements 5.3**
    - Assert: reservation có `reminderSentAt != null` không bao giờ xuất hiện trong queue dù chạy N lần

  - [x] 6.5 Implement `DeadlineJob` logic
    - Query: `status = PENDING`, `paymentDeadline IS NOT NULL`, `paymentDeadline < now`
    - Gọi `cancel(id, 'SYSTEM')` với reason `'Payment deadline exceeded'`
    - Append `{cancelledReason, at}` vào metadata
    - Release table assignments: xóa `ReservationTable` records liên quan
    - Gửi cancellation email không blocking
    - Emit `RESERVATION_AUTO_CANCELLED` Socket.io event đến `restaurant_{restaurantId}`
    - _Requirements: 10.3, 10.4, 10.7, 10.8_

  - [ ]* 6.6 Viết property test cho payment deadline set on creation (Property 22)
    - **Property 22: Payment Deadline Set on Creation**
    - **Validates: Requirements 10.1**
    - Assert: `depositAmount > 0` → `paymentDeadline = createdAt + 30min` (±30s tolerance)

  - [ ]* 6.7 Viết property test cho payment deadline cleared after payment (Property 23)
    - **Property 23: Payment Deadline Cleared After Payment**
    - **Validates: Requirements 10.5**

  - [ ]* 6.8 Viết property test cho auto-cancel releases tables (Property 24)
    - **Property 24: Auto-Cancel Releases Tables**
    - **Validates: Requirements 10.8, 13.3**

- [x] 7. Backend — API Routes mới
  - [x] 7.1 Đăng ký các API routes mới trong reservation router
    - `GET /reservations/stats` (trước `/:id` để tránh Express match nhầm)
    - `PATCH /reservations/:id` với authMiddleware + requireRole
    - `POST /reservations/:id/complete` với authMiddleware + requireRole
    - Implement handler functions: `updateReservationHandler`, `getStatsHandler`, `completeReservationHandler`
    - Cập nhật `PaymentService.handleSePayWebhook` / `processMatchedPayment`: khi deposit payment COMPLETED, set `paymentDeadline = null`
    - _Requirements: 6.1, 8.1, 2.2, 10.5_

  - [ ]* 7.2 Viết unit tests cho các route handlers
    - Test `getStatsHandler` với invalid period → 400
    - Test `updateReservationHandler` với empty body → 400
    - Test `completeReservationHandler` với wrong status → 422

- [x] 8. Checkpoint — Backend hoàn chỉnh
  - Đảm bảo tất cả BE tests pass, ask the user if questions arise.

- [x] 9. Frontend — Mở rộng `reservationService.ts` và types
  - [x] 9.1 Thêm types và methods mới vào `lib/services/reservationService.ts`
    - Thêm interface `UpdateReservationDto`, `ReservationStats`, type `StatsPeriod`
    - Cập nhật interface `Reservation` thêm `completedAt?: string`, `metadata?: {qrCodeUrl?: string|null, statusHistory?: any[]}`
    - Thêm phương thức: `update(id, dto)`, `getStats(restaurantId, period)`, `complete(id)`
    - Thêm vào `API_ROUTES.RESERVATIONS`: `UPDATE`, `STATS`, `COMPLETE`
    - _Requirements: 6.10, 8.9, 2.2_

- [x] 10. Frontend — Component `StatsCards`
  - [x] 10.1 Tạo `components/reservations/StatsCards.tsx`
    - Hiển thị 5 summary cards: Tổng đặt bàn, Đã xác nhận, Đã check-in, Hoàn thành, Đã hủy
    - Hiển thị Check-in Rate (%) và Doanh thu cọc (VND)
    - Auto-refresh mỗi 5 phút dùng `setInterval`
    - Nếu refresh fail: giữ last values, hiển thị non-blocking warning "Không thể cập nhật số liệu"
    - Props: `restaurantId: string`
    - _Requirements: 8.9_

- [x] 11. Frontend — Component `PaymentDeadlineCountdown`
  - [x] 11.1 Tạo `components/reservations/PaymentDeadlineCountdown.tsx`
    - Props: `deadline: string` (ISO), `onExpired: () => void`
    - Update countdown mỗi giây dùng `setInterval`
    - Hiển thị MM:SS countdown
    - Ẩn khi `deadline` prop trở thành `null`/`undefined` (payment received)
    - Khi countdown về 0: gọi `onExpired()` và hiển thị toast cảnh báo
    - _Requirements: 10.6_

  - [ ]* 11.2 Viết unit test cho PaymentDeadlineCountdown
    - Test countdown hiển thị đúng format MM:SS
    - Test onExpired được gọi khi deadline qua

- [x] 12. Frontend — Component `QRScannerModal`
  - [x] 12.1 Tạo `components/reservations/QRScannerModal.tsx`
    - Sử dụng `getUserMedia` API để request camera access
    - Decode QR liên tục dùng `@zxing/library` hoặc `jsQR`
    - Validate decoded content với regex `^[0-9A-F]{6}$` trước khi submit
    - Nếu decoded không match: hiển thị "QR không hợp lệ. Vui lòng thử lại" và resume scanning
    - Auto-timeout sau 60 giây không decode được, hiển thị timeout message
    - Torch toggle nếu device hỗ trợ `torch` constraint
    - Viewfinder overlay + "Dùng mã thủ công" link → đóng scanner, mở manual form
    - Fallback: nếu camera permission denied hoặc unavailable → hiển thị manual text-entry form
    - Props: `onSuccess: (code: string) => void`, `onClose: () => void`
    - _Requirements: 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 3.6, 3.7_

  - [ ]* 12.2 Viết property test cho QR validation regex (Property 29 — FE side)
    - **Property 29: QR Code Content Validation**
    - **Validates: Requirements 9.4, 9.5**
    - Dùng `fast-check`: với string ngẫu nhiên, assert `validateQRContent` trả valid chỉ khi match `^[0-9A-F]{6}$`

- [x] 13. Frontend — Component `EditReservationForm`
  - [x] 13.1 Tạo `components/reservations/EditReservationForm.tsx`
    - Fields: `numberOfGuests` (input number, 1–50), `time` (DateTimePicker, phải là tương lai), `tableIds` (multi-select checkbox), `specialRequests` (textarea)
    - Gọi `reservationService.checkTables()` khi `time` hoặc `tableIds` thay đổi để re-check availability
    - Hiển thị lỗi conflict nếu tables không available
    - Submit gọi `reservationService.update(id, dto)`
    - Props: `reservation: Reservation`, `onSave: (updated: Reservation) => void`
    - _Requirements: 6.10_

- [x] 14. Frontend — Cập nhật `reservations/page.tsx`
  - [x] 14.1 Thêm filter states và DATE RANGE filter vào trang danh sách
    - Thêm `{ value: "CHECKED_IN", label: "Đã check-in" }` và `{ value: "COMPLETED", label: "Hoàn thành" }` vào `STATUS_OPTIONS`
    - Thêm `CHECKED_IN: "#6366f1"` và `COMPLETED: "#3b82f6"` vào `STATUS_COLOR`
    - Thêm state `dateRange` (kiểu `[Dayjs|null, Dayjs|null]`)
    - Render `DatePicker.RangePicker` với placeholder ["Từ ngày", "Đến ngày"], format "DD/MM/YYYY"
    - Validation: nếu `from > to`, hiển thị inline error "Ngày bắt đầu phải trước ngày kết thúc" và không submit
    - Auto re-filter khi date range thay đổi (debounce hoặc onChange)
    - Truyền `from`/`to` vào `reservationService.list()`
    - _Requirements: 2.6, 4.1, 4.2, 4.5, 4.6, 4.7, 4.8_

  - [ ]* 14.2 Viết property test cho date range validation (Property 18)
    - **Property 18: Date Range Validation**
    - **Validates: Requirements 4.7**
    - Dùng `fast-check`: với (d1, d2) ngẫu nhiên mà `from > to`, assert `validateDateRange` trả error message

  - [ ]* 14.3 Viết property test cho multi-filter AND composition (Property 19)
    - **Property 19: Multi-Filter AND Composition**
    - **Validates: Requirements 4.8**

  - [x] 14.4 Thêm `StatsCards` và "Hoàn thành" button vào `reservations/page.tsx`
    - Đặt `<StatsCards restaurantId={restaurantId} />` ở đầu trang, trên filter bar
    - Thêm "Hoàn thành" button cho row có `statusValue.code === "CHECKED_IN"`
    - Button gọi `reservationService.complete(id)`, sau đó `fetchData()`
    - _Requirements: 8.9, 2.2_

  - [ ]* 14.5 Viết unit test cho FE status filter (Requirements 2.6)
    - Test `STATUS_OPTIONS` bao gồm CHECKED_IN và COMPLETED
    - Test `STATUS_COLOR` có giá trị cho CHECKED_IN và COMPLETED

- [x] 15. Frontend — Cập nhật `reservations/[id]/page.tsx`
  - [x] 15.1 Thêm `EditReservationForm`, CHECKED_IN actions, và Refund info
    - Render `<EditReservationForm>` chỉ khi `statusValue.code ∈ {PENDING, CONFIRMED}`, hidden/readonly otherwise
    - Thêm handler `handleUpdate(dto)` gọi `reservationService.update()`
    - Thêm button "✓ Đóng reservation" cho CHECKED_IN → gọi `reservationService.complete()`
    - Nếu `res.refund` tồn tại: render `RefundInfoCard` với `amount`, `status`, `estimatedDays`
    - Thêm `CHECKED_IN` vào `STATUS_COLOR` map (màu `#6366f1`)
    - _Requirements: 6.10, 7.4, 2.2_

  - [x] 15.2 Thêm `QRScannerModal` vào `reservations/[id]/page.tsx`
    - Render nút "Quét QR Check-in" khi `statusValue.code === "CONFIRMED"`
    - Khi click: hiển thị `<QRScannerModal>`
    - Khi `onSuccess(code)`: gọi `reservationService.checkIn(code)`, cập nhật state
    - Hiển thị success banner với tên khách và bàn phân công (hoặc "Chưa phân bàn")
    - _Requirements: 3.6, 9.3, 9.7_

- [x] 16. Frontend — Cập nhật `reservations/new/page.tsx` (Step 3)
  - [x] 16.1 Thêm QR Code display và PaymentDeadlineCountdown vào Step 3
    - Sau khi tạo reservation thành công (`createdId` set), nếu `reservation.metadata?.qrCodeUrl` tồn tại: render `<img src={qrCodeUrl}>` với caption "Khách hàng có thể quét QR này để check-in"
    - Nếu `reservation.paymentDeadline` không null và `!depositPaid`: render `<PaymentDeadlineCountdown deadline={...} onExpired={...} />`
    - `onExpired`: gọi `showToast("warning", ...)` và optionally redirect
    - Lưu thêm `reservation` object vào state (hiện chỉ lưu `createdId` và `createdCode`)
    - _Requirements: 10.6, 9.1_

- [x] 17. Checkpoint — Frontend hoàn chỉnh
  - Đảm bảo tất cả FE components render đúng, không có lỗi TypeScript, ask the user if questions arise.

- [x] 18. Wiring và tích hợp end-to-end
  - [x] 18.1 Verify BE-FE integration cho toàn bộ luồng mới
    - Kiểm tra `API_ROUTES` có đủ endpoints: `UPDATE`, `STATS`, `COMPLETE`
    - Verify `reservationService.ts` (FE) gọi đúng endpoints BE
    - Verify `PaymentService` set `paymentDeadline = null` khi deposit COMPLETED
    - Verify Socket.io event `RESERVATION_AUTO_CANCELLED` được emit và FE có thể nhận (nếu có listener)
    - _Requirements: tất cả_

  - [ ]* 18.2 Viết property test cho date range filter correctness (Property 17)
    - **Property 17: Date Range Filter Correctness**
    - **Validates: Requirements 4.2, 4.3, 4.4**
    - Dùng `fast-check`: generate tập reservations với `time` ngẫu nhiên, apply filter, assert chỉ đúng subset được trả về

- [x] 19. Final checkpoint — Đảm bảo tất cả tests pass
  - Đảm bảo tất cả tests pass, ask the user if questions arise.

---

## Notes

- Tasks đánh dấu `*` là optional, có thể bỏ qua để đạt MVP nhanh hơn
- Mỗi task tham chiếu requirements cụ thể để đảm bảo traceability
- Các property tests dùng `fast-check` với `numRuns ≥ 100` (một số ≥ 200–500 như được chỉ định)
- Tag mỗi property test với format: `// Feature: reservation-enhancement, Property N: <text>`
- Cài đặt `fast-check` trước khi viết property tests: `pnpm add -D fast-check` (BE) và FE nếu cần
- Backend cron jobs cần tenant isolation — lấy danh sách từ `centralPrisma` và chạy trong `prismaStorage.run(tenantPrisma, ...)`
- Route `/reservations/stats` PHẢI đăng ký trước `/:id` trong Express router

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "5.1", "9.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.1", "5.2", "5.3"] },
    { "id": 3, "tasks": ["3.2", "3.3", "3.5", "4.7", "10.1", "11.1"] },
    { "id": 4, "tasks": ["3.4", "3.6", "3.7", "4.1", "4.4", "4.8", "4.9", "4.10", "6.1", "12.1", "13.1"] },
    { "id": 5, "tasks": ["4.2", "4.3", "4.5", "4.6", "6.2", "6.6", "7.1", "11.2", "12.2"] },
    { "id": 6, "tasks": ["4.7", "6.3", "6.4", "6.5", "6.7", "6.8", "7.2", "14.1"] },
    { "id": 7, "tasks": ["14.2", "14.3", "14.4", "15.1", "15.2", "16.1"] },
    { "id": 8, "tasks": ["14.5", "18.1"] },
    { "id": 9, "tasks": ["18.2"] }
  ]
}
```
