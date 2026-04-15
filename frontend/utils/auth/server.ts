/**
 * Server auth: đọc token từ cookie và gọi backend (Express + MongoDB).
 */
import { cookies } from 'next/headers'
import { serverRequest } from '@/utils/backend/serverRequest'

const TOKEN_KEY = 'gathering_token'

async function getServerToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(TOKEN_KEY)?.value ?? null
}

async function request<T = any>(path: string, token: string | null, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    const { response, data } = await serverRequest(path, {
      method: options.method || 'GET',
      headers,
      body: options.body != null ? JSON.stringify(options.body) : undefined,
    })

    if (!response) {
      throw new Error('Cannot reach backend. Start it with: npm run dev (in backend folder).')
    }
    if (!response.ok) {
      const message =
        data && typeof data === 'object' && 'message' in data
          ? String((data as { message?: unknown }).message || response.statusText)
          : response.statusText
      throw new Error(message)
    }

    return data as T
  } catch (e: any) {
    throw e
  }
}

export async function createClient() {
  const token = await getServerToken()

  return {
    auth: {
      async getSession() {
        if (!token) return { data: { session: null } }
        try {
          const user = await request<{ id: string; email?: string; [key: string]: any }>('/auth/me', token)
          return { data: { session: { access_token: token, user: { id: user.id, email: user.email, user_metadata: user } } } }
        } catch {
          return { data: { session: null } }
        }
      },
      async getUser(_accessToken?: string) {
        const t = _accessToken || token
        if (!t) return { data: { user: null }, error: { message: 'No token' } }
        try {
          const user = await request<{ id: string; email?: string; [key: string]: any }>('/auth/me', t)
          return { data: { user: { id: user.id, email: user.email, user_metadata: user } }, error: null }
        } catch (e: any) {
          return { data: { user: null }, error: { message: e?.message || 'Invalid token' } }
        }
      },
    },
    from(table: string) {
      let path = table === 'realms' ? '/realms' : '/profiles/me'
      let id: string | null = null
      let method = 'GET'
      let body: any = undefined

      const run = () => request(path, token, { method, body })

      return {
        select(_cols?: string) {
          return this
        },
        eq(col: string, val: string) {
          if (col === 'id') id = val
          if (table === 'realms' && col === 'id') path = `/realms/${val}`
          if (table === 'realms' && col === 'share_id') path = `/realms/by-share/${val}`
          return this
        },
        single: async () => {
          try {
            const data = await run()
            return { data: Array.isArray(data) ? data[0] : data, error: null }
          } catch (e: any) {
            return { data: null, error: { message: e?.message || 'Request failed' } }
          }
        },
        insert(obj: any) {
          method = 'POST'
          body = table === 'realms' ? { name: obj.name, map_data: obj.map_data } : obj
          path = table === 'realms' ? '/realms' : '/profiles/me'
          return this
        },
        update(obj: any) {
          method = 'PATCH'
          body = obj
          if (table === 'realms' && id) path = `/realms/${id}`
          return this
        },
        then(resolve: (r: any) => any, reject?: (e: any) => void) {
          return run()
            .then((d: any) => {
              let result = d
              if (method === 'POST') result = Array.isArray(d) ? d : [d]
              else if (method === 'GET' && table === 'realms' && d && !Array.isArray(d) && Array.isArray(d.realms)) result = d.realms
              return resolve({ data: result, error: null })
            })
            .catch((e) => (reject ? reject(e) : resolve({ data: null, error: { message: e?.message || 'Request failed' } })))
        },
      }
    },
  }
}
