import { PUB } from "../../assetPaths";
import { SpriteSheetTile } from "./spritesheet";
import { SpriteSheetData } from "./SpriteSheetData";

const width = 160;
const height = 160;
const url = `${PUB.sprites}/external/office_appliances_tileset.png`;

const sprites: SpriteSheetTile[] = [
  {
    name: "office_desk",
    x: 0,
    y: 0,
    width: 64,
    height: 32,
    layer: "object",
    colliders: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ],
  },
  {
    name: "office_chair",
    x: 64,
    y: 0,
    width: 32,
    height: 32,
    layer: "above_floor",
  },
  { name: "monitor", x: 96, y: 0, width: 32, height: 32, layer: "above_floor" },
  {
    name: "desk_lamp",
    x: 128,
    y: 0,
    width: 32,
    height: 32,
    layer: "above_floor",
  },

  {
    name: "bookshelf",
    x: 0,
    y: 32,
    width: 64,
    height: 64,
    layer: "object",
    colliders: [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  },
  {
    name: "printer",
    x: 64,
    y: 32,
    width: 32,
    height: 32,
    layer: "object",
    colliders: [{ x: 0, y: 0 }],
  },
  {
    name: "water_dispenser",
    x: 96,
    y: 32,
    width: 32,
    height: 64,
    layer: "object",
    colliders: [{ x: 0, y: 1 }],
  },
  {
    name: "filing_cabinet",
    x: 128,
    y: 32,
    width: 32,
    height: 64,
    layer: "object",
    colliders: [{ x: 0, y: 1 }],
  },

  {
    name: "papers_stack",
    x: 64,
    y: 96,
    width: 32,
    height: 32,
    layer: "above_floor",
  },
  {
    name: "plant_pot",
    x: 96,
    y: 96,
    width: 32,
    height: 64,
    layer: "object",
    colliders: [{ x: 0, y: 1 }],
  },
  {
    name: "notice_board",
    x: 128,
    y: 96,
    width: 32,
    height: 32,
    layer: "object",
    colliders: [{ x: 0, y: 0 }],
  },

  {
    name: "server_rack",
    x: 0,
    y: 128,
    width: 32,
    height: 32,
    layer: "object",
    colliders: [{ x: 0, y: 0 }],
  },
  {
    name: "mail_sorter",
    x: 32,
    y: 128,
    width: 32,
    height: 32,
    layer: "object",
    colliders: [{ x: 0, y: 0 }],
  },
  {
    name: "clipboard",
    x: 64,
    y: 128,
    width: 32,
    height: 32,
    layer: "above_floor",
  },
  {
    name: "sticky_notes",
    x: 96,
    y: 128,
    width: 32,
    height: 32,
    layer: "above_floor",
  },
  {
    name: "desk_mat",
    x: 128,
    y: 128,
    width: 32,
    height: 32,
    layer: "above_floor",
  },
];

const collabDecorSpriteSheetData = new SpriteSheetData(
  width,
  height,
  url,
  sprites,
);

export { collabDecorSpriteSheetData };
