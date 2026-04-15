import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { v4 as uuidv4 } from 'uuid'
import Realm from '../../models/Realm'
import Profile from '../../models/Profile'
import User from '../../models/User'
import Event from '../../models/Event'
import Thread from '../../models/Thread'
import Post from '../../models/Post'
import Resource from '../../models/Resource'
import ChatChannel from '../../models/ChatChannel'
import ChatMessage from '../../models/ChatMessage'
import { formatEmailToName } from '../../utils'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

function isObjectId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id)
}

function realmQuery(id: string) {
  return isObjectId(id) ? { $or: [{ _id: id }, { id }] } : { id }
}

export const realmRoutes = new Elysia({ prefix: '/realms' })
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
    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 50))
    
    const userId = (user as any).userId || (user as any).id
    const total = await Realm.countDocuments({ owner_id: userId })
    const owned = await Realm.find({ owner_id: userId })
      .select('id name share_id mapTemplate')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    return {
      realms: owned.map((r) => ({ 
        id: (r as any).id || (r as any)._id?.toString(), 
        name: r.name, 
        share_id: r.share_id, 
        mapTemplate: (r as any).mapTemplate || 'office' 
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    }
  })
  .get('/by-share/:shareId', async ({ params, set }) => {
    const realm = await Realm.findOne({ share_id: params.shareId }).lean()
    if (!realm) {
      set.status = 404
      return { message: 'Not found' }
    }
    return {
      id: (realm as any).id || (realm as any)._id?.toString(),
      name: realm.name,
      owner_id: realm.owner_id,
      map_data: realm.map_data,
      share_id: realm.share_id,
      only_owner: realm.only_owner,
    }
  })
  .get('/:id', async ({ params, set }) => {
    const realm = await Realm.findOne(realmQuery(params.id)).lean()
    if (!realm) {
      set.status = 404
      return { message: 'Not found' }
    }
    return {
      id: (realm as any).id || (realm as any)._id?.toString(),
      name: realm.name,
      owner_id: realm.owner_id,
      map_data: realm.map_data,
      share_id: realm.share_id,
      only_owner: realm.only_owner,
    }
  })
  .get('/:id/members', async ({ params, user, set }) => {
    if (!user) {
      set.status = 401
      return { message: 'Unauthorized' }
    }
    const realm = await Realm.findOne(realmQuery(params.id)).lean()
    if (!realm) {
      set.status = 404
      return { message: 'Not found' }
    }

    const shareId = realm.share_id
    const members: { uid: string; displayName: string }[] = []

    async function resolveName(profileId: string, profileDisplayName?: string): Promise<string> {
      if (profileDisplayName?.trim()) return profileDisplayName.trim()
      const u = await User.findById(profileId).select('email displayName').lean()
      if (u?.displayName?.trim()) return u.displayName.trim()
      if (u?.email) return formatEmailToName(u.email)
      return profileId.slice(0, 8)
    }

    const ownerProfile = await Profile.findOne({ id: realm.owner_id }).lean()
    members.push({
      uid: realm.owner_id,
      displayName: await resolveName(realm.owner_id, ownerProfile?.displayName),
    })

    if (shareId) {
      const visitors = await Profile.find({ visited_realms: shareId })
        .select('id displayName')
        .limit(200)
        .lean()
      for (const v of visitors) {
        if (v.id === realm.owner_id) continue
        members.push({
          uid: v.id,
          displayName: await resolveName(v.id, v.displayName),
        })
      }
    }

    return { members }
  })
  .post('/', async ({ body, user, set }) => {
    if (!user) {
      set.status = 401
      return { message: 'Unauthorized' }
    }
    const { name, map_data, mapTemplate } = body as any
    const userId = (user as any).userId || (user as any).id
    const realm = await Realm.create({
      id: uuidv4(),
      owner_id: userId,
      name: name || 'New Space',
      map_data: map_data || null,
      mapTemplate: mapTemplate || 'office',
      share_id: uuidv4().slice(0, 8),
      only_owner: false,
    })
    return {
      status: 201,
      id: realm.id || (realm as any)._id?.toString(),
      name: realm.name,
      share_id: realm.share_id,
      owner_id: realm.owner_id,
      mapTemplate: realm.mapTemplate,
    }
  })
  .patch('/:id', async ({ params, body, user, set }) => {
    if (!user) {
      set.status = 401
      return { message: 'Unauthorized' }
    }
    const userId = (user as any).userId || (user as any).id
    const realm = await Realm.findOne(realmQuery(params.id))
    if (!realm || realm.owner_id !== userId) {
      set.status = 404
      return { message: 'Not found' }
    }
    
    const b = body as any
    if (b.map_data !== undefined) realm.map_data = b.map_data
    if (b.name !== undefined) realm.name = b.name
    if (b.share_id !== undefined) realm.share_id = b.share_id
    if (b.only_owner !== undefined) realm.only_owner = b.only_owner
    
    await realm.save()
    return realm
  })
  .delete('/:id', async ({ params, user, set }) => {
    if (!user) {
      set.status = 401
      return { message: 'Unauthorized' }
    }
    const userId = (user as any).userId || (user as any).id
    const realm = await Realm.findOne(realmQuery(params.id))
    if (!realm || realm.owner_id !== userId) {
      set.status = 404
      return { message: 'Not found' }
    }

    const realmId = (realm as any).id || realm._id.toString()
    const shareId = realm.share_id
    const channels = await ChatChannel.find({ realmId }).select('_id').lean()
    const channelIds = channels.map((c) => c._id)
    const threads = await Thread.find({ realmId }).select('_id').lean()
    const threadIds = threads.map((t) => t._id)

    await Promise.all([
      Event.deleteMany({ realmId }),
      Resource.deleteMany({ realmId }),
      threadIds.length ? Post.deleteMany({ threadId: { $in: threadIds } }) : Promise.resolve(),
      Thread.deleteMany({ realmId }),
      channelIds.length ? ChatMessage.deleteMany({ channelId: { $in: channelIds } }) : Promise.resolve(),
      ChatChannel.deleteMany({ realmId }),
      Realm.deleteOne({ _id: realm._id }),
    ])
    if (shareId) {
      await Profile.updateMany({ visited_realms: shareId }, { $pull: { visited_realms: shareId } })
    }
    set.status = 204
    return
  })
