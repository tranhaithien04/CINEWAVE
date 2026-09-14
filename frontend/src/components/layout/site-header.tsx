"use client";

import { Film } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0c16]/72 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-2 md:gap-6">
          <MobileNav />
          <Link
            href={paths.home}
            className="group flex items-center gap-2 font-display text-lg font-bold tracking-tight text-white transition-[color,transform] duration-200 hover:text-cyan-300"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 shadow-neon transition-[background-color,box-shadow,transform] duration-200 group-hover:scale-105 group-hover:bg-cyan-500/20 group-hover:shadow-[0_0_16px_rgba(34,211,238,0.35)]">
              <Film className="h-4 w-4 text-cyan-400 transition-colors duration-200 group-hover:text-cyan-300" strokeWidth={1.75} />
            </span>
            <span className="relative">
              CINEWAVE
              <span
                aria-hidden
                className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-gradient-to-r from-cyan-400 to-transparent transition-transform duration-200 group-hover:scale-x-100"
              />
            </span>
          </Link>
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
    </header>
  );
}
