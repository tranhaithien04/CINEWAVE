"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  fetchAdminRooms,
  updateAdminRoomBlockedSeats,
  type AdminRoom,
} from "@/api/admin";
import { ApiError } from "@/api/client";
import { SeatBlockEditor } from "@/components/admin/seat-block-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCatalog } from "@/hooks/use-catalog";

export function AdminRoomsPage() {
  const { refresh } = useCatalog();
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminRoom | null>(null);
  const [blockedSeats, setBlockedSeats] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminRooms();
      setRooms(data.rooms);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được danh sách phòng");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(room: AdminRoom) {
    setEditing(room);
    setBlockedSeats([...(room.blockedSeats ?? [])]);
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      const result = await updateAdminRoomBlockedSeats({
        cinema: editing.cinema,
        room: editing.room,
        blockedSeats,
      });
      toast.success(`Đã cập nhật ${result.updatedCount} suất của phòng ${editing.room}`);
      setEditing(null);
      await Promise.all([load(), refresh()]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không lưu được sơ đồ ghế");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">Quản lý phòng ghế</h1>
          <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
            {rooms.length} Phòng
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Khóa ghế hỏng/không bán theo phòng. Thay đổi áp dụng cho mọi suất cùng rạp + phòng.
        </p>
      </div>

      <Card className="rounded-2xl border-white/10 bg-white/[0.02] backdrop-blur-xl">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="text-base font-semibold text-white">Danh sách phòng</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-white/5 pt-2">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Đang tải...</p>
          ) : rooms.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Chưa có phòng nào. Thêm suất chiếu để xuất hiện phòng tại đây.
            </p>
          ) : (
            rooms.map((room) => (
              <div
                key={`${room.cinema}::${room.room}`}
                className="flex flex-wrap items-center justify-between gap-4 py-3.5"
              >
                <div className="min-w-0">
                  <p className="font-medium text-white">
                    {room.cinema} · {room.room}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {room.showtimeCount} suất · Ghế khóa:{" "}
                    <span className="font-mono text-rose-300">
                      {room.blockedSeats.length ? room.blockedSeats.join(", ") : "không có"}
                    </span>
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-300"
                  onClick={() => startEdit(room)}
                >
                  Sửa sơ đồ
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="rounded-2xl border-white/10 bg-zinc-950/95 backdrop-blur-2xl sm:max-w-xl">
          <DialogHeader className="border-b border-white/5 pb-3">
            <DialogTitle className="font-display text-xl font-bold text-white">
              {editing ? `${editing.cinema} · ${editing.room}` : "Phòng"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <SeatBlockEditor value={blockedSeats} onChange={setBlockedSeats} />
            <Button
              disabled={saving}
              onClick={() => void save()}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-white shadow-lg shadow-cyan-500/20"
            >
              {saving ? "Đang lưu..." : "Lưu và áp dụng mọi suất phòng này"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminRoomsPage;
