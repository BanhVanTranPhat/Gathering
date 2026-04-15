import mongoose, { Document, Schema } from 'mongoose'
import bcrypt from 'bcryptjs'

export type UserRole = 'user' | 'admin'

export interface IUser extends Document {
  email: string
  password?: string
  displayName?: string
  googleId?: string
  avatar?: string
  role: UserRole
  createdAt?: Date
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    password: { type: String, required: false, minlength: 6 },
    displayName: { type: String, trim: true, maxlength: 100 },
    googleId: { type: String, unique: true, sparse: true },
    avatar: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true }
)

userSchema.index({ createdAt: -1 })

export default mongoose.model<IUser>('User', userSchema)

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10)
}

export async function comparePassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash)
}
