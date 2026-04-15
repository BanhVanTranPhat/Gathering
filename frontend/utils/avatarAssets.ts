// Cấu hình avatar (Body, Hair, Head, Top, Pants, Shoes, Hat, Glasses, Other)

const TILE_SIZE = 64

/** Avatar mặc định (thay cho goblin Character_XXX) - luôn dùng avatar tạo từ editor */
export const DEFAULT_AVATAR_CONFIG: Record<string, string> = {
  skin: 'skin_1',
  hair: 'hair_1',
  head: 'head_1',
  top: 'top_1',
  bottom: 'pants_1',
  shoes: 'none',
  hat: 'none',
  glasses: 'none',
  other: 'none',
}
const IDLE_DOWN_Y = 10 * TILE_SIZE
const IDLE_DOWN_X = 0 * TILE_SIZE

export const CATEGORIES = [
  { id: 'skin', label: 'Body', icon: '🎨' },
  { id: 'hair', label: 'Hair', icon: '💇' },
  { id: 'head', label: 'Head', icon: '🧔' },
  { id: 'top', label: 'Top', icon: '👕' },
  { id: 'bottom', label: 'Pants', icon: '👖' },
  { id: 'shoes', label: 'Shoes', icon: '👟' },
  { id: 'hat', label: 'Hat', icon: '🧢' },
  { id: 'glasses', label: 'Glasses', icon: '👓' },
  { id: 'other', label: 'Other', icon: '🎒' },
]

export const ASSETS: Record<string, Array<{ id: string; src: string | null; x?: number; y?: number; color?: string }>> = {
  skin: [
    { id: 'none', src: null },
    { id: 'skin_1', src: '/assets/avatar/body/body_1.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'skin_2', src: '/assets/avatar/body/body_2.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'skin_3', src: '/assets/avatar/body/body_3.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'skin_4', src: '/assets/avatar/body/body_4.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'skin_5', src: '/assets/avatar/body/body_5.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'skin_6', src: '/assets/avatar/body/body_6.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
  ],
  head: [
    { id: 'head_1', src: '/assets/avatar/head/head_1.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'head_2', src: '/assets/avatar/head/head_2.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'head_3', src: '/assets/avatar/head/head_3.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'head_4', src: '/assets/avatar/head/head_4.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'head_5', src: '/assets/avatar/head/head_5.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'head_6', src: '/assets/avatar/head/head_6.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
  ],
  hair: [
    { id: 'none', src: null },
    { id: 'hair_1', src: '/assets/avatar/hair/hair_1.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'hair_2', src: '/assets/avatar/hair/hair_2.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'hair_3', src: '/assets/avatar/hair/hair_3.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'hair_4', src: '/assets/avatar/hair/hair_4.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'hair_5', src: '/assets/avatar/hair/hair_5.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'hair_6', src: '/assets/avatar/hair/hair_6.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'hair_7', src: '/assets/avatar/hair/hair_7.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
  ],
  top: [
    { id: 'none', src: null },
    { id: 'top_1', src: '/assets/avatar/top/top_1.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'top_2', src: '/assets/avatar/top/top_2.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'top_3', src: '/assets/avatar/top/top_3.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'top_4', src: '/assets/avatar/top/top_4.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'top_5', src: '/assets/avatar/top/top_5.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'top_6', src: '/assets/avatar/top/top_6.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'top_7', src: '/assets/avatar/top/top_7.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'top_8', src: '/assets/avatar/top/top_8.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'top_9', src: '/assets/avatar/top/top_9.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
  ],
  bottom: [
    { id: 'none', src: null },
    { id: 'pants_1', src: '/assets/avatar/bottom/pants_1.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'pants_2', src: '/assets/avatar/bottom/pants_2.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'pants_3', src: '/assets/avatar/bottom/pants_3.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'pants_4', src: '/assets/avatar/bottom/pants_4.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'pants_5', src: '/assets/avatar/bottom/pants_5.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'pants_6', src: '/assets/avatar/bottom/pants_6.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
  ],
  shoes: [
    { id: 'none', src: null },
    { id: 'shoe_1', src: '/assets/avatar/shoes/shoes_1.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'shoe_2', src: '/assets/avatar/shoes/shoes_2.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'shoe_3', src: '/assets/avatar/shoes/shoes_3.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'shoe_4', src: '/assets/avatar/shoes/shoes_4.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'shoe_5', src: '/assets/avatar/shoes/shoes_5.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'shoe_6', src: '/assets/avatar/shoes/shoes_6.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
  ],
  hat: [
    { id: 'none', src: null },
    { id: 'hat_1', src: '/assets/avatar/hat/hat_1.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'hat_2', src: '/assets/avatar/hat/hat_2.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'hat_3', src: '/assets/avatar/hat/hat_3.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'hat_4', src: '/assets/avatar/hat/hat_4.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'hat_5', src: '/assets/avatar/hat/hat_5.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
  ],
  glasses: [
    { id: 'none', src: null },
    { id: 'glasses_1', src: '/assets/avatar/glasses/glasses_1.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'glasses_2', src: '/assets/avatar/glasses/glasses_2.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'glasses_3', src: '/assets/avatar/glasses/glasses_3.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'glasses_4', src: '/assets/avatar/glasses/glasses_4.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'glasses_5', src: '/assets/avatar/glasses/glasses_5.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'glasses_6', src: '/assets/avatar/glasses/glasses_6.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'glasses_7', src: '/assets/avatar/glasses/glasses_7.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
  ],
  other: [
    { id: 'none', src: null },
    { id: 'other_1', src: '/assets/avatar/other/other_1.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'other_2', src: '/assets/avatar/other/other_2.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'other_3', src: '/assets/avatar/other/other_3.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
    { id: 'other_4', src: '/assets/avatar/other/other_4.png', x: IDLE_DOWN_X, y: IDLE_DOWN_Y },
  ],
}

export const LAYER_ORDER = [
  'other',
  'skin',
  'shoes',
  'bottom',
  'top',
  'head',
  'hair',
  'glasses',
  'hat',
]
