import {
  ACCESSORIES,
  ALL_COSMETICS,
  ALL_MOUSE_OPTIONS,
  TRAILS,
  type AccessoryOption,
  type CosmeticOption,
  type MouseOption,
  type TrailOption
} from '../data/cosmetics';
import { CosmeticService } from '../services/CosmeticService';

export type ShopKind = 'cat' | 'accessory' | 'trail' | 'mouse';
export type ShopOption = CosmeticOption | AccessoryOption | TrailOption | MouseOption;

export type ShopCardViewModel = {
  kind: ShopKind;
  option: ShopOption;
  unlocked: boolean;
  selected: boolean;
  statusLabel: string;
  priceLabel: string;
};

function buildCard(kind: ShopKind, option: ShopOption): ShopCardViewModel {
  const unlocked = CosmeticService.isUnlocked(kind, option.id);
  const selected = CosmeticService.isSelected(kind, option.id);
  const catGodMode = CosmeticService.isCatGodMode();
  return {
    kind,
    option,
    unlocked,
    selected,
    priceLabel: option.cost === 0 ? 'Free' : `${option.cost} yarn`,
    statusLabel: selected ? 'EQUIPPED' : unlocked ? 'EQUIP' : catGodMode ? 'EQUIP' : 'BUY'
  };
}

export function buildShopViewModel() {
  return {
    yarnBasket: CosmeticService.getYarnBasket(),
    catGodMode: CosmeticService.isCatGodMode(),
    sections: [
      { id: 'cats', label: 'Cats', shortLabel: 'Cats', cards: ALL_COSMETICS.map((option) => buildCard('cat', option)) },
      { id: 'mouse', label: 'Mouse', shortLabel: 'Mouse', cards: ALL_MOUSE_OPTIONS.map((option) => buildCard('mouse', option)) },
      { id: 'trails', label: 'Trails', shortLabel: 'Trails', cards: TRAILS.map((option) => buildCard('trail', option)) },
      { id: 'accessories', label: 'Accessories', shortLabel: 'Gear', cards: ACCESSORIES.map((option) => buildCard('accessory', option)) }
    ]
  };
}
