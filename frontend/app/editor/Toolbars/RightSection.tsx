import React, { useState } from 'react'
import TileMenu from '../TileMenu'
import { SpecialTile } from '@/utils/pixi/types'
import SpecialTiles from '../SpecialTiles'
import { SheetName } from '@/utils/pixi/spritesheet/spritesheet'
import { TileWithPalette } from '../Editor'

type RightSectionProps = {
    selectedTile: TileWithPalette
    setSelectedTile: (tile: TileWithPalette) => void
    selectSpecialTile: (specialTile: SpecialTile) => void
    specialTile: SpecialTile
    rooms: string[]
    setRooms: (rooms: string[]) => void
    roomIndex: number
    setRoomIndex: (index: number) => void
    palettes: SheetName[]
    selectedPalette: SheetName
    setSelectedPalette: (palette: SheetName) => void
}

type Tab = 'Tile' | 'Special Tiles'

const RightSection:React.FC<RightSectionProps> = ({ selectedTile, setSelectedTile, specialTile, selectSpecialTile, rooms, setRooms, roomIndex, setRoomIndex, palettes, selectedPalette, setSelectedPalette }) => {
    
    const [tab, setTab] = useState<Tab>('Tile')

    return (
        <div className='w-[360px] bg-[#1e2240] flex flex-col select-none border-l border-black/20'>
            <div className='flex h-10 px-2 pt-1 gap-1'>
                <button
                    className={`flex-1 text-sm font-medium rounded-t-lg grid place-items-center transition-all ${
                        tab === 'Tile'
                            ? 'bg-white/10 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                    onClick={() => setTab('Tile')}
                >
                    Tiles
                </button>
                <button
                    className={`flex-1 text-sm font-medium rounded-t-lg grid place-items-center transition-all ${
                        tab === 'Special Tiles'
                            ? 'bg-white/10 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                    onClick={() => setTab('Special Tiles')}
                >
                    Special Tiles
                </button>
            </div>
            <div className='h-px bg-white/10'/>
            <div className='flex-1 overflow-hidden'>
                {tab === 'Tile' && (
                    <TileMenu 
                        selectedTile={selectedTile} 
                        setSelectedTile={setSelectedTile} 
                        rooms={rooms}
                        setRooms={setRooms}
                        roomIndex={roomIndex}
                        setRoomIndex={setRoomIndex}
                        palettes={palettes}
                        selectedPalette={selectedPalette}
                        setSelectedPalette={setSelectedPalette}
                    />
                )}
                {tab === 'Special Tiles' && <SpecialTiles specialTile={specialTile} selectSpecialTile={selectSpecialTile}/>}
            </div>
        </div>
    )
}

export default RightSection