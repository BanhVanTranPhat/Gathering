import React from 'react'

type SpecialTileItemProps = {
    children: React.ReactNode
    iconColor: 'red' | 'blue' | 'green' | 'yellow'
    title: string,
    description: string
    selected: boolean
    onClick: () => void
}

const SpecialTileItem:React.FC<SpecialTileItemProps> = ({ children, iconColor, title, description, selected, onClick }) => {
    
    function getColorClassName() {
        switch (iconColor) {
            case 'red':
                return 'bg-red-500'
            case 'blue':
                return 'bg-blue-500'
            case 'green':
                return 'bg-green-500'
            case 'yellow':
                return 'bg-yellow-500'
        }
    }

    return (
        <div
            className={`
                w-full cursor-pointer transition-all
                ${selected ? 'bg-white/10' : 'hover:bg-white/5'}
            `}
            onClick={onClick}
        >
            <div className='flex items-center gap-3 px-4 py-3'>
                <div className={`${getColorClassName()} rounded-lg p-1.5 bg-opacity-20`}>
                    <div className={`${getColorClassName().replace('bg-', 'text-')}`}>
                        {children}
                    </div>
                </div>
                <div className='flex flex-col gap-0.5'>
                    <h2 className='text-sm font-semibold text-white'>{title}</h2>
                    <p className='text-xs text-gray-400 leading-snug'>{description}</p>
                </div>
            </div>
        </div>
    )
}

export default SpecialTileItem