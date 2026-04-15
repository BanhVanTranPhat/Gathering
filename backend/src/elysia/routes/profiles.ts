import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import Profile from '../../models/Profile'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export const profileRoutes = new Elysia({ prefix: '/profiles' })
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
  .get('/me', async ({ user, set }) => {
    if (!user) {
      set.status = 401
      return { message: 'Unauthorized' }
    }
    const userId = (user as any).userId || (user as any).id
    let profile = await Profile.findOne({ id: userId }).lean()
    if (!profile) {
      await Profile.create({ id: userId, visited_realms: [], skin: undefined })
      profile = await Profile.findOne({ id: userId }).lean()
    }
    return profile || { id: userId, skin: undefined, visited_realms: [] }
  })
  .patch('/me', async ({ user, body, set }) => {
    if (!user) {
      set.status = 401
      return { message: 'Unauthorized' }
    }
    const userId = (user as any).userId || (user as any).id
    
    const b = body as any
    const allowed: Record<string, unknown> = {}
    const ALLOWED_FIELDS = ['displayName', 'bio', 'avatar', 'skin', 'avatarConfig'] as const
    for (const key of ALLOWED_FIELDS) {
      if (b[key] !== undefined) allowed[key] = b[key]
    }
    
    if (typeof allowed.displayName === 'string') allowed.displayName = allowed.displayName.slice(0, 100)
    if (typeof allowed.bio === 'string') allowed.bio = allowed.bio.slice(0, 500)

    const profile = await Profile.findOneAndUpdate(
      { id: userId },
      { $set: allowed },
      { upsert: true, new: true }
    ).lean()
    return profile
  })
