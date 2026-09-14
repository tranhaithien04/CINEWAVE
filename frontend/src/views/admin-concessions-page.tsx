"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  createAdminConcession,
  deleteAdminConcession,
  fetchAdminConcessions,
  updateAdminConcession,
  type AdminConcession,
} from "@/api/admin";
import { ApiError } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatVnd } from "@/data/mock-catalog";

const emptyForm = {
  id: "",
  name: "",
  description: "",
  price: 50000,
  active: true,
};

export function AdminConcessionsPage() {
  const [items, setItems] = useState<AdminConcession[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminConcession | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchAdminConcessions();
      setItems(data.items);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được menu F&B");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function startCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function startEdit(item: AdminConcession) {
    setEditing(item);
    setForm({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      active: item.active,
    });
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    try {
      if (editing) {
        await updateAdminConcession(editing.id, {
          name: form.name,
          description: form.description,
          price: Number(form.price),
          active: form.active,
        });
        toast.success("Đã cập nhật món");
      } else {
        await createAdminConcession({
          id: form.id || undefined,
          name: form.name,
          description: form.description,
          price: Number(form.price),
          active: form.active,
        });
        toast.success("Đã thêm món");
      }
      setOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không lưu được món");
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: AdminConcession) {
    if (!window.confirm(`Xóa "${item.name}" khỏi menu?`)) return;
    try {
      await deleteAdminConcession(item.id);
      toast.success("Đã xóa món");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không xóa được món");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold tracking-tight text-white">Quản lý F&B</h1>
            <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
              {items.length} món
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Menu bắp nước / combo hiện trên checkout của khách.</p>
        </div>
        <Button
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-white"
          onClick={startCreate}
        >
          + Thêm món
        </Button>
      </div>

      <Card className="rounded-2xl border-white/10 bg-white/[0.02] backdrop-blur-xl">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="text-base font-semibold text-white">Menu đang bán</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-white/5 pt-2">
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Chưa có món nào.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 py-3.5">
                <div className="min-w-0">
                  <p className="font-medium text-white">{item.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.description || "Không mô tả"} · <span className="font-mono">{item.id}</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-sm font-semibold text-cyan-300">{formatVnd(item.price)}</span>
                  <Badge
                    variant="outline"
                    className={
                      item.active
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-white/15 text-gray-400"
                    }
                  >
                    {item.active ? "Đang bán" : "Ẩn"}
                  </Badge>
                  <Button size="sm" variant="outline" className="rounded-lg border-white/10" onClick={() => startEdit(item)}>
                    Sửa
                  </Button>
                  <Button size="sm" variant="ghost" className="rounded-lg text-rose-400" onClick={() => void remove(item)}>
                    Xóa
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl border-white/10 bg-zinc-950/95 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-white">
              {editing ? "Sửa món F&B" : "Thêm món F&B"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 pt-2">
            {!editing ? (
              <div className="grid gap-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Mã (tuỳ chọn)</Label>
                <Input
                  value={form.id}
                  onChange={(e) => setForm({ ...form, id: e.target.value })}
                  placeholder="combo-solo"
                  className="rounded-xl border-white/10 bg-white/5"
                />
              </div>
            ) : null}
            <div className="grid gap-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tên món</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-xl border-white/10 bg-white/5"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Mô tả</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="rounded-xl border-white/10 bg-white/5"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Giá (VND)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="rounded-xl border-white/10 bg-white/5 font-mono"
              />
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-white">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 rounded border-white/20 bg-zinc-900"
              />
              Đang mở bán
            </label>
            <Button disabled={saving} onClick={() => void save()} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600">
              {saving ? "Đang lưu..." : "Lưu món"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminConcessionsPage;
