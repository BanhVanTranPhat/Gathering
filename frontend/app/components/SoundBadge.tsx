'use client'

import { useState } from 'react'
import type { SoundAsset } from '../config/gatherAssets'
import { sounds } from '../config/gatherAssets'

type SoundBadgeProps = {
  soundId: SoundAsset['id']
}

export function SoundBadge({ soundId }: SoundBadgeProps) {
  const sound = sounds.find(s => s.id === soundId)
  const [audio] = useState(() => (typeof Audio !== 'undefined' ? new Audio(sound?.src) : null))
  const [playing, setPlaying] = useState(false)

  if (!sound) return null

  const togglePlay = () => {
    if (!audio) return
    if (playing) {
      audio.pause()
      audio.currentTime = 0
      setPlaying(false)
    } else {
      audio.loop = !!sound.loop
      audio.volume = sound.volumeDefault ?? 0.6
      void audio.play()
      setPlaying(true)
    }
  }

  return (
    <button
      type="button"
      onClick={togglePlay}
      className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 px-2 py-1 text-xs text-slate-100 bg-slate-900/60 hover:bg-slate-800/80 transition-colors"
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
      <span className="truncate max-w-[160px]">{sound.name}</span>
      <span className="text-[10px] text-slate-400">{playing ? 'Stop' : 'Play'}</span>
    </button>
  )
}

