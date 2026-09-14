"use client";

import { CheckCircle2, Loader2, Lock, ShieldCheck, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { AgeRating } from "@/@types/movie";
import { submitAgeVerification } from "@/api/age-verification";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const requiredAge: Record<AgeRating, number | null> = {
  P: null,
  K: null,
  T13: 13,
  T16: 16,
  T18: 18,
};

export function needsAgeGate(rating: AgeRating) {
  return requiredAge[rating] !== null;
}

type GateStep = "idle" | "preview" | "scanning" | "success" | "fail";

export function AgeGateDialog({
  open,
  rating,
  movieSlug,
  onOpenChange,
  onPassed,
}: {
  open: boolean;
  rating: AgeRating;
  movieSlug?: string;
  onOpenChange: (open: boolean) => void;
  onPassed: () => void;
}) {
  const { user } = useAuth();
  const [step, setStep] = useState<GateStep>("idle");
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [idMasked, setIdMasked] = useState<string | null>(null);
  const [computedAge, setComputedAge] = useState<number | null>(null);
  const [failMessage, setFailMessage] = useState<string | null>(null);
  const age = requiredAge[rating];

  useEffect(() => {
    if (!previewFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(previewFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [previewFile]);

  function reset() {
    setPreviewFile(null);
    setIdMasked(null);
    setComputedAge(null);
    setFailMessage(null);
    setStep("idle");
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    setPreviewFile(file);
    setStep("preview");
  }

  async function scan() {
    const file = previewFile;
    if (!file) {
      toast.error("Vui lòng chọn ảnh CCCD");
      return;
    }
    if (!user) {
      toast.error("Vui lòng đăng nhập để xác minh tuổi");
      return;
    }

    setStep("scanning");
    setFailMessage(null);
    try {
      const result = await submitAgeVerification({
        file,
        rating,
        movieSlug,
      });
      setIdMasked(result.idMasked);
      setComputedAge(result.computedAge);
      if (result.passed) {
        setStep("success");
        toast.success(result.message || "Đủ tuổi xem suất này. Không lưu ảnh CCCD.");
        onPassed();
      } else {
        setFailMessage(result.message || "Không nhận diện được giấy tờ.");
        setStep("fail");
        toast.error(result.message || "Không nhận diện được giấy tờ. Thử ảnh rõ hơn.");
      }
    } catch (error) {
      setFailMessage(error instanceof Error ? error.message : "Xác minh tuổi thất bại");
      setStep("fail");
      toast.error(error instanceof Error ? error.message : "Không ghi nhận được xác minh tuổi");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="rounded-2xl border-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-white">
            <ShieldCheck className="h-5 w-5 text-cyan-400" strokeWidth={1.75} />
            Xác minh độ tuổi
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Phim {rating} yêu cầu đủ {age}+ tuổi tính theo ngày chiếu. Ảnh CCCD chỉ xử lý OCR tạm thời và bị xóa tự động.
          </DialogDescription>
        </DialogHeader>

        {step === "scanning" ? (
          <div className="relative flex aspect-[16/10] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-cyan-500/50 bg-black/80 text-center">
            <div className="animate-scan pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee]" />
            <div className="absolute left-2 top-2 h-5 w-5 border-l-2 border-t-2 border-cyan-400" />
            <div className="absolute right-2 top-2 h-5 w-5 border-r-2 border-t-2 border-cyan-400" />
            <div className="absolute bottom-2 left-2 h-5 w-5 border-b-2 border-l-2 border-cyan-400" />
            <div className="absolute bottom-2 right-2 h-5 w-5 border-b-2 border-r-2 border-cyan-400" />
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            <p className="mt-3 font-medium text-white">Đang nhận diện…</p>
            <p className="text-xs text-gray-400">YOLO + OCR + đối chiếu QR. Không hiển thị họ tên đầy đủ.</p>
          </div>
        ) : null}

        {step === "success" ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            <p className="font-semibold">Đủ điều kiện xem</p>
            {computedAge != null ? (
              <p className="text-xs text-muted-foreground">Tuổi đã tính: {computedAge}</p>
            ) : null}
            {idMasked ? <p className="text-xs text-muted-foreground">CCCD: {idMasked}</p> : null}
            <p className="text-xs text-muted-foreground">Chỉ lưu kết quả đạt / không đạt.</p>
          </div>
        ) : null}

        {step === "fail" ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-center">
            <XCircle className="h-8 w-8 text-destructive" />
            <p className="font-semibold">Không xác minh được</p>
            <p className="text-xs text-muted-foreground">
              {failMessage || "Chụp lại mặt trước, đủ sáng, không chói, không che mã QR."}
            </p>
          </div>
        ) : null}

        {step === "idle" || step === "preview" ? (
          <div className="space-y-3">
            <ol className="list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
              <li>Đặt CCCD trên nền tối, không che góc.</li>
              <li>Chụp thẳng, đủ sáng, tránh phản quang — hiện rõ mã QR.</li>
              <li>Chỉ mặt trước · JPEG / PNG / WEBP · tối đa 5MB.</li>
            </ol>
            <label className="relative flex cursor-pointer flex-col items-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed border-cyan-500/30 bg-black/40 p-4 text-center transition-[border-color,background-color] duration-300 hover:border-cyan-400/60 hover:bg-cyan-500/5">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => onFile(event.target.files?.[0])}
              />
              <div className="absolute left-2 top-2 h-5 w-5 border-l-2 border-t-2 border-cyan-400/70" />
              <div className="absolute right-2 top-2 h-5 w-5 border-r-2 border-t-2 border-cyan-400/70" />
              <div className="absolute bottom-2 left-2 h-5 w-5 border-b-2 border-l-2 border-cyan-400/70" />
              <div className="absolute bottom-2 right-2 h-5 w-5 border-b-2 border-r-2 border-cyan-400/70" />
              {previewUrl ? (
                // Preview local only — never send filename/number to UI after scan
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Xem trước giấy tờ" className="h-36 w-full rounded-xl object-cover" />
              ) : (
                <p className="text-sm font-medium text-gray-200">Chọn ảnh mặt trước CCCD</p>
              )}
              <p className="flex items-center gap-1 text-[11px] text-gray-400">
                <Lock className="h-3 w-3 text-cyan-400" strokeWidth={1.75} />
                Ảnh chỉ dùng xử lý OCR tạm thời trong bộ nhớ và bị xóa tự động.
              </p>
            </label>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Để sau
          </Button>
          {step === "preview" ? (
            <Button onClick={() => void scan()} className="rounded-xl">
              Nhận diện
            </Button>
          ) : null}
          {step === "fail" ? (
            <Button
              onClick={() => {
                reset();
              }}
              className="rounded-xl"
            >
              Chụp lại
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
