"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { AGE_RATINGS, type AgeRating, type Movie } from "@/@types/movie";
import {
  createAdminMovie,
  deleteAdminMovie,
  enrichAdminMovie,
  importAdminMovie,
  searchAdminCatalog,
  syncAdminNowPlaying,
  updateAdminMovie,
  type OmdbSearchHit,
} from "@/api/admin";
import { ApiError } from "@/api/client";
import { AgeBadge } from "@/components/movies/age-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCatalog } from "@/hooks/use-catalog";

const emptyForm = {
  title: "",
  slug: "",
  description: "",
  durationMin: 120,
  rating: "P" as AgeRating,
  posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&h=900",
  backdropUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80",
  genres: "Hành động",
  nowShowing: true,
  trailerUrl: "",
};

export function AdminMoviesPage() {
  const { movies, refresh } = useCatalog();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Movie | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function startCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function startEdit(movie: Movie) {
    setEditing(movie);
    setForm({
      title: movie.title,
      slug: movie.slug,
      description: movie.description,
      durationMin: movie.durationMin,
      rating: movie.rating,
      posterUrl: movie.posterUrl,
      backdropUrl: movie.backdropUrl,
      genres: movie.genres.join(", "),
      nowShowing: movie.nowShowing,
      trailerUrl: movie.trailerUrl ?? "",
    });
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    const payload = {
      title: form.title,
      slug: form.slug || undefined,
      description: form.description,
      durationMin: Number(form.durationMin),
      rating: form.rating,
      posterUrl: form.posterUrl,
      backdropUrl: form.backdropUrl,
      genres: form.genres.split(",").map((item) => item.trim()).filter(Boolean),
      nowShowing: form.nowShowing,
      trailerUrl: form.trailerUrl || undefined,
    };
    try {
      if (editing) {
        await updateAdminMovie(editing.id, payload);
        toast.success("Đã cập nhật phim");
      } else {
        await createAdminMovie(payload);
        toast.success("Đã thêm phim");
      }
      setOpen(false);
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không lưu được phim");
    } finally {
      setSaving(false);
    }
  }

  async function remove(movie: Movie) {
    if (!window.confirm(`Xóa phim “${movie.title}” và các suất liên quan?`)) return;
    try {
      await deleteAdminMovie(movie.id);
      toast.success("Đã xóa phim");
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không xóa được phim");
    }
  }

  async function searchImdb() {
    if (imdbQuery.trim().length < 2) {
      toast.error("Nhập ít nhất 2 ký tự để tìm IMDb");
      return;
    }
    setImdbSearching(true);
    try {
      const data = await searchAdminCatalog(imdbQuery.trim());
      setImdbHits(data.results);
      if (!data.results.length) toast.message("OMDb không có kết quả phù hợp");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tìm được phim IMDb");
    } finally {
      setImdbSearching(false);
    }
  }

  async function importHit(hit: OmdbSearchHit) {
    setImportingId(hit.imdbId);
    try {
      await importAdminMovie({
        imdbId: hit.imdbId,
        rating: importRating,
        nowShowing: importNowShowing,
      });
      toast.success(`Đã import ${hit.title}`);
      setImdbHits((current) => current.filter((item) => item.imdbId !== hit.imdbId));
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không import được phim");
    } finally {
      setImportingId(null);
    }
  }

  async function enrich(movie: Movie) {
    setEnrichingId(movie.id);
    try {
      await enrichAdminMovie(movie.id);
      toast.success(`Đã gắn metadata IMDb cho ${movie.title}`);
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không enrich được phim");
    } finally {
      setEnrichingId(null);
    }
  }

  async function syncNowPlaying() {
    setSyncing(true);
    try {
      const result = await syncAdminNowPlaying({
        rating: importRating,
        limit: 12,
        region: "VN",
      });
      await refresh();
      const failNote = result.failed.length ? ` · ${result.failed.length} lỗi` : "";
      const slotNote = result.showtimesFilled ? ` · +${result.showtimesFilled} phim có suất mẫu` : "";
      toast.success(
        `Đồng bộ ${result.region}: +${result.imported.length} phim mới, bỏ qua ${result.skipped}${failNote}${slotNote}`,
      );
      if (result.failed[0]) {
        toast.error(`${result.failed[0].title}: ${result.failed[0].reason}`);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không đồng bộ được phim đang chiếu");
    } finally {
      setSyncing(false);
    }
  }

  const [search, setSearch] = useState("");
  const [imdbQuery, setImdbQuery] = useState("");
  const [imdbHits, setImdbHits] = useState<OmdbSearchHit[]>([]);
  const [imdbSearching, setImdbSearching] = useState(false);
  const [importRating, setImportRating] = useState<AgeRating>("T13");
  const [importNowShowing, setImportNowShowing] = useState(true);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const filteredMovies = movies.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.slug.toLowerCase().includes(search.toLowerCase()) ||
      m.genres.some((g) => g.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold tracking-tight text-white">Quản lý phim</h1>
            <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
              {movies.length} Phim
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Thêm, sửa, cập nhật suất và áp dụng nhãn độ tuổi điện ảnh.</p>
        </div>
        <Button
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500"
          onClick={startCreate}
        >
          + Thêm phim mới
        </Button>
      </div>

      <Card className="rounded-2xl border-white/10 bg-white/[0.02] backdrop-blur-xl">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="text-base font-semibold text-white">Tìm &amp; import từ IMDb (OMDb)</CardTitle>
          <p className="text-xs text-muted-foreground">
            Tìm từng phim trên IMDb, hoặc đồng bộ danh sách đang chiếu (TMDB now playing, gắn imdbId). Nhãn tuổi P/T13/T16/T18 do bạn chọn trước khi import/đồng bộ.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="flex-1">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tên phim trên IMDb</Label>
              <Input
                placeholder="Inception, Dune, Parasite…"
                value={imdbQuery}
                onChange={(event) => setImdbQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void searchImdb();
                }}
                className="mt-1.5 h-10 rounded-xl border-white/10 bg-white/5"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nhãn tuổi VN</Label>
              <select
                aria-label="Nhãn tuổi VN"
                className="mt-1.5 flex h-10 rounded-xl border border-white/10 bg-zinc-900 px-3 text-sm text-white"
                value={importRating}
                onChange={(event) => setImportRating(event.target.value as AgeRating)}
              >
                {AGE_RATINGS.map((rating) => (
                  <option key={rating} value={rating}>
                    {rating}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex h-10 items-center gap-2 text-sm text-white">
              <input
                type="checkbox"
                checked={importNowShowing}
                onChange={(event) => setImportNowShowing(event.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-zinc-900 text-cyan-500"
              />
              Đang chiếu
            </label>
            <Button disabled={imdbSearching} onClick={() => void searchImdb()} className="rounded-xl">
              {imdbSearching ? "Đang tìm…" : "Tìm IMDb"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={syncing}
              onClick={() => void syncNowPlaying()}
              className="rounded-xl border-cyan-500/40"
            >
              {syncing ? "Đang đồng bộ…" : "Đồng bộ phim đang chiếu"}
            </Button>
          </div>
          {imdbHits.length ? (
            <div className="divide-y divide-white/5 rounded-xl border border-white/10">
              {imdbHits.map((hit) => (
                <div key={hit.imdbId} className="flex items-center gap-3 p-3">
                  <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-zinc-900">
                    {hit.posterUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={hit.posterUrl} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{hit.title}</p>
                    <p className="font-mono text-[11px] text-gray-500">
                      {hit.year} · {hit.imdbId}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    disabled={importingId === hit.imdbId}
                    className="rounded-lg"
                    onClick={() => void importHit(hit)}
                  >
                    {importingId === hit.imdbId ? "Đang import…" : "Import"}
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-white/10 bg-white/[0.02] backdrop-blur-xl">
        <CardHeader className="border-b border-white/5 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold text-white">
              Danh sách phim ({filteredMovies.length})
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Input
                placeholder="Tìm theo tên hoặc thể loại…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 rounded-xl border-white/10 bg-white/5 text-xs placeholder:text-gray-500 focus-visible:border-cyan-500/50"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-white/5 pt-2">
          {filteredMovies.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Không tìm thấy phim phù hợp.</p>
          ) : (
            filteredMovies.map((movie) => (
              <div
                key={movie.id}
                className="group flex flex-wrap items-center justify-between gap-4 py-3.5 transition-colors hover:bg-white/[0.02]"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-zinc-900 shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white group-hover:text-cyan-300 transition-colors">
                      {movie.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {movie.durationMin} phút · {movie.genres.join(", ")}
                      {movie.imdbRating ? ` · IMDb ${movie.imdbRating.toFixed(1)}` : ""}
                    </p>
                    <p className="font-mono text-[11px] text-gray-500">
                      /{movie.slug}
                      {movie.imdbId ? ` · ${movie.imdbId}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <AgeBadge rating={movie.rating} />
                  <Badge
                    variant="outline"
                    className={`rounded-full text-xs font-medium ${
                      movie.nowShowing
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                    }`}
                  >
                    {movie.nowShowing ? "Đang chiếu" : "Sắp chiếu"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-300"
                    onClick={() => startEdit(movie)}
                  >
                    Sửa
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={enrichingId === movie.id}
                    className="rounded-lg border-white/10"
                    onClick={() => void enrich(movie)}
                  >
                    {enrichingId === movie.id ? "…" : movie.imdbId ? "Làm mới IMDb" : "Gắn IMDb"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                    onClick={() => void remove(movie)}
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-white/10 bg-zinc-950/95 backdrop-blur-2xl sm:max-w-xl">
          <DialogHeader className="border-b border-white/5 pb-3">
            <DialogTitle className="font-display text-xl font-bold text-white">
              {editing ? "Chỉnh sửa thông tin phim" : "Thêm phim điện ảnh mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 pt-2">
            <Field label="Tên phim">
              <Input
                placeholder="VD: Dune: Part Two"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                className="rounded-xl border-white/10 bg-white/5"
              />
            </Field>
            <Field label="Slug (để trống sẽ tự sinh theo tên)">
              <Input
                placeholder="VD: dune-part-two"
                value={form.slug}
                onChange={(event) => setForm({ ...form, slug: event.target.value })}
                className="rounded-xl border-white/10 bg-white/5 font-mono text-xs"
              />
            </Field>
            <Field label="Tóm tắt nội dung (Mô tả)">
              <Textarea
                rows={3}
                placeholder="Nhập nội dung phim…"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className="rounded-xl border-white/10 bg-white/5 text-sm"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Thời lượng (phút)">
                <Input
                  type="number"
                  value={form.durationMin}
                  onChange={(event) => setForm({ ...form, durationMin: Number(event.target.value) })}
                  className="rounded-xl border-white/10 bg-white/5"
                />
              </Field>
              <Field label="Phân loại độ tuổi">
                <select
                  className="flex h-10 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-cyan-500"
                  value={form.rating}
                  onChange={(event) => setForm({ ...form, rating: event.target.value as AgeRating })}
                >
                  {AGE_RATINGS.map((rating) => (
                    <option key={rating} value={rating}>
                      {rating}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Thể loại (phân cách bằng dấu phẩy)">
              <Input
                placeholder="Khoa học viễn tưởng, Hành động, Phiêu lưu"
                value={form.genres}
                onChange={(event) => setForm({ ...form, genres: event.target.value })}
                className="rounded-xl border-white/10 bg-white/5"
              />
            </Field>
            <Field label="Poster URL">
              <Input
                placeholder="https://..."
                value={form.posterUrl}
                onChange={(event) => setForm({ ...form, posterUrl: event.target.value })}
                className="rounded-xl border-white/10 bg-white/5 text-xs"
              />
            </Field>
            <Field label="Backdrop URL">
              <Input
                placeholder="https://..."
                value={form.backdropUrl}
                onChange={(event) => setForm({ ...form, backdropUrl: event.target.value })}
                className="rounded-xl border-white/10 bg-white/5 text-xs"
              />
            </Field>
            <Field label="Trailer embed URL (Youtube)">
              <Input
                placeholder="https://www.youtube.com/embed/..."
                value={form.trailerUrl}
                onChange={(event) => setForm({ ...form, trailerUrl: event.target.value })}
                className="rounded-xl border-white/10 bg-white/5 text-xs"
              />
            </Field>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <input
                id="nowShowing"
                type="checkbox"
                checked={form.nowShowing}
                onChange={(event) => setForm({ ...form, nowShowing: event.target.checked })}
                className="h-4 w-4 rounded border-white/20 bg-zinc-900 text-cyan-500 focus:ring-cyan-500"
              />
              <label htmlFor="nowShowing" className="text-sm font-medium text-white cursor-pointer select-none">
                Đang công chiếu tại các cụm rạp CineWave
              </label>
            </div>
            <Button
              disabled={saving}
              onClick={() => void save()}
              className="mt-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500"
            >
              {saving ? "Đang lưu cơ sở dữ liệu..." : "Lưu phim"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export default AdminMoviesPage;
