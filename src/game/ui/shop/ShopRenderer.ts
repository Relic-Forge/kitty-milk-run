import Phaser from 'phaser';
import { GAME_WIDTH } from '../../constants';
import {
  ACCESSORIES,
  ALL_COSMETICS,
  ALL_MOUSE_OPTIONS,
  TRAILS,
  type AccessoryOption,
  type CosmeticOption,
  type MouseOption,
  type TrailOption
} from '../../data/cosmetics';
import { CosmeticService } from '../../services/CosmeticService';

type VisibleGameObject = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible;

type ShopCard = {
  option: CosmeticOption | AccessoryOption | TrailOption | MouseOption;
  kind: 'cat' | 'accessory' | 'trail' | 'mouse';
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Graphics;
  statusText: Phaser.GameObjects.Text;
  priceText: Phaser.GameObjects.Text;
};

type CatGodButton = {
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Graphics;
  icon: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
};

type ShopSectionButton = {
  label: string;
  target: number;
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Graphics;
  text: Phaser.GameObjects.Text;
};

const SHOP_VIEWPORT = {
  top: -112,
  bottom: 132,
  height: 244,
  left: -230,
  width: 590
} as const;

const SHOP_CARD = {
  width: 132,
  height: 150,
  gap: 16,
  columns: 4
} as const;

export type ShopRendererConfig = {
  scene: Phaser.Scene;
  overlay: Phaser.GameObjects.Container;
  textStyle: (fontSize: number, color: string) => Phaser.Types.GameObjects.Text.TextStyle;
  createEyeTrackedCat: (x: number, y: number, texture: string, scale: number, usesNyanArt?: boolean) => Phaser.GameObjects.Container;
  markPointerHandled: () => void;
  buyOrEquipCat: (option: CosmeticOption) => void;
  buyOrEquipMouse: (option: MouseOption) => void;
  buyOrEquipTrail: (option: TrailOption) => void;
  buyOrEquipAccessory: (option: AccessoryOption) => void;
  toggleCatGodMode: () => void;
  updateRunLoadoutUi: () => void;
  updateSpeedUi: () => void;
  updateLevelUi: () => void;
  updateModeUi: () => void;
  updateAudioUi: () => void;
};

export class ShopRenderer {
  readonly elements: VisibleGameObject[] = [];
  private cards: ShopCard[] = [];
  private scrollContainer?: Phaser.GameObjects.Container;
  private scrollElements: VisibleGameObject[] = [];
  private scrollY = 0;
  private scrollTarget = 0;
  private contentHeight = 0;
  private scrollbarTrack?: Phaser.GameObjects.Graphics;
  private scrollbarThumb?: Phaser.GameObjects.Graphics;
  private dragStartY: number | undefined;
  private dragStartScroll = 0;
  private snapPoints: number[] = [0];
  private sectionTargets = new Map<string, number>();
  private sectionButtons: ShopSectionButton[] = [];
  private catGodButton?: CatGodButton;

  constructor(private readonly config: ShopRendererConfig) {}

  create() {
    this.cards = [];
    this.elements.length = 0;
    this.scrollElements = [];
    this.scrollY = 0;
    this.scrollTarget = 0;
    this.snapPoints = [0];
    this.sectionTargets = new Map();
    this.sectionButtons = [];
    this.scrollContainer = this.config.scene.add.container(0, SHOP_VIEWPORT.top);
    this.addElement(this.scrollContainer);

    let contentY = 18;
    contentY = this.createSection('Cats', ALL_COSMETICS, 'cat', contentY);
    contentY = this.createSection('Mouse', ALL_MOUSE_OPTIONS, 'mouse', contentY);
    contentY = this.createSection('Trails', TRAILS, 'trail', contentY);
    contentY = this.createSection('Accessories', ACCESSORIES, 'accessory', contentY);
    this.contentHeight = contentY + 18;
    const maxScroll = this.getMaxScroll();
    this.snapPoints = [...new Set(this.snapPoints.map((point) => Phaser.Math.Clamp(Math.round(point), 0, maxScroll)))].sort((a, b) => a - b);
    this.sectionTargets.forEach((target, label) => {
      this.sectionTargets.set(label, Phaser.Math.Clamp(Math.round(target), 0, maxScroll));
    });

    this.scrollbarTrack = this.config.scene.add.graphics();
    this.scrollbarThumb = this.config.scene.add.graphics();
    const navButtons = [
      this.createSectionButton('Cats', 'Cats', -76),
      this.createSectionButton('Mouse', 'Mouse', -35),
      this.createSectionButton('Trails', 'Trails', 6),
      this.createSectionButton('Accessories', 'Gear', 47)
    ];
    this.catGodButton = this.createCatGodButton(330, 204);
    [this.scrollbarTrack, this.scrollbarThumb, ...navButtons, this.catGodButton.container].forEach((element) => this.addElement(element));
    this.setScroll(0);
  }

  update() {
    for (const card of this.cards) {
      const unlocked = CosmeticService.isUnlocked(card.kind, card.option.id);
      const selected = CosmeticService.isSelected(card.kind, card.option.id);
      card.priceText.setText(card.option.cost === 0 ? 'Free' : `${card.option.cost} yarn`);
      card.statusText.setText(selected ? 'EQUIPPED' : unlocked ? 'EQUIP' : CosmeticService.isCatGodMode() ? 'EQUIP' : 'BUY');
      this.drawCard(card.background, selected, unlocked || CosmeticService.isCatGodMode());
    }
    this.drawCatGodButton(false);
    this.config.updateRunLoadoutUi();
    this.config.updateSpeedUi();
    this.config.updateLevelUi();
    this.config.updateModeUi();
    this.config.updateAudioUi();
  }

  scrollBy(amount: number) {
    if (this.snapPoints.length <= 1) {
      this.setScrollTarget(this.scrollTarget + amount);
      return;
    }
    const direction = Math.sign(amount);
    if (direction === 0) return;
    const current = this.scrollTarget;
    const nextPoint =
      direction > 0
        ? this.snapPoints.find((point) => point > current + 80) ?? this.snapPoints[this.snapPoints.length - 1]
        : [...this.snapPoints].reverse().find((point) => point < current - 80) ?? this.snapPoints[0];
    this.setScrollTarget(nextPoint);
  }

  startDrag(pointer: Phaser.Input.Pointer) {
    if (pointer.x < GAME_WIDTH / 2 + SHOP_VIEWPORT.left || pointer.x > GAME_WIDTH / 2 + SHOP_VIEWPORT.left + SHOP_VIEWPORT.width) return;
    this.dragStartY = pointer.y;
    this.dragStartScroll = this.scrollTarget;
  }

  dragTo(pointer: Phaser.Input.Pointer) {
    if (this.dragStartY === undefined || !pointer.isDown) return;
    this.setScrollTarget(this.dragStartScroll + (this.dragStartY - pointer.y) * 1.25);
  }

  endDrag() {
    if (this.dragStartY !== undefined) this.snapScrollTarget();
    this.dragStartY = undefined;
  }

  updateSmoothScroll(delta: number, visible: boolean) {
    if (!this.scrollContainer || !visible) return;
    if (this.getMaxScroll() <= 0) return;
    const ease = Math.min(1, delta / 110);
    this.scrollY += (this.scrollTarget - this.scrollY) * ease;
    if (Math.abs(this.scrollTarget - this.scrollY) < 0.4) this.scrollY = this.scrollTarget;
    this.scrollContainer.setY(SHOP_VIEWPORT.top - this.scrollY);
    this.updateScrollChrome();
    this.updateScrollVisibility();
  }

  private addElement<T extends VisibleGameObject>(element: T) {
    this.config.overlay.add(element);
    this.elements.push(element);
    return element;
  }

  private createSectionButton(label: string, shortLabel: string, y: number) {
    const target = this.sectionTargets.get(label) ?? 0;
    const container = this.config.scene.add.container(-350, y);
    const background = this.config.scene.add.graphics();
    const text = this.config.scene.add
      .text(0, 0, shortLabel, this.config.textStyle(shortLabel.length > 5 ? 12 : 13, '#ffffff'))
      .setOrigin(0.5)
      .setStroke('#17347e', 4);
    const clickZone = this.config.scene.add.zone(0, 0, 98, 38).setInteractive();
    container.add([background, text, clickZone]);
    clickZone.on('pointerdown', () => {
      this.config.markPointerHandled();
      this.setScrollTarget(target);
    });
    clickZone.on('pointerover', () => this.drawSectionButtons(label));
    clickZone.on('pointerout', () => this.drawSectionButtons());
    this.sectionButtons.push({ label, target, container, background, text });
    this.drawSectionButtons();
    return container;
  }

  private createSection(label: string, options: (CosmeticOption | AccessoryOption | TrailOption | MouseOption)[], kind: ShopCard['kind'], y: number) {
    this.sectionTargets.set(label, Math.max(0, y - 18));
    const labelText = this.config.scene.add
      .text(SHOP_VIEWPORT.left + 12, y, label, this.config.textStyle(19, '#fffad0'))
      .setOrigin(0, 0.5)
      .setStroke('#17347e', 4);
    labelText.setData('shopHalfHeight', 16);
    this.scrollContainer!.add(labelText);
    this.scrollElements.push(labelText);

    const columnWidth = SHOP_CARD.width + SHOP_CARD.gap;
    const rowStartX = SHOP_VIEWPORT.left + SHOP_CARD.width / 2 + 8;
    let row = 0;
    options.forEach((option, index) => {
      const column = index % SHOP_CARD.columns;
      row = Math.floor(index / SHOP_CARD.columns);
      const x = rowStartX + column * columnWidth;
      const cardY = y + 96 + row * (SHOP_CARD.height + 24);
      if (column === 0) this.snapPoints.push(Math.max(0, cardY - SHOP_CARD.height / 2 - 8));
      this.createCard(option, kind, x, cardY);
    });

    return y + 132 + (row + 1) * (SHOP_CARD.height + 24);
  }

  private createCard(option: CosmeticOption | AccessoryOption | TrailOption | MouseOption, kind: ShopCard['kind'], x: number, y: number) {
    const card = this.config.scene.add.container(x, y);
    const background = this.config.scene.add.graphics();
    const preview = this.createPreview(option, kind);
    const nameText = this.config.scene.add
      .text(0, 17, option.name, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: option.name.length > 20 ? '9px' : option.name.length > 15 ? '11px' : '13px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: SHOP_CARD.width - 24 },
        lineSpacing: -4
      })
      .setOrigin(0.5)
      .setStroke('#17347e', 3);
    const priceText = this.config.scene.add.text(0, 47, '', this.config.textStyle(12, '#fffad0')).setOrigin(0.5);
    const statusText = this.config.scene.add.text(0, 63, '', this.config.textStyle(11, '#ffffff')).setOrigin(0.5);
    const clickZone = this.config.scene.add.zone(0, 0, SHOP_CARD.width, SHOP_CARD.height).setInteractive();
    card.add([background, preview, nameText, priceText, statusText, clickZone]);
    card.setData('shopHalfHeight', SHOP_CARD.height / 2);
    clickZone.on('pointerdown', () => {
      this.config.markPointerHandled();
      if (kind === 'cat') this.config.buyOrEquipCat(option as CosmeticOption);
      if (kind === 'mouse') this.config.buyOrEquipMouse(option as MouseOption);
      if (kind === 'trail') this.config.buyOrEquipTrail(option as TrailOption);
      if (kind === 'accessory') this.config.buyOrEquipAccessory(option as AccessoryOption);
    });
    clickZone.on('pointerover', () => this.config.scene.tweens.add({ targets: card, scale: 1.035, duration: 90, ease: 'Sine.easeOut' }));
    clickZone.on('pointerout', () => this.config.scene.tweens.add({ targets: card, scale: 1, duration: 90, ease: 'Sine.easeOut' }));
    this.scrollContainer!.add(card);
    this.scrollElements.push(card);
    this.cards.push({ option, kind, container: card, background, statusText, priceText });
  }

  private createPreview(option: CosmeticOption | AccessoryOption | TrailOption | MouseOption, kind: ShopCard['kind']) {
    if (kind === 'cat') {
      const cosmetic = option as CosmeticOption;
      return this.config.createEyeTrackedCat(0, -31, cosmetic.run1, cosmetic.style === 'nyan' ? 0.82 : 0.68, cosmetic.style === 'nyan');
    }
    const scale = option.id === 'nyan-cat' ? 0.8 : kind === 'mouse' ? 1.12 : kind === 'trail' ? 0.92 : 0.62;
    const y = option.id === 'nyan-cat' ? -36 : kind === 'trail' ? -41 : -42;
    return this.config.scene.add.image(0, y, (option as AccessoryOption | TrailOption | MouseOption).asset).setScale(scale);
  }

  private createCatGodButton(x: number, y: number) {
    const button = this.config.scene.add.container(x, y);
    const background = this.config.scene.add.graphics();
    const icon = this.config.scene.add.graphics();
    const labelText = this.config.scene.add.text(30, -1, '', this.config.textStyle(13, '#ffffff')).setOrigin(0.5).setStroke('#17347e', 4);
    const clickZone = this.config.scene.add.zone(0, 0, 146, 38).setInteractive();
    button.add([background, icon, labelText, clickZone]);
    clickZone.on('pointerdown', () => {
      this.config.markPointerHandled();
      this.config.toggleCatGodMode();
    });
    clickZone.on('pointerover', () => this.drawCatGodButton(true));
    clickZone.on('pointerout', () => this.drawCatGodButton(false));
    const catGodButton = { container: button, background, icon, label: labelText };
    this.catGodButton = catGodButton;
    this.drawCatGodButton(false);
    return catGodButton;
  }

  private drawCatGodButton(hovered = false) {
    if (!this.catGodButton) return;
    const { background, icon, label } = this.catGodButton;
    const active = CosmeticService.isCatGodMode();
    background.clear();
    background.fillStyle(active ? 0x40d9a4 : 0x5a426f, hovered ? 1 : 0.96);
    background.fillRoundedRect(-73, -19, 146, 38, 14);
    background.lineStyle(hovered ? 5 : 4, active ? 0xfff06a : 0xffffff, active ? 1 : 0.84);
    background.strokeRoundedRect(-73, -19, 146, 38, 14);
    icon.clear();
    icon.fillStyle(active ? 0xffd166 : 0xcdb7a4, 1);
    icon.fillTriangle(-60, -7, -53, -18, -47, -7);
    icon.fillTriangle(-40, -7, -34, -18, -27, -7);
    icon.fillRoundedRect(-61, -8, 34, 27, 10);
    icon.fillStyle(active ? 0x2e6dff : 0x23436a, 1);
    icon.fillRect(-64, -9, 40, 7);
    icon.fillStyle(active ? 0xfff06a : 0x6b9bd8, 1);
    icon.fillTriangle(-64, -9, -53, -18, -42, -9);
    icon.fillStyle(active ? 0xffffff : 0xe9dcff, 1);
    icon.fillTriangle(-52, -9, -42, -18, -32, -9);
    icon.fillStyle(0x17347e, 1);
    icon.fillCircle(-51, 4, 2);
    icon.fillCircle(-38, 4, 2);
    icon.fillTriangle(-45, 8, -42, 8, -43.5, 11);
    icon.lineStyle(2, active ? 0xfff06a : 0x8ad6ff, 1);
    icon.lineBetween(-45, 20, -45, 28);
    icon.lineBetween(-51, 25, -39, 25);
    label.setText(active ? 'GOD ON' : 'GOD OFF');
  }

  private drawCard(graphics: Phaser.GameObjects.Graphics, selected: boolean, unlocked: boolean, blocked = false) {
    graphics.clear();
    graphics.fillStyle(blocked ? 0x4c5b7a : selected ? 0x53d36d : unlocked ? 0x276fbf : 0x17347e, 0.96);
    graphics.fillRoundedRect(-SHOP_CARD.width / 2, -SHOP_CARD.height / 2, SHOP_CARD.width, SHOP_CARD.height, 14);
    graphics.lineStyle(selected ? 6 : 4, selected ? 0xfff06a : 0xffffff, selected ? 1 : 0.82);
    graphics.strokeRoundedRect(-SHOP_CARD.width / 2, -SHOP_CARD.height / 2, SHOP_CARD.width, SHOP_CARD.height, 14);
    graphics.fillStyle(0xffffff, 0.16);
    graphics.fillRoundedRect(-SHOP_CARD.width / 2 + 10, -SHOP_CARD.height / 2 + 8, SHOP_CARD.width - 20, 72, 12);
  }

  private setScroll(value: number) {
    this.scrollY = Phaser.Math.Clamp(value, 0, this.getMaxScroll());
    this.scrollTarget = this.scrollY;
    if (this.scrollContainer) this.scrollContainer.setY(SHOP_VIEWPORT.top - this.scrollY);
    this.updateScrollChrome();
    this.updateScrollVisibility();
  }

  private setScrollTarget(value: number) {
    this.scrollTarget = Phaser.Math.Clamp(value, 0, this.getMaxScroll());
  }

  private snapScrollTarget() {
    if (this.snapPoints.length === 0) return;
    const nearest = this.snapPoints.reduce((best, point) => {
      return Math.abs(point - this.scrollTarget) < Math.abs(best - this.scrollTarget) ? point : best;
    }, this.snapPoints[0]);
    this.setScrollTarget(nearest);
  }

  private updateScrollChrome() {
    if (!this.scrollbarTrack || !this.scrollbarThumb) return;
    const maxScroll = this.getMaxScroll();
    const trackX = SHOP_VIEWPORT.left + SHOP_VIEWPORT.width + 10;
    const trackTop = SHOP_VIEWPORT.top + 8;
    const trackHeight = SHOP_VIEWPORT.height - 16;
    this.scrollbarTrack.clear();
    this.scrollbarTrack.fillStyle(0x17347e, 0.7);
    this.scrollbarTrack.fillRoundedRect(trackX, trackTop, 8, trackHeight, 4);
    this.scrollbarTrack.fillStyle(0xffffff, 0.35);
    this.scrollbarTrack.fillTriangle(trackX + 4, trackTop - 10, trackX - 2, trackTop, trackX + 10, trackTop);
    this.scrollbarTrack.fillTriangle(trackX + 4, trackTop + trackHeight + 10, trackX - 2, trackTop + trackHeight, trackX + 10, trackTop + trackHeight);

    const thumbHeight = Math.max(36, (SHOP_VIEWPORT.height / Math.max(this.contentHeight, SHOP_VIEWPORT.height)) * trackHeight);
    const thumbY = maxScroll === 0 ? trackTop : trackTop + (this.scrollY / maxScroll) * (trackHeight - thumbHeight);
    this.scrollbarThumb.clear();
    this.scrollbarThumb.fillStyle(0xfff06a, 1);
    this.scrollbarThumb.fillRoundedRect(trackX - 3, thumbY, 14, thumbHeight, 7);
    this.scrollbarThumb.lineStyle(2, 0xffffff, 0.9);
    this.scrollbarThumb.strokeRoundedRect(trackX - 3, thumbY, 14, thumbHeight, 7);
    this.drawSectionButtons();
  }

  private drawSectionButtons(hoverLabel?: string) {
    if (this.sectionButtons.length === 0) return;
    const active = this.sectionButtons.reduce((best, button) => {
      return Math.abs(button.target - this.scrollTarget) < Math.abs(best.target - this.scrollTarget) ? button : best;
    }, this.sectionButtons[0]);
    for (const button of this.sectionButtons) {
      const selected = button.label === active.label;
      const hovered = button.label === hoverLabel;
      button.background.clear();
      button.background.fillStyle(selected ? 0x53d36d : hovered ? 0x276fbf : 0x17347e, selected ? 0.98 : 0.9);
      button.background.fillRoundedRect(-49, -19, 98, 38, 13);
      button.background.lineStyle(selected ? 5 : 3, selected ? 0xfff06a : 0xffffff, selected ? 1 : 0.78);
      button.background.strokeRoundedRect(-49, -19, 98, 38, 13);
      button.text.setColor('#ffffff');
    }
  }

  private updateScrollVisibility() {
    const visibleTop = this.scrollY;
    const visibleBottom = this.scrollY + SHOP_VIEWPORT.height;
    this.scrollElements.forEach((element) => {
      const halfHeight = (element.getData('shopHalfHeight') as number | undefined) ?? 0;
      element.setVisible(element.y - halfHeight >= visibleTop && element.y + halfHeight <= visibleBottom);
    });
  }

  private getMaxScroll() {
    return Math.max(0, this.contentHeight - SHOP_VIEWPORT.height);
  }
}
