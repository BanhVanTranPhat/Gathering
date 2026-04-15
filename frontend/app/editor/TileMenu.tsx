'use client'
import React, { useState } from 'react'
import Dropdown from '../../components/Dropdown'
import { SheetName } from '@/utils/pixi/spritesheet/spritesheet'
import TileMenuGrid from './TileMenuGrid'
import Rooms from './Rooms'
import { TileWithPalette } from './Editor'
import { Layer } from '@/utils/pixi/types'
import ToolButton from './Toolbars/ToolButton'
import { Wall, FlowerTulip, Couch } from '@phosphor-icons/react'

type TileMenuProps = {
    selectedTile: TileWithPalette,
    setSelectedTile: (tile: TileWithPalette) => void
    rooms: string[]
    setRooms: (rooms: string[]) => void
    roomIndex: number
    setRoomIndex: (index: number) => void
    palettes: SheetName[]
    selectedPalette: SheetName
    setSelectedPalette: (palette: SheetName) => void
}


const TileMenu:React.FC<TileMenuProps> = ({ selectedTile, setSelectedTile, rooms, setRooms, roomIndex, setRoomIndex, palettes, selectedPalette, setSelectedPalette }) => {

    const [selectedLayer, setSelectedLayer] = useState<Layer>('floor')

    return (
        <div className='flex flex-col gap-2.5 p-3'>
            <div className='flex items-center justify-between'>
                <span className='text-xs font-medium text-gray-400 uppercase tracking-wider'>Palette</span>
                <Dropdown items={palettes} selectedItem={selectedPalette} setSelectedItem={setSelectedPalette}/>
            </div>
            <div className='flex gap-1 bg-white/5 rounded-lg p-1'>
                <button
                    className={`flex-1 grid place-items-center py-1.5 rounded-md transition-all ${selectedLayer === 'floor' ? 'bg-white/15 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    onClick={() => setSelectedLayer('floor')}
                    title='Floor'
                >
                    <Wall className='w-5 h-5'/>
                </button>
                <button
                    className={`flex-1 grid place-items-center py-1.5 rounded-md transition-all ${selectedLayer === 'above_floor' ? 'bg-white/15 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    onClick={() => setSelectedLayer('above_floor')}
                    title='Above Floor'
                >
                    <FlowerTulip className='w-5 h-5'/>
                </button>
                <button
                    className={`flex-1 grid place-items-center py-1.5 rounded-md transition-all ${selectedLayer === 'object' ? 'bg-white/15 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    onClick={() => setSelectedLayer('object')}
                    title='Objects'
                >
                    <Couch className='w-5 h-5'/>
                </button>
            </div>
            <TileMenuGrid selectedPalette={selectedPalette} selectedTile={selectedTile} setSelectedTile={setSelectedTile} layer={selectedLayer}/>
            <Rooms 
                rooms={rooms}
                setRooms={setRooms}
                roomIndex={roomIndex}
                setRoomIndex={setRoomIndex}
            />
        </div>  
    )
}

export default TileMenu