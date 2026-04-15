# Coding Rules & Conventions – The Gathering

> Last updated: **2026-03-08**

---

## 1. Language & tools

- **TypeScript** is the only language for both frontend and backend. Do not write `.js` except for config files (next.config.js, tailwind.config.js).
- **Yarn** is the primary package manager. Do not use `npm` to avoid lockfile conflicts.
- Use **ESLint** + **TypeScript strict mode** to ensure code quality.

---

## 2. Folder structure

### Frontend (`frontend/`)

```
app/                    # Next.js App Router pages
  ├── [feature]/        # Each feature gets its own folder (play/, admin/, editor/…)
  │   ├── page.tsx      # Route entry
  │   └── [Component].tsx  # Feature-specific components
components/             # Shared/reusable components
utils/                  # Utility functions, classes, helpers
  ├── pixi/             # PixiJS game engine code
  ├── video-chat/       # Agora RTC wrapper
  ├── auth/             # Auth utilities
  └── backend/          # Backend API client
public/                 # Static assets (sprites, tiles, gather assets from gathertown/mapmaking)
```

### Backend (`backend/src/`)

```
models/       # Mongoose models (1 file per model)
routes/       # Express route handlers (1 file per resource)
sockets/      # Socket.IO event handlers
index.ts      # Server entry point
db.ts         # Database connection
auth.ts       # JWT middleware
```

---

## 3. Naming rules

### Files & Folders

| Type | Convention | Example |
|---|---|---|
| React component | PascalCase | `PlaySidebar.tsx`, `ChatPanel.tsx` |
| Utility / helper | camelCase | `generateToken.ts`, `formatEmailToName.ts` |
| Route handler (backend) | camelCase | `realms.ts`, `profiles.ts` |
| Model (backend) | PascalCase | `User.ts`, `ChatMessage.ts` |
| Type / Interface file | camelCase | `socket-types.ts`, `route-types.ts` |
| CSS / Style | kebab-case or module naming | `globals.css` |
| Constants | camelCase file, UPPER_SNAKE content | `constants.tsx` → `MAX_PLAYERS = 30` |

### Variables & functions

| Type | Convention | Example |
|---|---|---|
| Variable | camelCase | `playerCount`, `isConnected` |
| Function | camelCase | `handleJoinRealm()`, `toggleCamera()` |
| React Component | PascalCase | `PlayNavbar`, `VideoTile` |
| React Hook | camelCase with `use` prefix | `useModal()`, `useLobbyChat()` |
| Constant | UPPER_SNAKE_CASE | `BUBBLE_Y`, `MAX_PROXIMITY_RANGE` |
| Interface / Type | PascalCase, prefix `I` cho interface (optional) | `IRealm`, `ConnectionResponse` |
| Enum value | UPPER_SNAKE_CASE | `ContentType.GUIDE` |
| Boolean | `is`, `has`, `should` prefix | `isOnline`, `hasRemoteVideoTrack` |
| Event handler | `on` or `handle` prefix | `onPlayerJoined`, `handleClick` |
| Signal / Event name | camelCase | `remoteVideoPublished`, `joinedRealm` |

### Database

| Type | Convention | Example |
|---|---|---|
| Collection name | lowercase plural (auto by Mongoose) | `users`, `realms`, `chatmessages` |
| Field name | camelCase | `displayName`, `createdAt`, `mapTemplate` |
| Index field | Document in schema notes | `{ email: 1 }`, `{ realmId: 1 }` |

---

## 4. Code style guidelines

### TypeScript

- `strict: true` must be enabled in `tsconfig`.
- Avoid `any` unless strictly necessary (and explain why in a comment).
- Prefer `interface` for object shapes, `type` for unions/intersections.
- Use `readonly` for props and fields that should not change.
- Destructure parameters when there are ≥2 props.

### React

- Functional components only (no class components).
- Use hooks: `useState`, `useEffect`, `useRef`, `useCallback`, `useMemo`.
- Extract complex logic into custom hooks (`hooks/`).
- Use the `'use client'` directive only when the component truly needs client-side features.
- Avoid `useEffect` for derived state – prefer computed values or `useMemo`.

### Express (backend)

- Each route file exports a single `Router`.
- Authentication middleware (`requireAuth`) is applied per route, not globally.
- Validate all inputs using Zod schemas before business logic.
- Use `express-async-errors` and a custom error middleware for consistent error handling.
- Response format should be consistent: `{ success: boolean, data?, message?, error? }`.

### Socket.IO

- Event names: camelCase (e.g. `joinRealm`, `playerMoved`).
- Validate all payloads with Zod before processing.
- Keep the server authoritative: clients send intents, server validates and broadcasts.
- Debounce movement events on the server to reduce traffic.

---

## 5. Git workflow

### Branch Strategy

```
main                    # Production-ready code
├── develop             # Integration branch
│   ├── feature/xxx     # Feature branches
│   ├── fix/xxx         # Bug fix branches
│   └── hotfix/xxx      # Urgent production fixes
```

| Branch | Description | Merge into |
|---|---|---|
| `main` | Stable, demo-ready code | — |
| `develop` | Integrates new features | `main` (when releasing) |
| `feature/[name]` | Develop a feature | `develop` |
| `fix/[name]` | Fix a bug | `develop` |
| `hotfix/[name]` | Urgent production fix | `main` + `develop` |

### Branch Naming

```
feature/add-chat-panel
feature/agora-video-integration
fix/sidebar-zoom-issue
fix/camera-visibility
hotfix/auth-token-expire
```

```mermaid
flowchart LR
  devs[Developers] --> featureBranch[feature/* or fix/* branch]
  featureBranch --> pr[Pull Request on GitHub]
  pr --> review[Code review]
  review -->|approved| developBranch[develop branch]
  developBranch --> mainBranch[main branch (demo-ready)]
```

---

## 6. Commit convention

Format: **Conventional Commits**

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

### Types

| Type | Description | Example |
|---|---|---|
| `feat` | New feature | `feat(chat): add DM channel support` |
| `fix` | Bug fix | `fix(player): resolve camera bubble position` |
| `refactor` | Refactoring without behavior change | `refactor(sidebar): switch from fixed to flex layout` |
| `style` | UI/CSS change, no logic | `style(navbar): update button colors` |
| `docs` | Documentation | `docs: update techstack.md` |
| `chore` | Maintenance, config, dependencies | `chore: update TypeScript to 5.4.5` |
| `perf` | Performance optimization | `perf(pixi): reduce video frame rate to 15fps` |
| `test` | Testing | `test(auth): add login endpoint tests` |

### Scope (optional)

- Frontend: `chat`, `sidebar`, `navbar`, `player`, `pixi`, `agora`, `admin`, `editor`, `landing`
- Backend: `auth`, `realms`, `sockets`, `models`, `routes`, `db`
- Chung: `deps`, `config`, `ci`

### Rules

- Subject line ≤ 72 characters.
- Use English.
- Use imperative mood: `add`, `fix`, `update` (not `added`, `fixes`, `updated`).
- Do not end the subject line with a period.
- If you include a body, explain **why**, not just **what**.

### Examples

```
feat(chat): add real-time typing indicators

Emit chatTyping event when user types in message composer.
Server broadcasts to other users in the same channel.

Closes #45
```

```
fix(player): prevent camera bubble from overriding remote video

Add hasRemoteVideoTrack flag to skip setMediaState
when an active Agora remote video track exists.
```

---

## 7. Code review checklist

Before merging a PR, the reviewer should check:

- [ ] TypeScript compiles without errors.
- [ ] There is no unnecessary `any`.
- [ ] Naming conventions are consistent.
- [ ] There are no unexplained hardcoded values (use constants/env).
- [ ] Input validation (Zod) is applied to API endpoints and socket events.
- [ ] Error handling is complete (try/catch, error responses).
- [ ] There are no leftover `console.log` statements (keep only error logging).
- [ ] UI is at least basically responsive.
- [ ] Existing features are not broken (no regression).
- [ ] Commit messages follow the convention.

---

## 8. Environment variables

### Rules

- Sensitive values (API keys, secrets): only in `.env` / `.env.local`, **never** committed.
- Public values (frontend): prefix with `NEXT_PUBLIC_`.
- `.env.example` must list all required variables with sample values.

### Frontend (.env.local)

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5001
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id
APP_CERTIFICATE=your_agora_certificate
GOOGLE_CLIENT_ID=your_google_client_id
```

### Backend (.env)

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/gathering
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

---

## 9. Security rules

1. **Input validation**: All request bodies, query params, and socket payloads must be validated with Zod.
2. **Rate limiting**: Auth endpoints limited to 5 requests per 15 minutes.
3. **Password**: Hash with bcrypt (10 rounds); never store plain text.
4. **JWT**: Access token TTL 7 days; never expose the secret.
5. **CORS**: Only allow `CLIENT_URL`; never use wildcard `*` in production.
6. **File upload**: If enabled, limit to 10MB and whitelist mime types.
7. **NoSQL injection**: Validate IDs as strings/UUID; do not accept objects in query parameters.
8. **XSS**: Sanitize all user-generated content before rendering.

---

## 10. Performance guidelines

1. **MongoDB**: Add indexes on frequently queried fields (`realmId`, `channelId`, `timestamp`).
2. **Pagination**: All list endpoints must support pagination, with a maximum of 500 items per page.
3. **Socket.IO**: Throttle movement events (max 10/s) and batch updates when possible.
4. **PixiJS**: Limit video frame updates to 15fps (canvas-based) and clean up textures when a player leaves.
5. **Agora**: Join channels lazily (only when proximity is detected), leave as soon as the user moves away.
6. **Frontend**: Lazy-load components for less frequently used routes (admin, editor).

---

## 11. Team responsibilities (for reviewers)

| Member | Focus areas |
|---|---|
| **Phạm Nguyễn Thiên Lộc (Leader)** | Planning, coordination, overall architecture, final presentation lead |
| **Lê Tấn Đạt** | Authentication, user profile, avatar customization (avatar editor + in-game `avatarConfig` integration) |
| **Lê Thới Duy** | Events & Calendar (backend `/events` APIs, `CalendarPanel.tsx` UI, event data model) |
| **Bành Văn Trần Phát** | Core gameplay (PixiJS map, `PlayApp`, `Player`), real-time Socket.IO flows, Agora integration, chat, map editor, admin dashboard, library, forum, and integration work |
