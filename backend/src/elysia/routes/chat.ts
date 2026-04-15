import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import ChatChannel from '../../models/ChatChannel'
import ChatMessage from '../../models/ChatMessage'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

async function ensureDefaultChannels(realmId: string, userId: string) {
  const existing = await ChatChannel.findOne({ realmId, type: 'channel' })
  if (existing) return

  await ChatChannel.insertMany([
    { realmId, name: 'general', type: 'channel', members: [], createdBy: userId },
    { realmId, name: 'social', type: 'channel', members: [], createdBy: userId },
  ])
}

export const chatRoutes = new Elysia({ prefix: '/chat' })
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
  .get('/channels/:realmId', async ({ params, user, set }) => {
    if (!user) {
      set.status = 401
      return { message: 'Unauthorized' }
    }
    const userId = (user as any).userId || (user as any).id
    const { realmId } = params
    await ensureDefaultChannels(realmId, userId)

    const channels = await ChatChannel.find({
      realmId,
      $or: [
        { type: 'channel' },
        { type: 'dm', members: userId },
      ],
    }).sort({ type: 1, createdAt: 1 })

    return { channels }
  })
  .post('/channels', async ({ body, user, set }) => {
    if (!user) {
      set.status = 401
      return { message: 'Unauthorized' }
    }
    const userId = (user as any).userId || (user as any).id
    const { realmId, name, type, members } = body as any
    if (!realmId || !name || !type) {
      set.status = 400
      return { message: 'realmId, name, type required' }
    }

    if (type === 'dm') {
      if (!members || !Array.isArray(members) || members.length !== 2) {
        set.status = 400
        return { message: 'DM requires exactly 2 members' }
      }
      const existing = await ChatChannel.findOne({
        realmId,
        type: 'dm',
        members: { $all: members, $size: 2 },
      })
      if (existing) return { channel: existing }
    }

    const channel = await ChatChannel.create({
      realmId,
      name: name.slice(0, 30),
      type,
      members: members || [],
      createdBy: userId,
    })

    return { channel }
  })
  .get('/messages/:channelId', async ({ params, query, user, set }) => {
    if (!user) {
      set.status = 401
      return { message: 'Unauthorized' }
    }
    const userId = (user as any).userId || (user as any).id
    const { channelId } = params

    const channel = await ChatChannel.findById(channelId).lean()
    if (!channel) {
      set.status = 404
      return { message: 'Channel not found' }
    }
    if (channel.type === 'dm' && !channel.members.includes(userId)) {
      set.status = 403
      return { message: 'Not a member of this channel' }
    }

    const page = Math.max(1, parseInt(query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 50))
    const skip = (page - 1) * limit

    const messages = await ChatMessage.find({ channelId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    return { messages: messages.reverse(), page, hasMore: messages.length === limit }
  })
  .delete('/channels/:channelId', async ({ params, user, set }) => {
    if (!user) {
      set.status = 401
      return { message: 'Unauthorized' }
    }
    const userId = (user as any).userId || (user as any).id
    const channel = await ChatChannel.findById(params.channelId)
    if (!channel) {
      set.status = 404
      return { message: 'Channel not found' }
    }
    if (channel.createdBy !== userId) {
      set.status = 403
      return { message: 'Not owner' }
    }
    if (channel.type === 'channel' && ['general', 'social'].includes(channel.name)) {
      set.status = 400
      return { message: 'Cannot delete default channels' }
    }

    await ChatMessage.deleteMany({ channelId: channel._id })
    await channel.deleteOne()
    return { success: true }
  })
