
import fs from 'fs';

const mapData = {
  spawnpoint: { roomIndex: 0, x: 25, y: 15 },
  rooms: [
    {
      name: "Modern Office Hub",
      tilemap: {}
    }
  ]
};

const tilemap = mapData.rooms[0].tilemap;

const MAP_WIDTH = 50;
const MAP_HEIGHT = 30;

// Fill floors
for (let x = 0; x < MAP_WIDTH; x++) {
  for (let y = 0; y < MAP_HEIGHT; y++) {
    tilemap[`${x}, ${y}`] = { floor: "roomBuilder-floor_wood_light" };
  }
}

// Add walls for the outer boundary
for (let x = 0; x < MAP_WIDTH; x++) {
  tilemap[`${x}, 0`] = { ...tilemap[`${x}, 0`], object: "roomBuilder-wall_white_mid", impassable: true };
}

// Offices
// Office 1 (Left)
for (let y = 1; y < 10; y++) {
  tilemap[`15, ${y}`] = { ...tilemap[`15, ${y}`], object: "roomBuilder-wall_white_mid", impassable: true };
}
for (let x = 0; x < 15; x++) {
  tilemap[`${x}, 10`] = { ...tilemap[`${x}, 10`], object: "roomBuilder-wall_white_mid", impassable: true };
}

// Furnish Office 1
tilemap["2, 2"] = { ...tilemap["2, 2"], object: "interiors-desk_pc_blue" };
tilemap["2, 3"] = { ...tilemap["2, 3"], above_floor: "interiors-chair_office_blue" };
tilemap["5, 2"] = { ...tilemap["5, 2"], object: "interiors-desk_pc_blue" };
tilemap["5, 3"] = { ...tilemap["5, 3"], above_floor: "interiors-chair_office_blue" };
tilemap["8, 5"] = { ...tilemap["8, 5"], floor: "interiors-carpet_red_large" };

// Lounge Area (Bottom Right)
for (let x = 35; x < 50; x++) {
    for (let y = 20; y < 30; y++) {
        tilemap[`${x}, ${y}`] = { floor: "roomBuilder-floor_carpet_red" };
    }
}
tilemap["40, 25"] = { ...tilemap["40, 25"], object: "interiors-sofa_grey_large" };
tilemap["45, 25"] = { ...tilemap["45, 25"], object: "interiors-sofa_blue_large" };
tilemap["42, 22"] = { ...tilemap["42, 22"], object: "interiors-potted_plant_large" };

fs.writeFileSync('large_office_map.json', JSON.stringify(mapData, null, 2));
console.log('Large map generated: large_office_map.json');
