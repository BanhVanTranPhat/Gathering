import NotFound from '@/app/not-found'
import { createClient } from '@/utils/auth/server'
import { redirect } from 'next/navigation'
import Editor from '../Editor'

export default async function RealmEditor({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()

    if (!user) {
        return redirect('/signin')
    }

    const { data, error } = await auth.from('realms').select('id, name, owner_id, map_data').eq('id', id).single()
    // Show not found page if we are not the owner or no data is returned
    if (!data) {
        return <NotFound />
    }
    const realm = data
    const map_data = realm.map_data ?? {
        spawnpoint: { roomIndex: 0, x: 0, y: 0 },
        rooms: [{ name: 'New Room', tilemap: {} }],
    }

    return (
        <div>
            <Editor realmData={map_data}/>
        </div>
    )
}