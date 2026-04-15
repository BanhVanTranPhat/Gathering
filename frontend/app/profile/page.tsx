'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, RefreshCw } from 'lucide-react'
import { api, getToken } from '@/utils/backendApi'
import AvatarPreview from '@/components/AvatarPreview'
import { DEFAULT_AVATAR_CONFIG } from '@/utils/avatarAssets'

type ProfileData = {
  id: string
  displayName?: string
  bio?: string
  skin?: string
  avatar?: string
  avatarConfig?: Record<string, string>
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      router.push('/signin')
      return
    }
    api.get<ProfileData>('/profiles/me')
      .then((data) => {
        setProfile(data)
        setDisplayName(data.displayName || '')
        setBio(data.bio || '')
      })
      .catch(() => router.push('/signin'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const updated = await api.patch<ProfileData>('/profiles/me', { displayName, bio })
      setProfile(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {}
    setSaving(false)
  }

  const config = profile?.avatarConfig && Object.keys(profile.avatarConfig).length > 0
    ? { ...DEFAULT_AVATAR_CONFIG, ...profile.avatarConfig }
    : DEFAULT_AVATAR_CONFIG

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1b2e] flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1b2e] text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="text-2xl font-bold mb-8">Profile Settings</h1>

        <div className="bg-[#252840] rounded-2xl border border-[#2D3054] p-6 space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-[#1E2035] border border-[#2D3054] overflow-hidden flex items-center justify-center">
              <AvatarPreview avatarConfig={config} size={64} />
            </div>
            <div>
              <p className="text-sm font-medium text-white mb-1">Avatar</p>
              <button
                onClick={() => router.push('/app/avatar?return=/profile')}
                className="text-xs text-[#6C72CB] hover:text-[#8B8FE8] font-medium transition-colors"
              >
                Change avatar
              </button>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              className="w-full px-4 py-2.5 rounded-xl bg-[#1E2035] border border-[#3F4776] text-white text-sm outline-none focus:border-[#6C72CB] placeholder-gray-500 transition-colors"
              placeholder="Your display name"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-[#1E2035] border border-[#3F4776] text-white text-sm outline-none focus:border-[#6C72CB] placeholder-gray-500 resize-none transition-colors"
              placeholder="Tell us about yourself..."
            />
            <p className="text-[10px] text-gray-500 mt-1 text-right">{bio.length}/300</p>
          </div>

          {/* User ID */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">User ID</label>
            <p className="text-xs text-gray-500 bg-[#1E2035] px-4 py-2.5 rounded-xl border border-[#2D3054] font-mono select-all">
              {profile?.id}
            </p>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#6C72CB] hover:bg-[#5A60B5] text-white text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <><Check className="w-4 h-4" /> Saved</>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
