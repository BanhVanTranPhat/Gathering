'use client'

import React from 'react'

interface SpriteIconProps {
  src: string
  size?: number
  x?: number
  y?: number
  scale?: number
  style?: React.CSSProperties
}

export default function SpriteIcon({ src, size = 64, x = 0, y = 0, scale = 1, style }: SpriteIconProps) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundImage: `url(${src})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: `-${x}px -${y}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        imageRendering: 'pixelated',
        overflow: 'hidden',
        ...style,
      }}
    />
  )
}
