"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Lock, ShieldAlert } from "lucide-react";

import {
  fetchAdminSystemSettings,
  updateAdminSystemSettings,
  type SystemSettingRow,
  type SystemSettingsAudit,
  type SystemStatus,
} from "@/api/admin";
import { ApiError } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/utils/datetime";

export function AdminSystemPage() {
  const [settings, setSettings] = useState<SystemSettingRow[]>([]);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [audit, setAudit] = useState<SystemSettingsAudit[]>([]);
  const [securityNote, setSecurityNote] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminSystemSettings();
      setSettings(data.settings);
      setStatus(data.status);
      setAudit(data.audit);
      setSecurityNote(data.security.note);
      const next: Record<string, string> = {};
      for (const row of data.settings) {
        if (row.sensitivity === "public" && row.editable) next[row.key] = row.value ?? "";
        else if (row.editable) next[row.key] = "";
      }
      setDrafts(next);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được cấu hình hệ thống");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const groups = useMemo(() => {
    const map = new Map<string, SystemSettingRow[]>();
    for (const row of settings) {
      const list = map.get(row.group) ?? [];
      list.push(row);
      map.set(row.group, list);
    }
    return [...map.entries()];
  }, [settings]);

  async function save() {
    const patch: Record<string, string | null> = {};
    for (const row of settings) {
      if (!row.editable) continue;
      const draft = drafts[row.key] ?? "";
      if (row.sensitivity === "secret") {
        if (draft.trim()) patch[row.key] = draft;
        continue;
      }
      const current = row.value ?? "";
      if (draft !== current) patch[row.key] = draft;
    }
    if (!Object.keys(patch).length) {
      toast.message("Không có thay đổi để lưu");
      return;
    }
    if (!password) {
      toast.error("Nhập mật khẩu Admin để xác nhận");
      return;
    }

    setSaving(true);
    try {
      const result = await updateAdminSystemSettings({
        settings: patch,
        confirmPassword: password,
      });
      toast.success(`Đã cập nhật ${result.changed.length} cấu hình`);
      setPassword("");
      setSettings(result.settings);
      setStatus(result.status);
      const next: Record<string, string> = {};
      for (const row of result.settings) {
        if (row.sensitivity === "public" && row.editable) next[row.key] = row.value ?? "";
        else if (row.editable) next[row.key] = "";
      }
      setDrafts(next);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không lưu được cấu hình");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">Hệ thống & bảo mật</h1>
          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-200">
            Admin only
          </Badge>
        </div>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Quản lý cấu hình runtime an toàn: whitelist khóa, che secret, khóa hạ tầng (JWT/Mongo), bắt buộc mật khẩu Admin khi lưu.
        </p>
      </div>

      <Card className="rounded-2xl border-amber-500/20 bg-amber-500/[0.06]">
        <CardContent className="flex items-start gap-3 p-4 text-sm text-amber-100/90">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
          <p>{securityNote || "Secret không bao giờ trả plaintext. Không thể đọc file .env thô."}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(status?.checks ?? []).map((check) => (
          <Card key={check.id} className="rounded-2xl border-white/10 bg-white/[0.02]">
            <CardContent className="flex items-center justify-between p-4">
              <span className="text-sm text-gray-300">{check.label}</span>
              <Badge
                variant="outline"
                className={
                  check.ok
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-300"
                }
              >
                {check.ok ? "OK" : "Thiếu"}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {status ? (
        <p className="text-xs text-muted-foreground">
          Node env: <span className="text-cyan-300">{status.nodeEnv}</span> · Uptime{" "}
          <span className="font-mono text-cyan-300">{Math.floor(status.uptimeSec / 60)}m</span>
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải cấu hình...</p>
      ) : (
        groups.map(([group, rows]) => (
          <Card key={group} className="rounded-2xl border-white/10 bg-white/[0.02] backdrop-blur-xl">
            <CardHeader className="border-b border-white/5 pb-4">
              <CardTitle className="text-base font-semibold text-white">{group}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {rows.map((row) => (
                <div key={row.key} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-white">{row.label}</p>
                    <Badge variant="outline" className="border-white/10 font-mono text-[10px] text-gray-400">
                      {row.key}
                    </Badge>
                    {row.sensitivity === "secret" ? (
                      <Badge variant="outline" className="border-amber-500/30 text-amber-200">
                        secret
                      </Badge>
                    ) : null}
                    {row.sensitivity === "locked" ? (
                      <Badge variant="outline" className="gap-1 border-rose-500/30 text-rose-200">
                        <Lock className="h-3 w-3" /> locked
                      </Badge>
                    ) : null}
                    {row.source === "override" ? (
                      <Badge variant="outline" className="border-cyan-500/30 text-cyan-300">
                        override
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mb-2 text-xs text-muted-foreground">{row.description}</p>
                  {row.editable ? (
                    <Input
                      type={row.sensitivity === "secret" ? "password" : "text"}
                      autoComplete="off"
                      placeholder={
                        row.sensitivity === "secret"
                          ? row.configured
                            ? `Đã cấu hình (${row.hint}) — nhập để thay`
                            : "Chưa cấu hình — nhập giá trị mới"
                          : undefined
                      }
                      value={drafts[row.key] ?? ""}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [row.key]: e.target.value }))}
                      className="rounded-xl border-white/10 bg-white/5 font-mono text-sm"
                    />
                  ) : (
                    <p className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 font-mono text-xs text-gray-400">
                      {row.configured ? row.hint || "•••• configured" : "chưa cấu hình"} · chỉ sửa qua .env/secrets
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}

      <Card className="rounded-2xl border-cyan-500/20 bg-white/[0.02] sm:max-w-xl">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="text-base text-white">Xác nhận lưu</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 pt-4">
          <div className="grid gap-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Mật khẩu Admin</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu tài khoản Admin hiện tại"
              className="rounded-xl border-white/10 bg-white/5"
              autoComplete="current-password"
            />
          </div>
          <Button
            disabled={saving}
            onClick={() => void save()}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold"
          >
            {saving ? "Đang lưu..." : "Lưu cấu hình an toàn"}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-white/10 bg-white/[0.02]">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="text-base text-white">Audit gần đây</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-white/5 pt-2">
          {audit.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Chưa có thay đổi.</p>
          ) : (
            audit.map((item) => (
              <div key={`${item.at}-${item.key}-${item.adminEmail}-${item.action}`} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                <p className="text-white">
                  <span className="font-mono text-cyan-300">{item.key}</span> · {item.action}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.adminEmail} · {formatDateTime(item.at)}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminSystemPage;
