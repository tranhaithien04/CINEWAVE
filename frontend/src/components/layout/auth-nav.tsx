"use client";

import Link from "next/link";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { paths } from "@/routes/paths";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AuthNav() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <Skeleton className="h-8 w-24" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href={paths.login}>Đăng nhập</Link>
        </Button>
        <Button asChild size="sm">
          <Link href={paths.register}>Đăng ký</Link>
        </Button>
      </div>
    );
  }

  const label = user.fullName ?? user.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback>{initials(label)}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-32 truncate sm:inline">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={paths.notifications}>Thông báo</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={paths.tickets}>Vé của tôi</Link>
        </DropdownMenuItem>
        {user.role === "ADMIN" ? (
          <DropdownMenuItem asChild>
            <Link href={paths.admin}>Quản trị</Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          onClick={() => {
            void logout().then(() => toast.success("Đã đăng xuất"));
          }}
        >
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
