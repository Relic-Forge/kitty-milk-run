import Phaser from 'phaser';

export type PixelPanelConfig = {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: number;
  alpha?: number;
  border?: number;
  borderAlpha?: number;
  radius?: number;
  lineWidth?: number;
  depth?: number;
};

export class PixelPanel {
  readonly graphics: Phaser.GameObjects.Graphics;

  constructor(private config: PixelPanelConfig) {
    this.graphics = config.scene.add.graphics();
    if (config.depth !== undefined) this.graphics.setDepth(config.depth);
    this.draw();
  }

  redraw(config: Partial<PixelPanelConfig> = {}) {
    this.config = { ...this.config, ...config };
    this.draw();
  }

  destroy() {
    this.graphics.destroy();
  }

  private draw() {
    const { x, y, width, height, fill, alpha = 1, border = 0xffffff, borderAlpha = 0.84, radius = 18, lineWidth = 4 } = this.config;
    this.graphics.clear();
    this.graphics.fillStyle(fill, alpha);
    this.graphics.fillRoundedRect(x, y, width, height, radius);
    this.graphics.lineStyle(lineWidth, border, borderAlpha);
    this.graphics.strokeRoundedRect(x, y, width, height, radius);
  }
}
