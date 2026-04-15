'use client'

import React, { useEffect, useState } from 'react'
import signal from '@/utils/signal'

type MinimapData = {
    x: number
    y: number
    roomIndex: number
    roomName: string
    minX: number
    maxX: number
    minY: number
    maxY: number
}

const SIZE = 120
const PADDING = 8

const MiniMap: React.FC = () => {
    const [data, setData] = useState<MinimapData | null>(null)

    useEffect(() => {
        const onPosition = (payload: MinimapData) => setData(payload)
        signal.on('minimapPosition', onPosition)
        return () => signal.off('minimapPosition', onPosition)
    }, [])

    if (!data) return null

    const { x, y, minX, maxX, minY, maxY, roomName } = data
    const roomW = Math.max(1, maxX - minX + 1)
    const roomH = Math.max(1, maxY - minY + 1)
    const cellSize = Math.min((SIZE - PADDING * 2) / roomW, (SIZE - PADDING * 2) / roomH)
    const mapW = roomW * cellSize
    const mapH = roomH * cellSize
    const offsetX = PADDING
    const offsetY = PADDING
    const px = offsetX + (x - minX) * cellSize + cellSize / 2
    const py = offsetY + (y - minY) * cellSize + cellSize / 2

    return (
        <div className="absolute bottom-24 left-3 z-10 rounded-lg overflow-hidden bg-primary/95 backdrop-blur border border-[#3F4776] shadow-lg">
            <div className="px-2 py-1 border-b border-[#3F4776]">
                <p className="text-xs font-medium text-white truncate max-w-[104px]" title={roomName}>
                    {roomName || 'Map'}
                </p>
            </div>
            <div
                className="relative bg-darkblue/80"
                style={{ width: SIZE, height: SIZE }}
            >
                <svg width={SIZE} height={SIZE} className="block">
                    <rect
                        x={offsetX}
                        y={offsetY}
                        width={mapW}
                        height={mapH}
                        fill="rgba(50, 58, 100, 0.9)"
                        stroke="rgba(63, 71, 118, 0.8)"
                        strokeWidth={1}
                    />
                    <circle
                        cx={px}
                        cy={py}
                        r={Math.max(3, cellSize / 2)}
                        fill="#06d6a0"
                        stroke="#282D4E"
                        strokeWidth={1.5}
                    />
                </svg>
            </div>
        </div>
    )
}

export default MiniMap
