type TilePoint = `${number}, ${number}`;

type Teleporter = {
  roomIndex: number;
  x: number;
  y: number;
};

type TileData = {
  floor?: string;
  object?: string;
  above_floor?: string;
  impassable?: boolean;
  teleporter?: Teleporter;
};

type RoomData = {
  name: string;
  tilemap: Record<TilePoint, TileData>;
};

type RealmMapData = {
  spawnpoint: { roomIndex: number; x: number; y: number };
  rooms: RoomData[];
};

function key(x: number, y: number): TilePoint {
  return `${x}, ${y}`;
}

function ensureTile(room: RoomData, x: number, y: number) {
  const k = key(x, y);
  room.tilemap[k] = room.tilemap[k] || {};
  return room.tilemap[k];
}

function setFloorRect(
  room: RoomData,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  floor: string,
) {
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      ensureTile(room, x, y).floor = floor;
    }
  }
}

function setObjectRect(
  room: RoomData,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  object: string,
  impassable = true,
) {
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      const tile = ensureTile(room, x, y);
      tile.object = object;
      if (impassable) tile.impassable = true;
    }
  }
}

function paintPerimeterWalls(
  room: RoomData,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  for (let x = x1; x <= x2; x++) {
    setObjectRect(room, x, y1, x, y1, "roomBuilder-wall_white_mid");
    setObjectRect(room, x, y2, x, y2, "roomBuilder-wall_white_mid");
  }
  for (let y = y1; y <= y2; y++) {
    setObjectRect(room, x1, y, x1, y, "roomBuilder-wall_white_mid");
    setObjectRect(room, x2, y, x2, y, "roomBuilder-wall_white_mid");
  }
}

function placeDeskCluster(room: RoomData, startX: number, startY: number) {
  const offsets = [
    [0, 0],
    [3, 0],
    [0, 3],
    [3, 3],
  ];
  for (const [dx, dy] of offsets) {
    setObjectRect(room, startX + dx, startY + dy, startX + dx + 1, startY + dy, "collabDecor-office_desk");
    ensureTile(room, startX + dx, startY + dy + 1).above_floor = "collabDecor-office_chair";
  }
}

function placeTableCluster(room: RoomData, startX: number, startY: number) {
  const offsets = [
    [0, 0],
    [4, 0],
    [0, 4],
    [4, 4],
  ];
  for (const [dx, dy] of offsets) {
    setObjectRect(room, startX + dx, startY + dy, startX + dx + 1, startY + dy + 1, "interiors-table_wood_large");
    ensureTile(room, startX + dx + 2, startY + dy).above_floor = "interiors-chair_office_blue";
    ensureTile(room, startX + dx - 1, startY + dy + 1).above_floor = "interiors-chair_office_green";
  }
}

function linkRooms(
  rooms: RoomData[],
  from: { roomIndex: number; x: number; y: number },
  to: { roomIndex: number; x: number; y: number },
) {
  ensureTile(rooms[from.roomIndex], from.x, from.y).teleporter = {
    roomIndex: to.roomIndex,
    x: to.x,
    y: to.y,
  };
  ensureTile(rooms[to.roomIndex], to.x, to.y).teleporter = {
    roomIndex: from.roomIndex,
    x: from.x,
    y: from.y,
  };
}

export function buildDesignedOffice2FloorRealm(): RealmMapData {
  const floor1: RoomData = { name: "Office Floor 1 - Reception & Workspace", tilemap: {} };
  const floor2: RoomData = { name: "Office Floor 2 - Meetings & Manager", tilemap: {} };

  // Base composition
  setFloorRect(floor1, 0, 0, 63, 39, "roomBuilder-floor_wood_light");
  setFloorRect(floor2, 0, 0, 63, 39, "roomBuilder-floor_wood_light");

  // Primary circulation and zoning highlights
  setFloorRect(floor1, 0, 30, 63, 39, "ground-solid_sand"); // entrance band
  setFloorRect(floor1, 27, 0, 36, 39, "ground-detailed_sand"); // central axis to elevator
  setFloorRect(floor2, 27, 0, 36, 39, "ground-detailed_sand"); // aligned elevator axis

  paintPerimeterWalls(floor1, 0, 0, 63, 39);
  paintPerimeterWalls(floor2, 0, 0, 63, 39);

  // Floor 1: reception focal
  setObjectRect(floor1, 24, 28, 39, 30, "interiors-blackboard");
  ensureTile(floor1, 31, 27).above_floor = "waLogoLong-g1";
  ensureTile(floor1, 31, 31).above_floor = "collabDecor-sticky_notes";
  ensureTile(floor1, 22, 29).object = "collabDecor-plant_pot";
  ensureTile(floor1, 41, 29).object = "collabDecor-plant_pot";

  // Floor 1: workspace clusters
  placeDeskCluster(floor1, 6, 8);
  placeDeskCluster(floor1, 16, 8);
  placeDeskCluster(floor1, 42, 8);
  placeDeskCluster(floor1, 52, 8);

  // Floor 1: pantry cluster
  setFloorRect(floor1, 4, 2, 18, 6, "ground-detailed_dirt");
  setObjectRect(floor1, 4, 2, 6, 3, "collabDecor-filing_cabinet");
  setObjectRect(floor1, 8, 2, 8, 3, "collabDecor-water_dispenser");
  setObjectRect(floor1, 10, 2, 11, 3, "interiors-table_wood_round", false);
  ensureTile(floor1, 12, 3).above_floor = "interiors-chair_office_blue";

  // Elevator focal (aligned)
  setFloorRect(floor1, 29, 16, 34, 22, "ground-vibrant_solid_grass");
  setObjectRect(floor1, 30, 17, 33, 20, "interiors-elevator_door");
  ensureTile(floor1, 32, 21).above_floor = "interiors-elevator_button";

  setFloorRect(floor2, 29, 16, 34, 22, "ground-vibrant_solid_grass");
  setObjectRect(floor2, 30, 17, 33, 20, "interiors-elevator_door");
  ensureTile(floor2, 32, 21).above_floor = "interiors-elevator_button";

  // Floor 2: meeting rooms (east side, glass style using clean partitions)
  setFloorRect(floor2, 40, 3, 60, 15, "ground-detailed_dirt");
  setObjectRect(floor2, 40, 3, 60, 3, "roomBuilder-wall_white_mid");
  setObjectRect(floor2, 40, 15, 60, 15, "roomBuilder-wall_white_mid");
  setObjectRect(floor2, 40, 3, 40, 15, "roomBuilder-wall_white_mid");
  setObjectRect(floor2, 60, 3, 60, 15, "roomBuilder-wall_white_mid");
  placeTableCluster(floor2, 44, 6);
  placeTableCluster(floor2, 52, 6);

  // Floor 2: manager premium room
  setFloorRect(floor2, 8, 3, 24, 14, "ground-detailed_sand");
  setObjectRect(floor2, 8, 3, 24, 3, "roomBuilder-wall_wood_mid");
  setObjectRect(floor2, 8, 14, 24, 14, "roomBuilder-wall_wood_mid");
  setObjectRect(floor2, 8, 3, 8, 14, "roomBuilder-wall_wood_mid");
  setObjectRect(floor2, 24, 3, 24, 14, "roomBuilder-wall_wood_mid");
  setObjectRect(floor2, 13, 8, 14, 8, "collabDecor-office_desk");
  ensureTile(floor2, 13, 9).above_floor = "collabDecor-office_chair";
  ensureTile(floor2, 22, 5).object = "collabDecor-bookshelf";
  ensureTile(floor2, 10, 5).object = "collabDecor-plant_pot";

  // Floor 2: relax zone
  setFloorRect(floor2, 8, 24, 24, 36, "ground-light_solid_grass");
  setObjectRect(floor2, 11, 27, 13, 28, "interiors-sofa_grey_large");
  setObjectRect(floor2, 17, 27, 19, 28, "interiors-sofa_blue_large");
  setObjectRect(floor2, 14, 31, 15, 31, "interiors-table_wood_round", false);
  ensureTile(floor2, 9, 34).object = "collabDecor-plant_pot";
  ensureTile(floor2, 23, 34).object = "collabDecor-plant_pot";

  const rooms = [floor1, floor2];
  linkRooms(rooms, { roomIndex: 0, x: 32, y: 21 }, { roomIndex: 1, x: 32, y: 21 });

  return {
    spawnpoint: { roomIndex: 0, x: 32, y: 34 },
    rooms,
  };
}

export function buildDesignedUniversityRealm(): RealmMapData {
  const hub: RoomData = { name: "University Hub", tilemap: {} };
  const classroom: RoomData = { name: "Classroom Block", tilemap: {} };
  const library: RoomData = { name: "Library", tilemap: {} };
  const cafeteria: RoomData = { name: "Cafeteria", tilemap: {} };
  const outdoor: RoomData = { name: "Outdoor Campus", tilemap: {} };

  // Hub composition: open central hall with cross circulation
  setFloorRect(hub, 0, 0, 79, 55, "ground-normal_solid_grass");
  setFloorRect(hub, 30, 0, 49, 55, "ground-detailed_sand");
  setFloorRect(hub, 0, 20, 79, 35, "ground-detailed_sand");
  setFloorRect(hub, 24, 16, 55, 39, "ground-solid_sand");
  setObjectRect(hub, 37, 24, 42, 27, "interiors-table_wood_large", false); // focal info island
  ensureTile(hub, 39, 23).above_floor = "interiors-globe";
  ensureTile(hub, 35, 27).object = "collabDecor-plant_pot";
  ensureTile(hub, 44, 27).object = "collabDecor-plant_pot";

  // Classroom block: structured repeated modules
  setFloorRect(classroom, 0, 0, 71, 47, "roomBuilder-floor_tiles_grey");
  setFloorRect(classroom, 0, 20, 71, 27, "ground-detailed_sand"); // corridor spine
  const classroomStarts = [2, 24, 46];
  for (const sx of classroomStarts) {
    setObjectRect(classroom, sx, 2, sx + 20, 2, "roomBuilder-wall_white_mid");
    setObjectRect(classroom, sx, 18, sx + 20, 18, "roomBuilder-wall_white_mid");
    setObjectRect(classroom, sx, 2, sx, 18, "roomBuilder-wall_white_mid");
    setObjectRect(classroom, sx + 20, 2, sx + 20, 18, "roomBuilder-wall_white_mid");
    placeDeskCluster(classroom, sx + 4, 6);
    placeDeskCluster(classroom, sx + 12, 6);
    setObjectRect(classroom, sx + 9, 4, sx + 11, 4, "interiors-blackboard");
  }

  // Library: dense shelving + quiet center
  setFloorRect(library, 0, 0, 71, 43, "roomBuilder-floor_wood_light");
  setFloorRect(library, 8, 14, 63, 31, "ground-detailed_sand");
  for (let x = 8; x <= 60; x += 6) {
    setObjectRect(library, x, 4, x + 1, 11, "collabDecor-bookshelf");
    setObjectRect(library, x, 34, x + 1, 40, "collabDecor-bookshelf");
  }
  placeTableCluster(library, 20, 18);
  placeTableCluster(library, 36, 18);
  ensureTile(library, 10, 20).object = "collabDecor-water_dispenser";
  ensureTile(library, 61, 20).object = "collabDecor-water_dispenser";

  // Cafeteria: clustered seating + serving counter focal
  setFloorRect(cafeteria, 0, 0, 67, 39, "ground-solid_dirt");
  setFloorRect(cafeteria, 0, 0, 67, 8, "ground-detailed_sand"); // serving line
  setObjectRect(cafeteria, 10, 2, 57, 4, "collabDecor-office_desk");
  ensureTile(cafeteria, 34, 1).above_floor = "waLogoLong-g2";
  placeTableCluster(cafeteria, 10, 12);
  placeTableCluster(cafeteria, 28, 12);
  placeTableCluster(cafeteria, 46, 12);
  placeTableCluster(cafeteria, 19, 26);
  placeTableCluster(cafeteria, 37, 26);

  // Outdoor campus: tree clusters + clear path network
  setFloorRect(outdoor, 0, 0, 95, 55, "ground-vibrant_solid_grass");
  setFloorRect(outdoor, 40, 0, 55, 55, "ground-detailed_dirt");
  setFloorRect(outdoor, 0, 24, 95, 31, "ground-detailed_dirt");
  const treeClusters = [
    [8, 8],
    [20, 10],
    [72, 8],
    [84, 12],
    [10, 42],
    [78, 44],
  ];
  for (const [tx, ty] of treeClusters) {
    ensureTile(outdoor, tx, ty).object = "collabDecor-plant_pot";
    ensureTile(outdoor, tx + 1, ty).object = "collabDecor-plant_pot";
    ensureTile(outdoor, tx, ty + 1).object = "collabDecor-plant_pot";
  }

  const rooms = [hub, classroom, library, cafeteria, outdoor];
  linkRooms(rooms, { roomIndex: 0, x: 40, y: 8 }, { roomIndex: 1, x: 36, y: 23 });
  linkRooms(rooms, { roomIndex: 0, x: 72, y: 28 }, { roomIndex: 2, x: 6, y: 22 });
  linkRooms(rooms, { roomIndex: 0, x: 40, y: 48 }, { roomIndex: 3, x: 34, y: 6 });
  linkRooms(rooms, { roomIndex: 0, x: 8, y: 28 }, { roomIndex: 4, x: 48, y: 28 });

  return {
    spawnpoint: { roomIndex: 0, x: 40, y: 28 },
    rooms,
  };
}
