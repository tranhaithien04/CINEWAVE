"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";
import { paths } from "@/routes/paths";
import { cn } from "@/utils/cn";

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

export function AdminNavLink({ className }: { className?: string }) {
  const { user } = useAuth();
  const pathname = usePathname() || "/";

  if (user?.role === "ADMIN") {
    const active = navActive(pathname, paths.admin);
    return (
      <Link href={paths.admin} aria-current={active ? "page" : undefined} className={cn(navLinkClass(active), className)}>
        Admin
      </Link>
    );
  }
  if (user?.role === "STAFF") {
    const active = navActive(pathname, paths.staff);
    return (
      <Link href={paths.staff} aria-current={active ? "page" : undefined} className={cn(navLinkClass(active), className)}>
        Soát vé
      </Link>
    );
  }
  return null;
}
