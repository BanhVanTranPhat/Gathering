import Realm from './models/Realm'
import Profile from './models/Profile'

function isObjectId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id)
}

export async function getRealmById(id: string) {
  if (!id) return null
  const query = isObjectId(id) ? { $or: [{ _id: id }, { id }] } : { id }
  const realm = await Realm.findOne(query).lean()
  if (!realm) return null
  return {
    id: (realm as any).id || (realm as any)._id?.toString(),
    owner_id: realm.owner_id,
    name: realm.name,
    map_data: realm.map_data,
    share_id: realm.share_id,
    only_owner: realm.only_owner,
  }
}

export async function getProfileById(id: string) {
  const profile = await Profile.findOne({ id }).lean()
  return profile ? { id: profile.id, skin: profile.skin, avatarConfig: profile.avatarConfig || null, displayName: profile.displayName || null, visited_realms: profile.visited_realms || [], lastPositions: profile.lastPositions || {} } : null
}
