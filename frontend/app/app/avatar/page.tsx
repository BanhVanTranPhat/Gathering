import { createClient } from '@/utils/auth/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar/Navbar'
import AvatarSelection from './AvatarSelection'

export default async function AvatarPage() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) redirect('/signin')

  return (
    <div className="min-h-screen bg-primary text-white flex flex-col">
      <Navbar />
      <AvatarSelection />
    </div>
  )
}
