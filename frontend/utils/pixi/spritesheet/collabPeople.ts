import { PUB } from "../../assetPaths";
import { SpriteSheetTile } from "./spritesheet";
import { SpriteSheetData } from "./SpriteSheetData";

const width = 800;
const height = 669;
const url = `${PUB.sprites}/external/office_characters_preview.png`;

const sprites: SpriteSheetTile[] = [
  {
    name: "analyst_orange",
    x: 0,
    y: 0,
    width: 250,
    height: 220,
    layer: "object",
  },
  { name: "lead_red", x: 268, y: 0, width: 250, height: 220, layer: "object" },
  { name: "lead_blue", x: 530, y: 0, width: 250, height: 220, layer: "object" },
  {
    name: "developer_laptop",
    x: 180,
    y: 246,
    width: 300,
    height: 420,
    layer: "object",
  },
  {
    name: "strategist_green",
    x: 430,
    y: 250,
    width: 260,
    height: 250,
    layer: "object",
  },
];

const collabPeopleSpriteSheetData = new SpriteSheetData(
  width,
  height,
  url,
  sprites,
);

export { collabPeopleSpriteSheetData };
