"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Film, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { ApiError } from "@/api/client";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { paths } from "@/routes/paths";
import { registerSchema, type RegisterValues } from "@/validators/auth";

export function RegisterPage() {
  const router = useRouter();
  const { register: createAccount } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterValues) {
    setError(null);
    try {
      const result = await createAccount({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      });
      if ("pendingVerification" in result && result.pendingVerification) {
        toast.success(result.message || "Đã gửi email xác minh");
        router.push(`${paths.verifyEmail}?email=${encodeURIComponent(result.email)}`);
        return;
      }
      if ("user" in result) {
        toast.success("Tạo tài khoản thành công!");
        router.push(paths.home);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Không đăng ký được";
      setError(message);
      toast.error(message);
    }
  }

  return (
    <main className="relative mx-auto flex max-w-md px-4 py-12 md:py-20">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none absolute left-1/2 top-10 h-60 w-80 -translate-x-1/2 rounded-full bg-cyan-500/15 blur-[100px]" />
      <div className="pointer-events-none absolute left-0 top-1/2 h-40 w-40 rounded-full bg-purple-500/10 blur-[80px]" />

      <Card className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-cinema-900/90 to-cinema-950/95 shadow-2xl backdrop-blur-xl">
        <CardHeader className="space-y-2 pb-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-display text-xs font-bold tracking-widest text-cyan-400 uppercase">
              <Film className="h-3.5 w-3.5" /> CineWave Membership
            </span>
            <span className="flex items-center gap-1 text-[11px] text-gray-400 font-mono">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Miễn phí
            </span>
          </div>
          <CardTitle className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
            Tạo tài khoản
          </CardTitle>
          <CardDescription className="text-gray-400">
            Đăng ký bằng email cần xác minh hộp thư trước khi đăng nhập. Google được xác minh sẵn.
          </CardDescription>
        </CardHeader>

        <form onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName" className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Họ và tên
              </Label>
              <Input
                id="fullName"
                autoComplete="name"
                placeholder="Nguyễn Văn A"
                className="rounded-xl border-white/10 bg-white/5 transition-[border-color,box-shadow] focus:border-cyan-400 focus:shadow-neon"
                {...register("fullName")}
              />
              {errors.fullName ? <p className="text-xs text-rose-400">{errors.fullName.message}</p> : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email" className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="ban@email.com"
                className="rounded-xl border-white/10 bg-white/5 transition-[border-color,box-shadow] focus:border-cyan-400 focus:shadow-neon"
                {...register("email")}
              />
              {errors.email ? <p className="text-xs text-rose-400">{errors.email.message}</p> : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password" className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Mật khẩu (tối thiểu 8 ký tự)
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Tạo mật khẩu an toàn"
                  className="rounded-xl border-white/10 bg-white/5 pr-10 transition-[border-color,box-shadow] focus:border-cyan-400 focus:shadow-neon"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password ? <p className="text-xs text-rose-400">{errors.password.message}</p> : null}
            </div>

            {error ? (
              <Alert variant="destructive" className="rounded-xl">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
          </CardContent>

          <CardFooter className="flex flex-col items-stretch gap-4 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500"
            >
              {isSubmitting ? "Đang xử lý..." : "Đăng ký thành viên →"}
            </Button>
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider text-gray-500">
              <span className="h-px flex-1 bg-white/10" />
              hoặc
              <span className="h-px flex-1 bg-white/10" />
            </div>
            <GoogleAuthButton label="Đăng ký với Google" />
            <p className="text-center text-sm text-gray-400">
              Đã có tài khoản?{" "}
              <Button asChild variant="link" className="h-auto p-0 font-semibold text-cyan-400 hover:text-cyan-300">
                <Link href={paths.login}>Đăng nhập tại đây</Link>
              </Button>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}

export default RegisterPage;
