import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export interface JwtPayload {
  userId: string
  email?: string
  displayName?: string
  [key: string]: unknown
}

export function verifyToken(accessToken: string): { id: string; user_metadata: { email?: string; displayName?: string }; email?: string } | null {
  try {
    const decoded = jwt.verify(accessToken, JWT_SECRET) as unknown as JwtPayload
    const userId = (decoded as any).userId || (decoded as any).id || (decoded as any).sub
    if (!userId) return null
    return {
      id: userId,
      email: decoded.email,
      user_metadata: { email: decoded.email, displayName: decoded.displayName },
    }
  } catch {
    return null
  }
}
