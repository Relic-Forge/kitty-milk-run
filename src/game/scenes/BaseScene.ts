import Phaser from 'phaser';
import { ASSETS } from '../assets';
import { GAME_HEIGHT, GAME_WIDTH } from '../constants';
import type { CosmeticOption } from '../data/cosmetics';
import { CosmeticService } from '../services/CosmeticService';
import { playBasketSound } from '../sound';
import { PixelButton } from '../ui/components/PixelButton';

export type EyeTrackedCat = {
  container: Phaser.GameObjects.Container;
  base: Phaser.GameObjects.Image;
  eyes: Phaser.GameObjects.Image;
  pupils: Phaser.GameObjects.Ellipse[];
  shines: Phaser.GameObjects.Ellipse[];
  pupilAnchors: Phaser.Math.Vector2[];
  shineAnchors: Phaser.Math.Vector2[];
  lookOrigin: Phaser.Math.Vector2;
  lookRange: Phaser.Math.Vector2;
};

export abstract class BaseScene extends Phaser.Scene {
  protected screenOverlay!: Phaser.GameObjects.Container;
  private readonly baseEyeTrackedCats: EyeTrackedCat[] = [];

  protected createScreenOverlay(fill = 0x5e8be8) {
    this.screenOverlay = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    const backdrop = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, fill, 1);
    this.screenOverlay.add(backdrop);
    return this.screenOverlay;
  }

  protected textStyle(fontSize: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: `${fontSize}px`,
      color,
      stroke: '#183f33',
      strokeThickness: 5
    };
  }

  protected createUiButton(x: number, y: number, width: number, height: number, label: string, color: number, onClick: () => void) {
    return new PixelButton({
      scene: this,
      x,
      y,
      width,
      height,
      label,
      color,
      textStyle: (fontSize, textColor) => this.textStyle(fontSize, textColor),
      onClick: () => {
        playBasketSound('equip');
        onClick();
      }
    }).container;
  }

  protected createPanel(x: number, y: number, width: number, height: number, fill = 0x2d5fbd, radius = 22) {
    const panel = this.add.graphics();
    panel.fillStyle(fill, 1);
    panel.fillRoundedRect(x, y, width, height, radius);
    panel.lineStyle(5, 0xffffff, 0.9);
    panel.strokeRoundedRect(x, y, width, height, radius);
    return panel;
  }

  protected playUiSound(kind: 'buy' | 'deny' | 'equip' = 'equip') {
    playBasketSound(kind);
  }

  protected applyMouseCursor() {
    const mouse = CosmeticService.getSelectedMouseOption();
    this.input.setDefaultCursor(`url(${mouse.cursorUrl}) ${mouse.hotSpot.x} ${mouse.hotSpot.y}, pointer`);
  }

  protected createEyeTrackedCat(x: number, y: number, texture: string, scale: number, usesNyanArt = false): EyeTrackedCat {
    const container = this.add.container(x, y).setScale(scale);
    const base = this.add.image(0, 0, texture);
    const eyes = this.add.image(0, 0, ASSETS.catKawaiiEyes);
    const pupils = [this.add.ellipse(-12, -6, 6.4, 9.2, 0x211718, 1), this.add.ellipse(12, -6, 6.4, 9.2, 0x211718, 1)];
    const shines = [this.add.ellipse(-14, -9, 3.2, 3.2, 0xffffff, 1), this.add.ellipse(10, -9, 3.2, 3.2, 0xffffff, 1)];
    container.add([base, eyes, ...pupils, ...shines]);
    container.setData('catBase', base);
    container.setData('catEyes', eyes);
    container.setData('catPupils', pupils);
    container.setData('catShines', shines);
    container.setData('usesNyanArt', usesNyanArt);

    const trackedCat = {
      container,
      base,
      eyes,
      pupils,
      shines,
      pupilAnchors: [new Phaser.Math.Vector2(-12, -6), new Phaser.Math.Vector2(12, -6)],
      shineAnchors: [new Phaser.Math.Vector2(-14, -9), new Phaser.Math.Vector2(10, -9)],
      lookOrigin: new Phaser.Math.Vector2(0, -6),
      lookRange: new Phaser.Math.Vector2(3.1, 3.8)
    };
    this.layoutBaseEyeTrackedCat(trackedCat, usesNyanArt);
    this.baseEyeTrackedCats.push(trackedCat);
    return trackedCat;
  }

  protected setEyeTrackedCatTexture(container: Phaser.GameObjects.Container, cosmetic: CosmeticOption) {
    const trackedCat = this.baseEyeTrackedCats.find((cat) => cat.container === container);
    if (!trackedCat) return;
    const usesNyanArt = cosmetic.style === 'nyan';
    trackedCat.base.setTexture(cosmetic.run1);
    const isLaunchCat = container.getData('role') === 'launchSelectedCat';
    container.setScale(isLaunchCat ? (usesNyanArt ? 1.28 : 1.14) : usesNyanArt ? 0.42 : 0.36);
    this.layoutBaseEyeTrackedCat(trackedCat, usesNyanArt);
  }

  protected updateBaseEyeTrackedCats() {
    const pointer = this.input.activePointer;
    const localPointer = new Phaser.Math.Vector2();

    for (const trackedCat of this.baseEyeTrackedCats) {
      if (!trackedCat.container.visible) continue;
      const matrix = trackedCat.container.getWorldTransformMatrix();
      matrix.applyInverse(pointer.x, pointer.y, localPointer);
      const angle = Phaser.Math.Angle.Between(trackedCat.lookOrigin.x, trackedCat.lookOrigin.y, localPointer.x, localPointer.y);
      const distance = Phaser.Math.Clamp(
        Phaser.Math.Distance.Between(trackedCat.lookOrigin.x, trackedCat.lookOrigin.y, localPointer.x, localPointer.y) / 44,
        0,
        1
      );
      const offsetX = Math.cos(angle) * trackedCat.lookRange.x * distance;
      const offsetY = Math.sin(angle) * trackedCat.lookRange.y * distance;
      trackedCat.pupils[0].setPosition(trackedCat.pupilAnchors[0].x + offsetX, trackedCat.pupilAnchors[0].y + offsetY);
      trackedCat.pupils[1].setPosition(trackedCat.pupilAnchors[1].x + offsetX, trackedCat.pupilAnchors[1].y + offsetY);
      trackedCat.shines[0].setPosition(trackedCat.shineAnchors[0].x + offsetX, trackedCat.shineAnchors[0].y + offsetY);
      trackedCat.shines[1].setPosition(trackedCat.shineAnchors[1].x + offsetX, trackedCat.shineAnchors[1].y + offsetY);
    }
  }

  private layoutBaseEyeTrackedCat(trackedCat: EyeTrackedCat, usesNyanArt: boolean) {
    trackedCat.eyes.setVisible(true);
    trackedCat.pupils.forEach((pupil) => pupil.setVisible(true));
    trackedCat.shines.forEach((shine) => shine.setVisible(true));

    if (usesNyanArt) {
      trackedCat.eyes.setPosition(33.5, 5).setScale(0.55, 0.9);
      trackedCat.pupilAnchors = [new Phaser.Math.Vector2(27, -1), new Phaser.Math.Vector2(40, -1)];
      trackedCat.shineAnchors = [new Phaser.Math.Vector2(26, -3.6), new Phaser.Math.Vector2(39, -3.6)];
      trackedCat.lookOrigin = new Phaser.Math.Vector2(33.5, -1);
      trackedCat.lookRange = new Phaser.Math.Vector2(1.8, 2.4);
      trackedCat.pupils.forEach((pupil) => pupil.setScale(0.58, 0.78));
      trackedCat.shines.forEach((shine) => shine.setScale(0.68));
      return;
    }

    trackedCat.eyes.setPosition(0, 0).setScale(1);
    trackedCat.pupilAnchors = [new Phaser.Math.Vector2(-12, -6), new Phaser.Math.Vector2(12, -6)];
    trackedCat.shineAnchors = [new Phaser.Math.Vector2(-14, -9), new Phaser.Math.Vector2(10, -9)];
    trackedCat.lookOrigin = new Phaser.Math.Vector2(0, -6);
    trackedCat.lookRange = new Phaser.Math.Vector2(3.1, 3.8);
    trackedCat.pupils.forEach((pupil) => pupil.setScale(1));
    trackedCat.shines.forEach((shine) => shine.setScale(1));
  }

  protected floatText(text: string, x: number, y: number, color = '#fff2a1') {
    const label = this.add.text(x, y, text, this.textStyle(18, color)).setOrigin(0.5).setDepth(1000);
    this.tweens.add({
      targets: label,
      y: y - 34,
      alpha: 0,
      duration: 520,
      ease: 'Sine.easeOut',
      onComplete: () => label.destroy()
    });
  }
}
