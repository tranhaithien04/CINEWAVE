"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { fetchAdminCinemas, type AdminCinema } from "@/api/admin";
import { ApiError } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { paths } from "@/routes/paths";

export function AdminCinemasPage() {
  const [cinemas, setCinemas] = useState<AdminCinema[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminCinemas();
      setCinemas(data.cinemas);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được danh sách rạp");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">Quản lý rạp</h1>
          <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
            {cinemas.length} rạp
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Rạp/phòng lấy từ suất chiếu. Thêm rạp mới bằng cách tạo suất với tên rạp/phòng tương ứng; khóa ghế tại Phòng ghế.
        </p>
      </div>

      <Card className="rounded-2xl border-white/10 bg-white/[0.02] backdrop-blur-xl">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="text-base font-semibold text-white">Hệ thống rạp</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-white/5 pt-2">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Đang tải...</p>
          ) : cinemas.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Chưa có rạp. Hãy thêm suất chiếu trước.</p>
          ) : (
            cinemas.map((cinema) => (
              <div key={cinema.name} className="flex flex-wrap items-center justify-between gap-4 py-3.5">
                <div className="min-w-0">
                  <p className="font-medium text-white">{cinema.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {cinema.roomCount} phòng · {cinema.showtimeCount} suất ·{" "}
                    <span className="text-gray-300">{cinema.rooms.join(", ")}</span>
                  </p>
                </div>
                <Button asChild size="sm" variant="outline" className="rounded-lg border-white/10">
                  <Link href={paths.adminRooms}>Quản lý ghế phòng</Link>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminCinemasPage;
