'use client'

import Image from 'next/image'
import type { ObjectAsset } from '../config/gatherAssets'
import { objects } from '../config/gatherAssets'

type ObjectIconProps = {
  objectId: ObjectAsset['id']
  size?: number
}

export function ObjectIcon({ objectId, size = 32 }: ObjectIconProps) {
  const object = objects.find(o => o.id === objectId)
  if (!object) return null

  return (
    <div
      className="rounded-md overflow-hidden bg-slate-900/60 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Image
        src={object.src}
        alt={object.name}
        width={size}
        height={size}
        className="object-contain"
      />
    </div>
  )
}

