import { PUB } from "../../assetPaths";
import { SpriteSheetTile } from "./spritesheet";
import { SpriteSheetData } from "./SpriteSheetData";

const width = 512;
const height = 512;
const url = `${PUB.tilesets}/elevator.png`;

const sprites: SpriteSheetTile[] = [
  { 
    name: "main", 
    x: 0, 
    y: 0, 
    width: 512, 
    height: 512, 
    layer: "object",
    colliders: []
  }
];

const elevatorSpriteSheetData = new SpriteSheetData(width, height, url, sprites);
export { elevatorSpriteSheetData };
