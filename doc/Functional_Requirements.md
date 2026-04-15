# Functional Requirements - The Gathering

Nguon tham chieu: `doc/SRS.md` (Section 6 - Functional Requirements).

## Danh sach FR (Canonical IDs)

| User Story ID | Functional Requirement Summary                                                  | Priority | Complexity |
| :------------ | :------------------------------------------------------------------------------ | :------: | :--------: |
| AUTH-01       | Register account with email and OTP verification.                               |    P0    |     M      |
| AUTH-02       | Sign in using email/password and establish JWT session.                         |    P0    |     M      |
| AUTH-03       | Sign in with Google credential flow.                                            |    P1    |     M      |
| AUTH-04       | Enforce protected-route session continuity via middleware and token validation. |    P0    |     M      |
| PROF-01       | Update user profile fields (displayName, skin, avatarConfig, bio).              |    P1    |     S      |
| PROF-02       | Persist and restore per-realm last player position.                             |    P1    |     M      |
| RM-01         | Create realm with template-backed map initialization.                           |    P0    |     M      |
| RM-02         | Update realm metadata (name, privacy, share link, map data).                    |    P0    |     M      |
| RM-03         | Delete realm and related dependent data safely.                                 |    P1    |     M      |
| RM-04         | Join realm through validated `shareId` and access constraints.                  |    P0    |     M      |
| RT-01         | Realtime avatar movement synchronization over Socket.IO.                        |    P0    |     L      |
| RT-02         | Realtime teleport handling across rooms and coordinates.                        |    P1    |     M      |
| RT-03         | Proximity recalculation and `proximityUpdate` broadcast for affected users.     |    P0    |     L      |
| CHAT-01       | Send in-world room messages with validation and normalization.                  |    P0    |     M      |
| CHAT-02       | Persistent channel/DM chat with membership rules and stored history.            |    P0    |     L      |
| CHAT-03       | Lobby chat with bounded history and realtime broadcast.                         |    P1    |     S      |
| CALL-01       | Call request/accept/reject signaling for nearby users and group context.        |    P0    |     L      |
| EVT-01        | Create realm-linked events with validated payloads.                             |    P1    |     M      |
| EVT-02        | Update and delete events with ownership authorization.                          |    P1    |     M      |
| RES-01        | Create/list/delete realm resources with filtering/search support.               |    P1    |     M      |
| FORUM-01      | Create/list threads and posts in realm forum context.                           |    P1    |     M      |
| FORUM-02      | Edit/remove forum content with authorization checks.                            |    P1    |     M      |
| ADM-01        | Restrict and expose admin management routes for role=admin users.               |    P1    |     L      |
| SYS-01        | Standardized user-facing and API-level error handling.                          |    P0    |     S      |
| SYS-02        | Schema validation for REST/socket payloads to protect state integrity.          |    P0    |     M      |

## Ghi chu traceability

- Khong tao he ID song song nhu `FR-xx` hoac `REQ-xx`.
- Tat ca FR phai map truc tiep sang `User_Story.md`, `SRS.md`, `RTM.md`.
