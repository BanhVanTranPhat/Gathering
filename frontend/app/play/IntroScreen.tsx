'use client'
import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import AvatarPreview from '@/components/AvatarPreview'
import { DEFAULT_AVATAR_CONFIG } from '@/utils/avatarAssets'
import { PUB } from '@/utils/assetPaths'
import { Mic, MicOff, Video, VideoOff } from 'lucide-react'

type IntroScreenProps = {
    realmName: string
    username: string
    setUsername: (value: string) => void
    setShowIntroScreen: (show: boolean) => void
    avatarConfig?: Record<string, string> | null
}

const IntroScreen:React.FC<IntroScreenProps> = ({ realmName, username, setUsername, setShowIntroScreen, avatarConfig }) => {
    const config = avatarConfig && Object.keys(avatarConfig).length > 0 ? { ...DEFAULT_AVATAR_CONFIG, ...avatarConfig } : DEFAULT_AVATAR_CONFIG
    const [displayName, setDisplayName] = useState(username)
    const [isMicOn, setIsMicOn] = useState(false)
    const [isCamOn, setIsCamOn] = useState(false)
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
    const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>('')
    const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string>('')
    const [mediaError, setMediaError] = useState<string | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const videoRef = useRef<HTMLVideoElement | null>(null)

    useEffect(() => {
        setDisplayName(username)
    }, [username])

    useEffect(() => {
        if (!navigator.mediaDevices?.enumerateDevices) {
            return
        }

        const loadDevices = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices()
                const audios = devices.filter((device) => device.kind === 'audioinput')
                const videos = devices.filter((device) => device.kind === 'videoinput')

                setAudioDevices(audios)
                setVideoDevices(videos)

                if (audios.length && !selectedAudioDeviceId) {
                    setSelectedAudioDeviceId(audios[0].deviceId)
                }

                if (videos.length && !selectedVideoDeviceId) {
                    setSelectedVideoDeviceId(videos[0].deviceId)
                }
            } catch {
                setMediaError('Không thể tải danh sách thiết bị microphone/camera.')
            }
        }

        loadDevices()
        navigator.mediaDevices.addEventListener('devicechange', loadDevices)

        return () => {
            navigator.mediaDevices.removeEventListener('devicechange', loadDevices)
        }
    }, [selectedAudioDeviceId, selectedVideoDeviceId])

    useEffect(() => {
        const stopCurrentStream = () => {
            if (!streamRef.current) return
            streamRef.current.getTracks().forEach((track) => track.stop())
            streamRef.current = null
            if (videoRef.current) {
                videoRef.current.srcObject = null
            }
        }

        if (!isCamOn && !isMicOn) {
            stopCurrentStream()
            setMediaError(null)
            return
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setMediaError('Trình duyệt không hỗ trợ kiểm tra microphone/camera.')
            return
        }

        let cancelled = false

        const setupMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: isCamOn
                        ? selectedVideoDeviceId
                            ? { deviceId: { exact: selectedVideoDeviceId } }
                            : true
                        : false,
                    audio: isMicOn
                        ? selectedAudioDeviceId
                            ? { deviceId: { exact: selectedAudioDeviceId } }
                            : true
                        : false,
                })
                if (cancelled) {
                    stream.getTracks().forEach((track) => track.stop())
                    return
                }

                stopCurrentStream()
                streamRef.current = stream
                setMediaError(null)

                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                }
            } catch {
                stopCurrentStream()
                setMediaError('Không thể truy cập camera/mic. Hãy cấp quyền rồi thử lại.')
            }
        }

        setupMedia()

        return () => {
            cancelled = true
        }
    }, [isCamOn, isMicOn, selectedAudioDeviceId, selectedVideoDeviceId])

    useEffect(() => {
        return () => {
            if (!streamRef.current) return
            streamRef.current.getTracks().forEach((track) => track.stop())
        }
    }, [])

    const onJoin = () => {
        const finalName = displayName.trim() || username
        setUsername(finalName)
        setShowIntroScreen(false)
    }

    const onOpenAvatar = () => {
        const returnPath = `${window.location.pathname}${window.location.search}`
        window.location.href = `/app/avatar?return=${encodeURIComponent(returnPath)}`
    }

    return (
        <main className='relative min-h-screen w-full overflow-hidden bg-[#d9dce6] text-[#252836]'>
            <div className='pointer-events-none absolute -top-24 -left-20 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(76,93,217,0.2)_0%,rgba(76,93,217,0)_68%)]' />
            <div className='pointer-events-none absolute -bottom-36 -right-16 h-[440px] w-[440px] rounded-full bg-[radial-gradient(circle_at_center,rgba(36,53,84,0.18)_0%,rgba(36,53,84,0)_70%)]' />

            <header className='relative z-10 h-[72px] px-4 md:px-8 flex items-center justify-between border-b border-white/30'>
                <div className='flex items-center gap-3'>
                    <Image src={`${PUB.ui}/gather-logo.png`} alt='Gathering logo' width={30} height={30} className='rounded-lg' priority />
                    <span className='text-[34px] leading-none font-semibold tracking-[-0.01em]'>
                        {realmName}
                    </span>
                </div>
                <span className='rounded-full border border-[#8b93b7]/35 bg-white/55 px-3 py-1 text-sm text-[#3d4565]'>
                    {username}
                </span>
            </header>

            <section className='relative z-10 mx-auto w-full max-w-[1024px] px-4 md:px-6 pb-8 pt-6 lg:pt-[104px] grid grid-cols-1 lg:grid-cols-[520px_340px] lg:gap-[54px] gap-8 items-start'>
                <div className='relative h-[300px] w-[520px] max-w-full rounded-[24px] bg-[#1f2330] overflow-hidden border border-white/10 shadow-[0_24px_42px_rgba(20,24,40,0.28)]'>
                    {isCamOn && !mediaError ? (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className='absolute inset-0 h-full w-full object-cover'
                        />
                    ) : (
                        <div className='absolute inset-0 flex items-center justify-center text-white/65 text-[24px] font-medium'>
                            {mediaError || 'Your camera is off'}
                        </div>
                    )}

                    <div className='absolute bottom-[14px] left-1/2 -translate-x-1/2 flex items-center gap-[8px] rounded-full border border-white/10 bg-black/25 px-2 py-1 backdrop-blur-sm'>
                        <button
                            type='button'
                            onClick={() => setIsMicOn((v) => !v)}
                            className={`h-[28px] w-[28px] rounded-full flex items-center justify-center transition-colors ${isMicOn ? 'bg-[#3b4258] text-[#f4f7ff]' : 'bg-[#3b4258] text-[#f27f7f]'}`}
                            title={isMicOn ? 'Tắt microphone' : 'Bật microphone'}
                            aria-label={isMicOn ? 'Tắt microphone' : 'Bật microphone'}
                        >
                            {isMicOn ? <Mic size={13} strokeWidth={2.1} /> : <MicOff size={13} strokeWidth={2.1} />}
                        </button>

                        <button
                            type='button'
                            onClick={() => setIsCamOn((v) => !v)}
                            className={`h-[28px] w-[28px] rounded-full flex items-center justify-center transition-colors ${isCamOn ? 'bg-[#3b4258] text-[#f4f7ff]' : 'bg-[#3b4258] text-[#f27f7f]'}`}
                            title={isCamOn ? 'Tắt camera' : 'Bật camera'}
                            aria-label={isCamOn ? 'Tắt camera' : 'Bật camera'}
                        >
                            {isCamOn ? <Video size={13} strokeWidth={2.1} /> : <VideoOff size={13} strokeWidth={2.1} />}
                        </button>
                    </div>
                </div>

                <div className='w-[340px] max-w-full rounded-[22px] border border-white/45 bg-white/58 p-5 shadow-[0_14px_32px_rgba(43,52,79,0.16)] backdrop-blur-md'>
                    <h1 className='text-[42px] font-semibold leading-[0.95] tracking-[-0.02em] text-[#2c3145]'>
                        Welcome to {realmName}
                    </h1>
                    <p className='mt-3 text-[13px] text-[#5b6282] leading-5'>
                        Kiểm tra camera/mic và tên hiển thị trước khi vào không gian.
                    </p>

                    <label htmlFor='intro-display-name' className='mt-4 mb-[6px] block text-[12px] font-semibold uppercase tracking-[0.08em] text-[#636d95]'>
                        Tên nhân vật
                    </label>
                    <input
                        id='intro-display-name'
                        type='text'
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                onJoin()
                            }
                        }}
                        className='h-11 w-full rounded-lg border border-[#b9c1df] bg-white px-3 text-[15px] outline-none focus:border-[#4d59dd] focus:ring-2 focus:ring-[#4d59dd]/15'
                    />

                    <div className='mt-3 grid grid-cols-1 gap-[6px]'>
                        <label className='text-[11px] font-semibold uppercase tracking-[0.08em] text-[#636d95]'>
                            Microphone
                        </label>
                        <select
                            value={selectedAudioDeviceId}
                            onChange={(event) => setSelectedAudioDeviceId(event.target.value)}
                            className='h-10 w-full rounded-lg border border-[#b9c1df] bg-white px-3 text-sm text-[#323853] outline-none focus:border-[#4d59dd] focus:ring-2 focus:ring-[#4d59dd]/15 disabled:opacity-55'
                            disabled={!audioDevices.length}
                        >
                            {!audioDevices.length && <option>Không có microphone</option>}
                            {audioDevices.map((device, idx) => (
                                <option key={device.deviceId} value={device.deviceId}>
                                    {device.label || `Microphone ${idx + 1}`}
                                </option>
                            ))}
                        </select>

                        <label className='mt-[2px] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#636d95]'>
                            Camera
                        </label>
                        <select
                            value={selectedVideoDeviceId}
                            onChange={(event) => setSelectedVideoDeviceId(event.target.value)}
                            className='h-10 w-full rounded-lg border border-[#b9c1df] bg-white px-3 text-sm text-[#323853] outline-none focus:border-[#4d59dd] focus:ring-2 focus:ring-[#4d59dd]/15 disabled:opacity-55'
                            disabled={!videoDevices.length}
                        >
                            {!videoDevices.length && <option>Không có camera</option>}
                            {videoDevices.map((device, idx) => (
                                <option key={device.deviceId} value={device.deviceId}>
                                    {device.label || `Camera ${idx + 1}`}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className='mt-3 rounded-xl border border-[#b9c1df] bg-white px-4 py-3 flex items-center gap-3'>
                        <div className='h-14 w-14 rounded-lg bg-[#f4f6ff] flex items-center justify-center overflow-hidden border border-[#d8def4]' style={{ imageRendering: 'pixelated' }}>
                            <div style={{ transform: 'scale(1.45)', transformOrigin: 'center center' }}>
                                <AvatarPreview avatarConfig={config} size={48} />
                            </div>
                        </div>
                        <div>
                            <p className='text-sm font-semibold text-[#2f3550]'>Avatar nhân vật</p>
                            <p className='text-xs text-[#677098]'>
                                Chỉnh trực tiếp trước khi vào phòng.
                            </p>
                        </div>
                        <button
                            type='button'
                            onClick={onOpenAvatar}
                            className='ml-auto h-9 px-3 rounded-md border border-[#aeb8df] bg-[#eef1ff] hover:bg-[#e4e8ff] text-sm font-semibold text-[#3f4ab3]'
                        >
                            Đổi avatar
                        </button>
                    </div>

                    <button
                        type='button'
                        onClick={onJoin}
                        className='mt-4 h-11 w-full rounded-lg bg-gradient-to-r from-[#4454ea] to-[#3042db] text-white font-semibold hover:brightness-105 transition-all shadow-[0_8px_18px_rgba(55,74,220,0.36)]'
                    >
                        Join
                    </button>
                </div>
            </section>
        </main>
    )
}

export default IntroScreen