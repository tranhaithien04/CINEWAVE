"use client";

import { useRef } from "react";
import { m } from "@/components/motion";
import { ChevronDown, Clapperboard, ScanLine, ShieldCheck, Ticket } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ScrollHeroBackground } from "@/components/hero/scroll-hero-background";
import { MovieCarousel } from "@/components/movies/movie-carousel";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/hooks/use-catalog";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { paths } from "@/routes/paths";

export function HomePage() {
  const { movies } = useCatalog();
  const reduced = usePrefersReducedMotion();
  const heroTrackRef = useRef<HTMLDivElement>(null);

  const featured = movies.find((movie) => movie.nowShowing) ?? movies[0];
  const nowShowing = movies.filter((movie) => movie.nowShowing);
  const comingSoon = movies.filter((movie) => !movie.nowShowing);

  // Fallback layout when reduced motion is preferred
  if (reduced) {
    return (
      <main className="space-y-16 pb-20">
        <section className="relative isolate min-h-[640px] overflow-hidden bg-[#06070d] md:min-h-[85vh]">
          <ScrollHeroBackground containerRef={heroTrackRef} />
          <div className="relative z-10 mx-auto grid max-w-6xl items-end gap-10 px-4 py-20 md:grid-cols-[1.15fr_0.85fr] md:py-28">
            <div className="flex flex-col gap-6">
              <Badge className="w-fit">Futuristic cyber cinema</Badge>
              <h1 className="max-w-3xl font-display text-4xl font-black tracking-tight text-white sm:text-6xl">
                ĐẶT VÉ XEM PHIM
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                  KHÔNG GIAN 3D ĐỈNH CAO
                </span>
              </h1>
              <p className="max-w-xl text-gray-400 md:text-lg">
                Chọn suất, giữ ghế realtime, xác minh CCCD khi cần, nhận vé QR hologram.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href={paths.movies}>
                    <Ticket className="h-4 w-4" />
                    Đặt vé ngay
                  </Link>
                </Button>
                {featured ? (
                  <Button asChild size="lg" variant="outline">
                    <Link href={paths.movie(featured.slug)}>Xem {featured.title}</Link>
                  </Button>
                ) : null}
              </div>
            </div>
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
      </main>
    );
  }

  return (
    <main className="space-y-16 pb-20">
      {/* ========================================================================= */}
      {/* MULTI-SECTION SCROLL SHOWCASE (Zero-Overlap Sequential Flow)             */}
      {/* ========================================================================= */}
      <div ref={heroTrackRef} className="relative w-full">
        {/* Sticky Pinned Canvas Video Background: locked while scrolling through hero track */}
        <div className="sticky top-0 -z-10 h-screen w-full overflow-hidden pointer-events-none">
          <ScrollHeroBackground containerRef={heroTrackRef} />
        </div>

        {/* Content sections scroll naturally OVER the pinned background (-mt-[100vh]) */}
        <div className="relative z-10 -mt-[100vh]">
          {/* ---------------- SECTION 1: HERO TITLE & CTA ---------------- */}
          <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-28 pb-16 text-center">
            {/* Ambient Background Glow */}
            <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[600px] rounded-full bg-cyan-500/15 blur-[130px]" />
            <div className="pointer-events-none absolute top-1/2 right-4 h-[250px] w-[250px] rounded-full bg-purple-500/10 blur-[100px]" />

            <m.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-6"
            >
              <Badge className="border-cyan-500/30 bg-cyan-950/60 px-4 py-1 text-cyan-300 backdrop-blur-md">
                ✦ Futuristic Cyber Cinema
              </Badge>

              <h1 className="font-display text-4xl font-black tracking-tight text-white sm:text-6xl md:text-7xl">
                ĐẶT VÉ XEM PHIM
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                  KHÔNG GIAN 3D ĐỈNH CAO
                </span>
              </h1>

              <p className="max-w-2xl text-gray-300 sm:text-lg md:text-xl">
                Chọn suất, giữ ghế realtime, xác minh độ tuổi qua CCCD AI, nhận vé QR hologram tương lai.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Button asChild size="lg" className="shadow-lg shadow-cyan-500/25">
                  <Link href={paths.movies}>
                    <Ticket className="mr-2 h-5 w-5" />
                    Đặt vé ngay
                  </Link>
                </Button>
                {featured ? (
                  <Button asChild size="lg" variant="outline" className="border-white/20 backdrop-blur-md hover:bg-white/10">
                    <Link href={paths.movie(featured.slug)}>Xem {featured.title}</Link>
                  </Button>
                ) : null}
              </div>

              {/* Scroll prompt arrow */}
              <div className="mt-8 flex flex-col items-center gap-2 text-xs font-semibold uppercase tracking-widest text-cyan-400/80">
                <span>Cuộn xuống để khám phá</span>
                <ChevronDown className="h-4 w-4 animate-bounce" />
              </div>
            </m.div>
          </section>

          {/* ---------------- SECTION 2: 3 CORE TECH FEATURES ---------------- */}
          <section className="flex min-h-screen flex-col items-center justify-center px-4 py-20">
            <m.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.25 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="mx-auto w-full max-w-5xl"
            >
              <div className="mb-10 text-center">
                <Badge className="border-cyan-400/40 bg-cyan-950/80 text-cyan-200">
                  Quy trình đặt vé
                </Badge>
                <h2 className="mt-3 font-display text-3xl font-black tracking-tight text-white sm:text-5xl">
                  Từ chọn suất đến vào ghế
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm font-medium text-gray-200 md:text-base">
                  Ba bước gọn: chọn suất chuẩn rạp, giữ ghế live, xác minh tuổi khi cần — rồi nhận vé QR.
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

          {/* ---------------- SECTION 3: SPOTLIGHT FEATURED MOVIE ---------------- */}
          {featured ? (
            <section className="flex min-h-screen flex-col items-center justify-center px-4 py-20">
              <m.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.25 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="mx-auto w-full max-w-4xl"
              >
                <Link
                  href={paths.movie(featured.slug)}
                  className="group relative block overflow-hidden rounded-3xl border border-cyan-500/30 bg-cinema-900/60 shadow-2xl shadow-cyan-500/20 backdrop-blur-xl transition-[border-color] duration-500 hover:border-cyan-400"
                >
                  <div className="relative aspect-[21/9] min-h-[320px] w-full">
                    <Image
                      src={featured.backdropUrl}
                      alt={featured.title}
                      fill
                      priority
                      sizes="(min-width: 1024px) 80vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-cinema-950 via-cinema-950/70 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-8 md:p-12">
                      <Badge className="w-fit border-cyan-400/40 bg-cyan-950/80 text-cyan-300">
                        ★ Phim Nổi Bật Tuần Này
                      </Badge>
                      <h2 className="mt-3 font-display text-3xl font-black text-white sm:text-5xl">
                        {featured.title}
                      </h2>
                      <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-gray-300 md:text-base">
                        {featured.description}
                      </p>
                      <div className="mt-6 flex items-center gap-4">
                        <Button size="lg" className="shadow-lg shadow-cyan-500/30">
                          <Ticket className="mr-2 h-4 w-4" />
                          Đặt vé suất sớm
                        </Button>
                        <span className="text-sm font-semibold text-cyan-300 group-hover:underline">
                          Xem chi tiết phim →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </m.div>
            </section>
          ) : null}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOVIE CATALOG CAROUSELS (Seamless continuation)                           */}
      {/* ========================================================================= */}
      <section className="relative z-10 mx-auto max-w-6xl space-y-6 px-4 pt-10">
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

      <section className="relative z-10 mx-auto max-w-6xl space-y-6 px-4">
        <SectionHeading eyebrow="Coming soon" title="Sắp chiếu" />
        <MovieCarousel movies={comingSoon} />
      </section>
    </main>
  );
}

export default HomePage;

