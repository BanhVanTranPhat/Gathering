type Bounds = { minX: number; maxX: number; minY: number; maxY: number };

type RoomWithTilemap = {
  tilemap: Record<string, unknown>;
};

export type RoomBoundsCache = Record<number, { tileCount: number; bounds: Bounds }>;

export function getRoomBounds(
  roomIndex: number,
  room: RoomWithTilemap,
  cache: RoomBoundsCache,
): Bounds {
  const keys = Object.keys(room.tilemap);
  const tileCount = keys.length;
  const cached = cache[roomIndex];
  if (cached && cached.tileCount === tileCount) {
    return cached.bounds;
  }

  let minX = 0;
  let maxX = 0;
  let minY = 0;
  let maxY = 0;
  if (keys.length > 0) {
    const coords = keys.map((k) => k.split(",").map(Number) as [number, number]);
    minX = Math.min(...coords.map(([x]) => x));
    maxX = Math.max(...coords.map(([x]) => x));
    minY = Math.min(...coords.map(([, y]) => y));
    maxY = Math.max(...coords.map(([, y]) => y));
  }

  const bounds = { minX, maxX, minY, maxY };
  cache[roomIndex] = { tileCount, bounds };
  return bounds;
}
