'use client'
import { ArrowLeftEndOnRectangleIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import BasicButton from '@/components/BasicButton'
import signal from '@/utils/signal'
import { useModal } from '@/app/hooks/useModal'
import { RealmData } from '@/utils/pixi/types'
import { createClient } from '@/utils/auth/client'
import { useParams } from 'next/navigation'
import { toast } from 'react-toastify'
import revalidate from '@/utils/revalidate'
import { FloppyDisk } from '@phosphor-icons/react'
import { saveRealm } from '@/utils/backend/saveRealm'

type TopBarProps = {
    
}

const TopBar:React.FC<TopBarProps> = () => {

    const { setLoadingText, setModal } = useModal()
    const { id } = useParams()

    const [barWidth, setBarWidth] = useState<number>(0)

    const auth = createClient()

    function beginSave() {
        signal.emit('beginSave')
        setModal('Loading')
        setLoadingText('Saving...')
    }

    useEffect(() => {
        const save = async (realmData: RealmData) => {
            const { data: { session } } = await auth.auth.getSession()
            if (!session) return

            const { error } = await saveRealm(session.access_token, realmData, id as string)

            if (error) {
                toast.error(error.message)
            } else {
                toast.success('Saved!')
            }

            revalidate('/editor/[id]')
            revalidate('/play/[id]')
            setModal('None')
            signal.emit('saved')
        }

        const onBarWidth = (width: number) => {
            setBarWidth(width)
        }

        signal.on('save', save)
        signal.on('barWidth', onBarWidth)

        return () => {
            signal.off('save', save)
            signal.off('barWidth', onBarWidth)
        }
    }, [])

    function getBgColor() {
        if (barWidth < 0.7) {
            return 'bg-quaternary'
        } else if (barWidth < 0.9) {
            return 'bg-orange-400'
        } else {
            return 'bg-red-500'
        }
    }

    return (
        <div className='w-full h-[48px] bg-[#1e2240] flex flex-row items-center px-3 border-b border-black/30 gap-3 relative'>
            <Link href={'/app'} className='hover:bg-white/10 transition-colors rounded-lg p-1.5 group' title='Back to spaces'>
                <ArrowLeftEndOnRectangleIcon className='h-5 w-5 text-gray-400 group-hover:text-white transition-colors'/>
            </Link>

            <div className='w-px h-6 bg-white/10' />

            <button
                onClick={beginSave}
                className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-quaternary/90 hover:bg-quaternary text-white text-sm font-medium transition-all hover:shadow-md hover:shadow-quaternary/20 active:scale-95'
            >
                <FloppyDisk className='h-4 w-4' weight='bold'/>
                Save
            </button>

            <p className='text-[11px] text-gray-500 hidden md:block'>Saving kicks online players</p>

            <div className='absolute right-4 xl:right-[420px] hidden lg:flex items-center gap-2'>
                {barWidth > 0.9 && (
                    <p className='text-[11px] font-medium text-red-400'>
                        {barWidth >= 1 ? 'Out of space!' : 'Running low!'}
                    </p>
                )}
                <div className='w-48 h-2 rounded-full bg-white/10 overflow-hidden'>
                    <div
                        className={`${getBgColor()} h-full rounded-full transition-all duration-300`}
                        style={{ width: barWidth * 100 + '%' }}
                    />
                </div>
            </div>
        </div>
    )
}

export default TopBar