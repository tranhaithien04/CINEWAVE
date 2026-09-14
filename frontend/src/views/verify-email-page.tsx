"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";

import { ApiError } from "@/api/client";
import { resendVerificationEmail, verifyEmailToken } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { paths } from "@/routes/paths";

function VerifyEmailInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { setUser } = useAuth();
  const token = params?.get("token") ?? "";
  const emailParam = params?.get("email") ?? "";
  const [email, setEmail] = useState(emailParam);
  const [status, setStatus] = useState<"idle" | "verifying" | "done" | "error">(
    token ? "verifying" : "idle",
  );
  const [message, setMessage] = useState(
    token ? "Đang xác minh email..." : "Kiểm tra hộp thư và mở link xác minh, hoặc gửi lại email.",
  );
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void verifyEmailToken(token)
      .then((data) => {
        if (cancelled) return;
        setUser(data.user);
        setStatus("done");
        setMessage("Email đã được xác minh. Bạn đã đăng nhập.");
        toast.success("Xác minh email thành công");
        window.setTimeout(() => router.replace(paths.home), 1200);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(err instanceof ApiError ? err.message : "Không xác minh được email");
        toast.error(err instanceof ApiError ? err.message : "Không xác minh được email");
      });
    return () => {
      cancelled = true;
    };
  }, [token, router, setUser]);

  async function resend() {
    if (!email.trim()) {
      toast.error("Nhập email để gửi lại");
      return;
    }
    setSending(true);
    try {
      const data = await resendVerificationEmail(email.trim());
      toast.success(data.message);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không gửi lại được");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-md px-4 py-16">
      <Card className="w-full rounded-3xl border-white/10 bg-cinema-900/90">
        <CardHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300">
            <MailCheck className="h-5 w-5" />
          </div>
          <CardTitle className="font-display text-2xl text-white">Xác minh email</CardTitle>
          <CardDescription className="text-gray-400">{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {status !== "done" ? (
            <>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ban@email.com"
                className="rounded-xl border-white/10 bg-white/5"
              />
              <Button
                disabled={sending}
                onClick={() => void resend()}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                {sending ? "Đang gửi..." : "Gửi lại email xác minh"}
              </Button>
            </>
          ) : null}
          <Button asChild variant="outline" className="w-full rounded-xl border-white/15">
            <Link href={paths.login}>Về trang đăng nhập</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

export function VerifyEmailPage() {
  return (
    <Suspense fallback={<main className="px-4 py-16 text-center text-sm text-muted-foreground">Đang tải...</main>}>
      <VerifyEmailInner />
    </Suspense>
  );
}

export default VerifyEmailPage;
