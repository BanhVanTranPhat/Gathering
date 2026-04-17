import mongoose, { Document, Schema } from 'mongoose'

export interface IProfile extends Document {
  id: string
  gender?: 'male' | 'female'
  skin?: string
  avatar?: string
  avatarConfig?: Record<string, string>
  displayName?: string
  bio?: string
  visited_realms?: string[]
  lastPositions?: Map<string, { x: number; y: number; room: number }>
  updatedAt?: Date
}

const profileSchema = new Schema<IProfile>(
  {
    id: { type: String, required: true, unique: true },
    gender: { type: String, enum: ['male', 'female'], default: 'male' },
    skin: { type: String },
    avatar: { type: String },
    avatarConfig: { type: Schema.Types.Mixed },
    displayName: { type: String, maxlength: 100 },
    bio: { type: String, default: '', maxlength: 500 },
    visited_realms: { type: [String], default: [], validate: [(v: string[]) => v.length <= 500, 'Too many visited realms'] },
    lastPositions: { type: Map, of: new Schema({ x: Number, y: Number, room: Number }, { _id: false }), default: new Map() },
  },
  { timestamps: true }
)

profileSchema.index({ visited_realms: 1 })

export default mongoose.model<IProfile>('Profile', profileSchema)
