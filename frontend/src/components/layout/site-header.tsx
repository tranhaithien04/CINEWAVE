import { Film } from "lucide-react";
import Link from "next/link";

import { AdminNavLink } from "@/components/layout/admin-nav-link";
import { AuthNav } from "@/components/layout/auth-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NotificationBell } from "@/components/layout/notification-bell";
import { SearchTrigger } from "@/components/layout/search-trigger";
import { Button } from "@/components/ui/button";
import { paths } from "@/routes/paths";

const links = [
  { href: paths.movies, label: "Phim" },
  { href: paths.tickets, label: "Vé của tôi" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0c16]/72 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-2 md:gap-6">
          <MobileNav />
          <Link href={paths.home} className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 shadow-neon">
              <Film className="h-4 w-4 text-cyan-400" strokeWidth={1.75} />
            </span>
            CINEWAVE
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Button key={link.href} asChild variant="ghost" size="sm" className="rounded-xl text-gray-300 hover:text-cyan-300">
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
            <AdminNavLink className="rounded-xl text-gray-300 hover:text-cyan-300" />
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
