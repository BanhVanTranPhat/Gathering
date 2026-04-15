import React, { useState } from 'react'

type ToolButtonProps = {
    children?: React.ReactNode
    selected: boolean
    onClick?: () => void
    className?: string
    label?: string
    disabled?: boolean
}

const ToolButton:React.FC<ToolButtonProps> = ({ children, selected, onClick, className, label, disabled }) => {
    
    const [showTooltip, setShowTooltip] = useState<boolean>(false)

    const handleShowToolTip = (show: boolean) => {
        if (disabled) {
            setShowTooltip(false)
        } else {
            setShowTooltip(show)
        }

    }

    return (
        <div className='relative' onMouseEnter={() => handleShowToolTip(true)} onMouseLeave={() => handleShowToolTip(false)}>
            <button
                className={`
                    ${selected ? 'bg-white/15 text-white shadow-inner' : 'text-gray-400'}
                    ${disabled ? 'pointer-events-none opacity-30 cursor-default' : 'hover:bg-white/10 hover:text-white'}
                    transition-all duration-150 aspect-square grid place-items-center rounded-lg p-1.5
                    ${className}
                `}
                onClick={onClick}
            >
                {children}
            </button>
            {showTooltip && label && (
                <div className='absolute left-[52px] top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#1a1e38] border border-white/10 text-white text-xs rounded-md whitespace-nowrap select-none shadow-lg z-50'>
                    {label}
                </div>
            )}
        </div>
    )
}
export default ToolButton