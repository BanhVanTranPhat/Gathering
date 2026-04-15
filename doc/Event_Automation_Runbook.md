# Event Automation Runbook

## Objective

Document how event booking confirmation and reminder emails are triggered, monitored, and recovered in The Gathering backend.

## Trigger Behavior

## 1) Booking confirmation (`/events/:id/rsvp`)
- Endpoint: `POST /events/:id/rsvp`
- Confirmation email is sent when a user transitions into `going` state:
  - New attendee with `status=going`
  - Existing attendee updated from `maybe/not_going` to `going`
- Email subject format: `Booking Confirmation: <event title>`

## 2) Reminder scheduler (`processEventReminders`)
- Worker entry: `backend/src/utils/eventReminders.ts`
- Schedule:
  - Initial run on backend startup
  - Periodic run every 5 minutes from `backend/src/elysia.ts`
- Reminder windows:
  - `24h` reminder: events starting in approximately 23h-24h window
  - `1h` reminder: events starting in approximately 55m-65m window
- Recipient rule: attendees with `status=going` and valid user email.

## Failure Handling and Retry Strategy

- Reminder sender uses `Promise.allSettled` to track each delivery outcome.
- Per-event telemetry is logged:
  - `kind`, `eventId`, `attempted`, `sent`, `failed`
- Marker updates:
  - `reminder24hSentAt` / `reminder1hSentAt` are set only when:
    - all attempted emails are sent, or
    - no recipients are eligible.
- If any reminder delivery fails, the sent marker is not set, allowing retry in next scheduler cycle.

## Operational Checklist

- Verify SMTP env is configured:
  - `SMTP_USER`
  - `SMTP_PASS`
- Verify backend logs contain scheduler run lines and per-event stats.
- Validate one full test flow:
  1. Create event in test realm.
  2. RSVP as `going`.
  3. Confirm booking email received.
  4. Adjust event start time into reminder windows.
  5. Confirm reminder logs and email receipt.
