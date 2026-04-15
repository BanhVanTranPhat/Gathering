'use client'

import React from 'react'
import { Plus, Minus } from '@phosphor-icons/react'
import signal from '@/utils/signal'

const MapZoomControls: React.FC = () => {
    return (
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-0.5 bg-[#1E2035]/90 backdrop-blur rounded-xl p-1 border border-[#2D3054] shadow-lg">
            <button
                type="button"
                onClick={() => signal.emit('mapZoomIn')}
                className="p-1.5 rounded-lg hover:bg-white/10 text-[#8B8FA3] hover:text-white transition-colors"
                title="Zoom in"
            >
                <Plus className="w-4 h-4" />
            </button>
            <div className="w-4 h-px bg-[#2D3054] mx-auto" />
            <button
                type="button"
                onClick={() => signal.emit('mapZoomOut')}
                className="p-1.5 rounded-lg hover:bg-white/10 text-[#8B8FA3] hover:text-white transition-colors"
                title="Zoom out"
            >
                <Minus className="w-4 h-4" />
            </button>
        </div>
    )
}

export default MapZoomControls
