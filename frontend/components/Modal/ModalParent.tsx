'use client'
import React from 'react'
import CreateRealmModal from './CreateRealmModal'
import JoinRealmModal from './JoinRealmModal'
import AccountDropdown from '../AccountDropdown'
import LoadingModal from './LoadingModal'
import DeleteRoomModal from './DeleteRoomModal'
import TeleportModal from './TeleportModal'
import DeleteRealmModal from './DeleteRealmModal'
import FailedToConnectModal from './FailedToConnectModal'
import AvatarPickerModal from './AvatarPickerModal'
import DisconnectedModal from './DisconnectedModal'
import { useModal } from '@/app/hooks/useModal'
import { useProfile } from '@/app/contexts/ProfileContext'
import { createClient } from '@/utils/auth/client'
import revalidate from '@/utils/revalidate'
import { useRouter } from 'next/navigation'

const ModalParent:React.FC = () => {
    const { errorModal, modal, setModal } = useModal()
    const { avatar, displayName } = useProfile()
    const router = useRouter()

    const handleAvatarSelect = async (newAvatar: string) => {
        const auth = createClient()
        const { error } = await auth.from('profiles').update({ avatar: newAvatar })
        if (!error) {
            revalidate('/app')
            router.refresh()
        }
        setModal('None')
    }

    return (
        <div>
            {errorModal === 'None' && (
                <>
                    <CreateRealmModal />
                    <JoinRealmModal />
                    <AccountDropdown />
                    <LoadingModal />
                    <DeleteRoomModal />
                    <TeleportModal />
                    <DeleteRealmModal />
                    <AvatarPickerModal
                        isOpen={modal === 'Avatar Picker'}
                        onClose={() => setModal('None')}
                        currentAvatar={avatar ?? undefined}
                        displayName={displayName}
                        onSelect={handleAvatarSelect}
                    />
                </>
            )}
            <FailedToConnectModal />
            <DisconnectedModal />
        </div>
    )
}
export default ModalParent;