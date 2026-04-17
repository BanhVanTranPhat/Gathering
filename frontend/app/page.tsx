'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LandingPage from './landing/LandingPage'

const TOKEN_KEY = 'gathering_token'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem(TOKEN_KEY) || document.cookie.includes(TOKEN_KEY)
    if (token) {
      router.replace('/home')
    }
  }, [router])

  return <LandingPage />
}
