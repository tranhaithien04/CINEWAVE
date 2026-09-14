# 🎬 CineWave Mobile App (React Native Expo Go)

Ứng dụng đặt vé xem phim công nghệ cao **CineWave Mobile** được phát triển bằng **React Native (Expo Go SDK 52)**, đồng bộ 100% về mặt thẩm mỹ, màu sắc, phong cách Futuristic Cyber Cinema & Luxury IMAX Lounge với phiên bản Web Next.js.

---

## 📱 Tính năng & Màn hình chính

### 1. Luồng Khách Hàng (Customer Flow)
- **Trang chủ (`HomeScreen`)**:
  - Banner Cyber Cinema huyền ảo ("✦ Futuristic Cyber Cinema").
  - Phim nổi bật tuần (Spotlight Movie).
  - 3 thẻ công nghệ: Lọc phim theo nhãn tuổi, Giữ ghế Realtime, Nhận diện CCCD bằng AI.
  - Carousels phim "Đang chiếu" (Now Showing) và "Sắp chiếu" (Coming Soon).
- **Danh sách phim (`MoviesScreen`)**:
  - Tìm kiếm phim theo tên, thể loại realtime.
  - Bộ lọc nhãn tuổi tiêu chuẩn Điện ảnh Việt Nam: **ALL, P, K, T13, T16, T18**.
  - Lưới phim 2 cột với thời lượng và nút đặt vé nhanh.
- **Chi tiết phim (`MovieDetailScreen`)**:
  - Ảnh nền backdrop chìm vào không gian tối.
  - Điểm đánh giá IMDb, thời lượng, đạo diễn, diễn viên, tóm tắt nội dung.
  - Xem trailer modal.
  - Thanh chọn ngày chiếu & danh sách suất chiếu IMAX 3D theo phòng.
  - Phim tương tự (Similar movies).
- **Chọn ghế (`SeatMapScreen`)**:
  - Màn chiếu cong phát sáng Neon cyan.
  - Chuyển đổi linh hoạt chế độ xem **2D Matrix / 3D POV góc nhìn khán phòng**.
  - Phân loại ghế: Thường, VIP (Vàng), Ghế đôi Sweetbox (Hồng, tự động bắt cặp), Đã bán.
  - Đồng hồ đếm ngược giữ ghế 8 phút.
  - Thanh tóm tắt ghế và tổng tiền cố định chân màn hình.
- **Xác thực độ tuổi CCCD (`AgeGateModal`)**:
  - Tự động kích hoạt khi chọn phim có giới hạn tuổi (T13, T16, T18).
  - Chụp ảnh trực tiếp từ camera hoặc chọn từ thư viện ảnh máy.
  - Hiệu ứng quét Laser Hologram chuyển động trực quan.
  - Gọi API AI Vision (YOLO + OCR) trích xuất ngày sinh và tính tuổi tại suất chiếu.
  - Cam kết bảo mật: không lưu trữ ảnh thẻ lâu dài.
- **Thanh toán VietQR 247 (`CheckoutScreen`)**:
  - Thanh tiến trình 4 bước: Ghế ➔ CCCD ➔ VietQR ➔ Nhận vé.
  - Đồng hồ đếm ngược giữ chỗ 10 phút.
  - Thẻ VietQR tự động với mã QR động quét bằng ngân hàng hoặc MoMo.
  - Chi tiết chuyển khoản MB Bank kèm nút sao chép 1-chạm STK, số tiền, nội dung.
  - Màn hình xác nhận thành công và chuyển ngay sang xem vé.
- **Ví vé điện tử (`TicketsScreen`)**:
  - Thiết kế Boarding Pass răng cưa khuyết 2 bên với đường phân cách đứt nét.
  - Nhãn trạng thái: ĐÃ THANH TOÁN, ĐÃ VÀO RẠP, ĐÃ HỦY.
- **Chi tiết vé check-in (`TicketDetailScreen`)**:
  - Thẻ vé Hologram CineWave IMAX Pass nguyên bản.
  - Mã QR độ nét cao phục vụ quét tại cổng soát vé rạp.
  - Hướng dẫn check-in và tính năng chia sẻ vé.
- **Hộp thư thông báo (`NotificationsScreen`)**:
  - Nhận thông báo giữ ghế, thanh toán thành công và ưu đãi rạp.
  - Đánh dấu đã đọc / Đọc tất cả.
- **Tài khoản & Đăng nhập (`ProfileScreen`, `LoginScreen`, `RegisterScreen`)**:
  - Đăng nhập nhanh 1-chạm với tài khoản Demo Khách và Demo Admin.
  - Đăng ký thành viên mới.
  - **Cấu hình máy chủ API**: Cho phép đổi IP máy tính trực tiếp trên app để kết nối mượt mà khi chạy Expo Go trên điện thoại thật qua mạng WiFi.

### 2. Luồng Quản Trị (Admin Suite - Dành cho tài khoản ADMIN)
- **Admin Dashboard (`AdminDashboardScreen`)**: 5 thẻ KPI phát sáng (Phim, Suất chiếu, Đơn hàng, Người dùng, Doanh thu), Live System pulse badge, Bảng xếp hạng doanh thu phim.
- **Quản lý đơn hàng (`AdminBookingsScreen`)**: Tìm kiếm theo mã đơn / email, hủy đơn và hoàn tiền.
- **Quản lý phim (`AdminMoviesScreen`)**: Xem danh sách, thêm phim mới với nhãn tuổi, xóa phim.
- **Quản lý suất chiếu (`AdminShowtimesScreen`)**: Lịch chiếu theo cụm rạp, thêm suất chiếu, đóng suất.
- **Soát vé cổng (`AdminTicketsScreen`)**: Nhập mã vé hoặc mô phỏng quét QR check-in khách vào rạp.
- **Quản lý người dùng (`AdminUsersScreen`)**: Danh sách thành viên, nâng/hạ quyền ADMIN / CUSTOMER.

---

## 🚀 Hướng dẫn khởi chạy với Expo Go

### Bước 1: Khởi động Backend
Mở terminal tại `D:\LuanVan\backend` và chạy:
```bash
npm run dev
# Máy chủ khởi động tại http://localhost:4000
```

*(Tùy chọn) Khởi động AI CCCD Server:*
Mở terminal tại `d:\dataset_luanvan\cccd_detect_server` và chạy:
```bash
python app.py
# AI YOLO + OCR Server khởi động tại http://localhost:8000
```

### Bước 2: Khởi động Ứng dụng Mobile
Mở terminal tại `D:\LuanVan\mobile`:
```bash
npm start
# hoặc: npx expo start
```

### Bước 3: Mở ứng dụng trên thiết bị
- **Trên điện thoại thật**: Cài đặt ứng dụng **Expo Go** từ App Store (iOS) hoặc Google Play (Android). Mở camera quét mã QR hiển thị trên terminal.
  - *Lưu ý*: Hãy đảm bảo điện thoại và máy tính kết nối cùng một mạng WiFi. Vào tab **Tài khoản** ➔ **Kết nối máy chủ API** và nhập IP máy tính của bạn (VD: `http://192.168.1.15:4000`).
- **Trên trình duyệt Web**: Bấm phím `w` trong terminal Expo để mở bản Web Preview xem trực tiếp.
- **Trên máy ảo Android**: Bấm phím `a`.
- **Trên máy ảo iOS Simulator**: Bấm phím `i`.

