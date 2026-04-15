import mongoose, { Document, Schema } from 'mongoose'

export interface IPost extends Document {
  threadId: mongoose.Types.ObjectId
  parentPostId?: string
  body: string
  authorId: string
  authorName: string
  likes: string[]
  createdAt?: Date
  updatedAt?: Date
}

const postSchema = new Schema<IPost>(
  {
    threadId: { type: Schema.Types.ObjectId, ref: 'Thread', required: true, index: true },
    parentPostId: { type: String, default: null, index: true },
    body: { type: String, required: true, maxlength: 5000 },
    authorId: { type: String, required: true },
    authorName: { type: String, required: true, maxlength: 100 },
    likes: { type: [String], default: [] },
  },
  { timestamps: true }
)

postSchema.index({ threadId: 1, createdAt: 1 })
postSchema.index({ authorId: 1 })

export default mongoose.model<IPost>('Post', postSchema)
