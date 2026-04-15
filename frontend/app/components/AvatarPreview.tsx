'use client'

import Image from 'next/image'
import type { AvatarAsset } from '../config/gatherAssets'
import { avatars } from '../config/gatherAssets'

type AvatarPreviewProps = {
  avatarId: AvatarAsset['id']
  size?: number
}

export function AvatarPreview({ avatarId, size = 48 }: AvatarPreviewProps) {
  const avatar = avatars.find(a => a.id === avatarId)
  if (!avatar) return null

  const src = avatar.previewSrc ?? avatar.spriteSrc

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="rounded-full overflow-hidden bg-slate-900/60 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt={avatar.name}
          width={size}
          height={size}
          className="object-contain"
        />
      </div>
      <span className="text-xs text-slate-200 truncate max-w-[96px]">{avatar.name}</span>
    </div>
  )
}

