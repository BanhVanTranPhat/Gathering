import officeTiledMap from "@/utils/officeFromGathering03.json";

type TileData = {
  floor?: string;
  above_floor?: string;
  object?: string;
  impassable?: boolean;
};

type RealmMapData = {
  spawnpoint: { roomIndex: number; x: number; y: number };
  rooms: Array<{ name: string; tilemap: Record<string, TileData> }>;
};

const FLIP_MASK = 0xe0000000;
const ROOM_BUILDER_FIRST_GID = 1;
const INTERIORS_FIRST_GID = 392;

function clearFlipFlags(gid: number) {
  return (gid & ~FLIP_MASK) >>> 0;
}

function toSpriteName(rawGid: number) {
  const gid = clearFlipFlags(rawGid);
  if (!gid) return null;

  if (gid >= INTERIORS_FIRST_GID) {
    const localId = gid - INTERIORS_FIRST_GID;
    return `interiors-g${localId}`;
  }
  const localId = gid - ROOM_BUILDER_FIRST_GID;
  return `roomBuilder-g${localId}`;
}

function indexToCoord(index: number, width: number) {
  return { x: index % width, y: Math.floor(index / width) };
}

export function buildOfficeMapTemplate(): RealmMapData {
  const width = officeTiledMap.width;
  const tilemap: Record<string, TileData> = {};

  const layer1 = officeTiledMap.layers.find((l) => l.name === "Tile Layer 1");
  const layer2 = officeTiledMap.layers.find((l) => l.name === "Tile Layer 2");
  const layer3 = officeTiledMap.layers.find((l) => l.name === "Tile Layer 3");
  const layer4 = officeTiledMap.layers.find((l) => l.name === "Tile Layer 4");

  if (!layer1 || !layer2 || !layer3 || !layer4) {
    throw new Error("Office map is missing required tile layers.");
  }

  for (let i = 0; i < layer1.data.length; i++) {
    const { x, y } = indexToCoord(i, width);
    const key = `${x}, ${y}`;
    const data: TileData = {};

    const floorSprite = toSpriteName(layer1.data[i]);
    if (floorSprite) data.floor = floorSprite;

    const wallSprite = toSpriteName(layer2.data[i]);
    if (wallSprite) {
      data.object = wallSprite;
      data.impassable = true;
    }

    const decoSprite = toSpriteName(layer3.data[i]);
    if (decoSprite) data.above_floor = decoSprite;

    const furnitureSprite = toSpriteName(layer4.data[i]);
    if (furnitureSprite) {
      // Keep object interactable; do not force-block these tiles.
      data.object = furnitureSprite;
    }

    if (Object.keys(data).length > 0) {
      tilemap[key] = data;
    }
  }

  return {
    spawnpoint: { roomIndex: 0, x: 2, y: 2 },
    rooms: [
      {
        name: "TG03 Office",
        tilemap,
      },
    ],
  };
}

