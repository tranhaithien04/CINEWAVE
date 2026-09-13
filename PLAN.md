# Kế hoạch hệ thống đặt vé xem phim + xác minh độ tuổi qua CCCD (YOLO + OCR)

## 1. Tổng quan

Xây dựng nền tảng **đặt vé xem phim online** với luồng nghiệp vụ chuẩn (chọn phim → suất → ghế → thanh toán → nhận vé), kèm **kiểm soát độ tuổi** theo phân loại phim (P / T13 / T16 / T18) dựa trên **Căn cước công dân (CCCD) Việt Nam**.

Luồng xác minh tuổi:

1. Người dùng upload / chụp ảnh mặt trước CCCD.
2. **YOLO** phát hiện vùng thẻ và các ROI (ảnh chân dung, số CCCD, họ tên, ngày sinh…).
3. **OCR** đọc text từ các ROI đã crop.
4. Hệ thống parse **ngày sinh**, tính tuổi tại thời điểm suất chiếu, so khớp với mức tuổi yêu cầu của phim.
5. Chỉ cho phép tiếp tục đặt vé nếu đủ điều kiện; lưu **bằng chứng xác minh** (không lưu ảnh CCCD thô lâu dài nếu không bắt buộc).

---

## 2. Mục tiêu sản phẩm

| Mục tiêu | Mô tả |
|---|---|
| Đặt vé end-to-end | Browse phim, chọn rạp/suất/ghế, thanh toán, nhận mã QR vé |
| Kiểm soát độ tuổi | Chặn đặt vé phim hạn chế tuổi nếu CCCD không đủ tuổi |
| UX mượt | Next.js App Router, Tailwind, shadcn/ui, toast feedback |
| An toàn dữ liệu | Ảnh CCCD xử lý tạm, mã hóa, TTL xóa; tuân thủ nguyên tắc tối thiểu dữ liệu |
| Mở rộng | Tách service AI (YOLO/OCR) khỏi API nghiệp vụ |

---

## 3. Tech stack đề xuất

### Frontend
- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Lucide React** (icon)
- **Sonner** hoặc **react-hot-toast** (toast)
- **Zustand** hoặc **React Query (TanStack Query)** cho state/server cache
- **Zod** + **React Hook Form** cho form validation
- **QRCode** (hiển thị mã vé)

### Backend
- **Node.js** + **NestJS** *hoặc* **Express/Fastify** (khuyến nghị NestJS nếu muốn cấu trúc rõ module)
- Có thể dùng **Next.js Route Handlers** cho phần nhẹ; **service riêng** cho AI/OCR nặng
- **Prisma** + **MySQL**
- **Redis** (session, rate limit, hold ghế tạm — optional cache; `SeatLock` MySQL là source of truth)
- **JWT** + refresh token / cookie httpOnly
- **Multer** / upload tạm (disk hoặc S3-compatible) cho ảnh CCCD
- **BullMQ** (queue) cho job OCR nếu xử lý async

### AI / Computer Vision
- **YOLOv8 / YOLOv11** (Ultralytics) — detect card + ROI fields trên CCCD
- **OCR**: **PaddleOCR** (ưu tiên tiếng Việt) hoặc **EasyOCR** / **Tesseract** (fallback)
- Service Python riêng (FastAPI) gọi từ Node qua HTTP/gRPC
- Optional: anti-spoof / blur / glare check trước khi OCR

### Hạ tầng & công cụ
- Docker Compose (MySQL, Redis, API, AI service, web)
- Cloudinary / MinIO / S3 cho media phim (không dùng cho CCCD lâu dài)
- VNPay / MoMo / Stripe (sandbox) cho thanh toán
- ESLint, Prettier, Vitest / Jest, Playwright (E2E)

---

## 4. Kiến trúc tổng thể

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────────┐
│  Next.js Web    │────▶│  Node API        │────▶│  MySQL             │
│  (UI + BFF)     │     │  (Express)       │     │  Redis (hold cache) │
└────────┬────────┘     └────────┬─────────┘     └────────────────────┘
         │                       │
         │ upload CCCD           │ verify-age job
         ▼                       ▼
                ┌────────────────────────────┐
                │  AI Service (Python)       │
                │  YOLO detect → crop ROI    │
                │  OCR → parse DOB/name/ID   │
                │  return age + confidence   │
                └────────────────────────────┘
```

**Nguyên tắc:**
- Web không gọi trực tiếp model YOLO/OCR.
- API nghiệp vụ orchestrate: nhận ảnh → gọi AI → quyết định pass/fail → ghi audit log.
- Ảnh CCCD lưu tạm (ví dụ 15 phút) rồi xóa; chỉ giữ metadata xác minh (hash, tuổi đã tính, timestamp, result).

---

## 5. Phân loại độ tuổi phim (Việt Nam — tham chiếu)

| Mã | Ý nghĩa | Điều kiện đặt vé (đề xuất) |
|---|---|---|
| P | Phổ biến | Không cần xác minh tuổi |
| K | Khuyến cáo có người lớn đi kèm (trẻ em) | Tùy policy rạp; có thể bỏ qua CCCD |
| T13 | Cấm dưới 13 | Tuổi ≥ 13 |
| T16 | Cấm dưới 16 | Tuổi ≥ 16 |
| T18 | Cấm dưới 18 | Tuổi ≥ 18 |

**Lưu ý pháp lý:** Cần đối chiếu quy định Cục Điện ảnh / chính sách rạp thực tế khi triển khai production. Plan này dùng mapping trên làm baseline kỹ thuật.

**Thời điểm tính tuổi:** Theo **ngày chiếu** (showtime), không chỉ theo ngày đặt.

---

## 6. Luồng người dùng chính

### 6.1 Đặt vé cơ bản
1. Trang chủ / danh sách phim đang chiếu & sắp chiếu
2. Chi tiết phim (trailer, rating tuổi, thời lượng, diễn viên)
3. Chọn rạp → ngày → suất chiếu
4. Chọn ghế (sơ đồ ghế realtime / near-realtime)
5. **Gate xác minh tuổi** (nếu rating ≥ T13)
6. Thanh toán
7. Xuất vé + QR + email/SMS (optional)

### 6.2 Xác minh CCCD (YOLO + OCR)
1. User mở modal/camera: “Xác minh độ tuổi”
2. Upload ảnh rõ, đủ sáng, không bị cắt góc
3. Client validate kích thước/MIME; hiện toast hướng dẫn nếu ảnh kém
4. API nhận ảnh → AI service:
   - YOLO detect `id_card`
   - Detect/crop ROI: `dob`, `id_number`, `full_name`, `portrait` (optional)
   - OCR từng ROI
   - Regex/normalize ngày sinh (`DD/MM/YYYY`)
   - Tính tuổi theo showtime
5. Response:
   - `passed: true/false`
   - `age`, `requiredAge`, `confidence`
   - `reasons[]` (mờ, không detect thẻ, OCR thấp, chưa đủ tuổi…)
6. UI toast:
   - Thành công → cho qua bước thanh toán
   - Thất bại → hướng dẫn chụp lại / chọn phim khác

### 6.3 Hold ghế
- Khi chọn ghế: tạo booking `HELD` + Redis/`SeatLock` TTL 5–10 phút (chi tiết mục **8**)
- Hết hạn → job nền giải phóng ghế + toast cảnh báo phía client
- User có thể release sớm hoặc extend-hold (giới hạn số lần)

---

## 7. Module chức năng

### A. Auth & User
- Đăng ký / đăng nhập (email hoặc phone)
- Hồ sơ người dùng
- Lịch sử đặt vé
- (Optional) Lưu trạng thái “đã xác minh tuổi trong phiên” — **không** lưu số CCCD plaintext

### B. Catalog
- Phim, thể loại, trailer, poster
- Rạp, phòng chiếu, layout ghế
- Suất chiếu, giá vé theo loại ghế / khung giờ

### C. Booking (chi tiết ở mục 8)
- Seat map, hold / extend / release
- Tính giá, tạo đơn, thanh toán + webhook + đối soát
- Hủy vé / hoàn tiền theo policy
- Ticket + QR + check-in
- Job hết hạn hold & hết hạn thanh toán
- Khóa đồng thời, idempotency, audit đơn

### D. Age Verification
- Upload pipeline
- AI verify endpoint
- Policy engine theo rating + showtime
- Audit log (ai verify, lúc nào, kết quả, confidence)
- Gắn `verificationId` bắt buộc vào checkout khi phim hạn chế tuổi

### E. Admin
- CRUD phim / suất / rạp / giá / khóa ghế
- Xem đơn, hủy hộ, hoàn tiền, check-in thủ công
- Báo cáo doanh thu / tỷ lệ lấp đầy phòng
- Xem thống kê verify fail (không xem ảnh CCCD)

---

## 8. Nghiệp vụ Back-end đặt vé (đầy đủ)

> Mục này là **checklist nghiệp vụ bắt buộc** cho API booking. Thiếu bất kỳ mục “Must” nào thì coi như back-end đặt vé chưa đủ.

### 8.1 State machine đơn (`Booking.status`)

```text
DRAFT/HELD ──pay_init──▶ PENDING_PAYMENT ──webhook_success──▶ PAID ──▶ (tickets ISSUED)
     │                         │
     │ expire/release          ├──webhook_fail / timeout──▶ PAYMENT_FAILED ──▶ EXPIRED
     ▼                         │
  EXPIRED / CANCELLED          └──user_cancel (trước PAID)──▶ CANCELLED

PAID ──user_cancel (trong policy)──▶ REFUND_PENDING ──▶ REFUNDED
PAID ──showtime started / policy cấm──▶ (không cho hủy)
PAID ──admin void──▶ VOIDED
```

| Status | Ý nghĩa | Ghế |
|---|---|---|
| `HELD` | Đang giữ ghế, chưa thanh toán | Redis hold + bản ghi `BookingSeat` tạm |
| `PENDING_PAYMENT` | Đã tạo payment intent / redirect cổng | Vẫn giữ ghế đến `paymentExpiresAt` |
| `PAID` | Thanh toán OK, vé đã/ sẽ phát hành | Ghế SOLD cứng trong DB |
| `PAYMENT_FAILED` | Thanh toán thất bại | Giải phóng ghế (hoặc cho retry trong TTL) |
| `EXPIRED` | Hết hạn hold / hết hạn thanh toán | Giải phóng ghế |
| `CANCELLED` | User/admin hủy trước khi dùng vé | Giải phóng ghế nếu chưa PAID; nếu đã PAID → đi luồng refund |
| `REFUNDED` | Đã hoàn tiền | Ghế về AVAILABLE (nếu suất chưa chiếu) |
| `VOIDED` | Hủy đặc biệt (admin/lỗi) | Theo quyết định admin |

**Chuyển trạng thái chỉ qua service domain** (không update status tùy tiện từ controller). Mỗi lần đổi status ghi `BookingStatusHistory`.

### 8.2 Trạng thái ghế theo suất (`SeatAvailability`)

Với mỗi cặp `(showtimeId, seatId)`:

| State | Nguồn | Ai thấy |
|---|---|---|
| `AVAILABLE` | Mặc định | Có thể chọn |
| `HELD` | Redis + booking HELD/PENDING_PAYMENT của user khác | Disabled trên UI |
| `SOLD` | Booking PAID | Disabled |
| `BLOCKED` | Admin khóa (hỏng / giữ chỗ đoàn) | Disabled |
| `MINE_HELD` | Hold của chính user hiện tại | Highlight, cho bỏ chọn |

**Invariant cứng:** Một ghế trong một suất **không thể** thuộc 2 booking `HELD|PENDING_PAYMENT|PAID` cùng lúc.  
Enforce bằng:

1. Redis `SET hold:{showtimeId}:{seatId} = {bookingId,userId}` với `NX` + TTL  
2. Unique partial index / constraint DB trên `BookingSeat(showtimeId, seatId)` với booking status active  
3. Transaction `SELECT … FOR UPDATE` khi confirm thanh toán

### 8.3 Quy tắc nghiệp vụ Must-have

#### A. Trước khi cho đặt (pre-conditions)
- [ ] User đã đăng nhập (MVP không guest checkout; guest = phase sau)
- [ ] `showtime.startsAt` còn trong tương lai
- [ ] Cutoff đặt vé: không cho hold nếu còn < `BOOKING_CUTOFF_MINUTES` (ví dụ 15–30 phút trước giờ chiếu)
- [ ] Suất / phòng / phim đang `ACTIVE` (không draft, không bị ẩn)
- [ ] Số ghế chọn: `1 … MAX_SEATS_PER_BOOKING` (ví dụ 8)
- [ ] Không hold ghế `BLOCKED` / `SOLD` / đang `HELD` bởi người khác
- [ ] Ghế đôi (`COUPLE`): phải chọn đủ cặp (A1+A2); reject nếu lẻ một ghế trong pair
- [ ] Một user chỉ có **1 booking active** (`HELD|PENDING_PAYMENT`) tại một thời điểm (tránh giữ nhiều suất); hoặc giới hạn cấu hình được

#### B. Hold ghế
- [ ] `POST /bookings/hold` tạo `Booking` status `HELD`, `holdsExpiresAt = now + HOLD_TTL` (5–10 phút)
- [ ] Atomic: tất cả ghế thành công hoặc rollback toàn bộ (không hold dở)
- [ ] Trả về `bookingId`, danh sách ghế, `expiresAt`, `pricing` tạm
- [ ] `POST /bookings/:id/extend-hold` — gia hạn tối đa N lần (ví dụ 1 lần, +5 phút) nếu vẫn trong cửa sổ cho phép
- [ ] `POST /bookings/:id/release` — user bỏ giữ; status `CANCELLED`/`EXPIRED`, xóa Redis keys
- [ ] `PATCH /bookings/:id/seats` — đổi ghế trong cùng suất: release cũ + hold mới atomic (optional MVP+)

#### C. Tính giá (Pricing)
- [ ] `unitPrice = showtime.priceBase × seatTypeMultiplier` (STANDARD=1, VIP=1.3, COUPLE=2×base hoặc giá riêng)
- [ ] Cộng thêm phụ thu khung giờ (prime-time / weekend) nếu có `PriceRule`
- [ ] Áp mã giảm giá (optional): validate hết hạn, min spend, per-user limit
- [ ] `totalAmount = sum(seatPrices) - discount`; làm tròn theo VND (0 số lẻ)
- [ ] Snapshot giá vào `BookingSeat.unitPrice` lúc hold/checkout — **không** tính lại theo giá mới sau khi đã PAID
- [ ] API trả breakdown: từng ghế + phụ thu + giảm giá + tổng

#### D. Age gate gắn booking
- [ ] Nếu `movie.rating ∈ {T13,T16,T18}`: checkout **bắt buộc** `verificationId` còn hiệu lực, `passed=true`, cùng `userId`, TTL chưa hết, và (khuyến nghị) khớp `showtimeId`/`bookingId`
- [ ] Phim `P`/`K`: bỏ qua
- [ ] Verify fail → không tạo payment

#### E. Checkout & thanh toán
- [ ] `POST /bookings/:id/checkout`:
  1. Kiểm tra booking thuộc user, status `HELD`, chưa hết hạn  
  2. Re-validate ghế vẫn đang hold bởi booking này  
  3. Re-validate showtime cutoff  
  4. Age verification nếu cần  
  5. Lock ghế / booking row  
  6. Tạo `Payment` (`PENDING`) + `idempotencyKey`  
  7. Đổi booking → `PENDING_PAYMENT`, set `paymentExpiresAt`  
  8. Gọi cổng (VNPay/MoMo/mock) → trả `paymentUrl` hoặc client secret  
- [ ] Webhook `POST /payments/webhook`:
  - Verify chữ ký cổng  
  - Idempotent theo `providerTxnId` (gọi 2 lần không nhân đôi vé)  
  - Success → `Payment.SUCCEEDED` + booking `PAID` + phát hành ticket + clear Redis hold (ghế chuyển SOLD)  
  - Fail → `Payment.FAILED`; cho phép retry trong TTL hoặc expire + release  
- [ ] Client poll `GET /bookings/:id` hoặc `GET /payments/:id` để biết kết quả (kèm toast)
- [ ] Job/cron: hết `paymentExpiresAt` mà chưa success → `EXPIRED` + release ghế + cancel payment phía cổng nếu API hỗ trợ
- [ ] Không tin callback duy nhất: job **đối soát** (query status từ cổng) cho payment treo

#### F. Phát hành vé (Ticketing)
- [ ] Mỗi `BookingSeat` → 1 `Ticket` (hoặc 1 booking = 1 mã tổng + danh sách ghế — chọn 1 model và thống nhất)
- [ ] Khuyến nghị POC: **1 booking → 1 `ticketCode` tổng** + QR chứa code; check-in theo từng ghế hoặc cả booking
- [ ] `ticketCode` unique, random đủ dài (không đoán được), có checksum
- [ ] QR payload: `ticketCode` + HMAC ngắn (chống sửa)
- [ ] Sau `PAID`: status ticket `ISSUED`; gửi email (optional)
- [ ] Check-in: `POST /tickets/:code/check-in` (staff role) → `CHECKED_IN` + timestamp; không cho check-in 2 lần; không cho check-in nếu suất quá lệch policy

#### G. Hủy & hoàn tiền
- [ ] User hủy khi `HELD|PENDING_PAYMENT`: release ghế, không hoàn tiền (chưa trừ)
- [ ] User hủy khi `PAID`: chỉ nếu `now < showtime.startsAt - CANCEL_CUTOFF_MINUTES`
- [ ] Policy hoàn: ví dụ hoàn 100% nếu > 24h; 50% nếu 2–24h; 0% nếu < 2h (config)
- [ ] Tạo `Refund` record; gọi API hoàn cổng; webhook/confirm → `REFUNDED`; ghế về AVAILABLE nếu suất chưa chiếu
- [ ] Admin hủy/void + lý do bắt buộc (audit)
- [ ] Không cho user tự hủy sau khi đã `CHECKED_IN`

#### H. Lịch sử & truy vấn user
- [ ] `GET /bookings/me?status=&from=&to=` — phân trang
- [ ] `GET /bookings/:id` — chi tiết: ghế, giá, payment, tickets, expiresAt
- [ ] Chỉ owner hoặc admin được xem
- [ ] Filter “vé sắp chiếu” / “đã xem” / “đã hủy”

#### I. Admin booking ops
- [ ] List/filter đơn theo suất, trạng thái, user
- [ ] Hủy hộ / hoàn hộ
- [ ] Block/unblock ghế theo suất hoặc theo room template
- [ ] Đóng bán suất (`Showtime.status = CLOSED`) → reject hold mới
- [ ] Báo cáo: doanh thu theo ngày/phim/rạp, occupancy %, số hoàn

#### J. Jobs nền (Must)
| Job | Tần suất | Việc |
|---|---|---|
| `expire-holds` | mỗi 30–60s | HELD quá `holdsExpiresAt` → EXPIRED + del Redis |
| `expire-payments` | mỗi 30–60s | PENDING_PAYMENT quá hạn → EXPIRED + release + cancel intent |
| `reconcile-payments` | 1–5 phút | Hỏi cổng các payment treo |
| `purge-cccd-tmp` | 5 phút | Xóa ảnh CCCD tạm |
| `auto-complete-showtimes` | 15 phút | Đánh dấu suất đã chiếu xong (optional analytics) |

#### K. Đồng thời & an toàn (Must)
- [ ] Hold dùng Redis `NX` + Lua script hoặc multi-key transaction
- [ ] Checkout/webhook bọc DB transaction + row lock booking
- [ ] Idempotency-Key header cho `checkout` và webhook xử lý
- [ ] Optimistic version / `updatedAt` check tránh ghi đè status
- [ ] Rate limit: hold, checkout, verify tuổi
- [ ] Structured domain errors: `SEAT_TAKEN`, `HOLD_EXPIRED`, `SHOWTIME_CLOSED`, `AGE_NOT_VERIFIED`, `PAYMENT_TIMEOUT`, `CANCEL_NOT_ALLOWED`…

#### L. Should-have (làm sau MVP, nhưng nên có trong plan)
- [ ] Guest checkout bằng email/SĐT + OTP
- [ ] Đổi suất (rebooking) trong điều kiện cho phép
- [ ] Ghế đoàn / khóa block theo order B2B
- [ ] Combo bắp nước gắn booking
- [ ] Xuất hóa đơn VAT
- [ ] WebSocket/SSE push trạng thái ghế realtime
- [ ] Đa tiền tệ (không cần nếu chỉ VND)

### 8.4 Luồng sequence chuẩn (happy path)

```text
1. GET  /showtimes/:id/seats
2. POST /bookings/hold              → booking HELD + Redis
3. POST /age-verification           → (nếu cần) verificationId
4. POST /bookings/:id/checkout      → PENDING_PAYMENT + paymentUrl
5. User thanh toán trên cổng
6. POST /payments/webhook           → PAID + Ticket ISSUED
7. GET  /bookings/:id               → hiện QR
8. (Tại rạp) POST /tickets/:code/check-in
```

### 8.5 Luồng lỗi cần cover

| Tình huống | Hành vi back-end |
|---|---|
| 2 user hold cùng ghế | User sau nhận `SEAT_TAKEN`; user trước giữ chỗ |
| Hold hết hạn lúc đang checkout | Reject checkout `HOLD_EXPIRED`; ghế free |
| Webhook success trùng | No-op idempotent; vẫn 200 |
| Webhook success sau khi đã EXPIRED | Policy: hoặc revive+PAID nếu ghế vẫn trống, hoặc auto-refund (chọn 1, document rõ) — **khuyến nghị auto-refund** |
| User bỏ trang giữa chừng | Job expire tự release |
| Thanh toán OK nhưng phát hành vé lỗi | Outbox/retry job `issue-tickets`; payment đã SUCCEEDED không rollback ẩu |
| Admin đóng suất khi user đang hold | Hold còn hiệu lực đến hết TTL **hoặc** force-expire — khuyến nghị force-expire + notify |
| Couple seat chọn lẻ | `INVALID_COUPLE_PAIR` |
| Đặt quá MAX seats | `TOO_MANY_SEATS` |
| Checkout thiếu age verify | `AGE_NOT_VERIFIED` |

---

## 9. Thiết kế dữ liệu (sketch — bổ sung booking)

```prisma
enum BookingStatus {
  HELD
  PENDING_PAYMENT
  PAID
  PAYMENT_FAILED
  EXPIRED
  CANCELLED
  REFUNDED
  VOIDED
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED
  CANCELLED
  REFUNDED
}

enum TicketStatus {
  ISSUED
  CHECKED_IN
  VOIDED
  REFUNDED
}

enum ShowtimeStatus {
  SCHEDULED
  CLOSED    // đóng bán
  FINISHED
  CANCELLED
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  fullName  String?
  role      UserRole @default(CUSTOMER) // CUSTOMER | STAFF | ADMIN
  createdAt DateTime @default(now())
  bookings  Booking[]
  ageChecks AgeVerification[]
}

model Movie {
  id          String    @id @default(cuid())
  title       String
  slug        String    @unique
  description String?
  durationMin Int
  rating      AgeRating // P | T13 | T16 | T18 | K
  status      ContentStatus @default(PUBLISHED) // DRAFT | PUBLISHED | ARCHIVED
  posterUrl   String?
  showtimes   Showtime[]
}

model Cinema {
  id      String @id @default(cuid())
  name    String
  address String
  rooms   Room[]
}

model Room {
  id       String @id @default(cuid())
  cinemaId String
  name     String
  rows     Int
  cols     Int
  seats    Seat[]
}

model Seat {
  id        String   @id @default(cuid())
  roomId    String
  row       String
  number    Int
  type      SeatType // STANDARD | VIP | COUPLE
  pairSeatId String? // ghế đôi còn lại
  isActive  Boolean  @default(true)
  @@unique([roomId, row, number])
}

model Showtime {
  id         String         @id @default(cuid())
  movieId    String
  roomId     String
  startsAt   DateTime
  endsAt     DateTime
  priceBase  Decimal        @db.Decimal(12, 0)
  status     ShowtimeStatus @default(SCHEDULED)
  bookings   Booking[]
  seatBlocks ShowtimeSeatBlock[]
  @@index([movieId, startsAt])
  @@index([roomId, startsAt])
}

// Khóa ghế theo suất (admin)
model ShowtimeSeatBlock {
  id         String @id @default(cuid())
  showtimeId String
  seatId     String
  reason     String?
  @@unique([showtimeId, seatId])
}

model Booking {
  id               String        @id @default(cuid())
  userId           String
  showtimeId       String
  status           BookingStatus
  totalAmount      Decimal       @db.Decimal(12, 0)
  discountAmount   Decimal       @default(0) @db.Decimal(12, 0)
  currency         String        @default("VND")
  holdsExpiresAt   DateTime?
  paymentExpiresAt DateTime?
  ageCheckId       String?
  promoCode        String?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  seats            BookingSeat[]
  payments         Payment[]
  tickets          Ticket[]
  statusHistory    BookingStatusHistory[]
  @@index([userId, status])
  @@index([showtimeId, status])
  @@index([holdsExpiresAt])
  @@index([paymentExpiresAt])
}

model BookingSeat {
  id         String  @id @default(cuid())
  bookingId  String
  showtimeId String
  seatId     String
  unitPrice  Decimal @db.Decimal(12, 0)
  // Unique “mềm”: enforce ở service + partial unique index SQL
  // cho các booking đang giữ ghế (HELD/PENDING_PAYMENT/PAID)
  @@unique([bookingId, seatId])
  @@index([showtimeId, seatId])
}

model BookingStatusHistory {
  id         String         @id @default(cuid())
  bookingId  String
  fromStatus BookingStatus?
  toStatus   BookingStatus
  reason     String?
  actorId    String?        // user/admin/system
  createdAt  DateTime       @default(now())
}

model Payment {
  id             String        @id @default(cuid())
  bookingId      String
  provider       String        // MOCK | VNPAY | MOMO
  status         PaymentStatus @default(PENDING)
  amount         Decimal       @db.Decimal(12, 0)
  idempotencyKey String        @unique
  providerTxnId  String?       @unique
  rawPayload     Json?         // webhook đã sanitize
  paidAt         DateTime?
  createdAt      DateTime      @default(now())
  refunds        Refund[]
}

model Refund {
  id            String        @id @default(cuid())
  paymentId     String
  amount        Decimal       @db.Decimal(12, 0)
  status        PaymentStatus // PENDING | SUCCEEDED | FAILED
  reason        String?
  providerTxnId String?
  createdAt     DateTime      @default(now())
}

model Ticket {
  id          String       @id @default(cuid())
  bookingId   String
  code        String       @unique
  status      TicketStatus @default(ISSUED)
  qrPayload   String
  checkedInAt DateTime?
  checkedInBy String?
  createdAt   DateTime     @default(now())
}

model AgeVerification {
  id              String   @id @default(cuid())
  userId          String
  bookingId       String?
  showtimeId      String?
  requiredAge     Int
  computedAge     Int?
  passed          Boolean
  confidence      Float?
  idNumberHash    String?
  rawImageDeleted Boolean  @default(false)
  failureReason   String?
  createdAt       DateTime @default(now())
  expiresAt       DateTime?
}
```

**Index SQL bổ sung (raw migration):** partial unique để 1 ghế/suất chỉ thuộc 1 booking “đang hiệu lực”:

```sql
CREATE UNIQUE INDEX booking_seat_active_unique
ON "BookingSeat" ("showtimeId", "seatId")
WHERE EXISTS (
  SELECT 1 FROM "Booking" b
  WHERE b.id = "BookingSeat"."bookingId"
    AND b.status IN ('HELD', 'PENDING_PAYMENT', 'PAID')
);
-- MySQL không hỗ trợ partial unique index kiểu Postgres tốt bằng,
-- nên dùng bảng SeatLock(showtimeId, seatId) UNIQUE làm source of truth.
```

**Khuyến nghị thực thi:** thêm bảng `SeatLock`:

```prisma
model SeatLock {
  showtimeId String
  seatId     String
  bookingId  String
  userId     String
  expiresAt  DateTime
  @@id([showtimeId, seatId])
}
```

Redis = cache/fast path; `SeatLock` = source of truth có thể recover khi Redis mất.

---

## 10. API chính (REST — đủ nghiệp vụ đặt vé)

### Auth
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/auth/register` | Đăng ký |
| POST | `/auth/login` | Đăng nhập |
| POST | `/auth/logout` | Đăng xuất |
| GET | `/auth/me` | Profile hiện tại |

### Catalog
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/movies` | Danh sách phim (filter rating, status) |
| GET | `/movies/:slug` | Chi tiết phim |
| GET | `/cinemas` | Danh sách rạp |
| GET | `/showtimes?movieId&cinemaId&date` | Suất chiếu |
| GET | `/showtimes/:id` | Chi tiết suất + giá base |
| GET | `/showtimes/:id/seats` | Sơ đồ ghế + state AVAILABLE/HELD/SOLD/BLOCKED/MINE |

### Booking lifecycle
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/bookings/hold` | Giữ ghế → `HELD` |
| POST | `/bookings/:id/extend-hold` | Gia hạn hold |
| POST | `/bookings/:id/release` | Bỏ giữ ghế |
| GET | `/bookings/:id` | Chi tiết đơn (owner/admin) |
| GET | `/bookings/me` | Lịch sử đơn của tôi |
| POST | `/bookings/:id/checkout` | Tạo payment → `PENDING_PAYMENT` |
| POST | `/bookings/:id/cancel` | Hủy đơn (theo policy) |
| GET | `/bookings/:id/pricing` | Xem lại breakdown giá |

### Age verification
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/age-verification` | Upload CCCD + `showtimeId`/`bookingId` |

### Payment
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/payments/webhook` | Callback cổng (public + chữ ký) |
| GET | `/payments/:id` | Trạng thái thanh toán (owner) |
| POST | `/payments/:id/reconcile` | Admin/manual đối soát |

### Ticket / check-in
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/tickets/:code` | Chi tiết vé + QR |
| POST | `/tickets/:code/check-in` | Staff check-in |

### Admin (booking-related)
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/admin/bookings` | Filter đơn |
| POST | `/admin/bookings/:id/cancel` | Hủy/void hộ |
| POST | `/admin/bookings/:id/refund` | Hoàn tiền |
| POST | `/admin/showtimes/:id/close` | Đóng bán suất |
| POST | `/admin/showtimes/:id/seat-blocks` | Khóa ghế |
| DELETE | `/admin/showtimes/:id/seat-blocks/:seatId` | Mở ghế |
| GET | `/admin/reports/revenue` | Doanh thu |

### AI service (nội bộ)
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/v1/cccd/analyze` | Input: image; Output: fields + confidence |

**Request mẫu `POST /bookings/hold`:**

```json
{
  "showtimeId": "st_123",
  "seatIds": ["seat_a1", "seat_a2"]
}
```

**Response mẫu:**

```json
{
  "bookingId": "bk_123",
  "status": "HELD",
  "expiresAt": "2026-09-10T15:10:00.000Z",
  "seats": [
    { "seatId": "seat_a1", "label": "A1", "type": "STANDARD", "unitPrice": 90000 }
  ],
  "pricing": {
    "subtotal": 180000,
    "discount": 0,
    "total": 180000,
    "currency": "VND"
  }
}
```

**Response mẫu `/age-verification`:**

```json
{
  "passed": true,
  "requiredAge": 16,
  "computedAge": 19,
  "confidence": 0.92,
  "verificationId": "clx...",
  "message": "Đủ điều kiện xem phim T16"
}
```

**Domain error codes (booking):**  
`SEAT_TAKEN` · `SEAT_BLOCKED` · `INVALID_COUPLE_PAIR` · `TOO_MANY_SEATS` · `HOLD_EXPIRED` · `SHOWTIME_CLOSED` · `SHOWTIME_STARTED` · `BOOKING_CUTOFF` · `AGE_NOT_VERIFIED` · `PAYMENT_PENDING` · `PAYMENT_TIMEOUT` · `CANCEL_NOT_ALLOWED` · `ALREADY_CHECKED_IN` · `FORBIDDEN_BOOKING`
---

## 11. Pipeline YOLO + OCR + QR anti-tamper

### Luồng chống ảnh chỉnh sửa (đã scaffold `services/cccd-ai`)

```text
Ảnh upload
  → YOLO detect cccd_front + qr (fallback OpenCV nếu chưa có weights)
  → Crop thẻ + crop QR
  → Decode QR CCCD (payload | )
  → OCR text trên thẻ
  → So khớp DOB/ID OCR ↔ QR
  → Lệch = tamper_suspected → reject
  → Tuổi tính từ DOB trên QR
```

Chi tiết chạy/train: `services/cccd-ai/README.md`

### 11.1 Dataset & training YOLO
- Thu thập / tạo dataset ảnh CCCD (synthetic + real có consent), đa góc, ánh sáng, nhiễu.
- Classes bắt buộc:
  - `cccd_front`
  - `qr`
- Optional ROI: `portrait`, `id_number`, `full_name`, `dob`
- Export ONNX/TensorRT để infer nhanh.
- Metric: mAP, recall trên `cccd_front` và `qr`.

### 11.2 Inference flow
1. Preprocess: resize, auto-orient EXIF, denoise nhẹ
2. YOLO detect `cccd_front` → crop thẻ
3. YOLO detect `qr` → crop QR (kiểm tra nằm góc phải-trên)
4. Decode QR → parse DOB/ID/name
5. OCR vùng text → cross-check với QR
6. Confidence gate + anti-tamper gate
7. Age calc từ DOB QR theo ngày chiếu

### 11.3 Chống gian lận
- Bắt buộc decode QR thành công
- OCR DOB ≠ QR DOB → reject
- QR lệch vị trí chuẩn trên thẻ → reject
- (Phase sau) selfie vs portrait, liveness
- Rate limit theo user/IP
- Verification token TTL ngắn, one-time use

---

## 12. UI / UX (Next.js + shadcn)

### Trang chính
- Landing: brand + hero phim nổi bật + CTA “Đặt vé ngay”
- Movie grid / filters (thể loại, rating)
- Showtime picker
- Seat map interactive
- Checkout + age gate modal
- My tickets

### Component shadcn gợi ý
- `Button`, `Dialog`, `Sheet`, `Card` (chỉ cho tương tác đặt ghế/checkout), `Badge`, `Select`, `Calendar`, `Input`, `Form`, `Toast (Sonner)`, `Skeleton`, `Alert`, `Separator`, `Avatar`

### Toast scenarios
- Giữ ghế thành công / sắp hết hạn
- Verify tuổi thành công / thất bại
- Thanh toán OK / lỗi
- Upload ảnh sai định dạng

### Age gate UI
- Chỉ hiện khi `movie.rating` cần verify
- Checklist hướng dẫn chụp CCCD
- Preview ảnh + progress “Đang nhận diện…”
- Kết quả rõ ràng, không lộ số CCCD trên UI (mask `**** **** 1234` nếu có hiện)

---

## 13. Bảo mật & tuân thủ

1. **Không lưu ảnh CCCD** sau khi verify xong (job xóa file + object storage).
2. Không log plaintext số CCCD / họ tên vào application logs.
3. HTTPS everywhere; upload size limit (ví dụ ≤ 5MB); chỉ `image/jpeg|png|webp`.
4. Mã hóa at-rest cho file tạm nếu lưu disk.
5. RBAC admin tách biệt.
6. CSRF / CORS chặt; rate limit endpoint verify.
7. Consent checkbox: “Tôi đồng ý xử lý ảnh CCCD để xác minh độ tuổi”.
8. Privacy policy + retention policy rõ ràng.
9. Audit log chỉ lưu kết quả verify, không lưu ảnh.

---

## 14. Cấu trúc monorepo đề xuất

```text
Book-movie-tickets/
├── apps/
│   ├── web/                 # Next.js + Tailwind + shadcn
│   └── api/                 # Node.js API
├── services/
│   └── cccd-ai/             # FastAPI + YOLO + OCR
├── packages/
│   └── shared/              # types, zod schemas, constants rating
├── docker-compose.yml
├── PLAN.md
└── README.md
```

Hoặc giai đoạn đầu: single repo đơn giản `web` + `api` + `ai` folders.

---

## 15. Lộ trình triển khai (phased)

### Phase 0 — Setup (3–5 ngày)
- [ ] Khởi tạo Next.js + Tailwind + shadcn + toast
- [ ] Khởi tạo API Node + Prisma + MySQL + Redis
- [ ] Docker Compose local
- [ ] Auth cơ bản (register/login/roles)
- [ ] Seed phim / rạp / suất / ghế mẫu (kèm VIP, COUPLE)
- [ ] Enum + schema Booking/Payment/Ticket/SeatLock

### Phase 1 — Booking MVP back-end (1–2 tuần)
- [ ] Seat map API + trạng thái ghế
- [ ] Hold / extend / release (Redis + SeatLock)
- [ ] Pricing snapshot + breakdown
- [ ] Checkout + payment mock + webhook idempotent
- [ ] Job expire-holds + expire-payments
- [ ] Phát hành ticket + QR
- [ ] Cancel trước thanh toán
- [ ] Domain errors chuẩn
- [ ] Toast toàn luồng phía web

### Phase 2 — Age gate + OCR pipeline (2–3 tuần)
- [ ] UI upload/chụp CCCD
- [ ] AI service skeleton + mock response
- [ ] Tích hợp YOLO detect card (model pretrained/fine-tune)
- [ ] OCR DOB + parse tuổi
- [ ] Policy theo rating phim gắn checkout
- [ ] Audit `AgeVerification`
- [ ] Xóa ảnh tạm + rate limit

### Phase 3 — Thanh toán thật & Admin & hoàn tiền (1–2 tuần)
- [ ] Cổng thanh toán sandbox + reconcile job
- [ ] Cancel/refund sau PAID theo cutoff policy
- [ ] Admin: đóng suất, block ghế, hủy/hoàn hộ, doanh thu
- [ ] Staff check-in API
- [ ] Email vé (optional)

### Phase 4 — Hardening (1 tuần+)
- [ ] Anti-spoof / face match (optional)
- [ ] Load test concurrent hold cùng ghế
- [ ] Monitoring OCR fail rate + booking expire rate
- [ ] E2E Playwright full booking
- [ ] Privacy review

---

## 16. Tiêu chí chấp nhận (Acceptance criteria)

### Age / CCCD
1. User đặt được vé phim **P** không cần CCCD.
2. User đặt phim **T16/T18**: bắt buộc verify; dưới tuổi → bị chặn + toast rõ lý do.
3. Ảnh CCCD hợp lệ → YOLO detect + OCR DOB đúng trong ngưỡng confidence đã cấu hình.
4. Ảnh mờ / không phải CCCD → reject, không crash, hướng dẫn chụp lại.
5. Ảnh CCCD bị xóa sau TTL; DB không chứa ảnh thô.

### Booking back-end
6. Hai user không thể hold/mua cùng một ghế trong cùng suất (kể cả concurrent).
7. Hold hết TTL → ghế tự mở lại; checkout trên booking hết hạn bị reject `HOLD_EXPIRED`.
8. Checkout tạo payment idempotent; webhook gọi 2 lần không nhân đôi vé.
9. Thanh toán thành công → booking `PAID` + ticket/QR phát hành đúng ghế đã giữ.
10. User hủy khi `HELD`/`PENDING_PAYMENT` → ghế giải phóng, không còn khóa.
11. User hủy sau `PAID` chỉ trong cửa sổ cutoff; ngoài cửa sổ → `CANCEL_NOT_ALLOWED`.
12. Ghế `COUPLE` không cho chọn lẻ; ghế `BLOCKED` không bán được.
13. Suất `CLOSED` / quá cutoff / đã bắt đầu → không hold mới.
14. Chỉ owner (hoặc admin) xem được chi tiết booking; staff check-in được vé hợp lệ đúng 1 lần.
15. Job nền xử lý được hold/payment treo mà không cần user mở lại trang.

### UI
16. UI responsive (desktop + mobile), dùng shadcn + toast nhất quán.

---

## 17. Rủi ro & giảm thiểu

| Rủi ro | Giảm thiểu |
|---|---|
| OCR sai ngày sinh | Multi-ROI + conf threshold + cho phép chụp lại; human fallback tại quầy (phase sau) |
| Model YOLO kém trên ảnh thực | Augment dataset, warp perspective, thu thập edge cases |
| Latency verify cao | Queue + loading UI; tối ưu ONNX; cache session verify ngắn |
| Privacy / pháp lý CCCD | Minimal retention, consent, hash-only, xóa ảnh |
| Race condition ghế | Redis NX + bảng `SeatLock` + DB transaction khi checkout |
| Webhook tới muộn sau expire | Policy auto-refund; reconcile job |
| Phát hành vé lỗi sau khi đã trừ tiền | Outbox/retry `issue-tickets`; không để booking PAID thiếu ticket |
| Gian lận ảnh giả | Phase 2+: liveness / face match / staff check-in |

---

## 18. Biến môi trường chính

```env
DATABASE_URL=mysql://user:pass@localhost:3306/book_movie_tickets
REDIS_URL=
JWT_SECRET=
AI_SERVICE_URL=
AI_SERVICE_KEY=
UPLOAD_TMP_DIR=
CCCD_IMAGE_TTL_SECONDS=900
HOLD_TTL_SECONDS=600
HOLD_EXTEND_SECONDS=300
HOLD_MAX_EXTENDS=1
BOOKING_CUTOFF_MINUTES=20
CANCEL_CUTOFF_MINUTES=120
MAX_SEATS_PER_BOOKING=8
PAYMENT_EXPIRES_SECONDS=900
PAYMENT_WEBHOOK_SECRET=
PAYMENT_PROVIDER=MOCK
NEXT_PUBLIC_APP_URL=
```

---

## 19. Định nghĩa xong “Done” cho bản demo tốt nghiệp / POC

- [ ] Demo đặt vé full flow với payment mock (hold → pay → QR)
- [ ] Demo conflict 2 user cùng ghế
- [ ] Demo hết hạn hold tự nhả ghế
- [ ] Demo chặn / cho phép theo tuổi thật từ ảnh CCCD mẫu
- [ ] Slide kiến trúc: Web → API → AI (YOLO+OCR) + state machine booking
- [ ] Nhấn mạnh privacy: không lưu ảnh lâu dài
- [ ] README chạy local bằng Docker

---

## 20. Việc nên làm ngay tiếp theo

1. Khởi tạo monorepo / project Next.js + API.
2. Chốt NestJS vs Express cho backend.
3. Implement domain booking theo mục **8** (state machine + SeatLock) trước UI fancy.
4. Tạo seed data phim có đủ rating P/T13/T16/T18.
5. Dựng AI service mock trước (hardcode DOB) để nối UI age gate.
6. Sau đó thay mock bằng YOLO + PaddleOCR thật.

---

## 21. Ghi chú triển khai model (gợi ý stack AI)

| Thành phần | Gợi ý |
|---|---|
| Detect | YOLOv8n/s fine-tune trên CCCD |
| OCR | PaddleOCR Vietnamese |
| API AI | FastAPI + uvicorn |
| Infer | CPU ok cho POC; GPU nếu production |
| I/O | multipart image in → JSON fields out |
| Test | Bộ ảnh CCCD giả lập (synthetic) để CI không dùng giấy tờ thật |

---

> Tài liệu này là **plan triển khai**. Khi bắt đầu code, ưu tiên Phase 0 → 1 để có booking chạy được, rồi mới gắn age verification thật (Phase 2).
