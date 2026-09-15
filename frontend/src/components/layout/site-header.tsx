"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/brand/brand-mark";
import { AdminNavLink } from "@/components/layout/admin-nav-link";
import { AuthNav } from "@/components/layout/auth-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NotificationBell } from "@/components/layout/notification-bell";
import { SearchTrigger } from "@/components/layout/search-trigger";
import { paths } from "@/routes/paths";
import { cn } from "@/utils/cn";

const links = [
  { href: paths.movies, label: "Phim" },
  { href: paths.tickets, label: "Vé của tôi" },
];

function navActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const navLinkClass = (active: boolean) =>
  cn(
    "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
    active
      ? "border border-cyan-400/70 bg-cyan-500/10 text-cyan-300 shadow-sm shadow-cyan-500/20"
      : "border border-transparent text-gray-300 hover:text-cyan-300",
  );

export function SiteHeader() {
  const pathname = usePathname() || "/";

  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-[#0a0c16]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-2 md:gap-6">
          <MobileNav />
          <BrandMark size="md" className="[&_.brand-word-underline]:hidden" />
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => {
              const active = navActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={navLinkClass(active)}
                >
                  {link.label}
                </Link>
              );
            })}
            <AdminNavLink />
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <SearchTrigger />
          <NotificationBell />
          <AuthNav />
        </div>
      </div>
      {/* Soft veil so content dissolves under the header instead of a hard cut */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-full h-10 bg-gradient-to-b from-[#0a0c16]/85 via-[#0a0c16]/35 to-transparent"
      />
    </header>
  );
}
