import type { TilesetAsset, ObjectAsset, SoundAsset } from './gatherAssets'

export type TilePlacement = {
  x: number
  y: number
  tilesetId: TilesetAsset['id']
  tileIndex: number
}

export type ObjectPlacement = {
  x: number
  y: number
  objectId: ObjectAsset['id']
  rotation?: number
  scale?: number
}

export type MapDefinition = {
  id: string
  name: string
  width: number
  height: number
  tiles: TilePlacement[]
  objects: ObjectPlacement[]
  ambientSoundId?: SoundAsset['id']
}

export const sampleMaps: MapDefinition[] = [
  {
    id: 'sample_outdoor_garden',
    name: 'Sample Outdoor Garden',
    width: 20,
    height: 12,
    tiles: [
      {
        x: 5,
        y: 5,
        tilesetId: 'gather_plants_outdoor',
        tileIndex: 0,
      },
      {
        x: 6,
        y: 5,
        tilesetId: 'gather_plants_outdoor',
        tileIndex: 1,
      },
    ],
    objects: [
      {
        x: 8,
        y: 6,
        objectId: 'gather_object_sample_1',
      },
    ],
    ambientSoundId: 'ambient_cafe',
  },
]

