"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { changeAdminUserRole, fetchAdminUsers } from "@/api/admin";
import type { AuthUser } from "@/api/auth";
import { ApiError } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

const roles: AuthUser["role"][] = ["CUSTOMER", "STAFF", "ADMIN"];

export function AdminUsersPage() {
  const { user: current } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchAdminUsers();
      setUsers(data.users);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tải được tài khoản");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeRole(user: AuthUser, role: AuthUser["role"]) {
    if (user.id === current?.id && role !== "ADMIN") {
      toast.error("Không thể bỏ quyền admin của chính mình");
      return;
    }
    try {
      await changeAdminUserRole(user.id, role);
      toast.success("Đã đổi vai trò");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không đổi được vai trò");
    }
  }

  const [search, setSearch] = useState("");

  const filteredUsers = users.filter(
    (u) =>
      (u.fullName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold tracking-tight text-white">Quản lý tài khoản</h1>
            <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
              {users.length} Thành viên
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Phân quyền hệ thống (CUSTOMER, STAFF, ADMIN).</p>
        </div>
      </div>

      <Card className="rounded-2xl border-white/10 bg-white/[0.02] backdrop-blur-xl">
        <CardHeader className="border-b border-white/5 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold text-white">
              Danh sách tài khoản ({filteredUsers.length})
            </CardTitle>
            <div className="w-full sm:w-72">
              <input
                type="text"
                aria-label="Tìm theo tên, email hoặc vai trò"
                placeholder="Tìm theo tên, email hoặc vai trò…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:outline-none"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-white/5 pt-2">
          {error ? <p className="py-4 text-sm text-rose-300">{error}</p> : null}
          {filteredUsers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Không tìm thấy tài khoản phù hợp.</p>
          ) : (
            filteredUsers.map((user) => {
              const initial = (user.fullName || user.email)[0].toUpperCase();
              const isSelf = user.id === current?.id;

              const roleBadgeColor =
                user.role === "ADMIN"
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                  : user.role === "STAFF"
                  ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                  : "border-white/10 text-gray-300";

              return (
                <div
                  key={user.id}
                  className="group flex flex-wrap items-center justify-between gap-4 py-3.5 transition-colors hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-white/10 font-display font-bold text-cyan-300">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-white group-hover:text-cyan-200 transition-colors">
                          {user.fullName ?? user.email}
                        </p>
                        {isSelf && (
                          <span className="rounded-md bg-cyan-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-cyan-300">
                            Bạn
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground font-mono">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`rounded-full text-xs font-semibold ${roleBadgeColor}`}>
                      {user.role}
                    </Badge>
                    <select
                      aria-label={`Đổi vai trò của ${user.fullName || user.email}`}
                      className="h-9 rounded-xl border border-white/10 bg-zinc-900 px-3 text-xs text-white focus:border-cyan-500"
                      value={user.role}
                      onChange={(event) => void changeRole(user, event.target.value as AuthUser["role"])}
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminUsersPage;
