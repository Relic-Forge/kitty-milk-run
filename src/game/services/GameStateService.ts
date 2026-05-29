import { LEVELS, type LevelId } from '../data/runLevels';
import { SPEED_OPTIONS } from '../data/speedOptions';
import { STORAGE_KEYS } from '../data/storageKeys';
import { StorageService } from './StorageService';

export type RunMode = 'milk-run' | 'farm-for-yarn';

export class GameStateService {
  private static speedMultiplier = 1;
  private static selectedLevelId: LevelId = 'kitchen';
  private static runMode: RunMode = 'milk-run';

  static load() {
    const storedSpeed = StorageService.getNumber(STORAGE_KEYS.speed, 1);
    GameStateService.speedMultiplier = SPEED_OPTIONS.some((option) => option.multiplier === storedSpeed) ? storedSpeed : 1;
    const storedLevel = StorageService.getOptionalString(STORAGE_KEYS.level);
    GameStateService.selectedLevelId = LEVELS.some((level) => level.id === storedLevel) ? (storedLevel as LevelId) : 'kitchen';
    const storedMode = StorageService.getOptionalString(STORAGE_KEYS.mode) as RunMode | null;
    GameStateService.runMode = storedMode === 'farm-for-yarn' ? 'farm-for-yarn' : 'milk-run';
  }

  static save() {
    StorageService.setNumber(STORAGE_KEYS.speed, GameStateService.speedMultiplier);
    StorageService.setString(STORAGE_KEYS.level, GameStateService.selectedLevelId);
    StorageService.setString(STORAGE_KEYS.mode, GameStateService.runMode);
  }

  static getSpeedMultiplier() {
    return GameStateService.speedMultiplier;
  }

  static setSpeedMultiplier(multiplier: number) {
    GameStateService.speedMultiplier = SPEED_OPTIONS.some((option) => option.multiplier === multiplier) ? multiplier : 1;
    GameStateService.save();
  }

  static getSelectedLevelId() {
    return GameStateService.selectedLevelId;
  }

  static setSelectedLevelId(levelId: LevelId) {
    GameStateService.selectedLevelId = LEVELS.some((level) => level.id === levelId) ? levelId : 'kitchen';
    GameStateService.save();
  }

  static getRunMode() {
    return GameStateService.runMode;
  }

  static setRunMode(mode: RunMode) {
    GameStateService.runMode = mode === 'farm-for-yarn' ? 'farm-for-yarn' : 'milk-run';
    GameStateService.save();
  }
}
