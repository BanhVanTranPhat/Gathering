import mongoose, { Document, Schema } from 'mongoose'

export interface IChatChannel extends Document {
  realmId: string
  name: string
  type: 'channel' | 'dm'
  members: string[]
  createdBy: string
  createdAt: Date
}

const chatChannelSchema = new Schema<IChatChannel>(
  {
    realmId: { type: String, required: true, index: true },
    name: { type: String, required: true, maxlength: 50 },
    type: { type: String, enum: ['channel', 'dm'], required: true },
    members: [{ type: String }],
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
)

chatChannelSchema.index({ realmId: 1, type: 1 })
chatChannelSchema.index({ realmId: 1, members: 1 })

export default mongoose.model<IChatChannel>('ChatChannel', chatChannelSchema)
