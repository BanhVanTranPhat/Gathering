'use client'

import Image from 'next/image'
import type { TilesetAsset } from '../config/gatherAssets'
import { tilesets } from '../config/gatherAssets'

type TilesetPreviewProps = {
  tilesetId: TilesetAsset['id']
  width?: number
}

export function TilesetPreview({ tilesetId, width = 240 }: TilesetPreviewProps) {
  const tileset = tilesets.find(t => t.id === tilesetId)
  if (!tileset) return null

  return (
    <div className="flex flex-col gap-1">
      <div className="rounded-lg overflow-hidden bg-slate-900/60 border border-slate-700/60">
        <Image
          src={tileset.src}
          alt={tileset.name}
          width={width}
          height={width}
          className="w-full h-auto object-contain"
        />
      </div>
      <span className="text-xs text-slate-200 truncate">{tileset.name}</span>
    </div>
  )
}

