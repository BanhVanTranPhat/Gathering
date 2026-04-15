import Event from "../models/Event";
import User from "../models/User";
import { sendEmail } from "./mailer";

const HOUR_MS = 60 * 60 * 1000;

async function sendReminderEmails(
  event: any,
  usersById: Map<string, any>,
  kind: "24h" | "1h",
) {
  const goingAttendees = Array.isArray(event.attendees)
    ? event.attendees.filter(
        (attendee: any) => attendee?.status === "going" && attendee?.userId,
      )
    : [];

  const emails = goingAttendees
    .map((attendee: any) => {
      const user = usersById.get(attendee.userId);
      if (!user?.email) return null;
      return {
        email: user.email,
        username: attendee.username || user.displayName || user.email,
      };
    })
    .filter(Boolean) as { email: string; username: string }[];

  if (!emails.length) return { attempted: 0, sent: 0, failed: 0 };

  const when = new Date(event.startTime).toLocaleString("vi-VN");
  const subjectPrefix = kind === "24h" ? "Reminder (24h)" : "Reminder (1h)";
  const results = await Promise.allSettled(
    emails.map((entry) =>
      sendEmail({
        to: entry.email,
        subject: `${subjectPrefix}: ${event.title}`,
        html: `
          <h2>Event Reminder</h2>
          <p>Hi ${entry.username},</p>
          <p>Your event <strong>${event.title}</strong> will start ${kind === "24h" ? "in about 24 hours" : "in about 1 hour"}.</p>
          <p>Time: ${when}</p>
          <p>Location: ${event.location || "Virtual"}</p>
          <p>See you there!</p>
        `,
      }),
    ),
  );

  const sent = results.filter((result) => result.status === "fulfilled").length;
  const failed = results.length - sent;

  if (failed > 0) {
    console.error(
      `[Event Reminder Email Error] eventId=${event.eventId} kind=${kind} failed=${failed}`,
    );
  }

  return { attempted: emails.length, sent, failed };
}

export async function processEventReminders() {
  const now = new Date();
  const in24hFrom = new Date(now.getTime() + 23 * HOUR_MS);
  const in24hTo = new Date(now.getTime() + 24 * HOUR_MS);
  const in1hFrom = new Date(now.getTime() + 55 * 60 * 1000);
  const in1hTo = new Date(now.getTime() + 65 * 60 * 1000);

  const [events24h, events1h] = await Promise.all([
    Event.find({
      startTime: { $gte: in24hFrom, $lte: in24hTo },
      reminder24hSentAt: null,
    }).lean(),
    Event.find({
      startTime: { $gte: in1hFrom, $lte: in1hTo },
      reminder1hSentAt: null,
    }).lean(),
  ]);

  const userIds = Array.from(
    new Set(
      [...events24h, ...events1h].flatMap((event: any) =>
        (event.attendees || [])
          .filter((attendee: any) => attendee?.status === "going")
          .map((attendee: any) => attendee.userId),
      ),
    ),
  );

  const users = userIds.length
    ? await User.find({ _id: { $in: userIds } }, "email displayName").lean()
    : [];
  const usersById = new Map(users.map((user: any) => [String(user._id), user]));

  for (const event of events24h) {
    const stats = await sendReminderEmails(event, usersById, "24h");
    if (stats.attempted === 0 || stats.failed === 0) {
      await Event.updateOne(
        { _id: event._id },
        { $set: { reminder24hSentAt: new Date() } },
      );
    }
    console.log(
      `[Event Reminder] kind=24h eventId=${event.eventId} attempted=${stats.attempted} sent=${stats.sent} failed=${stats.failed}`,
    );
  }

  for (const event of events1h) {
    const stats = await sendReminderEmails(event, usersById, "1h");
    if (stats.attempted === 0 || stats.failed === 0) {
      await Event.updateOne(
        { _id: event._id },
        { $set: { reminder1hSentAt: new Date() } },
      );
    }
    console.log(
      `[Event Reminder] kind=1h eventId=${event.eventId} attempted=${stats.attempted} sent=${stats.sent} failed=${stats.failed}`,
    );
  }

  return { sent24h: events24h.length, sent1h: events1h.length };
}
