"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { fetchAdminAgeVerifications, type AdminAgeVerification } from "@/api/admin";
import { ApiError } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCatalog } from "@/hooks/use-catalog";

export function AdminAgeVerificationsPage() {
  const { getMovieBySlug } = useCatalog();
  const [rows, setRows] = useState<AdminAgeVerification[]>([]);
  const [filter, setFilter] = useState<"all" | "passed" | "failed">("all");

  const load = useCallback(async () => {
    try {
      const data = await fetchAdminAgeVerifications();
      setRows(data.verifications);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được nhật ký xác minh");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = rows.filter((row) =>
    filter === "all" ? true : filter === "passed" ? row.passed : !row.passed,
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">Xác minh tuổi</h1>
          <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
            {rows.length} bản ghi
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Nhật ký age gate CCCD (ảnh đã xóa sau xử lý). Theo dõi pass/fail theo suất hạn chế tuổi.
        </p>
      </div>

      <Card className="rounded-2xl border-white/10 bg-white/[0.02] backdrop-blur-xl">
        <CardHeader className="border-b border-white/5 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold text-white">Nhật ký ({filtered.length})</CardTitle>
            <select
              className="h-9 rounded-xl border border-white/10 bg-zinc-900 px-3 text-xs text-white"
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
            >
              <option value="all">Tất cả</option>
              <option value="passed">Đạt</option>
              <option value="failed">Không đạt</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-white/5 pt-2">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Chưa có lượt xác minh.</p>
          ) : (
            filtered.map((row) => {
              const movie = row.movieSlug ? getMovieBySlug(row.movieSlug) : null;
              return (
                <div key={row.id} className="flex flex-wrap items-center justify-between gap-4 py-3.5">
                  <div className="min-w-0">
                    <p className="font-medium text-white">
                      {movie?.title ?? row.movieSlug ?? "Không gắn phim"} · nhãn {row.rating ?? "—"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Tuổi yêu cầu {row.requiredAge}+ · đọc được {row.computedAge ?? "—"} ·{" "}
                      {row.idMasked ? `CCCD ${row.idMasked}` : "không có số"} ·{" "}
                      {new Date(row.createdAt).toLocaleString("vi-VN")}
                    </p>
                    {row.failureReason ? (
                      <p className="mt-1 text-xs text-rose-300">{row.failureReason}</p>
                    ) : null}
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      row.passed
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-rose-500/30 bg-rose-500/10 text-rose-300"
                    }
                  >
                    {row.passed ? "Đạt" : "Không đạt"}
                  </Badge>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminAgeVerificationsPage;
