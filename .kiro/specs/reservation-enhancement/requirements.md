# Requirements Document — Reservation Enhancement

## Introduction

Tài liệu này mô tả yêu cầu nâng cấp chức năng đặt bàn trước (reservation) của nền tảng XFOODI. Hệ thống hiện tại đã có luồng 4 bước cơ bản, thanh toán cọc qua QR/tiền mặt, và giao diện quản lý cho nhà hàng. Bản nâng cấp này giải quyết 10 vấn đề được phát hiện: thiếu email notification, thiếu trạng thái CHECKED_IN / COMPLETED, check-in logic sai, thiếu date range filter, thiếu reminder cron job, không có chức năng chỉnh sửa reservation, không xử lý hoàn cọc khi hủy, thiếu thống kê dashboard, không hỗ trợ QR check-in, và trường `paymentDeadline` chưa được sử dụng.

---

## Glossary

- **Reservation_Service**: Module backend Node.js/Express/Prisma xử lý toàn bộ logic đặt bàn.
- **Notification_Service**: Module gửi email/SMS thông báo đến khách hàng.
- **Reminder_Job**: Cron job chạy định kỳ để gửi nhắc nhở trước giờ đặt bàn và enforce payment deadline.
- **Statistics_Service**: Module tổng hợp và trả về số liệu thống kê reservation cho dashboard.
- **QR_Scanner**: Component frontend đọc mã QR từ camera thiết bị.
- **Confirmation_Code**: Mã 6 ký tự hex uppercase dùng để xác nhận và check-in reservation (ví dụ: "A1B2C3", regex: `^[0-9A-F]{6}$`).
- **Deposit**: Số tiền cọc tính theo công thức 25.000đ × số chỗ ngồi (khi chọn bàn) hoặc × số khách.
- **Payment_Deadline**: Thời hạn thanh toán cọc; sau thời hạn này reservation PENDING bị tự động hủy.
- **PENDING**: Trạng thái ban đầu khi reservation vừa được tạo, chưa xác nhận và chờ cọc.
- **CONFIRMED**: Trạng thái sau khi nhà hàng phê duyệt hoặc cọc đã được thanh toán.
- **CHECKED_IN**: Trạng thái khi khách đã đến và check-in thành công tại nhà hàng.
- **COMPLETED**: Trạng thái cuối khi bữa ăn kết thúc và nhà hàng đóng reservation.
- **CANCELLED**: Trạng thái khi reservation bị hủy bởi khách hoặc nhà hàng.
- **Restaurant_Staff**: Nhân viên hoặc chủ nhà hàng sử dụng trang quản lý.
- **Customer**: Khách hàng thực hiện đặt bàn qua giao diện công khai.
- **Refund**: Hoàn trả tiền cọc khi reservation bị hủy sau khi đã thanh toán cọc.
- **Dashboard**: Trang tổng quan dành cho Restaurant_Staff hiển thị số liệu thống kê.
- **SePay**: Cổng thanh toán chuyển khoản ngân hàng tích hợp qua webhook.
- **statusHistory**: Trường JSON trong reservation metadata lưu lịch sử chuyển trạng thái, mỗi entry gồm `{from, to, at: ISO-8601 UTC, by}`.

---

## Requirements

---

### Requirement 1: Email Notification Sau Khi Đặt Bàn Thành Công

**User Story:** Là một Customer, tôi muốn nhận email xác nhận sau khi đặt bàn thành công, để tôi có thể lưu lại thông tin đặt bàn và mã xác nhận mà không cần truy cập lại ứng dụng.

#### Acceptance Criteria

1. WHEN a reservation is created successfully, THE Notification_Service SHALL send a confirmation email to the customer's email address within 30 seconds.
2. WHEN sending the confirmation email, THE Notification_Service SHALL include the Confirmation_Code, reservation date and time, number of guests, restaurant name, and deposit amount; IF the reservation has at least one table assigned, THE Notification_Service SHALL also include the table assignment(s).
3. IF the customer's email address fails the valid email format check (RFC 5321) or the email delivery fails after 3 attempts, THEN THE Notification_Service SHALL create an error record containing the reservation ID, email address, failure reason, and timestamp, and mark the notification as FAILED without rolling back the reservation.
4. THE Notification_Service SHALL send all emails in Vietnamese.
5. WHEN a reservation status changes to CANCELLED, THE Notification_Service SHALL send a cancellation email to the customer within 30 seconds, including the Confirmation_Code, reservation date and time, number of guests, restaurant name, deposit amount, and cancellation timestamp.
6. WHERE the restaurant has configured a custom email template, THE Notification_Service SHALL use the restaurant's template instead of the default template; the custom template MUST include all mandatory fields listed in criterion 2.
7. IF a notification delivery fails on the first attempt, THE Notification_Service SHALL retry up to 2 additional times (3 attempts total) with at least 10 seconds between attempts before marking the notification as FAILED.

---

### Requirement 2: Trạng Thái CHECKED_IN và COMPLETED

**User Story:** Là một Restaurant_Staff, tôi muốn có trạng thái riêng biệt cho từng giai đoạn phục vụ (CHECKED_IN, COMPLETED), để tôi có thể theo dõi chính xác vòng đời của mỗi reservation từ khi khách đến đến khi kết thúc bữa ăn.

#### Acceptance Criteria

1. THE Reservation_Service SHALL support exactly five reservation status codes: PENDING, CONFIRMED, CHECKED_IN, COMPLETED, and CANCELLED.
2. THE Reservation_Service SHALL enforce the following valid status transitions:
   - PENDING → CONFIRMED (nhà hàng phê duyệt hoặc cọc được thanh toán)
   - PENDING → CANCELLED (nhà hàng hoặc khách hủy trước khi xác nhận)
   - CONFIRMED → CHECKED_IN (Restaurant_Staff thực hiện check-in khi khách đến)
   - CONFIRMED → CANCELLED (Restaurant_Staff hủy sau khi xác nhận)
   - CHECKED_IN → COMPLETED (Restaurant_Staff đóng reservation sau khi phục vụ xong)
   - CHECKED_IN → CANCELLED (trường hợp ngoại lệ, do Restaurant_Staff thực hiện)
3. IF a status transition request is not in the allowed set above, THEN THE Reservation_Service SHALL return HTTP 422 with a JSON body `{ "error": "Invalid transition", "from": "<current_status>", "to": "<requested_status>" }`.
4. WHEN a reservation status changes, THE Reservation_Service SHALL append an entry `{ "from": "<old>", "to": "<new>", "at": "<ISO-8601 UTC>", "by": "<actorId>" }` to the `statusHistory` array in the reservation metadata field.
5. WHEN the reservation status changes to COMPLETED, THE Reservation_Service SHALL set the `completedAt` field to the current UTC timestamp on the reservation record.
6. WHERE the frontend filter panel is displayed, THE System SHALL include CHECKED_IN and COMPLETED as selectable filter options alongside the existing PENDING, CONFIRMED, and CANCELLED options.

---

### Requirement 3: Check-In Logic Chính Xác

**User Story:** Là một Restaurant_Staff, tôi muốn check-in khách bằng mã xác nhận hoặc QR code và chuyển reservation sang trạng thái CHECKED_IN (không phải CONFIRMED), để tôi có thể phân biệt rõ ràng giữa "đã xác nhận lịch" và "khách đang có mặt tại nhà hàng".

#### Acceptance Criteria

1. WHEN the check-in endpoint receives a non-empty Confirmation_Code that exactly matches a reservation scoped to the authenticated staff's restaurant AND the reservation has status CONFIRMED, THE Reservation_Service SHALL set the reservation status to CHECKED_IN and record the `checkedInAt` timestamp as the current UTC time.
2. IF the check-in endpoint receives a Confirmation_Code that matches a reservation with status CHECKED_IN (already checked in), THEN THE Reservation_Service SHALL return HTTP 409 with the message "Khách đã check-in rồi".
3. IF the check-in endpoint receives a Confirmation_Code that matches a reservation with status other than CONFIRMED or CHECKED_IN, THEN THE Reservation_Service SHALL return HTTP 422 with the message "Chỉ có thể check-in reservation ở trạng thái CONFIRMED".
4. IF the check-in endpoint receives a Confirmation_Code that does not match any reservation in the authenticated staff's restaurant, THEN THE Reservation_Service SHALL return HTTP 404 with the message "Không tìm thấy đặt bàn".
5. WHEN the check-in is performed successfully, THE Notification_Service SHALL attempt to send a welcome email to the customer within 60 seconds; IF the email delivery fails, the check-in result SHALL be preserved and the staff interface SHALL display a non-blocking warning that the notification could not be delivered.
6. WHEN the QR_Scanner component decodes a QR code and submits it to the check-in endpoint, THE System SHALL display a success banner showing the customer's full name and table assignment(s); IF no table has been assigned, THE System SHALL display "Chưa phân bàn" in place of the table assignment.
7. IF the device camera is unavailable or camera permission is denied, THEN THE System SHALL display a fallback manual text-entry form pre-populated with an empty Confirmation_Code input field.

---

### Requirement 4: Date Range Filter Trên Danh Sách Reservation

**User Story:** Là một Restaurant_Staff, tôi muốn lọc danh sách reservation theo khoảng ngày (từ ngày – đến ngày), để tôi có thể tìm nhanh các reservation trong một kỳ cụ thể mà không cần cuộn qua hàng trăm bản ghi.

#### Acceptance Criteria

1. THE System SHALL display a date range picker with "Từ ngày" and "Đến ngày" fields on the reservation list page alongside the existing status filter and search box.
2. WHEN both "Từ ngày" and "Đến ngày" fields contain valid date values, THE Reservation_Service SHALL return only reservations whose `time` field falls within the interval [fromDate 00:00:00 UTC+7, toDate 23:59:59 UTC+7].
3. IF only "Từ ngày" is provided, THEN THE Reservation_Service SHALL return reservations from fromDate 00:00:00 UTC+7 onwards with no upper date bound applied.
4. IF only "Đến ngày" is provided, THEN THE Reservation_Service SHALL return reservations up to toDate 23:59:59 UTC+7 with no lower date bound applied.
5. WHEN either date field value changes, THE System SHALL automatically re-apply the filter and refresh the list within 500ms, provided the currently entered values do not violate the validation rule in criterion 7.
6. WHEN both date fields are cleared (empty), THE Reservation_Service SHALL return reservations without any date constraints, subject to other active filters.
7. IF "Từ ngày" is later than "Đến ngày", THEN THE System SHALL display an inline validation error "Ngày bắt đầu phải trước ngày kết thúc" and SHALL NOT submit the filter request.
8. THE Reservation_Service SHALL apply the date range filter in combination with the status filter and search text simultaneously as AND conditions.

---

### Requirement 5: Reminder Notification Trước Giờ Đặt Bàn

**User Story:** Là một Customer, tôi muốn nhận email nhắc nhở trước giờ đặt bàn 2 tiếng, để tôi không quên lịch hẹn và đến đúng giờ.

#### Acceptance Criteria

1. THE Reminder_Job SHALL run every 15 minutes to identify reservations with status CONFIRMED whose `time` is between 105 and 135 minutes from the current server time (UTC) and whose `reminderSentAt` is NULL.
2. WHEN a reservation is identified by the Reminder_Job, THE Notification_Service SHALL send a reminder email to the customer containing the reservation time, restaurant name, and Confirmation_Code; IF the reservation has at least one table assigned, the email SHALL include the table assignment(s); otherwise the table assignment field SHALL be omitted.
3. IF `reminderSentAt` is NOT NULL for a reservation, THE Reminder_Job SHALL NOT send a reminder email for that reservation, regardless of the reservation's current status.
4. IF the reminder email delivery fails on the first attempt, THE Reminder_Job SHALL retry once on the next scheduled run and log a second failure entry with the reservation ID if the retry also fails.
5. IF a reservation's restaurant has `isActive = false`, THE Reminder_Job SHALL NOT send a reminder email for that reservation.
6. IF a reservation's status is CANCELLED at the time the Reminder_Job runs, THE Reminder_Job SHALL NOT send a reminder email for that reservation even if `reminderSentAt` is NULL.

---

### Requirement 6: Chỉnh Sửa Reservation Sau Khi Đặt

**User Story:** Là một Customer hoặc Restaurant_Staff, tôi muốn có thể chỉnh sửa số khách, bàn được chọn, hoặc thời gian của một reservation chưa check-in, để tôi có thể điều chỉnh kế hoạch mà không cần hủy và đặt lại.

#### Acceptance Criteria

1. THE Reservation_Service SHALL expose a PATCH endpoint `PATCH /reservations/:id` that accepts a JSON body with zero or more of the following fields: `numberOfGuests` (integer ≥ 1, ≤ 50), `time` (ISO-8601 string, must be in the future relative to the request time), `tableIds` (array of strings), and `specialRequests` (string).
2. WHEN an update request is received for a reservation with status PENDING or CONFIRMED, THE Reservation_Service SHALL validate the new values using the rules in criterion 1 and persist the changes.
3. IF an update request body is empty or contains no recognized fields, THEN THE Reservation_Service SHALL return HTTP 400 with the message "No valid fields provided for update".
4. IF an update request is received from a user who is neither the reservation's Customer nor an authenticated Restaurant_Staff for the reservation's restaurant, THEN THE Reservation_Service SHALL return HTTP 403.
5. IF an update request is received for a reservation with status CHECKED_IN, COMPLETED, or CANCELLED, THEN THE Reservation_Service SHALL return HTTP 422 with the message "Không thể chỉnh sửa reservation ở trạng thái hiện tại".
6. WHEN the `time` or `tableIds` fields are present in the update request, THE Reservation_Service SHALL re-run the availability check with the ±90-minute buffer using the updated values (excluding the current reservation from the conflict check) before persisting the change.
7. IF the requested new tables are not available due to conflict within the ±90-minute buffer, THEN THE Reservation_Service SHALL return HTTP 409 with a JSON body `{ "error": "Tables not available", "conflictingReservationIds": [...] }`.
8. WHEN `numberOfGuests` or `tableIds` changes, THE Reservation_Service SHALL recalculate `depositAmount`: if the updated tableIds array is non-empty, use SUM(seatingCapacity × 25.000đ); otherwise use numberOfGuests × 25.000đ.
9. WHEN a reservation is successfully updated, THE Notification_Service SHALL send a modification confirmation email to the customer within 30 seconds.
10. THE System SHALL display an edit form on the reservation detail page that is visible and interactive only when the reservation status is PENDING or CONFIRMED; the form SHALL be hidden or read-only for all other statuses.

---

### Requirement 7: Hoàn Cọc Khi Hủy Reservation

**User Story:** Là một Customer, tôi muốn được hoàn trả tiền cọc khi hủy reservation trong các điều kiện hợp lệ, để tôi không bị mất tiền oan khi có lý do chính đáng phải hủy.

#### Acceptance Criteria

1. WHEN a cancellation request is received for a reservation that has at least one Payment with status COMPLETED and purpose DEPOSIT, THE Reservation_Service SHALL atomically create a Refund record (linked to all such Payments) with `status = PENDING` and `amount = MAX(0, totalDepositPaid - cancellationFee)`, then set the reservation status to CANCELLED.
2. IF a cancellation request is received for a reservation with no completed deposit payments, THEN THE Reservation_Service SHALL set the reservation status to CANCELLED without creating a Refund record.
3. WHEN a refund record is created, THE Notification_Service SHALL send a refund notification email to the customer within 30 seconds, including the refund amount and the estimated refund processing timeline in business days.
4. IF a Refund record exists for a reservation, THE System SHALL display the refund amount and refund status on the reservation detail page.
5. WHERE a restaurant's metadata defines a `cancellationFeePercent` (a number in [0, 100]), THE Reservation_Service SHALL compute `cancellationFee = FLOOR(totalDepositPaid × cancellationFeePercent / 100)` and ensure the resulting refund amount is ≥ 0.
6. IF the cancellation is initiated at a time that is less than 2 hours before the reservation `time`, OR at or after the reservation `time`, THEN THE Reservation_Service SHALL apply a 100% cancellation fee (refund amount = 0) and store `{ "cancellation_timestamp": "<ISO-8601 UTC>", "fee_percentage": 100, "fee_reason": "Late cancellation" }` in the Refund record metadata.
7. WHERE no `cancellationFeePercent` is defined in the restaurant metadata AND the cancellation does not trigger the late-cancellation rule, THE Reservation_Service SHALL apply a 0% cancellation fee (full refund).
8. IF the Refund record fails to persist due to a database error, THEN THE Reservation_Service SHALL return HTTP 500 without changing the reservation status, and log the error with the reservation ID.

---

### Requirement 8: Thống Kê Reservation Trên Dashboard

**User Story:** Là một Restaurant_Staff, tôi muốn xem số liệu thống kê reservation ngay trên dashboard (hôm nay, tuần này, tỷ lệ check-in, doanh thu cọc), để tôi có cái nhìn nhanh về hiệu suất đặt bàn mà không cần lọc thủ công.

#### Acceptance Criteria

1. THE Statistics_Service SHALL expose `GET /reservations/stats?restaurantId=:id&period=:period` where `period` accepts exactly the values: `today`, `this_week`, `this_month`.
2. THE Statistics_Service SHALL return a JSON object with the following fields for the requested period: `totalReservations`, `confirmedCount` (CONFIRMED or CHECKED_IN), `checkedInCount` (CHECKED_IN), `completedCount` (COMPLETED), `cancelledCount` (CANCELLED), `checkInRate` (see criterion 7), `totalDepositCollected` (sum of Payment amounts where status = COMPLETED and purpose = DEPOSIT).
3. WHEN the period is `today`, THE Statistics_Service SHALL count reservations whose `time` falls within [00:00:00, 23:59:59] of the current date in UTC+7.
4. WHEN the period is `this_week`, THE Statistics_Service SHALL count reservations whose `time` falls within the current Monday 00:00:00 to Sunday 23:59:59 in UTC+7.
5. WHEN the period is `this_month`, THE Statistics_Service SHALL count reservations whose `time` falls within the first and last day of the current month in UTC+7.
6. IF the `period` parameter is missing or contains a value other than `today`, `this_week`, or `this_month`, THEN THE Statistics_Service SHALL return HTTP 400 with the message "Invalid period. Accepted values: today, this_week, this_month".
7. IF `restaurantId` does not correspond to an existing restaurant, THEN THE Statistics_Service SHALL return HTTP 404.
8. IF `totalReservations - cancelledCount` equals 0, THEN THE Statistics_Service SHALL return `checkInRate` as `0.0`; otherwise `checkInRate = ROUND(checkedInCount / (totalReservations - cancelledCount) × 100, 1)`.
9. THE Dashboard SHALL display the statistics as summary cards at the top of the reservation management page; on initial load THE System SHALL fetch the stats immediately; THE System SHALL refresh the stats automatically every 5 minutes; IF the refresh request fails, THE System SHALL retain the last successfully loaded values and display a non-blocking "Không thể cập nhật số liệu" warning.

---

### Requirement 9: QR Check-In

**User Story:** Là một Restaurant_Staff, tôi muốn check-in khách bằng cách quét QR code thay vì nhập tay mã xác nhận, để quy trình check-in nhanh hơn và giảm sai sót khi gõ.

#### Acceptance Criteria

1. THE System SHALL generate a QR code embedding the Confirmation_Code for each reservation and display it on the reservation confirmation page (Step 3 of the booking flow) and in the confirmation email.
2. WHEN a reservation is created successfully, THE Reservation_Service SHALL generate a QR code URL (using the VietQR or equivalent service) containing only the Confirmation_Code and store it in the reservation's `metadata.qrCodeUrl` field.
3. WHEN the "Quét QR Check-in" button is clicked, THE QR_Scanner component SHALL request camera access and, upon permission grant, begin continuously decoding camera frames; THE scanner SHALL stop automatically after 60 seconds of inactivity with no successful decode and display a timeout message.
4. WHEN the QR_Scanner decodes content that matches `^[0-9A-F]{6}$`, THE System SHALL automatically submit the Confirmation_Code to the check-in endpoint and display the result to the staff without requiring further confirmation.
5. IF the decoded QR code content does not match `^[0-9A-F]{6}$`, THEN THE System SHALL display the error "QR không hợp lệ. Vui lòng thử lại" and resume scanning.
6. WHILE the QR_Scanner is active AND the device supports the torch/flashlight API, THE System SHALL display a torch toggle button; WHEN the toggle is activated, THE System SHALL enable the device torch to improve scanning in low-light conditions.
7. WHEN the QR_Scanner is active, THE System SHALL display a viewfinder overlay indicating the scanning area and a "Dùng mã thủ công" link that, when clicked, closes the scanner and opens the manual text-entry check-in form.
8. IF camera permission is denied or the camera hardware is unavailable, THE System SHALL display the manual text-entry check-in form directly without showing the QR_Scanner.
9. IF QR code generation fails during reservation creation, THE Reservation_Service SHALL log the error, leave `metadata.qrCodeUrl` as null, and continue to complete the reservation creation without error.

---

### Requirement 10: Payment Deadline Enforcement

**User Story:** Là một Restaurant_Staff, tôi muốn hệ thống tự động hủy các reservation PENDING chưa thanh toán cọc sau khi hết hạn thanh toán, để các bàn được giải phóng cho khách khác đặt thay vì bị giữ vô thời hạn.

#### Acceptance Criteria

1. WHEN a reservation is created with `depositAmount > 0`, THE Reservation_Service SHALL set `paymentDeadline` to the current UTC time plus 30 minutes.
2. WHEN a reservation is created with `depositAmount = 0`, THE Reservation_Service SHALL set `paymentDeadline` to null.
3. THE Reminder_Job SHALL check every 5 minutes for reservations with status PENDING whose `paymentDeadline` is not null and is earlier than the current UTC time.
4. WHEN an overdue PENDING reservation is identified, THE Reservation_Service SHALL transition the reservation status to CANCELLED and append `{ "cancelledReason": "Payment deadline exceeded", "at": "<ISO-8601 UTC>" }` to the reservation metadata.
5. WHEN a deposit payment is confirmed (Payment status changes to COMPLETED), THE Reservation_Service SHALL update `paymentDeadline` to null on the corresponding reservation.
6. IF a reservation's `paymentDeadline` is not null and is within the next 10 minutes from the current time, THE System SHALL display a countdown timer on the booking confirmation page showing the remaining time in MM:SS format; IF `paymentDeadline` becomes null while the timer is active (payment received), THE System SHALL hide the timer immediately.
7. WHEN a reservation is auto-cancelled due to payment deadline expiry, THE Notification_Service SHALL send a cancellation notification email to the customer within 60 seconds, including the reservation identifier and the reason "Hết hạn thanh toán cọc".
8. WHEN a reservation is auto-cancelled due to payment deadline expiry, THE Reservation_Service SHALL release all table assignments linked to that reservation, making those tables immediately available for new reservations at overlapping times.

---

### Requirement 11: Deposit Calculation Invariants

**User Story:** Là một hệ thống, tôi cần đảm bảo công thức tính cọc luôn nhất quán bất kể số bàn hay số khách được cung cấp, để tránh tình trạng tính sai tiền cọc gây tranh chấp với khách.

#### Acceptance Criteria

1. WHEN at least one tableId is provided, THE Reservation_Service SHALL calculate `depositAmount` as SUM(seatingCapacity_i × 25000) for all selected tables.
2. WHEN no tableIds are provided, THE Reservation_Service SHALL calculate `depositAmount` as `numberOfGuests × 25000`.
3. THE Reservation_Service SHALL NOT persist a reservation with `depositAmount < 0`; IF the calculation yields a negative value, THE Reservation_Service SHALL throw an internal error and return HTTP 500.
4. WHEN the deposit is recalculated after editing a reservation, THE Reservation_Service SHALL produce the same `depositAmount` as if the reservation had been created fresh with the updated values (idempotent recalculation).
5. FOR ALL valid reservation inputs (numberOfGuests ≥ 1, seatingCapacity ≥ 1, unitPrice = 25000), THE Reservation_Service SHALL produce a `depositAmount` that equals `numberOfGuests × 25000` (no-table case) or `SUM(seatingCapacity_i × 25000)` (with-table case), satisfying the linear scaling invariant.

---

### Requirement 12: Confirmation Code Uniqueness và Format

**User Story:** Là một hệ thống, tôi cần đảm bảo mỗi Confirmation_Code là duy nhất và đúng định dạng, để tránh nhầm lẫn giữa các reservation và đảm bảo check-in hoạt động chính xác.

#### Acceptance Criteria

1. THE Reservation_Service SHALL generate a Confirmation_Code consisting of exactly 6 uppercase hexadecimal characters matching the regex `^[0-9A-F]{6}$`.
2. THE Reservation_Service SHALL verify the uniqueness of the generated Confirmation_Code across all reservations in the tenant database before persisting the reservation.
3. IF a generated Confirmation_Code already exists in the database, THEN THE Reservation_Service SHALL regenerate and re-verify until a unique code is found, with a maximum of 10 attempts.
4. IF 10 regeneration attempts all result in collisions, THEN THE Reservation_Service SHALL return HTTP 500 with the message "Unable to generate unique confirmation code. Please try again."
5. FOR ALL created reservations, encoding the Confirmation_Code bytes back to uppercase hex SHALL reproduce the original Confirmation_Code (round-trip property: hex → bytes → hex === original).

---

### Requirement 13: Availability Check Correctness

**User Story:** Là một Customer, tôi muốn hệ thống chỉ cho tôi đặt những bàn thực sự trống trong khoảng thời gian tôi chọn, để tôi không bị từ chối khi đến nhà hàng vì bàn đã được đặt bởi người khác.

#### Acceptance Criteria

1. WHEN checking table availability for a given time T and `restaurantId`, THE Reservation_Service SHALL exclude all tables assigned to reservations with status NOT IN (CANCELLED) whose `time` falls within [T − 90 minutes, T + 90 minutes].
2. THE Reservation_Service SHALL return only tables where `seatingCapacity ≥ numberOfGuests` AND `isActive = true`.
3. WHEN a reservation is cancelled, THE Reservation_Service SHALL make the previously assigned tables immediately available for new reservations at overlapping times.
4. FOR ALL pairs of non-cancelled reservations (R1, R2) at the same restaurant assigned to the same table, the absolute difference between R1.time and R2.time SHALL be greater than 90 minutes.
5. WHEN the availability check is called twice with the same parameters and no intervening reservation changes occur between the two calls, THE Reservation_Service SHALL return the same set of available table IDs (idempotent read).
