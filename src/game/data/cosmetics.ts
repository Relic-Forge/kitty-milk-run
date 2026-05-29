import { ASSETS } from '../assets';

export type CosmeticOption = {
  id: string;
  name: string;
  cost: number;
  run1: string;
  run2: string;
  hit: string;
  style?: 'classic' | 'nyan';
};

export type AccessoryOption = {
  id: string;
  name: string;
  cost: number;
  asset: string;
};

export type TrailOption = {
  id: string;
  name: string;
  cost: number;
  asset: string;
};

export type MouseOption = {
  id: string;
  name: string;
  cost: number;
  asset: string;
  cursorUrl: string;
  hotSpot: { x: number; y: number };
};

export const COSMETICS: CosmeticOption[] = [
  { id: 'tabby', name: 'Sunny Tabby', cost: 0, run1: ASSETS.catRun1, run2: ASSETS.catRun2, hit: ASSETS.catHit },
  { id: 'gray', name: 'Gray Moon', cost: 100, run1: ASSETS.catGrayRun1, run2: ASSETS.catGrayRun2, hit: ASSETS.catGrayHit },
  { id: 'pink', name: 'Pink Sparkle', cost: 135, run1: ASSETS.catPinkRun1, run2: ASSETS.catPinkRun2, hit: ASSETS.catPinkHit },
  { id: 'tux', name: 'Tuxedo Pop', cost: 175, run1: ASSETS.catTuxRun1, run2: ASSETS.catTuxRun2, hit: ASSETS.catTuxHit },
  { id: 'rainbow', name: 'Rainbow Scarf', cost: 250, run1: ASSETS.catRainbowRun1, run2: ASSETS.catRainbowRun2, hit: ASSETS.catRainbowHit },
  { id: 'nyan-cherry', name: 'Nyan Cat', cost: 1200, run1: ASSETS.catNyanCherry, run2: ASSETS.catNyanCherry, hit: ASSETS.catNyanCherry, style: 'nyan' }
];

export const NYAN_VARIATIONS: CosmeticOption[] = [
  { id: 'nyan-cookies', name: 'Cookies n Creme', cost: 1200, run1: ASSETS.catNyanCookies, run2: ASSETS.catNyanCookies, hit: ASSETS.catNyanCookies, style: 'nyan' },
  { id: 'nyan-brown-sugar', name: 'Brown Sugar Cinnamon', cost: 1200, run1: ASSETS.catNyanBrownSugar, run2: ASSETS.catNyanBrownSugar, hit: ASSETS.catNyanBrownSugar, style: 'nyan' },
  { id: 'nyan-blueberry', name: 'Blueberry', cost: 1200, run1: ASSETS.catNyanBlueberry, run2: ASSETS.catNyanBlueberry, hit: ASSETS.catNyanBlueberry, style: 'nyan' },
  { id: 'nyan-strawberry', name: 'Strawberry Milkshake', cost: 1200, run1: ASSETS.catNyanStrawberry, run2: ASSETS.catNyanStrawberry, hit: ASSETS.catNyanStrawberry, style: 'nyan' },
  { id: 'nyan-maple', name: 'Frosted Maple Eggo', cost: 1200, run1: ASSETS.catNyanMaple, run2: ASSETS.catNyanMaple, hit: ASSETS.catNyanMaple, style: 'nyan' },
  { id: 'nyan-banana', name: 'Chocolate Banana Split', cost: 1200, run1: ASSETS.catNyanBanana, run2: ASSETS.catNyanBanana, hit: ASSETS.catNyanBanana, style: 'nyan' },
  { id: 'nyan-orange-cream', name: 'Orange Cream', cost: 1200, run1: ASSETS.catNyanOrangeCream, run2: ASSETS.catNyanOrangeCream, hit: ASSETS.catNyanOrangeCream, style: 'nyan' },
  { id: 'nyan-smores', name: 'Smores', cost: 1200, run1: ASSETS.catNyanSmores, run2: ASSETS.catNyanSmores, hit: ASSETS.catNyanSmores, style: 'nyan' },
  { id: 'nyan-chocolate-fudge', name: 'Chocolate Fudge', cost: 1200, run1: ASSETS.catNyanChocolateFudge, run2: ASSETS.catNyanChocolateFudge, hit: ASSETS.catNyanChocolateFudge, style: 'nyan' },
  { id: 'nyan-hot-fudge', name: 'Hot Fudge Sundae', cost: 1200, run1: ASSETS.catNyanHotFudge, run2: ASSETS.catNyanHotFudge, hit: ASSETS.catNyanHotFudge, style: 'nyan' },
  { id: 'nyan-wild-berry', name: 'Wild Berry', cost: 1200, run1: ASSETS.catNyanWildBerry, run2: ASSETS.catNyanWildBerry, hit: ASSETS.catNyanWildBerry, style: 'nyan' }
];

export const ALL_COSMETICS = [...COSMETICS, ...NYAN_VARIATIONS];

export const ACCESSORIES: AccessoryOption[] = [
  { id: 'roomba', name: 'Roomba Rider', cost: 320, asset: ASSETS.roomba }
];

export const TRAILS: TrailOption[] = [
  { id: 'muddy-feet', name: 'Muddy Feet', cost: 0, asset: ASSETS.paw },
  { id: 'nyan-cat', name: 'Rainbow Trail', cost: 900, asset: ASSETS.nyanCat }
];

export const DEFAULT_MOUSE_OPTION: MouseOption = {
  id: 'classic-mouse',
  name: 'Computer Mouse',
  cost: 0,
  asset: ASSETS.mouseCursor,
  cursorUrl: '/assets/mouse-cursor.svg',
  hotSpot: { x: 8, y: 14 }
};

export const MOUSE_OPTIONS: MouseOption[] = [
  {
    id: 'rodent-mouse',
    name: 'Mouse',
    cost: 160,
    asset: ASSETS.mouseRodent,
    cursorUrl: '/assets/mouse-rodent.svg',
    hotSpot: { x: 8, y: 14 }
  },
  {
    id: 'cat-toys',
    name: 'Cat Toys',
    cost: 180,
    asset: ASSETS.mouseCatToys,
    cursorUrl: '/assets/mouse-cat-toys.svg',
    hotSpot: { x: 8, y: 14 }
  },
  {
    id: 'cat-nip',
    name: 'Cat Nip',
    cost: 230,
    asset: ASSETS.mouseCatNip,
    cursorUrl: '/assets/mouse-cat-nip.svg',
    hotSpot: { x: 8, y: 14 }
  },
  {
    id: 'scratching-post',
    name: 'Sideways Scratching Post',
    cost: 280,
    asset: ASSETS.mouseScratchingPost,
    cursorUrl: '/assets/mouse-scratching-post.svg',
    hotSpot: { x: 8, y: 14 }
  },
  {
    id: 'laser-red-dot',
    name: 'Laser Pointer Red Dot',
    cost: 500,
    asset: ASSETS.mouseLaserDot,
    cursorUrl: '/assets/mouse-laser-dot.svg',
    hotSpot: { x: 8, y: 14 }
  }
];

export const ALL_MOUSE_OPTIONS = [DEFAULT_MOUSE_OPTION, ...MOUSE_OPTIONS];
