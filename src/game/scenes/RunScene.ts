import Phaser from 'phaser';
import { ASSETS, loadGameAssets } from '../assets';
import {
  CAT_Y,
  DEPTHS,
  GAME_HEIGHT,
  GAME_WIDTH,
  INITIAL_HEARTS,
  type GamePhase
} from '../constants';
import {
  type AccessoryOption,
  type CosmeticOption,
  type MouseOption,
  type TrailOption
} from '../data/cosmetics';
import { LEVELS, type LevelId, type LevelOption } from '../data/runLevels';
import { pickWeightedObstacle, type ObstacleId, type RunLevelRecipe } from '../data/runRecipes';
import { SPEED_OPTIONS, optionLabelForMultiplier, type SpeedOption } from '../data/speedOptions';
import { AudioSettingsService } from '../services/AudioSettingsService';
import { CosmeticService } from '../services/CosmeticService';
import { GameStateService, type RunMode } from '../services/GameStateService';
import { ProgressService } from '../services/ProgressService';
import { playBasketSound, playGameSound, playToneSet } from '../sound';
import type { LaneLayout } from '../systems/laneLayout';
import { PixelButton } from '../ui/components/PixelButton';
import { MilkMapRenderer } from '../ui/map/MilkMapRenderer';
import { ShopRenderer } from '../ui/shop/ShopRenderer';
import { buildRunConfig } from '../viewModels/buildRunConfig';
import { MAP_NODES, getWorldForNode, type MapNode } from '../worldMap';
import { BaseScene } from './BaseScene';

type RunnerSprite = Phaser.GameObjects.Image & {
  laneIndex?: number;
  kind?: ObstacleId | 'yarn';
};

type SpeedButton = {
  option: SpeedOption;
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Graphics;
  yarn: Phaser.GameObjects.Image;
  labelText: Phaser.GameObjects.Text;
};

type ModeButton = {
  mode: RunMode;
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Graphics;
  icon: Phaser.GameObjects.Graphics;
  labelText: Phaser.GameObjects.Text;
};

type AudioToggleId = 'sound-fx' | 'music';

type AudioToggleButton = {
  id: AudioToggleId;
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Graphics;
  knob: Phaser.GameObjects.Graphics;
  labelText: Phaser.GameObjects.Text;
};

type AudioVolumeSlider = {
  container: Phaser.GameObjects.Container;
  track: Phaser.GameObjects.Graphics;
  fill: Phaser.GameObjects.Graphics;
  knob: Phaser.GameObjects.Graphics;
  labelText: Phaser.GameObjects.Text;
};

type LevelButton = {
  option: LevelOption;
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Graphics;
  icon: Phaser.GameObjects.Graphics;
  numberText: Phaser.GameObjects.Text;
  titleText: Phaser.GameObjects.Text;
};

type EyeTrackedCat = {
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

export type OverlayMode = 'launch' | 'map' | 'shop';
export type InitialSceneMode = OverlayMode | 'run';

type VisibleGameObject = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible;

const FARM_YARN_GOAL = 300;
const FARM_YARN_ROW_SPACING = 150;
const FARM_YARN_FIRST_ROW_DISTANCE = 250;

export class RunScene extends BaseScene {
  private cat!: Phaser.GameObjects.Image;
  private roombaMount!: Phaser.GameObjects.Image;
  private crazyHair!: Phaser.GameObjects.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'left' | 'right', Phaser.Input.Keyboard.Key>;
  private phase: GamePhase = 'start';
  private currentLane = 1;
  private hearts = INITIAL_HEARTS;
  private yarnScore = 0;
  private speed = 0;
  private distance = 0;
  private spawnTimer = 0;
  private yarnSpawnIndex = 0;
  private farmYarnRowIndex = 0;
  private speedBonusYarnProgress = 0;
  private nextBlockedLane: number | undefined;
  private invulnerableUntil = 0;
  private finishLine!: Phaser.GameObjects.Container;
  private milkBottle!: Phaser.GameObjects.Image;
  private overlay!: Phaser.GameObjects.Container;
  private titleText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private basketText!: Phaser.GameObjects.Text;
  private shopBasketText!: Phaser.GameObjects.Text;
  private distanceText!: Phaser.GameObjects.Text;
  private progressBackground!: Phaser.GameObjects.Graphics;
  private progressFill!: Phaser.GameObjects.Graphics;
  private pauseButton!: Phaser.GameObjects.Container;
  private heartIcons: Phaser.GameObjects.Image[] = [];
  private obstacles!: Phaser.GameObjects.Group;
  private yarns!: Phaser.GameObjects.Group;
  private scrollables!: Phaser.GameObjects.Group;
  private worldObjects!: Phaser.GameObjects.Group;
  private pawPrints!: Phaser.GameObjects.Group;
  private celebrationObjects: Phaser.GameObjects.GameObject[] = [];
  private emitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private laneSwipeStart: Phaser.Math.Vector2 | undefined;
  private shopUiElements: VisibleGameObject[] = [];
  private shopRenderer!: ShopRenderer;
  private runUiElements: VisibleGameObject[] = [];
  private launchUiElements: VisibleGameObject[] = [];
  private endUiElements: VisibleGameObject[] = [];
  private pauseUiElements: VisibleGameObject[] = [];
  private speedButtons: SpeedButton[] = [];
  private modeButtons: ModeButton[] = [];
  private levelButtons: LevelButton[] = [];
  private audioToggleButtons: AudioToggleButton[] = [];
  private audioVolumeSlider!: AudioVolumeSlider;
  private eyeTrackedCats: EyeTrackedCat[] = [];
  private mapRenderer!: MilkMapRenderer;
  private selectedMapNodeId = MAP_NODES[0].id;
  private mapInputReadyAt = 0;
  private speedMultiplier = 1;
  private selectedLevelId: LevelId = 'kitchen';
  private runMode: RunMode = 'milk-run';
  private soundFxEnabled = true;
  private musicEnabled = true;
  private audioVolume = 0.8;
  private overlayMode: OverlayMode = 'launch';
  private shopPointerHandled = false;
  private controlsLocked = false;
  private hasCrazyHair = false;
  private pawTrailTimer = 0;
  private displayedProgress = 0;
  private obstacleHits = 0;
  private cachedRunConfig: ReturnType<typeof buildRunConfig> | undefined;
  private cachedRunConfigNodeId: string | undefined;
  private returnToSceneKey: string | undefined;
  private runNodeId: string | undefined;

  constructor(
    sceneKey = 'RunScene',
    private readonly initialSceneMode: InitialSceneMode = 'run',
    private readonly useSceneNavigation = true
  ) {
    super(sceneKey);
  }

  init(data?: { returnTo?: string; nodeId?: string }) {
    this.returnToSceneKey = data?.returnTo;
    this.runNodeId = data?.nodeId;
  }

  preload() {
    loadGameAssets(this);
  }

  create() {
    this.resetRunState();
    this.loadShopState();
    this.applyAudioSettings();
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('A,D') as Record<'left' | 'right', Phaser.Input.Keyboard.Key>;
    this.input.enabled = true;
    this.input.topOnly = false;
    this.obstacles = this.add.group();
    this.yarns = this.add.group();
    this.scrollables = this.add.group();
    this.worldObjects = this.add.group();
    this.pawPrints = this.add.group();

    this.createWorld();
    this.createHud();
    this.createPlayer();
    this.createFinishObjects();
    this.createOverlay();
    this.createParticles();
    this.bindInput();
    this.updateMouseCursor();
    if (this.initialSceneMode === 'run') {
      this.startGame();
    }
  }

  update(time: number, delta: number) {
    this.updateEyeTrackedCats();
    this.shopRenderer?.updateSmoothScroll(delta, this.overlayMode === 'shop');

    if ((this.phase === 'won' || this.phase === 'lost') && Phaser.Input.Keyboard.JustDown(this.cursors.space!)) {
      this.restartGame();
      return;
    }

    if (this.phase !== 'playing') return;

    const dt = delta / 1000;
    this.distance += this.speed * dt;
    this.spawnTimer += delta;

    this.scrollWorld(dt);
    this.updateRunnerGroup(this.obstacles, dt, time, (item) => this.hitObstacle(item, time));
    this.updateRunnerGroup(this.yarns, dt, time, (item) => this.collectYarn(item));
    this.updateCrazyHair();
    this.updateRoombaMount();
    this.updatePawTrail(delta);
    if (this.isFarmForYarn()) {
      this.finishLine.setVisible(false);
      this.milkBottle.setVisible(false);
    } else {
      this.updateFinish();
    }
    this.updateHud();

    if (!this.isFarmForYarn() && this.spawnTimer >= this.getRunRecipe().spawnCadenceMs) {
      this.spawnObstacle();
      this.spawnTimer = Phaser.Math.Between(-130, 120);
    }

    if (this.isFarmForYarn()) {
      this.spawnFarmYarnRows();
    } else {
      this.spawnDueYarn();
    }

    if (!this.isFarmForYarn() && this.distance >= this.getRunRecipe().finishDistance) {
      this.winGame();
    }
  }

  private createWorld() {
    const level = this.getSelectedLevel();
    const levelId = level.id as string;
    const laneLayout = this.getLaneLayout();
    this.scrollables.clear(false, false);
    this.worldObjects.clear(true, true);
    this.cameras.main.setBackgroundColor(level.backgroundColor);

    for (let y = -70; y <= GAME_HEIGHT + 90; y += 70) {
      const stripe = this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH, 34, level.backgroundBand, 0.42).setDepth(DEPTHS.background);
      this.addWorldObject(stripe, 0.42);
    }

    if (levelId === 'magical-kingdom') {
      const backdrop = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, ASSETS.magicKingdomBackdrop).setDepth(DEPTHS.background).setAlpha(0.58);
      this.addWorldObject(backdrop);
      this.createKingdomSkyline();
    }

    this.addWorldObject(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, laneLayout.roadOuterWidth, GAME_HEIGHT + 30, level.roadOuter).setDepth(DEPTHS.track));
    this.addWorldObject(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, laneLayout.roadInnerWidth, GAME_HEIGHT + 30, level.roadInner).setDepth(DEPTHS.track));
    this.addWorldObject(this.add.rectangle(laneLayout.roadLeftEdge, GAME_HEIGHT / 2, 14, GAME_HEIGHT + 30, level.roadEdge, 0.95).setDepth(DEPTHS.trackDecor));
    this.addWorldObject(this.add.rectangle(laneLayout.roadRightEdge, GAME_HEIGHT / 2, 14, GAME_HEIGHT + 30, level.roadEdge, 0.95).setDepth(DEPTHS.trackDecor));

    for (const x of laneLayout.laneMarkerXs) {
      for (let y = -30; y < GAME_HEIGHT + 60; y += 72) {
        if (levelId === 'magical-kingdom') {
          const star = this.add.star(x, y, 5, 5, 13, level.laneMark, 0.74).setDepth(DEPTHS.trackDecor);
          this.addWorldObject(star, 1);
        } else {
          const dash = this.add.rectangle(x, y, 7, 38, level.laneMark, 0.7).setDepth(DEPTHS.trackDecor);
          this.addWorldObject(dash, 1);
        }
      }
    }

    for (let i = 0; i < 38; i += 1) {
      const x = Phaser.Math.RND.pick([Phaser.Math.Between(24, 170), Phaser.Math.Between(790, 936)]);
      const y = Phaser.Math.Between(-20, GAME_HEIGHT + 60);
      const key = Phaser.Math.RND.pick(level.decorKeys);
      const decor = this.add.image(x, y, key).setDepth(DEPTHS.trackDecor).setScale(Phaser.Math.FloatBetween(0.62, 1.15));
      decor.setAngle(Phaser.Math.Between(-12, 12));
      this.addWorldObject(decor, Phaser.Math.FloatBetween(0.5, 0.74));
    }
  }

  private createKingdomSkyline() {
    for (const x of [88, 846]) {
      const tower = this.add.image(x, 104, ASSETS.magicKingdomTower).setDepth(DEPTHS.background).setScale(x < GAME_WIDTH / 2 ? 1.08 : 0.96);
      tower.setAlpha(0.76);
      this.addWorldObject(tower, 0.18);
    }

    for (const x of [190, 732]) {
      const cloud = this.add.image(x, Phaser.Math.Between(66, 138), ASSETS.magicCloud).setDepth(DEPTHS.background).setScale(1.08);
      cloud.setAlpha(0.86);
      this.addWorldObject(cloud, 0.14);
    }
  }

  private addWorldObject<T extends Phaser.GameObjects.GameObject>(object: T, scrollSpeed?: number) {
    this.worldObjects.add(object);
    if (scrollSpeed !== undefined) {
      object.setData('scrollSpeed', scrollSpeed);
      this.scrollables.add(object);
    }
    return object;
  }

  private createHud() {
    const panel = this.add.graphics().setDepth(DEPTHS.hud);
    panel.fillStyle(0x285a3a, 0.82);
    panel.fillRoundedRect(18, 16, 270, 116, 18);
    panel.lineStyle(4, 0xffffff, 0.82);
    panel.strokeRoundedRect(18, 16, 270, 116, 18);

    this.heartIcons = [0, 1, 2].map((index) => this.add.image(48 + index * 54, 45, ASSETS.heartFull).setDepth(DEPTHS.hud));
    this.scoreText = this.add.text(38, 72, '', this.textStyle(20, '#fffad0')).setDepth(DEPTHS.hud);
    this.basketText = this.add.text(38, 96, '', this.textStyle(18, '#dff7ff')).setDepth(DEPTHS.hud);
    this.distanceText = this.add
      .text(GAME_WIDTH - 40, 26, 'Milk dash', { ...this.textStyle(18, '#ffffff'), align: 'right' })
      .setOrigin(1, 0)
      .setDepth(DEPTHS.hud);
    this.progressBackground = this.add.graphics().setDepth(DEPTHS.hud);
    this.progressFill = this.add.graphics().setDepth(DEPTHS.hud);
    this.pauseButton = this.createPauseButton();
    this.updateHud();
  }

  private createPauseButton() {
    const button = this.add.container(GAME_WIDTH - 44, 114).setDepth(DEPTHS.hud).setVisible(false);
    const background = this.add.graphics();
    const icon = this.add.graphics();
    const clickZone = this.add.zone(0, 0, 46, 38).setInteractive();
    button.add([background, icon, clickZone]);
    const draw = (hovered = false) => {
      background.clear();
      background.fillStyle(0x17347e, hovered ? 1 : 0.9);
      background.fillRoundedRect(-23, -19, 46, 38, 12);
      background.lineStyle(hovered ? 4 : 3, 0xffffff, 0.84);
      background.strokeRoundedRect(-23, -19, 46, 38, 12);
      icon.clear();
      icon.fillStyle(0xfff06a, 1);
      icon.fillRoundedRect(-9, -10, 6, 20, 2);
      icon.fillRoundedRect(3, -10, 6, 20, 2);
    };
    draw();
    clickZone.on('pointerup', () => this.pauseRun());
    clickZone.on('pointerover', () => draw(true));
    clickZone.on('pointerout', () => draw(false));
    return button;
  }

  private createPlayer() {
    this.cat = this.add.image(this.getLaneX(this.currentLane), CAT_Y, this.getSelectedCosmetic().run1).setDepth(DEPTHS.player).setScale(0.95);
    this.roombaMount = this.add
      .image(this.cat.x, this.cat.y + 36, ASSETS.roomba)
      .setDepth(DEPTHS.player - 1)
      .setScale(0.58)
      .setVisible(false);
    this.crazyHair = this.add.image(this.cat.x, this.cat.y - 37, ASSETS.crazyHair).setDepth(DEPTHS.player + 1).setScale(0.9).setVisible(false);
    this.startCatBob();
    this.updateRoombaMount();
    this.startRunAnimationTimer();
  }

  private startRunAnimationTimer() {
    this.time.addEvent({
      delay: 160,
      loop: true,
      callback: () => {
        if (this.phase === 'playing' && !this.controlsLocked) {
          const cosmetic = this.getSelectedCosmetic();
          this.cat.setTexture(this.cat.texture.key === cosmetic.run1 ? cosmetic.run2 : cosmetic.run1);
        }
      }
    });
  }

  private createFinishObjects() {
    const finishDistance = this.getRunRecipe().finishDistance;
    this.finishLine = this.add.container(GAME_WIDTH / 2, CAT_Y - finishDistance).setDepth(DEPTHS.finish);
    const line = this.add.graphics();
    line.fillStyle(0xffffff, 1);
    line.fillRect(-250, -16, 500, 32);
    for (let x = -250; x < 250; x += 50) {
      line.fillStyle((x / 50) % 2 === 0 ? 0x2b2b2b : 0xffffff, 1);
      line.fillRect(x, -16, 25, 16);
      line.fillStyle((x / 50) % 2 === 0 ? 0xffffff : 0x2b2b2b, 1);
      line.fillRect(x + 25, 0, 25, 16);
    }
    this.finishLine.add(line);
    this.finishLine.add(this.add.image(-290, -10, ASSETS.finishFlag));
    this.finishLine.add(this.add.image(290, -10, ASSETS.finishFlag).setFlipX(true));

    this.milkBottle = this.add.image(GAME_WIDTH / 2, CAT_Y - finishDistance - 120, this.getRunRecipe().finishAsset).setDepth(DEPTHS.finish);
  }

  private createOverlay() {
    this.overlay = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(DEPTHS.overlay);
    const backdrop = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x5e8be8, 1);
    const panel = this.add.graphics();
    panel.fillStyle(0x2d5fbd, 1);
    panel.fillRoundedRect(-425, -244, 850, 486, 28);
    panel.lineStyle(6, 0xffffff, 1);
    panel.strokeRoundedRect(-425, -244, 850, 486, 28);

    this.titleText = this.add
      .text(0, -202, 'KITTY MILK RUN', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '48px',
        color: '#ffffff',
        align: 'center'
      })
      .setOrigin(0.5)
      .setStroke('#17347e', 8);

    this.instructionText = this.add
      .text(0, 204, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 8
      })
      .setOrigin(0.5)
      .setStroke('#17347e', 5);
    const shopTitle = this.add
      .text(-350, -150, 'Custom Kitty Shop', this.textStyle(24, '#fffad0'))
      .setOrigin(0, 0.5)
      .setStroke('#17347e', 5);
    this.shopBasketText = this.add
      .text(350, -150, '', { ...this.textStyle(22, '#dff7ff'), align: 'right' })
      .setOrigin(1, 0.5)
      .setStroke('#17347e', 5);
    const backButton = this.createOverlayButton(-350, 204, 120, 38, 'Back', 0xffd166, () => this.navigateToLaunch());

    this.overlay.add([backdrop, panel, this.titleText, this.instructionText, shopTitle, this.shopBasketText, backButton]);
    this.shopUiElements = [shopTitle, this.shopBasketText, backButton];
    this.createLaunchScreen();
    this.createMilkMapScreen();
    this.createShopCards();
    this.createAudioSettings();
    this.updateShopUi();
    this.showOverlayMode(this.initialSceneMode === 'run' ? 'launch' : this.initialSceneMode);
  }

  private createLaunchScreen() {
    this.launchUiElements = [];

    const scenePanel = this.add.graphics();
    scenePanel.fillStyle(0xffefba, 0.96);
    scenePanel.fillRoundedRect(-300, -150, 600, 128, 20);
    scenePanel.lineStyle(4, 0xffffff, 0.84);
    scenePanel.strokeRoundedRect(-300, -150, 600, 128, 20);
    scenePanel.fillStyle(0xc98248, 1);
    scenePanel.fillRoundedRect(-262, -64, 524, 24, 10);
    scenePanel.fillStyle(0x9b5734, 0.42);
    scenePanel.fillRoundedRect(-246, -57, 492, 6, 3);
    this.overlay.add(scenePanel);
    this.launchUiElements.push(scenePanel);

    const leftCharm = this.createPixelMilkBowlCharm(-174, -86).setScale(0.62);
    const rightCharm = this.createPixelFishCharm(174, -91).setScale(0.62);
    this.overlay.add([leftCharm, rightCharm]);
    this.launchUiElements.push(leftCharm, rightCharm);

    const heroCat = this.createEyeTrackedCat(0, -91, this.getSelectedCosmetic().run1, this.getSelectedCosmetic().style === 'nyan' ? 1.28 : 1.14, this.getSelectedCosmetic().style === 'nyan');
    heroCat.container.setData('role', 'launchSelectedCat');
    this.overlay.add(heroCat.container);
    this.launchUiElements.push(heroCat.container);

    const milkBottleMeter = this.add.graphics();
    milkBottleMeter.setData('role', 'launchMilkBottle');
    this.overlay.add(milkBottleMeter);
    this.launchUiElements.push(milkBottleMeter);

    const milkText = this.add
      .text(386, -146, '', this.textStyle(12, '#fffad0'))
      .setOrigin(0.5)
      .setStroke('#17347e', 4);
    milkText.setData('role', 'launchMilkTotal');
    this.overlay.add(milkText);
    this.launchUiElements.push(milkText);

    const selectedPanel = this.add.graphics();
    selectedPanel.fillStyle(0x17347e, 0.88);
    selectedPanel.fillRoundedRect(-300, -8, 600, 118, 18);
    selectedPanel.lineStyle(4, 0xffffff, 0.8);
    selectedPanel.strokeRoundedRect(-300, -8, 600, 118, 18);
    this.overlay.add(selectedPanel);
    this.launchUiElements.push(selectedPanel);

    const eyebrow = this.add
      .text(-270, 15, 'CURRENT RUN', this.textStyle(13, '#fffad0'))
      .setOrigin(0, 0.5)
      .setStroke('#17347e', 4);
    this.overlay.add(eyebrow);
    this.launchUiElements.push(eyebrow);

    const selectedTitle = this.add
      .text(-270, 43, '', this.textStyle(26, '#ffffff'))
      .setOrigin(0, 0.5)
      .setStroke('#17347e', 5);
    selectedTitle.setData('role', 'launchSelectedTitle');
    this.overlay.add(selectedTitle);
    this.launchUiElements.push(selectedTitle);

    const selectedBody = this.add
      .text(-270, 80, '', { ...this.textStyle(15, '#dff7ff'), wordWrap: { width: 532 }, lineSpacing: 4 })
      .setOrigin(0, 0.5)
      .setStroke('#17347e', 3);
    selectedBody.setData('role', 'launchSelectedBody');
    this.overlay.add(selectedBody);
    this.launchUiElements.push(selectedBody);

    const startButton = this.createHomeActionButton(-190, 152, 'START RUN', 0x53d36d, () => this.navigateToRun());
    const mapButton = this.createHomeActionButton(0, 152, 'MILK MAP', 0xffd166, () => this.navigateToMap());
    const shopButton = this.createHomeActionButton(190, 152, 'SHOP', 0xff7aa8, () => this.navigateToShop());
    this.overlay.add([startButton, mapButton, shopButton]);
    this.launchUiElements.push(startButton, mapButton, shopButton);

    this.createSpeedSelector();

    this.updateLaunchUi();
  }

  private createMilkMapScreen() {
    this.mapRenderer = new MilkMapRenderer({
      scene: this,
      overlay: this.overlay,
      textStyle: (fontSize, color) => this.textStyle(fontSize, color),
      createEyeTrackedCat: (x, y, texture, scale, usesNyanArt) => this.createEyeTrackedCat(x, y, texture, scale, usesNyanArt).container,
      setEyeTrackedCatTexture: (container, cosmetic) => this.setEyeTrackedCatTexture(container, cosmetic),
      createOverlayButton: (x, y, width, height, label, color, onClick) => this.createOverlayButton(x, y, width, height, label, color, onClick),
      getSelectedCosmetic: () => this.getSelectedCosmetic(),
      getSelectedMapNode: () => this.getSelectedMapNode(),
      getSelectedMapNodeId: () => this.selectedMapNodeId,
      getCurrentMapCatNode: () => ProgressService.getCurrentMapCatNode(),
      getTotalMilk: () => this.getTotalMilk(),
      getMapMilkGoal: () => this.getMapMilkGoal(),
      getBottlesForNode: (nodeId) => this.getBottlesForNode(nodeId),
      getMapCardBody: (node) => this.getMapCardBody(node),
      isMapNodeUnlocked: (node) => this.isMapNodeUnlocked(node),
      isMapNodePlayable: (node) => this.isMapNodePlayable(node),
      getMapInputReadyAt: () => this.mapInputReadyAt,
      isPointerHandled: () => this.shopPointerHandled,
      getOverlayMode: () => this.overlayMode,
      selectMapNode: (nodeId) => this.selectMapNode(nodeId),
      startGame: () => this.navigateToRun(),
      showShop: () => this.navigateToShop(),
      showLaunch: () => this.navigateToLaunch()
    });
    this.mapRenderer.create();
    this.runUiElements = this.mapRenderer.elements;
  }

  private selectMapNode(nodeId: string) {
    if (this.phase !== 'start') return;
    ProgressService.setSelectedNode(nodeId);
    this.selectedMapNodeId = ProgressService.getSelectedNodeId();
    const node = this.getSelectedMapNode();
    this.selectedLevelId = getWorldForNode(node).themeKey;
    GameStateService.setSelectedLevelId(this.selectedLevelId);
    this.createWorld();
    this.saveShopState();
    if (this.overlayMode === 'map') {
      this.mapRenderer?.createAtlasPage();
    }
    this.updateMapUi();
    playBasketSound(this.isMapNodePlayable(node) ? 'equip' : 'deny');
  }

  private updateMapUi() {
    this.mapRenderer?.update();
  }

  private updateLaunchUi() {
    if (this.launchUiElements.length === 0) return;
    const selectedNode = this.getCurrentRunNode();
    const world = getWorldForNode(selectedNode);
    const bottles = this.getBottlesForNode(selectedNode.id);
    const totalMilk = this.getTotalMilk();
    for (const element of this.launchUiElements) {
      const role = element.getData('role') as string | undefined;
      if (role === 'launchSelectedCat') {
        this.setEyeTrackedCatTexture(element as Phaser.GameObjects.Container, this.getSelectedCosmetic());
      } else if (role === 'launchMilkBottle') {
        this.drawLaunchMilkBottle(element as Phaser.GameObjects.Graphics, totalMilk);
      } else if (role === 'launchMilkTotal') {
        (element as Phaser.GameObjects.Text).setText(`${totalMilk}/${this.getMapMilkGoal()}`);
      } else if (role === 'launchSelectedTitle') {
        (element as Phaser.GameObjects.Text).setText(selectedNode.displayName);
      } else if (role === 'launchSelectedBody') {
        (element as Phaser.GameObjects.Text).setText(
          `${world.displayName} - Level ${this.getNodeLevelNumber(selectedNode)}\nBottles: ${this.formatBottleRating(bottles)}`
        );
      }
    }
  }

  private createPixelMilkBowlCharm(x: number, y: number) {
    const charm = this.add.container(x, y);
    const shadow = this.add.graphics();
    shadow.fillStyle(0x9b5734, 0.24);
    shadow.fillRect(-34, 28, 68, 8);

    const bowl = this.add.graphics();
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

    const sparkle = this.add.graphics();
    sparkle.fillStyle(0xffefba, 1);
    sparkle.fillRect(34, -26, 6, 18);
    sparkle.fillRect(28, -20, 18, 6);
    sparkle.fillRect(-42, -16, 4, 12);
    sparkle.fillRect(-46, -12, 12, 4);
    charm.add([shadow, bowl, sparkle]);
    return charm;
  }

  private createPixelFishCharm(x: number, y: number) {
    const charm = this.add.container(x, y);
    const shadow = this.add.graphics();
    shadow.fillStyle(0x9b5734, 0.24);
    shadow.fillRect(-32, 36, 64, 8);

    const fish = this.add.graphics();
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

    const paw = this.add.graphics();
    paw.fillStyle(0xfff1f7, 1);
    paw.fillRect(-2, -38, 12, 12);
    paw.fillRect(-18, -30, 10, 10);
    paw.fillRect(16, -30, 10, 10);
    paw.fillRect(-10, -22, 28, 14);
    charm.add([shadow, fish, paw]);
    return charm;
  }

  private drawLaunchMilkBottle(graphics: Phaser.GameObjects.Graphics, totalMilk: number) {
    const x = 340;
    const y = -231;
    const fillHeight = Math.round(Phaser.Math.Clamp(totalMilk / 81, 0, 1) * 42);
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

  private getMapCardBody(node: MapNode) {
    return ProgressService.getMapCardBody(node);
  }

  private getSelectedMapNode() {
    return ProgressService.getSelectedNode();
  }

  private getCurrentRunNode() {
    return ProgressService.getCurrentRunNode();
  }

  private getNodeLevelNumber(node: MapNode) {
    return ProgressService.getNodeLevelNumber(node);
  }

  private formatBottleRating(bottles: number) {
    return ProgressService.formatBottleRating(bottles);
  }

  private isMapNodeUnlocked(node: MapNode) {
    return ProgressService.isNodeUnlocked(node);
  }

  private isMapGateOpen(gateId: string) {
    return ProgressService.isGateOpen(gateId);
  }

  private isMapNodePlayable(node: MapNode) {
    return ProgressService.isNodePlayable(node);
  }

  private getBottlesForNode(nodeId: string) {
    return ProgressService.getBottlesForNode(nodeId);
  }

  private getTotalMilk() {
    return ProgressService.getTotalMilk();
  }

  private getMapMilkGoal() {
    return ProgressService.getMapMilkGoal();
  }

  private getNewestUnlockedNode() {
    return ProgressService.getNewestUnlockedNode();
  }

  private createShopCards() {
    this.shopRenderer = new ShopRenderer({
      scene: this,
      overlay: this.overlay,
      textStyle: (fontSize, color) => this.textStyle(fontSize, color),
      createEyeTrackedCat: (x, y, texture, scale, usesNyanArt) => this.createEyeTrackedCat(x, y, texture, scale, usesNyanArt).container,
      markPointerHandled: () => {
        this.shopPointerHandled = true;
      },
      buyOrEquipCat: (option) => this.buyOrEquipCat(option),
      buyOrEquipMouse: (option) => this.buyOrEquipMouse(option),
      buyOrEquipTrail: (option) => this.buyOrEquipTrail(option),
      buyOrEquipAccessory: (option) => this.buyOrEquipAccessory(option),
      toggleCatGodMode: () => this.toggleCatGodMode(),
      isUnlocked: (kind, optionId) => CosmeticService.isUnlocked(kind, optionId),
      isSelected: (kind, optionId) => CosmeticService.isSelected(kind, optionId),
      isCatGodMode: () => CosmeticService.isCatGodMode(),
      updateRunLoadoutUi: () => this.updateRunLoadoutUi(),
      updateSpeedUi: () => this.updateSpeedUi(),
      updateLevelUi: () => this.updateLevelUi(),
      updateModeUi: () => this.updateModeUi(),
      updateAudioUi: () => this.updateAudioUi()
    });
    this.shopRenderer.create();
    this.shopUiElements.push(...this.shopRenderer.elements);
  }

  protected override createEyeTrackedCat(x: number, y: number, texture: string, scale: number, usesNyanArt = false): EyeTrackedCat {
    const container = this.add.container(x, y).setScale(scale);
    const base = this.add.image(0, 0, texture);
    const eyes = this.add.image(0, 0, ASSETS.catKawaiiEyes);
    const leftPupil = this.add.ellipse(-12, -6, 6.4, 9.2, 0x211718, 1);
    const rightPupil = this.add.ellipse(12, -6, 6.4, 9.2, 0x211718, 1);
    const leftShine = this.add.ellipse(-14, -9, 3.2, 3.2, 0xffffff, 1);
    const rightShine = this.add.ellipse(10, -9, 3.2, 3.2, 0xffffff, 1);
    container.add([base, eyes, leftPupil, rightPupil, leftShine, rightShine]);

    const trackedCat = {
      container,
      base,
      eyes,
      pupils: [leftPupil, rightPupil],
      shines: [leftShine, rightShine],
      pupilAnchors: [new Phaser.Math.Vector2(-12, -6), new Phaser.Math.Vector2(12, -6)],
      shineAnchors: [new Phaser.Math.Vector2(-14, -9), new Phaser.Math.Vector2(10, -9)],
      lookOrigin: new Phaser.Math.Vector2(0, -6),
      lookRange: new Phaser.Math.Vector2(3.1, 3.8)
    };
    this.layoutEyeTrackedCat(trackedCat, usesNyanArt);
    this.eyeTrackedCats.push(trackedCat);
    return trackedCat;
  }

  protected override setEyeTrackedCatTexture(container: Phaser.GameObjects.Container, cosmetic: CosmeticOption) {
    const trackedCat = this.eyeTrackedCats.find((cat) => cat.container === container);
    if (!trackedCat) return;
    const usesNyanArt = cosmetic.style === 'nyan';
    trackedCat.base.setTexture(cosmetic.run1);
    const isLaunchCat = container.getData('role') === 'launchSelectedCat';
    trackedCat.container.setScale(isLaunchCat ? (usesNyanArt ? 1.28 : 1.14) : usesNyanArt ? 0.82 : 0.7);
    this.layoutEyeTrackedCat(trackedCat, usesNyanArt);
  }

  private layoutEyeTrackedCat(trackedCat: EyeTrackedCat, usesNyanArt: boolean) {
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

  private updateEyeTrackedCats() {
    if (this.phase !== 'start') return;
    const pointer = this.input.activePointer;
    const localPointer = new Phaser.Math.Vector2();

    for (const trackedCat of this.eyeTrackedCats) {
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

  private createLevelSelector() {
    this.levelButtons = LEVELS.map((option, index) => {
      const button = this.add.container((index - (LEVELS.length - 1) / 2) * 194, -42);
      const background = this.add.graphics();
      const icon = this.add.graphics();
      const numberText = this.add
        .text(-62, 1, String(option.order), this.textStyle(20, '#ffffff'))
        .setOrigin(0.5)
        .setStroke('#17347e', 4);
      const titleText = this.add
        .text(20, 0, option.name, {
          ...this.textStyle(option.name.length > 14 ? 13 : 14, '#ffffff'),
          align: 'center',
          wordWrap: { width: 112 }
        })
        .setOrigin(0.5)
        .setStroke('#17347e', 4);
      const clickZone = this.add.zone(0, 0, 178, 58).setInteractive();
      button.add([background, icon, numberText, titleText, clickZone]);
      clickZone.on('pointerup', () => {
        this.shopPointerHandled = true;
        this.setSelectedLevel(option.id);
      });
      clickZone.on('pointerover', () => {
        this.tweens.add({ targets: button, y: -47, duration: 90, ease: 'Sine.easeOut' });
      });
      clickZone.on('pointerout', () => {
        this.tweens.add({ targets: button, y: -42, duration: 90, ease: 'Sine.easeOut' });
      });
      this.overlay.add(button);
      this.runUiElements.push(button);
      return { option, container: button, background, icon, numberText, titleText };
    });

    this.updateLevelUi();
  }

  private createOverlayButton(x: number, y: number, width: number, height: number, label: string, color: number, onClick: () => void) {
    const button = new PixelButton({
      scene: this,
      x,
      y,
      width,
      height,
      label,
      color,
      textStyle: (fontSize, textColor) => this.textStyle(fontSize, textColor),
      onClick: () => {
      this.shopPointerHandled = true;
      onClick();
      }
    });
    return button.container;
  }

  private createHomeActionButton(x: number, y: number, label: string, color: number, onClick: () => void) {
    return this.createOverlayButton(x, y, 164, 54, label, color, onClick);
  }

  private buyOrEquipCat(option: CosmeticOption) {
    if (this.phase !== 'start') return;
    const result = CosmeticService.buyOrEquip('cat', option);
    if (result.ok) {
      this.cat.setTexture(option.run1);
      this.updateRoombaMount();
      this.floatText(result.message, GAME_WIDTH / 2, 128, '#fff2a1');
      playBasketSound(result.action === 'buy' ? 'buy' : 'equip');
    } else {
      this.floatText(result.message, GAME_WIDTH / 2, 128, '#fff2a1');
      this.cameras.main.shake(90, 0.004);
      playBasketSound('deny');
    }
    this.saveShopState();
    this.updateHud();
  }

  private buyOrEquipAccessory(option: AccessoryOption) {
    if (this.phase !== 'start') return;
    const result = CosmeticService.buyOrEquip('accessory', option);
    if (result.ok) {
      this.updateRoombaMount();
      this.floatText(result.message, GAME_WIDTH / 2, 128, '#fff2a1');
      playBasketSound(result.action === 'buy' ? 'buy' : 'equip');
    } else {
      this.floatText(result.message, GAME_WIDTH / 2, 128, '#fff2a1');
      this.cameras.main.shake(90, 0.004);
      playBasketSound('deny');
    }
    this.saveShopState();
    this.updateHud();
  }

  private buyOrEquipTrail(option: TrailOption) {
    if (this.phase !== 'start') return;
    const result = CosmeticService.buyOrEquip('trail', option);
    if (result.ok) {
      if (option.id === 'nyan-cat') this.emitNyanEquipBurst();
      this.floatText(result.message, GAME_WIDTH / 2, 128, '#fff2a1');
      playBasketSound(result.action === 'buy' ? 'buy' : 'equip');
    } else {
      this.floatText(result.message, GAME_WIDTH / 2, 128, '#fff2a1');
      this.cameras.main.shake(90, 0.004);
      playBasketSound('deny');
    }
    this.saveShopState();
    this.updateHud();
  }

  private buyOrEquipMouse(option: MouseOption) {
    if (this.phase !== 'start') return;
    const result = CosmeticService.buyOrEquip('mouse', option);
    if (result.ok) {
      this.updateMouseCursor();
      this.floatText(result.message, GAME_WIDTH / 2, 128, '#fff2a1');
      playBasketSound(result.action === 'buy' ? 'buy' : 'equip');
    } else {
      this.floatText(result.message, GAME_WIDTH / 2, 128, '#fff2a1');
      this.cameras.main.shake(90, 0.004);
      playBasketSound('deny');
    }
    this.saveShopState();
    this.updateHud();
  }

  private updateShopUi() {
    if (!this.shopBasketText) return;
    this.shopBasketText.setText(`Yarn basket: ${CosmeticService.getYarnBasket()}`);
    if (this.overlayMode === 'shop') {
      this.shopRenderer?.update();
    }
  }

  private toggleCatGodMode() {
    const active = CosmeticService.toggleCatGodMode();
    this.cat.setTexture(this.getSelectedCosmetic().run1);
    this.updateRoombaMount();
    this.updateMouseCursor();
    this.saveShopState();
    this.updateShopUi();
    this.floatText(active ? 'Cat God ON' : 'Cat God OFF', GAME_WIDTH / 2, 126, '#fff2a1');
    playBasketSound('equip');
  }

  private updateRunLoadoutUi() {
    for (const element of this.launchUiElements) {
      const role = element.getData('role') as string | undefined;
      if (role === 'launchSelectedCat') {
        this.setEyeTrackedCatTexture(element as Phaser.GameObjects.Container, this.getSelectedCosmetic());
      } else if (role === 'selectedRoomba') {
        element.setVisible(CosmeticService.getSelectedAccessoryId() === 'roomba' && this.overlayMode === 'launch');
      } else if (role === 'loadoutText') {
        (element as Phaser.GameObjects.Text).setText(this.getSelectedCosmetic().name);
      }
    }
  }

  private navigateToLaunch() {
    if (!this.useSceneNavigation) {
      this.showOverlayMode('launch');
      return;
    }
    const target = this.scene.key === 'ShopScene' ? this.returnToSceneKey ?? 'LaunchScene' : 'LaunchScene';
    this.startScene(target);
  }

  private navigateToMap() {
    if (!this.useSceneNavigation) {
      this.showOverlayMode('map');
      return;
    }
    this.startScene('MilkMapScene');
  }

  private navigateToShop() {
    if (!this.useSceneNavigation) {
      this.showOverlayMode('shop');
      return;
    }
    this.startScene('ShopScene', { returnTo: this.scene.key === 'ShopScene' ? this.returnToSceneKey ?? 'LaunchScene' : this.scene.key });
  }

  private navigateToRun() {
    if (!this.useSceneNavigation) {
      this.startGame();
      return;
    }
    this.startScene('RunScene', { nodeId: this.getCurrentRunNode().id });
  }

  private startScene(sceneKey: string, data?: object) {
    const currentSceneKey = this.scene.key;
    this.scene.start(sceneKey, data);
    if (currentSceneKey !== sceneKey) {
      this.scene.stop(currentSceneKey);
    }
  }

  private showOverlayMode(mode: OverlayMode) {
    if (this.phase !== 'start') return;
    this.overlayMode = mode;
    if (mode === 'map') {
      this.mapInputReadyAt = this.time.now + 180;
    }
    this.setLaunchUiVisible(mode === 'launch');
    this.setRunUiVisible(mode === 'map');
    this.setShopUiVisible(mode === 'shop');
    this.titleText
      .setText(mode === 'launch' ? 'KITTY MILK RUN' : mode === 'map' ? 'THE MILK MAP' : 'KITTY SHOP')
      .setPosition(0, -202)
      .setFontSize(48)
      .setScale(1);
    if (mode === 'launch') {
      this.titleText.setPosition(0, -203).setFontSize(42);
    }
    this.instructionText.setText('').setPosition(0, 204).setFontSize(22);
    this.updateShopUi();
    this.updateLaunchUi();
    this.updateMapUi();
  }

  private createSpeedSelector() {
    this.speedButtons = [];
    const option = SPEED_OPTIONS.find((candidate) => candidate.multiplier === this.speedMultiplier) ?? SPEED_OPTIONS[1];
    const button = this.add.container(0, 211);
    const background = this.add.graphics();
    const yarn = this.add.image(-70, 0, ASSETS.yarnBlue).setScale(0.3);
    const labelText = this.add
      .text(12, 0, '', { ...this.textStyle(11, '#ffffff'), align: 'center' })
      .setOrigin(0.5)
      .setStroke('#17347e', 3);
    const clickZone = this.add.zone(0, 0, 174, 30).setInteractive();
    button.add([background, yarn, labelText, clickZone]);
    clickZone.on('pointerup', () => {
      this.shopPointerHandled = true;
      this.selectNextSpeedMultiplier();
    });
    clickZone.on('pointerover', () => {
      this.tweens.add({ targets: button, y: 207, duration: 90, ease: 'Sine.easeOut' });
    });
    clickZone.on('pointerout', () => {
      this.tweens.add({ targets: button, y: 211, duration: 90, ease: 'Sine.easeOut' });
    });
    this.overlay.add(button);
    this.launchUiElements.push(button);
    this.speedButtons.push({ option, container: button, background, yarn, labelText });

    this.updateSpeedUi();
  }

  private selectNextSpeedMultiplier() {
    const currentIndex = SPEED_OPTIONS.findIndex((option) => option.multiplier === this.speedMultiplier);
    const nextOption = SPEED_OPTIONS[(currentIndex + 1) % SPEED_OPTIONS.length] ?? SPEED_OPTIONS[0];
    this.setSpeedMultiplier(nextOption.multiplier);
  }

  private setSpeedMultiplier(multiplier: number) {
    if (this.phase !== 'start') return;
    this.speedMultiplier = multiplier;
    GameStateService.setSpeedMultiplier(multiplier);
    this.speed = this.getStartingSpeed();
    playBasketSound('equip');
    this.updateSpeedUi();
    this.floatText(optionLabelForMultiplier(multiplier), GAME_WIDTH / 2, 160, '#fff2a1');
  }

  private createModeSelector() {
    this.modeButtons = [
      this.createModeButton(-104, 110, 'milk-run', 'Milk Run'),
      this.createModeButton(104, 110, 'farm-for-yarn', 'Farm for Yarn')
    ];
    this.updateModeUi();
  }

  private createModeButton(x: number, y: number, mode: RunMode, label: string) {
    const button = this.add.container(x, y);
    const background = this.add.graphics();
    const icon = this.add.graphics();
    const labelText = this.add.text(22, 0, label, this.textStyle(label.length > 10 ? 13 : 14, '#ffffff')).setOrigin(0.5).setStroke('#17347e', 4);
    const clickZone = this.add.zone(0, 0, 190, 38).setInteractive();
    button.add([background, icon, labelText, clickZone]);
    clickZone.on('pointerup', () => {
      this.shopPointerHandled = true;
      this.setRunMode(mode);
    });
    clickZone.on('pointerover', () => {
      this.tweens.add({ targets: button, y: 105, duration: 90, ease: 'Sine.easeOut' });
    });
    clickZone.on('pointerout', () => {
      this.tweens.add({ targets: button, y: 110, duration: 90, ease: 'Sine.easeOut' });
    });
    this.overlay.add(button);
    this.runUiElements.push(button);
    return { mode, container: button, background, icon, labelText };
  }

  private setRunMode(mode: RunMode) {
    if (this.phase !== 'start' || this.runMode === mode) return;
    this.runMode = mode;
    GameStateService.setRunMode(mode);
    this.saveShopState();
    this.updateModeUi();
    this.updateHud();
    this.floatText(mode === 'farm-for-yarn' ? 'Farm for Yarn' : 'Milk Run', GAME_WIDTH / 2, 160, '#fff2a1');
    playBasketSound('equip');
  }

  private createAudioSettings() {
    this.audioToggleButtons = [
      this.createAudioToggleButton(300, -118, 'sound-fx', 'SFX'),
      this.createAudioToggleButton(300, -84, 'music', 'Music')
    ];
    this.audioVolumeSlider = this.createAudioVolumeSlider(300, -50);
    this.updateAudioUi();
  }

  private createAudioToggleButton(x: number, y: number, id: AudioToggleId, label: string) {
    const button = this.add.container(x, y);
    const background = this.add.graphics();
    const knob = this.add.graphics();
    const labelText = this.add.text(-72, 0, label, this.textStyle(12, '#ffffff')).setOrigin(0, 0.5).setStroke('#17347e', 3);
    const clickZone = this.add.zone(0, 0, 154, 30).setInteractive();
    button.add([background, knob, labelText, clickZone]);
    clickZone.on('pointerup', () => {
      this.shopPointerHandled = true;
      this.toggleAudioSetting(id);
    });
    clickZone.on('pointerover', () => this.drawAudioToggleButton({ id, container: button, background, knob, labelText }, true));
    clickZone.on('pointerout', () => this.drawAudioToggleButton({ id, container: button, background, knob, labelText }, false));
    this.overlay.add(button);
    this.shopUiElements.push(button);
    const audioButton = { id, container: button, background, knob, labelText };
    this.audioToggleButtons.push(audioButton);
    return audioButton;
  }

  private createAudioVolumeSlider(x: number, y: number) {
    const slider = this.add.container(x, y);
    const track = this.add.graphics();
    const fill = this.add.graphics();
    const knob = this.add.graphics();
    const labelText = this.add.text(-72, -1, '', this.textStyle(12, '#ffffff')).setOrigin(0, 0.5).setStroke('#17347e', 3);
    const clickZone = this.add.zone(24, 0, 104, 28).setInteractive({ draggable: true });
    slider.add([track, fill, knob, labelText, clickZone]);
    const updateFromPointer = (pointer: Phaser.Input.Pointer) => {
      const local = new Phaser.Math.Vector2();
      slider.getWorldTransformMatrix().applyInverse(pointer.x, pointer.y, local);
      this.setAudioVolume((local.x + 28) / 112);
    };
    clickZone.on('pointerdown', updateFromPointer);
    clickZone.on('drag', updateFromPointer);
    this.overlay.add(slider);
    this.shopUiElements.push(slider);
    return { container: slider, track, fill, knob, labelText };
  }

  private toggleAudioSetting(id: AudioToggleId) {
    if (id === 'sound-fx') {
      AudioSettingsService.toggleSoundFx();
    } else {
      AudioSettingsService.toggleMusic();
    }
    this.syncAudioSettingsFromService();
    this.saveShopState();
    this.updateAudioUi();
    playBasketSound('equip');
  }

  private setAudioVolume(value: number) {
    AudioSettingsService.setVolume(Phaser.Math.Clamp(value, 0, 1));
    this.syncAudioSettingsFromService();
    this.saveShopState();
    this.updateAudioUi();
  }

  private applyAudioSettings() {
    AudioSettingsService.apply();
    this.syncAudioSettingsFromService();
  }

  private updateAudioUi() {
    this.audioToggleButtons.forEach((button) => this.drawAudioToggleButton(button));
    this.drawAudioVolumeSlider();
  }

  private syncAudioSettingsFromService() {
    this.soundFxEnabled = AudioSettingsService.isSoundFxEnabled();
    this.musicEnabled = AudioSettingsService.isMusicEnabled();
    this.audioVolume = AudioSettingsService.getVolume();
  }

  private drawAudioToggleButton(button: AudioToggleButton, hovered = false) {
    const enabled = button.id === 'sound-fx' ? this.soundFxEnabled : this.musicEnabled;
    button.background.clear();
    button.background.fillStyle(enabled ? 0x53d36d : 0x17347e, hovered ? 1 : 0.9);
    button.background.fillRoundedRect(10, -11, 48, 22, 11);
    button.background.lineStyle(hovered ? 4 : 3, 0xffffff, 0.78);
    button.background.strokeRoundedRect(10, -11, 48, 22, 11);
    button.knob.clear();
    button.knob.fillStyle(0xffffff, 1);
    button.knob.fillCircle(enabled ? 47 : 21, 0, 7);
    button.labelText.setColor(enabled ? '#ffffff' : '#dff7ff');
  }

  private drawAudioVolumeSlider() {
    if (!this.audioVolumeSlider) return;
    const { track, fill, knob, labelText } = this.audioVolumeSlider;
    const width = 112;
    const x = -28;
    const knobX = x + width * this.audioVolume;
    labelText.setText(`Vol ${Math.round(this.audioVolume * 100)}%`);
    track.clear();
    track.fillStyle(0x17347e, 0.88);
    track.fillRoundedRect(x, -5, width, 10, 5);
    track.lineStyle(3, 0xffffff, 0.72);
    track.strokeRoundedRect(x, -5, width, 10, 5);
    fill.clear();
    fill.fillStyle(0xfff06a, 1);
    fill.fillRoundedRect(x, -5, Math.max(8, width * this.audioVolume), 10, 5);
    knob.clear();
    knob.fillStyle(0xffffff, 1);
    knob.fillCircle(knobX, 0, 9);
    knob.lineStyle(3, 0x17347e, 0.92);
    knob.strokeCircle(knobX, 0, 9);
  }

  private updateModeUi() {
    for (const button of this.modeButtons) {
      const selected = button.mode === this.runMode;
      button.labelText.setColor('#ffffff');
      this.drawModeButton(button, selected);
    }
  }

  private drawModeButton(button: ModeButton, selected: boolean) {
    button.background.clear();
    button.background.fillStyle(selected ? 0xff7aa8 : 0x17347e, selected ? 0.98 : 0.84);
    button.background.fillRoundedRect(-95, -19, 190, 38, 14);
    button.background.lineStyle(selected ? 5 : 3, selected ? 0xfff06a : 0xffffff, selected ? 1 : 0.76);
    button.background.strokeRoundedRect(-95, -19, 190, 38, 14);

    button.icon.clear();
    if (button.mode === 'farm-for-yarn') {
      button.icon.fillStyle(0xff5aa7, 1);
      button.icon.fillCircle(-67, -2, 10);
      button.icon.fillStyle(0x63c6ff, 1);
      button.icon.fillCircle(-58, 4, 9);
      button.icon.fillStyle(0xae72ff, 1);
      button.icon.fillCircle(-73, 8, 8);
      button.icon.lineStyle(3, 0xffffff, 0.76);
      button.icon.strokeCircle(-67, -2, 10);
      button.icon.strokeCircle(-58, 4, 9);
      button.icon.strokeCircle(-73, 8, 8);
      return;
    }
    button.icon.fillStyle(0xffffff, 0.95);
    button.icon.fillRoundedRect(-74, -11, 20, 23, 6);
    button.icon.fillStyle(0xbfefff, 1);
    button.icon.fillRoundedRect(-70, -5, 12, 13, 4);
    button.icon.lineStyle(3, 0xfff06a, 0.95);
    button.icon.strokeRoundedRect(-74, -11, 20, 23, 6);
  }

  private setSelectedLevel(levelId: LevelId) {
    if (this.phase !== 'start' || this.selectedLevelId === levelId) return;
    this.selectedLevelId = levelId;
    GameStateService.setSelectedLevelId(levelId);
    this.createWorld();
    this.saveShopState();
    this.updateLevelUi();
    this.updateHud();
    this.floatText(this.getSelectedLevel().name, GAME_WIDTH / 2, 160, '#fff2a1');
    playBasketSound('equip');
  }

  private updateLevelUi() {
    for (const button of this.levelButtons) {
      const selected = button.option.id === this.selectedLevelId;
      button.numberText.setColor(selected ? '#fffad0' : '#dff7ff');
      button.titleText.setColor(selected ? '#ffffff' : '#eefcff');
      this.drawLevelButton(button, selected);
    }
  }

  private drawLevelButton(button: LevelButton, selected: boolean) {
    const { graphics, icon, option } = { graphics: button.background, icon: button.icon, option: button.option };
    graphics.clear();
    graphics.fillStyle(selected ? option.hudTint : 0x17347e, selected ? 0.98 : 0.82);
    graphics.fillRoundedRect(-89, -29, 178, 58, 15);
    graphics.lineStyle(selected ? 5 : 3, selected ? 0xfff06a : 0xffffff, selected ? 1 : 0.72);
    graphics.strokeRoundedRect(-89, -29, 178, 58, 15);

    icon.clear();
    icon.fillStyle(option.backgroundBand, selected ? 1 : 0.85);
    icon.fillCircle(-62, 0, 22);
    icon.lineStyle(selected ? 5 : 4, selected ? 0xfff06a : 0xffffff, selected ? 1 : 0.78);
    icon.strokeCircle(-62, 0, 22);
    icon.fillStyle(option.laneMark, 0.95);
    icon.fillCircle(-72, -8, 5);
    icon.fillCircle(-51, 7, 4);
    icon.fillStyle(option.roadInner, 0.88);
    icon.fillRoundedRect(-72, 8, 20, 6, 3);
    icon.fillStyle(0xffffff, 0.42);
    icon.fillCircle(-55, -11, 6);
  }

  private updateSpeedUi() {
    for (const button of this.speedButtons) {
      const option = SPEED_OPTIONS.find((candidate) => candidate.multiplier === this.speedMultiplier) ?? SPEED_OPTIONS[1];
      button.option = option;
      this.drawSpeedButton(button.background, true, option.tint);
      button.labelText.setText(`${optionLabelForMultiplier(option.multiplier)} ▼`);
      button.labelText.setColor('#ffffff');
      button.yarn.setScale(0.34);
      button.yarn.setTint(option.tint);
      const spinDuration = Math.round(1800 / option.multiplier);
      const activeSpinDuration = button.yarn.getData('spinDuration') as number | undefined;
      if (this.phase === 'start' && activeSpinDuration !== spinDuration) {
        this.tweens.killTweensOf(button.yarn);
        button.yarn.setData('spinDuration', spinDuration);
        this.tweens.add({
          targets: button.yarn,
          angle: 360,
          duration: spinDuration,
          repeat: -1,
          ease: 'Linear'
        });
      } else if (this.phase !== 'start') {
        this.tweens.killTweensOf(button.yarn);
        button.yarn.setData('spinDuration', undefined);
        button.yarn.setAngle(0);
      }
    }
  }

  private drawSpeedButton(graphics: Phaser.GameObjects.Graphics, selected: boolean, tint: number) {
    graphics.clear();
    graphics.fillStyle(selected ? tint : 0x17347e, selected ? 0.96 : 0.88);
    graphics.fillRoundedRect(-87, -15, 174, 30, 11);
    graphics.lineStyle(selected ? 5 : 3, selected ? 0xfff06a : 0xffffff, selected ? 1 : 0.72);
    graphics.strokeRoundedRect(-87, -15, 174, 30, 11);
    graphics.fillStyle(0xffffff, selected ? 0.34 : 0.12);
    graphics.fillCircle(-70, 0, 11);
  }

  private createParticles() {
    this.emitter = this.add.particles(0, 0, ASSETS.sparkle, {
      lifespan: 520,
      speed: { min: 65, max: 165 },
      scale: { start: 0.7, end: 0 },
      rotate: { min: -120, max: 120 },
      emitting: false
    }).setDepth(DEPTHS.effects);
  }

  private bindInput() {
    this.input.keyboard!.addCapture('SPACE');
    this.input.keyboard!.on('keydown-SPACE', () => this.handleSpace());
    this.input.keyboard!.on('keydown-LEFT', () => this.moveLane(-1));
    this.input.keyboard!.on('keydown-RIGHT', () => this.moveLane(1));
    this.input.keyboard!.on('keydown-A', () => this.moveLane(-1));
    this.input.keyboard!.on('keydown-D', () => this.moveLane(1));
    this.input.keyboard!.on('keydown-P', () => this.togglePauseRun());
    this.input.keyboard!.on('keydown-ESC', () => this.togglePauseRun());

    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
      if (this.phase === 'start' && this.overlayMode === 'shop') {
        this.shopRenderer.scrollBy(deltaY * 0.72);
      }
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.phase === 'start' && this.overlayMode === 'shop' && Phaser.Geom.Rectangle.Contains(new Phaser.Geom.Rectangle(70, 455, 120, 38), pointer.x, pointer.y)) {
        this.navigateToLaunch();
        return;
      }
      this.laneSwipeStart = new Phaser.Math.Vector2(pointer.x, pointer.y);
      if (this.phase === 'start' && this.overlayMode === 'shop') {
        this.shopRenderer.startDrag(pointer);
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.phase === 'start' && this.overlayMode === 'shop') {
        this.shopRenderer.endDrag();
        if (Phaser.Geom.Rectangle.Contains(new Phaser.Geom.Rectangle(70, 455, 120, 38), pointer.x, pointer.y)) {
          this.laneSwipeStart = undefined;
          this.navigateToLaunch();
          return;
        }
      }
      if (!this.laneSwipeStart) return;
      const deltaX = pointer.x - this.laneSwipeStart.x;
      const deltaY = pointer.y - this.laneSwipeStart.y;
      this.laneSwipeStart = undefined;

      if (this.phase !== 'playing') {
        this.shopPointerHandled = false;
        return;
      }

      if (Math.abs(deltaX) > 24 && Math.abs(deltaX) > Math.abs(deltaY)) {
        this.moveLane(deltaX > 0 ? 1 : -1);
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.phase !== 'start' || this.overlayMode !== 'shop') return;
      this.shopRenderer.dragTo(pointer);
    });
  }

  private resetRunState() {
    this.phase = 'start';
    this.currentLane = this.getStartingLaneIndex();
    this.hearts = INITIAL_HEARTS;
    this.yarnScore = 0;
    this.speed = this.getStartingSpeed();
    this.distance = 0;
    this.spawnTimer = 0;
    this.yarnSpawnIndex = 0;
    this.farmYarnRowIndex = 0;
    this.speedBonusYarnProgress = 0;
    this.nextBlockedLane = undefined;
    this.invulnerableUntil = 0;
    this.laneSwipeStart = undefined;
    this.controlsLocked = false;
    this.hasCrazyHair = false;
    this.pawTrailTimer = 0;
    this.displayedProgress = 0;
    this.obstacleHits = 0;
    this.overlayMode = 'launch';
  }

  private loadShopState() {
    try {
      CosmeticService.load();
      GameStateService.load();
      AudioSettingsService.loadAndApply();
      this.speedMultiplier = GameStateService.getSpeedMultiplier();
      this.selectedLevelId = GameStateService.getSelectedLevelId();
      ProgressService.load();
      if (this.runNodeId) ProgressService.setSelectedNode(this.runNodeId);
      this.selectedMapNodeId = ProgressService.getSelectedNodeId();
      this.selectedLevelId = getWorldForNode(this.getSelectedMapNode()).themeKey;
      GameStateService.setSelectedLevelId(this.selectedLevelId);
      this.runMode = GameStateService.getRunMode();
      this.syncAudioSettingsFromService();
      this.speed = this.getStartingSpeed();
    } catch {
      CosmeticService.load();
      GameStateService.load();
      AudioSettingsService.loadAndApply();
      this.speedMultiplier = GameStateService.getSpeedMultiplier();
      this.selectedLevelId = GameStateService.getSelectedLevelId();
      this.selectedMapNodeId = MAP_NODES[0].id;
      ProgressService.load();
      if (this.runNodeId) ProgressService.setSelectedNode(this.runNodeId);
      this.runMode = GameStateService.getRunMode();
      this.syncAudioSettingsFromService();
      this.speed = this.getStartingSpeed();
    }
  }

  private saveShopState() {
    CosmeticService.save();
    GameStateService.setSelectedLevelId(this.selectedLevelId);
    GameStateService.setRunMode(this.runMode);
    GameStateService.setSpeedMultiplier(this.speedMultiplier);
    AudioSettingsService.save();
    ProgressService.save();
  }

  private handleSpace() {
    if (this.phase === 'start') {
      if (this.overlayMode === 'shop') {
        this.navigateToLaunch();
      } else if (this.overlayMode === 'map') {
        this.navigateToLaunch();
      } else {
        this.navigateToRun();
      }
    } else if (this.phase === 'paused') {
      this.resumeRun();
    } else if (this.phase === 'won' || this.phase === 'lost') {
      this.restartGame();
    }
  }

  private togglePauseRun() {
    if (this.phase === 'playing') {
      this.pauseRun();
    } else if (this.phase === 'paused') {
      this.resumeRun();
    }
  }

  private pauseRun() {
    if (this.phase !== 'playing') return;
    this.phase = 'paused';
    this.pauseButton.setVisible(false);
    this.tweens.pauseAll();
    this.showPauseOverlay();
    playBasketSound('equip');
  }

  private resumeRun() {
    if (this.phase !== 'paused') return;
    this.clearPauseUi();
    this.phase = 'playing';
    this.pauseButton.setVisible(true);
    this.tweens.resumeAll();
    playBasketSound('equip');
  }

  private catNapExitRun() {
    if (this.phase !== 'paused') return;
    this.clearPauseUi();
    this.tweens.resumeAll();
    if (this.useSceneNavigation) {
      this.navigateToLaunch();
      return;
    }
    this.resetToStartScreen();
    this.floatText('Cat nap', GAME_WIDTH / 2, 150, '#fff2a1');
    playBasketSound('equip');
  }

  private showPauseOverlay() {
    this.clearPauseUi();
    const panel = this.add.graphics().setDepth(DEPTHS.overlay + 2);
    panel.fillStyle(0x17347e, 0.92);
    panel.fillRoundedRect(GAME_WIDTH / 2 - 210, GAME_HEIGHT / 2 - 120, 420, 240, 24);
    panel.lineStyle(5, 0xffffff, 0.88);
    panel.strokeRoundedRect(GAME_WIDTH / 2 - 210, GAME_HEIGHT / 2 - 120, 420, 240, 24);
    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 68, 'PAUSED', this.textStyle(34, '#ffffff'))
      .setOrigin(0.5)
      .setStroke('#17347e', 7)
      .setDepth(DEPTHS.overlay + 3);
    const subtitle = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 22, 'Kitty is taking a tiny stretch.', this.textStyle(16, '#dff7ff'))
      .setOrigin(0.5)
      .setStroke('#17347e', 4)
      .setDepth(DEPTHS.overlay + 3);
    const resumeButton = this.createFloatingButton(GAME_WIDTH / 2 - 86, GAME_HEIGHT / 2 + 54, 132, 44, 'Resume', 0x53d36d, () => this.resumeRun());
    const napButton = this.createFloatingButton(GAME_WIDTH / 2 + 86, GAME_HEIGHT / 2 + 54, 132, 44, 'Cat Nap', 0xffd166, () => this.catNapExitRun());
    this.pauseUiElements.push(panel, title, subtitle, resumeButton, napButton);
  }

  private createFloatingButton(x: number, y: number, width: number, height: number, label: string, color: number, onClick: () => void) {
    const button = new PixelButton({
      scene: this,
      x,
      y,
      width,
      height,
      label,
      color,
      fontSize: 17,
      depth: DEPTHS.overlay + 4,
      textStyle: (fontSize, textColor) => this.textStyle(fontSize, textColor),
      onClick
    });
    return button.container;
  }

  private restartGame() {
    if (this.phase !== 'won' && this.phase !== 'lost') return;
    if (this.useSceneNavigation && this.scene.key === 'RunScene') {
      this.scene.restart();
      return;
    }
    this.resetToStartScreen();
  }

  private startNextLevelFromResult() {
    if (this.phase !== 'won') return;
    this.resetToStartScreen();
    this.startGame();
  }

  private resetToStartScreen() {
    this.obstacles.clear(true, true);
    this.yarns.clear(true, true);
    this.pawPrints.clear(true, true);
    this.clearEndUi();
    this.clearPauseUi();
    this.celebrationObjects.forEach((object) => object.destroy());
    this.celebrationObjects = [];
    this.tweens.killTweensOf([this.cat, this.roombaMount, this.crazyHair, this.milkBottle, this.titleText, this.instructionText]);
    this.time.removeAllEvents();

    this.resetRunState();
    this.createWorld();
    this.cat.setPosition(this.getLaneX(this.currentLane), CAT_Y).setScale(0.95).setAlpha(1).setAngle(0).setVisible(true);
    this.cat.setTexture(this.getSelectedCosmetic().run1);
    this.roombaMount.setVisible(false).setAngle(0);
    this.crazyHair.setVisible(false);
    this.finishLine.setVisible(true).setPosition(GAME_WIDTH / 2, CAT_Y - this.getRunRecipe().finishDistance);
    this.milkBottle.setVisible(true).setPosition(GAME_WIDTH / 2, CAT_Y - this.getRunRecipe().finishDistance - 120);
    this.overlay.setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2).setAlpha(1).setVisible(true);
    this.pauseButton.setVisible(false);
    this.startCatBob();
    this.startRunAnimationTimer();
    this.showOverlayMode(this.initialSceneMode === 'run' ? 'launch' : this.initialSceneMode);
    this.updateHud();
  }

  private startGame() {
    if (this.phase !== 'start') return;
    const selectedNode = this.getCurrentRunNode();
    if (!this.isMapNodePlayable(selectedNode)) {
      this.floatText('Needs more milk', GAME_WIDTH / 2, 150, '#fff2a1');
      playBasketSound('deny');
      return;
    }
    ProgressService.setSelectedNode(selectedNode.id);
    this.selectedMapNodeId = ProgressService.getSelectedNodeId();
    this.selectedLevelId = getWorldForNode(selectedNode).themeKey;
    GameStateService.setSelectedLevelId(this.selectedLevelId);
    this.phase = 'countdown';
    this.speed = this.getStartingSpeed();
    this.cat.setTexture(this.getSelectedCosmetic().run1);
    this.hasCrazyHair = false;
    this.crazyHair.setVisible(false);
    this.updateRoombaMount();
    playGameSound(this, 'start');
    this.startCountdownSequence();
  }

  private startCountdownSequence() {
    this.overlay.setVisible(false);
    const countdownText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '3', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '112px',
        color: '#ffffff',
        align: 'center'
      })
      .setOrigin(0.5)
      .setStroke('#17347e', 12)
      .setDepth(DEPTHS.overlay + 1);
    const steps = ['3', '2', '1', 'GO!'];
    let index = 0;
    const showStep = () => {
      countdownText.setText(steps[index]);
      countdownText.setScale(0.55).setAlpha(1);
      this.tweens.add({
        targets: countdownText,
        scale: 1,
        alpha: 0.18,
        duration: 620,
        ease: 'Back.easeOut',
        onComplete: () => {
          index += 1;
          if (index < steps.length) {
            showStep();
            return;
          }
          countdownText.destroy();
          this.phase = 'playing';
          this.pauseButton.setVisible(true);
          this.startCatBob();
        }
      });
    };
    showStep();
  }

  private scrollWorld(dt: number) {
    for (const child of this.scrollables.getChildren()) {
      const item = child as Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject;
      const scrollSpeed = item.getData('scrollSpeed') as number;
      item.y += this.speed * dt * scrollSpeed;
      if (item.y > GAME_HEIGHT + 86) item.y = -86;
    }
  }

  private spawnObstacle() {
    const recipe = this.getRunRecipe();
    if (this.distance > recipe.finishDistance - recipe.finishSpawnBuffer) return;
    const lane = this.pickSafeLane(this.obstacles, this.yarns, -70, true);
    if (lane === undefined) return;
    const obstacleRecipe = pickWeightedObstacle(recipe.obstacles, this.distance);
    if (!obstacleRecipe) return;
    const obstacle = this.add.image(this.getLaneX(lane), -70, obstacleRecipe.asset) as RunnerSprite;
    obstacle.laneIndex = lane;
    obstacle.kind = obstacleRecipe.id;
    obstacle.setDepth(DEPTHS.obstacles);
    obstacle.setScale(obstacleRecipe.scale);
    obstacle.setData('hitRadiusX', obstacleRecipe.hitRadiusX);
    obstacle.setData('hitRadiusY', obstacleRecipe.hitRadiusY);
    this.obstacles.add(obstacle);
    this.nextBlockedLane = lane;

    this.tweens.add({
      targets: obstacle,
      angle: obstacleRecipe.wobbleAngle,
      duration: obstacleRecipe.wobbleDurationMs,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private spawnDueYarn() {
    const recipe = this.getRunRecipe();
    while (this.yarnSpawnIndex < recipe.maxYarn && this.distance >= this.getYarnSpawnDistance(this.yarnSpawnIndex, recipe)) {
      if (!this.spawnYarn()) return;
      this.yarnSpawnIndex += 1;
    }
  }

  private spawnFarmYarnRows() {
    while (this.yarnScore < FARM_YARN_GOAL && this.distance >= FARM_YARN_FIRST_ROW_DISTANCE + this.farmYarnRowIndex * FARM_YARN_ROW_SPACING) {
      this.getLaneIndexes().forEach((lane) => this.spawnYarnInLane(lane, -50));
      this.farmYarnRowIndex += 1;
    }
  }

  private getYarnSpawnDistance(index: number, recipe: RunLevelRecipe) {
    const usableDistance = recipe.finishDistance - recipe.yarnStartDistance - recipe.yarnFinishPadding;
    if (recipe.maxYarn <= 1) return recipe.yarnStartDistance;
    return recipe.yarnStartDistance + (usableDistance * index) / (recipe.maxYarn - 1);
  }

  private spawnYarn() {
    const recipe = this.getRunRecipe();
    if (this.distance > recipe.finishDistance - recipe.yarnFinishPadding) return false;
    const lane = this.pickSafeLane(this.yarns, this.obstacles, -50, false);
    if (lane === undefined) return false;
    this.spawnYarnInLane(lane, -50);
    return true;
  }

  private spawnYarnInLane(lane: number, y: number) {
    const texture = Phaser.Math.RND.pick(this.getRunRecipe().pickupAssets);
    const yarn = this.add.image(this.getLaneX(lane), y, texture) as RunnerSprite;
    yarn.laneIndex = lane;
    yarn.kind = 'yarn';
    yarn.setDepth(DEPTHS.pickups).setScale(0.88);
    this.yarns.add(yarn);

    this.tweens.add({
      targets: yarn,
      angle: 360,
      duration: 700,
      repeat: -1,
      ease: 'Linear'
    });
  }

  private pickSafeLane(
    sameKindGroup: Phaser.GameObjects.Group,
    blockingGroup: Phaser.GameObjects.Group,
    spawnY: number,
    avoidLastObstacle: boolean
  ) {
    let lanes = this.getLaneIndexes();
    if (avoidLastObstacle && this.nextBlockedLane !== undefined) {
      Phaser.Utils.Array.Remove(lanes, this.nextBlockedLane);
    }

    lanes = lanes.filter((lane) => {
      return (
        !this.hasNearbyRunnerInLane(blockingGroup, lane, spawnY, this.getRunRecipe().spawnClearanceY) &&
        !this.hasNearbyRunnerInLane(sameKindGroup, lane, spawnY, this.getRunRecipe().spawnClearanceY * 0.6)
      );
    });

    if (lanes.length === 0) return undefined;
    return Phaser.Math.RND.pick(lanes);
  }

  private hasNearbyRunnerInLane(group: Phaser.GameObjects.Group, lane: number, y: number, clearance: number) {
    return group.getChildren().some((child) => {
      const item = child as RunnerSprite;
      return item.active && item.laneIndex === lane && Math.abs(item.y - y) < clearance;
    });
  }

  private updateRunnerGroup(
    group: Phaser.GameObjects.Group,
    dt: number,
    time: number,
    hitFn: (item: RunnerSprite, time: number) => void
  ) {
    for (const child of group.getChildren()) {
      const item = child as RunnerSprite;
      item.y += this.speed * dt;

      if (this.finishLine.y > -40 && item.y < this.finishLine.y - 24) {
        item.destroy();
        continue;
      }

      if (item.y > GAME_HEIGHT + 90) {
        item.destroy();
        continue;
      }

      const hitRadiusX = (item.getData('hitRadiusX') as number | undefined) ?? 38;
      const hitRadiusY = (item.getData('hitRadiusY') as number | undefined) ?? 38;
      if (item.laneIndex === this.currentLane && Math.abs(item.x - this.cat.x) < hitRadiusX && Math.abs(item.y - CAT_Y) < hitRadiusY) {
        hitFn(item, time);
      }
    }
  }

  private hitObstacle(item: RunnerSprite, time: number) {
    if (time < this.invulnerableUntil || this.phase !== 'playing') return;
    this.obstacleHits += 1;
    if (item.kind === 'foil') {
      this.scareJumpFromFoil(item, time);
      return;
    }
    if (item.kind === 'vacuum') {
      this.vacuumCat(item, time);
      return;
    }
    this.invulnerableUntil = time + 700;
    item.destroy();
    this.hearts -= 1;
    playGameSound(this, 'catHit');
    this.updateHud();
    this.emitter.explode(12, this.cat.x, this.cat.y - 12);

    this.breakHeartIcon(this.hearts);
    this.cat.setTexture(this.getSelectedCosmetic().hit);
    this.cameras.main.shake(190, item.kind === 'cucumber' ? 0.016 : 0.011);
    this.tweens.killTweensOf(this.cat);
    this.tweens.add({
      targets: this.cat,
      angle: item.kind === 'cucumber' ? 360 : 16,
      x: this.cat.x + Phaser.Math.RND.pick([-12, 12]),
      duration: item.kind === 'cucumber' ? 360 : 90,
      yoyo: item.kind !== 'cucumber',
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.cat.angle = 0;
        this.cat.x = this.getLaneX(this.currentLane);
        this.cat.setTexture(this.getSelectedCosmetic().run1);
        if (this.phase === 'playing') {
          this.startCatBob();
        }
      }
    });

    if (this.hearts <= 0) {
      this.loseGame();
    }
  }

  private scareJumpFromFoil(item: RunnerSprite, time: number) {
    this.invulnerableUntil = time + 900;
    this.controlsLocked = true;
    const startX = this.cat.x;
    item.destroy();
    playGameSound(this, 'foilScare');
    this.cameras.main.shake(180, 0.014);
    this.emitter.explode(16, this.cat.x, this.cat.y - 18);
    this.floatText('Tinfoil!', this.cat.x, this.cat.y - 54, '#fff2a1');
    this.distance = Math.max(0, this.distance - 260);
    const possibleLanes = this.getLaneIndexes().filter((lane) => lane !== this.currentLane);
    this.currentLane = Phaser.Math.RND.pick(possibleLanes);
    const targetX = this.getLaneX(this.currentLane);
    this.tweens.killTweensOf(this.cat);
    this.cat.setTexture(this.getSelectedCosmetic().hit);
    this.tweens.add({
      targets: this.cat,
      x: targetX,
      y: CAT_Y + 74,
      angle: targetX > startX ? 22 : -22,
      duration: 180,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: this.cat,
          y: CAT_Y,
          angle: 0,
          duration: 190,
          ease: 'Bounce.easeOut',
          onComplete: () => {
            this.cat.setTexture(this.getSelectedCosmetic().run1);
            this.controlsLocked = false;
            this.startCatBob();
          }
        });
      }
    });
  }

  private vacuumCat(item: RunnerSprite, time: number) {
    this.invulnerableUntil = time + 1300;
    this.controlsLocked = true;
    const vacuumX = item.x;
    const vacuumY = item.y;
    item.destroy();
    playGameSound(this, 'vacuum');
    this.cameras.main.shake(260, 0.018);
    this.emitter.explode(18, vacuumX, vacuumY);
    this.floatText('WHOOOOSH!', vacuumX, vacuumY - 50, '#dff7ff');
    this.tweens.killTweensOf(this.cat);
    this.crazyHair.setVisible(false);
    this.tweens.add({
      targets: this.cat,
      x: vacuumX,
      y: vacuumY,
      scale: 0.2,
      alpha: 0.35,
      angle: 720,
      duration: 330,
      ease: 'Sine.easeIn',
      onComplete: () => {
        const possibleLanes = this.getLaneIndexes().filter((lane) => lane !== this.currentLane);
        this.currentLane = Phaser.Math.RND.pick(possibleLanes);
        this.cat.setPosition(this.getLaneX(this.currentLane), CAT_Y - 70).setScale(1.25).setAlpha(1).setAngle(-18);
        this.cat.setTexture(this.getSelectedCosmetic().hit);
        this.hasCrazyHair = true;
        this.crazyHair.setVisible(true);
        this.updateCrazyHair();
        this.tweens.add({
          targets: this.cat,
          y: CAT_Y,
          scale: 1,
          angle: 0,
          duration: 280,
          ease: 'Bounce.easeOut',
          onComplete: () => {
            this.cat.setTexture(this.getSelectedCosmetic().run1);
            this.controlsLocked = false;
            this.startCatBob();
            this.updateCrazyHair();
          }
        });
      }
    });
  }

  private breakHeartIcon(remainingHearts: number) {
    const heart = this.heartIcons[remainingHearts];
    if (!heart) return;
    heart.setTexture(ASSETS.heartBroken);
    this.tweens.add({
      targets: heart,
      scale: 1.35,
      angle: Phaser.Math.RND.pick([-18, 18]),
      duration: 90,
      yoyo: true,
      repeat: 2,
      ease: 'Back.easeOut',
      onComplete: () => {
        heart.setScale(1);
        heart.setAngle(0);
      }
    });
    this.emitter.explode(10, heart.x, heart.y);
  }

  private collectYarn(item: RunnerSprite) {
    if (this.phase !== 'playing') return;
    const x = item.x;
    const y = item.y;
    item.destroy();
    const yarnValue = this.isFarmForYarn()
      ? Math.min(this.getCollectedYarnValue(), Math.max(0, FARM_YARN_GOAL - this.yarnScore))
      : this.getCollectedYarnValue();
    if (yarnValue <= 0) return;
    this.yarnScore += yarnValue;
    CosmeticService.addYarn(yarnValue);
    this.saveShopState();
    this.speed = Math.min(this.getMaxSpeed(), this.speed + 5 * this.speedMultiplier);
    playBasketSound('collect');
    this.emitter.explode(16, x, y);
    this.floatText(`+${yarnValue} yarn`, x, y - 20, '#fff2a1');
    this.updateHud();
    if (this.isFarmForYarn() && this.yarnScore >= FARM_YARN_GOAL) {
      this.winGame();
    }
  }

  private getCollectedYarnValue() {
    if (this.speedMultiplier <= 1) return 1;
    this.speedBonusYarnProgress += this.speedMultiplier - 1;
    if (this.speedBonusYarnProgress < 2) return 1;
    this.speedBonusYarnProgress -= 2;
    return 2;
  }

  private moveLane(direction: number) {
    if (this.phase !== 'playing' || this.controlsLocked) return;
    const nextLane = Phaser.Math.Clamp(this.currentLane + direction, 0, this.getLaneLayout().lanes.length - 1);
    if (nextLane === this.currentLane) return;
    this.currentLane = nextLane;
    this.tweens.add({
      targets: this.cat,
      x: this.getLaneX(this.currentLane),
      duration: 130,
      ease: 'Back.easeOut'
    });
  }

  private updateRoombaMount() {
    if (!this.roombaMount) return;
    const ridingRoomba = CosmeticService.getSelectedAccessoryId() === 'roomba' && this.phase === 'playing' && !this.controlsLocked;
    this.roombaMount.setVisible(ridingRoomba);
    if (!ridingRoomba) return;
    this.roombaMount.setPosition(this.cat.x, this.cat.y + 36);
    this.roombaMount.setAngle(Math.sin(this.time.now / 90) * 3);
  }

  private updatePawTrail(delta: number) {
    if (this.controlsLocked) return;
    this.pawTrailTimer += delta;
    if (CosmeticService.getSelectedTrailId() === 'nyan-cat') {
      if (this.pawTrailTimer < 44) return;
      this.pawTrailTimer = 0;
      this.createRainbowTrailSegment();
      return;
    }

    if (this.pawTrailTimer < 115) return;
    this.pawTrailTimer = 0;

    const print = this.add
      .image(this.cat.x + Phaser.Math.Between(-18, 18), this.cat.y + 38, ASSETS.paw)
      .setDepth(DEPTHS.trackDecor + 1)
      .setTint(0x68452c)
      .setAlpha(0.68)
      .setScale(Phaser.Math.FloatBetween(0.34, 0.48))
      .setAngle(Phaser.Math.Between(-25, 25));
    this.pawPrints.add(print);
    this.tweens.add({
      targets: print,
      y: print.y + 84,
      alpha: 0,
      scale: print.scale * 0.82,
      duration: 760,
      ease: 'Sine.easeOut',
      onComplete: () => print.destroy()
    });
  }

  private createRainbowTrailSegment() {
    const colors = [0xff3158, 0xff8a2a, 0xfff06a, 0x58db5d, 0x4dc7ff, 0xae72ff];
    const wobble = Math.sin(this.time.now / 120) * 4;
    const trail = this.add.graphics().setDepth(DEPTHS.player - 2).setPosition(this.cat.x + wobble, this.cat.y + 31);
    colors.forEach((color, index) => {
      trail.fillStyle(color, 0.92);
      trail.fillRoundedRect(-39 + index * 13, 0, 13, 74, 5);
    });
    trail.lineStyle(2, 0xffffff, 0.3);
    trail.strokeRoundedRect(-40, -1, 80, 76, 8);
    this.pawPrints.add(trail);
    this.tweens.add({
      targets: trail,
      y: trail.y + 96,
      alpha: 0,
      scaleX: 1.18,
      duration: 720,
      ease: 'Sine.easeOut',
      onComplete: () => trail.destroy()
    });

    if (Phaser.Math.Between(0, 1) === 0) {
      const sparkle = this.add
        .image(this.cat.x + Phaser.Math.Between(-48, 48), this.cat.y + Phaser.Math.Between(38, 92), ASSETS.sparkle)
        .setDepth(DEPTHS.player + 2)
        .setScale(Phaser.Math.FloatBetween(0.34, 0.62))
        .setTint(Phaser.Math.RND.pick(colors));
      this.pawPrints.add(sparkle);
      this.tweens.add({
        targets: sparkle,
        y: sparkle.y + 70,
        alpha: 0,
        angle: Phaser.Math.Between(-120, 120),
        duration: 620,
        ease: 'Sine.easeOut',
        onComplete: () => sparkle.destroy()
      });
    }
  }

  private emitNyanEquipBurst() {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;
    const colors = [0xff3158, 0xff8a2a, 0xfff06a, 0x58db5d, 0x4dc7ff, 0xae72ff];
    for (let index = 0; index < 36; index += 1) {
      const angle = (Math.PI * 2 * index) / 36;
      const sparkle = this.add
        .image(centerX, centerY, ASSETS.sparkle)
        .setDepth(DEPTHS.effects + 1)
        .setScale(Phaser.Math.FloatBetween(0.38, 0.78))
        .setTint(colors[index % colors.length]);
      this.tweens.add({
        targets: sparkle,
        x: centerX + Math.cos(angle) * 620,
        y: centerY + Math.sin(angle) * 390,
        alpha: 0,
        angle: 240,
        duration: 920,
        ease: 'Cubic.easeOut',
        onComplete: () => sparkle.destroy()
      });
    }
  }

  private updateFinish() {
    const finishY = CAT_Y - (this.getRunRecipe().finishDistance - this.distance);
    this.finishLine.y = finishY;
    this.milkBottle.y = finishY - 120;
  }

  private winGame() {
    if (this.phase !== 'playing') return;
    this.phase = 'won';
    this.pauseButton.setVisible(false);
    const farmRun = this.isFarmForYarn();
    const perfectRun = !farmRun && this.obstacleHits === 0 && this.hearts === INITIAL_HEARTS;
    if (!farmRun) {
      this.recordMapLevelResult(perfectRun);
    }
    this.obstacles.clear(true, true);
    this.yarns.clear(true, true);
    playGameSound(this, 'win');
    playToneSet('win');
    this.cameras.main.flash(250, 255, 255, 210);

    const bowl = this.add.image(GAME_WIDTH / 2, 332, ASSETS.milkBowl).setDepth(DEPTHS.effects);
    this.celebrationObjects.push(bowl);
    this.cat.setPosition(GAME_WIDTH / 2 - 95, 388).setAngle(-4).setTexture(this.getSelectedCosmetic().run1);
    this.crazyHair.setVisible(false);
    this.roombaMount.setVisible(false);
    this.milkBottle.setVisible(!farmRun).setPosition(GAME_WIDTH / 2 + 110, 292);
    this.finishLine.setVisible(false);
    this.pawPrints.clear(true, true);

    this.showEndOverlay(
      farmRun ? 'YARN FARMED!' : perfectRun ? 'PUUURFECT!' : 'MILK FOUND!',
      farmRun ? 'Kitty filled the basket.' : 'Kitty got the milk.',
      perfectRun,
      farmRun ? 'PLAY AGAIN' : 'NEXT LEVEL',
      farmRun ? () => this.restartGame() : () => this.startNextLevelFromResult()
    );
    this.overlay.setY(GAME_HEIGHT / 2).setAlpha(1).setVisible(true);
    this.tweens.add({ targets: farmRun ? [this.cat, bowl] : [this.cat, bowl, this.milkBottle], y: '+=8', duration: 260, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.time.addEvent({
      delay: 180,
      repeat: 18,
      callback: () => this.emitter.explode(7, Phaser.Math.Between(330, 625), Phaser.Math.Between(175, 360))
    });
  }

  private recordMapLevelResult(perfectRun: boolean) {
    const node = this.getSelectedMapNode();
    ProgressService.completeRun(node.id, this.yarnScore, perfectRun);
    this.selectedMapNodeId = ProgressService.getSelectedNodeId();
    this.selectedLevelId = getWorldForNode(this.getSelectedMapNode()).themeKey;
    GameStateService.setSelectedLevelId(this.selectedLevelId);
    this.saveShopState();
    this.updateMapUi();
  }

  private loseGame() {
    if (this.phase === 'lost') return;
    this.phase = 'lost';
    this.pauseButton.setVisible(false);
    this.obstacles.clear(true, true);
    this.yarns.clear(true, true);
    this.cat.setTexture(this.getSelectedCosmetic().hit).setAngle(0);
    this.crazyHair.setVisible(false);
    this.roombaMount.setVisible(false);
    this.pawPrints.clear(true, true);
    this.showEndOverlay('OH NO!', 'The kitty got spooked.', false, 'TRY AGAIN', () => this.restartGame());
    this.overlay.setY(GAME_HEIGHT / 2).setAlpha(1).setVisible(true);
  }

  private showEndOverlay(title: string, message: string, perfectRun: boolean, primaryLabel: string, primaryAction: () => void) {
    this.clearEndUi();
    this.showOverlay(title, '');
    this.titleText.setPosition(0, -166).setFontSize(perfectRun ? 58 : 54).setScale(1);
    this.instructionText.setText('');

    const scoreLabel = this.add
      .text(0, -68, 'Yarn Collected', this.textStyle(22, '#fffad0'))
      .setOrigin(0.5)
      .setStroke('#17347e', 5);
    const scoreValue = this.add
      .text(0, -2, '0', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '72px',
        color: '#ffffff',
        align: 'center'
      })
      .setOrigin(0.5)
      .setStroke('#17347e', 9);
    const messageText = this.add
      .text(0, 62, message, this.textStyle(24, '#dff7ff'))
      .setOrigin(0.5)
      .setStroke('#17347e', 5);
    const primaryButton = this.createOverlayButton(-96, 142, 172, 48, primaryLabel, 0x53d36d, primaryAction);
    const homeButton = this.createOverlayButton(112, 142, 142, 48, 'HOME', 0xffd166, () => this.navigateToLaunch());
    this.overlay.add([scoreLabel, scoreValue, messageText, primaryButton, homeButton]);
    this.endUiElements.push(scoreLabel, scoreValue, messageText, primaryButton, homeButton);

    const scoreTween = { value: 0 };
    this.tweens.add({
      targets: scoreTween,
      value: this.yarnScore,
      duration: 850,
      ease: 'Cubic.easeOut',
      onUpdate: () => scoreValue.setText(String(Math.round(scoreTween.value))),
      onComplete: () => {
        scoreValue.setText(String(this.yarnScore));
        this.tweens.add({ targets: scoreValue, scale: 1.12, duration: 140, yoyo: true, ease: 'Back.easeOut' });
      }
    });

    if (perfectRun) {
      this.tweens.add({ targets: this.titleText, scale: 1.08, duration: 320, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.time.addEvent({
        delay: 140,
        repeat: 24,
        callback: () => this.emitter.explode(8, Phaser.Math.Between(255, 705), Phaser.Math.Between(92, 345))
      });
    }
  }

  private showOverlay(title: string, instructions: string) {
    this.titleText.setText(title);
    this.instructionText.setText(instructions);
    this.titleText.setPosition(0, -202).setFontSize(48).setScale(1);
    this.instructionText.setPosition(0, 204).setFontSize(22);
    this.setLaunchUiVisible(false);
    this.setShopUiVisible(false);
    this.setRunUiVisible(false);
    this.updateSpeedUi();
  }

  private clearEndUi() {
    this.endUiElements.forEach((element) => element.destroy());
    this.endUiElements = [];
  }

  private clearPauseUi() {
    this.pauseUiElements.forEach((element) => element.destroy());
    this.pauseUiElements = [];
  }

  private setShopUiVisible(visible: boolean) {
    this.shopUiElements.forEach((element) => element.setVisible(visible));
  }

  private setLaunchUiVisible(visible: boolean) {
    this.launchUiElements.forEach((element) => element.setVisible(visible));
  }

  private setRunUiVisible(visible: boolean) {
    this.runUiElements.forEach((element) => element.setVisible(visible));
  }

  private updateHud() {
    this.heartIcons.forEach((heart, index) => heart.setTexture(index < this.hearts ? ASSETS.heartFull : ASSETS.heartBroken));
    this.scoreText.setText(this.isFarmForYarn() ? `Farm yarn: ${this.yarnScore}/${FARM_YARN_GOAL}` : `Run yarn: ${this.yarnScore}`);
    this.basketText.setText(`Yarn basket: ${CosmeticService.getYarnBasket()}`);
    this.distanceText.setText(
      this.isFarmForYarn()
        ? `Farm for Yarn: ${this.getSelectedLevel().name}`
        : `World ${this.getSelectedLevel().order}: ${this.getSelectedLevel().name}`
    );
    const progress = this.isFarmForYarn()
      ? Phaser.Math.Clamp(this.yarnScore / FARM_YARN_GOAL, 0, 1)
      : Phaser.Math.Clamp(this.distance / this.getRunRecipe().finishDistance, 0, 1);
    this.displayedProgress += (progress - this.displayedProgress) * 0.18;
    if (Math.abs(progress - this.displayedProgress) < 0.002) this.displayedProgress = progress;
    this.drawProgressBar(this.displayedProgress);
    this.updateShopUi();
  }

  private drawProgressBar(progress: number) {
    const x = GAME_WIDTH - 252;
    const y = 58;
    const width = 214;
    const height = 24;
    this.progressBackground.clear();
    this.progressBackground.fillStyle(0x285a3a, 0.82);
    this.progressBackground.fillRoundedRect(x, y, width, height, 12);
    this.progressBackground.lineStyle(4, 0xffffff, 0.86);
    this.progressBackground.strokeRoundedRect(x, y, width, height, 12);

    this.progressFill.clear();
    const fillWidth = Math.max(12, (width - 8) * progress);
    this.progressFill.fillStyle(0xfff06a, 1);
    this.progressFill.fillRoundedRect(x + 4, y + 4, fillWidth, height - 8, 9);
    this.progressFill.fillStyle(0xffffff, 0.3);
    this.progressFill.fillRoundedRect(x + 10, y + 7, Math.max(0, fillWidth - 16), 5, 4);
  }

  protected override floatText(text: string, x: number, y: number, color: string) {
    const label = this.add.text(x, y, text, this.textStyle(18, color)).setOrigin(0.5).setDepth(DEPTHS.effects);
    this.tweens.add({
      targets: label,
      y: y - 34,
      alpha: 0,
      duration: 520,
      ease: 'Sine.easeOut',
      onComplete: () => label.destroy()
    });
  }

  private startCatBob() {
    this.tweens.killTweensOf(this.cat);
    this.cat.setY(CAT_Y);
    this.tweens.add({
      targets: this.cat,
      y: CAT_Y - 8,
      duration: 180,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private updateCrazyHair() {
    if (!this.crazyHair) return;
    this.crazyHair.setVisible(this.hasCrazyHair && this.phase === 'playing');
    if (!this.crazyHair.visible) return;
    this.crazyHair.setPosition(this.cat.x, this.cat.y - 38);
    this.crazyHair.setAngle(this.cat.angle);
    this.crazyHair.setScale(0.9 * this.cat.scaleX);
  }

  private getSelectedCosmetic() {
    return CosmeticService.getSelectedCosmetic();
  }

  private getSelectedAccessory() {
    return CosmeticService.getSelectedAccessory();
  }

  private getSelectedMouseOption() {
    return CosmeticService.getSelectedMouseOption();
  }

  private updateMouseCursor() {
    const mouse = this.getSelectedMouseOption();
    this.input.setDefaultCursor(`url(${mouse.cursorUrl}) ${mouse.hotSpot.x} ${mouse.hotSpot.y}, pointer`);
  }

  private getSelectedLevel() {
    return LEVELS.find((level) => level.id === this.selectedLevelId) ?? LEVELS[0];
  }

  private getCurrentRunConfig() {
    const nodeId = this.getSelectedMapNode().id;
    if (!this.cachedRunConfig || this.cachedRunConfigNodeId !== nodeId) {
      this.cachedRunConfig = buildRunConfig(nodeId);
      this.cachedRunConfigNodeId = nodeId;
    }
    return this.cachedRunConfig;
  }

  private getRunRecipe() {
    return this.getCurrentRunConfig().recipe;
  }

  private getLaneLayout(): LaneLayout {
    return this.getCurrentRunConfig().laneLayout;
  }

  private getLaneIndexes() {
    return this.getLaneLayout().lanes.map((_laneX, index) => index);
  }

  private getLaneX(laneIndex: number) {
    const lanes = this.getLaneLayout().lanes;
    return lanes[Phaser.Math.Clamp(laneIndex, 0, lanes.length - 1)];
  }

  private getStartingLaneIndex() {
    return Math.floor((this.getLaneLayout().lanes.length - 1) / 2);
  }

  private isFarmForYarn() {
    return this.runMode === 'farm-for-yarn';
  }

  private getStartingSpeed() {
    const recipe = this.getRunRecipe();
    return recipe.baseSpeed * this.speedMultiplier * recipe.speedMultiplier;
  }

  private getMaxSpeed() {
    return this.getRunRecipe().maxSpeed * this.speedMultiplier;
  }

  protected override textStyle(fontSize: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: `${fontSize}px`,
      color,
      stroke: '#183f33',
      strokeThickness: 5
    };
  }
}
