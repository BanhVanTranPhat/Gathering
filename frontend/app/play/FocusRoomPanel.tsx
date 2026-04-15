'use client'

import React, { useEffect, useState, useCallback } from 'react'
import signal from '@/utils/signal'
import { Zone } from '@/utils/zones'
import { Music, X, Play, Pause, Volume2 } from 'lucide-react'

const LOFI_STREAMS = [
    { name: 'Lofi Hip Hop', videoId: 'jfKfPfyJRdk' },
    { name: 'Jazz Vibes', videoId: '9BRX0tBIrNk' },
    { name: 'Chillhop', videoId: '7NOSDKb0HlU' },
    { name: 'Study Music', videoId: 'TURbeWK2wwg' },
]

const FocusRoomPanel: React.FC = () => {
    const [currentZone, setCurrentZone] = useState<Zone | null>(null)
    const [playing, setPlaying] = useState(false)
    const [selectedStream, setSelectedStream] = useState(0)
    const [customUrl, setCustomUrl] = useState('')
    const [showPanel, setShowPanel] = useState(true)

    useEffect(() => {
        const onZoneChanged = (zone: Zone | null) => {
            setCurrentZone(zone)
            if (zone?.type !== 'focus') {
                setPlaying(false)
            }
        }
        signal.on('playerZoneChanged', onZoneChanged)
        return () => signal.off('playerZoneChanged', onZoneChanged)
    }, [])

    const getVideoId = useCallback((): string => {
        if (customUrl) {
            const match = customUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?\s]+)/)
            if (match) return match[1]
        }
        return LOFI_STREAMS[selectedStream].videoId
    }, [customUrl, selectedStream])

    if (currentZone?.type !== 'focus') return null
    if (!showPanel) {
        return (
            <button
                onClick={() => setShowPanel(true)}
                className="absolute top-3 right-3 z-30 bg-amber-500/90 hover:bg-amber-500 text-white p-2 rounded-full shadow-lg transition-all"
                title="Show music panel"
            >
                <Music size={16} />
            </button>
        )
    }

    return (
        <div className="absolute top-3 right-3 z-30 w-80 animate-fade-in">
            <div className="bg-[#1e2140]/95 backdrop-blur-md border border-amber-500/20 rounded-xl shadow-2xl overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-500" />

                <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                <Music className="text-amber-400" size={16} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm">Focus Mode</h3>
                                <span className="text-amber-400/60 text-[10px]">Deep work zone</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowPanel(false)}
                            className="text-white/30 hover:text-white/60 p-1"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    <div className="space-y-2 mb-3">
                        {LOFI_STREAMS.map((stream, i) => (
                            <button
                                key={stream.videoId}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                                    selectedStream === i && !customUrl
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                        : 'text-white/60 hover:bg-white/5 border border-transparent'
                                }`}
                                onClick={() => { setSelectedStream(i); setCustomUrl('') }}
                            >
                                <div className="flex items-center gap-2">
                                    <Volume2 size={12} />
                                    {stream.name}
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="mb-3">
                        <input
                            type="text"
                            placeholder="Or paste YouTube URL..."
                            value={customUrl}
                            onChange={(e) => setCustomUrl(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/40"
                        />
                    </div>

                    <button
                        onClick={() => setPlaying(!playing)}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                            playing
                                ? 'bg-white/10 text-white hover:bg-white/15'
                                : 'bg-amber-500 text-white hover:bg-amber-400'
                        }`}
                    >
                        {playing ? <Pause size={14} /> : <Play size={14} />}
                        {playing ? 'Pause' : 'Play Music'}
                    </button>

                    {playing && (
                        <div className="mt-3 rounded-lg overflow-hidden bg-black/30">
                            <iframe
                                width="100%"
                                height="0"
                                src={`https://www.youtube.com/embed/${getVideoId()}?autoplay=1&loop=1`}
                                allow="autoplay"
                                className="hidden"
                            />
                            <div className="flex items-center gap-2 px-3 py-2">
                                <div className="flex gap-0.5">
                                    {[...Array(4)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-1 bg-amber-400 rounded-full animate-pulse"
                                            style={{
                                                height: 8 + Math.random() * 8,
                                                animationDelay: `${i * 0.15}s`,
                                                animationDuration: '0.6s',
                                            }}
                                        />
                                    ))}
                                </div>
                                <span className="text-[10px] text-amber-300/60">
                                    Now playing: {customUrl ? 'Custom' : LOFI_STREAMS[selectedStream].name}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default FocusRoomPanel
