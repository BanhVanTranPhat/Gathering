'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Send } from 'lucide-react'

type MessageComposerProps = {
    onSend: (content: string) => void
    onTyping: () => void
    channelName: string
}

const MessageComposer: React.FC<MessageComposerProps> = ({ onSend, onTyping, channelName }) => {
    const [text, setText] = useState('')
    const lastTypingRef = useRef(0)

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setText(e.target.value)
        const now = Date.now()
        if (now - lastTypingRef.current > 1000) {
            lastTypingRef.current = now
            onTyping()
        }
    }, [onTyping])

    const handleSend = useCallback(() => {
        const trimmed = text.trim()
        if (!trimmed) return
        onSend(trimmed)
        setText('')
    }, [text, onSend])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }, [handleSend])

    return (
        <div className="px-4 py-3 border-t border-white/10">
            <div className="flex items-center gap-2 bg-white/5 rounded-lg border border-white/10 px-3 py-2 focus-within:border-white/20 transition-colors">
                <input
                    type="text"
                    value={text}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message #${channelName}`}
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none"
                    maxLength={500}
                />
                <button
                    onClick={handleSend}
                    disabled={!text.trim()}
                    className="text-white/30 hover:text-quaternary disabled:opacity-30 disabled:hover:text-white/30 transition-colors"
                >
                    <Send size={16} />
                </button>
            </div>
            <div className="flex justify-end mt-1">
                <span className="text-[9px] text-white/15">{text.length}/500</span>
            </div>
        </div>
    )
}

export default MessageComposer
