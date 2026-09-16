# Deploy CINEWAVE

Kiến trúc: **Frontend → Vercel**, **Backend + YOLO → một VPS**.

## 1. VPS — Backend + YOLO

### Chuẩn bị

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx
sudo usermod -aG docker $USER
```

Clone hai repo cạnh nhau:

```text
~/cinewave/
  CINEWAVE/
  server-YOLO-CINEWAVE/
```

### Env & chạy Docker

```bash
cd ~/cinewave/CINEWAVE/deploy
cp .env.vps.example .env
nano .env   # MONGODB_URI, JWT_*, NEXT_PUBLIC_APP_URL, CORS_ORIGINS, ...
docker compose up -d --build
curl -s http://127.0.0.1:4000/health
```

API chỉ bind `127.0.0.1:4000`. Dùng Nginx + HTTPS ra internet:

```bash
sudo cp nginx/cinewave-api.conf /etc/nginx/sites-available/cinewave-api
# sửa server_name → api.yourdomain.com
sudo ln -sf /etc/nginx/sites-available/cinewave-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api.yourdomain.com
```

Cập nhật `GOOGLE_CALLBACK_URL=https://api.yourdomain.com/auth/google/callback`.

### MongoDB Atlas

Whitelist IP VPS (hoặc `0.0.0.0/0` tạm thời khi test).

---

## 2. Vercel — Frontend

1. Import repo GitHub `tranhaithien04/CINEWAVE`.
2. **Root Directory:** `frontend`
3. Environment variables (Production):

   | Biến | Ví dụ |
   |------|--------|
   | `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` hoặc `https://app.yourdomain.com` |
   | `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com` |

4. Deploy.

Trên VPS, `NEXT_PUBLIC_APP_URL` và `CORS_ORIGINS` phải khớp URL Vercel/custom domain.

### Cookie đăng nhập (web)

- Vercel `*.vercel.app` + API domain khác → cookie cross-site dễ lỗi.
- Khuyến nghị: custom domain web (`app.yourdomain.com`) + API (`api.yourdomain.com`), set `COOKIE_DOMAIN=.yourdomain.com` trên VPS.

---

## 3. Kiểm tra sau deploy

- `GET https://api.yourdomain.com/health` → `{ ok: true, db: "connected" }`
- Mở web → đăng nhập, xem phim, thử upload CCCD (YOLO nội bộ Docker).

---

## 4. Cập nhật phiên bản

**VPS:**

```bash
cd ~/cinewave/CINEWAVE && git pull
cd ~/cinewave/server-YOLO-CINEWAVE && git pull
cd ~/cinewave/CINEWAVE/deploy && docker compose up -d --build
```

**Vercel:** push lên `main` → auto deploy (nếu đã bật).
