'use client'

import React, { useState } from 'react'
import { Hash, Plus, X } from 'lucide-react'
import { ChatChannelData } from './ChatPanel'

type ChannelListProps = {
    channels: ChatChannelData[]
    activeId: string | null
    onSelect: (channel: ChatChannelData) => void
    onCreate: (name: string) => void
}

const ChannelList: React.FC<ChannelListProps> = ({ channels, activeId, onSelect, onCreate }) => {
    const [showCreate, setShowCreate] = useState(false)
    const [newName, setNewName] = useState('')

    const handleCreate = () => {
        if (newName.trim()) {
            onCreate(newName.trim())
            setNewName('')
            setShowCreate(false)
        }
    }

    return (
        <div className="py-2">
            <div className="flex items-center justify-between px-3 mb-1">
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Channels</span>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="text-white/30 hover:text-white/60 transition-colors"
                >
                    {showCreate ? <X size={12} /> : <Plus size={12} />}
                </button>
            </div>

            {showCreate && (
                <div className="px-2 mb-1">
                    <div className="flex gap-1">
                        <input
                            type="text"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            placeholder="channel-name"
                            className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
                            maxLength={30}
                            autoFocus
                        />
                        <button
                            onClick={handleCreate}
                            className="bg-quaternary/80 hover:bg-quaternary text-white px-2 py-1 rounded text-xs"
                        >
                            Add
                        </button>
                    </div>
                </div>
            )}

            {channels.map(ch => (
                <button
                    key={ch._id}
                    onClick={() => onSelect(ch)}
                    className={`w-full text-left px-3 py-1.5 flex items-center gap-2 text-xs transition-colors ${
                        activeId === ch._id
                            ? 'bg-white/10 text-white'
                            : 'text-white/50 hover:bg-white/5 hover:text-white/70'
                    }`}
                >
                    <Hash size={14} className="shrink-0 opacity-60" />
                    <span className="truncate">{ch.name}</span>
                </button>
            ))}
        </div>
    )
}

export default ChannelList
