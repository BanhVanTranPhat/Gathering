import { sessionManager } from '../session'
import { io } from '../elysia'

export function kickPlayer(uid: string, reason: string) {
    const session = sessionManager.getPlayerSession(uid)
    if (!session) return

    const player = session.getPlayer(uid)
    if (!player) return

    const room = session.getPlayerRoom(uid)
    const players = session.getPlayersInRoom(room)

    for (const p of players) {
        if (p.uid === uid) {
            io.to(p.socketId).emit('kicked', reason)
        } else {
            io.to(p.socketId).emit('playerLeftRoom', uid)
        }
    }

    const oldSocketId = player.socketId

    // Remove from session BEFORE disconnecting socket to prevent the
    // disconnect handler from firing and removing the user from the users store
    sessionManager.logOutPlayer(uid)

    const oldSocket = io.sockets.sockets.get(oldSocketId)
    if (oldSocket) {
        oldSocket.leave(session.id)
        oldSocket.disconnect(true)
    }
}