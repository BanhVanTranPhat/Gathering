'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import signal from '@/utils/signal'
import { videoChat } from '@/utils/video-chat/video-chat'
import {
    X, Minus, Maximize2, Minimize2, Users, PhoneOff,
    GripHorizontal, Mic, MicOff, Video, VideoOff,
} from 'lucide-react'

type CallInfo = {
    zoneId: string
    zoneName: string
    realmId: string
}

const MAX_CALL_PARTICIPANTS = 20
const MAX_CALL_DURATION_SECONDS = 20 * 60

type GroupCallPanelProps = {
    username: string
    realmId: string
}

type RemoteStream = {
    uid: string
    track: MediaStreamTrack | null
}

type PanelSize = 'normal' | 'large'

const PANEL_SIZES: Record<PanelSize, { w: number; h: number }> = {
    normal: { w: 480, h: 400 },
    large: { w: 680, h: 520 },
}

function VideoTile({ stream, label, muted }: { stream: MediaStreamTrack | null; label: string; muted?: boolean }) {
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        const video = videoRef.current
        if (!video || !stream) return
        video.srcObject = new MediaStream([stream])
        video.play().catch(() => {})
        return () => { video.srcObject = null }
    }, [stream])

    return (
        <div className="relative bg-[#13152a] rounded-lg overflow-hidden flex items-center justify-center min-h-0">
            {stream ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={muted}
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-[#6C72CB]/30 flex items-center justify-center text-white text-2xl font-bold">
                        {label.charAt(0).toUpperCase()}
                    </div>
                </div>
            )}
            <div className="absolute bottom-1.5 left-1.5 bg-black/50 backdrop-blur-sm rounded px-2 py-0.5">
                <span className="text-white text-[11px] font-medium">{label}</span>
            </div>
        </div>
    )
}

const GroupCallPanel: React.FC<GroupCallPanelProps> = ({ username, realmId }) => {
    const [callInfo, setCallInfo] = useState<CallInfo | null>(null)
    const [minimized, setMinimized] = useState(false)
    const [panelSize, setPanelSize] = useState<PanelSize>('normal')
    const [elapsed, setElapsed] = useState(0)
    const [micOn, setMicOn] = useState(false)
    const [camOn, setCamOn] = useState(false)
    const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([])
    const [localTrack, setLocalTrack] = useState<MediaStreamTrack | null>(null)
    const [dragging, setDragging] = useState(false)
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const dragStartRef = useRef<{ mouseX: number; mouseY: number; panelX: number; panelY: number } | null>(null)

    function leaveCall() {
        signal.emit('leaveGroupCall')
    }

    const toggleMic = useCallback(async () => {
        const newMicOn = !micOn
        setMicOn(newMicOn)
        signal.emit('localMediaState', { micOn: newMicOn, camOn })
    }, [micOn, camOn])

    const toggleCam = useCallback(async () => {
        const newCamOn = !camOn
        setCamOn(newCamOn)
        signal.emit('localMediaState', { micOn, camOn: newCamOn })
    }, [micOn, camOn])

    useEffect(() => {
        const onJoin = (data: CallInfo) => {
            setCallInfo(data)
            setElapsed(0)
            setMinimized(false)
            setPosition(null)

            setLocalTrack(videoChat.getLocalCameraMediaStreamTrack())
            setCamOn(videoChat.isCameraEnabled)
            setMicOn(videoChat.isMicEnabled)

            const existing = videoChat.getRemoteVideoTracks()
            setRemoteStreams(existing.map(r => {
                try {
                    return { uid: r.uid, track: r.track.getMediaStreamTrack() }
                } catch { return { uid: r.uid, track: null } }
            }))
        }

        const onLeave = () => {
            setCallInfo(null)
            setRemoteStreams([])
            setLocalTrack(null)
            setElapsed(0)
            setMinimized(false)
            if (timerRef.current) clearInterval(timerRef.current)
        }

        signal.on('joinGroupCall', onJoin)
        signal.on('leaveGroupCall', onLeave)
        return () => {
            signal.off('joinGroupCall', onJoin)
            signal.off('leaveGroupCall', onLeave)
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [])

    useEffect(() => {
        if (!callInfo) return
        if (timerRef.current) {
            clearInterval(timerRef.current)
        }
        timerRef.current = setInterval(() => {
            setElapsed((prev) => {
                const next = prev + 1
                if (next >= MAX_CALL_DURATION_SECONDS) {
                    if (timerRef.current) {
                        clearInterval(timerRef.current)
                        timerRef.current = null
                    }
                    leaveCall()
                }
                return next
            })
        }, 1000)
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [callInfo])

    useEffect(() => {
        if (!callInfo) return

        const onRemoteVideo = (data: { agoraUid: string; track: any }) => {
            try {
                const msTrack: MediaStreamTrack = data.track.getMediaStreamTrack()
                setRemoteStreams(prev => {
                    const filtered = prev.filter(r => r.uid !== data.agoraUid)
                    return [...filtered, { uid: data.agoraUid, track: msTrack }]
                })
            } catch {}
        }

        const onRemoteVideoGone = (data: { agoraUid: string }) => {
            setRemoteStreams(prev => prev.filter(r => r.uid !== data.agoraUid))
        }

        const onRemoteLeft = () => {
            setRemoteStreams([])
        }

        signal.on('remoteVideoPublished', onRemoteVideo)
        signal.on('remoteVideoUnpublished', onRemoteVideoGone)
        signal.on('reset-users', onRemoteLeft)
        return () => {
            signal.off('remoteVideoPublished', onRemoteVideo)
            signal.off('remoteVideoUnpublished', onRemoteVideoGone)
            signal.off('reset-users', onRemoteLeft)
        }
    }, [callInfo])

    useEffect(() => {
        if (!callInfo) return
        const onLocalMedia = (data: { micOn: boolean; camOn: boolean }) => {
            setMicOn(data.micOn)
            setCamOn(data.camOn)
            setLocalTrack(data.camOn ? videoChat.getLocalCameraMediaStreamTrack() : null)
        }
        signal.on('localMediaState', onLocalMedia)
        return () => { signal.off('localMediaState', onLocalMedia) }
    }, [callInfo])

    useEffect(() => {
        if (!callInfo) return
        const onTooMany = () => {
            leaveCall()
        }
        const onTimedOut = () => {
            leaveCall()
        }
        signal.on('callTooManyParticipants', onTooMany)
        signal.on('callTimedOut', onTimedOut)
        return () => {
            signal.off('callTooManyParticipants', onTooMany)
            signal.off('callTimedOut', onTimedOut)
        }
    }, [callInfo])

    const onDragStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        const panel = panelRef.current
        if (!panel) return
        const rect = panel.getBoundingClientRect()
        dragStartRef.current = { mouseX: e.clientX, mouseY: e.clientY, panelX: rect.left, panelY: rect.top }
        setDragging(true)
    }, [])

    useEffect(() => {
        if (!dragging) return
        const onMove = (e: MouseEvent) => {
            if (!dragStartRef.current) return
            setPosition({
                x: dragStartRef.current.panelX + (e.clientX - dragStartRef.current.mouseX),
                y: dragStartRef.current.panelY + (e.clientY - dragStartRef.current.mouseY),
            })
        }
        const onUp = () => { setDragging(false); dragStartRef.current = null }
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
        return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    }, [dragging])

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60)
        const sec = s % 60
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    }

    if (!callInfo) return null

    const size = PANEL_SIZES[panelSize]
    const participantCount = 1 + remoteStreams.length
    const callIsFull = participantCount >= MAX_CALL_PARTICIPANTS

    const panelStyle: React.CSSProperties = position && !minimized
        ? { position: 'fixed', left: position.x, top: position.y, width: size.w, height: size.h, zIndex: 50 }
        : { position: 'absolute', top: 8, right: 8, width: size.w, height: size.h, zIndex: 30 }

    const gridCols = participantCount <= 1 ? 'grid-cols-1' : participantCount <= 4 ? 'grid-cols-2' : 'grid-cols-3'

    return (
        <>
            {minimized && (
                <div
                    className="absolute z-30 bottom-16 right-3 flex items-center gap-2 bg-[#252840] border border-white/10 rounded-full px-3 py-2 shadow-xl cursor-pointer hover:bg-[#2d3055] transition-colors"
                    onClick={() => setMinimized(false)}
                >
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-white text-xs font-medium">{callInfo.zoneName}</span>
                    <span className="text-white/40 text-[10px] flex items-center gap-1">
                        <Users size={10} /> {participantCount}
                    </span>
                    <span className="text-white/30 text-[10px]">{formatTime(elapsed)}</span>
                    <button
                        onClick={(e) => { e.stopPropagation(); leaveCall() }}
                        className="ml-1 p-1 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors"
                        title="Leave call"
                    >
                        <PhoneOff size={12} />
                    </button>
                </div>
            )}

            <div
                ref={panelRef}
                className="bg-[#1a1d2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col transition-[width,height] duration-200"
                style={{
                    ...panelStyle,
                    ...(minimized ? { position: 'fixed', left: -9999, top: -9999, width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none' as const } : {}),
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-3 py-2 bg-[#252840]/80 border-b border-white/5 flex-shrink-0 select-none"
                    onMouseDown={onDragStart}
                    style={{ cursor: dragging ? 'grabbing' : 'grab' }}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <GripHorizontal size={14} className="text-white/20 flex-shrink-0" />
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                        <span className="text-white text-xs font-semibold truncate">{callInfo.zoneName}</span>
                        <span className="flex items-center gap-1 text-white/40 text-[10px] flex-shrink-0">
                            <Users size={10} /> {participantCount}
                        </span>
                        <span className="text-white/25 text-[10px] flex-shrink-0">
                            {formatTime(Math.min(elapsed, MAX_CALL_DURATION_SECONDS))}
                        </span>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0" onMouseDown={e => e.stopPropagation()}>
                        <button onClick={() => setMinimized(true)} className="text-white/40 hover:text-white/80 p-1.5 rounded hover:bg-white/5 transition-colors" title="Minimize">
                            <Minus size={13} />
                        </button>
                        <button onClick={() => setPanelSize(s => s === 'normal' ? 'large' : 'normal')} className="text-white/40 hover:text-white/80 p-1.5 rounded hover:bg-white/5 transition-colors" title={panelSize === 'normal' ? 'Enlarge' : 'Shrink'}>
                            {panelSize === 'normal' ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
                        </button>
                        <button onClick={leaveCall} className="text-white/40 hover:text-red-400 p-1.5 rounded hover:bg-red-500/10 transition-colors" title="Leave call">
                            <X size={13} />
                        </button>
                    </div>
                </div>

                {/* Video grid */}
                <div className={`flex-1 min-h-0 grid ${gridCols} gap-1 p-1`}>
                    <VideoTile stream={localTrack} label={`${username} (You)`} muted />
                    {remoteStreams.map(rs => (
                        <VideoTile key={rs.uid} stream={rs.track} label={rs.uid.replace(/^[a-f0-9]{24}/, '')} />
                    ))}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-3 px-3 py-2.5 bg-[#252840]/80 border-t border-white/5 flex-shrink-0">
                    <button
                        onClick={toggleMic}
                        className={`p-2.5 rounded-full transition-colors ${micOn ? 'bg-white/10 hover:bg-white/15 text-white' : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'}`}
                        title={micOn ? 'Mute mic' : 'Unmute mic'}
                    >
                        {micOn ? <Mic size={18} /> : <MicOff size={18} />}
                    </button>
                    <button
                        onClick={toggleCam}
                        className={`p-2.5 rounded-full transition-colors ${camOn ? 'bg-white/10 hover:bg-white/15 text-white' : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'}`}
                        title={camOn ? 'Turn off camera' : 'Turn on camera'}
                    >
                        {camOn ? <Video size={18} /> : <VideoOff size={18} />}
                    </button>
                    <button
                        onClick={leaveCall}
                        className="px-5 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <PhoneOff size={16} />
                        {callIsFull ? 'Leave (Full)' : 'Leave'}
                    </button>
                </div>
            </div>
        </>
    )
}

export default GroupCallPanel
