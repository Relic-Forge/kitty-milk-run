import Phaser from 'phaser';

export class UiScrollArea {
  readonly container: Phaser.GameObjects.Container;
  scrollY = 0;

  constructor(
    readonly scene: Phaser.Scene,
    readonly viewport: Phaser.Geom.Rectangle,
    readonly contentHeight: number
  ) {
    this.container = scene.add.container(viewport.x, viewport.y);
  }

  setScroll(value: number) {
    this.scrollY = Phaser.Math.Clamp(value, 0, Math.max(0, this.contentHeight - this.viewport.height));
    this.container.setY(this.viewport.y - this.scrollY);
  }
}
