"use client";

import { useRef, useState } from "react";
import { m } from "@/components/motion";
import { ArrowRight, ChevronDown, Clapperboard, ScanLine, ShieldCheck, Ticket } from "lucide-react";
import Link from "next/link";

import { ScrollHeroBackground } from "@/components/hero/scroll-hero-background";
import { FeaturedSpotlight } from "@/components/home/featured-spotlight";
import { MovieCarousel } from "@/components/movies/movie-carousel";
import { QuickBookDialog } from "@/components/movies/quick-book-dialog";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import type { Movie } from "@/@types/movie";
import { useCatalog } from "@/hooks/use-catalog";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { paths } from "@/routes/paths";
import { cn } from "@/utils/cn";

const heroEase = [0.22, 1, 0.36, 1] as const;

function HeroCopy({
  featured,
  centered,
  onBookFeatured,
}: {
  featured: Movie | undefined;
  centered?: boolean;
  onBookFeatured?: () => void;
}) {
  return (
    <div
      className={cn(
        "relative z-10 flex max-w-4xl flex-col gap-7",
        centered ? "mx-auto items-center text-center" : "items-start text-left",
      )}
    >
      <p
        className={cn(
          "brand-wordmark font-display text-sm font-black tracking-[0.35em] text-transparent sm:text-base",
          centered && "text-center",
        )}
      >
        CINEWAVE
      </p>

      <div
        className={cn(
          "inline-flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300/90",
          centered ? "justify-center" : "",
        )}
      >
        <span className="h-px w-6 bg-gradient-to-r from-transparent to-cyan-400/80" aria-hidden />
        <span>Trải nghiệm rạp chiếu thế hệ mới</span>
        <span className="h-px w-6 bg-gradient-to-l from-transparent to-cyan-400/80" aria-hidden />
      </div>

      <h1 className="font-display text-[2.65rem] font-black leading-[0.95] tracking-[-0.04em] text-white sm:text-6xl md:text-7xl lg:text-[5.25rem]">
        <span className="block text-balance">ĐẶT VÉ CHUẨN RẠP</span>
        <span className="mt-1 block bg-gradient-to-r from-cyan-200 via-sky-300 to-cyan-500 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(34,211,238,0.25)]">
          TRONG VÀI PHÚT
        </span>
      </h1>

      <p
        className={cn(
          "max-w-xl text-[15px] leading-relaxed text-gray-300/95 sm:text-lg",
          centered && "mx-auto",
        )}
      >
        Chọn suất, giữ ghế realtime trên sơ đồ 3D, xác minh tuổi an toàn khi suất yêu cầu — vé QR sẵn
        sàng trên điện thoại.
      </p>

      <div className={cn("flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center", centered && "justify-center")}>
        <Button
          asChild
          size="lg"
          className="h-12 rounded-2xl px-8 text-[15px] shadow-[0_0_40px_-8px_rgba(34,211,238,0.55)]"
        >
          <Link href={paths.movies}>
            <Ticket className="h-4 w-4" />
            Chọn suất chiếu
            <ArrowRight className="h-4 w-4 opacity-80" />
          </Link>
        </Button>
        {featured ? (
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="h-12 max-w-[min(100%,20rem)] truncate rounded-2xl border-white/15 bg-white/[0.04] px-6 text-[15px] text-white backdrop-blur-md hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-cyan-100"
            onClick={onBookFeatured}
          >
            Đặt vé · {featured.title}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function HomePage() {
  const { movies } = useCatalog();
  const reduced = usePrefersReducedMotion();
  const heroTrackRef = useRef<HTMLDivElement>(null);
  const [bookOpen, setBookOpen] = useState(false);

  const featured = movies.find((movie) => movie.nowShowing) ?? movies[0];
  const nowShowing = movies.filter((movie) => movie.nowShowing);
  const comingSoon = movies.filter((movie) => !movie.nowShowing);

  // Fallback layout when reduced motion is preferred
  if (reduced) {
    return (
      <main className="space-y-16 pb-20">
        <section className="relative isolate min-h-[640px] overflow-hidden bg-[#06070d] md:min-h-[85vh]">
          <ScrollHeroBackground containerRef={heroTrackRef} />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_40%,rgba(6,7,13,0.15),rgba(6,7,13,0.55)_75%)]"
          />
          <div className="relative z-10 mx-auto flex max-w-6xl items-end px-4 py-20 md:py-28">
            <HeroCopy featured={featured} onBookFeatured={() => setBookOpen(true)} />
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 md:grid-cols-3">
          {[
            {
              icon: Clapperboard,
              title: "Lịch chiếu chuẩn rạp",
              text: "Suất, phòng và nhãn tuổi P–T18 đồng bộ realtime.",
            },
            {
              icon: ScanLine,
              title: "Sơ đồ ghế 3D live",
              text: "Giữ ghế 4,5 phút — trống / đang giữ / đã bán tách rõ.",
            },
            {
              icon: ShieldCheck,
              title: "Age gate CCCD",
              text: "Chỉ xác minh khi suất hạn chế tuổi, không lưu ảnh.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-cyan-400/30 bg-gradient-to-b from-cyan-500/15 to-cinema-900/90 p-6 shadow-xl shadow-cyan-950/40 backdrop-blur-md"
            >
              <item.icon className="mb-4 h-6 w-6 text-cyan-300" strokeWidth={2} />
              <h2 className="font-display text-lg font-black text-white">{item.title}</h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-gray-200">{item.text}</p>
            </div>
          ))}
        </section>

        <section className="mx-auto max-w-6xl space-y-6 px-4">
          <SectionHeading eyebrow="Now showing" title="Đang chiếu" />
          <MovieCarousel movies={nowShowing} />
        </section>

        <section className="mx-auto max-w-6xl space-y-6 px-4">
          <SectionHeading eyebrow="Coming soon" title="Sắp chiếu" />
          <MovieCarousel movies={comingSoon} />
        </section>

        <QuickBookDialog movie={featured ?? null} open={bookOpen} onOpenChange={setBookOpen} />
      </main>
    );
  }

  return (
    <main className="pb-20">
      {/* ========================================================================= */}
      {/* MULTI-SECTION SCROLL SHOWCASE (Zero-Overlap Sequential Flow)             */}
      {/* ========================================================================= */}
      <div ref={heroTrackRef} className="relative w-full">
        {/* Sticky canvas — bottom mask softens the unpin edge */}
        <div
          className="pointer-events-none sticky top-0 -z-10 h-[100svh] w-full overflow-hidden"
          style={{
            WebkitMaskImage:
              "linear-gradient(to bottom, #000 0%, #000 78%, rgba(0,0,0,0.65) 92%, transparent 100%)",
            maskImage:
              "linear-gradient(to bottom, #000 0%, #000 78%, rgba(0,0,0,0.65) 92%, transparent 100%)",
          }}
        >
          <ScrollHeroBackground containerRef={heroTrackRef} />
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_40%,rgba(6,7,13,0.08),rgba(6,7,13,0.32)_75%,rgba(6,7,13,0.42))]"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#0a0c16]/40 to-transparent"
          />
        </div>

        {/* Pull content over sticky; +1px overlap kills subpixel hairline gaps */}
        <div className="relative z-10 -mt-[calc(100svh-1px)]">
          {/* ---------------- SECTION 1: HERO TITLE & CTA ---------------- */}
          <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-visible px-4 pt-20 pb-16">
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-[36%] h-[380px] w-[min(92vw,680px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/[0.08] blur-[100px]"
            />

            <m.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
              }}
              className="relative z-10 flex w-full max-w-4xl flex-col items-center"
            >
              <m.div
                variants={{
                  hidden: { opacity: 0, y: 28 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.85, ease: heroEase } },
                }}
              >
                <HeroCopy featured={featured} centered onBookFeatured={() => setBookOpen(true)} />
              </m.div>

              <m.div
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: heroEase } },
                }}
                className="mt-12 flex flex-col items-center gap-3"
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300/70">
                  Khám phá trải nghiệm
                </span>
                <span className="relative flex h-10 w-px overflow-hidden bg-white/10">
                  <span className="absolute inset-x-0 top-0 h-1/2 animate-[scan_1.8s_ease-in-out_infinite] bg-gradient-to-b from-cyan-300 to-transparent" />
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-cyan-400/60" aria-hidden />
              </m.div>
            </m.div>
          </section>

          {/* ---------------- SECTION 2: 3 CORE TECH FEATURES ---------------- */}
          <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-visible px-4 py-24">
            <m.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="relative z-10 mx-auto w-full max-w-5xl"
            >
              <div className="mb-12 text-center">
                <div className="mb-4 inline-flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300/85">
                  <span className="h-px w-5 bg-gradient-to-r from-transparent to-cyan-400/70" aria-hidden />
                  3 bước · 1 lần chạm
                  <span className="h-px w-5 bg-gradient-to-l from-transparent to-cyan-400/70" aria-hidden />
                </div>
                <h2 className="font-display text-3xl font-black tracking-[-0.03em] text-white sm:text-5xl">
                  Đặt vé không rườm rà
                </h2>
                <p className="mx-auto mt-4 max-w-md text-sm font-medium leading-relaxed text-gray-300 md:text-base">
                  Suất chuẩn rạp → ghế 3D live → vé QR. Xong.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                {[
                  {
                    icon: Clapperboard,
                    title: "Lịch chiếu chuẩn rạp",
                    text: "Suất chiếu, phòng và nhãn tuổi P–T18 cập nhật realtime. Chọn đúng phim, đúng khung giờ, đúng độ tuổi.",
                    accent: "from-cyan-500/40 via-sky-600/25 to-[#0b1224]/95",
                    ring: "border-cyan-400/45 hover:border-cyan-300/70",
                    glow: "shadow-cyan-500/25",
                    iconTone: "border-cyan-400/40 bg-cyan-500/20 text-cyan-200",
                  },
                  {
                    icon: ScanLine,
                    title: "Sơ đồ ghế 3D live",
                    text: "Phòng chiếu 3D hiển thị ghế trống, đang giữ và đã bán. Giữ chỗ 4,5 phút để thanh toán không mất ghế.",
                    accent: "from-sky-500/35 via-blue-700/30 to-[#0a1020]/95",
                    ring: "border-sky-400/45 hover:border-sky-300/70",
                    glow: "shadow-sky-500/25",
                    iconTone: "border-sky-400/40 bg-sky-500/20 text-sky-200",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Age gate bằng CCCD",
                    text: "Chỉ xác minh khi suất hạn chế tuổi. AI đọc giấy tờ tạm thời — không lưu ảnh sau khi kiểm tra xong.",
                    accent: "from-emerald-500/30 via-teal-700/25 to-[#0a1412]/95",
                    ring: "border-emerald-400/40 hover:border-emerald-300/65",
                    glow: "shadow-emerald-500/20",
                    iconTone: "border-emerald-400/40 bg-emerald-500/20 text-emerald-200",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${item.accent} ${item.ring} p-8 shadow-2xl ${item.glow} backdrop-blur-xl transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-12px_rgba(34,211,238,0.35)]`}
                  >
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-70"
                    />
                    <div className={`mb-5 inline-flex rounded-xl border p-3.5 ${item.iconTone}`}>
                      <item.icon className="h-7 w-7" strokeWidth={2.1} />
                    </div>
                    <h3 className="font-display text-xl font-black tracking-tight text-white sm:text-2xl">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm font-medium leading-relaxed text-gray-100/95">{item.text}</p>
                  </div>
                ))}
              </div>
            </m.div>
          </section>

          {featured ? <FeaturedSpotlight movie={featured} onBook={() => setBookOpen(true)} /> : null}

          {/* Compact cover: bury sticky edge without a huge empty void */}
          <div className="relative z-20 w-full" aria-hidden>
            <div className="h-24 bg-gradient-to-b from-transparent via-[#0a0c16]/75 to-[#0a0c16]" />
            <div className="h-16 bg-[#0a0c16]" />
          </div>
        </div>
      </div>

      {/* Catalog shares the same solid stage — seamless continuation */}
      <div className="relative z-10 bg-[#0a0c16]">
        <section className="relative mx-auto max-w-6xl space-y-6 px-4 pb-6 pt-4 md:pt-6">
          <SectionHeading
            eyebrow="Now showing"
            title="Đang chiếu"
            action={
              <Button asChild variant="ghost" className="text-cyan-400 hover:text-cyan-300">
                <Link href={paths.movies}>Tất cả phim</Link>
              </Button>
            }
          />
          <MovieCarousel movies={nowShowing} />
        </section>

        <section className="relative mx-auto max-w-6xl space-y-6 px-4 pb-4 pt-8">
          <SectionHeading eyebrow="Coming soon" title="Sắp chiếu" />
          <MovieCarousel movies={comingSoon} />
        </section>
      </div>

      <QuickBookDialog movie={featured ?? null} open={bookOpen} onOpenChange={setBookOpen} />
    </main>
  );
}

export default HomePage;

