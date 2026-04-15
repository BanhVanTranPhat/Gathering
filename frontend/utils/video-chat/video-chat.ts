import signal from '../signal'
import { generateToken } from './generateToken'
import { getToken } from '../backendApi'

let AgoraRTC: any = null

const MAX_CALL_PARTICIPANTS = 20
const MAX_CALL_DURATION_SECONDS = 20 * 60

async function getAgoraRTC() {
    if (!AgoraRTC) {
        const mod = await import('agora-rtc-sdk-ng')
        AgoraRTC = mod.default || mod
    }
    return AgoraRTC
}

function simpleHash(input: string): string {
    let hash = 0
    for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash |= 0
    }
    return Math.abs(hash).toString(16).padStart(8, '0').substring(0, 16)
}

export class VideoChat {
    private client: any = null
    private microphoneTrack: any = null
    private cameraTrack: any = null
    private currentChannel: string = ''

    private remoteUsers: { [uid: string]: any } = {}

    private channelTimeout: NodeJS.Timeout | null = null
    private initialized = false

    private callStartAt: number | null = null
    private callDurationTimer: NodeJS.Timeout | null = null

    private async ensureInit() {
        if (this.initialized) return
        const agora = await getAgoraRTC()
        agora.setLogLevel(4)
        this.client = agora.createClient({ codec: "vp8", mode: "rtc" })
        this.client.on('user-published', this.onUserPublished)
        this.client.on('user-unpublished', this.onUserUnpublished)
        this.client.on('user-left', this.onUserLeft)
        this.client.on('user-info-updated', this.onUserInfoUpdated)
        this.client.on('user-joined', this.onUserJoined)
        this.initialized = true
    }

    private onUserInfoUpdated = (uid: string) => {
        if (!this.remoteUsers[uid]) return
        signal.emit('user-info-updated', this.remoteUsers[uid])
    }

    private onUserJoined = (user: any) => {
        this.remoteUsers[user.uid] = user
        signal.emit('user-info-updated', user)
        this.enforceParticipantLimit()
    }

    public onUserPublished = async (user: any, mediaType: "audio" | "video" | "datachannel", config?: any) => {
        this.remoteUsers[user.uid] = user
        await this.client.subscribe(user, mediaType)

        if (mediaType === 'audio') {
            user.audioTrack?.play()
        }

        if (mediaType === 'video' && user.videoTrack) {
            signal.emit('remoteVideoPublished', {
                agoraUid: String(user.uid),
                track: user.videoTrack,
            })
        }

        if (mediaType === 'audio' || mediaType === 'video') {
            signal.emit('user-info-updated', user)
        }
    }

    public onUserUnpublished = (user: any, mediaType: "audio" | "video" | "datachannel") => {
        if (mediaType === 'audio') {
            user.audioTrack?.stop()
        }
        if (mediaType === 'video') {
            signal.emit('remoteVideoUnpublished', { agoraUid: String(user.uid) })
        }
    }

    public onUserLeft = (user: any, reason: string) => {
        delete this.remoteUsers[user.uid]
        signal.emit('user-left', user)
    }

    private enforceParticipantLimit() {
        const participantCount = 1 + Object.keys(this.remoteUsers).length
        if (participantCount > MAX_CALL_PARTICIPANTS) {
            signal.emit('callTooManyParticipants', {
                participantCount,
                maxParticipants: MAX_CALL_PARTICIPANTS,
            })
            this.leaveChannel()
        }
    }

    public async toggleCamera(): Promise<MediaStreamTrack | null> {
        await this.ensureInit()
        const agora = await getAgoraRTC()

        if (!this.cameraTrack) {
            this.cameraTrack = await agora.createCameraVideoTrack()

            if (this.client.connectionState === 'CONNECTED') {
                await this.client.publish([this.cameraTrack])
            }

            return this.cameraTrack.getMediaStreamTrack()
        }

        await this.cameraTrack.setEnabled(!this.cameraTrack.enabled)

        if (this.client.connectionState === 'CONNECTED') {
            if (this.cameraTrack.enabled) {
                await this.client.publish([this.cameraTrack])
            } else {
                await this.client.unpublish([this.cameraTrack])
            }
        }

        return this.cameraTrack.enabled ? this.cameraTrack.getMediaStreamTrack() : null
    }

    public getLocalCameraMediaStreamTrack(): MediaStreamTrack | null {
        if (this.cameraTrack && this.cameraTrack.enabled) {
            return this.cameraTrack.getMediaStreamTrack()
        }
        return null
    }

    public async toggleMicrophone() {
        await this.ensureInit()
        const agora = await getAgoraRTC()

        if (!this.microphoneTrack) {
            this.microphoneTrack = await agora.createMicrophoneAudioTrack()

            if (this.client.connectionState === 'CONNECTED') {
                await this.client.publish([this.microphoneTrack])
            }

            return false
        }
        await this.microphoneTrack.setMuted(!this.microphoneTrack.muted)

        return this.microphoneTrack.muted
    }

    public get isCameraEnabled(): boolean {
        return !!this.cameraTrack && this.cameraTrack.enabled
    }

    public get isMicEnabled(): boolean {
        return !!this.microphoneTrack && !this.microphoneTrack.muted
    }

    public getRemoteVideoTracks(): { uid: string; track: any }[] {
        return Object.entries(this.remoteUsers)
            .filter(([, user]) => (user as any).videoTrack)
            .map(([, user]) => ({ uid: String((user as any).uid), track: (user as any).videoTrack }))
    }

    public playVideoTrackAtElementId(elementId: string) {
        if (this.cameraTrack) {
            this.cameraTrack.play(elementId)
        }
    }

    private resetRemoteUsers() {
        this.remoteUsers = {}
        signal.emit('reset-users')
    }

    public async joinChannel(channel: string, uid: string, realmId: string) {
        await this.ensureInit()

        if (this.channelTimeout) {
            clearTimeout(this.channelTimeout)
        }

        this.channelTimeout = setTimeout(async () => {
            const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID
            if (!appId) {
                console.warn('[VideoChat] NEXT_PUBLIC_AGORA_APP_ID not set – skipping Agora channel join')
                return
            }
            if (channel === this.currentChannel) return

            const uniqueChannelId = this.createUniqueChannelId(realmId, channel)

            let token: string | null = null
            try {
                token = await generateToken(uniqueChannelId, getToken())
            } catch {}

            if (this.client.connectionState === 'CONNECTED') {
                await this.client.leave()
            }
            this.resetRemoteUsers()

            await this.client.join(appId, uniqueChannelId, token, uid)
            this.currentChannel = channel

            if (this.callDurationTimer) {
                clearInterval(this.callDurationTimer)
            }
            this.callStartAt = Date.now()
            this.callDurationTimer = setInterval(() => {
                if (!this.callStartAt) return
                const elapsedSec = Math.floor((Date.now() - this.callStartAt) / 1000)
                if (elapsedSec >= MAX_CALL_DURATION_SECONDS) {
                    if (this.callDurationTimer) {
                        clearInterval(this.callDurationTimer)
                        this.callDurationTimer = null
                    }
                    this.callStartAt = null
                    signal.emit('callTimedOut', {
                        maxDurationSeconds: MAX_CALL_DURATION_SECONDS,
                    })
                    this.leaveChannel()
                }
            }, 1000)

            if (this.microphoneTrack && this.microphoneTrack.enabled) {
                await this.client.publish([this.microphoneTrack])
            }
            if (this.cameraTrack && this.cameraTrack.enabled) {
                await this.client.publish([this.cameraTrack])
            }
        }, 1000)
    }

    public async leaveChannel() {
        if (this.channelTimeout) {
            clearTimeout(this.channelTimeout)
        }

        if (this.callDurationTimer) {
            clearInterval(this.callDurationTimer)
            this.callDurationTimer = null
        }
        this.callStartAt = null

        this.channelTimeout = setTimeout(async () => {
            if (this.currentChannel === '') return

            if (this.client && this.client.connectionState === 'CONNECTED') {
                await this.client.leave()
                this.currentChannel = ''
            }
            this.resetRemoteUsers()
        }, 1000)
        
    }

    public destroy() {
        if (this.callDurationTimer) {
            clearInterval(this.callDurationTimer)
            this.callDurationTimer = null
        }
        this.callStartAt = null
        if (this.cameraTrack) {
            this.cameraTrack.stop()
            this.cameraTrack.close()
        }
        if (this.microphoneTrack) {
            this.microphoneTrack.stop()
            this.microphoneTrack.close()
        }
        this.microphoneTrack = null
        this.cameraTrack = null
    }

    private createUniqueChannelId(realmId: string, channel: string): string {
        const combined = `${realmId}-${channel}`
        return simpleHash(combined)
    }
}

export const videoChat = new VideoChat()
