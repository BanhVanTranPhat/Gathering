import { PUB } from "../../assetPaths";
import { SpriteSheetData } from "./SpriteSheetData";
import { SpriteSheetTile } from "./spritesheet";

type WATilesetMeta = {
  sheetName: string;
  fileName: string;
  imageWidth: number;
  imageHeight: number;
  columns: number;
  tileCount: number;
};

const TILE_SIZE = 32;

const WA_TILESETS: WATilesetMeta[] = [
  {
    sheetName: "waSpecialZones",
    fileName: "WA_Special_Zones.png",
    imageWidth: 192,
    imageHeight: 64,
    columns: 6,
    tileCount: 12,
  },
  {
    sheetName: "waDecoration",
    fileName: "WA_Decoration.png",
    imageWidth: 384,
    imageHeight: 256,
    columns: 12,
    tileCount: 96,
  },
  {
    sheetName: "waMiscellaneous",
    fileName: "WA_Miscellaneous.png",
    imageWidth: 320,
    imageHeight: 352,
    columns: 10,
    tileCount: 110,
  },
  {
    sheetName: "waOtherFurniture",
    fileName: "WA_Other_Furniture.png",
    imageWidth: 384,
    imageHeight: 416,
    columns: 12,
    tileCount: 156,
  },
  {
    sheetName: "waRoomBuilder",
    fileName: "WA_Room_Builder.png",
    imageWidth: 800,
    imageHeight: 1280,
    columns: 25,
    tileCount: 1000,
  },
  {
    sheetName: "waSeats",
    fileName: "WA_Seats.png",
    imageWidth: 416,
    imageHeight: 448,
    columns: 13,
    tileCount: 182,
  },
  {
    sheetName: "waTables",
    fileName: "WA_Tables.png",
    imageWidth: 320,
    imageHeight: 864,
    columns: 10,
    tileCount: 270,
  },
  {
    sheetName: "waLogoLong",
    fileName: "WA_Logo_Long.png",
    imageWidth: 192,
    imageHeight: 32,
    columns: 6,
    tileCount: 6,
  },
  {
    sheetName: "waExterior",
    fileName: "WA_Exterior.png",
    imageWidth: 800,
    imageHeight: 1088,
    columns: 25,
    tileCount: 850,
  },
  {
    sheetName: "waUserInterface",
    fileName: "WA_User_Interface.png",
    imageWidth: 416,
    imageHeight: 672,
    columns: 13,
    tileCount: 273,
  },
];

function makeTiles(meta: WATilesetMeta): SpriteSheetTile[] {
  const tiles: SpriteSheetTile[] = [];
  for (let localId = 0; localId < meta.tileCount; localId++) {
    const col = localId % meta.columns;
    const row = Math.floor(localId / meta.columns);
    tiles.push({
      name: `g${localId}`,
      x: col * TILE_SIZE,
      y: row * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
      layer: "floor",
    });
  }
  return tiles;
}

const waSpriteSheetDataSet = Object.fromEntries(
  WA_TILESETS.map((meta) => {
    return [
      meta.sheetName,
      new SpriteSheetData(
        meta.imageWidth,
        meta.imageHeight,
        `${PUB.sprites}/workadventure-starter/tilesets/${meta.fileName}`,
        makeTiles(meta),
      ),
    ];
  }),
);

export { waSpriteSheetDataSet };
