'use client'
import React, { Fragment } from 'react'
import { useModal } from '@/app/hooks/useModal'
import { Dialog, Transition } from '@headlessui/react'
import { createClient } from '@/utils/auth/client'
import { useRouter } from 'next/navigation'
import { UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { TShirt } from '@phosphor-icons/react'

const AccountDropdown: React.FC = () => {
    const { modal, setModal } = useModal()
    const router = useRouter()

    async function handleSignOut() {
        setModal('None')
        const auth = createClient()
        await auth.auth.signOut()
        router.push('/')
        router.refresh()
    }

    return (
        <Transition.Root show={modal === 'Account Dropdown'} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => setModal('None')}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/20" aria-hidden="true" />
                </Transition.Child>

                <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
                    <div className="flex min-h-full justify-end pt-16 pr-4 sm:pr-8">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 translate-y-2"
                            enterTo="opacity-100 translate-y-0"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 translate-y-0"
                            leaveTo="opacity-0 translate-y-2"
                        >
                            <Dialog.Panel tabIndex={0} className="bg-secondary border border-light-secondary rounded-lg shadow-xl overflow-hidden min-w-[200px] h-fit">
                                <button
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-light-secondary animate-colors"
                                    onClick={() => setModal('Avatar Picker')}
                                >
                                    <UserCircleIcon className="w-5 h-5" />
                                    Đổi avatar
                                </button>
                                <button
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-light-secondary animate-colors border-t border-light-secondary"
                                    onClick={() => { setModal('None'); router.push('/app/avatar') }}
                                >
                                    <TShirt className="w-5 h-5" weight="regular" />
                                    Đổi avatar nhân vật
                                </button>
                                <button
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-light-secondary animate-colors border-t border-light-secondary"
                                    onClick={handleSignOut}
                                >
                                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                                    Đăng xuất
                                </button>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}

export default AccountDropdown