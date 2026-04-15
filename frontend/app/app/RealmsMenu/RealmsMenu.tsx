'use client'
import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import DesktopRealmItem from './DesktopRealmItem'
import { api } from '@/utils/backendApi'
import { createClient } from '@/utils/auth/client'
import revalidate from '@/utils/revalidate'
import { MagnifyingGlass } from '@phosphor-icons/react'

type Realm = {
    id: string,
    name: string,
    share_id: string
    shared?: boolean
    mapTemplate?: string
}

type RealmsMenuProps = {
    realms: Realm[]
    errorMessage: string
}

const RealmsMenu:React.FC<RealmsMenuProps> = ({ realms, errorMessage }) => {

    const [playerCounts, setPlayerCounts] = useState<number[]>([])
    const [activeTab, setActiveTab] = useState<'visited' | 'created'>('visited')
    const [search, setSearch] = useState('')
    const auth = createClient()

    useEffect(() => {
        if (errorMessage) {
            toast.error(errorMessage)
        }
    }, [errorMessage])

    useEffect(() => {
        getPlayerCounts()
        revalidate('/play/[id]')
    }, [])

    async function getPlayerCounts() {
        const { data: { session } } = await auth.auth.getSession()
        if (!session) return
        const query = new URLSearchParams({ realmIds: realms.map((realm: any) => realm.id).join(',') }).toString()
        const playerCountResult = await api
            .getWithToken<{ playerCounts?: number[] }>(`/getPlayerCounts?${query}`, session.access_token)
            .then((data) => ({ data, error: null }))
            .catch((error) => ({ data: null, error }))
        const playerCountData = playerCountResult.data
        if (playerCountData?.playerCounts) {
            setPlayerCounts(playerCountData.playerCounts)
        }
    }

    const ownedRealms = realms.filter(r => !r.shared)
    const visitedRealms = realms.filter(r => r.shared)

    const displayRealms = activeTab === 'created' ? ownedRealms : realms
    const searchLower = search.trim().toLowerCase()
    const filteredRealms = searchLower
        ? displayRealms.filter(r => r.name.toLowerCase().includes(searchLower))
        : displayRealms

    return (
        <>
            {/* Tabs + Search row */}
            <div className='flex items-center justify-between mb-6'>
                <div className='flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1'>
                    <button
                        type="button"
                        onClick={() => setActiveTab('visited')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                            activeTab === 'visited'
                                ? 'bg-gray-100 text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Last Visited
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('created')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                            activeTab === 'created'
                                ? 'bg-gray-100 text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Created Spaces
                    </button>
                </div>

                <div className='flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 w-56'>
                    <MagnifyingGlass className="w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className='flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none'
                    />
                </div>
            </div>

            {/* Space cards grid */}
            {filteredRealms.length === 0 ? (
                <div className='text-center py-16'>
                    <p className='text-gray-500 text-sm'>
                        {search ? 'No spaces match your search.' : 'No spaces yet. Create a space to get started!'}
                    </p>
                </div>
            ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {filteredRealms.map((realm, index) => {
                        const originalIndex = realms.findIndex(r => r.id === realm.id)
                        return (
                            <DesktopRealmItem
                                key={realm.id}
                                name={realm.name}
                                id={realm.id}
                                shareId={realm.share_id}
                                shared={realm.shared}
                                playerCount={playerCounts[originalIndex]}
                                mapTemplate={realm.mapTemplate}
                                imagePriority={index < 3}
                            />
                        )
                    })}
                </div>
            )}
        </>
    )
}

export default RealmsMenu
