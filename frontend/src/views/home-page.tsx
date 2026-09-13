"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
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
            { icon: Clapperboard, title: "Chọn phim & suất", text: "Lọc theo độ tuổi P đến T18." },
            { icon: ScanLine, title: "Giữ ghế realtime", text: "Ghế trống, đang giữ, đã đặt tách màu rõ." },
            { icon: ShieldCheck, title: "Age gate CCCD", text: "Chỉ xác minh khi phim hạn chế tuổi." },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-cinema-900/70 p-6 shadow-xl backdrop-blur-md"
            >
              <item.icon className="mb-4 h-5 w-5 text-cyan-400" strokeWidth={1.75} />
              <h2 className="font-display font-bold text-white">{item.title}</h2>
              <p className="mt-2 text-sm text-gray-400">{item.text}</p>
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

            <motion.div
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
            </motion.div>
          </section>

          {/* ---------------- SECTION 2: 3 CORE TECH FEATURES ---------------- */}
          <section className="flex min-h-screen flex-col items-center justify-center px-4 py-20">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.25 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="mx-auto w-full max-w-5xl"
            >
              <div className="mb-10 text-center">
                <Badge className="border-cyan-500/30 bg-cyan-950/60 text-cyan-300">
                  Trải Nghiệm Đột Phá
                </Badge>
                <h2 className="mt-3 font-display text-3xl font-black text-white sm:text-5xl">
                  CÔNG NGHỆ RẠP CHIẾU THẾ HỆ MỚI
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-sm text-gray-300 md:text-base">
                  Quy trình mua vé và trải nghiệm điện ảnh khép kín tối ưu hóa bằng trí tuệ nhân tạo.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {[
                  {
                    icon: Clapperboard,
                    title: "Chọn phim & suất chiếu",
                    text: "Bộ lọc thông minh theo phân loại độ tuổi P, T13, T16, T18 cập nhật theo thời gian thực.",
                    accent: "from-cyan-500/20 to-blue-500/5",
                  },
                  {
                    icon: ScanLine,
                    title: "Giữ ghế 3D Realtime",
                    text: "Sơ đồ phòng chiếu 3D chân thực, hiển thị trực quan ghế trống, đang giữ và đã đặt.",
                    accent: "from-blue-500/20 to-indigo-500/5",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Xác thực CCCD bằng AI",
                    text: "YOLO + OCR nhận diện độ tuổi nhanh chóng từ căn cước công dân, bảo mật thông tin tối đa.",
                    accent: "from-purple-500/20 to-pink-500/5",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b ${item.accent} p-8 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/50`}
                  >
                    <div className="mb-5 inline-flex rounded-xl border border-white/10 bg-white/5 p-3.5 text-cyan-400">
                      <item.icon className="h-6 w-6" strokeWidth={1.8} />
                    </div>
                    <h3 className="font-display text-xl font-bold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-300">{item.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* ---------------- SECTION 3: SPOTLIGHT FEATURED MOVIE ---------------- */}
          {featured ? (
            <section className="flex min-h-screen flex-col items-center justify-center px-4 py-20">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.25 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="mx-auto w-full max-w-4xl"
              >
                <Link
                  href={paths.movie(featured.slug)}
                  className="group relative block overflow-hidden rounded-3xl border border-cyan-500/30 bg-cinema-900/60 shadow-2xl shadow-cyan-500/20 backdrop-blur-xl transition-all duration-500 hover:border-cyan-400"
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
              </motion.div>
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

