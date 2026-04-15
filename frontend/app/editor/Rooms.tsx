import React, { useEffect, useState, useRef } from 'react'
import { PlusCircleIcon } from '@heroicons/react/24/outline'
import BasicButton from '@/components/BasicButton'
import signal from '@/utils/signal'
import { useModal } from '../hooks/useModal'
import RoomItem from './RoomItem'
import { toast } from 'react-toastify'

type RoomsProps = {
    rooms: string[]
    setRooms: (rooms: string[]) => void
    roomIndex: number
    setRoomIndex: (index: number) => void
}

const Rooms:React.FC<RoomsProps> = ({ rooms, setRooms, roomIndex, setRoomIndex }) => {
    const roomsContainerRef = useRef<HTMLDivElement>(null)
    const { setModal, setLoadingText }= useModal()
    const firstRender = useRef(true)

    function onClickCreateRoom() {
        if (rooms.length >= 50) {
            toast.error('You can only have up to 50 rooms.')
            return
        }

        signal.emit('createRoom')
    }

    useEffect(() => {
        // scroll when new room is created
        if (firstRender.current === false) {
            roomsContainerRef.current?.scrollTo(0, roomsContainerRef.current.scrollHeight)
        }

        const onNewRoom = (newRoom: string) => {
            setRooms([...rooms, newRoom])
            firstRender.current = false
        }

        const onLoadingRoom = () => {
            setModal('Loading')
            setLoadingText('Loading room...')
        }

        const onRoomChanged = (index: number) => {
            setRoomIndex(index)
            setModal('None')
        }

        const onRoomDeleted = ({ deletedIndex, newIndex }: { deletedIndex: number, newIndex: number }) => {
            setRoomIndex(newIndex)
            const newRooms = [...rooms]
            newRooms.splice(deletedIndex, 1)
            setRooms(newRooms)
        }

        const onRoomNameChanged = ({ index, newName }: { index: number, newName: string }) => {
            const newRooms = [...rooms]
            newRooms[index] = newName
            setRooms(newRooms)
        }

        signal.on('newRoom', onNewRoom)
        signal.on('loadingRoom', onLoadingRoom)
        signal.on('roomChanged', onRoomChanged)
        signal.on('roomDeleted', onRoomDeleted)
        signal.on('roomNameChanged', onRoomNameChanged)

        return () => {
            signal.off('newRoom', onNewRoom)
            signal.off('loadingRoom', onLoadingRoom)
            signal.off('roomChanged', onRoomChanged)
            signal.off('roomDeleted', onRoomDeleted)
            signal.off('roomNameChanged', onRoomNameChanged)
        }
    }, [rooms])

    return (
        <div className='flex flex-col gap-2 w-full'>
                <span className='text-xs font-medium text-gray-400 uppercase tracking-wider'>Rooms</span>
                <div className='flex flex-col w-full overflow-y-auto max-h-[140px] gap-1 transparent-scrollbar' ref={roomsContainerRef}>
                    {rooms.map((room, index) => <RoomItem rooms={rooms} selectedRoomIndex={roomIndex} roomIndex={index} roomName={room} setRooms={setRooms} key={index}/>)}
                </div>
                <button
                    className='flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-dashed border-white/20 text-sm text-gray-400 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all mb-2'
                    onClick={onClickCreateRoom}
                >
                    <PlusCircleIcon className='h-4 w-4'/>
                    Add Room
                </button>
        </div>
    )
}

export default Rooms