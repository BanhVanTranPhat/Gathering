# USE CASE DESCRIPTIONS

**Project:** The Gathering — Virtual Co-Working Platform
**Document Type:** Software Requirements Specification — Use Case Description
**Version:** 1.0
**Date:** 2026-03-11

---

## TABLE OF CONTENTS

| Use Case ID | Use Case Name                                |
| :---------- | :------------------------------------------- |
| UC-01       | Register Account via OTP                     |
| UC-02       | Register Account via Email and Password      |
| UC-03       | Log In with Email and Password               |
| UC-04       | Log In with Google OAuth                     |
| UC-05       | Manage User Profile                          |
| UC-06       | Create a Realm                               |
| UC-07       | Manage Realm Settings                        |
| UC-08       | Delete a Realm                               |
| UC-09       | Join a Realm                                 |
| UC-10       | Move Avatar in Realm                         |
| UC-11       | Teleport Between Rooms                       |
| UC-12       | Send Proximity Chat Message                  |
| UC-13       | Initiate and Respond to Video Call           |
| UC-14       | Manage Persistent Chat Channels and Messages |
| UC-15       | Manage Events and RSVP                       |
| UC-16       | Manage Forum Threads and Posts               |
| UC-17       | Upload and Browse Resource Library           |
| UC-18       | Edit Realm Map                               |
| UC-19       | Admin: Manage Users                          |
| UC-20       | Admin: View Analytics Dashboard              |

---

## ACTORS

| Actor                          | Type      | Description                                                                                                                                                        |
| :----------------------------- | :-------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Guest**                      | Primary   | An unauthenticated user who accesses the landing page but has not yet registered or logged in.                                                                     |
| **Registered User**            | Primary   | An authenticated user who has completed registration and holds a valid JWT. May create and join realms, chat, attend events, etc.                                  |
| **Realm Owner**                | Primary   | A Registered User who has created a specific realm. Inherits all Registered User privileges and additionally controls that realm's settings, members, and content. |
| **Admin**                      | Primary   | A Registered User with the `role = "admin"` field in the database. Has full system-level access to user management and analytics.                                  |
| **Email Service (Nodemailer)** | Secondary | An external SMTP service via Gmail that delivers OTP verification codes.                                                                                           |
| **Google OAuth Service**       | Secondary | Google's identity platform providing ID tokens for social login.                                                                                                   |
| **System**                     | Secondary | The backend application server including Express REST API, Socket.io server, MongoDB database, and JWT middleware.                                                 |

---

## IDENTIFIED USE CASES FROM CODE

The following use cases were derived by analyzing:

- `backend/src/routes/auth.ts` — OTP flow, email/password auth, Google OAuth
- `backend/src/routes/profiles.ts` — Profile CRUD
- `backend/src/routes/realms.ts` — Realm lifecycle management
- `backend/src/sockets/sockets.ts` — Real-time interactions: join, move, teleport, proximity chat, video call signaling, skin change
- `backend/src/routes/chat.ts` — Persistent chat channels and DM
- `backend/src/routes/events.ts` — Event calendar with RSVP
- `backend/src/routes/forum.ts` — Forum threads and posts
- `backend/src/routes/resources.ts` — Resource library
- `backend/src/routes/admin.ts` — Admin user management and analytics
- `frontend/app/editor/` — Map editor
- `frontend/app/play/` — In-realm gameplay panels

---

## USE CASE DESCRIPTIONS

---

### UC-01: Register Account via OTP

| Field             | Detail                                                                                                                                                                                                                                                         |
| :---------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use Case ID**   | UC-01                                                                                                                                                                                                                                                          |
| **Use Case Name** | Register Account via OTP                                                                                                                                                                                                                                       |
| **Actor**         | Guest, Email Service (Nodemailer), System                                                                                                                                                                                                                      |
| **Description**   | A new user registers for The Gathering by providing their email address. The system sends a 6-digit one-time password (OTP) to that email. The user submits the OTP to verify their email and create an account. A JWT is issued upon successful verification. |

**Pre-Conditions:**

- The user has not previously created an account with the supplied email address.
- The system's SMTP credentials (`EMAIL_USER`, `EMAIL_PASS`) are configured in the environment.
- The `JWT_SECRET` environment variable is set.

**Post-Conditions:**

- A new `User` document is created in MongoDB with `emailVerified: true`.
- A JWT token (valid for 7 days) is returned to the client.
- The user is redirected to the authenticated portion of the application.

**Basic Flow:**

1. The Guest navigates to the registration/sign-in page.
2. The Guest enters a valid email address and submits the OTP request form.
3. The System validates the email format against the pattern `^[^\s@]+@[^\s@]+\.[^\s@]+$`.
4. The System generates a cryptographically random 6-digit OTP and stores it in server memory with a 10-minute expiry (`otpStore` map).
5. The System invokes the Email Service to send the OTP to the provided email address.
6. The Email Service delivers the OTP email (subject: "Mã xác thực - The Gathering") to the user's inbox.
7. The user retrieves the OTP from their email and enters it in the verification form.
8. The System looks up the OTP in `otpStore`, verifies the code is not expired, and checks for exact match.
9. The System deletes the OTP from `otpStore` (one-time use).
10. The System creates a new `User` document in MongoDB with the provided email and `displayName` (defaulting to the email prefix if none supplied).
11. The System signs a JWT payload (`userId`, `email`, `displayName`, `role: "user"`) with 7-day expiry and returns it along with the user object.
12. The client stores the JWT and the user is authenticated.

**Alternative Flow:**

_AF-01-A: Returning user enters email_

- At Step 3, the System detects a user already exists for this email (via `User.findOne`).
- The System still sends the OTP and returns `{ isNewUser: false }` in the response.
- At Step 10, instead of creating a new user, the System retrieves the existing user.
- The System issues a new JWT for the returning user. (Effectively a passwordless login.)

_AF-01-B: Email service unavailable_

- At Step 6, if the transporter fails to deliver the email, the System logs the error to console.
- In development mode (no `EMAIL_USER` env var), the OTP is printed to the server console (`[DEV] OTP for ...`).
- The flow continues normally; the user must obtain the code from an alternative channel during development.

**Exception Flow:**

| ID      | Trigger                                             | System Response                                                        |
| :------ | :-------------------------------------------------- | :--------------------------------------------------------------------- |
| EX-01-1 | Email field is empty or missing                     | System returns HTTP 400: `"Email is required"`                         |
| EX-01-2 | Email format fails regex validation                 | System returns HTTP 400: `"Invalid email format"`                      |
| EX-01-3 | OTP limiter exceeded (> 3 requests/minute)          | System returns HTTP 429: `"Too many OTP requests, please wait"`        |
| EX-01-4 | User submits OTP but no OTP was sent for that email | System returns HTTP 400: `"Chưa gửi mã xác thực cho email này"`        |
| EX-01-5 | OTP has expired (> 10 minutes since issuance)       | System returns HTTP 400: `"Mã xác thực đã hết hạn. Vui lòng gửi lại."` |
| EX-01-6 | OTP code does not match stored code                 | System returns HTTP 400: `"Mã xác thực không đúng"`                    |

**Business Rules:**

- BR-01-1: OTP codes are 6 digits, generated from the range [100000, 999999].
- BR-01-2: OTP lifetime is strictly 10 minutes from time of issuance.
- BR-01-3: Each OTP is single-use; it is deleted from `otpStore` upon any successful verification.
- BR-01-4: OTP requests are rate-limited to 3 requests per minute per IP.
- BR-01-5: Auth operations are globally rate-limited to 20 requests per 15-minute window.
- BR-01-6: Email addresses are normalized to lowercase before storage and comparison.

**Non-Functional Requirements:**

- NFR-01-1 (Performance): OTP email should be sent within 5 seconds of request under normal load.
- NFR-01-2 (Security): OTP codes must not be stored in HTTP responses or logs in production.
- NFR-01-3 (Security): JWT tokens must be signed with a server-side secret and must not be decodable without it.
- NFR-01-4 (Usability): The OTP email HTML template must be readable on mobile email clients.

---

### UC-02: Register Account via Email and Password

| Field             | Detail                                                                                                                                                                                           |
| :---------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use Case ID**   | UC-02                                                                                                                                                                                            |
| **Use Case Name** | Register Account via Email and Password                                                                                                                                                          |
| **Actor**         | Guest, System                                                                                                                                                                                    |
| **Description**   | A new user registers by providing an email, a password, and an optional display name. The system validates inputs, hashes the password using bcrypt, creates the user record, and returns a JWT. |

**Pre-Conditions:**

- No account exists for the provided email address.
- The `JWT_SECRET` environment variable is set.

**Post-Conditions:**

- A new `User` document exists in MongoDB with a bcrypt-hashed password.
- A JWT (7-day validity) is returned with HTTP 201.

**Basic Flow:**

1. Guest submits the registration form with `email`, `password`, and optionally `displayName`.
2. System validates that both `email` and `password` fields are present.
3. System validates email format.
4. System validates password length: must be between 6 and 128 characters.
5. System checks MongoDB for a duplicate email using `User.findOne`.
6. System calls `hashPassword()` to bcrypt-hash the password.
7. System creates a new `User` document with normalized email, hashed password, and display name.
8. System signs a JWT and returns HTTP 201 with `{ token, user }`.

**Alternative Flow:** None.

**Exception Flow:**

| ID      | Trigger                         | System Response                                 |
| :------ | :------------------------------ | :---------------------------------------------- |
| EX-02-1 | Email or password field missing | HTTP 400: `"Email and password required"`       |
| EX-02-2 | Email fails format validation   | HTTP 400: `"Invalid email format"`              |
| EX-02-3 | Password length < 6 or > 128    | HTTP 400: `"Password must be 6-128 characters"` |
| EX-02-4 | Email already registered        | HTTP 400: `"Email already registered"`          |

**Business Rules:**

- BR-02-1: Passwords must be stored as bcrypt hashes only; plaintext is never persisted.
- BR-02-2: `displayName` defaults to the email prefix (before `@`) if not provided.
- BR-02-3: Email addresses are lowercased and trimmed before storage.

**Non-Functional Requirements:**

- NFR-02-1 (Security): bcrypt work factor must be sufficient to resist brute-force attacks (minimum cost factor 10).
- NFR-02-2 (Performance): Registration endpoint must respond within 3 seconds under normal load.

---

### UC-03: Log In with Email and Password

| Field             | Detail                                                                                                                    |
| :---------------- | :------------------------------------------------------------------------------------------------------------------------ |
| **Use Case ID**   | UC-03                                                                                                                     |
| **Use Case Name** | Log In with Email and Password                                                                                            |
| **Actor**         | Registered User, System                                                                                                   |
| **Description**   | A registered user authenticates by submitting their email and password. The system verifies credentials and issues a JWT. |

**Pre-Conditions:**

- A `User` document with the supplied email exists and has a non-null `password` field.
- The user's account was created via UC-02 (not Google OAuth only).

**Post-Conditions:**

- A new JWT (7-day validity) is issued and returned to the client.
- The client stores the JWT for subsequent authenticated requests.

**Basic Flow:**

1. User submits `email` and `password`.
2. System normalizes email to lowercase and looks up the `User` record.
3. System invokes `comparePassword()` (bcrypt comparison) to verify the submitted password.
4. System signs and returns a JWT with `{ userId, email, displayName, role }`.

**Alternative Flow:** None.

**Exception Flow:**

| ID      | Trigger                                     | System Response                                                      |
| :------ | :------------------------------------------ | :------------------------------------------------------------------- |
| EX-03-1 | Email or password field missing             | HTTP 400: `"Email and password required"`                            |
| EX-03-2 | No account found for the email              | HTTP 401: `"Email chưa đăng ký hoặc sai mật khẩu"`                   |
| EX-03-3 | Account registered via Google (no password) | HTTP 401: `"Tài khoản đăng nhập bằng Google. Vui lòng dùng Google."` |
| EX-03-4 | Password does not match stored hash         | HTTP 401: `"Email chưa đăng ký hoặc sai mật khẩu"`                   |
| EX-03-5 | Auth rate limiter exceeded (> 20/15 min)    | HTTP 429: `"Too many requests, please try again later"`              |

**Business Rules:**

- BR-03-1: The same error message is used for "email not found" and "wrong password" to prevent email enumeration attacks.
- BR-03-2: Tokens issued at login have a 7-day lifetime; the system does not support refresh tokens.

**Non-Functional Requirements:**

- NFR-03-1 (Security): Password comparison must be done in constant time (bcrypt) to prevent timing attacks.
- NFR-03-2 (Performance): Login response must complete within 2 seconds under normal load.

---

### UC-04: Log In with Google OAuth

| Field             | Detail                                                                                                                                              |
| :---------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use Case ID**   | UC-04                                                                                                                                               |
| **Use Case Name** | Log In with Google OAuth                                                                                                                            |
| **Actor**         | Guest / Registered User, Google OAuth Service, System                                                                                               |
| **Description**   | A user authenticates using their Google account. The system decodes the Google ID token, resolves or creates a local user record, and issues a JWT. |

**Pre-Conditions:**

- The client has obtained a valid Google credential (ID token) from Google's OAuth flow.
- The `JWT_SECRET` environment variable is set.

**Post-Conditions:**

- A `User` document in MongoDB is linked to the Google ID (`googleId` field).
- A JWT is returned to the client.

**Basic Flow:**

1. Client sends a POST request to `/auth/google` with the Google `credential` (ID token) in the request body.
2. System splits the JWT-format credential and base64-decodes the payload to extract `sub` (googleId), `email`, `name`, and `picture`.
3. System searches for an existing user by `googleId`.
4. If a user is found, the System optionally updates the stored `avatar` field and issues a JWT.
5. System returns `{ token, user }`.

**Alternative Flow:**

_AF-04-A: First-time Google login, email already exists_

- At Step 3, no user found by `googleId` but `User.findOne({ email })` returns an existing record (registered via UC-02).
- System links `googleId` to the existing user and updates `avatar` if provided.
- System issues a JWT for the linked account.

_AF-04-B: First-time Google login, brand new account_

- At Step 3, no user found by `googleId` or `email`.
- System creates a new `User` document with `{ email, googleId, displayName, avatar }`.
- System issues a JWT.

**Exception Flow:**

| ID      | Trigger                                      | System Response                                |
| :------ | :------------------------------------------- | :--------------------------------------------- |
| EX-04-1 | Request body lacks `credential`              | HTTP 400: `"Google ID and email are required"` |
| EX-04-2 | `credential` is malformed (not a 3-part JWT) | HTTP 400: `"Invalid credential"`               |
| EX-04-3 | Base64 decode of payload fails               | HTTP 400: `"Invalid Google credential"`        |

**Business Rules:**

- BR-04-1: The system does not validate the Google ID token signature server-side (relies on client-side Google SDK); token decoding is for data extraction only.
- BR-04-2: Users authenticated via Google never have a `password` field and cannot use UC-03.

**Non-Functional Requirements:**

- NFR-04-1 (Security): In production, Google tokens should be verified against Google's public keys or using the Google Auth Library to prevent token forgery.
- NFR-04-2 (Privacy): Google avatar URLs are stored in the database only with user consent.

---

### UC-05: Manage User Profile

| Field             | Detail                                                                                                                                                                                                                             |
| :---------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use Case ID**   | UC-05                                                                                                                                                                                                                              |
| **Use Case Name** | Manage User Profile                                                                                                                                                                                                                |
| **Actor**         | Registered User, System                                                                                                                                                                                                            |
| **Description**   | A registered user views their profile information (display name, bio, avatar, and in-game skin configuration) and modifies any of these fields. Changes persist to MongoDB and are reflected the next time the user joins a realm. |

**Pre-Conditions:**

- The user holds a valid JWT (authenticated).
- A `Profile` document may or may not yet exist (the system auto-creates on first GET).

**Post-Conditions:**

- The `Profile` document in MongoDB is updated with the new field values.
- The updated profile is returned to the client.

**Basic Flow:**

1. User navigates to the profile management page.
2. System performs GET `/profiles/me` with the Authorization header.
3. System verifies the JWT and extracts `userId`.
4. System queries `Profile.findOne({ id: userId })`. If no profile exists, a new one is created with default values.
5. The profile data is returned and rendered in the profile editor form.
6. User modifies one or more fields: `displayName`, `bio`, `avatar`, `skin`, or `avatarConfig`.
7. User submits the changes.
8. System performs PATCH `/profiles/me` and applies only the allowed fields from the allowlist (`['displayName', 'bio', 'avatar', 'skin', 'avatarConfig']`).
9. System enforces character limits: `displayName` ≤ 100 characters, `bio` ≤ 500 characters.
10. System upserts the `Profile` document and returns the updated record.

**Alternative Flow:**

_AF-05-A: User changes in-game avatar skin_

- At Step 6, user opens the avatar/skin customizer panel.
- The `skin` field and/or the `avatarConfig` object (containing sprite configuration) are modified.
- These changes are submitted via PATCH and persisted.
- The next time the user joins a realm, the new skin is loaded from the profile.

**Exception Flow:**

| ID      | Trigger                                   | System Response                                           |
| :------ | :---------------------------------------- | :-------------------------------------------------------- |
| EX-05-1 | Missing or invalid JWT                    | HTTP 401: `"Unauthorized"`                                |
| EX-05-2 | Attempt to update a non-allowlisted field | System silently ignores that field; no error is returned. |

**Business Rules:**

- BR-05-1: Profile updates are restricted to the allowlist; no other User or Profile fields can be modified through this endpoint.
- BR-05-2: `displayName` must not exceed 100 characters.
- BR-05-3: `bio` must not exceed 500 characters.

**Non-Functional Requirements:**

- NFR-05-1 (Usability): Profile changes should take effect in the user's next session within the realm.
- NFR-05-2 (Data Integrity): The `upsert: true` option must be used to ensure the profile is always created if missing.

---

### UC-06: Create a Realm

| Field             | Detail                                                                                                                                                                                                                      |
| :---------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use Case ID**   | UC-06                                                                                                                                                                                                                       |
| **Use Case Name** | Create a Realm                                                                                                                                                                                                              |
| **Actor**         | Registered User (becomes Realm Owner), System                                                                                                                                                                               |
| **Description**   | A registered user creates a new virtual workspace (realm). The system assigns a UUID-based internal ID, a short 8-character share link code, and the chosen or default map template. The creator becomes the realm's owner. |

**Pre-Conditions:**

- The user is authenticated with a valid JWT.

**Post-Conditions:**

- A new `Realm` document is persisted in MongoDB with an auto-generated `id` (UUID v4), `share_id` (first 8 chars of a UUID v4), and `only_owner: false`.
- The caller's `userId` is recorded as `owner_id`.
- HTTP 201 is returned with the new realm's metadata.

**Basic Flow:**

1. User navigates to the realm management dashboard.
2. User clicks "Create New Space" and fills in the realm name and optionally selects a map template (default: `"office"`).
3. Client sends POST `/realms` with `{ name, mapTemplate }` and a valid Authorization header.
4. System verifies the JWT.
5. System creates the realm document:
   - `id`: UUID v4
   - `owner_id`: user's JWT subject
   - `name`: provided name or `"New Space"` default
   - `mapTemplate`: provided or `"office"`
   - `share_id`: first 8 characters of a new UUID v4
   - `only_owner`: `false`
6. System returns HTTP 201 with `{ id, name, share_id, owner_id, mapTemplate }`.

**Alternative Flow:** None defined.

**Exception Flow:**

| ID      | Trigger                | System Response            |
| :------ | :--------------------- | :------------------------- |
| EX-06-1 | Missing or invalid JWT | HTTP 401: `"Unauthorized"` |

**Business Rules:**

- BR-06-1: A user may own an unlimited number of realms.
- BR-06-2: The `share_id` is used as the public join link token, not the internal UUID.
- BR-06-3: All realms default to publicly accessible (`only_owner: false`) at creation.

**Non-Functional Requirements:**

- NFR-06-1 (Performance): Realm creation must complete in under 2 seconds.
- NFR-06-2 (Scalability): The system must support up to 30 concurrent players per realm session.

---

### UC-07: Manage Realm Settings

| Field             | Detail                                                                                                                                                              |
| :---------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Use Case ID**   | UC-07                                                                                                                                                               |
| **Use Case Name** | Manage Realm Settings                                                                                                                                               |
| **Actor**         | Realm Owner, System                                                                                                                                                 |
| **Description**   | The owner of a realm can update the realm's name, regenerate the share link, toggle privacy mode (restricting access to only the owner), and save map data changes. |

**Pre-Conditions:**

- The requesting user is authenticated.
- The identified realm exists and the requesting user is the `owner_id` of that realm.

**Post-Conditions:**

- The `Realm` document in MongoDB is updated with the new values.
- The updated realm document is returned.

**Basic Flow:**

1. Realm Owner navigates to the realm settings panel.
2. Owner modifies one or more of: `name`, `share_id`, `only_owner` (toggle privacy), or `map_data`.
3. Client sends PATCH `/realms/:id` with the changed fields.
4. System verifies the JWT and resolves the realm by ID (supporting both MongoDB ObjectId and UUID formats).
5. System checks that `realm.owner_id === requesting user.id`; proceeds only if true.
6. System applies updates: any non-undefined field in the request body is written to the document.
7. System saves and returns the updated realm.

**Alternative Flow:**

_AF-07-A: Lock realm to owner only_

- At Step 2, Owner toggles the "Private Mode" switch to `true`.
- `only_owner` is set to `true`.
- Subsequent join attempts by non-owners via `joinRealm` socket event will be rejected with `"This realm is private right now. Come back later!"`.

_AF-07-B: Regenerate share link_

- At Step 2, Owner requests a new share code.
- A new `share_id` is generated client-side or server-side and patched.
- Any previously distributed links using the old `share_id` are now invalid.

**Exception Flow:**

| ID      | Trigger                                   | System Response            |
| :------ | :---------------------------------------- | :------------------------- |
| EX-07-1 | Missing or invalid JWT                    | HTTP 401: `"Unauthorized"` |
| EX-07-2 | Realm not found, or user is not the owner | HTTP 404: `"Not found"`    |

**Business Rules:**

- BR-07-1: Only the realm owner may modify realm settings.
- BR-07-2: Non-owner users receive a 404 (not 403) when attempting to patch another user's realm, to prevent ownership enumeration.

**Non-Functional Requirements:**

- NFR-07-1 (Availability): Settings changes must persist immediately and be reflected in the next user's join attempt.

---

### UC-08: Delete a Realm

| Field             | Detail                                                                                                                                                                                                            |
| :---------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use Case ID**   | UC-08                                                                                                                                                                                                             |
| **Use Case Name** | Delete a Realm                                                                                                                                                                                                    |
| **Actor**         | Realm Owner, System                                                                                                                                                                                               |
| **Description**   | The owner permanently deletes a realm. All associated data is cascade-deleted atomically, including events, resources, forum threads, posts, chat channels, chat messages, and member profile visitation records. |

**Pre-Conditions:**

- The requesting user is authenticated.
- The realm exists and the requesting user is the `owner_id`.

**Post-Conditions:**

- The `Realm` document is deleted from MongoDB.
- All cascaded records are deleted:
  - `Event` documents with this `realmId`
  - `Resource` documents with this `realmId`
  - `Thread` documents and their child `Post` documents
  - `ChatChannel` documents and their child `ChatMessage` documents
- `Profile.visited_realms` arrays are purged of the deleted realm's `share_id`.
- HTTP 204 is returned.

**Basic Flow:**

1. Realm Owner opens the realm settings and clicks "Delete Space".
2. Client sends DELETE `/realms/:id`.
3. System verifies JWT and confirms ownership.
4. System executes a `Promise.all` to delete all cascaded data atomically.
5. System removes the realm's `share_id` from all `Profile.visited_realms` arrays.
6. System deletes the `Realm` document itself.
7. System returns HTTP 204 No Content.

**Alternative Flow:** None.

**Exception Flow:**

| ID      | Trigger                              | System Response            |
| :------ | :----------------------------------- | :------------------------- |
| EX-08-1 | Missing or invalid JWT               | HTTP 401: `"Unauthorized"` |
| EX-08-2 | Realm not found or user is not owner | HTTP 404: `"Not found"`    |

**Business Rules:**

- BR-08-1: Deletion is irreversible. No soft-delete or trash mechanism is implemented.
- BR-08-2: Deletion must be atomic — all associated data must be removed in a single parallel operation.
- BR-08-3: The default chat channels (`general`, `social`) are automatically removed along with the realm.

**Non-Functional Requirements:**

- NFR-08-1 (Data Integrity): The cascade delete must complete fully or not at all; partial deletion must not leave orphaned records.
- NFR-08-2 (UX): The UI must present a confirmation dialog before initiating deletion.

---

### UC-09: Join a Realm

| Field             | Detail                                                                                                                                                                                                                                                             |
| :---------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use Case ID**   | UC-09                                                                                                                                                                                                                                                              |
| **Use Case Name** | Join a Realm                                                                                                                                                                                                                                                       |
| **Actor**         | Registered User, System                                                                                                                                                                                                                                            |
| **Description**   | A registered user joins a realm using a share link. The system authenticates the WebSocket connection, validates the share token, checks capacity, loads the realm map, and spawns the user's avatar at their last saved position or the map's default spawnpoint. |

**Pre-Conditions:**

- The user is authenticated and holds a valid JWT.
- The realm share link (`share_id`) is valid and refers to an existing realm.
- The realm has fewer than 30 concurrent players.
- The realm is either publicly accessible (`only_owner: false`) or the user is the owner.

**Post-Conditions:**

- The user's socket is registered in the session manager.
- The user's avatar appears in the realm at the resolved spawn position.
- All other players in the same room receive a `playerJoinedRoom` event.
- A session entry is created for this user in the in-memory session store.

**Basic Flow:**

1. User clicks a realm share link, which opens the play page (e.g., `/play/[realmId]`).
2. Client establishes a WebSocket connection, passing the JWT (`Authorization` header) and `uid` query parameter.
3. System's `protectConnection` middleware verifies the JWT and confirms `uid` matches the token subject.
4. Client emits a `joinRealm` socket event with `{ realmId, shareId }`.
5. System validates the event payload against the `JoinRealm` Zod schema.
6. System checks if the user is already joining (concurrency guard via `joiningInProgress` set).
7. System checks existing session player count; rejects if ≥ 30.
8. System fetches the `Realm` document and the user's `Profile`.
9. System checks access: if the user is the owner, access is granted unconditionally; if the realm is private (`only_owner: true`), access is denied; otherwise the `shareId` must match `realm.share_id`.
10. System creates or reuses the in-memory session for this `realmId`.
11. If the user already has an active session in another realm, that session is kicked with `"You have logged in from another location."`.
12. System adds the user's avatar to the session (username from profile, skin code, avatar configuration).
13. System resolves the spawn position: uses `profile.lastPositions[realmId]` if saved, otherwise uses `mapData.spawnpoint`.
14. System moves the avatar to the resolved position.
15. System emits `joinedRealm` to the connecting socket and `playerJoinedRoom` to all other players in the room.

**Alternative Flow:** None.

**Exception Flow:**

| ID      | Trigger                                | System Response                                                                        |
| :------ | :------------------------------------- | :------------------------------------------------------------------------------------- |
| EX-09-1 | Missing or invalid JWT / uid           | Socket connection rejected with `"Invalid access token or uid."`                       |
| EX-09-2 | Realm not found                        | Socket emits `failedToJoinRoom`: `"Space not found."`                                  |
| EX-09-3 | Profile not found                      | Socket emits `failedToJoinRoom`: `"Failed to get profile."`                            |
| EX-09-4 | Realm is at capacity (≥ 30 players)    | Socket emits `failedToJoinRoom`: `"Space is full. It's 30 players max."`               |
| EX-09-5 | Realm is private and user is not owner | Socket emits `failedToJoinRoom`: `"This realm is private right now. Come back later!"` |
| EX-09-6 | Share ID does not match (link changed) | Socket emits `failedToJoinRoom`: `"The share link has been changed."`                  |
| EX-09-7 | Concurrent duplicate join attempt      | Socket emits `failedToJoinRoom`: `"Already joining a space."`                          |

**Business Rules:**

- BR-09-1: Maximum concurrent players per realm is 30.
- BR-09-2: A user can be in only one realm session at a time; joining a second realm kicks the first session.
- BR-09-3: Position is persisted per-realm on disconnect and restored on the next join.

**Non-Functional Requirements:**

- NFR-09-1 (Performance): Join handshake must complete within 3 seconds of the `joinRealm` event.
- NFR-09-2 (Reliability): The session manager must handle concurrent join requests safely using the `joiningInProgress` guard.

---

### UC-10: Move Avatar in Realm

| Field             | Detail                                                                                                                                                                                                                                                                                             |
| :---------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use Case ID**   | UC-10                                                                                                                                                                                                                                                                                              |
| **Use Case Name** | Move Avatar in Realm                                                                                                                                                                                                                                                                               |
| **Actor**         | Registered User (in active realm session), System                                                                                                                                                                                                                                                  |
| **Description**   | While in a realm, the user presses directional keys or clicks to move their avatar. The client continuously sends movement events to the server, which validates the session and propagates the new position to all other players in the same room. Proximity zones are recalculated on each move. |

**Pre-Conditions:**

- The user has an active realm session (UC-09 completed successfully).
- The user's socket is connected and authenticated.

**Post-Conditions:**

- The player's position (`x`, `y`) is updated in the server-side session.
- All other players in the same room receive a `playerMoved` event with the new coordinates.
- Players whose proximity zone status has changed receive a `proximityUpdate` event with a new `proximityId`.

**Basic Flow:**

1. User presses a movement key or clicks a destination tile on the map.
2. Client emits a `movePlayer` event with `{ x: number, y: number }`.
3. System validates the payload against the `MovePlayer` Zod schema (`{ x: number, y: number }`).
4. System retrieves the player's current session via `sessionManager.getPlayerSession(uid)`.
5. System calls `session.movePlayer(uid, x, y)`, which updates the player's position and recalculates proximity groups.
6. System emits `playerMoved` to all other players in the same room: `{ uid, x, y }`.
7. For each player whose proximity group changed, System emits `proximityUpdate` to that player's socket: `{ proximityId }`.

**Alternative Flow:** None.

**Exception Flow:**

| ID      | Trigger                                        | System Response              |
| :------ | :--------------------------------------------- | :--------------------------- |
| EX-10-1 | Event payload fails Zod schema validation      | Event is silently discarded. |
| EX-10-2 | No active session found for the socket's `uid` | Event is silently discarded. |

**Business Rules:**

- BR-10-1: Position coordinates are not validated against the map boundaries server-side (client is trusted for movement within bounds).
- BR-10-2: Proximity zones are recalculated by the session service on every move event; zero extra socket roundtrip is required.

**Non-Functional Requirements:**

- NFR-10-1 (Performance): Move events must be processed and broadcast within 100 ms under normal conditions to ensure smooth real-time gameplay.
- NFR-10-2 (Scalability): The in-memory session architecture must support 30 concurrent players per realm without degradation.

---

### UC-11: Teleport Between Rooms

| Field             | Detail                                                                                                                                                                                                                                                  |
| :---------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Use Case ID**   | UC-11                                                                                                                                                                                                                                                   |
| **Use Case Name** | Teleport Between Rooms                                                                                                                                                                                                                                  |
| **Actor**         | Registered User (in active realm session), System                                                                                                                                                                                                       |
| **Description**   | A realm may contain multiple named rooms. When a player steps into a zone portal or uses the room selector, the system teleports them to the target room at the specified coordinates. Other players in the old and new rooms are notified accordingly. |

**Pre-Conditions:**

- The user has an active realm session.
- The target `roomIndex` is a valid room index within the realm's map data.

**Post-Conditions:**

- The player's `room` index, `x`, and `y` position are updated in the session.
- Players in the player's former room receive `playerLeftRoom` with the player's `uid`.
- Players in the player's new room receive `playerJoinedRoom` with the player's data.
- Proximity zones are recalculated for the new room.

**Basic Flow:**

1. Player walks into a zone portal or uses the room navigation UI.
2. Client emits a `teleport` event with `{ roomIndex: number, x: number, y: number }`.
3. System validates payload against the `Teleport` Zod schema.
4. System retrieves the player's session.
5. If `player.room !== data.roomIndex` (inter-room teleport):
   a. System emits `playerLeftRoom` to the current room.
   b. System calls `session.changeRoom(uid, roomIndex, x, y)` which updates the player's room and position and recalculates proximity groups.
   c. System emits `playerJoinedRoom` to the new room.
6. Proximity updates are sent to any players whose proximity group has changed.

**Alternative Flow:**

_AF-11-A: Intra-room teleport (same room, different position)_

- At Step 5, `player.room === data.roomIndex`.
- System calls `session.movePlayer(uid, x, y)` instead.
- System emits `playerTeleported` to other players: `{ uid, x, y }`.

**Exception Flow:**

| ID      | Trigger                      | System Response           |
| :------ | :--------------------------- | :------------------------ |
| EX-11-1 | Payload fails Zod validation | Event silently discarded. |
| EX-11-2 | No active session found      | Event silently discarded. |

**Business Rules:**

- BR-11-1: Room indices are zero-based integers corresponding to the realm's `mapData.rooms` array.
- BR-11-2: Last position per realm is persisted to the `Profile` on disconnect, including the final `room` index.

**Non-Functional Requirements:**

- NFR-11-1 (Performance): Teleport events must be processed and propagated within 150 ms.
- NFR-11-2 (UX): The transition animation between rooms must not block further input for more than 500 ms.

---

### UC-12: Send Proximity Chat Message

| Field             | Detail                                                                                                                                                                         |
| :---------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use Case ID**   | UC-12                                                                                                                                                                          |
| **Use Case Name** | Send Proximity Chat Message                                                                                                                                                    |
| **Actor**         | Registered User (in active realm session), System                                                                                                                              |
| **Description**   | Within a realm, players in proximity of one another can exchange ephemeral text messages visible only to players in the same room. Messages are not persisted to the database. |

**Pre-Conditions:**

- The user has an active realm session.
- The target recipients are in the same room as the sender.

**Post-Conditions:**

- All players in the sender's room (excluding the sender) receive a `receiveMessage` socket event with `{ uid, message }`.
- No database record is created.

**Basic Flow:**

1. User types a message in the in-realm chat input and presses Enter or Send.
2. Client emits a `sendMessage` event with the message string as the payload.
3. System validates the payload against the `NewMessage` Zod schema (`z.string()`).
4. System checks: `data.length > 300` or `data.trim() === ''` → discard silently.
5. System calls `removeExtraSpaces()` to sanitize whitespace.
6. System emits `receiveMessage` to all other players in the same room: `{ uid, message }`.

**Alternative Flow:** None.

**Exception Flow:**

| ID      | Trigger                             | System Response           |
| :------ | :---------------------------------- | :------------------------ |
| EX-12-1 | Message exceeds 300 characters      | Event silently discarded. |
| EX-12-2 | Message is blank or whitespace-only | Event silently discarded. |
| EX-12-3 | No active session found             | Event silently discarded. |

**Business Rules:**

- BR-12-1: Proximity chat messages are ephemeral — they are never persisted.
- BR-12-2: Message length is capped at 300 characters.
- BR-12-3: Messages are sanitized to remove excessive whitespace.

**Non-Functional Requirements:**

- NFR-12-1 (Performance): Message delivery latency must be under 150 ms for players in the same server session.
- NFR-12-2 (Privacy): Messages are visible only to players within the same room, not all realm participants.

---

### UC-13: Initiate and Respond to Video Call

| Field             | Detail                                                                                                                                                                                                                                   |
| :---------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use Case ID**   | UC-13                                                                                                                                                                                                                                    |
| **Use Case Name** | Initiate and Respond to Video Call                                                                                                                                                                                                       |
| **Actor**         | Registered User (Caller), Registered User (Callee), System                                                                                                                                                                               |
| **Description**   | Within a realm, a player initiates a video call with another player. The system signals the call via WebSocket. The callee may accept or reject. On acceptance, both parties receive a shared `proximityId` to connect via WebRTC/Jitsi. |

**Pre-Conditions:**

- Both caller and callee have active realm sessions.
- Both players are in the same realm (they may be in different rooms, but both are managed by the same socket server instance).

**Post-Conditions:**

_On Acceptance:_

- Both parties receive a `callAccepted` event with `{ proximityId, byUid, byUsername }`.
- The client uses the `proximityId` to establish a Jitsi video call room.

_On Rejection:_

- Caller receives a `callRejected` event with `{ byUid, byUsername }`.

**Basic Flow:**

1. Caller clicks a player's avatar or the call button to initiate a call.
2. Client emits `callRequest` with `{ targetUid: string }`.
3. System resolves the caller's and callee's sessions and player objects.
4. System emits `callRequest` to the callee's socket: `{ fromUid, fromUsername, proximityId }`.
5. Callee sees an incoming call prompt with the caller's name.
6. Callee chooses to accept or reject.
7. Client emits `callResponse` with `{ callerUid: string, accept: boolean }`.
8. System resolves both players.
9. If `accept === true`:
   a. System determines the shared `proximityId` (from caller or responder's current proximity zone).
   b. System emits `callAccepted` to both the caller's socket and the responder's socket.
10. If `accept === false`:
    a. System emits `callRejected` only to the caller's socket.

**Alternative Flow:** None.

**Exception Flow:**

| ID      | Trigger                                             | System Response           |
| :------ | :-------------------------------------------------- | :------------------------ |
| EX-13-1 | `callRequest` has no `targetUid`                    | Event silently discarded. |
| EX-13-2 | Caller or callee session not found                  | Event silently discarded. |
| EX-13-3 | Caller or callee player object not found in session | Event silently discarded. |

**Business Rules:**

- BR-13-1: A call request can only be sent to users currently present in the realm (active session).
- BR-13-2: The `proximityId` is used as the room name for the Jitsi call; both parties must join the matching room.
- BR-13-3: There is no call timeout mechanism; the callee's accept/reject prompt persists until acted upon.

**Non-Functional Requirements:**

- NFR-13-1 (Performance): Signaling latency (call request to reception) must be under 500 ms.
- NFR-13-2 (Privacy): Video streams are routed through Jitsi's infrastructure, not the game server.

---

### UC-14: Manage Persistent Chat Channels and Messages

| Field             | Detail                                                                                                                                                                                                                     |
| :---------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use Case ID**   | UC-14                                                                                                                                                                                                                      |
| **Use Case Name** | Manage Persistent Chat Channels and Messages                                                                                                                                                                               |
| **Actor**         | Registered User, Realm Owner, System                                                                                                                                                                                       |
| **Description**   | Within a realm, users can participate in persistent text channels (`#general`, `#social`, and custom channels) and send direct messages (DMs) to other realm members. All messages are persisted in MongoDB and paginated. |

**Pre-Conditions:**

- The user is authenticated with a valid JWT.
- A valid `realmId` is known.

**Post-Conditions:**

- Messages are stored in `ChatMessage` documents linked to their `channelId`.
- Channel and message records survive server restarts and user disconnects.

**Basic Flow (Browsing and sending messages):**

1. User opens the chat panel within the play view.
2. Client sends GET `/chat/channels/:realmId` to retrieve all channels.
3. System auto-creates `#general` and `#social` channels if none exist for this realm.
4. System returns all `channel`-type channels and all `dm`-type channels where the user is a member.
5. User selects a channel.
6. Client sends GET `/chat/messages/:channelId?page=1` to load message history.
7. System returns messages sorted by timestamp (oldest first) with pagination.
8. User types a message and submits.
9. Client emits the message (via WebSocket or REST depending on implementation).
10. Message is stored in `ChatMessage` with `{ channelId, senderId, content, timestamp }`.

**Alternative Flow:**

_AF-14-A: Create a custom channel_

- User opens the channel creation form and enters a channel name (max 30 chars).
- Client sends POST `/chat/channels` with `{ realmId, name, type: "channel" }`.
- System creates the channel and returns it.

_AF-14-B: Open or create a DM_

- User selects another realm member and opens a DM.
- Client sends POST `/chat/channels` with `{ realmId, name, type: "dm", members: [uid1, uid2] }`.
- System checks for an existing DM channel between these two members; if found, returns it without creating a duplicate.
- If no existing DM, a new one is created.

**Exception Flow:**

| ID      | Trigger                                                     | System Response                              |
| :------ | :---------------------------------------------------------- | :------------------------------------------- |
| EX-14-1 | Missing or invalid JWT                                      | HTTP 401: `"Unauthorized"`                   |
| EX-14-2 | Channel not found                                           | HTTP 404: `"Channel not found"`              |
| EX-14-3 | User attempts to read a DM channel they are not a member of | HTTP 403: `"Not a member of this channel"`   |
| EX-14-4 | DM creation with ≠ 2 members                                | HTTP 400: `"DM requires exactly 2 members"`  |
| EX-14-5 | Attempt to delete a default channel                         | HTTP 400: `"Cannot delete default channels"` |
| EX-14-6 | Non-creator attempts to delete a channel                    | HTTP 403: `"Not owner"`                      |

**Business Rules:**

- BR-14-1: `#general` and `#social` channels are auto-created on first channel list request and cannot be deleted.
- BR-14-2: DM channels are deduplicated — exactly one DM channel may exist per user pair per realm.
- BR-14-3: Channel names are limited to 30 characters.
- BR-14-4: Messages are paginated with a maximum of 100 messages per page.

**Non-Functional Requirements:**

- NFR-14-1 (Persistence): All chat messages must survive server restarts.
- NFR-14-2 (Performance): Message history must be returned within 2 seconds.

---

### UC-15: Manage Events and RSVP

| Field             | Detail                                                                                                                                                                                                                                                              |
| :---------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Use Case ID**   | UC-15                                                                                                                                                                                                                                                               |
| **Use Case Name** | Manage Events and RSVP                                                                                                                                                                                                                                              |
| **Actor**         | Registered User, Realm Owner, System                                                                                                                                                                                                                                |
| **Description**   | Realm members can create structured calendar events with title, description, time window, location, and optional capacity. Other members browse and RSVP to events with status `going`, `maybe`, or `not_going`. The event creator can edit or delete their events. |

**Pre-Conditions:**

- The user is authenticated with a valid JWT.
- A valid `realmId` is associated with the event.

**Post-Conditions:**

- Event documents are persisted in MongoDB.
- The creator is automatically added as an attendee with status `going`.
- RSVPs update the `attendees` array within the event document.

**Basic Flow (Create Event):**

1. User opens the Calendar panel within the play view.
2. User clicks "Add Event" and fills in: `title` (max 200 chars), `description` (max 2000 chars), `startTime`, `endTime`, optional `location`, optional `maxParticipants`.
3. Client sends POST `/events` with the event data and Authorization header.
4. System validates required fields (`realmId`, `title`, `startTime`, `endTime`).
5. System validates date format and checks that `endTime > startTime`.
6. System creates the `Event` document, automatically adding the creator as an attendee with status `going`.
7. System returns HTTP 201 with the event object.

**Basic Flow (RSVP):**

1. User browses listed events in the calendar panel.
2. User clicks "Going", "Maybe", or "Not Going" on an event.
3. Client sends POST `/events/:id/rsvp` with `{ status, username }`.
4. System validates the status value.
5. If the user already has an entry in `attendees`, the existing status is updated.
6. If the user is new to the attendee list:
   a. If the event has a `maxParticipants` and the "going" count is already at capacity, the RSVP is rejected.
   b. Otherwise, the user is added to the `attendees` array.
7. System returns the updated event.

**Alternative Flow:**

_AF-15-A: Monthly calendar filter_

- User selects a month/year in the calendar.
- Client sends GET `/events?realmId=...&month=MM&year=YYYY`.
- System filters events whose `startTime` falls within the selected month.

**Exception Flow:**

| ID      | Trigger                                      | System Response                                           |
| :------ | :------------------------------------------- | :-------------------------------------------------------- |
| EX-15-1 | Missing or invalid JWT                       | HTTP 401: `"Unauthorized"`                                |
| EX-15-2 | Missing required fields                      | HTTP 400: `"realmId, title, startTime, endTime required"` |
| EX-15-3 | Invalid date string                          | HTTP 400: `"Invalid date format"`                         |
| EX-15-4 | `endTime` ≤ `startTime`                      | HTTP 400: `"End time must be after start time"`           |
| EX-15-5 | Invalid RSVP status value                    | HTTP 400: `"status must be going, maybe, or not_going"`   |
| EX-15-6 | Event at max capacity and user RSVPs `going` | HTTP 400: `"Event is full"`                               |
| EX-15-7 | Non-creator attempts to edit/delete event    | HTTP 403: `"Forbidden"`                                   |
| EX-15-8 | Event not found                              | HTTP 404: `"Not found"`                                   |

**Business Rules:**

- BR-15-1: `title` is limited to 200 characters; `description` is limited to 2000 characters.
- BR-15-2: `endTime` must be strictly after `startTime`.
- BR-15-3: The event creator is automatically added as an attendee with status `going` upon creation.
- BR-15-4: Only the creator may edit or delete an event.
- BR-15-5: Events are returned sorted by `startTime` ascending.

**Non-Functional Requirements:**

- NFR-15-1 (Usability): The calendar panel must display events in the user's local timezone.
- NFR-15-2 (Performance): Event retrieval for a given month must complete within 2 seconds.

---

### UC-16: Manage Forum Threads and Posts

| Field             | Detail                                                                                                                                                                                                                               |
| :---------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use Case ID**   | UC-16                                                                                                                                                                                                                                |
| **Use Case Name** | Manage Forum Threads and Posts                                                                                                                                                                                                       |
| **Actor**         | Registered User, System                                                                                                                                                                                                              |
| **Description**   | Within a realm, users can create forum discussion threads with a title and body, reply to existing threads with posts, and delete their own threads or posts. Threads are displayed in reverse chronological order by last activity. |

**Pre-Conditions:**

- The user is authenticated for write operations.
- A valid `realmId` identifies the realm forum.

**Post-Conditions:**

- `Thread` and `Post` documents are persisted in MongoDB.
- `Thread.postCount` is incremented on reply and decremented on post deletion.
- `Thread.lastPostAt` is updated on each new reply.

**Basic Flow (Create Thread):**

1. User opens the Forum panel.
2. User clicks "New Thread", enters a `title` (max 300 chars) and optional `body` (max 5000 chars).
3. Client sends POST `/forum/threads` with `{ realmId, title, body, authorName }`.
4. System creates the `Thread` document with `postCount: 0` and `lastPostAt: now`.
5. System returns HTTP 201 with the thread object.

**Basic Flow (Reply to Thread):**

1. User opens a thread and reads existing posts.
2. User enters a reply `body` (max 5000 chars).
3. Client sends POST `/forum/threads/:id/posts` with `{ body, authorName }`.
4. System finds the parent thread; returns 404 if not found.
5. System validates that `body` is non-empty.
6. System creates the `Post` document linked to the thread.
7. System increments `thread.postCount` and updates `thread.lastPostAt`.
8. System returns HTTP 201 with the post object.

**Alternative Flow:** None.

**Exception Flow:**

| ID      | Trigger                              | System Response                          |
| :------ | :----------------------------------- | :--------------------------------------- |
| EX-16-1 | Missing or invalid JWT (write ops)   | HTTP 401: `"Unauthorized"`               |
| EX-16-2 | Missing `realmId` or `title`         | HTTP 400: `"realmId and title required"` |
| EX-16-3 | Thread not found                     | HTTP 404: `"Thread not found"`           |
| EX-16-4 | Post body is empty                   | HTTP 400: `"body required"`              |
| EX-16-5 | Non-author attempts to delete thread | HTTP 403: `"Forbidden"`                  |
| EX-16-6 | Non-author attempts to delete post   | HTTP 403: `"Forbidden"`                  |

**Business Rules:**

- BR-16-1: Thread `title` is capped at 300 characters; `body` and post content are capped at 5000 characters.
- BR-16-2: Thread list is public (unauthenticated users can read threads and posts); write operations require authentication.
- BR-16-3: Deleting a thread also deletes all its child posts.
- BR-16-4: Deleting a post decrements the parent thread's `postCount`.
- BR-16-5: Threads are sorted by `lastPostAt` descending (most recently active first).

**Non-Functional Requirements:**

- NFR-16-1 (Performance): Thread list pagination (20 threads per page) must return within 2 seconds.
- NFR-16-2 (Data Integrity): `postCount` must remain accurate across concurrent post creation and deletion.

---

### UC-17: Upload and Browse Resource Library

| Field             | Detail                                                                                                                                                                                                                 |
| :---------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use Case ID**   | UC-17                                                                                                                                                                                                                  |
| **Use Case Name** | Upload and Browse Resource Library                                                                                                                                                                                     |
| **Actor**         | Registered User, System                                                                                                                                                                                                |
| **Description**   | Realm members share links or metadata references to resources (documents, videos, articles, etc.). Other members browse the library with search and type filtering. All resources are stored in MongoDB with metadata. |

**Pre-Conditions:**

- For browsing: no authentication required.
- For upload and deletion: the user must be authenticated.
- `title` and `content_type` are required fields for upload.

**Post-Conditions:**

- A new `Resource` document is created in MongoDB with `isApproved: true`.
- Browsing returns only approved resources.

**Basic Flow (Browse):**

1. User opens the Library panel.
2. Client sends GET `/resources?realmId=...&type=...&q=...&page=1`.
3. System applies filters: `isApproved: true`, optional `realmId`, optional `content_type`, optional text search against `title`, `author`, and `description` using a case-insensitive regex.
4. System returns 12 resources per page sorted by `createdAt` descending.

**Basic Flow (Upload):**

1. User clicks "Add Resource" and fills in: `title` (max 300 chars), `author`, `content_type`, `url`, `thumbnail_url`, `description` (max 2000 chars), `realmId`.
2. Client sends POST `/resources` with the resource data.
3. System validates required fields.
4. System creates the `Resource` document with `isApproved: true`.
5. System returns HTTP 201 with the resource object.

**Alternative Flow:** None.

**Exception Flow:**

| ID      | Trigger                                 | System Response                               |
| :------ | :-------------------------------------- | :-------------------------------------------- |
| EX-17-1 | Missing JWT on write operations         | HTTP 401: `"Unauthorized"`                    |
| EX-17-2 | Missing `title` or `content_type`       | HTTP 400: `"title and content_type required"` |
| EX-17-3 | Resource not found                      | HTTP 404: `"Not found"`                       |
| EX-17-4 | Non-creator attempts to delete resource | HTTP 403: `"Forbidden"`                       |

**Business Rules:**

- BR-17-1: `title` is limited to 300 characters; `description` is limited to 2000 characters.
- BR-17-2: All uploaded resources are auto-approved (`isApproved: true`); no moderation queue is implemented.
- BR-17-3: Only the creator may delete their resource.
- BR-17-4: Resources may be global (no `realmId`) or scoped to a specific realm.
- BR-17-5: Text search is case-insensitive and matches partial strings using regex.

**Non-Functional Requirements:**

- NFR-17-1 (Performance): Resource search must return results within 2 seconds.
- NFR-17-2 (Scalability): Pagination is fixed at 12 items per page to limit payload size.

---

### UC-18: Edit Realm Map

| Field             | Detail                                                                                                                                                                                                                                                                                                          |
| :---------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use Case ID**   | UC-18                                                                                                                                                                                                                                                                                                           |
| **Use Case Name** | Edit Realm Map                                                                                                                                                                                                                                                                                                  |
| **Actor**         | Realm Owner, System                                                                                                                                                                                                                                                                                             |
| **Description**   | The realm owner uses the in-browser visual map editor to design or modify the realm's tilemap layout. The editor allows placing and erasing tiles, configuring rooms, and defining special interaction zones (portals, zone triggers). Changes are saved back to the realm's `map_data` field via the REST API. |

**Pre-Conditions:**

- The user is authenticated.
- The user is the owner of the realm being edited (ownership is checked server-side on PATCH).
- The editor page is loaded at `/editor/[realmId]`.

**Post-Conditions:**

- The realm's `map_data` field in MongoDB is updated with the new JSON tilemap.
- The changes are reflected when the next user joins the realm.

**Basic Flow:**

1. Realm Owner navigates to the map editor for a specific realm.
2. Frontend loads the current `map_data` from GET `/realms/:id`.
3. Editor renders the tile grid using PixiJS (`PixiEditor.tsx`).
4. Owner selects a tile from the tile palette (`TileMenu.tsx`) and paints tiles onto the grid.
5. Owner configures rooms via the room panel (`Rooms.tsx`, `RoomItem.tsx`).
6. Owner places special tiles (zone portals, spawn triggers) via `SpecialTiles.tsx`.
7. Owner clicks "Save".
8. Client sends PATCH `/realms/:id` with `{ map_data: <updated JSON> }`.
9. System verifies ownership and persists the new `map_data`.

**Alternative Flow:**

_AF-18-A: Erase tiles_

- Owner selects the eraser tool from the toolbar.
- Clicking/dragging on the grid removes tiles from the tilemap.

_AF-18-B: Change map template_

- Owner resets the map to a predefined template (e.g., `"office"`, `"conference"`).
- The default template layout is applied and then customizable.

**Exception Flow:**

| ID      | Trigger                                  | System Response            |
| :------ | :--------------------------------------- | :------------------------- |
| EX-18-1 | Missing or invalid JWT on PATCH          | HTTP 401: `"Unauthorized"` |
| EX-18-2 | Realm not found or user is not the owner | HTTP 404: `"Not found"`    |

**Business Rules:**

- BR-18-1: Only the realm owner may modify the map.
- BR-18-2: `map_data` is stored as arbitrary JSON; the server does not validate the map structure.
- BR-18-3: Map changes do not affect players currently in the realm; changes apply only to subsequent joins.

**Non-Functional Requirements:**

- NFR-18-1 (Usability): The tile editor must render tile selections and canvas updates within 60 ms to feel responsive.
- NFR-18-2 (Data Integrity): Map data is saved atomically via a single PATCH request to prevent partial updates.

---

### UC-19: Admin — Manage Users

| Field             | Detail                                                                                                                                                                                    |
| :---------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use Case ID**   | UC-19                                                                                                                                                                                     |
| **Use Case Name** | Admin: Manage Users                                                                                                                                                                       |
| **Actor**         | Admin, System                                                                                                                                                                             |
| **Description**   | An administrator views the full user list with search and pagination, promotes or demotes users to/from admin role, and permanently deletes user accounts along with all associated data. |

**Pre-Conditions:**

- The requesting user is authenticated and has `role: "admin"` in MongoDB.
- The server-side `requireAdmin` middleware validates this on every `/admin/*` request.

**Post-Conditions:**

_On Role Change:_ The target user's `role` field is updated in MongoDB.

_On Deletion:_ The target user's account and all owned data (profiles, realms, events, resources, threads, posts) are permanently deleted.

**Basic Flow (Browse Users):**

1. Admin navigates to the admin panel's User Management section.
2. Client sends GET `/admin/users?page=1&q=searchTerm`.
3. System queries `User` collection excluding the `password` field.
4. If `q` is provided, results are filtered by `email` and `displayName` using case-insensitive regex.
5. System returns paginated results (20 users per page) with total count.

**Basic Flow (Change Role):**

1. Admin locates a user and selects a new role from the role dropdown.
2. Client sends PATCH `/admin/users/:id/role` with `{ role: "admin" | "user" }`.
3. System validates the role value; rejects any value outside `["user", "admin"]`.
4. System updates the user's `role` field.
5. System returns the updated user object (without password).

**Basic Flow (Delete User):**

1. Admin clicks "Delete" on a user entry and confirms the action.
2. Client sends DELETE `/admin/users/:id`.
3. System checks that the admin is not deleting their own account.
4. System executes `Promise.all` to cascade-delete all user data.
5. System returns HTTP 204.

**Alternative Flow:** None.

**Exception Flow:**

| ID      | Trigger                              | System Response                      |
| :------ | :----------------------------------- | :----------------------------------- |
| EX-19-1 | Missing or invalid JWT               | HTTP 401: `"Unauthorized"`           |
| EX-19-2 | Valid JWT but user is not admin      | HTTP 403: `"Forbidden: admin only"`  |
| EX-19-3 | Invalid role value in PATCH          | HTTP 400: `"Invalid role"`           |
| EX-19-4 | User to delete not found             | HTTP 404: `"User not found"`         |
| EX-19-5 | Admin attempts to delete own account | HTTP 400: `"Cannot delete yourself"` |

**Business Rules:**

- BR-19-1: Only admin users may access any `/admin/*` endpoint.
- BR-19-2: An admin cannot delete their own account.
- BR-19-3: Valid role values are strictly `"user"` and `"admin"`.
- BR-19-4: User deletion is irreversible and cascades to all content authored by that user.
- BR-19-5: The admin panel returns users without the `password` field for security.

**Non-Functional Requirements:**

- NFR-19-1 (Security): The `requireAdmin` middleware must verify both JWT validity and `role === "admin"` in the database on every request; JWT claims alone are insufficient.
- NFR-19-2 (Performance): User list pagination must return within 2 seconds for up to 10,000 users.
- NFR-19-3 (Audit): Admin actions (role change, deletion) should be logged for audit trail purposes.

---

### UC-20: Admin — View Analytics Dashboard

| Field             | Detail                                                                                                                                                                                                                                    |
| :---------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use Case ID**   | UC-20                                                                                                                                                                                                                                     |
| **Use Case Name** | Admin: View Analytics Dashboard                                                                                                                                                                                                           |
| **Actor**         | Admin, System                                                                                                                                                                                                                             |
| **Description**   | The administrator views a real-time analytics dashboard presenting platform-wide statistics including user growth trends, content volume, realm distribution, and forum activity. All data is computed via MongoDB aggregation pipelines. |

**Pre-Conditions:**

- The requesting user is authenticated with `role: "admin"`.
- The MongoDB database contains historical data.

**Post-Conditions:**

- Analytics data is returned as JSON and rendered in the admin dashboard.
- No data is modified by these read operations.

**Basic Flow:**

1. Admin navigates to the analytics section of the admin panel.
2. Dashboard loads data from multiple concurrent GET requests:
   - **GET `/admin/stats`**: Returns `totalUsers`, `newUsers30d`, `newUsers7d`, `totalRealms`, `totalEvents`, `totalResources`, `totalThreads`, `totalPosts`, `totalMessages`.
   - **GET `/admin/stats/users-trend`**: Returns monthly user registration counts for the past 12 months.
   - **GET `/admin/stats/resources-by-type`**: Returns resource count grouped by `content_type`.
   - **GET `/admin/stats/realms-per-owner`**: Returns the top 10 realm owners by count.
   - **GET `/admin/stats/forum-activity`**: Returns daily thread and post creation counts for the past 30 days.
3. System executes individual and aggregated MongoDB queries for each endpoint.
4. Data is returned and the dashboard renders charts and summary cards.

**Alternative Flow:** None.

**Exception Flow:**

| ID      | Trigger                         | System Response                     |
| :------ | :------------------------------ | :---------------------------------- |
| EX-20-1 | Missing or invalid JWT          | HTTP 401: `"Unauthorized"`          |
| EX-20-2 | Authenticated user is not admin | HTTP 403: `"Forbidden: admin only"` |

**Business Rules:**

- BR-20-1: Analytics data is computed live from MongoDB; no pre-aggregated cache exists.
- BR-20-2: The user trend covers the trailing 12 complete calendar months.
- BR-20-3: The forum activity chart covers the trailing 30 calendar days.
- BR-20-4: The top realm owners report is limited to 10 entries.

**Non-Functional Requirements:**

- NFR-20-1 (Performance): Each analytics endpoint must return within 5 seconds even for large datasets, leveraging MongoDB aggregation pipeline indexes.
- NFR-20-2 (Security): Analytics endpoints must be protected by the same `requireAdmin` middleware as user management.
- NFR-20-3 (Accuracy): Stats reflect the current database state at the time of the request; they are not cached and are accurate to the second.

---

## SUMMARY TABLE

| UC ID | Use Case Name                       | Primary Actor           | HTTP / Socket              | Requires Auth          |
| :---- | :---------------------------------- | :---------------------- | :------------------------- | :--------------------- |
| UC-01 | Register Account via OTP            | Guest                   | REST POST                  | No                     |
| UC-02 | Register Account via Email/Password | Guest                   | REST POST                  | No                     |
| UC-03 | Log In with Email and Password      | Registered User         | REST POST                  | No                     |
| UC-04 | Log In with Google OAuth            | Guest / Registered User | REST POST                  | No                     |
| UC-05 | Manage User Profile                 | Registered User         | REST GET/PATCH             | Yes (JWT)              |
| UC-06 | Create a Realm                      | Registered User         | REST POST                  | Yes (JWT)              |
| UC-07 | Manage Realm Settings               | Realm Owner             | REST PATCH                 | Yes (JWT + owner)      |
| UC-08 | Delete a Realm                      | Realm Owner             | REST DELETE                | Yes (JWT + owner)      |
| UC-09 | Join a Realm                        | Registered User         | WebSocket                  | Yes (JWT via socket)   |
| UC-10 | Move Avatar in Realm                | Registered User         | WebSocket                  | Yes (active session)   |
| UC-11 | Teleport Between Rooms              | Registered User         | WebSocket                  | Yes (active session)   |
| UC-12 | Send Proximity Chat Message         | Registered User         | WebSocket                  | Yes (active session)   |
| UC-13 | Initiate and Respond to Video Call  | Registered User × 2     | WebSocket                  | Yes (active session)   |
| UC-14 | Manage Chat Channels and Messages   | Registered User         | REST GET/POST/DELETE       | Yes (JWT)              |
| UC-15 | Manage Events and RSVP              | Registered User         | REST GET/POST/PATCH/DELETE | Yes (JWT)              |
| UC-16 | Manage Forum Threads and Posts      | Registered User         | REST GET/POST/DELETE       | Partial (read = open)  |
| UC-17 | Upload and Browse Resource Library  | Registered User         | REST GET/POST/DELETE       | Partial (read = open)  |
| UC-18 | Edit Realm Map                      | Realm Owner             | REST GET/PATCH             | Yes (JWT + owner)      |
| UC-19 | Admin: Manage Users                 | Admin                   | REST GET/PATCH/DELETE      | Yes (JWT + admin role) |
| UC-20 | Admin: View Analytics Dashboard     | Admin                   | REST GET                   | Yes (JWT + admin role) |
