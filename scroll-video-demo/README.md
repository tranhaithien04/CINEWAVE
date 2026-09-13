# Scroll-Driven Video Background Animation (GSAP & ScrollTrigger)

Bản demo hoàn chỉnh thực hiện animation video / canvas nền đồng bộ theo thanh cuộn trang web (Scroll Scrubbing).

## 🚀 Cách chạy và xem trực tiếp

Dự án Next.js đang chạy trên cổng 3000, bạn có thể truy cập trực tiếp qua trình duyệt:

👉 **[http://localhost:3000/demo-scroll/index.html](http://localhost:3000/demo-scroll/index.html)**

---

## 🛠 Tính năng & Kỹ thuật đã triển khai

1. **Pinning toàn màn hình (100vw, 100vh / 100svh)**:
   - Sử dụng `position: fixed` kết hợp `100svh` đảm bảo không bị co giật thanh địa chỉ trên trình duyệt di động (iOS Safari / Android Chrome).
2. **2 Chế độ hoạt động (Có thể chuyển đổi bằng nút trên thanh Header)**:
   - **Mode 1: MP4 Video Scrub**: Sử dụng trực tiếp video độ phân giải cao `hero-cinematic.mp4`, đồng bộ `video.currentTime` theo tỷ lệ cuộn trang cùng độ mượt quán tính `scrub: 1.2`.
   - **Mode 2: Canvas Image Sequence (Apple-style)**: Nạp chuỗi frame vẽ lên thẻ `<canvas>` 2D context với tỷ lệ Retina (`devicePixelRatio`) và scale `object-fit: cover`.
3. **Lazy-loading & Tối ưu hiệu năng**:
   - Nạp trước đợt khung hình ưu tiên (20 frames) hiển thị thanh tiến trình trực quan.
   - Các frame còn lại được nạp ngầm (lazy-load) qua API `requestIdleCallback` khi trình duyệt rảnh, không gây drop FPS.
4. **Content Overlay & Glassmorphism**:
   - Các khối thông tin kính mờ (Backdrop blur) xuất hiện mượt mà (Fade In / Slide Up) khi cuộn đến từng phân đoạn tương ứng.

