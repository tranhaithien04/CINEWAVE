import { ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/brand/brand-mark";
import { paths } from "@/routes/paths";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#06070d]/90 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
          {/* Brand & Mission */}
          <div className="space-y-3">
            <BrandMark size="md" />
            <p className="max-w-sm text-xs leading-relaxed text-gray-400">
              Nền tảng đặt vé điện ảnh không gian 3D tương lai. Tích hợp công nghệ giữ ghế realtime, phòng chiếu IMAX Laser và kiểm soát độ tuổi tự động bằng thị giác máy tính AI (YOLO + OCR).
            </p>
            <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-cyan-400">
              <ShieldCheck className="h-4 w-4" />
              <span>Bảo mật dữ liệu CCCD · Không lưu trữ ảnh lâu dài</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <p className="font-display text-xs font-bold uppercase tracking-wider text-white">Khám phá rạp</p>
            <nav className="flex flex-col gap-2 text-xs text-gray-400">
              <Link href={paths.movies} className="transition-colors hover:text-cyan-300">
                Phim đang chiếu & sắp chiếu
              </Link>
              <Link href={paths.tickets} className="transition-colors hover:text-cyan-300">
                Ví vé điện tử (QR Hologram)
              </Link>
              <Link href={paths.notifications} className="transition-colors hover:text-cyan-300">
                Thông báo suất chiếu & giữ ghế
              </Link>
            </nav>
          </div>

          {/* Technology & Standards */}
          <div className="space-y-3">
            <p className="font-display text-xs font-bold uppercase tracking-wider text-white">Chuẩn rạp chiếu</p>
            <div className="flex flex-col gap-2 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-cyan-400" /> IMAX Laser 4K 120 FPS
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-amber-400" /> Hệ thống âm thanh Dolby Atmos 360°
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-emerald-400" /> Quét CCCD chuẩn định danh Việt Nam
              </span>
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 text-[11px] text-gray-500 sm:flex-row">
          <p>© {new Date().getFullYear()} CINEWAVE Inc. Tất cả quyền được bảo lưu.</p>
          <div className="flex gap-4">
            <Link href={paths.legalAgeVerification} className="hover:text-gray-400">
              Điều khoản xác minh tuổi
            </Link>
            <Link href={paths.login} className="hover:text-gray-400">
              Đăng nhập thành viên
            </Link>
            <Link href="/admin" className="hover:text-gray-400">
              Quản trị rạp (Admin)
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
