import Phaser from 'phaser';

export type PixelButtonConfig = {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  color: number;
  fontSize?: number;
  disabled?: boolean;
  depth?: number;
  onClick: () => void;
  textStyle: (fontSize: number, color: string) => Phaser.Types.GameObjects.Text.TextStyle;
};

export class PixelButton {
  readonly container: Phaser.GameObjects.Container;
  private readonly background: Phaser.GameObjects.Graphics;
  private readonly labelText: Phaser.GameObjects.Text;
  private disabled: boolean;

  constructor(private readonly config: PixelButtonConfig) {
    this.disabled = config.disabled ?? false;
    this.container = config.scene.add.container(config.x, config.y);
    if (config.depth !== undefined) this.container.setDepth(config.depth);
    this.background = config.scene.add.graphics();
    this.labelText = config.scene.add
      .text(0, 0, config.label, config.textStyle(config.fontSize ?? 18, '#ffffff'))
      .setOrigin(0.5)
      .setStroke('#17347e', 5);
    const clickZone = config.scene.add.zone(0, 0, config.width, config.height).setInteractive();
    this.container.add([this.background, this.labelText, clickZone]);
    clickZone.on('pointerup', () => {
      if (this.disabled) return;
      config.onClick();
    });
    clickZone.on('pointerover', () => this.draw(true));
    clickZone.on('pointerout', () => this.draw(false));
    this.draw(false);
  }

  setLabel(label: string) {
    this.labelText.setText(label);
  }

  setDisabled(disabled: boolean) {
    this.disabled = disabled;
    this.draw(false);
  }

  setVisible(visible: boolean) {
    this.container.setVisible(visible);
  }

  destroy() {
    this.container.destroy();
  }

  private draw(hovered: boolean) {
    const { width, height, color } = this.config;
    this.background.clear();
    this.background.fillStyle(this.disabled ? 0x6b718a : color, this.disabled ? 0.6 : hovered ? 1 : 0.94);
    this.background.fillRoundedRect(-width / 2, -height / 2, width, height, 16);
    this.background.lineStyle(hovered && !this.disabled ? 5 : 4, 0xffffff, this.disabled ? 0.44 : 0.86);
    this.background.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);
    this.labelText.setAlpha(this.disabled ? 0.58 : 1);
  }
}
