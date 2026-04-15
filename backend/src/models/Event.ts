import mongoose, { Document, Schema } from "mongoose";

export interface IEventAttendee {
  userId: string;
  username: string;
  status: "going" | "maybe" | "not_going";
}

export interface IEvent extends Document {
  eventId: string;
  realmId: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  createdBy: string;
  createdByName: string;
  attendees: IEventAttendee[];
  location: string;
  maxParticipants?: number;
  hostingMode?: "agora" | "external";
  roomIndex?: number;
  channelKey?: string;
  breakoutRooms?: {
    name: string;
    roomIndex: number;
    channelKey?: string;
    maxParticipants?: number;
  }[];
  reminder24hSentAt?: Date | null;
  reminder1hSentAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    eventId: { type: String, required: true, unique: true },
    realmId: { type: String, required: true },
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, default: "", maxlength: 2000 },
    startTime: { type: Date, required: true },
    endTime: {
      type: Date,
      required: true,
      validate: {
        validator(this: any, v: Date) {
          return v > this.startTime;
        },
        message: "endTime must be after startTime",
      },
    },
    createdBy: { type: String, required: true },
    createdByName: { type: String, default: "", maxlength: 100 },
    attendees: {
      type: [
        {
          userId: String,
          username: { type: String, maxlength: 100 },
          status: {
            type: String,
            enum: ["going", "maybe", "not_going"],
            default: "maybe",
          },
        },
      ],
      validate: [(v: any[]) => v.length <= 200, "Maximum 200 attendees"],
    },
    location: { type: String, default: "", maxlength: 300 },
    maxParticipants: { type: Number, min: 1 },
    hostingMode: { type: String, enum: ["agora", "external"], default: "agora" },
    roomIndex: { type: Number, min: 0, default: 0 },
    channelKey: { type: String, maxlength: 120, default: "" },
    breakoutRooms: {
      type: [
        {
          name: { type: String, required: true, maxlength: 80 },
          roomIndex: { type: Number, required: true, min: 0 },
          channelKey: { type: String, maxlength: 120, default: "" },
          maxParticipants: { type: Number, min: 1 },
        },
      ],
      default: [],
      validate: [(v: any[]) => v.length <= 10, "Maximum 10 breakout rooms"],
    },
    reminder24hSentAt: { type: Date, default: null },
    reminder1hSentAt: { type: Date, default: null },
  },
  { timestamps: true },
);

eventSchema.index({ realmId: 1, startTime: 1 });
eventSchema.index({ createdBy: 1 });

export default mongoose.model<IEvent>("Event", eventSchema);
