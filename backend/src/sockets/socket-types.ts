import { z } from 'zod'
import { Session } from '../session'

export const JoinRealm = z.object({
    realmId: z.string(),
    shareId: z.string(),
})

export const Disconnect = z.any()

export const MovePlayer = z.object({
    x: z.number(),
    y: z.number(),
})

export const Teleport = z.object({
    x: z.number(),
    y: z.number(),
    roomIndex: z.number(),
})

export const ChangedSkin = z.string()

export const NewMessage = z.string()

export const MediaState = z.object({
    micOn: z.boolean(),
    camOn: z.boolean(),
})

export const CallRequest = z.object({
    targetUid: z.string(),
})

export const CallResponse = z.object({
    callerUid: z.string(),
    accept: z.boolean(),
})

export const StatusUpdate = z.object({
    status: z.enum(['active', 'busy', 'away']),
})

export const TimerStatusUpdate = z.object({
    active: z.boolean(),
})

export const WhiteboardDraw = z.object({
    p1: z.object({ x: z.number(), y: z.number() }),
    p2: z.object({ x: z.number(), y: z.number() }),
    color: z.string(),
    size: z.number(),
    zoneId: z.string().optional(),
})

export const WhiteboardClear = z.object({
    zoneId: z.string().optional(),
})

export type OnEventCallback = (args: { session: Session, data?: any }) => void