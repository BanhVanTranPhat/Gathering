'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Github, X, ExternalLink, GitCommitHorizontal, GitPullRequest, Star } from 'lucide-react'

type GitHubPanelProps = {
    open: boolean
    onClose: () => void
}

const GitHubPanel: React.FC<GitHubPanelProps> = ({ open, onClose }) => {
    const [repoUrl, setRepoUrl] = useState('')
    const [connected, setConnected] = useState(false)

    useEffect(() => {
        if (!open) setConnected(false)
    }, [open])

    const handleConnect = useCallback(() => {
        if (repoUrl.trim()) {
            setConnected(true)
        }
    }, [repoUrl])

    if (!open) return null

    return (
        <div className="absolute top-3 right-3 z-30 w-80 animate-fade-in">
            <div className="bg-[#1e2140]/95 backdrop-blur-md border border-emerald-500/20 rounded-xl shadow-2xl overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />

                <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                <Github className="text-emerald-400" size={16} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm">GitHub Hub</h3>
                                <span className="text-emerald-400/60 text-[10px]">Code collaboration</span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/30 hover:text-white/60 p-1"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {!connected ? (
                        <div className="space-y-3">
                            <p className="text-white/50 text-xs">
                                Connect a GitHub repository to view activity and collaborate with your team.
                            </p>
                            <input
                                type="text"
                                placeholder="github.com/owner/repo"
                                value={repoUrl}
                                onChange={(e) => setRepoUrl(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40"
                            />
                            <button
                                onClick={handleConnect}
                                disabled={!repoUrl.trim()}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Github size={14} />
                                Connect Repository
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                                <span className="text-xs text-white/80 truncate">{repoUrl}</span>
                                <a
                                    href={`https://${repoUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-400 hover:text-emerald-300 ml-2"
                                >
                                    <ExternalLink size={12} />
                                </a>
                            </div>

                            <div className="space-y-1">
                                <h4 className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Recent Activity</h4>
                                {[
                                    { icon: <GitCommitHorizontal size={12} />, text: 'feat: add overview map', time: '2m ago', color: 'text-emerald-400' },
                                    { icon: <GitPullRequest size={12} />, text: 'PR #42: Fix zoom controls', time: '15m ago', color: 'text-blue-400' },
                                    { icon: <GitCommitHorizontal size={12} />, text: 'refactor: zone system', time: '1h ago', color: 'text-emerald-400' },
                                    { icon: <Star size={12} />, text: 'New star from @user', time: '3h ago', color: 'text-amber-400' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors">
                                        <span className={item.color}>{item.icon}</span>
                                        <span className="text-xs text-white/70 flex-1 truncate">{item.text}</span>
                                        <span className="text-[10px] text-white/30 shrink-0">{item.time}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setConnected(false)}
                                className="w-full text-center text-[10px] text-white/30 hover:text-white/50 py-1 transition-colors"
                            >
                                Disconnect repository
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default GitHubPanel
