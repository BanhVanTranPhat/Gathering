'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Phone, PhoneDisconnect, PhoneCall } from '@phosphor-icons/react'
import signal from '@/utils/signal'
import { server } from '@/utils/backend/server'

type NearbyPlayer = { uid: string; username: string }

const ProximityCallPrompt: React.FC<{ uid: string; username: string }> = ({ uid, username }) => {
    const [nearbyPlayers, setNearbyPlayers] = useState<NearbyPlayer[]>([])
    const [proximityId, setProximityId] = useState<string | null>(null)
    const [incomingCall, setIncomingCall] = useState<{ fromUid: string; fromUsername: string; proximityId: string } | null>(null)
    const [callState, setCallState] = useState<'idle' | 'calling' | 'in-call'>('idle')
    const [callMessage, setCallMessage] = useState('')
    const msgTimeout = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        const onProximity = (data: { proximityId: string }) => {
            setProximityId(data.proximityId)
        }
        const onProximityLost = () => {
            setProximityId(null)
            setIncomingCall(null)
            setCallState('idle')
            signal.emit('leaveGroupCall')
        }
        const onIncoming = (data: { fromUid: string; fromUsername: string; proximityId: string }) => {
            if (data.fromUid !== uid) {
                setIncomingCall(data)
            }
        }
        const onAccepted = (data: { proximityId: string; byUid: string; byUsername?: string }) => {
            setCallState('in-call')
            setIncomingCall(null)
            signal.emit('joinGroupCall', {
                zoneId: `prox-${data.proximityId?.slice(0, 8)}`,
                zoneName: `Call with ${data.byUsername || 'User'}`,
                realmId: '',
            })
            showMessage('Call connected!')
        }
        const onRejected = (data: { byUid: string; byUsername?: string }) => {
            setCallState('idle')
            showMessage(`${data.byUsername || 'User'} declined the call`)
        }
        const onPlayersInRoom = (data: { online: { uid: string; username: string }[] }) => {
            setNearbyPlayers(data.online.filter(p => p.uid !== uid))
        }

        signal.on('proximityDetected', onProximity)
        signal.on('proximityLost', onProximityLost)
        signal.on('incomingCall', onIncoming)
        signal.on('callAccepted', onAccepted)
        signal.on('callRejected', onRejected)
        signal.on('playersInRoom', onPlayersInRoom)

        return () => {
            signal.off('proximityDetected', onProximity)
            signal.off('proximityLost', onProximityLost)
            signal.off('incomingCall', onIncoming)
            signal.off('callAccepted', onAccepted)
            signal.off('callRejected', onRejected)
            signal.off('playersInRoom', onPlayersInRoom)
        }
    }, [uid])

    const showMessage = useCallback((msg: string) => {
        setCallMessage(msg)
        if (msgTimeout.current) clearTimeout(msgTimeout.current)
        msgTimeout.current = setTimeout(() => setCallMessage(''), 3000)
    }, [])

    const startCall = useCallback((targetUid: string) => {
        setCallState('calling')
        server.socket.emit('callRequest', { targetUid })
        showMessage('Calling...')
    }, [showMessage])

    const acceptCall = useCallback(() => {
        if (!incomingCall) return
        server.socket.emit('callResponse', { callerUid: incomingCall.fromUid, accept: true })
        setIncomingCall(null)
    }, [incomingCall])

    const rejectCall = useCallback(() => {
        if (!incomingCall) return
        server.socket.emit('callResponse', { callerUid: incomingCall.fromUid, accept: false })
        setIncomingCall(null)
    }, [incomingCall])

    if (incomingCall) {
        return (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-[#252840]/95 backdrop-blur-sm border border-[#6C72CB]/50 rounded-2xl px-4 py-3 shadow-xl toolbar-slide-up">
                <div className="w-10 h-10 rounded-full bg-[#6C72CB] flex items-center justify-center text-white font-bold text-sm">
                    {incomingCall.fromUsername.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                    <span className="text-white text-sm font-medium">{incomingCall.fromUsername}</span>
                    <span className="text-[#8B8FA3] text-xs">wants to call you</span>
                </div>
                <button
                    type="button"
                    onClick={acceptCall}
                    className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center text-white transition-colors shadow-lg shadow-green-500/20"
                    title="Accept"
                >
                    <Phone className="w-5 h-5" weight="fill" />
                </button>
                <button
                    type="button"
                    onClick={rejectCall}
                    className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center text-white transition-colors shadow-lg shadow-red-500/20"
                    title="Decline"
                >
                    <PhoneDisconnect className="w-5 h-5" weight="fill" />
                </button>
            </div>
        )
    }

    if (callMessage) {
        return (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-[#252840]/90 backdrop-blur-sm border border-[#3F4776]/60 rounded-xl px-4 py-2 shadow-lg toolbar-slide-up">
                <span className="text-white text-sm">{callMessage}</span>
            </div>
        )
    }

    if (!proximityId || callState === 'in-call') return null

    const nearbyTarget = nearbyPlayers[0]
    if (!nearbyTarget) return null

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-[#252840]/90 backdrop-blur-sm border border-[#3F4776]/60 rounded-2xl px-3 py-2 shadow-xl toolbar-slide-up">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-white text-xs font-medium">{nearbyTarget.username} is nearby</span>
            <button
                type="button"
                onClick={() => startCall(nearbyTarget.uid)}
                disabled={callState === 'calling'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs font-medium transition-colors disabled:opacity-50"
            >
                <PhoneCall className="w-4 h-4" />
                {callState === 'calling' ? 'Calling...' : 'Call'}
            </button>
        </div>
    )
}

export default ProximityCallPrompt
