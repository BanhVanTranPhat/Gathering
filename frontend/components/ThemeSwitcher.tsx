'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const APP_THEME_PATHS = ['/app', '/editor', '/play', '/manage']

export default function ThemeSwitcher() {
  const pathname = usePathname()

  useEffect(() => {
    const isAppTheme = pathname && APP_THEME_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
    if (isAppTheme) {
      document.documentElement.classList.add('app-theme')
    } else {
      document.documentElement.classList.remove('app-theme')
    }
  }, [pathname])

  return null
}
