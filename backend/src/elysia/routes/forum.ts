import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import Thread from '../../models/Thread'
import Post from '../../models/Post'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export const forumRoutes = new Elysia({ prefix: '/forum' })
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
  .get('/threads', async ({ query, set, user }) => {
    const { realmId, page: pageStr } = query as any

    const page = Math.max(1, Number(pageStr) || 1)
    const limit = 20

    const filter = realmId && realmId !== 'global' ? { realmId } : {}
    const total = await Thread.countDocuments(filter)
    const threads = await Thread.find(filter)
      .sort({ lastPostAt: -1, updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    const isAdmin = user ? (user as any).role === 'admin' : false

    const currentUserId = user ? ((user as any).userId || (user as any).id) : null
    const threadsWithPermissions = threads.map((thread: any) => ({
      ...thread,
      canDelete: isAdmin || (currentUserId && thread.authorId === currentUserId),
      canEdit: isAdmin || (currentUserId && thread.authorId === currentUserId),
    }))

    return {
      threads: threadsWithPermissions,
      isAdmin,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    }
  })
  .get('/threads/:id', async ({ params, query, set, user }) => {
    const thread = await Thread.findById(params.id).lean()
    if (!thread) {
      set.status = 404
      return { message: 'Not found' }
    }

    const { page: pageStr } = query as any
    const page = Math.max(1, Number(pageStr) || 1)
    const limit = 20

    const total = await Post.countDocuments({ threadId: thread._id })
    const posts = await Post.find({ threadId: thread._id })
      .sort({ createdAt: 1 }) // Or whatever sort. We will sort it in frontend for trees
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    const isAdmin = user ? (user as any).role === 'admin' : false

    const currentUserId = user ? ((user as any).userId || (user as any).id) : null
    const threadWithPermissions = {
      ...thread,
      canDelete: isAdmin || (currentUserId && thread.authorId === currentUserId),
      canEdit: isAdmin || (currentUserId && thread.authorId === currentUserId),
    }
    const postsWithPermissions = posts.map((post: any) => ({
      ...post,
      canDelete: isAdmin || (currentUserId && post.authorId === currentUserId),
    }))

    return {
      thread: threadWithPermissions,
      posts: postsWithPermissions,
      isAdmin,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    }
  })
  .post('/threads', async ({ body, user, set }) => {
    if (!user) {
      set.status = 401
      return { message: 'Unauthorized' }
    }
    const userId = (user as any).userId || (user as any).id
    const { realmId, title, body: threadBody, authorName } = body as any
    if (!title) {
      set.status = 400
      return { message: 'title required' }
    }

    const threadRealmId = realmId || 'global'

    const thread = await Thread.create({
      title: title.slice(0, 300),
      body: (threadBody || '').slice(0, 5000),
      authorId: userId,
      authorName: authorName || '',
      realmId: threadRealmId,
      postCount: 0,
      lastPostAt: new Date(),
    })

    set.status = 201
    return { thread }
  })
  .post('/threads/:id/posts', async ({ params, body, user, set }) => {
    if (!user) {
      set.status = 401
      return { message: 'Unauthorized' }
    }
    const userId = (user as any).userId || (user as any).id
    const thread = await Thread.findById(params.id)
    if (!thread) {
      set.status = 404
      return { message: 'Thread not found' }
    }

    const { body: postBody, authorName, parentPostId } = body as { body: string, authorName: string, parentPostId?: string }
    if (!postBody || !authorName) {
      set.status = 400
      return { message: 'Body and authorName are required' }
    }
    const post = await Post.create({
      threadId: thread._id,
      parentPostId: parentPostId || null,
      body: postBody.slice(0, 5000),
      authorId: userId,
      authorName: authorName.slice(0, 100),
    })

    await Thread.findByIdAndUpdate(thread._id, {
      $inc: { postCount: 1 },
      $set: { lastPostAt: new Date() },
    })

    set.status = 201
    return { post }
  })
  .delete('/threads/:id', async ({ params, user, set }) => {
    if (!user) {
      set.status = 401
      return { message: 'Unauthorized' }
    }
    const userId = (user as any).userId || (user as any).id
    const isAdmin = (user as any).role === 'admin'
    const thread = await Thread.findById(params.id)
    if (!thread) {
      set.status = 404
      return { message: 'Not found' }
    }
    if (thread.authorId !== userId && !isAdmin) {
      set.status = 403
      return { message: 'Forbidden' }
    }

    await Post.deleteMany({ threadId: thread._id })
    await Thread.deleteOne({ _id: thread._id })
    set.status = 204
    return
  })
  .patch('/threads/:id', async ({ params, body, user, set }) => {
    if (!user) {
      set.status = 401
      return { message: 'Unauthorized' }
    }
    const userId = (user as any).userId || (user as any).id
    const isAdmin = (user as any).role === 'admin'
    const thread = await Thread.findById(params.id)
    if (!thread) {
      set.status = 404
      return { message: 'Not found' }
    }
    if (thread.authorId !== userId && !isAdmin) {
      set.status = 403
      return { message: 'Forbidden' }
    }

    const { title, body: threadBody } = body as any
    const nextTitle = String(title || '').trim()
    if (!nextTitle) {
      set.status = 400
      return { message: 'title required' }
    }

    thread.title = nextTitle.slice(0, 300)
    thread.body = String(threadBody || '').slice(0, 5000)
    thread.lastPostAt = new Date()
    await thread.save()
    return { thread }
  })
  .post('/threads/:id/like', async ({ params, user, set }) => {
    if (!user) {
      set.status = 401
      return { message: 'Unauthorized' }
    }
    const userId = (user as any).userId || (user as any).id
    const thread = await Thread.findById(params.id)
    if (!thread) {
      set.status = 404
      return { message: 'Not found' }
    }

    const hasLiked = thread.likes?.includes(userId)
    if (hasLiked) {
      await Thread.findByIdAndUpdate(thread._id, { $pull: { likes: userId } })
    } else {
      await Thread.findByIdAndUpdate(thread._id, { $addToSet: { likes: userId } })
    }
    return { success: true, liked: !hasLiked }
  })
  .delete('/posts/:id', async ({ params, user, set }) => {
    if (!user) {
      set.status = 401
      return { message: 'Unauthorized' }
    }
    const userId = (user as any).userId || (user as any).id
    const isAdmin = (user as any).role === 'admin'
    const post = await Post.findById(params.id)
    if (!post) {
      set.status = 404
      return { message: 'Not found' }
    }
    if (post.authorId !== userId && !isAdmin) {
      set.status = 403
      return { message: 'Forbidden' }
    }

    await Post.deleteMany({ parentPostId: post._id })
    await Post.deleteOne({ _id: post._id })
    await Thread.findByIdAndUpdate(post.threadId, { $inc: { postCount: -1 } })
    set.status = 204
    return
  })
  .post('/posts/:id/like', async ({ params, user, set }) => {
    if (!user) {
      set.status = 401
      return { message: 'Unauthorized' }
    }
    const userId = (user as any).userId || (user as any).id
    const post = await Post.findById(params.id)
    if (!post) {
      set.status = 404
      return { message: 'Not found' }
    }

    const hasLiked = post.likes?.includes(userId)
    if (hasLiked) {
      await Post.findByIdAndUpdate(post._id, { $pull: { likes: userId } })
    } else {
      await Post.findByIdAndUpdate(post._id, { $addToSet: { likes: userId } })
    }
    return { success: true, liked: !hasLiked }
  })
