import { PixelButton } from '../components/PixelButton';
import Phaser from 'phaser';
import { ASSETS } from '../../assets';
import { UiCard } from '../core/UiCard';
import { UiFooterActions } from '../core/UiFooterActions';
import type { buildLaunchViewModel } from '../../viewModels/buildLaunchViewModel';

export type LaunchViewModel = ReturnType<typeof buildLaunchViewModel>;

export type LaunchRendererActions = {
  onStartRun: () => void;
  onOpenMap: () => void;
  onOpenShop: () => void;
  onCycleSpeed: () => void;
  onSound: () => void;
  onVolume: () => void;
};

export type LaunchScreenRendererConfig = {
  scene: Phaser.Scene;
  textStyle: (fontSize: number, color: string) => Phaser.Types.GameObjects.Text.TextStyle;
  createEyeTrackedCat: (x: number, y: number, texture: string, scale: number, usesNyanArt?: boolean) => Phaser.GameObjects.Container;
};

export class LaunchScreenRenderer {
  readonly elements: Phaser.GameObjects.GameObject[] = [];
  private sound?: PixelButton;
  private volume?: PixelButton;
  private speedText?: Phaser.GameObjects.Text;
  private speedBackground?: Phaser.GameObjects.Graphics;
  private speedYarn?: Phaser.GameObjects.Image;
  private cat?: Phaser.GameObjects.Container;
  private titleText?: Phaser.GameObjects.Text;
  private selectedTitle?: Phaser.GameObjects.Text;
  private bodyText?: Phaser.GameObjects.Text;

  constructor(
    private readonly config: LaunchScreenRendererConfig,
    private readonly actions: LaunchRendererActions
  ) {}

  create(viewModel: LaunchViewModel) {
    const { scene, textStyle } = this.config;
    const stage = scene.add.container(480, 270);
    this.elements.push(stage);
    stage.add(scene.add.image(0, 0, viewModel.world.id).setDisplaySize(960, 540));

    const title = scene.add
      .text(0, -203, 'KITTY MILK RUN', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '42px',
        color: '#ffffff',
        align: 'center'
      })
      .setOrigin(0.5)
      .setStroke('#17347e', 8);
    stage.add(title);

    stage.add(scene.add.ellipse(0, -39, 134, 18, 0x4f3449, 0.25));

    this.cat = this.config.createEyeTrackedCat(0, -91, viewModel.selectedCat.texture, viewModel.selectedCat.usesNyanArt ? 1.28 : 1.14, viewModel.selectedCat.usesNyanArt);
    this.cat.setData('role', 'launchSelectedCat');
    stage.add(this.cat);

    const card = new UiCard(scene, 0, 64, 600, 118);
    this.titleText = scene.add.text(-270, 36, '', textStyle(13, '#fffad0')).setOrigin(0, 0.5).setStroke('#17347e', 4);
    this.selectedTitle = scene.add.text(-270, 64, '', textStyle(26, '#ffffff')).setOrigin(0, 0.5).setStroke('#17347e', 5);
    this.bodyText = scene.add.text(-270, 101, '', { ...textStyle(15, '#dff7ff'), wordWrap: { width: 532 }, lineSpacing: 4 }).setOrigin(0, 0.5).setStroke('#17347e', 3);
    stage.add([card.container, this.titleText, this.selectedTitle, this.bodyText]);

    stage.add(
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
    stage.add(speedButton);

    const audioButton = (x: number, action: () => void) => new PixelButton({
      scene, textStyle, x, y: 224, width: 144, height: 30, fontSize: 13,
      label: '', color: 0x59405c, onClick: action
    });
    this.sound = audioButton(-190, this.actions.onSound);
    this.volume = audioButton(190, this.actions.onVolume);
    stage.add([this.sound.container, this.volume.container]);
    this.update(viewModel);
  }

  update(viewModel: LaunchViewModel) {
    this.sound?.setLabel(viewModel.soundEnabled ? 'Sound FX on' : 'Sound FX off');
    this.volume?.setLabel(`Volume ${Math.round(viewModel.volume * 100)}%`);
    this.speedText?.setText(`Speed  ·  ${viewModel.speedLabel}`);
    this.drawSpeedButton(viewModel);
    this.titleText?.setText('NEXT RUN');
    this.selectedTitle?.setText(viewModel.currentNode.displayName);
    this.bodyText?.setText(`${viewModel.world.displayName} - Level ${viewModel.currentNode.nodeType === 'bonus' ? 'Bonus' : viewModel.currentNode.id.slice(-2)}\nBottles: ${viewModel.currentBottleRating}`);
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
