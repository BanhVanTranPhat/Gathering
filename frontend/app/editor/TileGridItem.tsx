'use client'
import React from 'react'
import { SheetName } from '@/utils/pixi/spritesheet/spritesheet'
import { sprites } from '@/utils/pixi/spritesheet/spritesheet'

type TileGridItemProps = {
    sheetName: SheetName
    spriteName: string
    selected: boolean
    onClick: () => void
}

const TileGridItem: React.FC<TileGridItemProps> = ({ sheetName, spriteName, selected, onClick }) => {

    const Tile = () => {
        const src = sprites.spriteSheetDataSet[sheetName].url
        const { x, y, width, height } = sprites.spriteSheetDataSet[sheetName].sprites[spriteName]
        const sheetWidth = sprites.spriteSheetDataSet[sheetName].width // Width of the whole sprite sheet
        const sheetHeight = sprites.spriteSheetDataSet[sheetName]. height // Height of the whole sprite sheet

        const higherDimension = Math.max(width, height)
        const scale = 64 / higherDimension

        return (
            <div style={{
                backgroundImage: `url(${src})`,
                backgroundPosition: `-${x * scale}px -${y * scale}px`,
                backgroundSize: `${sheetWidth * scale}px ${sheetHeight * scale}px`,
                width: `${width * scale}px`,
                height: `${height * scale}px`,
                imageRendering: 'pixelated'
            }}></div>
        )
    }

    const TileOrEmpty = () => {
        if (spriteName === 'empty') {
            return <div className='w-full h-full'></div>
        } else {
            return <Tile />
        }
    }

    return (
        <div
            className={`
                ${spriteName === 'empty' ? 'pointer-events-none opacity-0' : ''}
                w-full aspect-square cursor-pointer rounded-lg flex flex-col items-center justify-center
                transition-all duration-150 group relative
                ${selected ? 'bg-white/15 ring-1 ring-quaternary/50 shadow-sm' : 'hover:bg-white/10'}
            `}
            onClick={onClick}
            title={spriteName !== 'empty' ? spriteName.replace(/_/g, ' ') : ''}
        >
            <div className='w-full grow grid place-items-center'>
                <TileOrEmpty />
            </div>
        </div>
    )
}

export default TileGridItem
