"use client";

import { Menu } from "lucide-react";
import Link from "next/link";

import { openCommandPalette } from "@/components/layout/command-palette";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { paths } from "@/routes/paths";

export function MobileNav() {
  const { user } = useAuth();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Mở menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="rounded-none">
        <SheetHeader>
          <SheetTitle>CINEWAVE</SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-3">
          <Button variant="ghost" className="justify-start" onClick={openCommandPalette}>
            Tìm phim
          </Button>
          <Button asChild variant="ghost" className="justify-start">
            <Link href={paths.movies}>Phim</Link>
          </Button>
          <Button asChild variant="ghost" className="justify-start">
            <Link href={paths.tickets}>Vé của tôi</Link>
          </Button>
          {user ? (
            <Button asChild variant="ghost" className="justify-start">
              <Link href={paths.notifications}>Thông báo</Link>
            </Button>
          ) : null}
          {user?.role === "ADMIN" ? (
            <Button asChild variant="ghost" className="justify-start">
              <Link href={paths.admin}>Admin</Link>
            </Button>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
