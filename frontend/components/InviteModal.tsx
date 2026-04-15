'use client'

import React, { useState } from 'react'
import { X, Copy } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'

type InviteModalProps = {
    open: boolean
    onClose: () => void
    inviteUrl: string
    roomName?: string
}

const InviteModal: React.FC<InviteModalProps> = ({ open, onClose, inviteUrl, roomName }) => {
    const [copied, setCopied] = useState(false)

    const copyLink = () => {
        if (!inviteUrl) return
        navigator.clipboard.writeText(inviteUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="absolute inset-0 bg-black/50"
                        onClick={onClose}
                        aria-hidden
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="relative w-full max-w-md bg-secondary rounded-xl shadow-xl border border-[#3F4776] p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Invite collaborators</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-light-secondary text-white/80 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                {roomName && (
                    <p className="text-sm text-[#9CA3AF] mb-3">
                        Mời mọi người vào <span className="text-white font-medium">{roomName}</span>
                    </p>
                )}
                <p className="text-xs text-[#9CA3AF] mb-2">Chia sẻ link này để mời người tham gia:</p>
                <div className="flex gap-2">
                    <input
                        type="text"
                        readOnly
                        value={inviteUrl}
                        className="flex-1 bg-darkblue rounded-lg px-3 py-2 text-sm text-white border border-[#3F4776] outline-none"
                    />
                    <button
                        type="button"
                        onClick={copyLink}
                        disabled={!inviteUrl}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-quaternary hover:bg-quaternaryhover text-primary font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Copy className="w-4 h-4" />
                        {copied ? 'Đã copy!' : 'Copy'}
                    </button>
                </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}

export default InviteModal
