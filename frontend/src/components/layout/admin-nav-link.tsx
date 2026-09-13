"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { paths } from "@/routes/paths";

export function AdminNavLink({ className }: { className?: string }) {
  const { user } = useAuth();
  if (user?.role !== "ADMIN") return null;

  return (
    <Button asChild variant="ghost" size="sm" className={className}>
      <Link href={paths.admin}>Admin</Link>
    </Button>
  );
}
