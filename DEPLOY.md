# Deploy CINEWAVE

Kiến trúc cloud khuyến nghị:

| Thành phần | Host | URL ví dụ |
|------------|------|-----------|
| Frontend | Vercel | https://cinewave-tt.vercel.app |
| Backend API | Render | https://cinewave-api.onrender.com |
| YOLO CCCD | Local `:8000` / Docker | `dataset_luanvan/cccd_detect_server` (VietOCR + WeChat/zxing QR) |

> YOLO + VietOCR + WeChat QR cần **≥ 2 GB RAM**. Render Free dễ OOM — nên Starter trở lên nếu deploy cloud.

---

## 1. YOLO / CCCD AI (`cccd_detect_server`)

Local (khớp `backend/.env` → `AI_SERVICE_URL=http://localhost:8000`):

```bat
cd D:\dataset_luanvan\cccd_detect_server
.venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8000
```

Cần `weights/best.pt` và `weights/wechat_qrcode/` (`python download_wechat_models.py` nếu thiếu).

Docker/VPS: `LuanVan/deploy/docker-compose.yml` build từ `../../dataset_luanvan/cccd_detect_server`.

Kiểm tra: `GET /health`, `POST /analyze`, `POST /decode-qr`.

---

## 2. Deploy Backend (repo `CINEWAVE` → Render)

### Cách A — Blueprint

1. Push `render.yaml` (root repo CINEWAVE) lên `main`.
2. Render → **New** → **Blueprint** → chọn `tranhaithien04/CINEWAVE`.
3. Điền các env `sync: false` theo `deploy/.env.render.example`.

### Cách B — Web Service thủ công

1. **New Web Service** → `tranhaithien04/CINEWAVE`
2. **Root Directory:** `backend`
3. **Build:** `npm ci --include=dev && npm run build`  
   (`--include=dev` bắt buộc: không có thì thiếu `@types/*` và `tsc` fail)
4. **Start:** `npm start`
5. **Health Check Path:** `/health`

### Env bắt buộc (Production)

| Biến | Giá trị |
|------|---------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | chuỗi ngẫu nhiên dài |
| `NEXT_PUBLIC_APP_URL` | `https://cinewave-tt.vercel.app` |
| `CORS_ORIGINS` | `https://cinewave-tt.vercel.app` |
| `COOKIE_SAMESITE` | `none` (bắt buộc vì Vercel ≠ Render domain) |
| `AI_SERVICE_URL` | URL YOLO ở bước 1 |
| `AI_SERVICE_KEY` | (tuỳ chọn) khớp key nếu YOLO yêu cầu |
| `GOOGLE_CALLBACK_URL` | `https://<api>.onrender.com/auth/google/callback` |
| SMTP / SEPAY / OMDB / TMDB / Google | copy từ `.env` local |

### Google OAuth

Thêm Authorized redirect URI trong Google Cloud Console:

`https://<api>.onrender.com/auth/google/callback`

### MongoDB Atlas

Render IP động → Network Access cho phép `0.0.0.0/0` (hoặc IP allowlist theo docs Render).

Kiểm tra: `GET https://<api>.onrender.com/health` → `{ ok: true, db: "connected" }`

---

## 3. Frontend Vercel (đã deploy)

Environment variables Production:

| Biến | Giá trị |
|------|---------|
| `NEXT_PUBLIC_APP_URL` | `https://cinewave-tt.vercel.app` |
| `NEXT_PUBLIC_API_URL` | `https://<api>.onrender.com` |

Redeploy frontend sau khi đổi `NEXT_PUBLIC_API_URL`.

---

## 4. Cookie / đăng nhập cross-site

- Web `*.vercel.app` + API `*.onrender.com` → cookie **SameSite=None; Secure** (`COOKIE_SAMESITE=none`).
- Lâu dài nên gắn custom domain chung (`app.domain.com` + `api.domain.com`) rồi set `COOKIE_DOMAIN=.domain.com` và có thể dùng `COOKIE_SAMESITE=lax`.

---

## 5. Kiểm tra sau deploy

1. `GET /health` trên API → DB connected  
2. `GET /health` trên YOLO → model + classes  
3. Mở web → đăng nhập Google / email  
4. Thử upload CCCD (age gate) — backend gọi `AI_SERVICE_URL/analyze`

---

## Phụ lục — Deploy VPS (Docker, kiến trúc cũ)

Nếu dùng một VPS thay Render:

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx
```

Clone cạnh nhau `CINEWAVE` + `server-YOLO-CINEWAVE`, rồi:

```bash
cd ~/cinewave/CINEWAVE/deploy
cp .env.vps.example .env   # chỉnh biến
docker compose up -d --build
```

Chi tiết Nginx/HTTPS xem lịch sử commit / `deploy/nginx/cinewave-api.conf`.
