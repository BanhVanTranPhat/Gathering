'use client'
import React, { useState } from 'react'
import BasicButton from '@/components/BasicButton'
import { createClient } from '@/utils/auth/client'
import { toast } from 'react-toastify'
import revalidate from '@/utils/revalidate'
import { useModal } from '../hooks/useModal'
import { Copy, ArrowLeft } from '@phosphor-icons/react'
import { v4 as uuidv4 } from 'uuid'
import BasicInput from '@/components/BasicInput'
import { removeExtraSpaces } from '@/utils/removeExtraSpaces'
import { useRouter } from 'next/navigation'

type ManageChildProps = {
    realmId: string
    startingShareId: string
    startingOnlyOwner: boolean
    startingName: string
}

const ManageChild:React.FC<ManageChildProps> = ({ realmId, startingShareId, startingOnlyOwner, startingName }) => {

    const [selectedTab, setSelectedTab] = useState(0)
    const [shareId, setShareId] = useState(startingShareId)
    const [onlyOwner, setOnlyOwner] = useState(startingOnlyOwner)
    const [name, setName] = useState(startingName)
    const { setModal, setLoadingText } = useModal()
    const router = useRouter()

    const auth = createClient()

    async function save() {
        if (name.trim() === '') {
            toast.error('Name cannot be empty!')
            return
        }

        setModal('Loading')
        setLoadingText('Saving...')

        const { error } = await auth
            .from('realms')
            .update({ 
                    only_owner: onlyOwner,
                    name: name,
                })
            .eq('id', realmId)

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Saved!')
        }

        revalidate('/manage/[id]')
        setModal('None')
    }

    function copyLink() {
        const link = process.env.NEXT_PUBLIC_BASE_URL + '/play/' + realmId + '?shareId=' + shareId
        navigator.clipboard.writeText(link)
        toast.success('Link copied!')
    }

    async function generateNewLink() {
        setModal('Loading')
        setLoadingText('Generating new link...')

        const newShareId = uuidv4()
        const { error } = await auth
            .from('realms')
            .update({ 
                share_id: newShareId
                })
            .eq('id', realmId)

        if (error) {
            toast.error(error.message)
        } else {
            setShareId(newShareId)
            const link = process.env.NEXT_PUBLIC_BASE_URL + '/play/' + realmId + '?shareId=' + newShareId
            navigator.clipboard.writeText(link)
            toast.success('New link copied!')
        }

        revalidate('/manage/[id]')
        setModal('None')
    }

    function onNameChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = removeExtraSpaces(e.target.value)
        setName(value)
    }

    const tabs = [
        { label: 'General', id: 0 },
        { label: 'Sharing Options', id: 1 },
    ]

    return (
        <div className='min-h-screen bg-[#1a1b2e]'>
            {/* Top bar */}
            <div className='flex items-center gap-3 px-6 py-4 border-b border-[#2D3054]'>
                <button
                    type="button"
                    onClick={() => router.push('/app')}
                    className='p-2 rounded-lg hover:bg-white/10 text-[#8B8FA3] hover:text-white transition-colors'
                    title="Back to Spaces"
                >
                    <ArrowLeft className='w-5 h-5' />
                </button>
                <div>
                    <h1 className='text-lg font-semibold text-white'>Manage Space</h1>
                    <p className='text-xs text-[#8B8FA3]'>{startingName}</p>
                </div>
            </div>

            <div className='max-w-3xl mx-auto px-6 py-8'>
                <div className='flex gap-8'>
                    {/* Sidebar tabs */}
                    <div className='w-[180px] flex-shrink-0'>
                        <div className='flex flex-col gap-1'>
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setSelectedTab(tab.id)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        selectedTab === tab.id
                                            ? 'bg-[#6C72CB]/20 text-[#6C72CB]'
                                            : 'text-[#8B8FA3] hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className='flex-1'>
                        <div className='bg-[#252840] rounded-xl border border-[#3F4776]/40 p-6'>
                            {selectedTab === 0 && (
                                <div className='flex flex-col gap-4'>
                                    <div>
                                        <label className='block text-sm font-medium text-[#8B8FA3] mb-1.5'>Space Name</label>
                                        <BasicInput value={name} onChange={onNameChange} maxLength={32} className='w-full' />
                                    </div>
                                </div>
                            )}
                            {selectedTab === 1 && (
                                <div className='flex flex-col gap-3'>
                                    <p className='text-sm text-[#8B8FA3] mb-1'>Share your space with others</p>
                                    <div className='flex flex-wrap gap-3'>
                                        <BasicButton className='flex flex-row items-center gap-2 text-sm' onClick={copyLink}>
                                            <Copy className="w-4 h-4" /> Copy Link
                                        </BasicButton>
                                        <BasicButton className='flex flex-row items-center gap-2 text-sm' onClick={generateNewLink}>
                                            <Copy className="w-4 h-4" /> Generate New Link
                                        </BasicButton>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Save button */}
                        <div className='flex justify-end mt-6'>
                            <BasicButton onClick={save} className='px-8'>
                                Save
                            </BasicButton>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ManageChild
