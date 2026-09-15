"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Mở menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="rounded-none">
        <SheetHeader>
          <SheetTitle className="sr-only">CINEWAVE</SheetTitle>
          <BrandMark size="lg" />
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-2">
          <Button variant="ghost" className="justify-start" onClick={openCommandPalette}>
            Tìm phim
          </Button>
          <Link href={paths.movies} className={itemClass(navActive(pathname, paths.movies))}>
            Phim
          </Link>
          <Link href={paths.tickets} className={itemClass(navActive(pathname, paths.tickets))}>
            Vé của tôi
          </Link>
          {user ? (
            <Link
              href={paths.notifications}
              className={itemClass(navActive(pathname, paths.notifications))}
            >
              Thông báo
            </Link>
          ) : null}
          {user?.role === "ADMIN" ? (
            <Link href={paths.admin} className={itemClass(navActive(pathname, paths.admin))}>
              Admin
            </Link>
          ) : null}
          {user?.role === "STAFF" || user?.role === "ADMIN" ? (
            <Link href={paths.staff} className={itemClass(navActive(pathname, paths.staff))}>
              Soát vé
            </Link>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
