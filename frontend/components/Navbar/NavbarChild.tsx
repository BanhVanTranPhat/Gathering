'use client'
import React, { useEffect } from 'react'
import { useModal } from '@/app/hooks/useModal'
import { useProfile } from '@/app/contexts/ProfileContext'
import { UserAvatarDisplay } from '../UserAvatarDisplay'
import { MagnifyingGlass, Plus, User } from '@phosphor-icons/react'

type NavbarChildProps = {
    name: string
    avatar?: string | null
}

export const NavbarChild: React.FC<NavbarChildProps> = ({ name, avatar }) => {
    const { setModal } = useModal()
    const { setProfile } = useProfile()

    useEffect(() => {
        setProfile(avatar ?? null, name)
    }, [avatar, name, setProfile])

    return (
        <div className='h-14'>
            <div className='w-full fixed bg-white border-b border-gray-200 flex items-center px-6 h-14 z-10'>
                {/* Left section - Logo + Join Space */}
                <div className='flex items-center gap-3'>
                    {/* Logo */}
                    <div className="w-8 h-8 bg-[#2b2d42] rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <circle cx="8" cy="8" r="3" fill="#fff"/>
                            <circle cx="16" cy="8" r="3" fill="#fff"/>
                            <circle cx="8" cy="16" r="3" fill="#fff"/>
                            <circle cx="16" cy="16" r="3" fill="#fff"/>
                            <circle cx="12" cy="12" r="2" fill="#fff" opacity="0.6"/>
                        </svg>
                    </div>

                    <button
                        onClick={() => setModal('Join Realm')}
                        className='px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors'
                    >
                        Join Space
                    </button>
                </div>

                {/* Right section */}
                <div className='flex items-center gap-3 ml-auto'>
                    {/* Account */}
                    <button
                        onClick={() => setModal('Account Dropdown')}
                        className='flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors'
                    >
                        <User className="w-4 h-4" />
                        Account
                    </button>

                    {/* Create Space */}
                    <button
                        onClick={() => setModal('Create Realm')}
                        className='flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm'
                    >
                        <Plus className="w-4 h-4" weight="bold" />
                        Create Space
                    </button>
                </div>
            </div>
        </div>
    )
}
