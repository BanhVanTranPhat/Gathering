import mongoose, { Document, Schema } from 'mongoose'

export interface IChatMessage extends Document {
  channelId: mongoose.Types.ObjectId
  senderId: string
  senderName: string
  content: string
  timestamp: Date
}

const chatMessageSchema = new Schema<IChatMessage>({
  channelId: { type: Schema.Types.ObjectId, ref: 'ChatChannel', required: true, index: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  content: { type: String, required: true, maxlength: 500 },
  timestamp: { type: Date, default: Date.now, index: true },
})

chatMessageSchema.index({ channelId: 1, timestamp: -1 })

export default mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema)
