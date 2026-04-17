'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  CATEGORIES,
  ASSETS,
  LAYER_ORDER,
  DEFAULT_AVATAR_CONFIG,
  FEMALE_AVATAR_CONFIG,
  MALE_AVATAR_CONFIG,
} from '@/utils/avatarAssets'
import SpriteIcon from '@/components/SpriteIcon'
import { createClient } from '@/utils/auth/client'

const COLOR_OPTIONS = [
  { label: 'Mặc định', hue: 0, color: '#d9dce6' },
  { label: 'Đỏ', hue: 330, color: '#ef4444' },
  { label: 'Cam', hue: 20, color: '#f97316' },
  { label: 'Vàng', hue: 70, color: '#eab308' },
  { label: 'Xanh lá', hue: 130, color: '#22c55e' },
  { label: 'Lam', hue: 190, color: '#06b6d4' },
  { label: 'Xanh dương', hue: 220, color: '#3b82f6' },
  { label: 'Tím', hue: 270, color: '#a855f7' },
]

type AvatarSelectionProps = {
  embedded?: boolean
  onSaved?: () => void
}

export default function AvatarSelection({ embedded = false, onSaved }: AvatarSelectionProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('return') || '/app'
  const [avatarConfig, setAvatarConfig] = useState<Record<string, string>>({ ...DEFAULT_AVATAR_CONFIG })
  const [displayName, setDisplayName] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('skin')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const auth = createClient()

  useEffect(() => {
    setErrorMsg(null)
    auth.from('profiles').select('avatarConfig, displayName, gender').single().then((r: any) => {
      const profile = r?.data
      const profileGender = profile?.gender === 'female' ? 'female' : 'male'
      if (profile?.avatarConfig && typeof profile.avatarConfig === 'object' && Object.keys(profile.avatarConfig).length > 0) {
        setAvatarConfig((prev) => ({ ...DEFAULT_AVATAR_CONFIG, ...profile.avatarConfig }))
      } else {
        setAvatarConfig(profileGender === 'female' ? { ...FEMALE_AVATAR_CONFIG } : { ...MALE_AVATAR_CONFIG })
      }
      if (profile?.displayName) setDisplayName(profile.displayName)
    }).catch(() => {})
    auth.auth.getUser().then(({ data }: any) => {
      if (data?.user?.user_metadata?.displayName) setDisplayName((n) => n || data.user.user_metadata.displayName)
      else if (data?.user?.email) setDisplayName((n) => n || data.user.email.split('@')[0])
    }).catch(() => {})
  }, [])

  const handleSave = async () => {
    setErrorMsg(null)
    if (!displayName.trim()) {
      setErrorMsg('Vui lòng nhập tên hiển thị!')
      return
    }
    if (loading) return

    setLoading(true)
    try {
      const { error } = await auth
        .from('profiles')
        .update({ avatarConfig, displayName: displayName.trim() })
      if (error) throw new Error(error.message)

      if (embedded) {
        onSaved?.()
      } else {
        router.push(returnUrl)
        router.refresh()
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Lỗi lưu avatar. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (embedded) {
      onSaved?.()
      return
    }
    router.push(returnUrl)
  }

  const getHue = (layerKey: string) => {
    const value = Number(avatarConfig[`hue_${layerKey}`] || '0')
    return Number.isFinite(value) ? value : 0
  }

  return (
    <div className={`flex-1 flex overflow-hidden min-h-0 ${embedded ? 'rounded-2xl border border-slate-200 bg-[#282d4e] text-white' : ''}`}>
        {/* Sidebar */}
        <div className="w-64 shrink-0 border-r border-white/10 bg-secondary/50 p-4 flex flex-col gap-2 overflow-y-auto">
          <h2 className="text-xl font-bold px-4 mb-4 mt-2">Chỉnh avatar</h2>
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className={`flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all ${
                selectedCategory === cat.id ? 'bg-quaternary/20 text-quaternary' : 'hover:bg-white/5'
              }`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-lg">{cat.icon}</div>
              <span>{cat.label}</span>
            </div>
          ))}
        </div>

        {/* Main - Grid */}
        <div className="flex-1 p-6 flex flex-col overflow-hidden">
          <div className="rounded-2xl p-6 flex-1 overflow-y-auto bg-secondary/30 border border-white/5">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-4">
              {ASSETS[selectedCategory]?.map((item: any) => {
                const isSelected = avatarConfig[selectedCategory] === item.id
                return (
                  <div
                    key={item.id}
                    className={`aspect-square rounded-xl cursor-pointer flex items-center justify-center border-2 transition-all ${
                      isSelected ? 'border-quaternary bg-quaternary/20 scale-105' : 'border-transparent hover:bg-white/5'
                    }`}
                    onClick={() => setAvatarConfig({ ...avatarConfig, [selectedCategory]: item.id })}
                  >
                    {item.src ? (
                      <div style={{ filter: getHue(selectedCategory) ? `hue-rotate(${getHue(selectedCategory)}deg)` : undefined }}>
                        <SpriteIcon src={item.src} x={item.x || 0} y={item.y || 0} scale={1} />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/20" style={{ backgroundColor: item.color || '#fff3' }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          <div className="mt-6 p-4 rounded-2xl border border-white/10 bg-secondary/20">
            <p className="text-sm font-semibold mb-2">Màu sắc</p>
            <p className="text-xs text-white/60 mb-3">
              Đang chỉnh màu cho: {CATEGORIES.find((cat) => cat.id === selectedCategory)?.label || 'Avatar'}
            </p>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((colorOption) => (
                <button
                  key={colorOption.label}
                  type="button"
                  title={colorOption.label}
                  onClick={() =>
                    setAvatarConfig((prev) => ({
                      ...prev,
                      [`hue_${selectedCategory}`]: String(colorOption.hue),
                    }))
                  }
                  className={`h-8 w-8 rounded-full border-2 transition ${
                    getHue(selectedCategory) === colorOption.hue
                      ? 'border-quaternary scale-105'
                      : 'border-white/30 hover:scale-105'
                  }`}
                  style={{ backgroundColor: colorOption.color }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="w-[450px] shrink-0 border-l border-white/10 flex flex-col relative bg-secondary/5 min-h-0">
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[linear-gradient(#ccc_1px,transparent_1px),linear-gradient(90deg,#ccc_1px,transparent_1px)] bg-[length:40px_40px]" />
          <div className="absolute top-6 left-6 right-6 z-30">
            <input
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm font-semibold text-white placeholder-white/50 outline-none focus:border-quaternary"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Tên nhân vật..."
            />
          </div>
          <div className="relative z-10 flex-1 flex items-center justify-center min-h-0 pt-20 pb-20">
            <div className="scale-[4]">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-white text-[8px] px-2 py-0.5 rounded-full whitespace-nowrap z-20 font-bold bg-black/80">
                {displayName || 'Player'}
              </div>
              <div className="relative w-[64px] h-[64px]">
                {LAYER_ORDER.map((layerKey) => {
                  const itemId = avatarConfig[layerKey]
                  const itemData = ASSETS[layerKey]?.find((i: any) => i.id === itemId)
                  if (itemData?.src) {
                    return (
                      <div
                        key={layerKey}
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        style={{ filter: getHue(layerKey) ? `hue-rotate(${getHue(layerKey)}deg)` : undefined }}
                      >
                        <SpriteIcon src={itemData.src} x={itemData.x || 0} y={itemData.y || 0} size={64} />
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            </div>
          </div>
          <div className="relative z-30 p-6 border-t border-white/10 flex justify-end gap-3 bg-secondary/60 backdrop-blur-sm">
            <button
              className="px-6 py-2.5 rounded-xl font-semibold text-white/80 hover:bg-white/5"
              onClick={handleCancel}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              className="px-8 py-2.5 rounded-xl font-bold text-primary bg-quaternary hover:opacity-90 disabled:opacity-60"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : 'Xong'}
            </button>
          </div>
          {errorMsg && <div className="relative z-30 px-6 pb-4 text-sm text-red-400 text-center">{errorMsg}</div>}
        </div>
    </div>
  )
}
