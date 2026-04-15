'use client'
import React, { useState } from 'react'
import Modal from './Modal'
import { useModal } from '@/app/hooks/useModal'
import BasicButton from '../BasicButton'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'

const JoinRealmModal: React.FC = () => {
    const { modal, setModal } = useModal()
    const [inviteLink, setInviteLink] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    function parseInviteLink(input: string): { realmId: string; shareId: string } | null {
        const trimmed = input.trim()

        // Try parsing as URL: /play/<realmId>?shareId=<shareId>
        try {
            const url = new URL(trimmed.startsWith('http') ? trimmed : `https://placeholder.com${trimmed.startsWith('/') ? trimmed : '/' + trimmed}`)
            const pathParts = url.pathname.split('/').filter(Boolean)
            const playIdx = pathParts.indexOf('play')
            if (playIdx !== -1 && pathParts[playIdx + 1]) {
                const realmId = pathParts[playIdx + 1]
                const shareId = url.searchParams.get('shareId') || ''
                if (realmId && shareId) {
                    return { realmId, shareId }
                }
            }
        } catch {}

        return null
    }

    function handleJoin() {
        const parsed = parseInviteLink(inviteLink)
        if (!parsed) {
            toast.error('Invalid invite link. Paste a full space URL.')
            return
        }
        setLoading(true)
        router.push(`/play/${parsed.realmId}?shareId=${parsed.shareId}`)
        setModal('None')
        setInviteLink('')
        setLoading(false)
    }

    return (
        <Modal open={modal === 'Join Realm'} closeOnOutsideClick>
            <div className="flex flex-col p-6 gap-5">
                <div className="text-center">
                    <h1 className="text-xl font-semibold">Join a Space</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Paste an invite link to join an existing space
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Invite Link
                    </label>
                    <input
                        type="text"
                        className="w-full rounded-lg border border-gray-600/50 bg-[#1E2035] py-2.5 px-3 text-white text-sm placeholder-gray-500 outline-none focus:border-blue-500 transition-colors"
                        placeholder="https://example.com/play/abc123?shareId=xyz"
                        value={inviteLink}
                        onChange={(e) => setInviteLink(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                        autoFocus
                    />
                </div>

                <div className="flex gap-3 pt-1">
                    <button
                        onClick={() => { setModal('None'); setInviteLink('') }}
                        className="flex-1 py-2.5 rounded-lg border border-gray-600 text-sm font-medium hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <BasicButton
                        disabled={inviteLink.trim().length === 0 || loading}
                        onClick={handleJoin}
                        className="flex-1 !py-2.5 text-sm font-medium"
                    >
                        {loading ? 'Joining...' : 'Join Space'}
                    </BasicButton>
                </div>
            </div>
        </Modal>
    )
}

export default JoinRealmModal
