"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { Showtime } from "@/@types/movie";
import { closeAdminShowtime, createAdminShowtime, deleteAdminShowtime, updateAdminShowtime } from "@/api/admin";
import { ApiError } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatVnd } from "@/data/mock-catalog";
import { useCatalog } from "@/hooks/use-catalog";

function toLocal(iso: string) {
  const date = new Date(iso);
  const offset = date.getTime() - date.getTimezoneOffset() * 60_000;
  return new Date(offset).toISOString().slice(0, 16);
}

function fromLocal(value: string) {
  return new Date(value).toISOString();
}

const emptyForm = {
  movieSlug: "",
  cinema: "CINEWAVE Landmark 81",
  room: "Hall 1",
  startsAt: toLocal(new Date().toISOString()),
  priceBase: 100000,
  closed: false,
};

export function AdminShowtimesPage() {
  const { movies, showtimes, refresh } = useCatalog();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Showtime | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function startCreate() {
    setEditing(null);
    setForm({ ...emptyForm, movieSlug: movies[0]?.slug ?? "" });
    setOpen(true);
  }

  function startEdit(show: Showtime) {
    setEditing(show);
    setForm({
      movieSlug: show.movieSlug,
      cinema: show.cinema,
      room: show.room,
      startsAt: toLocal(show.startsAt),
      priceBase: show.priceBase,
      closed: Boolean(show.closed),
    });
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    const payload = {
      movieSlug: form.movieSlug,
      cinema: form.cinema,
      room: form.room,
      startsAt: fromLocal(form.startsAt),
      priceBase: Number(form.priceBase),
      closed: form.closed,
    };
    try {
      if (editing) {
        await updateAdminShowtime(editing.id, payload);
        toast.success("Đã cập nhật suất");
      } else {
        await createAdminShowtime(payload);
        toast.success("Đã thêm suất");
      }
      setOpen(false);
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không lưu được suất");
    } finally {
      setSaving(false);
    }
  }

  async function closeShow(show: Showtime) {
    try {
      await closeAdminShowtime(show.id);
      toast.success("Đã đóng bán suất");
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không đóng được suất");
    }
  }

  async function remove(show: Showtime) {
    if (!window.confirm("Xóa suất chiếu này?")) return;
    try {
      await deleteAdminShowtime(show.id);
      toast.success("Đã xóa suất");
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không xóa được suất");
    }
  }

  const [selectedMovie, setSelectedMovie] = useState<string>("all");

  const filteredShowtimes = showtimes.filter((s) =>
    selectedMovie === "all" ? true : s.movieSlug === selectedMovie,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold tracking-tight text-white">Quản lý suất chiếu</h1>
            <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
              {showtimes.length} Suất
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Lên lịch chiếu, giá vé cơ sở và điều phối phòng chiếu.</p>
        </div>
        <Button
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500"
          onClick={startCreate}
        >
          + Thêm suất chiếu
        </Button>
      </div>

      <Card className="rounded-2xl border-white/10 bg-white/[0.02] backdrop-blur-xl">
        <CardHeader className="border-b border-white/5 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold text-white">
              Lịch chiếu ({filteredShowtimes.length})
            </CardTitle>
            <div className="w-full sm:w-64">
              <select
                className="h-9 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 text-xs text-white focus:border-cyan-500"
                value={selectedMovie}
                onChange={(e) => setSelectedMovie(e.target.value)}
              >
                <option value="all">Tất cả phim</option>
                {movies.map((m) => (
                  <option key={m.id} value={m.slug}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-white/5 pt-2">
          {filteredShowtimes.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Không có suất chiếu nào cho phim đã chọn.</p>
          ) : (
            filteredShowtimes.map((show) => {
              const movie = movies.find((item) => item.slug === show.movieSlug);
              const date = new Date(show.startsAt);
              return (
                <div
                  key={show.id}
                  className="group flex flex-wrap items-center justify-between gap-4 py-3.5 transition-colors hover:bg-white/[0.02]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white group-hover:text-cyan-300 transition-colors">
                      {movie?.title ?? show.movieSlug}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded bg-white/5 px-2 py-0.5 font-medium text-gray-300">
                        {show.cinema} · {show.room}
                      </span>
                      <span>•</span>
                      <span className="text-cyan-300 font-mono">
                        {date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span>
                        {date.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-semibold text-cyan-300">
                      {formatVnd(show.priceBase)}
                    </span>
                    <Badge
                      variant="outline"
                      className={`rounded-full text-xs font-medium ${
                        show.closed
                          ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      }`}
                    >
                      {show.closed ? "Đóng bán" : "Đang mở"}
                    </Badge>
                    {!show.closed ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg border-white/10 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"
                        onClick={() => void closeShow(show)}
                      >
                        Đóng
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-300"
                      onClick={() => startEdit(show)}
                    >
                      Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                      onClick={() => void remove(show)}
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl border-white/10 bg-zinc-950/95 backdrop-blur-2xl sm:max-w-lg">
          <DialogHeader className="border-b border-white/5 pb-3">
            <DialogTitle className="font-display text-xl font-bold text-white">
              {editing ? "Chỉnh sửa suất chiếu" : "Thêm suất chiếu mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 pt-2">
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phim</Label>
              <select
                className="flex h-10 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-cyan-500"
                value={form.movieSlug}
                onChange={(event) => setForm({ ...form, movieSlug: event.target.value })}
              >
                {movies.map((movie) => (
                  <option key={movie.id} value={movie.slug}>
                    {movie.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rạp chiếu</Label>
                <Input
                  value={form.cinema}
                  onChange={(event) => setForm({ ...form, cinema: event.target.value })}
                  className="rounded-xl border-white/10 bg-white/5"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phòng chiếu</Label>
                <Input
                  value={form.room}
                  onChange={(event) => setForm({ ...form, room: event.target.value })}
                  className="rounded-xl border-white/10 bg-white/5"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Giờ chiếu</Label>
                <Input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(event) => setForm({ ...form, startsAt: event.target.value })}
                  className="rounded-xl border-white/10 bg-white/5 text-sm"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Giá vé cơ bản (VND)</Label>
                <Input
                  type="number"
                  value={form.priceBase}
                  onChange={(event) => setForm({ ...form, priceBase: Number(event.target.value) })}
                  className="rounded-xl border-white/10 bg-white/5 font-mono"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <input
                id="closedCheck"
                type="checkbox"
                checked={form.closed}
                onChange={(event) => setForm({ ...form, closed: event.target.checked })}
                className="h-4 w-4 rounded border-white/20 bg-zinc-900 text-rose-500 focus:ring-rose-500"
              />
              <label htmlFor="closedCheck" className="text-sm font-medium text-white cursor-pointer select-none">
                Đóng bán suất này (khách không thể đặt thêm)
              </label>
            </div>
            <Button
              disabled={saving}
              onClick={() => void save()}
              className="mt-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500"
            >
              {saving ? "Đang lưu..." : "Lưu suất chiếu"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminShowtimesPage;
