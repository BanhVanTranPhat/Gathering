'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-white">
      <h1 className="text-xl font-bold mb-2">Đã xảy ra lỗi</h1>
      <p className="text-white/70 mb-6 text-center max-w-md">{error.message}</p>
      <button
        onClick={reset}
        className="px-6 py-2.5 rounded-xl font-semibold bg-quaternary text-primary hover:opacity-90"
      >
        Thử lại
      </button>
    </div>
  )
}
