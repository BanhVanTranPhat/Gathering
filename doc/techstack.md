# Technology Stack – The Gathering

> Virtual Co-Working Space Platform  
> Last updated: **2026-03-10**

---

## 1. Tổng quan kiến trúc

```
┌────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                        │
│  Next.js 14 (App Router) + React 18 + Tailwind CSS 3.4        │
│  PixiJS 8 (2D rendering) + Agora RTC SDK (WebRTC)             │
│  Socket.IO Client (real-time)                                  │
└──────────────┬────────────────────────┬───────────────────────┘
               │ REST API (HTTPS)       │ WebSocket (Socket.IO)
               ▼                        ▼
┌────────────────────────────────────────────────────────────────┐
│                     Backend Server                             │
│  Express.js 4 + TypeScript 5 + Socket.IO 4                    │
│  JWT Authentication + Zod Validation + Rate Limiting           │
└──────────────┬────────────────────────┬───────────────────────┘
               │                        │
               ▼                        ▼
         ┌──────────┐           ┌──────────────┐
         │ MongoDB  │           │  Agora Cloud │
         │(Mongoose)│           │  (SFU/Media) │
         └──────────┘           └──────────────┘
```

### 1.1 Component-level view

```mermaid
flowchart LR
  subgraph frontend[Frontend - Next.js 14]
    landing[app/landing]
    signin[app/signin]
    dashboard[app/app]
    play[app/play]
    editor[app/editor]
    adminPage[app/admin]
    profilePage[app/profile]

    subgraph utils[utils/]
      pixi[pixi/ (PlayApp, Player, Map)]
      videoChat[video-chat/ (Agora wrapper)]
      authClient[auth/ client]
      backendClient[backend/ API client]
    end
  end

  subgraph backend[Backend - Express.js]
    routes[routes/ (auth, realms, chat, events, resources, forum, admin)]
    models[models/ (User, Profile, Realm, Event, Resource, Thread, Post)]
    sockets[sockets/ (Socket.IO handlers)]
  end

  db[(MongoDB)]
  agora[Agora Cloud SFU]

  frontend --> backend
  backend --> db
  play --> pixi
  play --> videoChat
  play --> sockets
  dashboard --> backendClient
  signin --> authClient
  videoChat --> agora
```

---

## 2. Frontend

| Công nghệ | Phiên bản | Vai trò | Lý do chọn |
|---|---|---|---|
| **Next.js** | 14.2.14 | Framework chính | App Router hỗ trợ Server Components, file-based routing, SSR/SSG tích hợp, tối ưu SEO cho landing page. |
| **React** | 18.2.0 | UI Library | Ecosystem lớn nhất, component-based architecture, hooks API mạnh mẽ, phù hợp với SPA phức tạp. |
| **TypeScript** | ~5.4.5 | Type system | Giúp phát hiện lỗi compile-time, tăng DX với IntelliSense, đảm bảo type-safety cho codebase lớn. |
| **Tailwind CSS** | 3.4.1 | Styling | Utility-first CSS, tăng tốc styling, đảm bảo consistency UI, dễ responsive và theme. |
| **PixiJS** | 8.1.0 | 2D Game Engine | Hiệu năng cao cho rendering sprite, tilemap, animation (avatar movement, camera bubbles, map editor view). Nhẹ hơn Phaser cho use case 2D đơn giản, API hiện đại (v8). |
| **Agora RTC SDK** | 4.22.1 | Audio/Video | Cloud-based SFU, không cần tự deploy media server. Hỗ trợ ≥100 participants, SDK ổn định, free tier đủ cho MVP. Dùng cho proximity calls và group calls. |
| **Socket.IO Client** | 4.7.5 | Real-time | Tương thích Socket.IO server, auto-reconnect, fallback polling, event-based messaging đơn giản (movement, chat, calendar updates). |
| **Framer Motion** | 12.35.1 | Animation (UI) | Declarative animation API cho React, hỗ trợ layout animation, gesture, page transitions cho landing page. |
| **GSAP** | 3.12.5 | Animation (Advanced) | Timeline-based animation mạnh mẽ, scroll triggers cho landing page sections, performance cao. |
| **Chart.js** | 4.5.1 | Data Visualization | Charts cho admin dashboard (bar, line, doughnut). Nhẹ, dễ integrate với React qua `react-chartjs-2`. |
| **Zod** | 3.23.8 | Validation | Runtime type validation cho form data, socket payloads. Tích hợp tốt với TypeScript, kích thước nhỏ. |
| **@phosphor-icons/react** | 2.1.5 | Icon Library | Bộ icon phong phú (6000+), hỗ trợ nhiều weight, tree-shakeable, phù hợp style Gather.town. |
| **Lucide React** | 0.577.0 | Icon Library (phụ) | Icons bổ sung cho call panel, admin UI. |
| **React Toastify** | 10.0.5 | Notifications | Toast notifications đơn giản, không cần setup phức tạp. |
| **UUID** | 9.0.1 | ID Generation | Tạo unique ID cho realm, event, client-side operations. |

---

## 3. Backend

| Công nghệ | Phiên bản | Vai trò | Lý do chọn |
|---|---|---|---|
| **Express.js** | 4.19.2 | HTTP Framework | Lightweight, middleware ecosystem lớn, phù hợp REST API. Đơn giản hơn NestJS cho quy mô MVP. |
| **TypeScript** | ~5.4.5 | Type system | Thống nhất ngôn ngữ với frontend, type-safe API contracts, giảm runtime errors. |
| **Socket.IO** | 4.7.5 | Real-time Engine | Bi-directional real-time communication, auto-reconnect, rooms/namespaces cho multiplayer presence. |
| **Mongoose** | 8.0.3 | MongoDB ODM | Schema validation, middleware hooks, populate cho relationships, query builder trực quan. |
| **JSON Web Token** | 9.0.2 | Authentication | Stateless auth, token-based session, phù hợp SPA + API architecture, không cần session store. |
| **Bcrypt.js** | 2.4.3 | Password Hashing | Bcrypt algorithm an toàn, adaptive hashing, JS pure implementation (không cần native bindings). |
| **Nodemailer** | 8.0.1 | Email Service | Gửi OTP verification, event reminders. Hỗ trợ Gmail SMTP, template-ready. |
| **Express Rate Limit** | 8.3.0 | Anti-abuse | Rate limiting cho auth endpoints, API chung. Middleware dễ cấu hình per-route. |
| **Zod** | 3.23.8 | Input Validation | Validate request body/params, type-safe schemas, share validation logic với frontend. |
| **CORS** | 2.8.5 | Security | Cross-Origin Resource Sharing cho frontend-backend communication. |
| **Dotenv** | 16.4.5 | Environment Config | Load `.env` variables, tách config khỏi code, bảo mật secrets. |
| **UUID** | 10.0.0 | ID Generation | Tạo unique ID cho realm, event, share links. |
| **tsx** | 4.21.0 | Dev Runner | Hot-reload cho development (`tsx watch`), nhanh hơn `ts-node`, không cần compile step. |

---

## 4. Database

| Công nghệ | Vai trò | Lý do chọn |
|---|---|---|
| **MongoDB** | Database chính | Schema-flexible cho game data (map_data, avatarConfig), horizontal scaling built-in, JSON-native phù hợp Node.js. |

### Data Models

| Model | Mô tả | Trường chính |
|---|---|---|
| **User** | Thông tin đăng nhập | email, password (hashed), displayName, googleId, role, avatar |
| **Profile** | Hồ sơ game | skin, avatarConfig, displayName, bio, visited_realms, lastPositions |
| **Realm** | Không gian ảo | name, owner_id, map_data, mapTemplate, share_id, only_owner |
| **ChatChannel** | Kênh chat | realmId, name, type (channel/dm), members |
| **ChatMessage** | Tin nhắn | channelId, senderId, senderName, content, timestamp |
| **Event** | Sự kiện/lịch (Calendar) | realmId, title, startTime, endTime, attendees, maxParticipants, RSVP status |
| **Thread** | Bài viết forum | realmId, title, body, authorId, postCount |
| **Post** | Trả lời forum | threadId, body, authorId, authorName |
| **Resource** | Tài nguyên thư viện | realmId, title, content_type, url, description |

---

## 5. Real-time & Media

| Công nghệ | Vai trò | Lý do chọn |
|---|---|---|
| **Socket.IO** | Signaling + Presence | Event-based, rooms cho realm/channel separation, auto-reconnect, fallback transport. |
| **Agora RTC** | Audio/Video Streaming | Cloud SFU — không cần tự host media server, scale tự động, SDK đơn giản. Free 10,000 phút/tháng đủ cho MVP. So với self-hosted mediasoup: giảm ops complexity, NAT traversal built-in. |

### Agora vs Self-hosted SFU

| Tiêu chí | Agora (đang dùng) | mediasoup (tự host) |
|---|---|---|
| Setup | SDK + App ID | Deploy server + TURN/STUN |
| Scaling | Tự động | Tự quản lý |
| Latency | Tối ưu bởi Agora CDN | Phụ thuộc server location |
| Cost | Free 10K min/month | Server cost |
| Reliability | 99.9% SLA | Tự đảm bảo |
| NAT Traversal | Built-in | Cần TURN server |

---

## 6. DevOps & Tooling

| Công nghệ | Vai trò | Lý do chọn |
|---|---|---|
| **Yarn** 1.22.22 | Package Manager | Nhanh, lockfile ổn định, workspace support cho monorepo tương lai. |
| **tsx** (watch mode) | Backend Hot-reload | Tự động restart khi file thay đổi, nhanh hơn ts-node, zero-config. |
| **Git** | Version Control | Quản lý source code, branching strategy, collaboration. |
| **GitHub** | Code Hosting | Repository hosting, PR reviews, issue tracking. |
| **PostCSS** | CSS Processing | Autoprefixer cho Tailwind CSS, browser compatibility. |

---

## 7. Cấu trúc Project

```
gather-clone/
├── frontend/                 # Next.js 14 App
│   ├── app/                  # App Router pages
│   │   ├── landing/          # Landing page + sections
│   │   ├── signin/           # Authentication
│   │   ├── app/              # Space manager dashboard
│   │   ├── play/             # Virtual space (game)
│   │   ├── editor/           # Map editor
│   │   ├── manage/           # Realm management
│   │   ├── admin/            # Admin dashboard
│   │   └── profile/          # User profile
│   ├── components/           # Shared UI components
│   ├── utils/                # Utilities
│   │   ├── pixi/             # PixiJS engine (PlayApp, Player, Map)
│   │   ├── video-chat/       # Agora RTC wrapper
│   │   ├── auth/             # Auth client
│   │   └── backend/          # Backend API client
│   └── public/               # Static assets (sprites, tiles, gather assets)
│
├── backend/                  # Express.js API
│   ├── src/
│   │   ├── models/           # Mongoose models (9 models)
│   │   ├── routes/           # REST API routes (10 route files)
│   │   ├── sockets/          # Socket.IO event handlers
│   │   ├── index.ts          # Server entry point
│   │   ├── db.ts             # MongoDB connection
│   │   └── auth.ts           # JWT middleware
│   └── dist/                 # Compiled JavaScript
│
└── doc/                      # Documentation
```

---

## 8. Tổng kết lựa chọn

### Nguyên tắc chọn tech stack

1. **Thống nhất ngôn ngữ**: TypeScript toàn bộ (frontend + backend) giảm context switching, share types/validation.
2. **Giảm operational complexity**: Agora cloud SFU thay vì self-hosted mediasoup, MongoDB Atlas thay vì self-managed DB.
3. **Developer experience**: Hot-reload (tsx watch, Next.js HMR), type-safety, utility CSS.
4. **Phù hợp quy mô MVP**: Không over-engineer, ưu tiên ship nhanh với 30–50 beta users.
5. **Ecosystem maturity**: React/Next.js/Express đều có community lớn, documentation tốt, nhiều reference.

---

## 9. Why this stack (for defense)

### 9.1 Why we chose this stack

- **Next.js + React + TypeScript**: build product UI quickly while keeping code maintainable and type-safe.
- **Bun + Elysia.js + Socket.IO**: fast runtime and lightweight backend for REST + realtime features in one service.
- **MongoDB + Mongoose**: flexible schema for rapidly changing MVP modules (realm, event, forum, library).
- **PixiJS + Agora RTC**: combines 2D virtual-space experience with reliable cloud media for group calls.

### 9.2 Trade-offs we accepted

- We prioritized development speed over strict enterprise layering.
- Email reminders currently run in app scheduler (good for MVP, can move to queue worker later).
- Realtime scaling for multi-instance deployment is a next phase (Redis adapter + infra hardening).

### 9.3 Scale-up roadmap after MVP

```mermaid
flowchart LR
  MVP["Current MVP Stack"] --> Q["Queue Worker for Emails/Jobs"]
  Q --> O11["Structured Logs + Metrics + Alerts"]
  O11 --> RT["Socket.IO Redis Adapter"]
  RT --> PERF["Automated Load Tests (20->50->100)"]
```

- **Phase 1**: add queue-based job processing for OTP/reminders.
- **Phase 2**: add observability stack (error tracking, metrics, alerting).
- **Phase 3**: enable horizontal realtime scaling and formal load-test pipeline.
