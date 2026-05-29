import Phaser from 'phaser';
import type { AccessoryOption, CosmeticOption, MouseOption, TrailOption } from '../data/cosmetics';
import { CosmeticService } from '../services/CosmeticService';
import { ShopRenderer } from '../ui/shop/ShopRenderer';
import { buildShopViewModel } from '../viewModels/buildShopViewModel';
import { BaseScene } from './BaseScene';

export class ShopScene extends BaseScene {
  private shopRenderer?: ShopRenderer;
  private returnTo = 'LaunchScene';
  private basketText?: Phaser.GameObjects.Text;

  constructor() {
    super('ShopScene');
  }

  init(data?: { returnTo?: string }) {
    this.returnTo = data?.returnTo ?? 'LaunchScene';
  }

  create() {
    this.applyMouseCursor();
    const overlay = this.createScreenOverlay(0x5e8be8);
    overlay.add(this.createPanel(-425, -244, 850, 486, 0x2d5fbd, 28));
    overlay.add(this.add.text(-350, -202, 'KITTY SHOP', this.textStyle(36, '#ffffff')).setOrigin(0, 0.5).setStroke('#17347e', 7));
    this.basketText = this.add.text(350, -202, '', { ...this.textStyle(18, '#dff7ff'), align: 'right' }).setOrigin(1, 0.5).setStroke('#17347e', 5);
    overlay.add(this.basketText);
    overlay.add(this.createUiButton(-350, 204, 120, 38, 'Back', 0xffd166, () => this.scene.start(this.returnTo)));

    this.shopRenderer = new ShopRenderer({
      scene: this,
      overlay,
      textStyle: (fontSize, color) => this.textStyle(fontSize, color),
      createEyeTrackedCat: (x, y, texture, scale, usesNyanArt) => this.createEyeTrackedCat(x, y, texture, scale, usesNyanArt).container,
      markPointerHandled: () => undefined,
      buyOrEquipCat: (option) => this.buyOrEquip('cat', option),
      buyOrEquipMouse: (option) => this.buyOrEquip('mouse', option),
      buyOrEquipTrail: (option) => this.buyOrEquip('trail', option),
      buyOrEquipAccessory: (option) => this.buyOrEquip('accessory', option),
      toggleCatGodMode: () => this.toggleCatGodMode(),
      isUnlocked: (kind, optionId) => CosmeticService.isUnlocked(kind, optionId),
      isSelected: (kind, optionId) => CosmeticService.isSelected(kind, optionId),
      isCatGodMode: () => CosmeticService.isCatGodMode(),
      updateRunLoadoutUi: () => undefined,
      updateSpeedUi: () => undefined,
      updateLevelUi: () => undefined,
      updateModeUi: () => undefined,
      updateAudioUi: () => undefined
    });
    this.shopRenderer.create();
    this.updateShop();

    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _objects: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => this.shopRenderer?.scrollBy(dy * 0.72));
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.shopRenderer?.startDrag(pointer));
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => this.shopRenderer?.dragTo(pointer));
    this.input.on('pointerup', () => this.shopRenderer?.endDrag());
  }

  update(_time: number, delta: number) {
    this.updateBaseEyeTrackedCats();
    this.shopRenderer?.updateSmoothScroll(delta, true);
  }

  private buyOrEquip(kind: 'cat', option: CosmeticOption): void;
  private buyOrEquip(kind: 'accessory', option: AccessoryOption): void;
  private buyOrEquip(kind: 'trail', option: TrailOption): void;
  private buyOrEquip(kind: 'mouse', option: MouseOption): void;
  private buyOrEquip(kind: 'cat' | 'accessory' | 'trail' | 'mouse', option: CosmeticOption | AccessoryOption | TrailOption | MouseOption) {
    const result = CosmeticService.buyOrEquip(kind, option);
    if (result.ok) {
      this.floatText(result.message, 480, 128);
      this.playUiSound(result.action === 'buy' ? 'buy' : 'equip');
      if (result.changedCursor) this.applyMouseCursor();
    } else {
      this.floatText(result.message, 480, 128);
      this.cameras.main.shake(90, 0.004);
      this.playUiSound('deny');
    }
    this.updateShop();
  }

  private toggleCatGodMode() {
    const enabled = CosmeticService.toggleCatGodMode();
    this.applyMouseCursor();
    this.floatText(enabled ? 'Cat God ON' : 'Cat God OFF', 480, 126);
    this.playUiSound('equip');
    this.updateShop();
  }

  private updateShop() {
    const viewModel = buildShopViewModel();
    this.basketText?.setText(`Yarn basket: ${viewModel.yarnBasket}`);
    this.shopRenderer?.update();
  }
}
