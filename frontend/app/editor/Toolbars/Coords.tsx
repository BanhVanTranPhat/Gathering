'use client'
import React, { useState, useEffect } from 'react'
import signal from '@/utils/signal'

type CoordsProps = {
    
}

const Coords:React.FC<CoordsProps> = () => {

    const [coords, setCoords] = useState({x: 0, y: 0})

    useEffect(() => {
        const setCoordinates = (data: any) => {
            setCoords(data)
        }

        signal.on('coordinates', setCoordinates)

        return () => {
            signal.off('coordinates', setCoordinates)
        }
    }, [])
    
    return (
        <div className='absolute bottom-3 right-[380px] px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-xs font-mono text-gray-300 pointer-events-none select-none border border-white/10'>
            x:{coords.x} y:{coords.y}
        </div>
    )
}

export default Coords