import Phaser from 'phaser';

export class UiBadge {
  readonly container: Phaser.GameObjects.Container;
  private readonly background: Phaser.GameObjects.Graphics;
  private readonly text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, label: string, textStyle: (fontSize: number, color: string) => Phaser.Types.GameObjects.Text.TextStyle) {
    this.container = scene.add.container(x, y);
    this.background = scene.add.graphics();
    this.text = scene.add.text(0, 0, label, textStyle(14, '#fffad0')).setOrigin(0.5).setStroke('#17347e', 4);
    this.container.add([this.background, this.text]);
    this.draw();
  }

  setText(label: string) {
    this.text.setText(label);
    this.draw();
  }

  private draw() {
    const width = Math.max(86, this.text.width + 26);
    this.background.clear();
    this.background.fillStyle(0x17347e, 0.9);
    this.background.fillRoundedRect(-width / 2, -18, width, 36, 15);
    this.background.lineStyle(3, 0xffffff, 0.78);
    this.background.strokeRoundedRect(-width / 2, -18, width, 36, 15);
  }
}
