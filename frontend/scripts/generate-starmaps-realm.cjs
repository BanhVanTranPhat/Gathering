/**
 * Generates utils/starmapsmap.json — multi-room Star Maps template (50×30).
 * Rich decorations (was: flat grass + office walls = looked "empty").
 */
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "../utils/starmapsmap.json");

const W = 50;
const H = 30;

const FLOWERS = [
  "grasslands-iight_green_flower_1",
  "grasslands-iight_green_flower_2",
  "grasslands-vibrant_green_flower_1",
  "grasslands-dark_green_flower_1",
  "grasslands-blue_flower_1",
  "grasslands-foliage_5",
];

function borderObject(x, y) {
  if (x === 0 && y === 0) return "stone_wall_tl";
  if (x === W - 1 && y === 0) return "stone_wall_tr";
  if (x === 0 && y === H - 1) return "stone_wall_bl";
  if (x === W - 1 && y === H - 1) return "stone_wall_br";
  if (y === 0) return "stone_wall_top";
  if (y === H - 1) return "stone_wall_bottom";
  if (x === 0) return "stone_wall_left";
  if (x === W - 1) return "stone_wall_right";
  return null;
}

/** Main path to south portal + spawn — no blocking props here */
function isCorridor(x, y) {
  if (Math.abs(x - 25) <= 2 && y >= 6 && y <= 28) return true;
  if (Math.abs(y - 15) <= 2 && Math.abs(x - 25) <= 8) return true;
  return false;
}

function baseTile(floorKey, x, y) {
  const key = `${x}, ${y}`;
  if (x === 0 || x === W - 1 || y === 0 || y === H - 1) {
    const b = borderObject(x, y);
    return {
      key,
      tile: {
        floor: floorKey,
        object: `grasslands-${b}`,
        impassable: true,
      },
    };
  }
  return { key, tile: { floor: floorKey } };
}

function decorateKashyyyk(tilemap) {
  for (let y = 2; y < H - 2; y++) {
    for (let x = 2; x < W - 2; x++) {
      if (isCorridor(x, y)) continue;
      const key = `${x}, ${y}`;
      const n = (x * 17 + y * 13) % 100;
      if (n < 28) {
        const f = FLOWERS[(x + y) % FLOWERS.length];
        tilemap[key] = { ...tilemap[key], above_floor: f };
      } else if (n < 36 && !isCorridor(x, y)) {
        tilemap[key] = {
          ...tilemap[key],
          object: "grasslands-short_basic_tree",
          impassable: true,
        };
      } else if (n < 40) {
        tilemap[key] = {
          ...tilemap[key],
          object: "grasslands-stone_3",
          impassable: true,
        };
      }
    }
  }
}

function decorateParis(tilemap) {
  const desks = [
    [10, 10],
    [18, 12],
    [32, 11],
    [38, 18],
    [14, 20],
    [30, 22],
  ];
  for (const [dx, dy] of desks) {
    const key = `${dx}, ${dy}`;
    tilemap[key] = {
      ...tilemap[key],
      object: "collabDecor-office_desk",
      above_floor: "collabDecor-monitor",
      impassable: true,
    };
  }
  const shelves = [
    [8, 18],
    [40, 12],
  ];
  for (const [sx, sy] of shelves) {
    tilemap[sx + ", " + sy] = {
      ...tilemap[sx + ", " + sy],
      object: "collabDecor-bookshelf",
      impassable: true,
    };
  }
  for (let y = 5; y < H - 5; y += 4) {
    for (let x = 6; x < W - 6; x += 9) {
      if (isCorridor(x, y)) continue;
      if ((x + y) % 7 !== 1) continue;
      const key = `${x}, ${y}`;
      tilemap[key] = {
        ...tilemap[key],
        above_floor: "collabDecor-sticky_notes",
      };
    }
  }
}

function decorateTatooine(tilemap) {
  for (let y = 2; y < H - 2; y++) {
    for (let x = 2; x < W - 2; x++) {
      if (isCorridor(x, y)) continue;
      const n = (x * 23 + y * 11) % 100;
      if (n < 22) {
        tilemap[`${x}, ${y}`] = {
          ...tilemap[`${x}, ${y}`],
          above_floor: "grasslands-stone_inverted_2",
        };
      } else if (n < 30) {
        tilemap[`${x}, ${y}`] = {
          ...tilemap[`${x}, ${y}`],
          object: "grasslands-big_rock_2",
          impassable: true,
        };
      } else if (n < 38) {
        tilemap[`${x}, ${y}`] = {
          ...tilemap[`${x}, ${y}`],
          object: "grasslands-short_light_basic_tree",
          impassable: true,
        };
      }
    }
  }
}

function buildRoom(name, floorKey, decorator) {
  const tilemap = {};
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const { key, tile } = baseTile(floorKey, x, y);
      tilemap[key] = tile;
    }
  }
  decorator(tilemap);
  return { name, tilemap };
}

// "dead_tree" - verify exists in grasslands
const rooms = [
  buildRoom("Kashyyyk", "ground-detailed_grass", decorateKashyyyk),
  buildRoom("Paris", "city-light_concrete", decorateParis),
  buildRoom("Tatooine", "ground-detailed_sand", decorateTatooine),
];

const portalGlow = "grasslands-vibrant_green_flower_3";

// Portals: visible markers + teleporter
rooms[0].tilemap["25, 27"] = {
  ...rooms[0].tilemap["25, 27"],
  floor: "ground-detailed_grass",
  above_floor: portalGlow,
  teleporter: { roomIndex: 1, x: 25, y: 3 },
};
rooms[1].tilemap["25, 3"] = {
  ...rooms[1].tilemap["25, 3"],
  above_floor: portalGlow,
  teleporter: { roomIndex: 0, x: 25, y: 27 },
};
rooms[1].tilemap["25, 26"] = {
  ...rooms[1].tilemap["25, 26"],
  above_floor: portalGlow,
  teleporter: { roomIndex: 2, x: 25, y: 3 },
};
rooms[2].tilemap["25, 3"] = {
  ...rooms[2].tilemap["25, 3"],
  above_floor: portalGlow,
  teleporter: { roomIndex: 1, x: 25, y: 26 },
};

const realm = {
  spawnpoint: { roomIndex: 0, x: 25, y: 15 },
  rooms,
};

fs.writeFileSync(OUT, JSON.stringify(realm, null, 2) + "\n", "utf8");
console.log("Wrote", OUT);
