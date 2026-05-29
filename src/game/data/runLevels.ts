import { type AssetKey, ASSETS } from '../assets';
import type { ThemeKey } from '../worldMap';

export type LevelId = ThemeKey;

export type LevelOption = {
  id: LevelId;
  name: string;
  order: number;
  tagline: string;
  backgroundColor: string;
  backgroundBand: number;
  roadOuter: number;
  roadInner: number;
  roadEdge: number;
  laneMark: number;
  hudTint: number;
  maxYarn: number;
  decorKeys: AssetKey[];
};

export const LEVELS: LevelOption[] = [
  {
    id: 'kitchen',
    name: 'Cozy Kitchen',
    order: 1,
    tagline: 'Flour pawprints and spoon chaos',
    backgroundColor: '#f1c975',
    backgroundBand: 0xffefba,
    roadOuter: 0xc98248,
    roadInner: 0xfff7dc,
    roadEdge: 0xffffff,
    laneMark: 0xd39154,
    hudTint: 0x9b5734,
    maxYarn: 36,
    decorKeys: [ASSETS.paw, ASSETS.milkBowl, ASSETS.milkBottle, ASSETS.sparkle]
  },
  {
    id: 'living_room',
    name: 'Living Room',
    order: 2,
    tagline: 'Yarn trails and couch-gap zoomies',
    backgroundColor: '#6fb68a',
    backgroundBand: 0xf06d5f,
    roadOuter: 0x5d3b8c,
    roadInner: 0xff8ec7,
    roadEdge: 0xffffff,
    laneMark: 0xfff2bd,
    hudTint: 0x306955,
    maxYarn: 36,
    decorKeys: [ASSETS.yarnPink, ASSETS.yarnBlue, ASSETS.yarnPurple, ASSETS.vacuum, ASSETS.mouseCatToys]
  },
  {
    id: 'backyard',
    name: 'Backyard',
    order: 3,
    tagline: 'Fence club adventure pace',
    backgroundColor: '#77c765',
    backgroundBand: 0xa7e870,
    roadOuter: 0x6e9b49,
    roadInner: 0xd8b176,
    roadEdge: 0xf6ffe7,
    laneMark: 0x7ed7ff,
    hudTint: 0x3f7b45,
    maxYarn: 38,
    decorKeys: [ASSETS.flower, ASSETS.grassTuft, ASSETS.paw, ASSETS.cucumber]
  }
];
