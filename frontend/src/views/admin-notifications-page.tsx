"use client";

import { useState } from "react";
import { toast } from "sonner";

import { broadcastAdminNotification } from "@/api/admin";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function AdminNotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [href, setHref] = useState("/notifications");
  const [sending, setSending] = useState(false);

  async function send() {
    setSending(true);
    try {
      const result = await broadcastAdminNotification({ title, body, href: href || "/notifications" });
      toast.success(`Đã gửi ${result.sent}/${result.totalUsers} người dùng`);
      setTitle("");
      setBody("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không gửi được thông báo");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white">Thông báo hệ thống</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gửi thông báo tới toàn bộ tài khoản (hiển thị chuông + trang Thông báo của khách).
        </p>
      </div>

      <Card className="rounded-2xl border-white/10 bg-white/[0.02] backdrop-blur-xl sm:max-w-xl">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="text-base font-semibold text-white">Soạn broadcast</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 pt-4">
          <div className="grid gap-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tiêu đề</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bảo trì hệ thống tối nay"
              className="rounded-xl border-white/10 bg-white/5"
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nội dung</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Nội dung ngắn gọn cho khách hàng..."
              className="min-h-28 rounded-xl border-white/10 bg-white/5"
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Link (tuỳ chọn)</Label>
            <Input
              value={href}
              onChange={(e) => setHref(e.target.value)}
              placeholder="/movies"
              className="rounded-xl border-white/10 bg-white/5"
            />
          </div>
          <Button
            disabled={sending || !title.trim() || !body.trim()}
            onClick={() => void send()}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold"
          >
            {sending ? "Đang gửi..." : "Gửi tới mọi người dùng"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminNotificationsPage;
