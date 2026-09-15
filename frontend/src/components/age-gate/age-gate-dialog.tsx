"use client";

import { CheckCircle2, Loader2, Lock, ShieldCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { AgeRating } from "@/@types/movie";
import { submitAgeVerification, type CccdQrFields } from "@/api/age-verification";
import { requiredAgeByRating } from "@/components/age-gate/needs-age-gate";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { paths } from "@/routes/paths";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type GateStep = "idle" | "preview" | "scanning" | "success" | "fail";

function formatGender(value?: string | null) {
  if (!value) return null;
  const raw = value.trim().toUpperCase();
  if (raw === "NAM" || raw === "MALE" || raw === "M") return "Nam";
  if (raw === "NỮ" || raw === "NU" || raw === "FEMALE" || raw === "F") return "Nữ";
  return value;
}

function QrInfoPanel({
  qr,
  fallback,
}: {
  qr?: CccdQrFields | null;
  fallback: { fullName?: string | null; dob?: string | null; idMasked?: string | null };
}) {
  const rows: Array<{ label: string; value: string }> = [];
  const name = qr?.fullName || fallback.fullName;
  const dob = qr?.dob || fallback.dob;
  const idNumber = qr?.idNumber || fallback.idMasked;
  if (idNumber) rows.push({ label: "Số CCCD", value: idNumber });
  if (qr?.oldId) rows.push({ label: "CMND cũ", value: qr.oldId });
  if (name) rows.push({ label: "Họ và tên", value: name });
  if (dob) rows.push({ label: "Ngày sinh", value: dob });
  const gender = formatGender(qr?.gender);
  if (gender) rows.push({ label: "Giới tính", value: gender });
  if (qr?.address) rows.push({ label: "Nơi thường trú", value: qr.address });
  if (qr?.issueDate) rows.push({ label: "Ngày cấp", value: qr.issueDate });

  if (!rows.length) {
    return (
      <p className="text-xs text-muted-foreground">
        {qr?.decoded === false
          ? "Không đọc được mã QR trên CCCD. Hệ thống dùng OCR chữ in."
          : "Chưa có trường thông tin từ mã QR."}
      </p>
    );
  }

  return (
    <div className="w-full space-y-2 text-left">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
        {qr?.decoded ? "Thông tin từ mã QR CCCD" : "Thông tin đọc được (OCR)"}
      </p>
      <dl className="space-y-1.5 rounded-xl border border-white/10 bg-black/30 p-3">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[7.5rem_1fr] gap-2 text-xs">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="font-medium text-white break-words">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

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
  const [fullName, setFullName] = useState<string | null>(null);
  const [dob, setDob] = useState<string | null>(null);
  const [qr, setQr] = useState<CccdQrFields | null>(null);
  const [computedAge, setComputedAge] = useState<number | null>(null);
  const [failMessage, setFailMessage] = useState<string | null>(null);
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const age = requiredAgeByRating[rating];

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
    setFullName(null);
    setDob(null);
    setQr(null);
    setComputedAge(null);
    setFailMessage(null);
    setAcceptedPolicy(false);
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
    if (!acceptedPolicy) {
      toast.error("Vui lòng xác nhận điều khoản xác minh tuổi trước khi tiếp tục");
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
      setFullName(result.fullName ?? result.qr?.fullName ?? null);
      setDob(result.dob ?? result.qr?.dob ?? null);
      setQr(result.qr ?? null);
      setComputedAge(result.computedAge);
      if (result.passed) {
        setStep("success");
        toast.success(result.message || "Đủ tuổi xem suất này.");
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
      <DialogContent className="rounded-2xl border-white/10 sm:max-w-lg">
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
            <p className="text-xs text-gray-400">YOLO + OCR + giải mã QR CCCD</p>
          </div>
        ) : null}

        {step === "success" ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            <p className="font-semibold">Đủ điều kiện xem</p>
            {computedAge != null ? (
              <p className="text-xs text-muted-foreground">Tuổi đã tính: {computedAge}+ (yêu cầu {age}+)</p>
            ) : null}
            <QrInfoPanel qr={qr} fallback={{ fullName, dob, idMasked }} />
            <p className="text-[11px] text-muted-foreground">Ảnh CCCD không được lưu. Chỉ dùng kết quả xác minh cho suất này.</p>
          </div>
        ) : null}

        {step === "fail" ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-center">
            <XCircle className="h-8 w-8 text-destructive" />
            <p className="font-semibold">Không xác minh được</p>
            <p className="text-xs text-muted-foreground">
              {failMessage || "Chụp lại mặt trước, đủ sáng, không chói, không che mã QR."}
            </p>
            {qr || fullName || dob || idMasked ? (
              <QrInfoPanel qr={qr} fallback={{ fullName, dob, idMasked }} />
            ) : null}
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

            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="flex gap-3">
                <input
                  id="age-gate-policy"
                  type="checkbox"
                  checked={acceptedPolicy}
                  onChange={(event) => setAcceptedPolicy(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-white/30 bg-black/50 accent-cyan-400"
                />
                <Label htmlFor="age-gate-policy" className="cursor-pointer text-xs font-normal leading-relaxed text-gray-300">
                  Tôi xác nhận CCCD thuộc về tôi, đủ tuổi theo phân loại phim, và chịu trách nhiệm nếu cung cấp
                  giấy tờ giả / của người khác. Tôi đồng ý với{" "}
                  <Link
                    href={paths.legalAgeVerification}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-300 underline-offset-2 hover:underline"
                    onClick={(event) => event.stopPropagation()}
                  >
                    điều khoản xác minh tuổi
                  </Link>
                  .
                </Label>
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Quay lại
          </Button>
          {step === "preview" ? (
            <Button onClick={() => void scan()} disabled={!acceptedPolicy} className="rounded-xl">
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
          {step === "success" ? (
            <Button onClick={() => onPassed()} className="rounded-xl">
              Tiếp tục thanh toán
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
