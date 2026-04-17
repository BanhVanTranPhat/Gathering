'use client'

import React from 'react'
import { ASSETS, LAYER_ORDER } from '@/utils/avatarAssets'
import SpriteIcon from './SpriteIcon'

type AvatarPreviewProps = {
  avatarConfig: Record<string, string>
  size?: number
  className?: string
}

/** Hiển thị avatar đã compose từ avatarConfig (dùng cho IntroScreen, v.v.) */
export default function AvatarPreview({ avatarConfig, size = 64, className = '' }: AvatarPreviewProps) {
  const getHue = (layerKey: string) => {
    const value = Number(avatarConfig[`hue_${layerKey}`] || '0')
    return Number.isFinite(value) ? value : 0
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width: size, height: size }}>
      {LAYER_ORDER.map((layerKey) => {
        const itemId = avatarConfig[layerKey]
        const itemData = ASSETS[layerKey]?.find((i: any) => i.id === itemId)
        if (itemData?.src) {
          return (
            <div
              key={layerKey}
              className="absolute inset-0 pointer-events-none"
              style={{
                width: size,
                height: size,
                filter: getHue(layerKey) ? `hue-rotate(${getHue(layerKey)}deg)` : undefined,
              }}
            >
              <SpriteIcon
                src={itemData.src}
                x={itemData.x || 0}
                y={itemData.y || 0}
                size={size}
              />
            </div>
          )
        }
        return null
      })}
    </div>
  )
}
