'use client'

import React from 'react'
import { MessageCircle } from 'lucide-react'
import { ChatChannelData } from './ChatPanel'

type DirectMessageListProps = {
    dms: ChatChannelData[]
    activeId: string | null
    onSelect: (channel: ChatChannelData) => void
    uid: string
}

const DirectMessageList: React.FC<DirectMessageListProps> = ({ dms, activeId, onSelect, uid }) => {
    const getDmPartnerName = (dm: ChatChannelData) => {
        return dm.name || 'Direct Message'
    }

    return (
        <div className="py-2 border-t border-white/5">
            <div className="flex items-center justify-between px-3 mb-1">
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">
                    Direct Messages
                </span>
            </div>

            {dms.length === 0 ? (
                <div className="px-3 py-2 text-[10px] text-white/20">
                    No conversations yet
                </div>
            ) : (
                dms.map(dm => (
                    <button
                        key={dm._id}
                        onClick={() => onSelect(dm)}
                        className={`w-full text-left px-3 py-1.5 flex items-center gap-2 text-xs transition-colors ${
                            activeId === dm._id
                                ? 'bg-white/10 text-white'
                                : 'text-white/50 hover:bg-white/5 hover:text-white/70'
                        }`}
                    >
                        <MessageCircle size={14} className="shrink-0 opacity-60" />
                        <span className="truncate">{getDmPartnerName(dm)}</span>
                    </button>
                ))
            )}
        </div>
    )
}

export default DirectMessageList
