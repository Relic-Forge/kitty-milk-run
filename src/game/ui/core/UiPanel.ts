import Phaser from 'phaser';

export type UiPanelConfig = {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: number;
  alpha?: number;
  border?: number;
  borderAlpha?: number;
  radius?: number;
  shadowOffset?: number;
  highlight?: boolean;
};

export class UiPanel {
  readonly graphics: Phaser.GameObjects.Graphics;
  private config: Required<Omit<UiPanelConfig, 'scene'>> & { scene: Phaser.Scene };

  constructor(config: UiPanelConfig) {
    this.config = {
      fill: 0x2d5fbd,
      alpha: 1,
      border: 0xffffff,
      borderAlpha: 0.86,
      radius: 18,
      shadowOffset: 0,
      highlight: false,
      ...config
    };
    this.graphics = config.scene.add.graphics();
    this.draw();
  }

  redraw(config: Partial<UiPanelConfig> = {}) {
    this.config = { ...this.config, ...config };
    this.draw();
  }

  private draw() {
    const { x, y, width, height, fill, alpha, border, borderAlpha, radius, shadowOffset, highlight } = this.config;
    this.graphics.clear();
    if (shadowOffset > 0) {
      this.graphics.fillStyle(0x17347e, 0.28);
      this.graphics.fillRoundedRect(x + shadowOffset, y + shadowOffset, width, height, radius);
    }
    this.graphics.fillStyle(fill, alpha);
    this.graphics.fillRoundedRect(x, y, width, height, radius);
    if (highlight) {
      this.graphics.fillStyle(0xffffff, 0.16);
      this.graphics.fillRoundedRect(x + 10, y + 8, width - 20, Math.max(6, height * 0.16), Math.max(4, radius - 8));
    }
    this.graphics.lineStyle(4, border, borderAlpha);
    this.graphics.strokeRoundedRect(x, y, width, height, radius);
  }
}
