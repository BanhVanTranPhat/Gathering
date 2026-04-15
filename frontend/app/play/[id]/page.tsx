import React from 'react'
import NotFound from '@/app/not-found'
import { createClient } from '@/utils/auth/server'
import { redirect } from 'next/navigation'
import { getPlayRealmData } from '@/utils/backend/getPlayRealmData'
import PlayClient from '../PlayClient'
import { updateVisitedRealms } from '@/utils/backend/updateVisitedRealms'
import { formatEmailToName } from '@/utils/formatEmailToName'
import { defaultSkin } from '@/utils/pixi/Player/skins'

export default async function Play({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ shareId?: string }> }) {
    const { id } = await params
    const { shareId: searchShareId } = await searchParams

    const auth = await createClient()
    const { data: { session } } = await auth.auth.getSession()
    const { data: { user } } = await auth.auth.getUser()

    if (!session || !user) {
        return redirect('/signin')
    }

    const { data, error } = !searchShareId
        ? await auth.from('realms').select('map_data, owner_id, name').eq('id', id).single()
        : await getPlayRealmData(session.access_token, searchShareId)

    const { data: profile, error: profileError } = await auth
        .from('profiles')
        .select('skin, avatarConfig, displayName')
        .eq('id', user.id)
        .single()

    if (!data || !profile) {
        const message =
            (error as { message?: string } | null)?.message ||
            (profileError as { message?: string } | null)?.message ||
            ''
        return <NotFound specialMessage={message} />
    }

    const realm = data
    const map_data = realm.map_data ?? {
        spawnpoint: { roomIndex: 0, x: 0, y: 0 },
        rooms: [{ name: 'New Room', tilemap: {} }],
    }

    const skin = profile.skin || defaultSkin
    const avatarConfig = profile.avatarConfig || null
    const username =
        profile.displayName?.trim() ||
        (user.user_metadata?.email ? formatEmailToName(user.user_metadata.email) : 'Player')

    const effectiveShareId = searchShareId || realm.share_id || ''

    if (effectiveShareId && realm.owner_id !== user.id) {
        updateVisitedRealms(session.access_token, effectiveShareId)
    }

    return (
        <PlayClient
            mapData={map_data}
            username={username}
            access_token={session.access_token}
            realmId={realm.id || id}
            uid={user.id}
            ownerId={realm.owner_id}
            shareId={effectiveShareId}
            initialSkin={skin}
            name={realm.name}
            avatarConfig={avatarConfig}
        />
    )
}
