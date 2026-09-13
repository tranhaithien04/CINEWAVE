---
name: frontend-ui-vibe
description: Cẩm nang thiết kế UI/UX và phong cách Vibe Coding chuẩn CineWave — Trải nghiệm Đặt vé xem phim 3D & Xác minh CCCD (Futuristic Dark Cinema, Glassmorphism, Neon Glow & Three.js).
version: 1.0.0
author: CineWave Core Team
tags: [frontend, design-system, tailwind, react-native, threejs, ui-ux, vibe-coding]
---

# 🎬 CineWave Frontend UI Skill & Vibe Coding Guide

> **Mục đích**: Tài liệu quy chuẩn giao diện (Design System & Vibe Coding Specification) giúp tất cả lập trình viên và AI Agent khi code frontend (Web React + Tailwind CSS hoặc Mobile Expo React Native) đều **"vibe" cùng một phong cách thẩm mỹ**, giữ vững trải nghiệm điện ảnh tương lai đỉnh cao, đồng bộ và cuốn hút.

---

## 🌌 1. Triết Lý Thiết Kế & Visual Vibe (Design Manifesto)

CineWave không phải là một website bán vé xem phim thông thường mang giao diện sáng sủa hay đơn điệu. CineWave là **"Futuristic Cyber Cinema & Luxury IMAX Lounge"** — đưa người xem vào một không gian rạp chiếu phim công nghệ cao ngay từ giây đầu tiên:

* **Dark Mode làm gốc (Deep Space Void)**: Không gian tối huyền ảo như phòng chiếu khi chuẩn bị tắt đèn chiếu phim. Nền đen sâu thẳm pha xanh thẫm (`#06070d`, `#0a0c16`) giúp poster phim và mô hình 3D rực sáng tự nhiên.
* **Ánh sáng Neon & Glow Huyền Ảo**: Sử dụng ánh sáng huỳnh quang (Cyan Neon `#06b6d4`, Gold VIP `#eab308`, Rose Couple `#e11d48`) làm điểm nhấn thị giác, mô phỏng đèn LED trong phòng chiếu hiện đại.
* **Glassmorphism mờ ảo**: Các thẻ (card), thanh điều hướng và popup sử dụng nền bán trong suốt kết hợp làm mờ hậu cảnh (`backdrop-blur-md`, viền trắng mỏng `border-white/10`).
* **Trực quan hóa 3D & Real-time**: Khán phòng rạp chiếu 3D, chọn ghế POV thực tế từ góc nhìn khán giả, quét laser căn cước CCCD bằng AI và đồng hồ đếm ngược giữ ghế hồi hộp.

---

## 🎨 2. Hệ Thống Màu Chuẩn (Color Tokens & Palette)

### 2.1 Bảng Màu Nền & Bề Mặt (Surfaces & Backgrounds)

| Tên Token | Hex / RGBA | Tailwind Class tương ứng | Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| **Void Dark** | `#06070d` | `bg-cinema-950` / `bg-[#06070d]` | Nền tối tuyệt đối chân trang, đáy màn chiếu, hero background |
| **Space Navy** | `#0a0c16` | `bg-background` / `bg-[#0a0c16]` | Nền trang chính toàn ứng dụng (body/layout) |
| **Surface Card** | `rgba(19, 23, 44, 0.75)` | `bg-card` / `bg-cinema-900/70` | Nền các thẻ MovieCard, Modal, Box nội dung (kèm `backdrop-blur`) |
| **Surface Elevated** | `#13172c` | `bg-cinema-800` | Nền dropdown, thanh công cụ, popover, button secondary hover |
| **Glass Border** | `rgba(255, 255, 255, 0.08)` | `border-white/10` | Viền mờ tiêu chuẩn cho mọi container để tạo cảm giác kính nổi |

### 2.2 Màu Nhấn Neon (Accents & Highlights)

| Accent | Hex Code | Tailwind Gradient / Class | Cảm xúc & Công năng |
| :--- | :--- | :--- | :--- |
| **Cyan Neon** *(Primary)* | `#06b6d4` / `#00F5D4` | `from-cyan-500 to-blue-600` | Màu đại diện thương hiệu CineWave, nút CTA chính, quét laser CCCD |
| **Gold VIP** | `#eab308` | `from-amber-400 to-amber-600` | Hạng ghế VIP, huy hiệu ngôi sao, đặc quyền thành viên |
| **Rose / Crimson** | `#e11d48` / `#f43f5e` | `from-rose-600 to-red-600` | Ghế đôi Sweetbox Couple, nút xem Trailer, cảnh báo quan trọng |
| **Emerald Cyber** | `#10b981` | `bg-emerald-500` | Ghế đang được chọn (Selected), xác thực CCCD thành công |
| **Muted Slate** | `#334155` / `#4b5563` | `bg-slate-700` | Ghế đã bán (Sold/Taken), nút vô hiệu hóa (Disabled) |

### 2.3 Quy Chuẩn Màu Trạng Thái Ghế (Cinema Seat Colors)

```typescript
export const seatColors = {
  AVAILABLE: "bg-cinema-700/80 border-cinema-600 text-gray-300 hover:border-cyan-400",
  VIP:       "bg-amber-500/20 border-amber-500/40 text-amber-300 hover:border-amber-400",
  COUPLE:    "bg-rose-500/20 border-rose-500/40 text-rose-300 hover:border-rose-400",
  SELECTED:  "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/40 scale-105",
  HELD:      "bg-amber-500/60 border-amber-400 text-white animate-pulse",
  SOLD:      "bg-cinema-950/60 border-white/5 text-gray-600 cursor-not-allowed opacity-40",
};
```

### 2.4 Bảng Màu Nhãn Độ Tuổi Phim Điện Ảnh Việt Nam (Age Ratings)

| Nhãn | Ý nghĩa | Lớp CSS Badge (Tailwind) |
| :---: | :--- | :--- |
| **P** | Phổ biến mọi lứa tuổi | `bg-emerald-500/15 text-emerald-400 border-emerald-500/30` |
| **K** | Dưới 13 tuổi xem cùng phụ huynh | `bg-blue-500/15 text-blue-400 border-blue-500/30` |
| **T13** | Khán giả từ 13 tuổi trở lên | `bg-amber-500/15 text-amber-400 border-amber-500/30` |
| **T16** | Khán giả từ 16 tuổi trở lên | `bg-orange-500/15 text-orange-400 border-orange-500/30` |
| **T18** | Khán giả từ 18 tuổi trở lên (yêu cầu CCCD) | `bg-rose-500/15 text-rose-400 border-rose-500/30` |

---

## ✍️ 3. Typography & Phân Cấp Văn Bản (Typography Hierarchy)

* **Font Display (Tiêu đề, Poster, Số ghế, Giá vé)**: `Space Grotesk`, `sans-serif`
  * Đặc điểm: Góc cạnh hiện đại, công nghệ, tương lai.
  * Class Tailwind: `font-display font-black tracking-tight` hoặc `font-bold`.
* **Font Sans (Nội dung, Mô tả, Form, Nhãn)**: `Inter`, `system-ui`, `sans-serif`
  * Đặc điểm: Dễ đọc trên nền tối, thanh thoát, trung tính.
  * Class Tailwind: `font-sans text-gray-300 antialiased`.

### Mẫu Gradient Text Thần Thánh (Vibe Headline)
Dùng cho các tiêu đề chính hoặc cụm từ then chốt:
```html
<h1 className="text-4xl sm:text-6xl font-black font-display tracking-tight text-white">
  ĐẶT VÉ XEM PHIM <br />
  <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
    KHÔNG GIAN 3D ĐỈNH CAO
  </span>
</h1>
```

---

## ✨ 4. Hiệu Ứng Ánh Sáng, Viền & Glassmorphism

### 4.1 Thẻ Kính Nổi (Glassmorphic Container Recipe)
Bất cứ khi nào tạo Card, Box, Panel, Modal:
```css
/* Tailwind Class tổ hợp tiêu chuẩn */
className="bg-cinema-900/70 border border-white/10 backdrop-blur-md rounded-2xl shadow-xl hover:border-cyan-500/40 transition-all duration-300"
```

### 4.2 Ánh Sáng Quầng Nền (Ambient Background Glow)
Đặt các đốm sáng blur mờ phía sau nội dung hero hoặc góc rạp:
```html
<div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-500/15 blur-[120px] rounded-full pointer-events-none" />
<div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />
```

### 4.3 Đổ Bóng Phát Quang (Neon Glow Shadows)
* Cyan Glow: `shadow-lg shadow-cyan-500/25` hoặc `shadow-[0_0_25px_-5px_rgba(6,182,212,0.4)]`
* Gold Glow: `shadow-lg shadow-amber-500/25`
* Red/Rose Glow: `shadow-lg shadow-rose-500/25`
* Emerald Glow: `shadow-lg shadow-emerald-500/30`

---

## 🧩 5. Mẫu Component Chuẩn Gu (Component Recipes)

### 5.1 Nút Bấm Đậm Chất Cyber Cinema (Buttons)

```tsx
// Nút Primary (Kêu gọi hành động chính - Đặt vé / Xác nhận)
<button className="relative inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 active:scale-[0.98] transition-all duration-200">
  <Ticket className="w-4 h-4" />
  Đặt Vé Ngay
</button>

// Nút Gold VIP (Suất chiếu IMAX / Hạng thương gia)
<button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-black rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all">
  <Crown className="w-4 h-4" />
  Trải Nghiệm VIP
</button>

// Nút Secondary Glass (Xem chi tiết / Quay lại)
<button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-200 rounded-xl bg-cinema-700 hover:bg-cinema-600 border border-white/10 hover:border-white/20 transition-all">
  Xem Thêm
</button>
```

---

### 5.2 Thẻ Phim Huyền Ảo (Movie Card with 3D Hover & Trailer Play)

```tsx
<div className="group relative flex flex-col bg-cinema-900/70 border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/15 transition-all duration-300">
  {/* Poster 2:3 với Gradient chìm */}
  <div className="relative aspect-[2/3] w-full overflow-hidden bg-cinema-800">
    <img
      src={movie.posterUrl}
      alt={movie.title}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      loading="lazy"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-cinema-950 via-transparent to-black/40 opacity-80 group-hover:opacity-90 transition-opacity" />

    {/* Badge phân loại độ tuổi góc trên phải */}
    <div className="absolute top-3 right-3 z-10">
      <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/40 backdrop-blur-md">
        {movie.rating}
      </span>
    </div>

    {/* Nút Play Trailer tròn phát sáng khi hover */}
    <button className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
      <div className="w-14 h-14 rounded-full bg-cyan-500/90 text-white flex items-center justify-center shadow-lg shadow-cyan-500/40 transform group-hover:scale-110 transition-transform backdrop-blur-sm">
        <Play className="w-6 h-6 fill-current ml-1" />
      </div>
    </button>

    {/* Thời lượng phim góc dưới trái */}
    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs text-gray-300 bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur-md">
      <Clock className="w-3.5 h-3.5 text-cyan-400" />
      <span>{movie.durationMin} phút</span>
    </div>
  </div>

  {/* Chi tiết phim */}
  <div className="p-4 flex-1 flex flex-col justify-between">
    <div>
      <h3 className="font-display font-bold text-base text-white group-hover:text-cyan-400 transition-colors line-clamp-1 mb-1">
        {movie.title}
      </h3>
      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-4">
        {movie.description}
      </p>
    </div>

    <div className="pt-2 border-t border-white/5">
      <Button variant="primary" size="sm" className="w-full">
        <Ticket className="w-4 h-4" />
        Đặt Vé Ngay
      </Button>
    </div>
  </div>
</div>
```

---

### 5.3 Màn Chiếu Cong IMAX & Sơ Đồ Ghế (Cinema Seat Map)

Màn chiếu mô phỏng độ cong vật lý với dải LED phát sáng hắt xuống khán phòng:
```tsx
{/* Màn Chiếu Cong Phát Sáng */}
<div className="w-full max-w-xl mb-10 flex flex-col items-center">
  <div className="relative w-full h-10 flex items-center justify-center">
    {/* Vòm cong phát quang cyan */}
    <div className="w-full h-3 border-t-4 border-cyan-400 rounded-[100%] shadow-[0_4px_25px_rgba(6,182,212,0.6)]" />
  </div>
  <div className="text-xs font-semibold tracking-widest text-cyan-400 uppercase mt-1">
    MÀN CHIẾU CONG IMAX (SCREEN)
  </div>
</div>

{/* Ghế Đôi (Couple) & Ghế Đơn (Single / VIP) */}
<button className="relative flex flex-col items-center justify-center w-16 h-10 rounded-lg border text-xs font-semibold bg-rose-500/20 border-rose-500/40 text-rose-300 hover:border-rose-400 transition-all active:scale-95">
  <span>C05-06</span>
  <span className="text-[9px] opacity-75">Đôi</span>
</button>
```

---

### 5.4 Modal Quét CCCD AI / Khung Laser Holographic (AI Age Verification)

Khi mở modal quét CCCD, áp dụng hiệu ứng quét laser sinh động:
```tsx
<div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border-2 border-cyan-500/50 bg-black/80 flex items-center justify-center">
  {/* Đường quét laser hologram di chuyển */}
  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-scan pointer-events-none" />

  {/* 4 góc ngắm quét laser (Target Reticle) */}
  <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-cyan-400" />
  <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-cyan-400" />
  <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-cyan-400" />
  <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-cyan-400" />

  {/* Thông báo quyền riêng tư */}
  <div className="absolute bottom-3 text-center px-4">
    <p className="text-[11px] text-gray-400">
      🔒 Ảnh CCCD chỉ dùng xử lý OCR tạm thời trong bộ nhớ và bị xóa tự động.
    </p>
  </div>
</div>
```

---

### 5.5 Vé Điện Tử Hologram & Đồng Hồ Giữ Ghế (Countdown Timer & Ticket Pass)

```tsx
{/* Timer Giữ Ghế Đang Đếm Ngược */}
<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs">
  <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
  <span>Thời gian giữ ghế:</span>
  <span className="font-bold text-sm text-white">09:42</span>
</div>

{/* Thẻ Vé Răng Cưa (Notched Boarding Pass) */}
<div className="relative bg-cinema-900 border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row gap-6 shadow-2xl">
  {/* Phần thông tin suất chiếu bên trái */}
  <div className="flex-1 space-y-2">
    <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider">CineWave IMAX Pass</div>
    <h2 className="text-xl font-bold text-white font-display">Avatar: Dòng Chảy Của Nước</h2>
    <div className="text-sm text-gray-400">Rạp CineWave Landmark • Phòng chiếu IMAX 01</div>
    <div className="flex gap-4 pt-2 text-xs font-mono text-gray-300">
      <div>GHẾ: <span className="text-white font-bold">F08, F09 (VIP)</span></div>
      <div>GIỜ: <span className="text-white font-bold">19:30</span></div>
      <div>NGÀY: <span className="text-white font-bold">24/12/2026</span></div>
    </div>
  </div>

  {/* Đường phân cách đứt nét giữa 2 phần vé */}
  <div className="border-t md:border-t-0 md:border-l border-dashed border-white/20 my-auto" />

  {/* Mã QR Check-in bên phải */}
  <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl">
    <QRCodeSVG value="CINEWAVE-TICKET-BK12938" size={96} />
    <span className="text-[10px] text-gray-800 font-mono mt-1.5 font-semibold">BK-12938</span>
  </div>
</div>
```

---

## 📱 6. Đồng Bộ Giữa Web (Tailwind) và Mobile (React Native)

Khi chuyển giao hoặc viết code cho app Mobile (`mobile/src/...`), hãy tuân thủ ánh xạ theme như sau:

| Khái niệm UI | Web (Tailwind CSS) | Mobile (React Native / `theme`) |
| :--- | :--- | :--- |
| **Màu nền gốc** | `bg-[#06070d]` | `backgroundColor: colors.background` (`#06070d`) |
| **Màu thẻ (Card)** | `bg-cinema-900/70` | `backgroundColor: colors.surface` (`#0e1322`) |
| **Viền mỏng mờ** | `border border-white/10` | `borderColor: colors.border` (`rgba(255,255,255,0.08)`) |
| **Chữ chính / phụ** | `text-white` / `text-gray-400` | `color: colors.text` / `color: colors.textSecondary` |
| **Bo góc** | `rounded-xl` (12px), `rounded-2xl` (16px) | `borderRadius: theme.radius.md` (14) / `lg` (20) |
| **Nút bấm phát sáng** | `shadow-lg shadow-cyan-500/25` | `shadowColor: colors.primary, elevation: 6` |
| **Icon set** | `lucide-react` | `@expo/vector-icons` hoặc `lucide-react-native` |

---

## ⚖️ 7. Quy Tắc Vàng Khi "Vibe Code" (Do's & Don'ts)

### ✅ NÊN LÀM (DO'S)
1. **Luôn giữ Dark Background**: Mọi màn hình mới bắt buộc dùng nền tối (`#06070d` hoặc `#0a0c16`).
2. **Dùng bo góc mềm mại**: Ưu tiên `rounded-xl` (12px) hoặc `rounded-2xl` (16px) cho container; `rounded-full` cho badge/avatar.
3. **Phân cấp màu chữ rõ rệt**:
   - Tiêu đề: `text-white font-bold font-display`
   - Nhãn thông tin / icon: `text-cyan-400` hoặc `text-gray-300`
   - Chú thích phụ / Ngày giờ: `text-gray-400` hoặc `text-gray-500`
4. **Hiệu ứng Hover có chủ đích**: Luôn thêm chuyển động nhẹ khi tương tác chuột (`hover:border-cyan-500/50 transition-all duration-200 active:scale-[0.98]`).
5. **Giữ an toàn dữ liệu CCCD**: Các UI liên quan đến CCCD phải luôn có biểu tượng bảo mật (`ShieldCheck`, `Lock`) và thông điệp minh bạch về việc không lưu trữ ảnh lâu dài.
6. **Định dạng tiền tệ chuẩn**: Luôn format giá vé kiểu Việt Nam: `formatVND(price)` ➔ `120.000 ₫`.

### ❌ KHÔNG ĐƯỢC LÀM (DON'TS)
1. **Không dùng nền trắng sáng thuần túy**: Tuyệt đối không dùng `bg-white` cho background trang hoặc container chính (chỉ dùng màu trắng cho nền mã QR code).
2. **Không dùng đổ bóng đen đậm thô kệch**: Tránh `shadow-black` nặng nề, hãy dùng shadow có ánh màu nhẹ (`shadow-cyan-500/20` hoặc viền `border-white/10`).
3. **Không dùng font có chân (Serif)**: Giữ phong cách hiện đại viễn tưởng với Sans & Monospace.
4. **Không để nút bấm trơ trọi không phản hồi**: Bắt buộc có trạng thái `loading`, `disabled` với opacity mờ và spinner xoay tròn (`animate-spin`).
5. **Không dùng icon quá sặc sỡ hỗn tạp**: Ưu tiên dùng cùng 1 bộ `lucide-react` với nét viền mỏng tinh tế (`strokeWidth={1.75}`).

---

## 🚀 8. Checklist Tự Kiểm Tra Giao Diện Trước Khi Hoàn Tất (Vibe Checklist)

Mỗi khi tạo mới một trang hoặc linh kiện (component), hãy tự hỏi:
- [ ] Giao diện có toát lên vẻ huyền ảo, sang trọng của rạp chiếu phim hiện đại không?
- [ ] Các thẻ đã có viền mờ `border-white/10` và nền `backdrop-blur` chưa?
- [ ] Nút bấm CTA chính có ánh sáng huỳnh quang Neon hoặc hiệu ứng gradient không?
- [ ] Ghế ngồi và nhãn phim có đúng màu quy chuẩn (VIP = Vàng, Đôi = Hồng, P = Xanh lá, T18 = Đỏ hồng) chưa?
- [ ] Responsive hiển thị đẹp cả trên màn hình Desktop lớn lẫn Điện thoại di động?
- [ ] Text tiếng Việt có ngắt dòng tự nhiên, đúng ngữ cảnh điện ảnh không?

---
*Happy Vibe Coding! Biến từng dòng mã thành trải nghiệm điện ảnh 3D đáng nhớ cùng CineWave.* 🚀🍿
