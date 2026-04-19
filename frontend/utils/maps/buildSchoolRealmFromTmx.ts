import type { AiMapManifestEntry } from "@/utils/maps/aiMapManifest";

type TileData = {
  floor?: string;
  above_floor?: string;
  object?: string;
  impassable?: boolean;
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

type ParsedTileset = {
  firstgid: number;
  name: string;
};

type ParsedLayer = {
  name: string;
  width: number;
  height: number;
  values: number[];
};

const TMX_FLIP_H = 0x80000000;
const TMX_FLIP_V = 0x40000000;
const TMX_FLIP_D = 0x20000000;
const TMX_GID_MASK = ~(TMX_FLIP_H | TMX_FLIP_V | TMX_FLIP_D);

const TILESET_NAME_TO_SHEET: Record<string, string> = {
  Interior: "interiors",
  walls_floor: "roomBuilder",
  Doors_windows_animation: "interiors",
};

function basename(path: string) {
  const normalized = path.replace(/\\/g, "/");
  const segments = normalized.split("/");
  return segments[segments.length - 1] || path;
}

function roomNameFromFilePath(filePath: string) {
  const file = basename(filePath).replace(/\.tmx$/i, "");
  const readable = file
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return readable || "School Room";
}

function splitRoomByTileBudget(
  room: RoomData,
  maxTileCount: number,
): RoomData[] {
  const entries = Object.entries(room.tilemap);
  if (entries.length <= maxTileCount) {
    return [room];
  }

  const chunks: RoomData[] = [];
  for (let i = 0; i < entries.length; i += maxTileCount) {
    const chunkEntries = entries.slice(i, i + maxTileCount);
    const chunkTilemap: Record<string, TileData> = {};
    for (const [key, value] of chunkEntries) {
      chunkTilemap[key] = value;
    }
    chunks.push({
      name: `${room.name} (${Math.floor(i / maxTileCount) + 1})`,
      tilemap: chunkTilemap,
    });
  }

  return chunks;
}

function toLayerField(layerName: string): keyof TileData {
  const normalized = layerName.toLowerCase();
  if (normalized.includes("floor")) return "floor";
  if (normalized.includes("object") || normalized.includes("box")) return "object";
  if (normalized.includes("wall") || normalized.includes("window")) return "object";
  return "above_floor";
}

function decodeGid(rawGid: number) {
  if (!rawGid) return 0;
  return rawGid & TMX_GID_MASK;
}

function resolveTileName(gid: number, tilesets: ParsedTileset[]) {
  if (!gid) return null;

  let chosen: ParsedTileset | null = null;
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

function parseCsvValues(csvText: string) {
  return csvText
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value));
}

function parseTmxDocument(tmxText: string) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(tmxText, "application/xml");

  const mapEl = xml.querySelector("map");
  if (!mapEl) {
    throw new Error("TMX parse failed: missing <map> root.");
  }

  const mapWidth = Number(mapEl.getAttribute("width") || "0");
  const mapHeight = Number(mapEl.getAttribute("height") || "0");

  const tilesets: ParsedTileset[] = Array.from(xml.querySelectorAll("tileset"))
    .map((tilesetEl) => ({
      firstgid: Number(tilesetEl.getAttribute("firstgid") || "0"),
      name: tilesetEl.getAttribute("name") || "",
    }))
    .filter((tileset) => tileset.firstgid > 0 && !!tileset.name)
    .sort((a, b) => a.firstgid - b.firstgid);

  const layers: ParsedLayer[] = Array.from(xml.querySelectorAll("layer"))
    .map((layerEl) => {
      const dataEl = layerEl.querySelector("data");
      const dataText = dataEl?.textContent || "";
      return {
        name: layerEl.getAttribute("name") || "",
        width: Number(layerEl.getAttribute("width") || mapWidth || "0"),
        height: Number(layerEl.getAttribute("height") || mapHeight || "0"),
        values: parseCsvValues(dataText),
      };
    })
    .filter((layer) => layer.values.length > 0);

  return {
    width: mapWidth,
    height: mapHeight,
    tilesets,
    layers,
  };
}

function roomFromTmxText(tmxText: string, roomName: string): RoomData {
  const parsed = parseTmxDocument(tmxText);
  const room: RoomData = { name: roomName, tilemap: {} };

  for (const layer of parsed.layers) {
    const field = toLayerField(layer.name);
    for (let y = 0; y < layer.height; y++) {
      for (let x = 0; x < layer.width; x++) {
        const idx = y * layer.width + x;
        const rawGid = layer.values[idx] || 0;
        const gid = decodeGid(rawGid);
        if (!gid) continue;

        const tileName = resolveTileName(gid, parsed.tilesets);
        if (!tileName) continue;

        const key = `${x}, ${y}`;
        room.tilemap[key] = {
          ...room.tilemap[key],
          [field]: tileName,
        };
      }
    }
  }

  return room;
}

export async function buildSchoolRealmFromTmx(
  entry: AiMapManifestEntry,
): Promise<RealmMapData | null> {
  const tmxFiles = entry.files.filter((filePath) => filePath.toLowerCase().endsWith(".tmx"));
  if (tmxFiles.length === 0) return null;

  const parsedRooms = await Promise.all(
    tmxFiles.map(async (filePath) => {
      const response = await fetch(filePath, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Unable to load TMX file: ${filePath}`);
      }
      const text = await response.text();
      const roomNameBase = roomNameFromFilePath(filePath);
      const tag = entry.roomTags?.[basename(filePath).replace(/\.tmx$/i, "")];
      const roomName = tag ? `${roomNameBase} (${tag})` : roomNameBase;
      return roomFromTmxText(text, roomName);
    }),
  );

  const rooms = parsedRooms.flatMap((room) => splitRoomByTileBudget(room, 9000));
  const spawn = entry.spawnpoint || { roomIndex: 0, x: 2, y: 2 };

  return {
    spawnpoint: { roomIndex: Math.min(spawn.roomIndex, Math.max(rooms.length - 1, 0)), x: spawn.x, y: spawn.y },
    rooms,
  };
}
