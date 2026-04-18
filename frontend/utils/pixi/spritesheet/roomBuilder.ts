import { PUB } from "../../assetPaths";
import { SpriteSheetTile } from "./spritesheet";
import { SpriteSheetData } from "./SpriteSheetData";

const width = 544;
const height = 736;
const url = `${PUB.tilesets}/Room_Builder_v2_32x32.png`;
const TILE_SIZE = 32;
const TILE_COLS = width / TILE_SIZE;
const TILE_ROWS = height / TILE_SIZE;
const TILE_COUNT = TILE_COLS * TILE_ROWS;

const namedSprites: SpriteSheetTile[] = [
  // Floors
  { name: "floor_wood_light", x: 352, y: 192, width: 32, height: 32, layer: "floor" },
  { name: "floor_tiles_grey", x: 352, y: 448, width: 32, height: 32, layer: "floor" },
  { name: "floor_carpet_red", x: 352, y: 64, width: 32, height: 32, layer: "floor" },
  { name: "floor_tiles_blue", x: 352, y: 320, width: 32, height: 32, layer: "floor" },

  // Walls (White/Grey)
  { name: "wall_white_mid", x: 128, y: 576, width: 32, height: 64, layer: "object", colliders: [{ x: 0, y: 1 }] },
  { name: "wall_white_left", x: 96, y: 576, width: 32, height: 64, layer: "object", colliders: [{ x: 0, y: 1 }] },
  { name: "wall_white_right", x: 160, y: 576, width: 32, height: 64, layer: "object", colliders: [{ x: 0, y: 1 }] },
  
  // Walls (Wood)
  { name: "wall_wood_mid", x: 128, y: 384, width: 32, height: 64, layer: "object", colliders: [{ x: 0, y: 1 }] },
  { name: "wall_wood_left", x: 96, y: 384, width: 32, height: 64, layer: "object", colliders: [{ x: 0, y: 1 }] },
  { name: "wall_wood_right", x: 160, y: 384, width: 32, height: 64, layer: "object", colliders: [{ x: 0, y: 1 }] },

  // Simple floor from the "free" wood image if needed, but the v2 one has better tiles.
  // I'll stick to V2 for now as it's more complete for a map.
];

const gridSprites: SpriteSheetTile[] = Array.from({ length: TILE_COUNT }, (_, localId) => {
  const col = localId % TILE_COLS;
  const row = Math.floor(localId / TILE_COLS);
  return {
    name: `g${localId}`,
    x: col * TILE_SIZE,
    y: row * TILE_SIZE,
    width: TILE_SIZE,
    height: TILE_SIZE,
    layer: "floor",
  };
});

const roomBuilderSpriteSheetData = new SpriteSheetData(width, height, url, [
  ...namedSprites,
  ...gridSprites,
]);
export { roomBuilderSpriteSheetData };
