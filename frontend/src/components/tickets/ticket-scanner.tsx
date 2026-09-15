"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, ImageUp, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { decodeQrFromFile, decodeQrFromVideo, getBarcodeDetector, preloadQrDecoder } from "@/utils/decode-qr";
import { parseTicketQr } from "@/utils/ticket-qr";

export function TicketScanner({
  onScan,
  disabled = false,
  resetToken = 0,
}: {
  onScan: (payload: { kind?: "ticket" | "refund"; code: string; sig?: string; raw: string }) => void;
  disabled?: boolean;
  resetToken?: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const lastScan = useRef("");

  useEffect(() => {
    preloadQrDecoder();
  }, []);

  useEffect(() => {
    lastScan.current = "";
  }, [resetToken]);

  useEffect(() => {
    if (!active) return;
    const video = videoRef.current;
    if (!video) return;

    let stream: MediaStream | null = null;
    let timer: number | null = null;
    let stopped = false;

    async function start() {
      setError(null);
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (!video || stopped) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();
        await preloadQrDecoder();
        const detector = getBarcodeDetector();

        const tick = async () => {
          if (stopped || !video) return;
          try {
            let raw: string | null = null;
            if (detector && video.readyState >= 2) {
              const codes = await detector.detect(video);
              raw = codes[0]?.rawValue?.trim() ?? null;
            }
            if (!raw) raw = decodeQrFromVideo(video);
            if (raw && raw !== lastScan.current) {
              const parsed = parseTicketQr(raw);
              if (parsed) {
                lastScan.current = raw;
                onScan({ ...parsed, raw });
              }
            }
          } catch {
            /* keep scanning */
          }
          timer = window.setTimeout(() => void tick(), 280);
        };
        void tick();
      } catch {
        if (!stopped) {
          setError("Không mở được camera. Cho phép quyền camera, hoặc chọn ảnh QR.");
          setActive(false);
        }
      }
    }

    void start();

    return () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
      if (video) video.srcObject = null;
    };
  }, [active, onScan]);

  function emitRaw(raw: string) {
    const parsed = parseTicketQr(raw);
    if (!parsed) {
      setError("Ảnh có QR nhưng không phải vé CINEWAVE. Hãy chụp rõ mã trên vé.");
      return;
    }
    setError(null);
    lastScan.current = raw;
    onScan({ ...parsed, raw });
  }

  function submitManual() {
    const parsed = parseTicketQr(manual);
    if (!parsed) {
      setError("Không nhận ra mã vé. Dán URL QR hoặc mã dạng CW-XXXX.");
      return;
    }
    setError(null);
    onScan({ ...parsed, raw: manual.trim() });
  }

  async function onPickImage(file: File | undefined) {
    if (!file) return;
    setReading(true);
    setError(null);
    try {
      const raw = await decodeQrFromFile(file);
      if (!raw) {
        setError("Không tìm thấy QR trong ảnh. Chụp gần, đủ sáng, không bị cắt góc mã.");
        return;
      }
      emitRaw(raw);
    } catch {
      setError("Không đọc được ảnh QR. Thử ảnh JPEG/PNG rõ hơn.");
    } finally {
      setReading(false);
    }
  }

  return (
    <div className="space-y-3">
      {active ? (
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-black">
          <video ref={videoRef} className="h-64 w-full object-cover" playsInline muted />
          <div className="pointer-events-none absolute inset-10 rounded-xl border border-cyan-400/70 shadow-[0_0_0_999px_rgba(0,0,0,0.35)]" />
          <p className="absolute inset-x-0 bottom-3 text-center text-[11px] font-medium text-cyan-100">
            Đưa mã QR trên vé vào khung
          </p>
        </div>
      ) : null}
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={active ? "outline" : "default"}
          disabled={disabled || reading}
          className="rounded-xl"
          onClick={() => {
            lastScan.current = "";
            setActive((value) => !value);
          }}
        >
          {active ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
          {active ? "Tắt camera" : "Bật camera quét QR"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || reading}
          className="rounded-xl"
          onClick={() => fileRef.current?.click()}
        >
          {reading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageUp className="h-4 w-4" />}
          {reading ? "Đang đọc ảnh…" : "Chọn ảnh QR"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            void onPickImage(file);
          }}
        />
      </div>
      <div className="flex gap-2">
        <Input
          value={manual}
          disabled={disabled || reading}
          placeholder="Dán URL QR hoặc mã vé CW-…"
          className="rounded-xl border-white/10 bg-white/5"
          onChange={(event) => setManual(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") submitManual();
          }}
        />
        <Button type="button" variant="outline" className="shrink-0 rounded-xl" disabled={disabled || reading} onClick={submitManual}>
          Kiểm tra
        </Button>
      </div>
    </div>
  );
}
