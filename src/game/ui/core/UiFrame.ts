import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../constants';
import { UiPanel } from './UiPanel';

export type UiFrameBounds = {
  screen: Phaser.Geom.Rectangle;
  panel: Phaser.Geom.Rectangle;
  header: Phaser.Geom.Rectangle;
  content: Phaser.Geom.Rectangle;
  footer: Phaser.Geom.Rectangle;
};

export class UiFrame {
  readonly container: Phaser.GameObjects.Container;
  readonly bounds: UiFrameBounds;

  constructor(scene: Phaser.Scene, options: { fill?: number; panelFill?: number } = {}) {
    this.container = scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.bounds = {
      screen: new Phaser.Geom.Rectangle(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT),
      panel: new Phaser.Geom.Rectangle(-425, -244, 850, 486),
      header: new Phaser.Geom.Rectangle(-386, -218, 772, 78),
      content: new Phaser.Geom.Rectangle(-386, -132, 772, 290),
      footer: new Phaser.Geom.Rectangle(-386, 164, 772, 60)
    };
    this.container.add(scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, options.fill ?? 0x5e8be8, 1));
    this.container.add(new UiPanel({ scene, x: -425, y: -244, width: 850, height: 486, fill: options.panelFill ?? 0x2d5fbd, radius: 28 }).graphics);
  }

  getBounds() {
    return this.bounds;
  }
}
