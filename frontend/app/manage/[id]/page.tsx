import { createClient } from '@/utils/auth/server'
import { redirect } from 'next/navigation'
import ManageChild from '../ManageChild'
import NotFound from '../../not-found'

export default async function Manage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const auth = await createClient()

    const { data: { user } } = await auth.auth.getUser()
    const { data: { session } } = await auth.auth.getSession()

    if (!user || !session) {
        return redirect('/signin')
    }

    const { data, error } = await auth.from('realms').select('id, name, owner_id, map_data, share_id, only_owner').eq('id', id).single()
    // Show not found page if no data is returned
    if (!data) {
        return <NotFound />
    }
    const realm = data

    return (
        <div>
            <ManageChild 
                realmId={realm.id} 
                startingShareId={realm.share_id} 
                startingOnlyOwner={realm.only_owner} 
                startingName={realm.name}
            />
        </div>
    )
}