import Phaser from 'phaser';
import { ASSETS } from '../../assets';
import { UiCard } from '../core/UiCard';
import { UiFooterActions } from '../core/UiFooterActions';
import { UiFrame } from '../core/UiFrame';
import type { buildLaunchViewModel } from '../../viewModels/buildLaunchViewModel';

export type LaunchViewModel = ReturnType<typeof buildLaunchViewModel>;

export type LaunchRendererActions = {
  onStartRun: () => void;
  onOpenMap: () => void;
  onOpenShop: () => void;
  onCycleSpeed: () => void;
};

export type LaunchScreenRendererConfig = {
  scene: Phaser.Scene;
  textStyle: (fontSize: number, color: string) => Phaser.Types.GameObjects.Text.TextStyle;
  createEyeTrackedCat: (x: number, y: number, texture: string, scale: number, usesNyanArt?: boolean) => Phaser.GameObjects.Container;
};

export class LaunchScreenRenderer {
  readonly elements: Phaser.GameObjects.GameObject[] = [];
  private speedText?: Phaser.GameObjects.Text;
  private speedBackground?: Phaser.GameObjects.Graphics;
  private speedYarn?: Phaser.GameObjects.Image;
  private cat?: Phaser.GameObjects.Container;
  private titleText?: Phaser.GameObjects.Text;
  private selectedTitle?: Phaser.GameObjects.Text;
  private bodyText?: Phaser.GameObjects.Text;
  private milkBottleCharacter?: Phaser.GameObjects.Graphics;
  private milkTotalText?: Phaser.GameObjects.Text;

  constructor(
    private readonly config: LaunchScreenRendererConfig,
    private readonly actions: LaunchRendererActions
  ) {}

  create(viewModel: LaunchViewModel) {
    const { scene, textStyle } = this.config;
    const frame = new UiFrame(scene, { fill: 0x5e8be8, panelFill: 0x2d5fbd });
    this.elements.push(frame.container);

    const title = scene.add
      .text(0, -203, 'KITTY MILK RUN', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '42px',
        color: '#ffffff',
        align: 'center'
      })
      .setOrigin(0.5)
      .setStroke('#17347e', 8);
    frame.container.add(title);

    this.milkBottleCharacter = scene.add.graphics();
    this.milkTotalText = scene.add.text(386, -146, '', textStyle(12, '#fffad0')).setOrigin(0.5).setStroke('#17347e', 4);
    frame.container.add([this.milkBottleCharacter, this.milkTotalText]);

    const hero = scene.add.graphics();
    hero.fillStyle(0xffefba, 0.96);
    hero.fillRoundedRect(-300, -150, 600, 128, 20);
    hero.lineStyle(4, 0xffffff, 0.84);
    hero.strokeRoundedRect(-300, -150, 600, 128, 20);
    hero.fillStyle(0xc98248, 1);
    hero.fillRoundedRect(-262, -64, 524, 24, 10);
    hero.fillStyle(0x9b5734, 0.42);
    hero.fillRoundedRect(-246, -57, 492, 6, 3);
    frame.container.add(hero);

    frame.container.add([this.createPixelMilkBowlCharm(scene, -174, -86).setScale(0.62), this.createPixelFishCharm(scene, 174, -91).setScale(0.62)]);

    this.cat = this.config.createEyeTrackedCat(0, -91, viewModel.selectedCat.texture, viewModel.selectedCat.usesNyanArt ? 1.28 : 1.14, viewModel.selectedCat.usesNyanArt);
    this.cat.setData('role', 'launchSelectedCat');
    frame.container.add(this.cat);

    const card = new UiCard(scene, 0, 64, 600, 118, { selected: true });
    this.titleText = scene.add.text(-270, 36, '', textStyle(13, '#fffad0')).setOrigin(0, 0.5).setStroke('#17347e', 4);
    this.selectedTitle = scene.add.text(-270, 64, '', textStyle(26, '#ffffff')).setOrigin(0, 0.5).setStroke('#17347e', 5);
    this.bodyText = scene.add.text(-270, 101, '', { ...textStyle(15, '#dff7ff'), wordWrap: { width: 532 }, lineSpacing: 4 }).setOrigin(0, 0.5).setStroke('#17347e', 3);
    frame.container.add([card.container, this.titleText, this.selectedTitle, this.bodyText]);

    frame.container.add(
      new UiFooterActions(
        scene,
        164,
        [
          { label: 'START RUN', color: 0x53d36d, onClick: this.actions.onStartRun },
          { label: 'MILK MAP', color: 0xffd166, onClick: this.actions.onOpenMap },
          { label: 'SHOP', color: 0xff7aa8, onClick: this.actions.onOpenShop }
        ],
        textStyle
      ).container
    );

    this.speedText = scene.add.text(12, 0, '', textStyle(12, '#fffad0')).setOrigin(0.5).setStroke('#17347e', 3);
    const speedButton = scene.add.container(0, 151);
    this.speedBackground = scene.add.graphics();
    this.speedYarn = scene.add.image(-70, 0, ASSETS.yarnBlue).setScale(0.3);
    const zone = scene.add.zone(0, 0, 174, 30).setInteractive();
    speedButton.setY(224);
    zone.on('pointerup', this.actions.onCycleSpeed);
    zone.on('pointerover', () => scene.tweens.add({ targets: speedButton, y: 220, duration: 90, ease: 'Sine.easeOut' }));
    zone.on('pointerout', () => scene.tweens.add({ targets: speedButton, y: 224, duration: 90, ease: 'Sine.easeOut' }));
    speedButton.add([this.speedBackground, this.speedYarn, this.speedText, zone]);
    frame.container.add(speedButton);

    this.update(viewModel);
  }

  update(viewModel: LaunchViewModel) {
    this.milkTotalText?.setText(`${viewModel.totalMilk}/${viewModel.mapMilkGoal}`);
    if (this.milkBottleCharacter) this.drawMilkBottleCharacter(this.milkBottleCharacter, viewModel.totalMilk, viewModel.mapMilkGoal);
    this.speedText?.setText(`${viewModel.speedLabel} ▼`);
    this.drawSpeedButton(viewModel);
    this.titleText?.setText('CURRENT RUN');
    this.selectedTitle?.setText(viewModel.currentNode.displayName);
    this.bodyText?.setText(`${viewModel.world.displayName} - Level ${viewModel.currentNode.nodeType === 'bonus' ? 'Bonus' : viewModel.currentNode.id.slice(-2)}\nBottles: ${viewModel.currentBottleRating}`);
  }

  private drawMilkBottleCharacter(graphics: Phaser.GameObjects.Graphics, totalMilk: number, mapMilkGoal: number) {
    const x = 340;
    const y = -231;
    const fillHeight = Math.round(Phaser.Math.Clamp(totalMilk / Math.max(1, mapMilkGoal), 0, 1) * 42);
    graphics.clear();
    graphics.fillStyle(0xff7aa8, 1);
    graphics.fillRect(x + 32, y - 2, 28, 8);
    graphics.fillStyle(0x17347e, 1);
    graphics.fillRect(x + 26, y + 6, 40, 8);
    graphics.fillRect(x + 18, y + 14, 56, 56);

    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(x + 34, y + 2, 24, 8);
    graphics.fillRect(x + 28, y + 10, 36, 8);
    graphics.fillRect(x + 22, y + 18, 48, 48);

    graphics.fillStyle(0xeef9ff, 1);
    graphics.fillRect(x + 28, y + 24, 36, 36);
    graphics.fillStyle(0xbfefff, 1);
    graphics.fillRect(x + 28, y + 60 - fillHeight, 36, fillHeight);
    graphics.fillStyle(0x63c6ff, 1);
    graphics.fillRect(x + 28, y + 60 - fillHeight, 36, Math.min(4, fillHeight));

    graphics.fillStyle(0x17347e, 1);
    graphics.fillRect(x + 35, y + 36, 6, 12);
    graphics.fillRect(x + 51, y + 36, 6, 12);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(x + 37, y + 38, 2, 3);
    graphics.fillRect(x + 53, y + 38, 2, 3);
    graphics.fillStyle(0xff9bc4, 1);
    graphics.fillRect(x + 28, y + 49, 8, 5);
    graphics.fillRect(x + 56, y + 49, 8, 5);
    graphics.fillStyle(0x17347e, 1);
    graphics.fillRect(x + 43, y + 53, 6, 3);

    graphics.lineStyle(3, 0xffffff, 1);
    graphics.strokeRect(x + 34, y + 2, 24, 8);
    graphics.strokeRect(x + 28, y + 10, 36, 8);
    graphics.strokeRect(x + 22, y + 18, 48, 48);
  }

  private createPixelMilkBowlCharm(scene: Phaser.Scene, x: number, y: number) {
    const charm = scene.add.container(x, y);
    const shadow = scene.add.graphics();
    shadow.fillStyle(0x9b5734, 0.24);
    shadow.fillRect(-34, 28, 68, 8);
    const bowl = scene.add.graphics();
    bowl.fillStyle(0xffffff, 1);
    bowl.fillRect(-32, -6, 64, 16);
    bowl.fillRect(-24, 10, 48, 16);
    bowl.fillRect(-16, 26, 32, 8);
    bowl.fillStyle(0xdff7ff, 1);
    bowl.fillRect(-24, -14, 48, 10);
    bowl.fillRect(-16, -20, 32, 6);
    bowl.fillStyle(0x8ad6ff, 1);
    bowl.fillRect(-18, -10, 36, 6);
    bowl.fillStyle(0x63c6ff, 1);
    bowl.fillRect(-24, 10, 48, 6);
    bowl.fillStyle(0x17347e, 1);
    bowl.fillRect(-34, -2, 4, 12);
    bowl.fillRect(30, -2, 4, 12);
    bowl.fillRect(-22, 26, 44, 4);
    bowl.fillStyle(0xff9bc4, 1);
    bowl.fillRect(-10, 12, 20, 8);
    bowl.fillStyle(0xffffff, 1);
    bowl.fillRect(-2, 14, 4, 4);
    const sparkle = scene.add.graphics();
    sparkle.fillStyle(0xffefba, 1);
    sparkle.fillRect(34, -26, 6, 18);
    sparkle.fillRect(28, -20, 18, 6);
    sparkle.fillRect(-42, -16, 4, 12);
    sparkle.fillRect(-46, -12, 12, 4);
    charm.add([shadow, bowl, sparkle]);
    return charm;
  }

  private createPixelFishCharm(scene: Phaser.Scene, x: number, y: number) {
    const charm = scene.add.container(x, y);
    const shadow = scene.add.graphics();
    shadow.fillStyle(0x9b5734, 0.24);
    shadow.fillRect(-32, 36, 64, 8);
    const fish = scene.add.graphics();
    fish.fillStyle(0x63c6ff, 1);
    fish.fillRect(-24, -12, 40, 32);
    fish.fillRect(-16, -20, 24, 48);
    fish.fillStyle(0xbfefff, 1);
    fish.fillRect(-16, -4, 24, 16);
    fish.fillStyle(0xffd166, 1);
    fish.fillRect(16, -12, 16, 12);
    fish.fillRect(16, 8, 16, 12);
    fish.fillRect(32, -4, 8, 16);
    fish.fillStyle(0x17347e, 1);
    fish.fillRect(-18, -8, 6, 6);
    fish.fillStyle(0xffffff, 1);
    fish.fillRect(-16, -8, 2, 2);
    fish.fillStyle(0xff9bc4, 1);
    fish.fillRect(-26, 8, 8, 6);
    fish.fillStyle(0x2e6dff, 1);
    fish.fillRect(-8, -20, 16, 6);
    fish.fillRect(-8, 22, 16, 6);
    const paw = scene.add.graphics();
    paw.fillStyle(0xfff1f7, 1);
    paw.fillRect(-2, -38, 12, 12);
    paw.fillRect(-18, -30, 10, 10);
    paw.fillRect(16, -30, 10, 10);
    paw.fillRect(-10, -22, 28, 14);
    charm.add([shadow, fish, paw]);
    return charm;
  }

  private drawSpeedButton(viewModel: LaunchViewModel) {
    const option = viewModel.speedOption;
    if (!this.speedBackground || !this.speedYarn) return;
    this.speedBackground.clear();
    this.speedBackground.fillStyle(option.tint, 0.96);
    this.speedBackground.fillRoundedRect(-87, -15, 174, 30, 11);
    this.speedBackground.lineStyle(5, 0xfff06a, 1);
    this.speedBackground.strokeRoundedRect(-87, -15, 174, 30, 11);
    this.speedBackground.fillStyle(0xffffff, 0.34);
    this.speedBackground.fillCircle(-70, 0, 11);
    this.speedYarn.setScale(0.34);
    this.speedYarn.setTint(option.tint);
    const spinDuration = Math.round(1800 / option.multiplier);
    const activeSpinDuration = this.speedYarn.getData('spinDuration') as number | undefined;
    if (activeSpinDuration !== spinDuration) {
      this.config.scene.tweens.killTweensOf(this.speedYarn);
      this.speedYarn.setData('spinDuration', spinDuration);
      this.config.scene.tweens.add({
        targets: this.speedYarn,
        angle: 360,
        duration: spinDuration,
        repeat: -1,
        ease: 'Linear'
      });
    }
  }
}
