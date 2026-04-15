'use client'

import React from 'react'
import { Zone } from '@/utils/zones'
import { MapPin, X, Users, Music, Github, Coffee } from 'lucide-react'

const typeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
    team: { label: 'Team Area', icon: <Users size={14} /> },
    meeting: { label: 'Meeting Room', icon: <Coffee size={14} /> },
    focus: { label: 'Focus Zone', icon: <Music size={14} /> },
    github: { label: 'GitHub Hub', icon: <Github size={14} /> },
    common: { label: 'Common Area', icon: <MapPin size={14} /> },
}

type ZonePopupProps = {
    zone: Zone
    onClose: () => void
    onGoTo: (zone: Zone) => void
}

const ZonePopup: React.FC<ZonePopupProps> = ({ zone, onClose, onGoTo }) => {
    const typeInfo = typeLabels[zone.type] ?? typeLabels.common

    return (
        <div className="absolute top-6 right-6 z-30 w-72 animate-fade-in">
            <div className="bg-[#1e2140]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                <div
                    className="h-1.5 w-full"
                    style={{ background: `linear-gradient(90deg, ${zone.color}, ${zone.color}80)` }}
                />

                <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">{zone.icon}</span>
                            <div>
                                <h3 className="text-white font-bold text-sm">{zone.name}</h3>
                                <span className="flex items-center gap-1 text-[11px] text-white/50">
                                    {typeInfo.icon}
                                    {typeInfo.label}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/40 hover:text-white/80 transition-colors p-1 -mr-1 -mt-1"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <p className="text-white/60 text-xs leading-relaxed mb-4">
                        {zone.description}
                    </p>

                    <button
                        onClick={() => onGoTo(zone)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white text-sm font-semibold transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                        style={{ backgroundColor: zone.color }}
                    >
                        <MapPin size={14} />
                        Go to
                    </button>

                    {zone.type === 'focus' && (
                        <p className="text-center text-[10px] text-white/30 mt-2">
                            Music player available when you enter
                        </p>
                    )}
                    {zone.type === 'github' && (
                        <p className="text-center text-[10px] text-white/30 mt-2">
                            GitHub activity panel available when you enter
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ZonePopup
