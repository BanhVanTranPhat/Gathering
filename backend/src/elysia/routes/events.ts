import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { v4 as uuidv4 } from 'uuid'
import Event from '../../models/Event'
import { sendEmail } from '../../utils/mailer'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

function sanitizeBreakoutRooms(value: any) {
  if (!Array.isArray(value)) return []
  return value
    .map((room) => ({
      name: String(room?.name || '').slice(0, 80),
      roomIndex: Number(room?.roomIndex),
      channelKey: String(room?.channelKey || '').slice(0, 120),
      maxParticipants:
        room?.maxParticipants !== undefined
          ? Number(room.maxParticipants)
          : undefined,
    }))
    .filter(
      (room) =>
        room.name &&
        Number.isFinite(room.roomIndex) &&
        room.roomIndex >= 0 &&
        (room.maxParticipants === undefined || room.maxParticipants > 0),
    )
    .slice(0, 10)
}

export const eventRoutes = new Elysia({ prefix: '/events' })
  .use(
    jwt({
      name: 'jwt',
      secret: JWT_SECRET
    })
  )
  .derive(async ({ headers, jwt, set }) => {
    const auth = headers['authorization']
    if (!auth || !auth.startsWith('Bearer ')) {
      return { user: null }
    }
    const token = auth.split(' ')[1]
    const user = await jwt.verify(token)
    return { user: user || null }
  })
  .get('/', async ({ user, query, set }) => {
    if (!user) {
      set.status = 401
      return { message: 'Unauthorized' }
    }
    const { realmId, month, year, page: qPage, limit: qLimit } = query as any
    if (!realmId) {
      set.status = 400
      return { message: 'realmId required' }
    }

    const filter: any = { realmId }
    if (month && year) {
      const m = Number(month)
      const y = Number(year)
      const start = new Date(y, m, 1)
      const end = new Date(y, m + 1, 0, 23, 59, 59, 999)
      filter.startTime = { $gte: start, $lte: end }
    }

    const page = Math.max(1, Number(qPage) || 1)
    const limit = Math.min(100, Math.max(1, Number(qLimit) || 50))
    const total = await Event.countDocuments(filter)
    const events = await Event.find(filter).sort({ startTime: 1 }).skip((page - 1) * limit).limit(limit).lean()

    return { events, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } }
  })
  .post('/', async ({ body, user, set }) => {
    if (!user) {
      set.status = 401
      return { message: 'Unauthorized' }
    }
    const {
      realmId,
      title,
      description,
      startTime,
      endTime,
      location,
      maxParticipants,
      createdByName,
      hostingMode,
      roomIndex,
      channelKey,
      breakoutRooms,
    } = body as any
    if (!realmId || !title || !startTime || !endTime) {
      set.status = 400
      return { message: 'realmId, title, startTime, endTime required' }
    }
    const parsedStart = new Date(startTime)
    const parsedEnd = new Date(endTime)
    if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
      set.status = 400
      return { message: 'Invalid date format' }
    }
    if (parsedEnd <= parsedStart) {
      set.status = 400
      return { message: 'End time must be after start time' }
    }

    const userId = (user as any).userId || (user as any).id
    const event = await Event.create({
      eventId: uuidv4(),
      realmId,
      title: title.slice(0, 200),
      description: (description || '').slice(0, 2000),
      startTime: parsedStart,
      endTime: parsedEnd,
      createdBy: userId,
      createdByName: createdByName || '',
      attendees: [{ userId, username: createdByName || '', status: 'going' }],
      location: location || '',
      maxParticipants: maxParticipants || undefined,
      hostingMode: hostingMode === 'external' ? 'external' : 'agora',
      roomIndex: Number.isFinite(Number(roomIndex)) ? Number(roomIndex) : 0,
      channelKey: (channelKey || '').slice(0, 120),
      breakoutRooms: sanitizeBreakoutRooms(breakoutRooms),
    })

    set.status = 201
    return { event }
  })
  .patch('/:id', async ({ params, body, user, set }) => {
    if (!user) {
      set.status = 401
      return { message: 'Unauthorized' }
    }
    const userId = (user as any).userId || (user as any).id
    const event = await Event.findOne({ eventId: params.id })
    if (!event) {
      set.status = 404
      return { message: 'Not found' }
    }
    if (event.createdBy !== userId) {
      set.status = 403
      return { message: 'Forbidden' }
    }

    const b = body as any
    if (b.title !== undefined) event.title = b.title.slice(0, 200)
    if (b.description !== undefined) event.description = b.description.slice(0, 2000)
    if (b.startTime !== undefined) event.startTime = new Date(b.startTime)
    if (b.endTime !== undefined) event.endTime = new Date(b.endTime)
    if (b.location !== undefined) event.location = b.location
    if (b.maxParticipants !== undefined) event.maxParticipants = b.maxParticipants
    if (b.hostingMode !== undefined) {
      event.hostingMode = b.hostingMode === 'external' ? 'external' : 'agora'
    }
    if (b.roomIndex !== undefined) {
      const parsedRoomIndex = Number(b.roomIndex)
      if (!Number.isFinite(parsedRoomIndex) || parsedRoomIndex < 0) {
        set.status = 400
        return { message: 'roomIndex must be a non-negative number' }
      }
      event.roomIndex = parsedRoomIndex
    }
    if (b.channelKey !== undefined) event.channelKey = String(b.channelKey).slice(0, 120)
    if (b.breakoutRooms !== undefined) {
      event.breakoutRooms = sanitizeBreakoutRooms(b.breakoutRooms) as any
    }

    await event.save()
    return { event }
  })
  .delete('/:id', async ({ params, user, set }) => {
    if (!user) {
      set.status = 401
      return { message: 'Unauthorized' }
    }
    const userId = (user as any).userId || (user as any).id
    const event = await Event.findOne({ eventId: params.id })
    if (!event) {
      set.status = 404
      return { message: 'Not found' }
    }
    if (event.createdBy !== userId) {
      set.status = 403
      return { message: 'Forbidden' }
    }

    await Event.deleteOne({ _id: event._id })
    set.status = 204
    return
  })
  .post('/:id/rsvp', async ({ params, body, user, set }) => {
    if (!user) {
      set.status = 401
      return { message: 'Unauthorized' }
    }
    const userId = (user as any).userId || (user as any).id
    const { status, username } = body as any
    if (!['going', 'maybe', 'not_going'].includes(status)) {
      set.status = 400
      return { message: 'status must be going, maybe, or not_going' }
    }
    const safeUsername = typeof username === 'string' ? username.slice(0, 100) : ''

    const event = await Event.findOne({ eventId: params.id })
    if (!event) {
      set.status = 404
      return { message: 'Not found' }
    }

    let shouldSendBookingEmail = false
    const existingAttendee = event.attendees.find((attendee) => attendee.userId === userId)

    if (existingAttendee) {
      const previousStatus = existingAttendee.status
      existingAttendee.status = status
      if (safeUsername) existingAttendee.username = safeUsername
      shouldSendBookingEmail = previousStatus !== 'going' && status === 'going'
      await event.save()
    } else {
    if (status === 'going' && event.maxParticipants) {
      const goingCount = event.attendees.filter((a) => a.status === 'going').length
      if (goingCount >= event.maxParticipants) {
        set.status = 400
        return { message: 'Event is full' }
      }
    }

      event.attendees.push({ userId, username: safeUsername, status } as any)
      shouldSendBookingEmail = status === 'going'
      await event.save()
    }

    if (shouldSendBookingEmail && (user as any).email) {
      sendEmail({
        to: (user as any).email,
        subject: `Booking Confirmation: ${event.title}`,
        html: `
          <h1>Booking Confirmed!</h1>
          <p>Hi ${safeUsername},</p>
          <p>You have successfully booked a spot for the event: <strong>${event.title}</strong>.</p>
          <p>Time: ${event.startTime.toLocaleString()}</p>
          <p>Location: ${event.location || 'Virtual'}</p>
          <p>We look forward to seeing you there!</p>
        `
      }).catch(err => console.error('[Event RSVP Email Error]', err))
    }

    return { event }
  })
