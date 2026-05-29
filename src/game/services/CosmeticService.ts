import {
  ACCESSORIES,
  ALL_COSMETICS,
  ALL_MOUSE_OPTIONS,
  COSMETICS,
  DEFAULT_MOUSE_OPTION,
  TRAILS,
  type AccessoryOption,
  type CosmeticOption,
  type MouseOption,
  type TrailOption
} from '../data/cosmetics';
import { STORAGE_KEYS } from '../data/storageKeys';
import { StorageService } from './StorageService';

type ShopKind = 'cat' | 'accessory' | 'trail' | 'mouse';
type ShopOption = CosmeticOption | AccessoryOption | TrailOption | MouseOption;

export type ShopActionResult = {
  ok: boolean;
  action: 'equip' | 'buy' | 'deny' | 'cat-god-equip';
  message: string;
  changedCursor?: boolean;
  changedTrail?: boolean;
  changedAccessory?: boolean;
  changedCat?: boolean;
};

export class CosmeticService {
  private static yarnBasket = 0;
  private static selectedCosmeticId = 'tabby';
  private static selectedAccessoryId = 'none';
  private static selectedTrailId = 'muddy-feet';
  private static selectedMouseId = 'classic-mouse';
  private static unlockedCosmetics = new Set<string>(['tabby']);
  private static unlockedAccessories = new Set<string>();
  private static unlockedTrails = new Set<string>(['muddy-feet']);
  private static unlockedMouseOptions = new Set<string>(['classic-mouse']);
  private static catGodMode = false;

  static load() {
    const storedBasket = StorageService.getOptionalString(STORAGE_KEYS.basket) ?? StorageService.getOptionalString('kitty-milk-run:yarn-wallet');
    CosmeticService.yarnBasket = Number.parseInt(storedBasket ?? '0', 10) || 0;

    const unlocked = StorageService.getJson<string[]>(STORAGE_KEYS.unlocked, ['tabby']);
    CosmeticService.unlockedCosmetics = new Set(['tabby', ...unlocked.filter((id) => ALL_COSMETICS.some((option) => option.id === id))]);
    const selected = StorageService.getString(STORAGE_KEYS.selected, 'tabby');
    CosmeticService.selectedCosmeticId = CosmeticService.unlockedCosmetics.has(selected) ? selected : 'tabby';

    const unlockedAccessories = StorageService.getJson<string[]>(STORAGE_KEYS.unlockedAccessories, []);
    CosmeticService.unlockedAccessories = new Set(unlockedAccessories.filter((id) => ACCESSORIES.some((option) => option.id === id)));
    const selectedAccessory = StorageService.getString(STORAGE_KEYS.selectedAccessory, 'none');
    CosmeticService.selectedAccessoryId = CosmeticService.unlockedAccessories.has(selectedAccessory) ? selectedAccessory : 'none';

    const hadLegacyRainbowTrail = selectedAccessory === 'nyan-cat' || unlockedAccessories.includes('nyan-cat');
    const unlockedTrails = StorageService.getJson<string[]>(STORAGE_KEYS.unlockedTrails, ['muddy-feet']);
    CosmeticService.unlockedTrails = new Set([
      'muddy-feet',
      ...unlockedTrails.filter((id) => TRAILS.some((option) => option.id === id)),
      ...(hadLegacyRainbowTrail ? ['nyan-cat'] : [])
    ]);
    const selectedTrail = StorageService.getString(STORAGE_KEYS.selectedTrail, selectedAccessory === 'nyan-cat' ? 'nyan-cat' : 'muddy-feet');
    CosmeticService.selectedTrailId = CosmeticService.unlockedTrails.has(selectedTrail) ? selectedTrail : 'muddy-feet';

    const unlockedMouse = StorageService.getJson<string[]>(STORAGE_KEYS.unlockedMouse, ['classic-mouse']);
    CosmeticService.unlockedMouseOptions = new Set([
      'classic-mouse',
      ...unlockedMouse.filter((id) => ALL_MOUSE_OPTIONS.some((option) => option.id === id))
    ]);
    const selectedMouse = StorageService.getString(STORAGE_KEYS.selectedMouse, 'classic-mouse');
    CosmeticService.selectedMouseId = CosmeticService.unlockedMouseOptions.has(selectedMouse) ? selectedMouse : 'classic-mouse';
    CosmeticService.catGodMode = false;
  }

  static save() {
    StorageService.setNumber(STORAGE_KEYS.basket, CosmeticService.yarnBasket);
    StorageService.setString(STORAGE_KEYS.selected, CosmeticService.selectedCosmeticId);
    StorageService.setJson(STORAGE_KEYS.unlocked, [...CosmeticService.unlockedCosmetics]);
    StorageService.setString(STORAGE_KEYS.selectedAccessory, CosmeticService.selectedAccessoryId);
    StorageService.setJson(STORAGE_KEYS.unlockedAccessories, [...CosmeticService.unlockedAccessories]);
    StorageService.setString(STORAGE_KEYS.selectedTrail, CosmeticService.selectedTrailId);
    StorageService.setJson(STORAGE_KEYS.unlockedTrails, [...CosmeticService.unlockedTrails]);
    StorageService.setString(STORAGE_KEYS.selectedMouse, CosmeticService.selectedMouseId);
    StorageService.setJson(STORAGE_KEYS.unlockedMouse, [...CosmeticService.unlockedMouseOptions]);
  }

  static getYarnBasket() {
    return CosmeticService.yarnBasket;
  }

  static addYarn(amount: number) {
    CosmeticService.yarnBasket += amount;
    CosmeticService.save();
  }

  static isCatGodMode() {
    return CosmeticService.catGodMode;
  }

  static getSelectedCosmetic() {
    return ALL_COSMETICS.find((option) => option.id === CosmeticService.selectedCosmeticId) ?? COSMETICS[0];
  }

  static getSelectedAccessory() {
    return ACCESSORIES.find((option) => option.id === CosmeticService.selectedAccessoryId);
  }

  static getSelectedAccessoryId() {
    return CosmeticService.selectedAccessoryId;
  }

  static getSelectedTrailId() {
    return CosmeticService.selectedTrailId;
  }

  static getSelectedMouseOption() {
    return ALL_MOUSE_OPTIONS.find((option) => option.id === CosmeticService.selectedMouseId) ?? DEFAULT_MOUSE_OPTION;
  }

  static isUnlocked(kind: ShopKind, optionId: string) {
    if (kind === 'cat') return CosmeticService.unlockedCosmetics.has(optionId);
    if (kind === 'accessory') return CosmeticService.unlockedAccessories.has(optionId);
    if (kind === 'trail') return CosmeticService.unlockedTrails.has(optionId);
    return CosmeticService.unlockedMouseOptions.has(optionId);
  }

  static isSelected(kind: ShopKind, optionId: string) {
    if (kind === 'cat') return CosmeticService.selectedCosmeticId === optionId;
    if (kind === 'accessory') return CosmeticService.selectedAccessoryId === optionId;
    if (kind === 'trail') return CosmeticService.selectedTrailId === optionId;
    return CosmeticService.selectedMouseId === optionId;
  }

  static buyOrEquip(kind: ShopKind, option: ShopOption): ShopActionResult {
    if (CosmeticService.isUnlocked(kind, option.id) || CosmeticService.catGodMode) {
      const action = CosmeticService.isUnlocked(kind, option.id) ? 'equip' : 'cat-god-equip';
      CosmeticService.equip(kind, option);
      CosmeticService.save();
      return {
        ok: true,
        action,
        message: action === 'cat-god-equip' ? 'Cat God equip' : CosmeticService.equipMessage(kind),
        changedAccessory: kind === 'accessory',
        changedCat: kind === 'cat',
        changedCursor: kind === 'mouse',
        changedTrail: kind === 'trail'
      };
    }

    if (CosmeticService.yarnBasket < option.cost) {
      return { ok: false, action: 'deny', message: 'Need more yarn' };
    }

    CosmeticService.yarnBasket -= option.cost;
    CosmeticService.unlock(kind, option.id);
    CosmeticService.equip(kind, option);
    CosmeticService.save();
    return {
      ok: true,
      action: 'buy',
      message: CosmeticService.buyMessage(kind),
      changedAccessory: kind === 'accessory',
      changedCat: kind === 'cat',
      changedCursor: kind === 'mouse',
      changedTrail: kind === 'trail'
    };
  }

  static toggleCatGodMode() {
    CosmeticService.catGodMode = !CosmeticService.catGodMode;
    if (!CosmeticService.catGodMode) {
      if (!CosmeticService.unlockedCosmetics.has(CosmeticService.selectedCosmeticId)) {
        CosmeticService.selectedCosmeticId = 'tabby';
      }
      if (CosmeticService.selectedAccessoryId !== 'none' && !CosmeticService.unlockedAccessories.has(CosmeticService.selectedAccessoryId)) {
        CosmeticService.selectedAccessoryId = 'none';
      }
      if (!CosmeticService.unlockedTrails.has(CosmeticService.selectedTrailId)) {
        CosmeticService.selectedTrailId = 'muddy-feet';
      }
      if (!CosmeticService.unlockedMouseOptions.has(CosmeticService.selectedMouseId)) {
        CosmeticService.selectedMouseId = 'classic-mouse';
      }
    }
    CosmeticService.save();
    return CosmeticService.catGodMode;
  }

  private static equip(kind: ShopKind, option: ShopOption) {
    if (kind === 'cat') CosmeticService.selectedCosmeticId = option.id;
    if (kind === 'accessory') CosmeticService.selectedAccessoryId = CosmeticService.selectedAccessoryId === option.id ? 'none' : option.id;
    if (kind === 'trail') CosmeticService.selectedTrailId = option.id;
    if (kind === 'mouse') CosmeticService.selectedMouseId = option.id;
  }

  private static unlock(kind: ShopKind, optionId: string) {
    if (kind === 'cat') CosmeticService.unlockedCosmetics.add(optionId);
    if (kind === 'accessory') CosmeticService.unlockedAccessories.add(optionId);
    if (kind === 'trail') CosmeticService.unlockedTrails.add(optionId);
    if (kind === 'mouse') CosmeticService.unlockedMouseOptions.add(optionId);
  }

  private static buyMessage(kind: ShopKind) {
    if (kind === 'cat') return 'New kitty!';
    if (kind === 'accessory') return 'New ride!';
    if (kind === 'trail') return 'New trail!';
    return 'New mouse!';
  }

  private static equipMessage(kind: ShopKind) {
    if (kind === 'cat') return 'Kitty equipped';
    if (kind === 'accessory') return 'Ride equipped';
    if (kind === 'trail') return 'Trail equipped';
    return 'Mouse equipped';
  }
}
