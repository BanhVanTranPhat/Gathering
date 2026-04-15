# Requirement Traceability Matrix (RTM)

> The Gathering - standardized traceability using current User Story IDs.

## 1. Purpose

This RTM links each User Story to:

- SRS functional requirement coverage,
- implementation targets (frontend/backend modules),
- verification test cases,
- and current status.

This document uses the same canonical IDs as `doc/User_Story.md` and `doc/SRS.md`.

---

## 2. Traceability Matrix

| User Story ID | Group Function             | Requirement Summary                          | SRS Reference      | Implementation Target                                                                                           | Verification Test Case IDs                        | Status      |
| :------------ | :------------------------- | :------------------------------------------- | :----------------- | :-------------------------------------------------------------------------------------------------------------- | :------------------------------------------------ | :---------- |
| AUTH-01       | Authentication             | Register with email + OTP verification       | SRS 6 (`AUTH-01`)  | `backend/src/routes/auth.ts` (`/auth/send-otp`, `/auth/verify-otp`)                                             | `TC-AUTH-01-01`, `TC-AUTH-01-02`, `TC-AUTH-01-03` | Implemented |
| AUTH-02       | Authentication             | Sign in with email/password and receive JWT  | SRS 6 (`AUTH-02`)  | `backend/src/routes/auth.ts` (`/auth/login`) + `frontend/utils/auth/*`                                          | `TC-AUTH-02-01`, `TC-AUTH-02-02`                  | Implemented |
| AUTH-03       | Authentication             | Sign in with Google                          | SRS 6 (`AUTH-03`)  | `backend/src/routes/auth.ts` (`/auth/google`) + signin UI                                                       | `TC-AUTH-03-01`, `TC-AUTH-03-02`                  | Implemented |
| AUTH-04       | Authentication             | Protected-route session continuity           | SRS 6 (`AUTH-04`)  | `frontend/middleware.ts`, `frontend/utils/auth/middleware.ts`, `frontend/utils/auth/server.ts`                  | `TC-AUTH-04-01`, `TC-AUTH-04-02`                  | Implemented |
| PROF-01       | Profile Management         | Update display name, skin, avatar config     | SRS 6 (`PROF-01`)  | `backend/src/routes/profiles.ts`, `frontend/app/profile/*`                                                      | `TC-PROF-01-01`, `TC-PROF-01-02`                  | Implemented |
| PROF-02       | Profile Management         | Persist and restore last position            | SRS 6 (`PROF-02`)  | `backend/src/sockets/sockets.ts`, `backend/src/session.ts`, `backend/src/models/Profile.ts`                     | `TC-PROF-02-01`, `TC-PROF-02-02`                  | Implemented |
| RM-01         | Realm Management           | Create realm from template                   | SRS 6 (`RM-01`)    | `backend/src/routes/realms.ts`, `frontend/components/Modal/CreateRealmModal.tsx`                                | `TC-RM-01-01`, `TC-RM-01-02`                      | Implemented |
| RM-02         | Realm Management           | Edit realm metadata/privacy/share link       | SRS 6 (`RM-02`)    | `backend/src/routes/realms.ts`, realm settings UI                                                               | `TC-RM-02-01`, `TC-RM-02-02`                      | Implemented |
| RM-03         | Realm Management           | Delete realm safely                          | SRS 6 (`RM-03`)    | `backend/src/routes/realms.ts` (`DELETE /realms/:id`)                                                           | `TC-RM-03-01`, `TC-RM-03-02`                      | Implemented |
| RM-04         | Realm Management           | Join realm by share link with access checks  | SRS 6 (`RM-04`)    | `backend/src/sockets/sockets.ts` (`joinRealm`) + `frontend/app/play/[id]/page.tsx`                              | `TC-RM-04-01`, `TC-RM-04-02`                      | Implemented |
| RT-01         | Realtime Gameplay          | Realtime movement synchronization            | SRS 6 (`RT-01`)    | `backend/src/sockets/sockets.ts` (`movePlayer`) + `frontend/utils/pixi/*`                                       | `TC-RT-01-01`, `TC-RT-01-02`                      | Implemented |
| RT-02         | Realtime Gameplay          | Teleport across room/coordinates             | SRS 6 (`RT-02`)    | `backend/src/sockets/sockets.ts` (`teleport`) + play engine                                                     | `TC-RT-02-01`, `TC-RT-02-02`                      | Implemented |
| RT-03         | Realtime Gameplay          | Proximity updates for affected players       | SRS 6 (`RT-03`)    | `backend/src/session.ts`, `backend/src/sockets/sockets.ts` (`proximityUpdate`)                                  | `TC-RT-03-01`, `TC-RT-03-02`                      | Implemented |
| CHAT-01       | Chat & Communication       | In-room message send/receive                 | SRS 6 (`CHAT-01`)  | `backend/src/sockets/sockets.ts` (`sendMessage`, `receiveMessage`)                                              | `TC-CHAT-01-01`, `TC-CHAT-01-02`                  | Implemented |
| CHAT-02       | Chat & Communication       | Persistent channels and DMs                  | SRS 6 (`CHAT-02`)  | `backend/src/routes/chat.ts`, `backend/src/models/ChatChannel.ts`, `ChatMessage.ts`, `frontend/app/play/chat/*` | `TC-CHAT-02-01`, `TC-CHAT-02-02`, `TC-CHAT-02-03` | Implemented |
| CHAT-03       | Chat & Communication       | Lobby chat with bounded history              | SRS 6 (`CHAT-03`)  | `backend/src/sockets/sockets.ts` (`joinLobby`, `sendLobbyMessage`)                                              | `TC-CHAT-03-01`, `TC-CHAT-03-02`                  | Implemented |
| CALL-01       | Calling & Media            | Call request/accept/reject signaling         | SRS 6 (`CALL-01`)  | `backend/src/sockets/sockets.ts` (`callRequest`, `callResponse`) + frontend call panels                         | `TC-CALL-01-01`, `TC-CALL-01-02`                  | Implemented |
| EVT-01        | Events Management          | Create realm events                          | SRS 6 (`EVT-01`)   | `backend/src/routes/events.ts`, `backend/src/models/Event.ts`, `frontend/app/play/CalendarPanel.tsx`            | `TC-EVT-01-01`, `TC-EVT-01-02`                    | Implemented |
| EVT-02        | Events Management          | Edit/delete owned events                     | SRS 6 (`EVT-02`)   | `backend/src/routes/events.ts` (`PATCH`, `DELETE`)                                                              | `TC-EVT-02-01`, `TC-EVT-02-02`                    | Implemented |
| RES-01        | Resources & Library        | Share and manage resources                   | SRS 6 (`RES-01`)   | `backend/src/routes/resources.ts`, `backend/src/models/Resource.ts`, `frontend/app/play/LibraryPanel.tsx`       | `TC-RES-01-01`, `TC-RES-01-02`                    | Implemented |
| FORUM-01      | Forum                      | Create threads and posts                     | SRS 6 (`FORUM-01`) | `backend/src/routes/forum.ts`, `backend/src/models/Thread.ts`, `backend/src/models/Post.ts`                     | `TC-FORUM-01-01`, `TC-FORUM-01-02`                | Implemented |
| FORUM-02      | Forum                      | Edit/remove forum content with authorization | SRS 6 (`FORUM-02`) | `backend/src/routes/forum.ts` (ownership checks)                                                                | `TC-FORUM-02-01`, `TC-FORUM-02-02`                | Implemented |
| ADM-01        | Admin                      | Admin-only moderation and dashboard routes   | SRS 6 (`ADM-01`)   | `backend/src/routes/admin.ts`, `frontend/app/admin/*`                                                           | `TC-ADM-01-01`, `TC-ADM-01-02`                    | Implemented |
| SYS-01        | Stability & Error Handling | Structured error handling and user feedback  | SRS 6 (`SYS-01`)   | `backend/src/index.ts` (global error handler) + frontend notifications/modals                                   | `TC-SYS-01-01`, `TC-SYS-01-02`                    | Implemented |
| SYS-02        | Stability & Error Handling | Schema validation for REST/socket payloads   | SRS 6 (`SYS-02`)   | `backend/src/routes/*` validators + `backend/src/sockets/socket-types.ts` / zod                                 | `TC-SYS-02-01`, `TC-SYS-02-02`                    | Implemented |

---

## 3. Coverage Summary

- Total User Stories tracked: `24`
- Covered in SRS with same IDs: `24/24`
- Covered in RTM implementation mapping: `24/24`
- Status baseline: `Implemented` (pending formal QA execution logs)

---

## 4. Governance Rules

- Do not add parallel ID systems (`REQ-xx`, `FR-xx`) for the same requirement set.
- New requirement must be created in `doc/User_Story.md` first, then mirrored to SRS and RTM.
- Test case IDs must start with `TC-<UserStoryID>-*` for unambiguous traceability.
