gsap.registerPlugin(ScrollTrigger);

// ----------------------------------------------------
// 1. Lenis Smooth Scroll Setup (Ultra-Smooth Momentum)
// ----------------------------------------------------
const lenis = new Lenis({
  duration: 1.6, // Tăng thời gian lướt quán tính mượt mà
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Hàm giảm tốc hàm mũ tự nhiên
  orientation: "vertical",
  gestureOrientation: "vertical",
  smoothWheel: true,
  wheelMultiplier: 0.85, // Giảm bớt sốc khi lăn chuột nhanh
  touchMultiplier: 1.6,
});

lenis.on("scroll", ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// ----------------------------------------------------
// 2. DOM Elements & State
// ----------------------------------------------------
const video = document.getElementById("bg-video");
const canvas = document.getElementById("bg-canvas");
const context = canvas.getContext("2d", { alpha: false }); // Tắt alpha channel để tăng tốc độ GPU

// Kích hoạt bộ lọc nội suy chất lượng cao của trình duyệt
context.imageSmoothingEnabled = true;
context.imageSmoothingQuality = "high";

const loader = document.getElementById("loader");
const loaderFill = document.getElementById("loader-fill");
const loaderInfo = document.getElementById("loader-info");
const scrollPct = document.getElementById("scroll-pct");
const fpsCounter = document.getElementById("fps-counter");
const btnVideo = document.getElementById("btn-mode-video");
const btnCanvas = document.getElementById("btn-mode-canvas");

let currentMode = "canvas"; // 'canvas' | 'video'
let videoScrollTrigger = null;

// Thước đo FPS thời gian thực
let frameCountTimes = 0;
let lastFpsTime = performance.now();
function updateFpsMeter() {
  frameCountTimes++;
  const now = performance.now();
  if (now - lastFpsTime >= 1000) {
    const fps = Math.round((frameCountTimes * 1000) / (now - lastFpsTime));
    if (fpsCounter) fpsCounter.textContent = `${fps} FPS`;
    frameCountTimes = 0;
    lastFpsTime = now;
  }
  requestAnimationFrame(updateFpsMeter);
}
requestAnimationFrame(updateFpsMeter);

// ----------------------------------------------------
// 3. GPU Canvas Frame Buffering & Sub-pixel Optical Crossfade
// ----------------------------------------------------
const TOTAL_FRAMES = 90; // 90 khung hình dày đặc
const bitmaps = [];
const playhead = { frame: 0 };
let framesExtracted = false;

let targetProgress = 0;
let currentProgress = 0;

// Căn chỉnh kích thước Canvas chuẩn Retina / HiDPI
function resizeCanvas() {
  if (currentMode !== "canvas") return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  renderCanvas();
}
window.addEventListener("resize", resizeCanvas);

// KỸ THUẬT QUAN TRỌNG: Hòa trộn khung hình quang học (Optical Crossfade Blending)
// Khi playhead.frame là số lẻ (ví dụ 14.35), Frame 14 sẽ tan biến dần vào Frame 15
// Loại bỏ hoàn toàn cảm giác giật từng nấc, tạo cảm giác mượt 120 FPS như phim nhựa chiếu chậm
function renderCanvas() {
  if (currentMode !== "canvas" || bitmaps.length === 0) return;

  const cw = canvas.width;
  const ch = canvas.height;
  if (!cw || !ch) return;

  const currentF = playhead.frame;
  const indexA = Math.floor(currentF);
  const indexB = Math.min(indexA + 1, bitmaps.length - 1);
  const blend = currentF - indexA; // Phần lẻ từ 0.0 -> 1.0

  const bitmapA = bitmaps[indexA];
  const bitmapB = bitmaps[indexB];
  if (!bitmapA) return;

  const bw = bitmapA.width;
  const bh = bitmapA.height;
  const scale = Math.max(cw / bw, ch / bh);
  const dw = bw * scale;
  const dh = bh * scale;
  const dx = (cw - dw) / 2;
  const dy = (ch - dh) / 2;

  // Vẽ khung hình A (gốc)
  context.globalAlpha = 1.0;
  context.drawImage(bitmapA, dx, dy, dw, dh);

  // Hòa tan mềm mại vào khung hình B tiếp theo theo tỉ lệ blend
  if (blend > 0.001 && bitmapB && indexA !== indexB) {
    context.globalAlpha = blend;
    context.drawImage(bitmapB, dx, dy, dw, dh);
    context.globalAlpha = 1.0;
  }
}

// Trích xuất video vào VRAM đồ họa (GPU ImageBitmap)
async function extractFramesFromVideo() {
  if (framesExtracted) return;

  loader.classList.remove("hidden");
  loaderInfo.textContent = "Đang kết nối video...";

  const offVideo = document.createElement("video");
  offVideo.src = "/videos/hero-cinematic.mp4";
  offVideo.muted = true;
  offVideo.playsInline = true;
  offVideo.preload = "auto";

  await new Promise((resolve) => {
    offVideo.addEventListener("loadedmetadata", resolve, { once: true });
    offVideo.load();
  });

  const duration = offVideo.duration || 5;
  const offCanvas = document.createElement("canvas");
  const targetWidth = Math.min(offVideo.videoWidth || 1920, 1280);
  const targetHeight = Math.round(targetWidth * ((offVideo.videoHeight || 1080) / (offVideo.videoWidth || 1920)));
  offCanvas.width = targetWidth;
  offCanvas.height = targetHeight;
  const offCtx = offCanvas.getContext("2d", { willReadFrequently: false });

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const time = (i / (TOTAL_FRAMES - 1)) * Math.max(0.1, duration - 0.04);
    offVideo.currentTime = time;

    await new Promise((resolve) => {
      offVideo.addEventListener("seeked", resolve, { once: true });
    });

    offCtx.drawImage(offVideo, 0, 0, targetWidth, targetHeight);
    const bitmap = await createImageBitmap(offCanvas);
    bitmaps.push(bitmap);

    const pct = Math.round(((i + 1) / TOTAL_FRAMES) * 100);
    loaderFill.style.width = `${pct}%`;
    loaderInfo.textContent = `Tối ưu hóa 120 FPS: ${pct}% (${i + 1}/${TOTAL_FRAMES})`;
  }

  framesExtracted = true;
  loader.classList.add("hidden");
  resizeCanvas();
}

// Vòng lặp vật lý RequestAnimationFrame độc lập (Exponential Smoothing Loop)
function physicsLoop() {
  if (currentMode === "canvas" && bitmaps.length > 0) {
    // Nội suy hàm mũ: currentProgress lướt êm tới targetProgress với hệ số 0.08
    const delta = targetProgress - currentProgress;
    if (Math.abs(delta) > 0.00001) {
      currentProgress += delta * 0.08;
      // frame là số thập phân liên tục (ví dụ: 15.42)
      playhead.frame = Math.max(0, Math.min(bitmaps.length - 1, currentProgress * (bitmaps.length - 1)));
      renderCanvas();
    }
  }
  requestAnimationFrame(physicsLoop);
}
requestAnimationFrame(physicsLoop);

function initCanvasMode() {
  if (videoScrollTrigger) {
    videoScrollTrigger.kill();
    videoScrollTrigger = null;
  }
  video.style.display = "none";
  canvas.style.display = "block";
  resizeCanvas();
}

// ----------------------------------------------------
// 4. Mode B: Non-Blocking MP4 Video Scrubbing
// ----------------------------------------------------
let videoTargetTime = 0;
let isSeeking = false;
let pendingSeek = false;

function setupVideoEvents() {
  video.addEventListener("seeking", () => {
    isSeeking = true;
  });

  video.addEventListener("seeked", () => {
    isSeeking = false;
    if (pendingSeek) {
      pendingSeek = false;
      const duration = video.duration || 1;
      const clamped = Math.max(0, Math.min(duration - 0.05, videoTargetTime));
      if (Math.abs(clamped - video.currentTime) > 0.02) {
        if (video.fastSeek) {
          video.fastSeek(clamped);
        } else {
          video.currentTime = clamped;
        }
      }
    }
  });
}
setupVideoEvents();

function initVideoMode() {
  canvas.style.display = "none";
  video.style.display = "block";
  video.currentTime = 0.01;

  if (videoScrollTrigger) videoScrollTrigger.kill();

  videoScrollTrigger = ScrollTrigger.create({
    trigger: "#content-track",
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      const duration = video.duration || 1;
      videoTargetTime = self.progress * duration;

      if (!isSeeking) {
        const clamped = Math.max(0, Math.min(duration - 0.05, videoTargetTime));
        if (Math.abs(clamped - video.currentTime) > 0.02) {
          if (video.fastSeek) {
            video.fastSeek(clamped);
          } else {
            video.currentTime = clamped;
          }
        }
      } else {
        pendingSeek = true;
      }
    },
  });
}

// ----------------------------------------------------
// 5. Đồng bộ Scroll Indicator & Hoạt ảnh Chữ Parallax
// ----------------------------------------------------
function initCommonUI() {
  // Lắng nghe tiến trình cuộn tổng thể
  ScrollTrigger.create({
    trigger: "#content-track",
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      targetProgress = self.progress;
      const pct = Math.round(self.progress * 100);
      if (scrollPct) scrollPct.textContent = `${pct}% SCROLL`;
    },
  });

  // Hoạt ảnh từng thẻ chữ Overlay: Scrubbed Parallax mượt mà theo từng điểm cuộn
  const sections = gsap.utils.toArray(".scroll-section");
  sections.forEach((section) => {
    const card = section.querySelector(".card-overlay");

    gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 95%",
        end: "bottom 5%",
        scrub: 1.2, // Quán tính scrub đồng bộ với Lenis
      },
    })
    .fromTo(
      card,
      { opacity: 0, y: 70, scale: 0.94 },
      { opacity: 1, y: 0, scale: 1, ease: "power1.out", duration: 0.35 }
    )
    .to(
      card,
      { opacity: 0, y: -70, scale: 0.96, ease: "power1.in", duration: 0.35 },
      "+=0.3"
    );
  });
}

// ----------------------------------------------------
// 6. Mode Switcher
// ----------------------------------------------------
async function switchMode(mode) {
  currentMode = mode;

  if (mode === "canvas") {
    btnCanvas.classList.add("active");
    btnVideo.classList.remove("active");
    if (!framesExtracted) {
      await extractFramesFromVideo();
    }
    initCanvasMode();
  } else {
    btnVideo.classList.add("active");
    btnCanvas.classList.remove("active");
    loader.classList.add("hidden");
    initVideoMode();
  }

  ScrollTrigger.refresh();
}
window.switchMode = switchMode;

// ----------------------------------------------------
// 7. Khởi động ứng dụng
// ----------------------------------------------------
async function bootstrap() {
  initCommonUI();
  await extractFramesFromVideo();
  initCanvasMode();
}

bootstrap();
