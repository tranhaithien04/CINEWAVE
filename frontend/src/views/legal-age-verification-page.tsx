import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { BrandMark } from "@/components/brand/brand-mark";
import { paths } from "@/routes/paths";

export function LegalAgeVerificationPage() {
  return (
    <main className="mx-auto min-h-[70vh] max-w-2xl px-4 py-12">
      <div className="mb-8 space-y-3">
        <BrandMark size="md" />
        <h1 className="font-display flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
          <ShieldCheck className="h-6 w-6 text-cyan-400" strokeWidth={1.75} />
          Điều khoản xác minh tuổi
        </h1>
        <p className="text-sm text-gray-400">
          Áp dụng khi đặt vé phim phân loại T13 / T16 / T18 trên CINEWAVE. Cập nhật gần nhất:{" "}
          {new Date().getFullYear()}.
        </p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-gray-300">
        <section className="space-y-2">
          <h2 className="font-semibold text-white">1. Mục đích</h2>
          <p>
            CINEWAVE yêu cầu xác minh độ tuổi bằng ảnh mặt trước CCCD/VNeID để tuân thủ phân loại độ tuổi
            phim theo quy định điện ảnh. Ảnh chỉ được xử lý tạm thời (OCR/AI) và không lưu lâu dài.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-white">2. Cam kết của người dùng</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-gray-400">
            <li>Giấy tờ tải lên thuộc về chính người đặt vé / người xem.</li>
            <li>Không sử dụng CCCD mượn, giả mạo, ảnh tải từ internet hoặc của người khác.</li>
            <li>Đủ tuổi theo phân loại phim tại thời điểm suất chiếu.</li>
            <li>
              Chịu trách nhiệm trước pháp luật và điều khoản dịch vụ nếu cung cấp thông tin sai hoặc gian
              lận giấy tờ.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-white">3. Quyền của CINEWAVE</h2>
          <p className="text-gray-400">
            CINEWAVE có thể từ chối phát hành / hủy vé, từ chối vào phòng chiếu khi kiểm tra tại cổng, hoặc
            khóa tài khoản nếu phát hiện gian lận xác minh tuổi. Xác minh online là bước kiểm soát sơ bộ;
            kiểm tra CCCD tại rạp vẫn có thể được áp dụng với suất hạn chế tuổi.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-white">4. Dữ liệu</h2>
          <p className="text-gray-400">
            Hệ thống có thể lưu metadata xác minh (kết quả, tuổi đã tính, hash số CCCD đã che) phục vụ audit.
            Ảnh CCCD thô được xóa sau xử lý theo chính sách tối thiểu dữ liệu.
          </p>
        </section>
      </div>

      <p className="mt-10 text-xs text-gray-500">
        <Link href={paths.home} className="text-cyan-300 hover:underline">
          ← Về trang chủ
        </Link>
      </p>
    </main>
  );
}

export default LegalAgeVerificationPage;
