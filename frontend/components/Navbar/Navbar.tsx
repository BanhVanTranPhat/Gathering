import React from 'react'
import { createClient } from '@/utils/auth/server'
import { NavbarChild } from './NavbarChild'
import { formatEmailToName } from '@/utils/formatEmailToName'

export const Navbar: React.FC = async () => {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    const { data: profile } = await auth.from('profiles').select('avatar')

    const name = formatEmailToName(user?.user_metadata?.email ?? user?.email ?? '')
    const avatar = profile?.avatar ?? user?.user_metadata?.avatar_url ?? null

    return (
        <NavbarChild name={name} avatar={avatar} />
    )
}
