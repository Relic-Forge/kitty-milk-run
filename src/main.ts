import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './game/constants';
import { BootScene } from './game/scenes/BootScene';
import { LaunchScene } from './game/scenes/LaunchScene';
import { MilkMapScene } from './game/scenes/MilkMapScene';
import { RunScene } from './game/scenes/RunScene';
import { ShopScene } from './game/scenes/ShopScene';
import './style.css';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#73d36a',
  scene: [BootScene, LaunchScene, MilkMapScene, ShopScene, RunScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade'
  }
});

if (import.meta.env.DEV) {
  window.__KITTY_MILK_RUN__ = game;
}
