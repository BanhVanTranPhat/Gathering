'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CATEGORIES, ASSETS, LAYER_ORDER, DEFAULT_AVATAR_CONFIG } from '@/utils/avatarAssets'
import { AvatarPreview } from '@/app/components/AvatarPreview'
import { avatars } from '@/app/config/gatherAssets'
import SpriteIcon from '@/components/SpriteIcon'
import { createClient } from '@/utils/auth/client'

const DEMO_COLORS = ['#FF5733', '#FFBD33', '#DBFF33', '#75FF33', '#33FF57', '#33FFBD', '#33DBFF', '#3357FF', '#7533FF', '#FF33BD']

export default function AvatarSelection() {
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
    auth.from('profiles').then((r: any) => {
      const profile = r?.data
      if (profile?.avatarConfig && typeof profile.avatarConfig === 'object' && Object.keys(profile.avatarConfig).length > 0) {
        setAvatarConfig((prev) => ({ ...DEFAULT_AVATAR_CONFIG, ...profile.avatarConfig }))
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
      const { error } = await auth.from('profiles').update({ avatarConfig, displayName: displayName.trim() })
      if (error) throw new Error(error.message)

      router.push(returnUrl)
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err?.message || 'Lỗi lưu avatar. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push(returnUrl)
  }

  return (
    <div className="flex-1 flex overflow-hidden min-h-0">
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
                      <SpriteIcon src={item.src} x={item.x || 0} y={item.y || 0} scale={1} />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/20" style={{ backgroundColor: item.color || '#fff3' }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          <div className="mt-6 p-4 rounded-2xl border border-white/10 flex gap-3 overflow-x-auto items-center">
            {avatars.map((avatar) => (
              <div key={avatar.id} className="shrink-0">
                <AvatarPreview avatarId={avatar.id} />
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="w-[450px] shrink-0 border-l border-white/10 flex flex-col items-center justify-center relative bg-secondary/5">
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[linear-gradient(#ccc_1px,transparent_1px),linear-gradient(90deg,#ccc_1px,transparent_1px)] bg-[length:40px_40px]" />
          <div className="absolute top-6 left-6 right-6 z-30">
            <input
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm font-semibold text-white placeholder-white/50 outline-none focus:border-quaternary"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Tên nhân vật..."
            />
          </div>
          <div className="relative z-10 scale-[4]">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-white text-[8px] px-2 py-0.5 rounded-full whitespace-nowrap z-20 font-bold bg-black/80">
              {displayName || 'Player'}
            </div>
            <div className="relative w-[64px] h-[64px]">
              {LAYER_ORDER.map((layerKey) => {
                const itemId = avatarConfig[layerKey]
                const itemData = ASSETS[layerKey]?.find((i: any) => i.id === itemId)
                if (itemData?.src) {
                  return (
                    <div key={layerKey} className="absolute inset-0 w-full h-full pointer-events-none">
                      <SpriteIcon src={itemData.src} x={itemData.x || 0} y={itemData.y || 0} size={64} />
                    </div>
                  )
                }
                return null
              })}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/10 flex justify-end gap-3 z-30 bg-secondary/50">
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
          {errorMsg && <div className="absolute bottom-20 left-6 right-6 text-sm text-red-400 text-center">{errorMsg}</div>}
        </div>
    </div>
  )
}
