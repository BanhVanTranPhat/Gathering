'use client'

import React, { useEffect, useRef } from 'react'
import { ChatMessageData } from './ChatPanel'

type MessageViewProps = {
    messages: ChatMessageData[]
    uid: string
    typingUser: string | null
}

function formatTime(ts: string) {
    const d = new Date(ts)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (isToday) return time
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`
}

function getInitialColor(name: string): string {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#ef4444']
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return colors[Math.abs(hash) % colors.length]
}

const MessageView: React.FC<MessageViewProps> = ({ messages, uid, typingUser }) => {
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages.length])

    return (
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
            {messages.length === 0 && (
                <div className="flex items-center justify-center h-full text-white/20 text-sm">
                    No messages yet. Start the conversation!
                </div>
            )}

            {messages.map((msg, i) => {
                const isOwn = msg.senderId === uid
                const showHeader = i === 0 || messages[i - 1].senderId !== msg.senderId
                const color = getInitialColor(msg.senderName)

                return (
                    <div key={msg._id} className={`group ${showHeader ? 'mt-3' : ''}`}>
                        {showHeader && (
                            <div className="flex items-baseline gap-2 mb-0.5">
                                <span
                                    className="text-xs font-semibold"
                                    style={{ color }}
                                >
                                    {msg.senderName}
                                </span>
                                <span className="text-[10px] text-white/20">
                                    {formatTime(msg.timestamp)}
                                </span>
                            </div>
                        )}
                        <div className="flex items-start gap-2">
                            <p className="text-sm text-white/80 leading-relaxed break-words whitespace-pre-wrap">
                                {msg.content}
                            </p>
                            {!showHeader && (
                                <span className="text-[9px] text-white/0 group-hover:text-white/20 transition-colors shrink-0">
                                    {formatTime(msg.timestamp)}
                                </span>
                            )}
                        </div>
                    </div>
                )
            })}

            {typingUser && (
                <div className="flex items-center gap-2 pt-1">
                    <div className="flex gap-0.5">
                        {[0, 1, 2].map(i => (
                            <div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce"
                                style={{ animationDelay: `${i * 0.15}s` }}
                            />
                        ))}
                    </div>
                    <span className="text-[10px] text-white/30">{typingUser} is typing...</span>
                </div>
            )}
        </div>
    )
}

export default MessageView
