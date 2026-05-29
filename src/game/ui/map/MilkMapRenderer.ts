import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../constants';
import type { CosmeticOption } from '../../data/cosmetics';
import { MAP_NODES, WORLDS, getMapNodeById, getWorldForNode, type MapNode } from '../../worldMap';

type VisibleGameObject = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible;

type MapNodeButton = {
  node: MapNode;
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Graphics;
  rating: Phaser.GameObjects.Graphics;
  labelText: Phaser.GameObjects.Text;
};

type MapPoint = {
  x: number;
  y: number;
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
  private mapCatAvatarNodeId?: string;
  private milkBottleCharacter?: Phaser.GameObjects.Graphics;
  private milkTotalText?: Phaser.GameObjects.Text;

  constructor(private readonly config: MilkMapRendererConfig) {}

  create() {
    this.elements.length = 0;
    this.mapNodeButtons = [];
    this.mapCardElements.length = 0;

    const cosmetic = this.config.getSelectedCosmetic();

    this.createAtlasPage();
    this.milkBottleCharacter = this.config.scene.add.graphics();
    this.milkTotalText = this.config.scene.add.text(348, -176, '', this.config.textStyle(12, '#fffad0')).setOrigin(0.5).setStroke('#17347e', 4);
    this.addElement(this.milkBottleCharacter);
    this.addElement(this.milkTotalText);
    this.mapCatAvatar = this.config.scene.add.image(0, 0, cosmetic.run1).setScale(0.26);
    this.addElement(this.mapCatAvatar);
    this.createPreviewCard();
    this.addElement(this.config.createOverlayButton(322, 220, 112, 36, 'Shop', 0xffd166, this.config.showShop));
    this.addElement(this.config.createOverlayButton(322, 176, 112, 36, 'Back', 0xff7aa8, this.config.showLaunch));
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
    this.milkTotalText?.setText(`${totalMilk}/${this.config.getMapMilkGoal()}`);
    if (this.milkBottleCharacter) this.drawMilkBottleCharacter(this.milkBottleCharacter, totalMilk, this.config.getMapMilkGoal());
    for (const element of this.elements) {
      const role = element.getData('role') as string | undefined;
      if (role === 'mapCardTitle') {
        (element as Phaser.GameObjects.Text).setText(selectedNode.displayName);
      } else if (role === 'mapCardBody') {
        (element as Phaser.GameObjects.Text).setText(this.config.getMapCardBody(selectedNode));
      } else if (role === 'mapPlayButton') {
        element.setVisible(this.config.getOverlayMode() === 'map' && this.config.isMapNodePlayable(selectedNode));
      }
    }

    if (this.mapCatAvatar) {
      const cosmetic = this.config.getSelectedCosmetic();
      const target = this.getNodePoint(selectedNode);
      const targetY = target.y - 30;
      this.mapCatAvatar
        .setTexture(cosmetic.run1)
        .setScale(cosmetic.style === 'nyan' ? 0.24 : 0.26)
        .setVisible(this.config.getOverlayMode() === 'map' && this.config.isMapNodePlayable(selectedNode));
      if (!this.mapCatAvatarNodeId) {
        this.mapCatAvatar.setPosition(target.x, targetY);
      } else if (this.mapCatAvatarNodeId !== selectedNode.id) {
        this.config.scene.tweens.killTweensOf(this.mapCatAvatar);
        this.config.scene.tweens.add({
          targets: this.mapCatAvatar,
          x: target.x,
          y: targetY,
          scale: cosmetic.style === 'nyan' ? 0.28 : 0.3,
          duration: 420,
          yoyo: true,
          ease: 'Sine.easeInOut'
        });
      }
      this.mapCatAvatarNodeId = selectedNode.id;
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
    const earnedInWorld = activeNodes.reduce((total, node) => total + this.config.getBottlesForNode(node.id), 0);
    const possibleInWorld = activeNodes.filter((node) => node.nodeType !== 'gate').length * 3;

    const band = this.config.scene.add.graphics();
    const background = Phaser.Display.Color.HexStringToColor(world.palette.background).color;
    band.fillStyle(background, 0.98);
    band.fillRoundedRect(-378, -174, 756, 304, 26);
    band.lineStyle(5, world.palette.pathEdge, 0.82);
    band.strokeRoundedRect(-378, -174, 756, 304, 26);
    band.fillStyle(0xffffff, 0.2);
    band.fillRoundedRect(-350, -150, 700, 254, 20);
    band.fillStyle(world.palette.band, 0.18);
    for (let y = -144; y < 114; y += 34) {
      band.fillRoundedRect(-332, y, 146, 12, 6);
      band.fillRoundedRect(-94, y + 12, 184, 12, 6);
      band.fillRoundedRect(168, y - 6, 150, 12, 6);
    }
    band.fillStyle(0xffffff, 0.3);
    band.fillCircle(-306, -96, 42);
    band.fillCircle(296, 76, 52);
    band.fillCircle(20, 96, 26);
    this.addAtlasElement(band);
    this.createScenicProps(world.id);

    this.addAtlasElement(this.config.scene.add.text(-340, -151, world.atlasLabel, { ...this.config.textStyle(11, '#17347e'), align: 'left' }).setOrigin(0, 0.5));
    this.addAtlasElement(
      this.config.scene.add
        .text(-340, -132, world.displayName, { ...this.config.textStyle(14, '#ffffff'), align: 'left', wordWrap: { width: 220 } })
        .setOrigin(0, 0.5)
        .setStroke('#17347e', 4)
    );
    this.addAtlasElement(
      this.config.scene.add
        .text(0, 113, `${world.mapSkin.pathName} - ${earnedInWorld}/${possibleInWorld} milk here`, {
          ...this.config.textStyle(12, '#17347e'),
          align: 'center',
          wordWrap: { width: 420 }
        })
        .setOrigin(0.5)
    );

    if (previousWorld) {
      this.createWorldPeek(-408, -12, previousWorld.shortName, 'Prev', false, () =>
        this.config.selectMapNode(this.getWorldNodeList(previousWorld.id)[0]?.id ?? this.config.getSelectedMapNodeId())
      );
    }
    if (nextWorld) {
      this.createWorldPeek(408, -12, nextWorld.shortName, 'Next', true, () =>
        this.config.selectMapNode(this.getWorldNodeList(nextWorld.id)[0]?.id ?? this.config.getSelectedMapNodeId())
      );
    }

    this.addAtlasElement(
      this.config.scene.add
      .text(0, 134, nextWorld ? `Next: ${nextWorld.displayName}` : 'Atlas edge: more worlds can grow beyond this page.', {
          ...this.config.textStyle(11, '#fffad0'),
          align: 'center',
          wordWrap: { width: 420 }
        })
        .setOrigin(0.5)
        .setStroke('#17347e', 3)
    );
  }

  private createWorldPeek(x: number, y: number, label: string, eyebrow: string, pointsRight: boolean, onClick: () => void) {
    const peek = this.config.scene.add.container(x, y);
    const arrows = this.config.scene.add.graphics();
    const direction = pointsRight ? 1 : -1;
    arrows.fillStyle(0xfff06a, 0.96);
    for (let i = 0; i < 3; i += 1) {
      const offset = i * -18 * direction;
      arrows.fillTriangle(offset - 14 * direction, -18, offset + 18 * direction, 0, offset - 14 * direction, 18);
    }
    arrows.lineStyle(3, 0xffffff, 0.72);
    arrows.strokeTriangle(-14 * direction, -18, 18 * direction, 0, -14 * direction, 18);
    const eyebrowText = this.config.scene.add.text(0, -54, eyebrow, this.config.textStyle(11, '#fffad0')).setOrigin(0.5).setStroke('#17347e', 3);
    const labelText = this.config.scene.add
      .text(0, 48, label, { ...this.config.textStyle(14, '#ffffff'), align: 'center', wordWrap: { width: 100 } })
      .setOrigin(0.5)
      .setStroke('#17347e', 4);
    const zone = this.config.scene.add.zone(0, 0, 112, 150).setInteractive();
    peek.add([arrows, eyebrowText, labelText, zone]);
    this.config.scene.tweens.add({
      targets: arrows,
      x: pointsRight ? 8 : -8,
      alpha: 0.68,
      duration: 620,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
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
    activeNodes.forEach((to, index) => {
      const previousNodeId = to.unlock.previousNodeId;
      const previousNode = previousNodeId ? getMapNodeById(previousNodeId) : undefined;
      if (!previousNode || previousNode.nodeType === 'gate') return;
      const from = activeNodes.find((node) => node.id === previousNodeId);
      if (!from) return;
      this.drawRouteSegment(from, to, index);
    });
  }

  private createNodes() {
    this.getWorldNodeList(this.getActiveWorld().id).forEach((node) => {
      const world = getWorldForNode(node);
      const point = this.getNodePoint(node);
      const container = this.config.scene.add.container(point.x, point.y);
      const background = this.config.scene.add.graphics();
      const rating = this.config.scene.add.graphics();
      const labelText = this.config.scene.add
        .text(0, node.nodeType === 'gate' ? 35 : 38, node.nodeType === 'bonus' ? 'BONUS' : node.nodeType === 'gate' ? 'GATE' : node.id.slice(-2), {
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
    card.fillRoundedRect(-382, 154, 580, 82, 18);
    card.lineStyle(4, 0xffffff, 0.82);
    card.strokeRoundedRect(-382, 154, 580, 82, 18);
    const title = this.config.scene.add.text(-356, 168, '', this.config.textStyle(21, '#fffad0')).setStroke('#17347e', 5);
    title.setData('role', 'mapCardTitle');
    const body = this.config.scene.add.text(-356, 197, '', { ...this.config.textStyle(12, '#dff7ff'), wordWrap: { width: 526 }, lineSpacing: 1 }).setStroke('#17347e', 3);
    body.setData('role', 'mapCardBody');
    const playButton = this.config.createOverlayButton(126, 194, 118, 44, 'Play', 0x53d36d, this.config.startGame);
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
    background.fillStyle(0x17347e, unlocked ? 0.24 : 0.16);
    if (node.nodeType === 'gate') {
      background.fillRoundedRect(-40, -20, 80, 50, 12);
      background.fillStyle(playable ? 0x53d36d : 0x6b5b55, alpha);
      background.fillRoundedRect(-34, -30, 68, 56, 12);
      background.lineStyle(selected ? 6 : 4, selected ? 0xfff06a : 0xffffff, selected ? 1 : 0.72);
      background.strokeRoundedRect(-34, -30, 68, 56, 12);
      background.fillStyle(0x17347e, 0.22);
      background.fillRect(-22, -10, 44, 8);
      background.fillRect(-22, 5, 44, 8);
      background.fillStyle(playable ? 0xfff06a : 0x2b1c19, 0.95);
      background.fillTriangle(-8, -6, 16, 0, -8, 6);
    } else {
      const radius = node.nodeType === 'bonus' ? 28 : 25;
      background.fillRoundedRect(-radius - 8, -radius + 8, (radius + 8) * 2, 20, 10);
      background.fillStyle(node.nodeType === 'bonus' ? 0xffd166 : world.palette.node, alpha);
      background.fillCircle(0, 0, radius);
      background.fillStyle(0xffffff, unlocked ? 0.34 : 0.16);
      background.fillCircle(-8, -10, radius * 0.44);
      background.lineStyle(selected ? 6 : 4, selected ? 0xfff06a : world.palette.pathEdge, selected ? 1 : 0.88);
      background.strokeCircle(0, 0, radius);
      if (!playable && bottles === 0) {
        background.fillStyle(0x17347e, 0.82);
        background.fillRoundedRect(-10, -4, 20, 16, 5);
        background.fillCircle(0, -7, 8);
      } else if (selected) {
        background.fillStyle(0xff7aa8, 0.95);
        background.fillCircle(-6, -8, 5);
        background.fillCircle(7, -8, 5);
        background.fillCircle(0, 3, 7);
      } else if (bottles > 0) {
        background.fillStyle(0xbfefff, 0.92);
        background.fillRect(-5, -10, 10, 18);
        background.fillStyle(0xffffff, 0.88);
        background.fillRect(-3, -14, 6, 5);
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

  private getNodePoint(node: MapNode): MapPoint {
    if (node.nodeType === 'bonus') return { x: -18, y: -126 };
    if (node.nodeType === 'gate') return { x: 336, y: 40 };
    const mainNodes = this.getWorldNodeList(node.worldId).filter((candidate) => candidate.nodeType === 'main');
    const index = Math.max(0, mainNodes.findIndex((candidate) => candidate.id === node.id));
    const path: MapPoint[] = [
      { x: -312, y: 52 },
      { x: -260, y: -22 },
      { x: -160, y: -62 },
      { x: -64, y: -12 },
      { x: 34, y: 54 },
      { x: 138, y: 6 },
      { x: 226, y: -58 },
      { x: 296, y: -10 }
    ];
    return path[index] ?? { x: node.x - GAME_WIDTH / 2, y: node.y - GAME_HEIGHT / 2 };
  }

  private drawRouteSegment(from: MapNode, to: MapNode, index: number) {
    const world = getWorldForNode(to);
    const start = this.getNodePoint(from);
    const end = this.getNodePoint(to);
    const control = this.getControlPoint(start, end, index, to.nodeType === 'bonus');
    const unlocked = this.config.isMapNodeUnlocked(to);
    const route = this.config.scene.add.graphics();
    const alpha = unlocked ? 0.98 : 0.34;
    route.lineStyle(26, world.palette.pathEdge, alpha * 0.5);
    this.strokeQuadratic(route, start, control, end);
    route.lineStyle(18, world.palette.pathEdge, alpha);
    this.strokeQuadratic(route, start, control, end);
    route.lineStyle(12, world.palette.path, alpha);
    this.strokeQuadratic(route, start, control, end);
    route.lineStyle(3, 0xffffff, unlocked ? 0.45 : 0.16);
    this.strokeQuadratic(
      route,
      { x: start.x + 2, y: start.y - 4 },
      { x: control.x + 2, y: control.y - 4 },
      { x: end.x + 2, y: end.y - 4 }
    );
    this.addAtlasElement(route);

    const steps = to.nodeType === 'bonus' ? 3 : 4;
    for (let i = 1; i <= steps; i += 1) {
      const t = i / (steps + 1);
      const point = this.quadraticPoint(start, control, end, t);
      const dot = this.config.scene.add.graphics();
      dot.fillStyle(0xffffff, unlocked ? 0.72 : 0.18);
      dot.fillRoundedRect(point.x - 9, point.y - 4, 18, 8, 4);
      dot.rotation = Phaser.Math.Angle.Between(start.x, start.y, end.x, end.y);
      this.addAtlasElement(dot);
      if (unlocked) {
        this.config.scene.tweens.add({
          targets: dot,
          alpha: 0.38,
          duration: 760 + i * 90,
          repeat: -1,
          yoyo: true,
          ease: 'Sine.easeInOut'
        });
      }
    }
  }

  private getControlPoint(start: MapPoint, end: MapPoint, index: number, bonus: boolean): MapPoint {
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const curve = bonus ? -70 : index % 2 === 0 ? -36 : 36;
    return { x: midX, y: midY + curve };
  }

  private strokeQuadratic(graphics: Phaser.GameObjects.Graphics, start: MapPoint, control: MapPoint, end: MapPoint) {
    graphics.beginPath();
    graphics.moveTo(start.x, start.y);
    for (let step = 1; step <= 24; step += 1) {
      const point = this.quadraticPoint(start, control, end, step / 24);
      graphics.lineTo(point.x, point.y);
    }
    graphics.strokePath();
  }

  private quadraticPoint(start: MapPoint, control: MapPoint, end: MapPoint, t: number): MapPoint {
    const inv = 1 - t;
    return {
      x: inv * inv * start.x + 2 * inv * t * control.x + t * t * end.x,
      y: inv * inv * start.y + 2 * inv * t * control.y + t * t * end.y
    };
  }

  private drawMilkBottleCharacter(graphics: Phaser.GameObjects.Graphics, totalMilk: number, mapMilkGoal: number) {
    const x = 302;
    const y = -254;
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

  private createScenicProps(worldId: string) {
    const propLayer = this.config.scene.add.container(0, 0);
    const props = this.config.scene.add.graphics();
    if (worldId.includes('kitchen') || worldId.includes('home') || worldId.includes('hallway')) {
      this.drawMilkSplash(props, -274, -18, 0xbfefff);
      this.drawMilkSplash(props, 212, 80, 0xbfefff);
      this.drawYarnBall(props, -94, 86, 0xff7aa8);
      this.drawTinyBowl(props, 116, -86);
      this.drawShelfCrumb(props, -228, 92);
    } else if (worldId.includes('living') || worldId.includes('bedroom')) {
      this.drawPillowHill(props, -250, 82, 0xffc6de);
      this.drawYarnBall(props, -88, -86, 0xffd166);
      this.drawPillowHill(props, 230, -76, 0xf4f0ff);
      this.drawTinyBowl(props, 76, 96);
    } else {
      this.drawGrassPatch(props, -258, 82);
      this.drawGrassPatch(props, 214, -82);
      this.drawYarnBall(props, -96, -92, 0xffd166);
      this.drawMilkSplash(props, 106, 86, 0xdff7ff);
      this.drawTinyBowl(props, 260, 84);
    }
    propLayer.add(props);
    this.addAtlasElement(propLayer);
  }

  private drawMilkSplash(graphics: Phaser.GameObjects.Graphics, x: number, y: number, color: number) {
    graphics.fillStyle(color, 0.74);
    graphics.fillRoundedRect(x - 28, y - 8, 56, 16, 8);
    graphics.fillRoundedRect(x - 12, y - 18, 24, 10, 5);
    graphics.fillCircle(x + 34, y - 14, 5);
    graphics.fillCircle(x - 38, y + 10, 4);
  }

  private drawYarnBall(graphics: Phaser.GameObjects.Graphics, x: number, y: number, color: number) {
    graphics.fillStyle(0x17347e, 0.18);
    graphics.fillRoundedRect(x - 22, y + 18, 44, 9, 5);
    graphics.fillStyle(color, 0.92);
    graphics.fillCircle(x, y, 20);
    graphics.lineStyle(3, 0xffffff, 0.4);
    graphics.strokeCircle(x, y, 13);
    graphics.lineStyle(3, 0x17347e, 0.2);
    graphics.lineBetween(x - 17, y - 3, x + 17, y + 8);
    graphics.lineBetween(x - 8, y - 17, x + 8, y + 17);
  }

  private drawTinyBowl(graphics: Phaser.GameObjects.Graphics, x: number, y: number) {
    graphics.fillStyle(0x17347e, 0.16);
    graphics.fillRoundedRect(x - 30, y + 16, 60, 9, 5);
    graphics.fillStyle(0xffffff, 0.94);
    graphics.fillRoundedRect(x - 26, y - 3, 52, 22, 8);
    graphics.fillStyle(0xbfefff, 0.86);
    graphics.fillRoundedRect(x - 18, y - 12, 36, 10, 5);
    graphics.fillStyle(0xff7aa8, 0.94);
    graphics.fillRoundedRect(x - 8, y + 5, 16, 7, 4);
  }

  private drawShelfCrumb(graphics: Phaser.GameObjects.Graphics, x: number, y: number) {
    graphics.fillStyle(0xc98248, 0.82);
    graphics.fillRoundedRect(x - 36, y, 72, 13, 7);
    graphics.fillStyle(0xffefba, 0.9);
    graphics.fillCircle(x - 18, y - 8, 4);
    graphics.fillCircle(x + 8, y - 12, 3);
    graphics.fillCircle(x + 26, y - 6, 5);
  }

  private drawPillowHill(graphics: Phaser.GameObjects.Graphics, x: number, y: number, color: number) {
    graphics.fillStyle(0x17347e, 0.14);
    graphics.fillRoundedRect(x - 50, y + 26, 100, 12, 6);
    graphics.fillStyle(color, 0.94);
    graphics.fillRoundedRect(x - 46, y - 10, 92, 42, 18);
    graphics.fillStyle(0xffffff, 0.24);
    graphics.fillRoundedRect(x - 34, y - 2, 52, 12, 6);
  }

  private drawGrassPatch(graphics: Phaser.GameObjects.Graphics, x: number, y: number) {
    graphics.fillStyle(0x17347e, 0.14);
    graphics.fillRoundedRect(x - 36, y + 18, 72, 9, 5);
    graphics.fillStyle(0x53d36d, 0.9);
    for (let i = -3; i <= 3; i += 1) {
      graphics.fillTriangle(x + i * 10, y + 18, x + i * 10 + 5, y - 12 - Math.abs(i) * 3, x + i * 10 + 12, y + 18);
    }
  }
}
