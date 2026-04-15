import { Server } from 'socket.io'
import { JoinRealm, Disconnect, OnEventCallback, MovePlayer, Teleport, ChangedSkin, NewMessage, MediaState, CallRequest, CallResponse, StatusUpdate, TimerStatusUpdate, WhiteboardDraw, WhiteboardClear } from './socket-types'
import { z } from 'zod'
import { verifyToken } from '../utils/auth'
import { getRealmById, getProfileById } from '../realmService'
import { users } from '../Users'
import { sessionManager } from '../session'
import { removeExtraSpaces } from '../utils'
import { kickPlayer } from './helpers'
import { formatEmailToName } from '../utils'
import ChatMessage from '../models/ChatMessage'
import Profile from '../models/Profile'

const joiningInProgress = new Set<string>()

// Lobby chat (trang /chat) — in-memory, tối đa 100 tin
const LOBBY_MAX = 100
const lobbyMessages: { id: string; uid: string; username: string; message: string; timestamp: number }[] = []
const lobbyUsers: Record<string, { uid: string; username: string }> = {}
let lobbyIdCounter = 0

function protectConnection(io: Server) {
    io.use(async (socket, next) => {
        const access_token = socket.handshake.headers['authorization']?.split(' ')[1]
        const uid = socket.handshake.query.uid as string
        if (!access_token || !uid) {
            const error = new Error("Invalid access token or uid.")
            return next(error)
        }
        const user = verifyToken(access_token)
        if (!user || user.id !== uid) {
            return next(new Error("Invalid access token or uid."))
        }
        users.addUser(uid, user)
        next()
    })
}


export function sockets(io: Server) {
    protectConnection(io)

    // Handle a connection
    io.on('connection', (socket) => {

        function on(eventName: string, schema: z.ZodTypeAny, callback: OnEventCallback) {
            socket.on(eventName, (data: any) => {
                const success = schema.safeParse(data).success
                if (!success) return

                const session = sessionManager.getPlayerSession(socket.handshake.query.uid as string)
                if (!session) {
                    return
                }
                callback({ session, data })
            })
        }

        function emit(eventName: string, data: any) {
            const session = sessionManager.getPlayerSession(socket.handshake.query.uid as string)
            if (!session) {
                return
            }

            const room = session.getPlayerRoom(socket.handshake.query.uid as string)
            const players = session.getPlayersInRoom(room)

            for (const player of players) {
                if (player.socketId === socket.id) continue

                io.to(player.socketId).emit(eventName, data)
            }
        }

        function emitToSocketIds(socketIds: string[], eventName: string, data: any) {
            for (const socketId of socketIds) {
                io.to(socketId).emit(eventName, data)
            }
        }

        socket.on('joinRealm', async (realmData: z.infer<typeof JoinRealm>) => {
            const uid = socket.handshake.query.uid as string
            const rejectJoin = (reason: string) => {
                socket.emit('failedToJoinRoom', reason)
                joiningInProgress.delete(uid)
            }

            try {

            if (JoinRealm.safeParse(realmData).success === false) {
                return rejectJoin('Invalid request data.')
            }

            if (joiningInProgress.has(uid)) {
                return rejectJoin('Already joining a space.')
            }
            joiningInProgress.add(uid)

            const session = sessionManager.getSession(realmData.realmId)
            if (session) {
                const playerCount = session.getPlayerCount()
                if (playerCount >= 30) {
                    return rejectJoin("Space is full. It's 30 players max.")
                } 
            }

            const realm = await getRealmById(realmData.realmId)
            if (!realm) {
                return rejectJoin('Space not found.')
            }
            const profile = await getProfileById(uid)
            if (!profile) {
                return rejectJoin('Failed to get profile.')
            }

            const data = realm
            const canonicalRealmId = realm.id

            const join = async () => {
                const mapData = data.map_data != null ? data.map_data as any : {
                    spawnpoint: { roomIndex: 0, x: 0, y: 0 },
                    rooms: [{ name: 'New Room', tilemap: {} }],
                }
                if (!sessionManager.getSession(canonicalRealmId)) {
                    sessionManager.createSession(canonicalRealmId, mapData)
                }

                const currentSession = sessionManager.getPlayerSession(uid)
                if (currentSession) {
                    kickPlayer(uid, 'You have logged in from another location.')
                }

                const user = users.getUser(uid)!
                const email = user.user_metadata?.email ?? user.email ?? ''
                const username = (profile as any).displayName?.trim() || formatEmailToName(email)
                sessionManager.addPlayerToSession(socket.id, canonicalRealmId, uid, username, profile.skin || '009', (profile as any).avatarConfig || null)
                const newSession = sessionManager.getPlayerSession(uid)
                const player = newSession.getPlayer(uid)

                const savedPos = (profile as any).lastPositions?.get?.(canonicalRealmId) ?? (profile as any).lastPositions?.[canonicalRealmId]
                if (savedPos && typeof savedPos.x === 'number' && typeof savedPos.y === 'number') {
                    const roomIdx = typeof savedPos.room === 'number' ? savedPos.room : mapData.spawnpoint.roomIndex
                    if (roomIdx !== player.room) {
                        newSession.changeRoom(uid, roomIdx, savedPos.x, savedPos.y)
                    } else {
                        newSession.movePlayer(uid, savedPos.x, savedPos.y)
                    }
                }

                socket.join(canonicalRealmId)
                socket.emit('joinedRealm', {
                    savedPosition: savedPos ? { x: player.x, y: player.y, room: player.room } : null
                })
                emit('playerJoinedRoom', player)
                joiningInProgress.delete(uid)
            }

            if (data.owner_id === socket.handshake.query.uid) {
                return join()
            }

            if (data.only_owner) {
                return rejectJoin('This realm is private right now. Come back later!')
            }

            if (data.share_id === realmData.shareId) {
                return join()
            } else {
                return rejectJoin('The share link has been changed.')
            }

            } catch (err) {
                console.error('joinRealm error:', err)
                rejectJoin('Internal server error.')
            }
        })

        on('disconnect', Disconnect, ({ session, data }) => {
            const uid = socket.handshake.query.uid as string
            const player = session.getPlayer(uid)
            if (player) {
                const realmId = session.id
                Profile.findOneAndUpdate(
                    { id: uid },
                    { $set: { [`lastPositions.${realmId}`]: { x: player.x, y: player.y, room: player.room } } },
                    { upsert: false }
                ).catch(() => {})
            }
            const socketIds = sessionManager.getSocketIdsInRoom(session.id, session.getPlayerRoom(uid))
            const success = sessionManager.logOutBySocketId(socket.id)
            if (success) {
                emitToSocketIds(socketIds, 'playerLeftRoom', uid)
                users.removeUser(uid)
            }
        })

        on('movePlayer', MovePlayer, ({ session, data }) => {  
            const player = session.getPlayer(socket.handshake.query.uid as string)
            const changedPlayers = session.movePlayer(player.uid, data.x, data.y)

            emit('playerMoved', {
                uid: player.uid,
                x: player.x,
                y: player.y
            })

            for (const uid of changedPlayers) {
                const changedPlayerData = session.getPlayer(uid)

                emitToSocketIds([changedPlayerData.socketId], 'proximityUpdate', {
                    proximityId: changedPlayerData.proximityId
                })
            }
        })  

        on('teleport', Teleport, ({ session, data }) => {
            const uid = socket.handshake.query.uid as string
            const player = session.getPlayer(uid)
            if (player.room !== data.roomIndex) {
                emit('playerLeftRoom', uid)
                const session = sessionManager.getPlayerSession(uid)
                const changedPlayers = session.changeRoom(uid, data.roomIndex, data.x, data.y)
                emit('playerJoinedRoom', player)

                for (const uid of changedPlayers) {
                    const changedPlayerData = session.getPlayer(uid)

                    emitToSocketIds([changedPlayerData.socketId], 'proximityUpdate', {
                        proximityId: changedPlayerData.proximityId
                    })
                }
            } else {
                const changedPlayers = session.movePlayer(player.uid, data.x, data.y)
                emit('playerTeleported', { uid, x: player.x, y: player.y })

                for (const uid of changedPlayers) {
                    const changedPlayerData = session.getPlayer(uid)

                    emitToSocketIds([changedPlayerData.socketId], 'proximityUpdate', {
                        proximityId: changedPlayerData.proximityId
                    })
                }
            }
        })

        on('changedSkin', ChangedSkin, ({ session, data }) => {
            const uid = socket.handshake.query.uid as string
            const player = session.getPlayer(uid)
            player.skin = data
            emit('playerChangedSkin', { uid, skin: player.skin })
        })

        on('sendMessage', NewMessage, ({ session, data }) => {
            // cannot exceed 300 characters
            if (data.length > 300 || data.trim() === '') return

            const message = removeExtraSpaces(data)

            const uid = socket.handshake.query.uid as string
            emit('receiveMessage', { uid, message })
        })

        on('mediaState', MediaState, ({ session, data }) => {
            const uid = socket.handshake.query.uid as string
            emit('remoteMediaState', { uid, micOn: data.micOn, camOn: data.camOn })
        })

        on('statusUpdate', StatusUpdate, ({ session, data }) => {
            const uid = socket.handshake.query.uid as string
            emit('remoteStatusUpdate', { uid, status: data.status })
        })

        on('timerStatusUpdate', TimerStatusUpdate, ({ session, data }) => {
            const uid = socket.handshake.query.uid as string
            emit('remoteTimerStatusUpdate', { uid, active: data.active })
        })

        on('whiteboardDraw', WhiteboardDraw, ({ session, data }) => {
            emit('whiteboardDraw', data)
        })

        on('whiteboardClear', WhiteboardClear, ({ session, data }) => {
            emit('whiteboardClear', data)
        })

        socket.on('callRequest', (data: { targetUid: string }) => {
            if (!data?.targetUid) return
            const uid = socket.handshake.query.uid as string
            const session = sessionManager.getPlayerSession(uid)
            if (!session) return
            const caller = session.getPlayer(uid)
            const target = session.getPlayer(data.targetUid)
            if (!caller || !target) return
            io.to(target.socketId).emit('callRequest', {
                fromUid: uid,
                fromUsername: caller.username,
                proximityId: caller.proximityId,
            })
        })

        socket.on('callResponse', (data: { callerUid: string; accept: boolean }) => {
            if (!data?.callerUid) return
            const uid = socket.handshake.query.uid as string
            const session = sessionManager.getPlayerSession(uid)
            if (!session) return
            const caller = session.getPlayer(data.callerUid)
            const responder = session.getPlayer(uid)
            if (!caller || !responder) return
            if (data.accept) {
                const proximityId = caller.proximityId || responder.proximityId
                io.to(caller.socketId).emit('callAccepted', { proximityId, byUid: uid, byUsername: responder.username })
                io.to(responder.socketId).emit('callAccepted', { proximityId, byUid: uid, byUsername: responder.username })
            } else {
                io.to(caller.socketId).emit('callRejected', { byUid: uid, byUsername: responder.username })
            }
        })

        // ─── Realm chat (persistent channels + DMs) ─────────────────────────
        socket.on('joinChatChannel', async (channelId: string) => {
            if (typeof channelId !== 'string') return
            try {
                const uid = socket.handshake.query.uid as string
                const channel = await (await import('../models/ChatChannel')).default.findById(channelId).lean()
                if (!channel) return
                if (channel.type === 'dm' && !channel.members.includes(uid)) return
                socket.join(`chat:${channelId}`)
            } catch {}
        })

        socket.on('leaveChatChannel', (channelId: string) => {
            if (typeof channelId !== 'string') return
            socket.leave(`chat:${channelId}`)
        })

        socket.on('chatMessage', async (data: { channelId: string; content: string; senderName: string }) => {
            if (!data?.channelId || !data?.content) return
            const content = data.content.trim().slice(0, 500)
            if (!content) return

            const uid = socket.handshake.query.uid as string
            const msg = await ChatMessage.create({
                channelId: data.channelId,
                senderId: uid,
                senderName: data.senderName || uid.slice(0, 8),
                content,
                timestamp: new Date(),
            })

            io.to(`chat:${data.channelId}`).emit('chatMessageReceived', {
                _id: msg._id,
                channelId: msg.channelId,
                senderId: msg.senderId,
                senderName: msg.senderName,
                content: msg.content,
                timestamp: msg.timestamp,
            })
        })

        socket.on('chatTyping', (data: { channelId: string; username: string }) => {
            if (!data?.channelId || !data?.username) return
            socket.to(`chat:${data.channelId}`).emit('chatUserTyping', {
                channelId: data.channelId,
                username: data.username,
            })
        })

        // ─── Lobby chat (trang /chat, không cần join realm) ─────────────────
        socket.on('joinLobby', (data: { displayName?: string } = {}) => {
            const uid = socket.handshake.query.uid as string
            const u = users.getUser(uid)
            const username = (data?.displayName && data.displayName.trim()) || (u ? (u.user_metadata?.displayName || formatEmailToName(u.email || '')) : uid.slice(0, 8))
            socket.join('lobby')
            lobbyUsers[socket.id] = { uid, username }
            socket.emit('lobbyHistory', lobbyMessages.slice(-LOBBY_MAX))
        })

        socket.on('sendLobbyMessage', (data: { message?: string }) => {
            const msg = typeof data?.message === 'string' ? data.message.trim() : ''
            if (!msg || msg.length > 300) return
            const uid = socket.handshake.query.uid as string
            const info = lobbyUsers[socket.id]
            const username = info?.username || uid.slice(0, 8)
            const item = { id: `lobby-${++lobbyIdCounter}`, uid, username, message: msg, timestamp: Date.now() }
            lobbyMessages.push(item)
            if (lobbyMessages.length > LOBBY_MAX) lobbyMessages.shift()
            io.to('lobby').emit('lobbyMessage', item)
        })

        socket.on('disconnect', () => {
            delete lobbyUsers[socket.id]
        })
    })
}