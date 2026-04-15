import mongoose, { Document, Schema } from 'mongoose'

export interface IThread extends Document {
  title: string
  body: string
  authorId: string
  authorName: string
  realmId: string
  postCount: number
  likes: string[]
  lastPostAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

const threadSchema = new Schema<IThread>(
  {
    title: { type: String, required: true, trim: true, maxlength: 300 },
    body: { type: String, default: '', maxlength: 5000 },
    authorId: { type: String, required: true },
    authorName: { type: String, required: true, maxlength: 100 },
    realmId: { type: String, required: true },
    postCount: { type: Number, default: 0 },
    likes: { type: [String], default: [] },
    lastPostAt: { type: Date },
  },
  { timestamps: true }
)

threadSchema.index({ realmId: 1, lastPostAt: -1, updatedAt: -1 })
threadSchema.index({ authorId: 1 })

export default mongoose.model<IThread>('Thread', threadSchema)
