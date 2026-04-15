import { PUB } from '@/utils/assetPaths'

export type AvatarAsset = {
  id: string
  name: string
  spriteSrc: string
  frameWidth?: number
  frameHeight?: number
  previewSrc?: string
}

export type TilesetAsset = {
  id: string
  name: string
  src: string
  tileWidth: number
  tileHeight: number
  columns?: number
  margin?: number
  spacing?: number
}

export type ObjectAsset = {
  id: string
  name: string
  src: string
  width?: number
  height?: number
  offsetX?: number
  offsetY?: number
  interactable?: boolean
}

export type SoundAsset = {
  id: string
  name: string
  src: string
  volumeDefault?: number
  loop?: boolean
}

export const avatars: AvatarAsset[] = [
  {
    id: 'gather_default_worker',
    name: 'Gather Worker',
    spriteSrc: `${PUB.gather}/avatars/default_worker.png`,
  },
]

export const tilesets: TilesetAsset[] = [
  {
    id: 'gather_plants_outdoor',
    name: 'Gather Outdoor Plants',
    src: `${PUB.gather}/tilesets/gather_plants_outdoor_2.1.png`,
    tileWidth: 32,
    tileHeight: 32,
  },
  {
    id: 'gather_facade_elements',
    name: 'Gather Facade Elements',
    src: `${PUB.gather}/tilesets/gather_facade_elements_1.2.png`,
    tileWidth: 32,
    tileHeight: 32,
  },
]

export const objects: ObjectAsset[] = [
  {
    id: 'gather_object_sample_1',
    name: 'Gather Object Sample 1',
    src: `${PUB.gather}/objects/object_1.png`,
  },
]

export const sounds: SoundAsset[] = [
  {
    id: 'ambient_cafe',
    name: 'Cafe ambience',
    src: `${PUB.gather}/sounds/Cafe_AmbientLoop2_Gather.mp3`,
    loop: true,
    volumeDefault: 0.6,
  },
  {
    id: 'ambient_fire',
    name: 'Fire ambience',
    src: `${PUB.gather}/sounds/Fire_AmbientLoop1_Gather.mp3`,
    loop: true,
    volumeDefault: 0.6,
  },
]

