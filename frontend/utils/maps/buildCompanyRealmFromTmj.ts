import type { AiMapManifestEntry } from "@/utils/maps/aiMapManifest";

type TileData = {
  floor?: string;
  above_floor?: string;
  object?: string;
  impassable?: boolean;
  elevator?: boolean;
  teleporter?: { roomIndex: number; x: number; y: number };
};

type RoomData = {
  name: string;
  tilemap: Record<string, TileData>;
};

type RealmMapData = {
  spawnpoint: { roomIndex: number; x: number; y: number };
  rooms: RoomData[];
};

type TiledProperty = {
  name: string;
  value: unknown;
};

type TiledObject = {
  name?: string;
  x?: number;
  y?: number;
  properties?: TiledProperty[];
};

type TiledLayer = {
  type: "tilelayer" | "group" | "objectgroup";
  name: string;
  data?: number[];
  layers?: TiledLayer[];
  objects?: TiledObject[];
};

type TiledTileset = {
  firstgid: number;
  name: string;
};

type TiledMapJson = {
  width: number;
  height: number;
  layers: TiledLayer[];
  tilesets: TiledTileset[];
};

const TILESET_NAME_TO_SHEET: Record<string, string> = {
  WA_Special_Zones: "waSpecialZones",
  WA_Decoration: "waDecoration",
  WA_Miscellaneous: "waMiscellaneous",
  WA_Other_Furniture: "waOtherFurniture",
  WA_Room_Builder: "waRoomBuilder",
  WA_Seats: "waSeats",
  WA_Tables: "waTables",
  WA_Logo_Long: "waLogoLong",
  WA_Exterior: "waExterior",
  WA_User_Interface: "waUserInterface",
};

const TMX_FLIP_H = 0x80000000;
const TMX_FLIP_V = 0x40000000;
const TMX_FLIP_D = 0x20000000;
const TMX_GID_MASK = ~(TMX_FLIP_H | TMX_FLIP_V | TMX_FLIP_D);

function basename(path: string) {
  const normalized = path.replace(/\\/g, "/");
  const segments = normalized.split("/");
  return segments[segments.length - 1] || path;
}

function roomNameFromFilePath(filePath: string) {
  const file = basename(filePath).replace(/\.tmj$/i, "");
  const readable = file
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return readable || "Room";
}

function markElevatorAt(rooms: RoomData[], roomIndex: number, x: number, y: number) {
  if (!rooms[roomIndex]) return;
  const key = `${x}, ${y}`;
  rooms[roomIndex].tilemap[key] = {
    ...rooms[roomIndex].tilemap[key],
    elevator: true,
  };
}

function flattenTileLayers(layers: TiledLayer[], out: TiledLayer[] = []) {
  for (const layer of layers || []) {
    if (layer.type === "tilelayer" && Array.isArray(layer.data)) {
      out.push(layer);
      continue;
    }
    if (layer.type === "group" && Array.isArray(layer.layers)) {
      flattenTileLayers(layer.layers, out);
    }
  }
  return out;
}

function flattenObjectLayers(layers: TiledLayer[], out: TiledLayer[] = []) {
  for (const layer of layers || []) {
    if (layer.type === "objectgroup") {
      out.push(layer);
      continue;
    }
    if (layer.type === "group" && Array.isArray(layer.layers)) {
      flattenObjectLayers(layer.layers, out);
    }
  }
  return out;
}

function decodeGid(rawGid: number) {
  if (!rawGid) return 0;
  return rawGid & TMX_GID_MASK;
}

function resolveTileName(gid: number, tilesets: TiledTileset[]) {
  if (!gid) return null;

  let chosen: TiledTileset | null = null;
  for (const ts of tilesets) {
    if (gid >= ts.firstgid) {
      chosen = ts;
    } else {
      break;
    }
  }
  if (!chosen) return null;

  const sheetName = TILESET_NAME_TO_SHEET[chosen.name];
  if (!sheetName) return null;

  const localId = gid - chosen.firstgid;
  if (localId < 0) return null;

  return `${sheetName}-g${localId}`;
}

function getObjectProperty(obj: TiledObject, key: string) {
  return obj.properties?.find((prop) => prop.name === key)?.value;
}

function getStartByName(map: TiledMapJson, startName: string) {
  const objectLayers = flattenObjectLayers(map.layers);
  for (const layer of objectLayers) {
    for (const obj of layer.objects || []) {
      const isStart = obj.name === startName || getObjectProperty(obj, "start") === true;
      if (!isStart) continue;
      return {
        x: Math.max(0, Math.floor((obj.x || 0) / 32)),
        y: Math.max(0, Math.floor((obj.y || 0) / 32)),
      };
    }
  }
  return null;
}

function getTeleporterAreas(map: TiledMapJson) {
  const objectLayers = flattenObjectLayers(map.layers);
  const areas: { x: number; y: number; exitUrl: string }[] = [];
  for (const layer of objectLayers) {
    for (const obj of layer.objects || []) {
      const exitUrl = getObjectProperty(obj, "exitUrl");
      if (typeof exitUrl !== "string" || !exitUrl) continue;
      areas.push({
        x: Math.max(0, Math.floor((obj.x || 0) / 32)),
        y: Math.max(0, Math.floor((obj.y || 0) / 32)),
        exitUrl,
      });
    }
  }
  return areas;
}

function roomFromTMJ(map: TiledMapJson, roomName: string) {
  const { width, height, tilesets } = map;
  const tilemap: Record<string, TileData> = {};
  const allTileLayers = flattenTileLayers(map.layers);

  const collisionsLayer = allTileLayers.find((layer) => layer.name === "collisions");
  const floorLayers = allTileLayers.filter((layer) => layer.name.startsWith("floor"));
  const objectLayers = allTileLayers.filter(
    (layer) => layer.name.startsWith("walls") || layer.name.startsWith("furniture"),
  );
  const aboveLayers = allTileLayers.filter((layer) => layer.name.startsWith("above"));

  function setLayerValue(key: string, field: "floor" | "object" | "above_floor", rawGid: number) {
    const gid = decodeGid(rawGid);
    if (!gid) return;
    const tileName = resolveTileName(gid, tilesets);
    if (!tileName) return;
    tilemap[key] = { ...tilemap[key], [field]: tileName };
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const key = `${x}, ${y}`;

      for (const layer of floorLayers) {
        setLayerValue(key, "floor", layer.data?.[i] || 0);
      }
      for (const layer of objectLayers) {
        setLayerValue(key, "object", layer.data?.[i] || 0);
      }
      for (const layer of aboveLayers) {
        setLayerValue(key, "above_floor", layer.data?.[i] || 0);
      }

      if (collisionsLayer?.data?.[i]) {
        tilemap[key] = { ...tilemap[key], impassable: true };
      }
    }
  }

  return { name: roomName, tilemap };
}

export async function buildCompanyRealmFromTmj(entry: AiMapManifestEntry): Promise<RealmMapData | null> {
  const tmjFiles = entry.files.filter((filePath) => filePath.toLowerCase().endsWith(".tmj"));
  if (tmjFiles.length === 0) return null;

  const parsedMaps = await Promise.all(
    tmjFiles.map(async (filePath) => {
      const response = await fetch(filePath, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Unable to load TMJ file: ${filePath}`);
      }
      const map = (await response.json()) as TiledMapJson;
      return {
        filePath,
        fileName: basename(filePath),
        roomName: roomNameFromFilePath(filePath),
        map,
      };
    }),
  );

  const rooms = parsedMaps.map((parsed, index) => {
    const floorLabel = entry.floors?.find((floor) => floor.roomIndex === index)?.label;
    return roomFromTMJ(parsed.map, floorLabel || parsed.roomName);
  });
  const indexByFileName = Object.fromEntries(
    parsedMaps.map((parsed, index) => [parsed.fileName, index]),
  );

  const officeMap = parsedMaps.find((parsed) => parsed.fileName === "office.tmj") || parsedMaps[0];
  const conferenceMap =
    parsedMaps.find((parsed) => parsed.fileName === "conference.tmj") || parsedMaps[1];

  const starts = {
    office: officeMap ? getStartByName(officeMap.map, "from-conference") : null,
    conference: conferenceMap ? getStartByName(conferenceMap.map, "from-office") : null,
  };

  for (let roomIndex = 0; roomIndex < parsedMaps.length; roomIndex++) {
    const teleports = getTeleporterAreas(parsedMaps[roomIndex].map);
    for (const tp of teleports) {
      const [targetFileName, targetStartName] = tp.exitUrl.split("#");
      const targetIndex = indexByFileName[targetFileName];
      if (typeof targetIndex !== "number") continue;

      const destination =
        (targetFileName === "office.tmj" ? starts.office : starts.conference) ||
        getStartByName(parsedMaps[targetIndex].map, targetStartName || "");
      if (!destination) continue;

      const key = `${tp.x}, ${tp.y}`;
      rooms[roomIndex].tilemap[key] = {
        ...rooms[roomIndex].tilemap[key],
        teleporter: {
          roomIndex: targetIndex,
          x: destination.x,
          y: destination.y,
        },
      };
    }
  }

  const spawn = entry.spawnpoint || (starts.office ? { roomIndex: 0, x: starts.office.x, y: starts.office.y } : { roomIndex: 0, x: 2, y: 2 });

  if (entry.elevator) {
    const { cabinRoomIndex, cabinEntry, defaultExit } = entry.elevator;
    markElevatorAt(rooms, cabinRoomIndex, cabinEntry.x, cabinEntry.y);

    const floorRoomIndexes = entry.floors?.map((floor) => floor.roomIndex) || [];
    for (const floorRoomIndex of floorRoomIndexes) {
      markElevatorAt(rooms, floorRoomIndex, defaultExit.x, defaultExit.y);
    }
  }

  return {
    spawnpoint: { roomIndex: spawn.roomIndex, x: spawn.x, y: spawn.y },
    rooms,
  };
}
