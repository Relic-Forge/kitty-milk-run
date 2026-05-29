import Phaser from 'phaser';
import { loadGameAssets } from '../assets';
import { AudioSettingsService } from '../services/AudioSettingsService';
import { CosmeticService } from '../services/CosmeticService';
import { GameStateService } from '../services/GameStateService';
import { ProgressService } from '../services/ProgressService';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    loadGameAssets(this);
  }

  create() {
    CosmeticService.load();
    GameStateService.load();
    ProgressService.load();
    AudioSettingsService.loadAndApply();
    this.scene.start('LaunchScene');
  }
}
