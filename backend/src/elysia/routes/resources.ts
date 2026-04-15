import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import Resource from '../../models/Resource'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export const resourceRoutes = new Elysia({ prefix: '/resources' })
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
  .get('/', async ({ query, set }) => {
    const { realmId, type, q, page: pageStr } = query as any
    const page = Math.max(1, Number(pageStr) || 1)
    const limit = 12

    const filter: any = { isApproved: true }
    if (realmId) filter.$or = [{ realmId }, { realmId: null }]
    if (type && type !== 'all') filter.content_type = type

    if (q && typeof q === 'string' && q.trim()) {
      const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(escaped, 'i')
      filter.$and = [{ $or: [{ title: regex }, { author: regex }, { description: regex }] }]
    }

    const total = await Resource.countDocuments(filter)
    const resources = await Resource.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    return {
      resources,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    }
  })
  .post('/', async ({ body, user, set }) => {
    if (!user) {
      set.status = 401
      return { message: 'Unauthorized' }
    }
    const userId = (user as any).userId || (user as any).id
    const { title, author, content_type, url, thumbnail_url, description, realmId, createdByName } = body as any
    if (!title || !content_type) {
      set.status = 400
      return { message: 'title and content_type required' }
    }

    const resource = await Resource.create({
      title: title.slice(0, 300),
      author: (author || '').slice(0, 200),
      content_type,
      url: url || '',
      thumbnail_url: thumbnail_url || '',
      description: (description || '').slice(0, 2000),
      realmId: realmId || null,
      createdBy: userId,
      createdByName: createdByName || '',
      isApproved: true,
    })

    set.status = 201
    return { resource }
  })
  .delete('/:id', async ({ params, user, set }) => {
    if (!user) {
      set.status = 401
      return { message: 'Unauthorized' }
    }
    const userId = (user as any).userId || (user as any).id
    const resource = await Resource.findById(params.id)
    if (!resource) {
      set.status = 404
      return { message: 'Not found' }
    }
    if (resource.createdBy !== userId) {
      set.status = 403
      return { message: 'Forbidden' }
    }

    await Resource.deleteOne({ _id: resource._id })
    set.status = 204
    return
  })
