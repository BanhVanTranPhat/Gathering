# Gathering Monorepo

Monorepo gồm **Next.js (frontend)** + **Elysia + Socket.IO (backend)**.

## Cấu trúc thư mục

- `backend/`: API Elysia + realtime Socket.IO
- `frontend/`: ứng dụng Next.js (editor, play, dashboard)
- `doc/`: tài liệu
- `scratch/`: thử nghiệm tạm, không dùng cho production

---

## Chạy nhanh trên Windows

### 1. Cài phần mềm cần thiết

| Thứ cần có | Ghi chú |
|-------------|---------|
| [Git for Windows](https://git-scm.com/download/win) | Clone repo |
| [Bun](https://bun.sh/docs/installation) | Package manager/runtime của project (`bun install`, `bun dev`) |
| MongoDB | Local ([MongoDB Community](https://www.mongodb.com/try/download/community)) hoặc [MongoDB Atlas](https://www.mongodb.com/atlas) (URI remote) |

Mở **PowerShell** hoặc **Terminal** trong thư mục bạn muốn chứa code.

### 2. Clone và cài dependency

```powershell
git clone <URL-repo-của-bạn> Gathering
cd Gathering
bun install
bun run install:all
```

`install:all` sẽ cài thêm dependency cho `backend/` và `frontend/`.

### 3. Biến môi trường (.env)

**Backend** — copy file mẫu rồi chỉnh cho đúng máy bạn:

```powershell
copy backend\.env.example backend\.env
```

Trong `backend\.env` tối thiểu cần:

- `MONGODB_URI` — ví dụ local: `mongodb://127.0.0.1:27017/gather-clone`  
  (MongoDB phải đang chạy nếu dùng local.)
- `JWT_SECRET` — chuỗi bí mật bất kỳ đủ dài cho môi trường dev.

Các biến khác (Google OAuth, email, LiveKit…) có thể để trống nếu bạn chưa dùng tính năng đó.

**Frontend** — copy mẫu (nếu chưa có `.env.local`):

```powershell
copy frontend\.env.example frontend\.env.local
```

Mặc định trong `.env.example` trỏ API tới `http://localhost:5001` và app tới `http://localhost:5173`.  
Nếu Socket.IO không chạy đúng cổng, thêm vào `frontend\.env.local`:

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:5002
```

### 4. Chạy cả backend + frontend (một lệnh)

Từ thư mục gốc `Gathering` (cùng cấp với file `package.json` có script `dev`):

```powershell
bun dev
```

- **Frontend:** http://localhost:5173  
- **API (Elysia):** http://localhost:5001  
- **Socket.IO:** cổng **5002** (mặc định trong code)

Dừng server: `Ctrl + C` trong cửa sổ terminal đang chạy `bun dev`.

### 5. Chạy từng phần (tùy chọn)

Nếu muốn tách hai cửa sổ terminal:

```powershell
# Cửa sổ 1 — backend
bun run --cwd backend dev

# Cửa sổ 2 — frontend
bun run --cwd frontend dev
```

---

## Lệnh thường dùng

| Mục đích | Lệnh (từ thư mục gốc `Gathering`) |
|----------|-----------------------------------|
| Cài full monorepo | `bun run install:all` |
| Dev song song | `bun dev` |
| Chỉ frontend | `bun run --cwd frontend dev` |
| Build frontend | `bun run --cwd frontend build` |
| Chỉ backend | `bun run --cwd backend dev` |
| Build backend | `bun run --cwd backend build` |
| Lint frontend | `bun run --cwd frontend lint` |

---

## Gợi ý xử lý sự cố (Windows)

- **Backend báo lỗi `MONGODB_URI is required`:** kiểm tra file `backend\.env` có `MONGODB_URI` và MongoDB đã chạy (hoặc URI Atlas đúng).
- **Frontend load được nhưng realtime/chat lỗi:** kiểm tra backend đã listen cổng **5002**, firewall Windows không chặn `5001` / `5002` / `5173`.
- **Lỗi build/cache Next.js:** trong `frontend` chạy `bun run clean` rồi `bun run --cwd frontend dev` lại.
- **404 ảnh / sprite:** không xóa thư mục `frontend/public/assets`; nếu lỡ xóa, khôi phục từ git:  
  `git restore frontend/public/assets/sprites/`

---

## Map pipeline (tham khảo)

- Resolve map AI: `frontend/utils/maps/resolveAiMapTemplate.ts`
- Asset + manifest map: `frontend/public/assets/maps/`
- Parser/builder map: `frontend/utils/maps/`
