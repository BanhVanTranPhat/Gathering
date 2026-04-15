const fs = require("fs");
const path = require("path");

const ROOT = path.join(
  __dirname,
  "../public/assets/sprites/workadventure-starter",
);
const OUT = path.join(__dirname, "../utils/workadventureStarterMap.json");

const TMJ_FILES = [
  { file: "office.tmj", roomName: "WA Office" },
  { file: "conference.tmj", roomName: "WA Conference" },
];

const TMX_FLIP_H = 0x80000000;
const TMX_FLIP_V = 0x40000000;
const TMX_FLIP_D = 0x20000000;
const TMX_GID_MASK = ~(TMX_FLIP_H | TMX_FLIP_V | TMX_FLIP_D);

const TILESET_NAME_TO_SHEET = {
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

function parseTMJ(fileName) {
  const fullPath = path.join(ROOT, fileName);
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

function getPropertyBool(item, key) {
  const props = item.properties || [];
  return props.some((p) => p.name === key && p.value === true);
}

function flattenTileLayers(layers, out = []) {
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

function flattenObjectLayers(layers, out = []) {
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

function decodeGid(rawGid) {
  if (!rawGid) return { gid: 0, hasTransform: false };
  const hasTransform = Boolean(rawGid & (TMX_FLIP_H | TMX_FLIP_V | TMX_FLIP_D));
  const gid = rawGid & TMX_GID_MASK;
  return { gid, hasTransform };
}

function resolveTileName(gid, tilesets) {
  if (!gid) return null;
  let chosen = null;
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

function roomFromTMJ(map, roomName) {
  const { width, height, tilesets } = map;
  const tilemap = {};
  const allTileLayers = flattenTileLayers(map.layers);

  const collisionsLayer = allTileLayers.find((l) => l.name === "collisions");
  const floorLayers = allTileLayers.filter((l) => l.name.startsWith("floor"));
  const objectLayers = allTileLayers.filter(
    (l) => l.name.startsWith("walls") || l.name.startsWith("furniture"),
  );
  const aboveLayers = allTileLayers.filter((l) => l.name.startsWith("above"));

  const transformedCount = { value: 0 };
  function setLayerValue(key, field, rawGid) {
    const { gid, hasTransform } = decodeGid(rawGid);
    if (!gid) return;
    if (hasTransform) transformedCount.value += 1;
    const tileName = resolveTileName(gid, tilesets);
    if (!tileName) return;
    tilemap[key] = { ...tilemap[key], [field]: tileName };
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const key = `${x}, ${y}`;
      for (const layer of floorLayers) {
        setLayerValue(key, "floor", layer.data[i]);
      }
      for (const layer of objectLayers) {
        setLayerValue(key, "object", layer.data[i]);
      }
      for (const layer of aboveLayers) {
        setLayerValue(key, "above_floor", layer.data[i]);
      }
      if (collisionsLayer && collisionsLayer.data[i] !== 0) {
        tilemap[key] = { ...tilemap[key], impassable: true };
      }
      if (!tilemap[key]) {
        tilemap[key] = {};
      }
    }
  }

  return { room: { name: roomName, tilemap }, transformedCount: transformedCount.value };
}

function getStartByName(map, startName) {
  const objectLayers = flattenObjectLayers(map.layers);
  for (const layer of objectLayers) {
    for (const obj of layer.objects || []) {
      if (obj.name === startName || getPropertyBool(obj, "start")) {
        return {
          x: Math.max(0, Math.floor((obj.x || 0) / 32)),
          y: Math.max(0, Math.floor((obj.y || 0) / 32)),
        };
      }
    }
  }
  return null;
}

function getTeleporterAreas(map) {
  const objectLayers = flattenObjectLayers(map.layers);
  const result = [];
  for (const layer of objectLayers) {
    for (const obj of layer.objects || []) {
      const props = obj.properties || [];
      const exitProp = props.find((p) => p.name === "exitUrl" && typeof p.value === "string");
      if (!exitProp) continue;
      result.push({
        name: obj.name,
        x: Math.max(0, Math.floor((obj.x || 0) / 32)),
        y: Math.max(0, Math.floor((obj.y || 0) / 32)),
        exitUrl: exitProp.value,
      });
    }
  }
  return result;
}

const parsed = TMJ_FILES.map(({ file, roomName }) => ({
  file,
  roomName,
  map: parseTMJ(file),
}));

const rooms = [];
let transformedTotal = 0;
for (const entry of parsed) {
  const { room, transformedCount } = roomFromTMJ(entry.map, entry.roomName);
  rooms.push(room);
  transformedTotal += transformedCount;
}

const indexByFile = Object.fromEntries(parsed.map((p, idx) => [p.file, idx]));
const starts = {
  office: getStartByName(parsed[0].map, "from-conference"),
  conference: getStartByName(parsed[1].map, "from-office"),
};

for (let roomIndex = 0; roomIndex < parsed.length; roomIndex++) {
  const teleports = getTeleporterAreas(parsed[roomIndex].map);
  for (const tp of teleports) {
    const [targetFile, targetStart] = tp.exitUrl.split("#");
    const targetIndex = indexByFile[targetFile];
    if (targetIndex == null) continue;
    const dest =
      (targetFile === "office.tmj" ? starts.office : starts.conference) ||
      getStartByName(parsed[targetIndex].map, targetStart || "");
    if (!dest) continue;
    const key = `${tp.x}, ${tp.y}`;
    rooms[roomIndex].tilemap[key] = {
      ...rooms[roomIndex].tilemap[key],
      teleporter: {
        roomIndex: targetIndex,
        x: dest.x,
        y: dest.y,
      },
    };
  }
}

const spawn = starts.office || { x: 2, y: 2 };
const realm = {
  spawnpoint: { roomIndex: 0, x: spawn.x, y: spawn.y },
  rooms,
};

fs.writeFileSync(OUT, JSON.stringify(realm, null, 2) + "\n", "utf8");
console.log("Wrote", OUT);
if (transformedTotal > 0) {
  console.log(
    `Note: ${transformedTotal} flipped/rotated tiles were normalized (transform flags removed).`,
  );
}
