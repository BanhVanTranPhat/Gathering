import { PUB } from "../../assetPaths";
import { SpriteSheetTile } from "./spritesheet";
import { SpriteSheetData } from "./SpriteSheetData";

const width = 512;
const height = 2848;
const url = `${PUB.tilesets}/Interiors_free_32x32.png`;

const sprites: SpriteSheetTile[] = [
  // Offices
  { name: "desk_pc_blue", x: 0, y: 0, width: 64, height: 64, layer: "object", colliders: [{ x: 0, y: 1 }, { x: 1, y: 1 }] },
  { name: "desk_pc_green", x: 192, y: 0, width: 64, height: 64, layer: "object", colliders: [{ x: 0, y: 1 }, { x: 1, y: 1 }] },
  { name: "chair_office_blue", x: 64, y: 32, width: 32, height: 32, layer: "above_floor" },
  { name: "chair_office_green", x: 256, y: 32, width: 32, height: 32, layer: "above_floor" },
  
  // Tables
  { name: "table_wood_large", x: 0, y: 448, width: 96, height: 64, layer: "object", colliders: [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }] },
  { name: "table_wood_round", x: 192, y: 480, width: 32, height: 32, layer: "object", colliders: [{ x: 0, y: 0 }] },
  
  // Carpets (Floor layer usually)
  { name: "carpet_red_large", x: 224, y: 544, width: 96, height: 64, layer: "floor" },
  { name: "carpet_blue_yellow", x: 416, y: 384, width: 64, height: 96, layer: "floor" },
  
  // Shelves
  { name: "bookshelf_packed", x: 160, y: 672, width: 64, height: 64, layer: "object", colliders: [{ x: 0, y: 1 }, { x: 1, y: 1 }] },
  
  // Sofas
  { name: "sofa_grey_large", x: 32, y: 2368, width: 96, height: 64, layer: "object", colliders: [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }] },
  { name: "sofa_blue_large", x: 32, y: 2592, width: 96, height: 64, layer: "object", colliders: [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }] },
  
  // Classroom
  { name: "classroom_desk", x: 224, y: 1344, width: 64, height: 32, layer: "object", colliders: [{ x: 0, y: 0 }, { x: 1, y: 0 }] },
  { name: "classroom_chair", x: 224, y: 1376, width: 32, height: 32, layer: "above_floor" },
  { name: "blackboard", x: 384, y: 2304, width: 96, height: 64, layer: "object", colliders: [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }] },

  // Elevator
  { name: "elevator_door", x: 0, y: 576, width: 64, height: 64, layer: "object", colliders: [{ x: 0, y: 1 }, { x: 1, y: 1 }] },
  { name: "elevator_button", x: 64, y: 608, width: 32, height: 32, layer: "object" },
  { name: "elevator_control_panel", x: 256, y: 928, width: 32, height: 64, layer: "object" },
  { name: "elevator_floor_indicator", x: 288, y: 928, width: 32, height: 32, layer: "object" },
  { name: "mirror_large", x: 352, y: 2240, width: 32, height: 64, layer: "object" },

  // Decoration
  { name: "potted_plant_large", x: 416, y: 1888, width: 32, height: 64, layer: "object", colliders: [{ x: 0, y: 1 }] },
  { name: "globe", x: 416, y: 1312, width: 32, height: 32, layer: "above_floor" },
];

const interiorsSpriteSheetData = new SpriteSheetData(width, height, url, sprites);
export { interiorsSpriteSheetData };
