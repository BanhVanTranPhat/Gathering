# MVP Gap Matrix - The Gathering

## Scope

This matrix maps each requirement from `doc/techbrief.md` to the current implementation status in The Gathering MVP.

Status keys:
- `DONE`: implemented and currently usable.
- `PARTIAL`: implemented but missing a required behavior, evidence, or operational hardening.
- `DEFERRED`: intentionally postponed (requires client approval).

## Matrix

| Technical Brief Requirement | Current Implementation | Status | Gap to Close | Owner |
| --- | --- | --- | --- | --- |
| Clean, intuitive UI for platform access | Next.js + React shell, sidebar panels, dashboard entry points are in place | DONE | Continue UX polish and consistency checks before defense | Frontend |
| Sign-up and log-in pages | OTP, Google auth, and classic auth routes/UI implemented | DONE | Add smoke test evidence for all auth paths | Frontend + Backend |
| User verification (email confirmation) | OTP flow and email sender implemented | DONE | Keep SMTP env documented and validated in staging | Backend |
| User profile management | Profile APIs and UI updates implemented | DONE | Run edge-case checks for avatar/profile fields | Frontend + Backend |
| Dashboard quick access to events/resources/forum | Dashboard and in-world panel access implemented | DONE | Keep navigation wording aligned in presentation | Frontend |
| Booking calendar to view/book events | `CalendarPanel` + `/events` APIs available | PARTIAL | Add event hosting metadata and breakout mapping, then verify end-to-end flow | Frontend + Backend |
| Automated confirmations and reminders | RSVP confirmation email exists, reminder processor exists and is scheduled | PARTIAL | Add auditable reminder run telemetry and failure details; verify with scenario evidence | Backend |
| Event hosting supports >=20 users with path to 100 | Agora + Socket.IO architecture supports scale conceptually | PARTIAL | Execute and publish 20-user validation evidence and known limits | QA + Backend |
| Room/breakout functionality | Multi-room world exists at map/session level | PARTIAL | Formalize event-level room/zone/channel mapping and join instruction in event model/UI | Frontend + Backend |
| Digital public library repository/CMS | Resource module with list and management routes/UI | DONE | Validate search/filter edge cases and response times | Frontend + Backend |
| Public library search and filtering | Implemented in resource browsing | DONE | Add quick regression checklist in readiness report | Frontend |
| Service directory searchable entries (pending approval) | Service module exists but feature is out of MVP core scope | DEFERRED | Keep explicit client-approval dependency and design stub in docs/slides | PM + Docs |
| Forum topic creation and threaded replies | Thread/post APIs and panel are implemented | DONE | Continue pagination/usability checks | Frontend + Backend |
| Forum user moderation capabilities | Author/admin delete controls exist in APIs | PARTIAL | Expose moderation role visibility in UI and add moderation rules note | Frontend + Backend |

## Acceptance Criteria for Partial Items

### AC-EVT-01: Automated Event Communication
- RSVP `going` triggers confirmation email for attendee with event title, time, location.
- Reminder worker runs on schedule and sends `24h` and `1h` reminders exactly once per event window.
- Failure path logs include event id and reminder kind.

### AC-EVT-02: Event Hosting and Breakouts
- Event records include explicit hosting mode and communication context (`realmId`, `roomIndex`, optional `breakoutRooms`).
- Event details view displays hosting metadata and breakout instructions.
- Join behavior can map attendees to the declared communication context.

### AC-EVT-03: Capacity and Stability Evidence
- At least one 20-participant scenario is executed and recorded in readiness report.
- Report includes environment, steps, observed metrics, bottlenecks, and pass/fail decision.

### AC-FORUM-01: Moderation Visibility
- Forum APIs return moderation capability flags for current user.
- UI clearly indicates moderation controls when user is admin or content owner.
- Unauthorized moderation attempts return `403` and are documented.

## Decision Log

- Service Directory remains `DEFERRED` for MVP launch, pending explicit client approval.
- Final defense narrative must map each requirement to either completed evidence or documented deferral.
