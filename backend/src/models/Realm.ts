import mongoose, { Document, Schema } from 'mongoose'

export interface IRealm extends Document {
  _id: mongoose.Types.ObjectId
  id?: string
  owner_id: string
  name: string
  map_data?: unknown
  mapTemplate?: string
  share_id?: string
  only_owner?: boolean
  createdAt?: Date
  updatedAt?: Date
}

const realmSchema = new Schema<IRealm>(
  {
    id: { type: String, sparse: true, unique: true },
    owner_id: { type: String, required: true },
    name: { type: String, required: true, maxlength: 200 },
    map_data: { type: Schema.Types.Mixed },
    mapTemplate: { type: String, default: 'office' },
    share_id: { type: String, sparse: true, index: true },
    only_owner: { type: Boolean, default: false },
  },
  { timestamps: true, _id: true }
)

realmSchema.index({ owner_id: 1 })

export default mongoose.model<IRealm>('Realm', realmSchema)
