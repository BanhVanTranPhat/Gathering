import fs from 'fs';

// --- HELPER DICTIONARIES ---
const FLOORS = {
    WOOD: "roomBuilder-floor_wood_light",
    TILE: "roomBuilder-floor_tiles_grey",
    BLUE: "roomBuilder-floor_tiles_blue",
    RED: "roomBuilder-floor_carpet_red",
};

const WALLS = {
    WHITE: "roomBuilder-wall_white_mid",
    WOOD: "roomBuilder-wall_wood_mid",
};

const DECOR = {
    PLANT: "interiors-potted_plant_large",
    GLOBE: "interiors-globe",
    BOOKSHELF: "interiors-bookshelf_packed",
    SOFA_GREY: "interiors-sofa_grey_large",
    SOFA_BLUE: "interiors-sofa_blue_large",
    CARPET_RED: "interiors-carpet_red_large",
    CARPET_BLUE: "interiors-carpet_blue_yellow",
    DESK_B: "interiors-desk_pc_blue",
    CHAIR_B: "interiors-chair_office_blue",
    DESK_G: "interiors-desk_pc_green",
    CHAIR_G: "interiors-chair_office_green",
    TABLE_L: "interiors-table_wood_large",
    TABLE_R: "interiors-table_wood_round",
    CLASS_DESK: "interiors-classroom_desk",
    CLASS_CHAIR: "interiors-classroom_chair",
    BLACKBOARD: "interiors-blackboard",
};

const zones = [
  { id: "lobby", bounds: { x1: 17, y1: 10, x2: 33, y2: 22 } },
  { id: "team-alpha", bounds: { x1: 2, y1: 10, x2: 16, y2: 22 } },
  { id: "team-beta", bounds: { x1: 34, y1: 10, x2: 47, y2: 22 } },
  { id: "meeting", bounds: { x1: 2, y1: 24, x2: 17, y2: 37 } },
  { id: "courtyard", bounds: { x1: 18, y1: 24, x2: 33, y2: 37 } },
  { id: "focus", bounds: { x1: 34, y1: 24, x2: 47, y2: 30 } },
  { id: "github", bounds: { x1: 34, y1: 31, x2: 47, y2: 37 } },
  { id: "forum-board", bounds: { x1: 27, y1: 11, x2: 31, y2: 15 } },
  { id: "events-board", bounds: { x1: 19, y1: 11, x2: 23, y2: 15 } },
  { id: "tech-library", bounds: { x1: 40, y1: 11, x2: 46, y2: 15 } },
];

const generateCollabCampus = () => {
    const tilemap = {};
    const MAP_W = 50;
    const MAP_H = 40;

    // 1. Base Layer
    for (let x = 0; x < MAP_W; x++) {
        for (let y = 0; y < MAP_H; y++) {
            tilemap[`${x}, ${y}`] = { floor: "ground-detailed_grass" };
        }
    }

    // Connectors / Doors arrays to erase walls later
    const doors = [
      { x: 17, y: 16 }, { x: 33, y: 16 }, { x: 9, y: 23 }, 
      { x: 24, y: 23 }, { x: 40, y: 23 }, { x: 17, y: 30 }, { x: 40, y: 30 }
    ];

    // --- AUTO-BUILDER FUNCTIONS ---
    const buildZone = (zoneId, floorType, wallType) => {
        const zone = zones.find(z => z.id === zoneId).bounds;
        // Floor
        for (let i = zone.x1; i <= zone.x2; i++) {
            for (let j = zone.y1; j <= zone.y2; j++) {
                if (!tilemap[`${i}, ${j}`]) tilemap[`${i}, ${j}`] = {};
                tilemap[`${i}, ${j}`].floor = floorType;
            }
        }
        // Walls
        for (let i = zone.x1; i <= zone.x2; i++) {
            tilemap[`${i}, ${zone.y1}`] = { ...tilemap[`${i}, ${zone.y1}`], object: wallType, impassable: true };
            tilemap[`${i}, ${zone.y2}`] = { ...tilemap[`${i}, ${zone.y2}`], object: wallType, impassable: true };
        }
        for (let j = zone.y1; j <= zone.y2; j++) {
            tilemap[`${zone.x1}, ${j}`] = { ...tilemap[`${zone.x1}, ${j}`], object: wallType, impassable: true };
            tilemap[`${zone.x2}, ${j}`] = { ...tilemap[`${zone.x2}, ${j}`], object: wallType, impassable: true };
        }
    };

    // Clean exact door tiles
    const openDoors = () => {
        doors.forEach(d => {
            if (tilemap[`${d.x}, ${d.y}`]) {
                delete tilemap[`${d.x}, ${d.y}`].object;
                delete tilemap[`${d.x}, ${d.y}`].impassable;
                // Add tiny carpet snippet to mark door
                tilemap[`${d.x}, ${d.y}`].floor = FLOORS.WOOD;
            }
        });
    };

    // --- BUILD SPACES ---
    
    // 1. Lobby
    buildZone("lobby", FLOORS.TILE, WALLS.WHITE);
    // Decorate Lobby
    tilemap[`25, 15`] = { floor: FLOORS.TILE, object: DECOR.TABLE_L, impassable: true };
    tilemap[`24, 14`] = { floor: FLOORS.TILE, above_floor: DECOR.CHAIR_B };
    tilemap[`26, 14`] = { floor: FLOORS.TILE, above_floor: DECOR.CHAIR_B };
    tilemap[`20, 18`] = { floor: DECOR.CARPET_RED, object: DECOR.SOFA_GREY, impassable: true };
    tilemap[`30, 18`] = { floor: DECOR.CARPET_RED, object: DECOR.SOFA_BLUE, impassable: true };

    // Forum Board
    tilemap[`29, 11`] = { floor: FLOORS.TILE, object: DECOR.BLACKBOARD, impassable: true };
    // Events Board
    tilemap[`21, 11`] = { floor: FLOORS.TILE, object: DECOR.BLACKBOARD, impassable: true };

    // 2. Team Alpha
    buildZone("team-alpha", FLOORS.WOOD, WALLS.WHITE);
    for (let i = 0; i < 4; i++) {
        tilemap[`${4 + i * 3}, 13`] = { floor: FLOORS.WOOD, object: DECOR.DESK_B, impassable: true };
        tilemap[`${4 + i * 3}, 14`] = { floor: FLOORS.WOOD, above_floor: DECOR.CHAIR_B };
        tilemap[`${4 + i * 3}, 18`] = { floor: FLOORS.WOOD, object: DECOR.DESK_B, impassable: true };
        tilemap[`${4 + i * 3}, 19`] = { floor: FLOORS.WOOD, above_floor: DECOR.CHAIR_B };
    }
    tilemap[`4, 16`] = { floor: FLOORS.WOOD, object: DECOR.BLACKBOARD, impassable: true };

    // 3. Team Beta
    buildZone("team-beta", FLOORS.WOOD, WALLS.WHITE);
    for (let i = 0; i < 3; i++) {
        tilemap[`${36 + i * 3}, 13`] = { floor: FLOORS.WOOD, object: DECOR.DESK_G, impassable: true };
        tilemap[`${36 + i * 3}, 14`] = { floor: FLOORS.WOOD, above_floor: DECOR.CHAIR_G };
        tilemap[`${36 + i * 3}, 18`] = { floor: FLOORS.WOOD, object: DECOR.DESK_G, impassable: true };
        tilemap[`${36 + i * 3}, 19`] = { floor: FLOORS.WOOD, above_floor: DECOR.CHAIR_G };
    }
    // Tech Library Bookshelves
    tilemap[`41, 11`] = { floor: FLOORS.WOOD, object: DECOR.BOOKSHELF, impassable: true };
    tilemap[`43, 11`] = { floor: FLOORS.WOOD, object: DECOR.BOOKSHELF, impassable: true };
    tilemap[`45, 11`] = { floor: FLOORS.WOOD, object: DECOR.BOOKSHELF, impassable: true };

    // 4. Meeting Room
    buildZone("meeting", FLOORS.BLUE, WALLS.WOOD);
    for (let i=5; i<=14; i++) {
        for (let j=28; j<=33; j++) tilemap[`${i}, ${j}`].floor = DECOR.CARPET_BLUE;
    }
    tilemap[`8, 30`] = { floor: DECOR.CARPET_BLUE, object: DECOR.TABLE_L, impassable: true };
    tilemap[`11, 30`] = { floor: DECOR.CARPET_BLUE, object: DECOR.TABLE_L, impassable: true };
    tilemap[`8, 29`] = { floor: DECOR.CARPET_BLUE, above_floor: DECOR.CHAIR_B };
    tilemap[`11, 29`] = { floor: DECOR.CARPET_BLUE, above_floor: DECOR.CHAIR_B };
    tilemap[`8, 31`] = { floor: DECOR.CARPET_BLUE, above_floor: DECOR.CHAIR_B };
    tilemap[`11, 31`] = { floor: DECOR.CARPET_BLUE, above_floor: DECOR.CHAIR_B };
    tilemap[`14, 30`] = { floor: DECOR.CARPET_BLUE, object: DECOR.BLACKBOARD, impassable: true };

    // 5. Courtyard (Nature)
    buildZone("courtyard", "ground-light_solid_grass", WALLS.WOOD);
    tilemap[`25, 30`] = { floor: "ground-light_solid_grass", object: DECOR.TABLE_R, impassable: true };
    tilemap[`22, 28`] = { floor: "ground-light_solid_grass", object: DECOR.PLANT, impassable: true };
    tilemap[`28, 33`] = { floor: "ground-light_solid_grass", object: DECOR.PLANT, impassable: true };
    tilemap[`25, 27`] = { floor: "ground-light_solid_grass", object: "village-well_filled", impassable: true };

    // 6. Focus Room
    buildZone("focus", FLOORS.WOOD, WALLS.WHITE);
    tilemap[`38, 26`] = { floor: FLOORS.WOOD, object: DECOR.CLASS_DESK, impassable: true };
    tilemap[`38, 27`] = { floor: FLOORS.WOOD, above_floor: DECOR.CLASS_CHAIR };
    tilemap[`42, 26`] = { floor: FLOORS.WOOD, object: DECOR.CLASS_DESK, impassable: true };
    tilemap[`42, 27`] = { floor: FLOORS.WOOD, above_floor: DECOR.CLASS_CHAIR };
    tilemap[`40, 24`] = { floor: FLOORS.WOOD, object: DECOR.BOOKSHELF, impassable: true };

    // 7. GitHub Hub
    buildZone("github", FLOORS.TILE, WALLS.WHITE);
    tilemap[`38, 34`] = { floor: FLOORS.TILE, object: DECOR.TABLE_R, impassable: true };
    tilemap[`38, 33`] = { floor: FLOORS.TILE, above_floor: DECOR.CHAIR_G };
    tilemap[`42, 34`] = { floor: FLOORS.TILE, object: DECOR.TABLE_R, impassable: true };
    tilemap[`42, 33`] = { floor: FLOORS.TILE, above_floor: DECOR.CHAIR_G };

    openDoors();

    return {
      name: "Collab Campus",
      tilemap
    };
};

const mapData = {
  spawnpoint: { roomIndex: 0, x: 25, y: 15 },
  rooms: [
    generateCollabCampus()
  ]
};

fs.writeFileSync('/Users/banhvantranphat/Gatherv3/Gathering/frontend/utils/collabcampusmap.json', JSON.stringify(mapData, null, 2));
console.log('Final organic update for Collab Campus Map.');
