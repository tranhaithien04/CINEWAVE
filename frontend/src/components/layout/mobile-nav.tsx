"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { BrandMark } from "@/components/brand/brand-mark";
import { openCommandPalette } from "@/components/layout/command-palette";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { paths } from "@/routes/paths";
import { cn } from "@/utils/cn";

function navActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const itemClass = (active: boolean) =>
  cn(
    "justify-start rounded-xl border px-3 py-2.5 text-sm font-semibold",
    active
      ? "border-cyan-400/70 bg-cyan-500/10 text-cyan-300"
      : "border-transparent text-gray-300 hover:bg-white/5 hover:text-cyan-300",
  );

export function MobileNav() {
  const { user } = useAuth();
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Mở menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex w-[min(100vw-2rem,20rem)] flex-col rounded-none pb-[env(safe-area-inset-bottom)]"
      >
        <SheetHeader>
          <SheetTitle className="sr-only">CINEWAVE</SheetTitle>
          <BrandMark size="lg" />
        </SheetHeader>
        <div className="mt-6 flex flex-1 flex-col gap-2">
          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => {
              close();
              openCommandPalette();
            }}
          >
            Tìm phim
          </Button>
          <Link
            href={paths.movies}
            className={itemClass(navActive(pathname, paths.movies))}
            onClick={close}
          >
            Phim
          </Link>
          <Link
            href={paths.tickets}
            className={itemClass(navActive(pathname, paths.tickets))}
            onClick={close}
          >
            Vé của tôi
          </Link>
          {user ? (
            <Link
              href={paths.notifications}
              className={itemClass(navActive(pathname, paths.notifications))}
              onClick={close}
            >
              Thông báo
            </Link>
          ) : null}
          {user?.role === "ADMIN" ? (
            <Link
              href={paths.admin}
              className={itemClass(navActive(pathname, paths.admin))}
              onClick={close}
            >
              Admin
            </Link>
          ) : null}
          {user?.role === "STAFF" || user?.role === "ADMIN" ? (
            <Link
              href={paths.staff}
              className={itemClass(navActive(pathname, paths.staff))}
              onClick={close}
            >
              Soát vé
            </Link>
          ) : null}
        </div>
        {!user ? (
          <div className="mt-auto flex flex-col gap-2 border-t border-white/10 pt-4">
            <Button asChild className="w-full rounded-xl">
              <Link href={paths.login} onClick={close}>
                Đăng nhập
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full rounded-xl border-white/15">
              <Link href={paths.register} onClick={close}>
                Đăng ký
              </Link>
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
