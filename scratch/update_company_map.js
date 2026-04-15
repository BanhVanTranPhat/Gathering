
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

// --- CORE GENERATOR ---
const generateFloor = (name, floorNum, totalFloors) => {
    const tilemap = {};
    const MAP_W = 40;
    const MAP_H = 30;

    // 1. Base Layer (Everything Wood)
    for (let x = 0; x < MAP_W; x++) {
        for (let y = 0; y < MAP_H; y++) {
            tilemap[`${x}, ${y}`] = { floor: FLOORS.WOOD };
        }
    }

    // 2. Map Border Walls
    for (let x = 0; x < MAP_W; x++) {
        tilemap[`${x}, 0`] = { floor: FLOORS.WOOD, object: WALLS.WHITE, impassable: true };
        tilemap[`${x}, ${MAP_H - 1}`] = { floor: FLOORS.WOOD, object: WALLS.WHITE, impassable: true };
    }
    for (let y = 0; y < MAP_H; y++) {
        tilemap[`0, ${y}`] = { floor: FLOORS.WOOD, object: WALLS.WHITE, impassable: true };
        tilemap[`${MAP_W - 1}, ${y}`] = { floor: FLOORS.WOOD, object: WALLS.WHITE, impassable: true };
    }

    // 3. Elevator Core (Center-Left)
    const EX = 4;
    const EY = 12; // Middle left of the map
    for (let x = EX; x <= EX + 4; x++) {
        for (let y = EY; y <= EY + 3; y++) {
            tilemap[`${x}, ${y}`] = { floor: FLOORS.TILE };
        }
    }
    // Elevator structure
    tilemap[`${EX + 2}, ${EY}`] = { floor: FLOORS.TILE, object: "interiors-elevator_door", impassable: true };
    tilemap[`${EX + 3}, ${EY}`] = { floor: FLOORS.TILE, object: "interiors-elevator_button", impassable: true };
    tilemap[`${EX + 1}, ${EY}`] = { floor: FLOORS.TILE, object: WALLS.WHITE, impassable: true };
    tilemap[`${EX + 4}, ${EY}`] = { floor: FLOORS.TILE, object: WALLS.WHITE, impassable: true };
    // Elevator Teleport Triggers
    tilemap[`${EX + 2}, ${EY + 1}`] = { floor: FLOORS.TILE, elevator: true };
    tilemap[`${EX + 2}, ${EY + 2}`] = { floor: FLOORS.TILE, elevator: true };

    // --- AUTO-BUILDER FUNCTIONS ---
    const buildRoom = (x, y, w, h, wallType, floorType, doorX, doorY) => {
        // Floor
        for (let i = x; i < x + w; i++) {
            for (let j = y; j < y + h; j++) {
                if (!tilemap[`${i}, ${j}`]) tilemap[`${i}, ${j}`] = {};
                tilemap[`${i}, ${j}`].floor = floorType;
            }
        }
        // Walls
        for (let i = x; i <= x + w; i++) {
            tilemap[`${i}, ${y}`] = { ...tilemap[`${i}, ${y}`], object: wallType, impassable: true };
            if (i !== doorX || (y + h) !== doorY) {
               tilemap[`${i}, ${y + h}`] = { ...tilemap[`${i}, ${y + h}`], object: wallType, impassable: true };
            }
        }
        for (let j = y; j <= y + h; j++) {
            if (x !== doorX || j !== doorY) {
                tilemap[`${x}, ${j}`] = { ...tilemap[`${x}, ${j}`], object: wallType, impassable: true };
            }
            if ((x + w) !== doorX || j !== doorY) {
                tilemap[`${x + w}, ${j}`] = { ...tilemap[`${x + w}, ${j}`], object: wallType, impassable: true };
            }
        }
        // Clear door
        if (doorX && doorY && tilemap[`${doorX}, ${doorY}`]) {
             delete tilemap[`${doorX}, ${doorY}`].object;
             delete tilemap[`${doorX}, ${doorY}`].impassable;
        }
    };

    const placeLounge = (x, y) => {
        tilemap[`${x}, ${y}`] = { ...tilemap[`${x}, ${y}`], floor: DECOR.CARPET_RED };
        tilemap[`${x}, ${y}`] = { ...tilemap[`${x}, ${y}`], object: DECOR.SOFA_BLUE, impassable: true };
        tilemap[`${x-1}, ${y-1}`] = { ...tilemap[`${x-1}, ${y-1}`], object: DECOR.PLANT, impassable: true };
        tilemap[`${x+3}, ${y}`] = { ...tilemap[`${x+3}, ${y}`], object: DECOR.TABLE_R, impassable: true };
        tilemap[`${x+5}, ${y}`] = { ...tilemap[`${x+5}, ${y}`], object: DECOR.BOOKSHELF, impassable: true };
    };

    const placeMeetingRoom = (x, y, w, h) => {
        buildRoom(x, y, w, h, WALLS.WHITE, FLOORS.BLUE, x, y + Math.floor(h/2));
        // Paint Carpet
        for (let i = x + 1; i < x + w; i++) {
            for (let j = y + 1; j < y + h; j++) {
                tilemap[`${i}, ${j}`].floor = DECOR.CARPET_BLUE;
            }
        }
        // Table in center
        const cx = Math.floor(x + w / 2) - 1;
        const cy = Math.floor(y + h / 2);
        tilemap[`${cx}, ${cy}`] = { ...tilemap[`${cx}, ${cy}`], object: DECOR.TABLE_L, impassable: true };
        tilemap[`${cx}, ${cy - 1}`] = { ...tilemap[`${cx}, ${cy - 1}`], above_floor: DECOR.CHAIR_B };
        tilemap[`${cx + 2}, ${cy - 1}`] = { ...tilemap[`${cx + 2}, ${cy - 1}`], above_floor: DECOR.CHAIR_B };
        tilemap[`${cx}, ${cy + 1}`] = { ...tilemap[`${cx}, ${cy + 1}`], above_floor: DECOR.CHAIR_B };
        tilemap[`${cx + 2}, ${cy + 1}`] = { ...tilemap[`${cx + 2}, ${cy + 1}`], above_floor: DECOR.CHAIR_B };
        
        // Blackboard at the back
        tilemap[`${x + w - 2}, ${y + 1}`] = { ...tilemap[`${x + w - 2}, ${y + 1}`], object: DECOR.BLACKBOARD, impassable: true };
    };

    const placeWorkstations = (x, y, count, style) => {
        const desk = style === 'blue' ? DECOR.DESK_B : DECOR.DESK_G;
        const chair = style === 'blue' ? DECOR.CHAIR_B : DECOR.CHAIR_G;
        for (let i = 0; i < count; i++) {
            const rx = x + (i % 3) * 4;
            const ry = y + Math.floor(i / 3) * 4;
            tilemap[`${rx}, ${ry}`] = { ...tilemap[`${rx}, ${ry}`], object: desk, impassable: true };
            if (Math.random() > 0.1) {
                // Occasional chair missing for realism
                tilemap[`${rx}, ${ry + 1}`] = { ...tilemap[`${rx}, ${ry + 1}`], above_floor: chair };
            }
            if (Math.random() > 0.4) {
                 // Occasional plant separating desks
                 tilemap[`${rx - 1}, ${ry}`] = { ...tilemap[`${rx - 1}, ${ry}`], object: DECOR.PLANT, impassable: true };
            }
        }
    };


    // === APPLY ARCHITECTURE BY FLOOR ===
    if (floorNum === 0) {
        // --- LOBBY ---
        // Beautiful Entrance
        for(let x=18; x<=22; x++) tilemap[`${x}, 28`] = { ...tilemap[`${x}, 28`], floor: FLOORS.TILE };
        for(let x=18; x<=22; x++) tilemap[`${x}, 29`] = { ...tilemap[`${x}, 29`], floor: FLOORS.TILE };
        
        // Reception Desk Array
        tilemap[`20, 15`] = { ...tilemap[`20, 15`], object: DECOR.TABLE_L, impassable: true };
        tilemap[`23, 15`] = { ...tilemap[`23, 15`], object: DECOR.TABLE_L, impassable: true };
        tilemap[`21, 14`] = { ...tilemap[`21, 14`], above_floor: DECOR.CHAIR_B };
        tilemap[`24, 14`] = { ...tilemap[`24, 14`], above_floor: DECOR.CHAIR_B };

        // Plants Behind Reception
        tilemap[`19, 13`] = { ...tilemap[`19, 13`], object: DECOR.PLANT, impassable: true };
        tilemap[`26, 13`] = { ...tilemap[`26, 13`], object: DECOR.PLANT, impassable: true };
        tilemap[`22, 13`] = { ...tilemap[`22, 13`], object: DECOR.GLOBE, impassable: true };

        placeLounge(10, 22);
        placeLounge(28, 22);
        
        // Visual indicators for zones
        // Notice Board (Events)
        tilemap[`20, 13`] = { ...tilemap[`20, 13`], object: DECOR.BLACKBOARD, impassable: true };
        // Announcements (Forum)
        tilemap[`25, 13`] = { ...tilemap[`25, 13`], object: DECOR.BLACKBOARD, impassable: true };
    } else if (floorNum === 1 || floorNum === 2) {
        // --- ENGINEERING & MARKETING ---
        // Big Meeting Rooms (Right Side)
        placeMeetingRoom(22, 2, 12, 10);
        
        // Secondary Room (Bottom Right)
        placeMeetingRoom(22, 16, 12, 8);

        // Workstation Grid (Left & Center)
        const style = floorNum === 1 ? 'blue' : 'green';
        placeWorkstations(4, 4, 9, style);
        placeWorkstations(12, 16, 6, style);

        // Pantry/Chill Zone (Top Left)
        placeLounge(14, 4);

        // Library Area (Floor 1 and 2)
        // Eng/Mkt Library Bookshelves
        tilemap[`5, 4`] = { ...tilemap[`5, 4`], object: DECOR.BOOKSHELF, impassable: true };
        tilemap[`7, 4`] = { ...tilemap[`7, 4`], object: DECOR.BOOKSHELF, impassable: true };
        tilemap[`9, 4`] = { ...tilemap[`9, 4`], object: DECOR.BOOKSHELF, impassable: true };
    } else if (floorNum === 3) {
        // --- EXECUTIVE FLOOR ---
        // Large Open Meeting Space
        placeMeetingRoom(15, 5, 20, 20);
        placeLounge(4, 4);
        placeLounge(4, 20);
    }

    return { name, tilemap };
};

const generateElevatorCabin = () => {
    const tilemap = {};
    const size = 16;
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            tilemap[`${x}, ${y}`] = { floor: "roomBuilder-floor_tiles_grey" };
        }
    }
    tilemap[`0, 0`] = { floor: "roomBuilder-floor_tiles_grey", object: "elevator-main" };

    for (let x = 0; x < size; x++) {
        tilemap[`${x}, 0`] = { ...tilemap[`${x}, 0`], impassable: true };
        tilemap[`${x}, ${size - 1}`] = { ...tilemap[`${x}, ${size - 1}`], impassable: true };
    }
    for (let y = 1; y < size - 1; y++) {
        tilemap[`0, ${y}`] = { ...tilemap[`0, ${y}`], impassable: true };
        tilemap[`${size - 1}, ${y}`] = { ...tilemap[`${size - 1}, ${y}`], impassable: true };
    }
    return { name: "Elevator Cabin", tilemap };
};

const mapData = {
  spawnpoint: { roomIndex: 0, x: 20, y: 25 },
  rooms: [
    generateFloor("Company Lobby", 0, 4),
    generateFloor("Company - Floor 1", 1, 4),
    generateFloor("Company - Floor 2", 2, 4),
    generateFloor("Company - Floor 3", 3, 4),
    generateElevatorCabin()
  ]
};

fs.writeFileSync('/Users/banhvantranphat/Gatherv3/Gathering/frontend/utils/companymap.json', JSON.stringify(mapData, null, 2));
console.log('Final organic update for Company Map.');

