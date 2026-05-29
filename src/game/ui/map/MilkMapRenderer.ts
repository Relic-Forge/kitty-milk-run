import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../constants';
import type { CosmeticOption } from '../../data/cosmetics';
import { ProgressService } from '../../services/ProgressService';
import { MAP_NODES, WORLDS, getWorldForNode, type MapNode } from '../../worldMap';

type VisibleGameObject = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible;

type MapNodeButton = {
  node: MapNode;
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Graphics;
  rating: Phaser.GameObjects.Graphics;
  labelText: Phaser.GameObjects.Text;
};

export type MilkMapRendererConfig = {
  scene: Phaser.Scene;
  overlay: Phaser.GameObjects.Container;
  textStyle: (fontSize: number, color: string) => Phaser.Types.GameObjects.Text.TextStyle;
  createEyeTrackedCat: (x: number, y: number, texture: string, scale: number, usesNyanArt?: boolean) => Phaser.GameObjects.Container;
  setEyeTrackedCatTexture: (container: Phaser.GameObjects.Container, cosmetic: CosmeticOption) => void;
  createOverlayButton: (x: number, y: number, width: number, height: number, label: string, color: number, onClick: () => void) => Phaser.GameObjects.Container;
  getSelectedCosmetic: () => CosmeticOption;
  getSelectedMapNode: () => MapNode;
  getSelectedMapNodeId: () => string;
  getTotalMilk: () => number;
  getMapMilkGoal: () => number;
  getBottlesForNode: (nodeId: string) => number;
  getMapCardBody: (node: MapNode) => string;
  isMapNodeUnlocked: (node: MapNode) => boolean;
  isMapNodePlayable: (node: MapNode) => boolean;
  getMapInputReadyAt: () => number;
  isPointerHandled: () => boolean;
  getOverlayMode: () => string;
  selectMapNode: (nodeId: string) => void;
  startGame: () => void;
  showShop: () => void;
  showLaunch: () => void;
};

export class MilkMapRenderer {
  readonly elements: VisibleGameObject[] = [];
  private readonly mapCardElements: VisibleGameObject[] = [];
  private mapAtlasElements: VisibleGameObject[] = [];
  private mapNodeButtons: MapNodeButton[] = [];
  private mapCatAvatar?: Phaser.GameObjects.Image;

  constructor(private readonly config: MilkMapRendererConfig) {}

  create() {
    this.elements.length = 0;
    this.mapNodeButtons = [];
    this.mapCardElements.length = 0;

    const hud = this.config.scene.add.graphics();
    hud.fillStyle(0x17347e, 0.86);
    hud.fillRoundedRect(-386, -184, 772, 40, 14);
    hud.lineStyle(3, 0xffffff, 0.78);
    hud.strokeRoundedRect(-386, -184, 772, 40, 14);
    this.addElement(hud);

    const milkText = this.config.scene.add
      .text(232, -164, `Milk bottles: ${this.config.getTotalMilk()}/${this.config.getMapMilkGoal()}`, this.config.textStyle(17, '#fffad0'))
      .setOrigin(0.5)
      .setStroke('#17347e', 4);
    milkText.setData('role', 'mapMilkTotal');
    this.addElement(milkText);

    const cosmetic = this.config.getSelectedCosmetic();
    const selectedCat = this.config.createEyeTrackedCat(-338, -164, cosmetic.run1, cosmetic.style === 'nyan' ? 0.42 : 0.36, cosmetic.style === 'nyan');
    selectedCat.setData('role', 'selectedCat');
    this.addElement(selectedCat);

    this.addElement(this.config.createOverlayButton(320, 202, 112, 36, 'Shop', 0xffd166, this.config.showShop));
    this.addElement(this.config.createOverlayButton(320, 158, 112, 36, 'Back', 0xff7aa8, this.config.showLaunch));

    this.createAtlasPage();
    this.mapCatAvatar = this.config.scene.add.image(0, 0, cosmetic.run1).setScale(0.26);
    this.addElement(this.mapCatAvatar);
    this.createPreviewCard();
    this.update();
  }

  createAtlasPage() {
    for (const element of this.mapAtlasElements) {
      Phaser.Utils.Array.Remove(this.elements, element);
      element.destroy();
    }
    this.mapAtlasElements = [];
    this.mapNodeButtons = [];

    this.createWorldBands();
    this.createConnections();
    this.createNodes();
  }

  update() {
    const selectedNode = this.config.getSelectedMapNode();
    const totalMilk = this.config.getTotalMilk();
    for (const element of this.elements) {
      const role = element.getData('role') as string | undefined;
      if (role === 'mapMilkTotal') {
        (element as Phaser.GameObjects.Text).setText(`Milk bottles: ${totalMilk}/${this.config.getMapMilkGoal()}`);
      } else if (role === 'selectedCat') {
        this.config.setEyeTrackedCatTexture(element as Phaser.GameObjects.Container, this.config.getSelectedCosmetic());
      } else if (role === 'mapCardTitle') {
        (element as Phaser.GameObjects.Text).setText(selectedNode.displayName);
      } else if (role === 'mapCardBody') {
        (element as Phaser.GameObjects.Text).setText(this.config.getMapCardBody(selectedNode));
      } else if (role === 'mapPlayButton') {
        element.setVisible(this.config.getOverlayMode() === 'map' && this.config.isMapNodePlayable(selectedNode));
      }
    }

    if (this.mapCatAvatar) {
      const cosmetic = this.config.getSelectedCosmetic();
      this.mapCatAvatar
        .setTexture(cosmetic.run1)
        .setPosition(selectedNode.x - GAME_WIDTH / 2, selectedNode.y - GAME_HEIGHT / 2 - 22)
        .setScale(cosmetic.style === 'nyan' ? 0.24 : 0.26)
        .setVisible(this.config.getOverlayMode() === 'map' && this.config.isMapNodePlayable(selectedNode));
    }

    for (const button of this.mapNodeButtons) {
      this.drawNodeButton(button);
    }
  }

  private addElement<T extends VisibleGameObject>(element: T) {
    this.config.overlay.add(element);
    this.elements.push(element);
    return element;
  }

  private addAtlasElement<T extends VisibleGameObject>(element: T) {
    this.addElement(element);
    this.mapAtlasElements.push(element);
    return element;
  }

  private getActiveWorld() {
    return getWorldForNode(this.config.getSelectedMapNode());
  }

  private getWorldNodeList(worldId: string) {
    return MAP_NODES.filter((node) => node.worldId === worldId);
  }

  private createWorldBands() {
    const world = this.getActiveWorld();
    const worldIndex = WORLDS.findIndex((candidate) => candidate.id === world.id);
    const previousWorld = WORLDS[worldIndex - 1];
    const nextWorld = WORLDS[worldIndex + 1];
    const activeNodes = this.getWorldNodeList(world.id);
    const earnedInWorld = activeNodes.reduce((total, node) => total + ProgressService.getBottlesForNode(node.id), 0);
    const possibleInWorld = activeNodes.filter((node) => node.nodeType !== 'gate').length * 3;

    const band = this.config.scene.add.graphics();
    band.fillStyle(Phaser.Display.Color.HexStringToColor(world.palette.background).color, 0.96);
    band.fillRoundedRect(-324, -132, 648, 270, 22);
    band.lineStyle(5, world.palette.pathEdge, 0.84);
    band.strokeRoundedRect(-324, -132, 648, 270, 22);
    band.fillStyle(world.palette.band, 0.28);
    for (let y = -108; y < 128; y += 42) band.fillRoundedRect(-292, y, 584, 18, 9);
    band.fillStyle(0xffffff, 0.2);
    band.fillCircle(-250, -72, 42);
    band.fillCircle(248, 72, 50);
    this.addAtlasElement(band);

    this.addAtlasElement(this.config.scene.add.text(-294, -116, world.atlasLabel, { ...this.config.textStyle(11, '#17347e'), align: 'left' }).setOrigin(0, 0.5));
    this.addAtlasElement(
      this.config.scene.add
        .text(0, -92, world.displayName, { ...this.config.textStyle(25, '#ffffff'), align: 'center', wordWrap: { width: 420 } })
        .setOrigin(0.5)
        .setStroke('#17347e', 5)
    );
    this.addAtlasElement(
      this.config.scene.add
        .text(0, 120, `${world.mapSkin.pathName} - ${earnedInWorld}/${possibleInWorld} milk here`, {
          ...this.config.textStyle(12, '#17347e'),
          align: 'center',
          wordWrap: { width: 420 }
        })
        .setOrigin(0.5)
    );

    if (previousWorld) {
      this.createWorldPeek(-366, -4, previousWorld.shortName, 'Prev', previousWorld.palette.background, () =>
        this.config.selectMapNode(this.getWorldNodeList(previousWorld.id)[0]?.id ?? this.config.getSelectedMapNodeId())
      );
    }
    if (nextWorld) {
      this.createWorldPeek(-366 * -1, -4, nextWorld.shortName, 'Next', nextWorld.palette.background, () =>
        this.config.selectMapNode(this.getWorldNodeList(nextWorld.id)[0]?.id ?? this.config.getSelectedMapNodeId())
      );
    }

    this.addAtlasElement(
      this.config.scene.add
        .text(0, 138, nextWorld ? `Next: ${nextWorld.displayName}` : 'Atlas edge: more worlds can grow beyond this page.', {
          ...this.config.textStyle(11, '#fffad0'),
          align: 'center',
          wordWrap: { width: 420 }
        })
        .setOrigin(0.5)
        .setStroke('#17347e', 3)
    );
  }

  private createWorldPeek(x: number, y: number, label: string, eyebrow: string, backgroundColor: string, onClick: () => void) {
    const color = Phaser.Display.Color.HexStringToColor(backgroundColor).color;
    const peek = this.config.scene.add.container(x, y);
    const bg = this.config.scene.add.graphics();
    bg.fillStyle(color, 0.92);
    bg.fillRoundedRect(-52, -70, 104, 140, 16);
    bg.lineStyle(3, 0xffffff, 0.75);
    bg.strokeRoundedRect(-52, -70, 104, 140, 16);
    const eyebrowText = this.config.scene.add.text(0, -38, eyebrow, this.config.textStyle(11, '#17347e')).setOrigin(0.5);
    const labelText = this.config.scene.add
      .text(0, 8, label, { ...this.config.textStyle(13, '#ffffff'), align: 'center', wordWrap: { width: 82 } })
      .setOrigin(0.5)
      .setStroke('#17347e', 4);
    const zone = this.config.scene.add.zone(0, 0, 104, 140).setInteractive();
    peek.add([bg, eyebrowText, labelText, zone]);
    zone.on('pointerup', () => {
      if (this.config.scene.time.now < this.config.getMapInputReadyAt()) return;
      onClick();
    });
    zone.on('pointerover', () => this.config.scene.tweens.add({ targets: peek, scale: 1.05, duration: 90, ease: 'Sine.easeOut' }));
    zone.on('pointerout', () => this.config.scene.tweens.add({ targets: peek, scale: 1, duration: 90, ease: 'Sine.easeOut' }));
    this.addAtlasElement(peek);
  }

  private createConnections() {
    const activeWorldId = this.getActiveWorld().id;
    const activeNodes = this.getWorldNodeList(activeWorldId);
    activeNodes.forEach((to) => {
      const previousNodeId = to.unlock.previousNodeId;
      if (!previousNodeId || previousNodeId.includes('_gate')) return;
      const from = activeNodes.find((node) => node.id === previousNodeId);
      if (!from) return;
      const world = getWorldForNode(to);
      const line = this.config.scene.add.graphics();
      line.lineStyle(8, world.palette.pathEdge, 0.9);
      line.lineBetween(from.x - GAME_WIDTH / 2, from.y - GAME_HEIGHT / 2, to.x - GAME_WIDTH / 2, to.y - GAME_HEIGHT / 2);
      line.lineStyle(4, world.palette.path, 0.92);
      line.lineBetween(from.x - GAME_WIDTH / 2, from.y - GAME_HEIGHT / 2, to.x - GAME_WIDTH / 2, to.y - GAME_HEIGHT / 2);
      this.addAtlasElement(line);
    });
  }

  private createNodes() {
    this.getWorldNodeList(this.getActiveWorld().id).forEach((node) => {
      const world = getWorldForNode(node);
      const container = this.config.scene.add.container(node.x - GAME_WIDTH / 2, node.y - GAME_HEIGHT / 2);
      const background = this.config.scene.add.graphics();
      const rating = this.config.scene.add.graphics();
      const labelText = this.config.scene.add
        .text(0, node.nodeType === 'gate' ? 32 : 38, node.nodeType === 'bonus' ? 'B' : node.nodeType === 'gate' ? 'Gate' : node.id.slice(-2), {
          ...this.config.textStyle(10, '#ffffff'),
          align: 'center'
        })
        .setOrigin(0.5)
        .setStroke('#17347e', 3);
      const clickZone = this.config.scene.add.zone(0, 0, node.nodeType === 'gate' ? 76 : 58, node.nodeType === 'gate' ? 58 : 70).setInteractive();
      container.add([background, rating, labelText, clickZone]);
      clickZone.on('pointerup', () => {
        if (this.config.isPointerHandled() || this.config.scene.time.now < this.config.getMapInputReadyAt()) return;
        this.config.selectMapNode(node.id);
      });
      clickZone.on('pointerover', () => this.config.scene.tweens.add({ targets: container, scale: 1.08, duration: 90, ease: 'Sine.easeOut' }));
      clickZone.on('pointerout', () => this.config.scene.tweens.add({ targets: container, scale: 1, duration: 90, ease: 'Sine.easeOut' }));
      container.setData('worldAccent', world.palette.accent);
      this.addAtlasElement(container);
      this.mapNodeButtons.push({ node, container, background, rating, labelText });
    });
  }

  private createPreviewCard() {
    const card = this.config.scene.add.graphics();
    card.fillStyle(0x17347e, 0.92);
    card.fillRoundedRect(-384, 148, 568, 88, 18);
    card.lineStyle(4, 0xffffff, 0.82);
    card.strokeRoundedRect(-384, 148, 568, 88, 18);
    const title = this.config.scene.add.text(-360, 164, '', this.config.textStyle(22, '#fffad0')).setStroke('#17347e', 5);
    title.setData('role', 'mapCardTitle');
    const body = this.config.scene.add.text(-360, 195, '', { ...this.config.textStyle(13, '#dff7ff'), wordWrap: { width: 520 }, lineSpacing: 1 }).setStroke('#17347e', 3);
    body.setData('role', 'mapCardBody');
    const playButton = this.config.createOverlayButton(110, 192, 118, 44, 'Play', 0x53d36d, this.config.startGame);
    playButton.setData('role', 'mapPlayButton');
    [card, title, body, playButton].forEach((element) => {
      this.addElement(element);
      this.mapCardElements.push(element);
    });
  }

  private drawNodeButton(button: MapNodeButton) {
    const { node, background, rating } = button;
    const world = getWorldForNode(node);
    const selected = node.id === this.config.getSelectedMapNodeId();
    const bottles = this.config.getBottlesForNode(node.id);
    const unlocked = this.config.isMapNodeUnlocked(node);
    const playable = this.config.isMapNodePlayable(node);

    background.clear();
    const alpha = unlocked ? 1 : 0.42;
    if (node.nodeType === 'gate') {
      background.fillStyle(playable ? 0x53d36d : 0x6b5b55, alpha);
      background.fillRoundedRect(-34, -24, 68, 48, 12);
      background.lineStyle(selected ? 6 : 4, selected ? 0xfff06a : 0xffffff, selected ? 1 : 0.72);
      background.strokeRoundedRect(-34, -24, 68, 48, 12);
      background.fillStyle(playable ? 0xfff06a : 0x2b1c19, 0.95);
      background.fillTriangle(-8, -6, 16, 0, -8, 6);
    } else {
      background.fillStyle(node.nodeType === 'bonus' ? 0xffd166 : world.palette.node, alpha);
      background.fillCircle(0, 0, node.nodeType === 'bonus' ? 24 : 22);
      background.lineStyle(selected ? 6 : 4, selected ? 0xfff06a : world.palette.pathEdge, selected ? 1 : 0.88);
      background.strokeCircle(0, 0, node.nodeType === 'bonus' ? 24 : 22);
      if (!playable && bottles === 0) {
        background.fillStyle(0x17347e, 0.82);
        background.fillRoundedRect(-10, -4, 20, 16, 5);
        background.fillCircle(0, -7, 8);
      } else if (selected) {
        background.fillStyle(0xff7aa8, 0.95);
        background.fillCircle(-5, -6, 6);
        background.fillCircle(7, -6, 6);
        background.fillCircle(0, 4, 7);
      }
    }

    rating.clear();
    if (bottles > 0 && node.nodeType !== 'gate') {
      for (let i = 0; i < 3; i += 1) {
        rating.fillStyle(i < bottles ? 0xbfefff : 0x17347e, i < bottles ? 1 : 0.34);
        rating.fillRoundedRect(-18 + i * 13, 22, 8, 15, 3);
        rating.fillStyle(0xffffff, i < bottles ? 0.75 : 0.2);
        rating.fillRoundedRect(-17 + i * 13, 24, 6, 4, 2);
      }
    }

    button.labelText.setColor(unlocked ? '#ffffff' : '#b9c5d6');
  }
}
