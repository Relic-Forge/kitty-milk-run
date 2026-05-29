import Phaser from 'phaser';
import { UiBadge } from './UiBadge';
import { UiPanel } from './UiPanel';

export class UiHeaderBar {
  readonly container: Phaser.GameObjects.Container;

  constructor(
    scene: Phaser.Scene,
    bounds: Phaser.Geom.Rectangle,
    title: string,
    subtitle: string,
    textStyle: (fontSize: number, color: string) => Phaser.Types.GameObjects.Text.TextStyle,
    badges: UiBadge[] = []
  ) {
    this.container = scene.add.container(0, 0);
    this.container.add(new UiPanel({ scene, x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, fill: 0x17347e, alpha: 0.84, radius: 16 }).graphics);
    this.container.add(scene.add.text(bounds.x + 24, bounds.y + 25, title, textStyle(26, '#ffffff')).setOrigin(0, 0.5).setStroke('#17347e', 5));
    this.container.add(scene.add.text(bounds.x + 26, bounds.y + 54, subtitle, textStyle(12, '#dff7ff')).setOrigin(0, 0.5).setStroke('#17347e', 3));
    badges.forEach((badge, index) => {
      badge.container.setPosition(bounds.right - 72 - index * 126, bounds.y + 39);
      this.container.add(badge.container);
    });
  }
}
