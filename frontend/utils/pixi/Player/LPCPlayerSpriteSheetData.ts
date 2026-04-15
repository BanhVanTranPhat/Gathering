/**
 * LPC (Liberated Pixel Cup) spritesheet format cho avatar compose.
 * Avatar layers: 832x2944, 64x64 per frame, 13 cols x 46 rows.
 * Row layout (theo Gather AnimationManager): up=8, left=9, down=10, right=11.
 */
const FRAME_W = 64
const FRAME_H = 64
const COLS = 13

const ROW_UP = 8
const ROW_LEFT = 9
const ROW_DOWN = 10
const ROW_RIGHT = 11
const ROW_SIT_DOWN = 12

function frame(col: number, row: number) {
  return {
    frame: { x: col * FRAME_W, y: row * FRAME_H, w: FRAME_W, h: FRAME_H },
    sourceSize: { w: FRAME_W, h: FRAME_H },
    spriteSourceSize: { x: 0, y: 0, w: FRAME_W, h: FRAME_H },
    anchor: { x: 0.5, y: 1 },
  }
}

const frames: Record<string, ReturnType<typeof frame>> = {}

// walk_down: row 10, cols 0-3
for (let i = 0; i < 4; i++) {
  frames[`walk_down_${i}`] = frame(i, ROW_DOWN)
}
// walk_left: row 9
for (let i = 0; i < 4; i++) {
  frames[`walk_left_${i}`] = frame(i, ROW_LEFT)
}
// walk_right: row 11
for (let i = 0; i < 4; i++) {
  frames[`walk_right_${i}`] = frame(i, ROW_RIGHT)
}
// walk_up: row 8
for (let i = 0; i < 4; i++) {
  frames[`walk_up_${i}`] = frame(i, ROW_UP)
}
// sit_down: row 12 (LPC sit animation)
frames['sit_down_0'] = frame(0, ROW_SIT_DOWN)

export const lpcPlayerSpriteSheetData = {
  frames,
  meta: {
    image: '',
    format: 'RGBA8888',
    size: { w: 832, h: 2944 },
    scale: 1,
  },
  animations: {
    idle_down: ['walk_down_1'],
    idle_left: ['walk_left_1'],
    idle_right: ['walk_right_1'],
    idle_up: ['walk_up_1'],
    sit_down: ['sit_down_0'],
    walk_down: ['walk_down_0', 'walk_down_1', 'walk_down_2', 'walk_down_3'],
    walk_left: ['walk_left_0', 'walk_left_1', 'walk_left_2', 'walk_left_3'],
    walk_right: ['walk_right_0', 'walk_right_1', 'walk_right_2', 'walk_right_3'],
    walk_up: ['walk_up_0', 'walk_up_1', 'walk_up_2', 'walk_up_3'],
  },
}
