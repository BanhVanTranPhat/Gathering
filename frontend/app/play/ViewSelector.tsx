'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Eye, CaretUp } from '@phosphor-icons/react'
import signal from '@/utils/signal'

export type ViewMode = 'simplified' | 'immersive' | 'auto'

const viewOptions: { id: ViewMode; label: string; desc: string }[] = [
    { id: 'simplified', label: 'Simplified', desc: 'Clean UI, less detail' },
    { id: 'immersive', label: 'Immersive', desc: 'Full detail experience' },
    { id: 'auto', label: 'Auto', desc: 'Adjusts automatically' },
]

const ViewSelector: React.FC = () => {
    const [open, setOpen] = useState(false)
    const [selected, setSelected] = useState<ViewMode>('auto')
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    const handleSelect = (mode: ViewMode) => {
        setSelected(mode)
        signal.emit('viewModeChanged', mode)
        setOpen(false)
    }

    const current = viewOptions.find((v) => v.id === selected)!

    return (
        <div ref={ref} className="absolute bottom-4 right-4 z-30">
            {/* Dropdown */}
            {open && (
                <div className="absolute bottom-full right-0 mb-2 w-52 bg-[#252840]/95 backdrop-blur-sm rounded-xl border border-[#3F4776]/60 shadow-xl overflow-hidden toolbar-slide-up">
                    {viewOptions.map((opt) => {
                        const isActive = selected === opt.id
                        return (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleSelect(opt.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                                    isActive
                                        ? 'bg-[#6C72CB]/20 text-white'
                                        : 'text-[#8B8FA3] hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <div className="w-8 h-8 rounded-lg bg-[#1E2035] border border-[#3F4776]/40 flex items-center justify-center flex-shrink-0">
                                    <ViewIcon mode={opt.id} active={isActive} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium">{opt.label}</p>
                                    <p className="text-[10px] text-[#6B7280]">{opt.desc}</p>
                                </div>
                                {isActive && (
                                    <div className="w-2 h-2 rounded-full bg-[#6C72CB] flex-shrink-0" />
                                )}
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Toggle button */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all shadow-lg ${
                    open
                        ? 'bg-[#252840] border-[#6C72CB]/50 text-white'
                        : 'bg-[#252840]/90 backdrop-blur-sm border-[#3F4776]/40 text-[#8B8FA3] hover:text-white hover:border-[#3F4776]'
                }`}
            >
                <Eye className="w-4 h-4" />
                <span className="text-xs font-medium">{current.label}</span>
                <CaretUp className={`w-3 h-3 transition-transform ${open ? '' : 'rotate-180'}`} />
            </button>
        </div>
    )
}

function ViewIcon({ mode, active }: { mode: ViewMode; active: boolean }) {
    const color = active ? '#6C72CB' : '#4B5060'
    if (mode === 'simplified') {
        return (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="3" width="14" height="10" rx="2" stroke={color} strokeWidth="1.5" />
                <line x1="5" y1="3" x2="5" y2="13" stroke={color} strokeWidth="1" opacity="0.5" />
            </svg>
        )
    }
    if (mode === 'immersive') {
        return (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="14" height="14" rx="2" stroke={color} strokeWidth="1.5" />
                <rect x="3" y="3" width="4" height="4" rx="1" fill={color} opacity="0.4" />
                <rect x="9" y="3" width="4" height="4" rx="1" fill={color} opacity="0.4" />
                <rect x="3" y="9" width="10" height="4" rx="1" fill={color} opacity="0.3" />
            </svg>
        )
    }
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5" />
            <path d="M8 4v4l3 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}

export default ViewSelector
