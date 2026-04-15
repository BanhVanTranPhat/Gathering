import mongoose, { Document, Schema } from "mongoose";

export interface IService extends Document {
  title: string;
  category: string;
  description: string;
  contactEmail?: string;
  contactPhone?: string;
  contactUrl?: string;
  tags: string[];
  realmId?: string | null;
  createdBy: string;
  createdByName: string;
  isApproved: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const serviceSchema = new Schema<IService>(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
      index: true,
    },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    contactEmail: { type: String, trim: true, maxlength: 200, default: "" },
    contactPhone: { type: String, trim: true, maxlength: 60, default: "" },
    contactUrl: { type: String, trim: true, maxlength: 500, default: "" },
    tags: { type: [String], default: [] },
    realmId: { type: String, default: null },
    createdBy: { type: String, required: true, index: true },
    createdByName: { type: String, default: "", maxlength: 100 },
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true },
);

serviceSchema.index({
  title: "text",
  description: "text",
  category: "text",
  tags: "text",
});
serviceSchema.index({ realmId: 1, createdAt: -1 });

export default mongoose.model<IService>("Service", serviceSchema);
