'use client'

import React from 'react'
import { Hash, MessageCircle } from 'lucide-react'
import { ChatChannelData } from './ChatPanel'

type ChatHeaderProps = {
    channel: ChatChannelData
    uid: string
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ channel, uid }) => {
    const isChannel = channel.type === 'channel'

    return (
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
            {isChannel ? (
                <Hash size={16} className="text-white/40" />
            ) : (
                <MessageCircle size={16} className="text-white/40" />
            )}
            <h3 className="text-white font-semibold text-sm">{channel.name}</h3>
            {isChannel && (
                <span className="text-white/20 text-xs ml-auto">
                    channel
                </span>
            )}
        </div>
    )
}

export default ChatHeader
