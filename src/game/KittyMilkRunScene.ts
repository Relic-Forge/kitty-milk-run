import Phaser from 'phaser';
import { ASSETS, loadGameAssets, type AssetKey } from './assets';
import {
  CAT_Y,
  DEPTHS,
  FINISH_DISTANCE,
  GAME_HEIGHT,
  GAME_WIDTH,
  INITIAL_HEARTS,
  INITIAL_SPEED,
  LANES,
  MAX_SPEED,
  OBSTACLE_SPAWN_MS,
  SPAWN_CLEARANCE_Y,
  type GamePhase,
  type ObstacleType
} from './constants';
import { playBasketSound, playGameSound, playToneSet, setAudioSettings } from './sound';

type RunnerSprite = Phaser.GameObjects.Image & {
  laneIndex?: number;
  kind?: ObstacleType | 'yarn';
};

type CosmeticOption = {
  id: string;
  name: string;
  cost: number;
  run1: string;
  run2: string;
  hit: string;
  style?: 'classic' | 'nyan';
};

type AccessoryOption = {
  id: string;
  name: string;
  cost: number;
  asset: string;
};

type TrailOption = {
  id: string;
  name: string;
  cost: number;
  asset: string;
};

type MouseOption = {
  id: string;
  name: string;
  cost: number;
  asset: string;
  cursorUrl: string;
  hotSpot: { x: number; y: number };
};

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

type SpeedOption = {
  label: string;
  multiplier: number;
  tint: number;
};

type SpeedButton = {
  option: SpeedOption;
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Graphics;
  yarn: Phaser.GameObjects.Image;
  labelText: Phaser.GameObjects.Text;
};

type RunMode = 'milk-run' | 'farm-for-yarn';

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

type LevelId = 'meadow' | 'magical-kingdom';

type LevelOption = {
  id: LevelId;
  name: string;
  order: number;
  tagline: string;
  backgroundColor: string;
  backgroundBand: number;
  roadOuter: number;
  roadInner: number;
  roadEdge: number;
  laneMark: number;
  hudTint: number;
  maxYarn: number;
  decorKeys: AssetKey[];
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

type OverlayMode = 'run' | 'shop';

type VisibleGameObject = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible;

const COSMETICS: CosmeticOption[] = [
  { id: 'tabby', name: 'Sunny Tabby', cost: 0, run1: ASSETS.catRun1, run2: ASSETS.catRun2, hit: ASSETS.catHit },
  { id: 'gray', name: 'Gray Moon', cost: 100, run1: ASSETS.catGrayRun1, run2: ASSETS.catGrayRun2, hit: ASSETS.catGrayHit },
  { id: 'pink', name: 'Pink Sparkle', cost: 135, run1: ASSETS.catPinkRun1, run2: ASSETS.catPinkRun2, hit: ASSETS.catPinkHit },
  { id: 'tux', name: 'Tuxedo Pop', cost: 175, run1: ASSETS.catTuxRun1, run2: ASSETS.catTuxRun2, hit: ASSETS.catTuxHit },
  { id: 'rainbow', name: 'Rainbow Scarf', cost: 250, run1: ASSETS.catRainbowRun1, run2: ASSETS.catRainbowRun2, hit: ASSETS.catRainbowHit },
  { id: 'nyan-cherry', name: 'Nyan Cat', cost: 1200, run1: ASSETS.catNyanCherry, run2: ASSETS.catNyanCherry, hit: ASSETS.catNyanCherry, style: 'nyan' }
];

const NYAN_VARIATIONS: CosmeticOption[] = [
  { id: 'nyan-cookies', name: 'Cookies n Creme', cost: 1200, run1: ASSETS.catNyanCookies, run2: ASSETS.catNyanCookies, hit: ASSETS.catNyanCookies, style: 'nyan' },
  { id: 'nyan-brown-sugar', name: 'Brown Sugar Cinnamon', cost: 1200, run1: ASSETS.catNyanBrownSugar, run2: ASSETS.catNyanBrownSugar, hit: ASSETS.catNyanBrownSugar, style: 'nyan' },
  { id: 'nyan-blueberry', name: 'Blueberry', cost: 1200, run1: ASSETS.catNyanBlueberry, run2: ASSETS.catNyanBlueberry, hit: ASSETS.catNyanBlueberry, style: 'nyan' },
  { id: 'nyan-strawberry', name: 'Strawberry Milkshake', cost: 1200, run1: ASSETS.catNyanStrawberry, run2: ASSETS.catNyanStrawberry, hit: ASSETS.catNyanStrawberry, style: 'nyan' },
  { id: 'nyan-maple', name: 'Frosted Maple Eggo', cost: 1200, run1: ASSETS.catNyanMaple, run2: ASSETS.catNyanMaple, hit: ASSETS.catNyanMaple, style: 'nyan' },
  { id: 'nyan-banana', name: 'Chocolate Banana Split', cost: 1200, run1: ASSETS.catNyanBanana, run2: ASSETS.catNyanBanana, hit: ASSETS.catNyanBanana, style: 'nyan' },
  { id: 'nyan-orange-cream', name: 'Orange Cream', cost: 1200, run1: ASSETS.catNyanOrangeCream, run2: ASSETS.catNyanOrangeCream, hit: ASSETS.catNyanOrangeCream, style: 'nyan' },
  { id: 'nyan-smores', name: 'Smores', cost: 1200, run1: ASSETS.catNyanSmores, run2: ASSETS.catNyanSmores, hit: ASSETS.catNyanSmores, style: 'nyan' },
  { id: 'nyan-chocolate-fudge', name: 'Chocolate Fudge', cost: 1200, run1: ASSETS.catNyanChocolateFudge, run2: ASSETS.catNyanChocolateFudge, hit: ASSETS.catNyanChocolateFudge, style: 'nyan' },
  { id: 'nyan-hot-fudge', name: 'Hot Fudge Sundae', cost: 1200, run1: ASSETS.catNyanHotFudge, run2: ASSETS.catNyanHotFudge, hit: ASSETS.catNyanHotFudge, style: 'nyan' },
  { id: 'nyan-wild-berry', name: 'Wild Berry', cost: 1200, run1: ASSETS.catNyanWildBerry, run2: ASSETS.catNyanWildBerry, hit: ASSETS.catNyanWildBerry, style: 'nyan' }
];

const ALL_COSMETICS = [...COSMETICS, ...NYAN_VARIATIONS];

const ACCESSORIES: AccessoryOption[] = [
  { id: 'roomba', name: 'Roomba Rider', cost: 320, asset: ASSETS.roomba }
];

const TRAILS: TrailOption[] = [
  { id: 'muddy-feet', name: 'Muddy Feet', cost: 0, asset: ASSETS.paw },
  { id: 'nyan-cat', name: 'Rainbow Trail', cost: 900, asset: ASSETS.nyanCat }
];

const DEFAULT_MOUSE_OPTION: MouseOption = {
  id: 'classic-mouse',
  name: 'Computer Mouse',
  cost: 0,
  asset: ASSETS.mouseCursor,
  cursorUrl: '/assets/mouse-cursor.svg',
  hotSpot: { x: 8, y: 14 }
};

const MOUSE_OPTIONS: MouseOption[] = [
  {
    id: 'rodent-mouse',
    name: 'Mouse',
    cost: 160,
    asset: ASSETS.mouseRodent,
    cursorUrl: '/assets/mouse-rodent.svg',
    hotSpot: { x: 8, y: 14 }
  },
  {
    id: 'cat-toys',
    name: 'Cat Toys',
    cost: 180,
    asset: ASSETS.mouseCatToys,
    cursorUrl: '/assets/mouse-cat-toys.svg',
    hotSpot: { x: 8, y: 14 }
  },
  {
    id: 'cat-nip',
    name: 'Cat Nip',
    cost: 230,
    asset: ASSETS.mouseCatNip,
    cursorUrl: '/assets/mouse-cat-nip.svg',
    hotSpot: { x: 8, y: 14 }
  },
  {
    id: 'scratching-post',
    name: 'Sideways Scratching Post',
    cost: 280,
    asset: ASSETS.mouseScratchingPost,
    cursorUrl: '/assets/mouse-scratching-post.svg',
    hotSpot: { x: 8, y: 14 }
  },
  {
    id: 'laser-red-dot',
    name: 'Laser Pointer Red Dot',
    cost: 500,
    asset: ASSETS.mouseLaserDot,
    cursorUrl: '/assets/mouse-laser-dot.svg',
    hotSpot: { x: 8, y: 14 }
  }
];

const ALL_MOUSE_OPTIONS = [DEFAULT_MOUSE_OPTION, ...MOUSE_OPTIONS];

const STORAGE_KEYS = {
  basket: 'kitty-milk-run:yarn-basket',
  selected: 'kitty-milk-run:selected-cat',
  unlocked: 'kitty-milk-run:unlocked-cats',
  selectedAccessory: 'kitty-milk-run:selected-accessory',
  unlockedAccessories: 'kitty-milk-run:unlocked-accessories',
  selectedTrail: 'kitty-milk-run:selected-trail',
  unlockedTrails: 'kitty-milk-run:unlocked-trails',
  selectedMouse: 'kitty-milk-run:selected-mouse',
  unlockedMouse: 'kitty-milk-run:unlocked-mouse',
  speed: 'kitty-milk-run:milk-speed',
  level: 'kitty-milk-run:selected-level',
  mode: 'kitty-milk-run:selected-mode',
  soundFx: 'kitty-milk-run:sound-fx-enabled',
  music: 'kitty-milk-run:music-enabled',
  audioVolume: 'kitty-milk-run:audio-volume'
} as const;

const SPEED_OPTIONS: SpeedOption[] = [
  { label: 'Loaf Mode\n0.5x', multiplier: 0.5, tint: 0x8fe8ff },
  { label: 'Purr Trot\n1x', multiplier: 1, tint: 0x7ef08d },
  { label: 'Zoomies\n1.5x', multiplier: 1.5, tint: 0xffd166 },
  { label: 'Turbo Floof\n2x', multiplier: 2, tint: 0xff7aa8 }
];

const LEVELS: LevelOption[] = [
  {
    id: 'meadow',
    name: 'Sunny Meadow',
    order: 1,
    tagline: 'Easy first run',
    backgroundColor: '#6fd660',
    backgroundBand: 0x92ee7d,
    roadOuter: 0xb9854e,
    roadInner: 0xd1a06a,
    roadEdge: 0xfef2bd,
    laneMark: 0xfff7d8,
    hudTint: 0x2d5fbd,
    maxYarn: 36,
    decorKeys: [ASSETS.flower, ASSETS.grassTuft, ASSETS.paw]
  },
  {
    id: 'magical-kingdom',
    name: 'Magical Kingdom',
    order: 2,
    tagline: 'Light airy fantasy',
    backgroundColor: '#bfefff',
    backgroundBand: 0xf8dcff,
    roadOuter: 0xd8c0ff,
    roadInner: 0xf7e6ff,
    roadEdge: 0xffffff,
    laneMark: 0xffdf7e,
    hudTint: 0x8c64cf,
    maxYarn: 36,
    decorKeys: [ASSETS.magicCloud, ASSETS.magicCrystal, ASSETS.magicMushroom, ASSETS.kingdomTower, ASSETS.starLantern]
  }
];

const YARN_START_DISTANCE = 480;
const YARN_FINISH_PADDING = 980;
const FARM_YARN_GOAL = 300;
const FARM_YARN_ROW_SPACING = 150;
const FARM_YARN_FIRST_ROW_DISTANCE = 250;

function optionLabelForMultiplier(multiplier: number) {
  return SPEED_OPTIONS.find((option) => option.multiplier === multiplier)?.label.replace('\n', ' ') ?? `${multiplier}x speed`;
}

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

export class KittyMilkRunScene extends Phaser.Scene {
  private cat!: Phaser.GameObjects.Image;
  private roombaMount!: Phaser.GameObjects.Image;
  private crazyHair!: Phaser.GameObjects.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'left' | 'right', Phaser.Input.Keyboard.Key>;
  private phase: GamePhase = 'start';
  private currentLane = 1;
  private hearts = INITIAL_HEARTS;
  private yarnScore = 0;
  private speed = INITIAL_SPEED;
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
  private yarnBasket = 0;
  private selectedCosmeticId = 'tabby';
  private selectedAccessoryId = 'none';
  private selectedTrailId = 'muddy-feet';
  private selectedMouseId = 'classic-mouse';
  private unlockedCosmetics = new Set<string>(['tabby']);
  private unlockedAccessories = new Set<string>();
  private unlockedTrails = new Set<string>(['muddy-feet']);
  private unlockedMouseOptions = new Set<string>(['classic-mouse']);
  private shopCards: ShopCard[] = [];
  private shopUiElements: VisibleGameObject[] = [];
  private shopScrollContainer!: Phaser.GameObjects.Container;
  private shopScrollMask!: Phaser.GameObjects.Graphics;
  private shopGeometryMask!: Phaser.Display.Masks.GeometryMask;
  private shopScrollElements: VisibleGameObject[] = [];
  private shopScrollY = 0;
  private shopScrollTarget = 0;
  private shopContentHeight = 0;
  private shopScrollbarTrack!: Phaser.GameObjects.Graphics;
  private shopScrollbarThumb!: Phaser.GameObjects.Graphics;
  private shopDragStartY: number | undefined;
  private shopDragStartScroll = 0;
  private shopSnapPoints: number[] = [0];
  private shopSectionTargets = new Map<string, number>();
  private shopSectionButtons: ShopSectionButton[] = [];
  private catGodButton!: CatGodButton;
  private catGodMode = false;
  private runUiElements: VisibleGameObject[] = [];
  private endUiElements: VisibleGameObject[] = [];
  private pauseUiElements: VisibleGameObject[] = [];
  private speedButtons: SpeedButton[] = [];
  private modeButtons: ModeButton[] = [];
  private levelButtons: LevelButton[] = [];
  private audioToggleButtons: AudioToggleButton[] = [];
  private audioVolumeSlider!: AudioVolumeSlider;
  private eyeTrackedCats: EyeTrackedCat[] = [];
  private speedMultiplier = 1;
  private selectedLevelId: LevelId = 'meadow';
  private runMode: RunMode = 'milk-run';
  private soundFxEnabled = true;
  private musicEnabled = true;
  private audioVolume = 0.8;
  private overlayMode: OverlayMode = 'run';
  private shopPointerHandled = false;
  private controlsLocked = false;
  private hasCrazyHair = false;
  private pawTrailTimer = 0;
  private displayedProgress = 0;
  private obstacleHits = 0;

  constructor() {
    super('KittyMilkRunScene');
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
  }

  update(time: number, delta: number) {
    this.updateEyeTrackedCats();
    this.updateSmoothShopScroll(delta);

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

    if (!this.isFarmForYarn() && this.spawnTimer >= OBSTACLE_SPAWN_MS) {
      this.spawnObstacle();
      this.spawnTimer = Phaser.Math.Between(-130, 120);
    }

    if (this.isFarmForYarn()) {
      this.spawnFarmYarnRows();
    } else {
      this.spawnDueYarn();
    }

    if (!this.isFarmForYarn() && this.distance >= FINISH_DISTANCE) {
      this.winGame();
    }
  }

  private createWorld() {
    const level = this.getSelectedLevel();
    this.scrollables.clear(false, false);
    this.worldObjects.clear(true, true);
    this.cameras.main.setBackgroundColor(level.backgroundColor);

    for (let y = -70; y <= GAME_HEIGHT + 90; y += 70) {
      const stripe = this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH, 34, level.backgroundBand, 0.42).setDepth(DEPTHS.background);
      this.addWorldObject(stripe, 0.42);
    }

    if (level.id === 'magical-kingdom') {
      this.createKingdomSkyline();
    }

    this.addWorldObject(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 548, GAME_HEIGHT + 30, level.roadOuter).setDepth(DEPTHS.track));
    this.addWorldObject(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 496, GAME_HEIGHT + 30, level.roadInner).setDepth(DEPTHS.track));
    this.addWorldObject(this.add.rectangle(220, GAME_HEIGHT / 2, 14, GAME_HEIGHT + 30, level.roadEdge, 0.95).setDepth(DEPTHS.trackDecor));
    this.addWorldObject(this.add.rectangle(740, GAME_HEIGHT / 2, 14, GAME_HEIGHT + 30, level.roadEdge, 0.95).setDepth(DEPTHS.trackDecor));

    for (const x of [395, 565]) {
      for (let y = -30; y < GAME_HEIGHT + 60; y += 72) {
        if (level.id === 'magical-kingdom') {
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
      const tower = this.add.image(x, 104, ASSETS.kingdomTower).setDepth(DEPTHS.background).setScale(x < GAME_WIDTH / 2 ? 1.08 : 0.96);
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
    this.cat = this.add.image(LANES[this.currentLane], CAT_Y, this.getSelectedCosmetic().run1).setDepth(DEPTHS.player).setScale(0.95);
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
    this.finishLine = this.add.container(GAME_WIDTH / 2, CAT_Y - FINISH_DISTANCE).setDepth(DEPTHS.finish);
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

    this.milkBottle = this.add.image(GAME_WIDTH / 2, CAT_Y - FINISH_DISTANCE - 120, ASSETS.milkBottle).setDepth(DEPTHS.finish);
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
    const selectedCosmetic = this.getSelectedCosmetic();
    const selectedCat = this.createEyeTrackedCat(-302, -78, selectedCosmetic.run1, selectedCosmetic.style === 'nyan' ? 0.82 : 0.7, selectedCosmetic.style === 'nyan');
    const selectedRoomba = this.add.image(-302, -46, ASSETS.roomba).setScale(0.4);
    const readyText = this.add
      .text(0, -124, 'Ready for a milk run?', this.textStyle(27, '#fffad0'))
      .setOrigin(0.5)
      .setStroke('#17347e', 5);
    const loadoutText = this.add
      .text(-302, -28, '', { ...this.textStyle(16, '#dff7ff'), align: 'center', wordWrap: { width: 176 } })
      .setOrigin(0.5)
      .setStroke('#17347e', 4);
    const startButton = this.createOverlayButton(0, 166, 240, 48, 'Start Run', 0x53d36d, () => this.startGame());
    const shopButton = this.createOverlayButton(0, 220, 150, 32, 'Shop', 0xffd166, () => this.showOverlayMode('shop'));
    this.runUiElements = [selectedCat.container, selectedRoomba, readyText, loadoutText, startButton];
    this.runUiElements.push(shopButton);
    selectedCat.container.setData('role', 'selectedCat');
    selectedRoomba.setData('role', 'selectedRoomba');
    loadoutText.setData('role', 'loadoutText');

    const shopTitle = this.add
      .text(-350, -150, 'Custom Kitty Shop', this.textStyle(24, '#fffad0'))
      .setOrigin(0, 0.5)
      .setStroke('#17347e', 5);
    this.shopBasketText = this.add
      .text(350, -150, '', { ...this.textStyle(22, '#dff7ff'), align: 'right' })
      .setOrigin(1, 0.5)
      .setStroke('#17347e', 5);
    const backButton = this.createOverlayButton(-350, 204, 120, 38, 'Back', 0xffd166, () => this.showOverlayMode('run'));

    this.overlay.add([backdrop, panel, this.titleText, this.instructionText, ...this.runUiElements, shopTitle, this.shopBasketText, backButton]);
    this.shopUiElements = [shopTitle, this.shopBasketText, backButton];
    this.createShopCards();
    this.createLevelSelector();
    this.createSpeedSelector();
    this.createModeSelector();
    this.createAudioSettings();
    this.updateShopUi();
    this.showOverlayMode('run');
  }

  private createShopCards() {
    this.shopCards = [];
    this.shopScrollElements = [];
    this.shopScrollY = 0;
    this.shopScrollTarget = 0;
    this.shopSnapPoints = [0];
    this.shopSectionTargets = new Map();
    this.shopSectionButtons = [];
    this.shopScrollContainer = this.add.container(0, SHOP_VIEWPORT.top);
    this.shopScrollMask = this.make.graphics({ x: 0, y: 0, add: false });
    this.shopScrollMask.fillStyle(0xffffff);
    this.shopScrollMask.fillRect(GAME_WIDTH / 2 + SHOP_VIEWPORT.left, GAME_HEIGHT / 2 + SHOP_VIEWPORT.top, SHOP_VIEWPORT.width, SHOP_VIEWPORT.height);
    this.shopGeometryMask = this.shopScrollMask.createGeometryMask();
    this.overlay.add(this.shopScrollContainer);
    this.shopUiElements.push(this.shopScrollContainer);

    let contentY = 18;
    contentY = this.createShopSection('Cats', ALL_COSMETICS, 'cat', contentY);
    contentY = this.createShopSection('Mouse', ALL_MOUSE_OPTIONS, 'mouse', contentY);
    contentY = this.createShopSection('Trails', TRAILS, 'trail', contentY);
    contentY = this.createShopSection('Accessories', ACCESSORIES, 'accessory', contentY);
    this.shopContentHeight = contentY + 18;
    const maxScroll = Math.max(0, this.shopContentHeight - SHOP_VIEWPORT.height);
    this.shopSnapPoints = [...new Set(this.shopSnapPoints.map((point) => Phaser.Math.Clamp(Math.round(point), 0, maxScroll)))].sort((a, b) => a - b);
    this.shopSectionTargets.forEach((target, label) => {
      this.shopSectionTargets.set(label, Phaser.Math.Clamp(Math.round(target), 0, maxScroll));
    });

    this.shopScrollbarTrack = this.add.graphics();
    this.shopScrollbarThumb = this.add.graphics();
    const navButtons = [
      this.createShopSectionButton('Cats', 'Cats', -76),
      this.createShopSectionButton('Mouse', 'Mouse', -35),
      this.createShopSectionButton('Trails', 'Trails', 6),
      this.createShopSectionButton('Accessories', 'Gear', 47)
    ];
    this.catGodButton = this.createCatGodButton(330, 204);
    this.overlay.add([this.shopScrollbarTrack, this.shopScrollbarThumb, ...navButtons, this.catGodButton.container]);
    this.shopUiElements.push(this.shopScrollbarTrack, this.shopScrollbarThumb, ...navButtons, this.catGodButton.container);
    this.setShopScroll(0);
  }

  private createShopSectionButton(label: string, shortLabel: string, y: number) {
    const target = this.shopSectionTargets.get(label) ?? 0;
    const container = this.add.container(-350, y);
    const background = this.add.graphics();
    const text = this.add
      .text(0, 0, shortLabel, this.textStyle(shortLabel.length > 5 ? 12 : 13, '#ffffff'))
      .setOrigin(0.5)
      .setStroke('#17347e', 4);
    const clickZone = this.add.zone(0, 0, 98, 38).setInteractive();
    container.add([background, text, clickZone]);
    clickZone.on('pointerup', () => {
      this.shopPointerHandled = true;
      this.setShopScrollTarget(target);
    });
    clickZone.on('pointerover', () => this.drawShopSectionButtons(label));
    clickZone.on('pointerout', () => this.drawShopSectionButtons());
    this.shopSectionButtons.push({ label, target, container, background, text });
    this.drawShopSectionButtons();
    return container;
  }

  private createShopSection(
    label: string,
    options: (CosmeticOption | AccessoryOption | TrailOption | MouseOption)[],
    kind: ShopCard['kind'],
    y: number
  ) {
    this.shopSectionTargets.set(label, Math.max(0, y - 18));
    const labelText = this.add
      .text(SHOP_VIEWPORT.left + 12, y, label, this.textStyle(19, '#fffad0'))
      .setOrigin(0, 0.5)
      .setStroke('#17347e', 4);
    labelText.setData('shopHalfHeight', 16);
    labelText.setMask(this.shopGeometryMask);
    this.shopScrollContainer.add(labelText);
    this.shopScrollElements.push(labelText);

    const columnWidth = SHOP_CARD.width + SHOP_CARD.gap;
    const rowStartX = SHOP_VIEWPORT.left + SHOP_CARD.width / 2 + 8;
    let row = 0;
    options.forEach((option, index) => {
      const column = index % SHOP_CARD.columns;
      row = Math.floor(index / SHOP_CARD.columns);
      const x = rowStartX + column * columnWidth;
      const cardY = y + 96 + row * (SHOP_CARD.height + 24);
      if (column === 0) this.shopSnapPoints.push(Math.max(0, cardY - SHOP_CARD.height / 2 - 8));
      this.createShopCard(option, kind, x, cardY);
    });

    return y + 132 + (row + 1) * (SHOP_CARD.height + 24);
  }

  private createShopCard(option: CosmeticOption | AccessoryOption | TrailOption | MouseOption, kind: ShopCard['kind'], x: number, y: number) {
    const card = this.add.container(x, y);
    const background = this.add.graphics();
    const preview = this.createShopPreview(option, kind);
    const nameText = this.add
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
    const priceText = this.add.text(0, 47, '', this.textStyle(12, '#fffad0')).setOrigin(0.5);
    const statusText = this.add.text(0, 63, '', this.textStyle(11, '#ffffff')).setOrigin(0.5);
    const clickZone = this.add.zone(0, 0, SHOP_CARD.width, SHOP_CARD.height).setInteractive();
    card.add([background, preview, nameText, priceText, statusText, clickZone]);
    [background, preview, nameText, priceText, statusText].forEach((element) => element.setMask(this.shopGeometryMask));
    card.setData('shopHalfHeight', SHOP_CARD.height / 2);
    clickZone.on('pointerup', () => {
      this.shopPointerHandled = true;
      if (kind === 'cat') this.buyOrEquipCat(option as CosmeticOption);
      if (kind === 'mouse') this.buyOrEquipMouse(option as MouseOption);
      if (kind === 'trail') this.buyOrEquipTrail(option as TrailOption);
      if (kind === 'accessory') this.buyOrEquipAccessory(option as AccessoryOption);
    });
    clickZone.on('pointerover', () => {
      this.tweens.add({ targets: card, scale: 1.035, duration: 90, ease: 'Sine.easeOut' });
    });
    clickZone.on('pointerout', () => {
      this.tweens.add({ targets: card, scale: 1, duration: 90, ease: 'Sine.easeOut' });
    });
    this.shopScrollContainer.add(card);
    this.shopScrollElements.push(card);
    this.shopCards.push({ option, kind, container: card, background, statusText, priceText });
  }

  private createShopPreview(option: CosmeticOption | AccessoryOption | TrailOption | MouseOption, kind: ShopCard['kind']) {
    if (kind === 'cat') {
      const cosmetic = option as CosmeticOption;
      return this.createEyeTrackedCat(0, -31, cosmetic.run1, cosmetic.style === 'nyan' ? 0.82 : 0.68, cosmetic.style === 'nyan').container;
    }
    const scale = option.id === 'nyan-cat' ? 0.8 : kind === 'mouse' ? 1.12 : kind === 'trail' ? 0.92 : 0.62;
    const y = option.id === 'nyan-cat' ? -36 : kind === 'trail' ? -41 : -42;
    return this.add.image(0, y, (option as AccessoryOption | TrailOption | MouseOption).asset).setScale(scale);
  }

  private createCatGodButton(x: number, y: number) {
    const button = this.add.container(x, y);
    const background = this.add.graphics();
    const icon = this.add.graphics();
    const labelText = this.add.text(30, -1, '', this.textStyle(13, '#ffffff')).setOrigin(0.5).setStroke('#17347e', 4);
    const clickZone = this.add.zone(0, 0, 146, 38).setInteractive();
    button.add([background, icon, labelText, clickZone]);
    clickZone.on('pointerup', () => {
      this.shopPointerHandled = true;
      this.toggleCatGodMode();
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
    const active = this.catGodMode;
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

  private createEyeTrackedCat(x: number, y: number, texture: string, scale: number, usesNyanArt = false): EyeTrackedCat {
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

  private setEyeTrackedCatTexture(container: Phaser.GameObjects.Container, cosmetic: CosmeticOption) {
    const trackedCat = this.eyeTrackedCats.find((cat) => cat.container === container);
    if (!trackedCat) return;
    const usesNyanArt = cosmetic.style === 'nyan';
    trackedCat.base.setTexture(cosmetic.run1);
    trackedCat.container.setScale(usesNyanArt ? 0.82 : 0.7);
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
      const button = this.add.container(-97 + index * 194, -42);
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
    const button = this.add.container(x, y);
    const background = this.add.graphics();
    const labelText = this.add.text(0, 0, label, this.textStyle(18, '#ffffff')).setOrigin(0.5).setStroke('#17347e', 5);
    const clickZone = this.add.zone(0, 0, width, height).setInteractive();
    button.add([background, labelText, clickZone]);
    const draw = (hovered = false) => {
      background.clear();
      background.fillStyle(color, hovered ? 1 : 0.94);
      background.fillRoundedRect(-width / 2, -height / 2, width, height, 16);
      background.lineStyle(hovered ? 5 : 4, 0xffffff, 0.86);
      background.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);
    };
    draw();
    clickZone.on('pointerup', () => {
      this.shopPointerHandled = true;
      onClick();
    });
    clickZone.on('pointerover', () => draw(true));
    clickZone.on('pointerout', () => draw(false));
    return button;
  }

  private buyOrEquipCat(option: CosmeticOption) {
    if (this.phase !== 'start') return;
    if (this.unlockedCosmetics.has(option.id) || this.catGodMode) {
      this.selectedCosmeticId = option.id;
      this.cat.setTexture(option.run1);
      this.updateRoombaMount();
      if (this.catGodMode && !this.unlockedCosmetics.has(option.id)) {
        this.floatText('Cat God equip', GAME_WIDTH / 2, 128, '#fff2a1');
      }
      playBasketSound('equip');
    } else if (this.yarnBasket >= option.cost) {
      this.yarnBasket -= option.cost;
      this.unlockedCosmetics.add(option.id);
      this.selectedCosmeticId = option.id;
      this.cat.setTexture(option.run1);
      this.updateRoombaMount();
      this.floatText('New kitty!', GAME_WIDTH / 2, 128, '#fff2a1');
      playBasketSound('buy');
    } else {
      this.floatText('Need more yarn', GAME_WIDTH / 2, 128, '#fff2a1');
      this.cameras.main.shake(90, 0.004);
      playBasketSound('deny');
    }
    this.saveShopState();
    this.updateHud();
  }

  private buyOrEquipAccessory(option: AccessoryOption) {
    if (this.phase !== 'start') return;
    if (this.unlockedAccessories.has(option.id) || this.catGodMode) {
      this.selectedAccessoryId = this.selectedAccessoryId === option.id ? 'none' : option.id;
      this.updateRoombaMount();
      if (this.catGodMode && !this.unlockedAccessories.has(option.id)) {
        this.floatText('Cat God equip', GAME_WIDTH / 2, 128, '#fff2a1');
      }
      playBasketSound('equip');
    } else if (this.yarnBasket >= option.cost) {
      this.yarnBasket -= option.cost;
      this.unlockedAccessories.add(option.id);
      this.selectedAccessoryId = option.id;
      this.updateRoombaMount();
      this.floatText('New ride!', GAME_WIDTH / 2, 128, '#fff2a1');
      playBasketSound('buy');
    } else {
      this.floatText('Need more yarn', GAME_WIDTH / 2, 128, '#fff2a1');
      this.cameras.main.shake(90, 0.004);
      playBasketSound('deny');
    }
    this.saveShopState();
    this.updateHud();
  }

  private buyOrEquipTrail(option: TrailOption) {
    if (this.phase !== 'start') return;
    if (this.unlockedTrails.has(option.id) || this.catGodMode) {
      this.selectedTrailId = option.id;
      if (option.id === 'nyan-cat') this.emitNyanEquipBurst();
      if (this.catGodMode && !this.unlockedTrails.has(option.id)) {
        this.floatText('Cat God equip', GAME_WIDTH / 2, 128, '#fff2a1');
      }
      playBasketSound('equip');
    } else if (this.yarnBasket >= option.cost) {
      this.yarnBasket -= option.cost;
      this.unlockedTrails.add(option.id);
      this.selectedTrailId = option.id;
      if (option.id === 'nyan-cat') this.emitNyanEquipBurst();
      this.floatText('New trail!', GAME_WIDTH / 2, 128, '#fff2a1');
      playBasketSound('buy');
    } else {
      this.floatText('Need more yarn', GAME_WIDTH / 2, 128, '#fff2a1');
      this.cameras.main.shake(90, 0.004);
      playBasketSound('deny');
    }
    this.saveShopState();
    this.updateHud();
  }

  private buyOrEquipMouse(option: MouseOption) {
    if (this.phase !== 'start') return;
    if (this.unlockedMouseOptions.has(option.id) || this.catGodMode) {
      this.selectedMouseId = option.id;
      this.updateMouseCursor();
      if (this.catGodMode && !this.unlockedMouseOptions.has(option.id)) {
        this.floatText('Cat God equip', GAME_WIDTH / 2, 128, '#fff2a1');
      }
      playBasketSound('equip');
    } else if (this.yarnBasket >= option.cost) {
      this.yarnBasket -= option.cost;
      this.unlockedMouseOptions.add(option.id);
      this.selectedMouseId = option.id;
      this.updateMouseCursor();
      this.floatText('New mouse!', GAME_WIDTH / 2, 128, '#fff2a1');
      playBasketSound('buy');
    } else {
      this.floatText('Need more yarn', GAME_WIDTH / 2, 128, '#fff2a1');
      this.cameras.main.shake(90, 0.004);
      playBasketSound('deny');
    }
    this.saveShopState();
    this.updateHud();
  }

  private updateShopUi() {
    if (!this.shopBasketText) return;
    this.shopBasketText.setText(`Yarn basket: ${this.yarnBasket}`);
    for (const card of this.shopCards) {
      const unlocked = this.isShopCardUnlocked(card);
      const selected = this.isShopCardSelected(card);
      card.priceText.setText(card.option.cost === 0 ? 'Free' : `${card.option.cost} yarn`);
      card.statusText.setText(
        selected
          ? 'EQUIPPED'
          : unlocked
            ? 'EQUIP'
            : this.catGodMode
              ? 'EQUIP'
              : 'BUY'
      );
      this.drawShopCard(card.background, selected, unlocked || this.catGodMode);
    }
    this.drawCatGodButton(false);
    this.updateRunLoadoutUi();
    this.updateSpeedUi();
    this.updateLevelUi();
    this.updateModeUi();
    this.updateAudioUi();
  }

  private scrollShopBy(amount: number) {
    if (this.shopSnapPoints.length <= 1) {
      this.setShopScrollTarget(this.shopScrollTarget + amount);
      return;
    }
    const direction = Math.sign(amount);
    if (direction === 0) return;
    const current = this.shopScrollTarget;
    const nextPoint =
      direction > 0
        ? this.shopSnapPoints.find((point) => point > current + 80) ?? this.shopSnapPoints[this.shopSnapPoints.length - 1]
        : [...this.shopSnapPoints].reverse().find((point) => point < current - 80) ?? this.shopSnapPoints[0];
    this.setShopScrollTarget(nextPoint);
  }

  private setShopScroll(value: number) {
    const maxScroll = Math.max(0, this.shopContentHeight - SHOP_VIEWPORT.height);
    this.shopScrollY = Phaser.Math.Clamp(value, 0, maxScroll);
    this.shopScrollTarget = this.shopScrollY;
    if (this.shopScrollContainer) this.shopScrollContainer.setY(SHOP_VIEWPORT.top - this.shopScrollY);
    this.updateShopScrollChrome();
    this.updateShopScrollVisibility();
  }

  private setShopScrollTarget(value: number) {
    const maxScroll = Math.max(0, this.shopContentHeight - SHOP_VIEWPORT.height);
    this.shopScrollTarget = Phaser.Math.Clamp(value, 0, maxScroll);
  }

  private snapShopScrollTarget() {
    if (this.shopSnapPoints.length === 0) return;
    const nearest = this.shopSnapPoints.reduce((best, point) => {
      return Math.abs(point - this.shopScrollTarget) < Math.abs(best - this.shopScrollTarget) ? point : best;
    }, this.shopSnapPoints[0]);
    this.setShopScrollTarget(nearest);
  }

  private updateSmoothShopScroll(delta: number) {
    if (!this.shopScrollContainer || this.overlayMode !== 'shop') return;
    const maxScroll = Math.max(0, this.shopContentHeight - SHOP_VIEWPORT.height);
    if (maxScroll <= 0) return;
    const ease = Math.min(1, delta / 110);
    this.shopScrollY += (this.shopScrollTarget - this.shopScrollY) * ease;
    if (Math.abs(this.shopScrollTarget - this.shopScrollY) < 0.4) this.shopScrollY = this.shopScrollTarget;
    this.shopScrollContainer.setY(SHOP_VIEWPORT.top - this.shopScrollY);
    this.updateShopScrollChrome();
    this.updateShopScrollVisibility();
  }

  private updateShopScrollChrome() {
    if (!this.shopScrollbarTrack || !this.shopScrollbarThumb) return;
    const maxScroll = Math.max(0, this.shopContentHeight - SHOP_VIEWPORT.height);
    const trackX = SHOP_VIEWPORT.left + SHOP_VIEWPORT.width + 10;
    const trackTop = SHOP_VIEWPORT.top + 8;
    const trackHeight = SHOP_VIEWPORT.height - 16;
    this.shopScrollbarTrack.clear();
    this.shopScrollbarTrack.fillStyle(0x17347e, 0.7);
    this.shopScrollbarTrack.fillRoundedRect(trackX, trackTop, 8, trackHeight, 4);
    this.shopScrollbarTrack.fillStyle(0xffffff, 0.35);
    this.shopScrollbarTrack.fillTriangle(trackX + 4, trackTop - 10, trackX - 2, trackTop, trackX + 10, trackTop);
    this.shopScrollbarTrack.fillTriangle(trackX + 4, trackTop + trackHeight + 10, trackX - 2, trackTop + trackHeight, trackX + 10, trackTop + trackHeight);

    const thumbHeight = Math.max(36, (SHOP_VIEWPORT.height / Math.max(this.shopContentHeight, SHOP_VIEWPORT.height)) * trackHeight);
    const thumbY = maxScroll === 0 ? trackTop : trackTop + (this.shopScrollY / maxScroll) * (trackHeight - thumbHeight);
    this.shopScrollbarThumb.clear();
    this.shopScrollbarThumb.fillStyle(0xfff06a, 1);
    this.shopScrollbarThumb.fillRoundedRect(trackX - 3, thumbY, 14, thumbHeight, 7);
    this.shopScrollbarThumb.lineStyle(2, 0xffffff, 0.9);
    this.shopScrollbarThumb.strokeRoundedRect(trackX - 3, thumbY, 14, thumbHeight, 7);
    this.drawShopSectionButtons();
  }

  private drawShopSectionButtons(hoverLabel?: string) {
    if (this.shopSectionButtons.length === 0) return;
    const active = this.shopSectionButtons.reduce((best, button) => {
      return Math.abs(button.target - this.shopScrollTarget) < Math.abs(best.target - this.shopScrollTarget) ? button : best;
    }, this.shopSectionButtons[0]);
    for (const button of this.shopSectionButtons) {
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

  private updateShopScrollVisibility() {
    const visibleTop = this.shopScrollY;
    const visibleBottom = this.shopScrollY + SHOP_VIEWPORT.height;
    this.shopScrollElements.forEach((element) => {
      const halfHeight = (element.getData('shopHalfHeight') as number | undefined) ?? 0;
      element.setVisible(element.y - halfHeight >= visibleTop && element.y + halfHeight <= visibleBottom);
    });
  }

  private toggleCatGodMode() {
    this.catGodMode = !this.catGodMode;
    if (!this.catGodMode) {
      if (!this.unlockedCosmetics.has(this.selectedCosmeticId)) {
        this.selectedCosmeticId = 'tabby';
        this.cat.setTexture(this.getSelectedCosmetic().run1);
      }
      if (this.selectedAccessoryId !== 'none' && !this.unlockedAccessories.has(this.selectedAccessoryId)) {
        this.selectedAccessoryId = 'none';
        this.updateRoombaMount();
      }
      if (!this.unlockedTrails.has(this.selectedTrailId)) {
        this.selectedTrailId = 'muddy-feet';
      }
      if (!this.unlockedMouseOptions.has(this.selectedMouseId)) {
        this.selectedMouseId = 'classic-mouse';
        this.updateMouseCursor();
      }
    }
    this.saveShopState();
    this.updateShopUi();
    this.floatText(this.catGodMode ? 'Cat God ON' : 'Cat God OFF', GAME_WIDTH / 2, 126, '#fff2a1');
    playBasketSound('equip');
  }

  private isShopCardUnlocked(card: ShopCard) {
    if (card.kind === 'cat') return this.unlockedCosmetics.has(card.option.id);
    if (card.kind === 'accessory') return this.unlockedAccessories.has(card.option.id);
    if (card.kind === 'trail') return this.unlockedTrails.has(card.option.id);
    return this.unlockedMouseOptions.has(card.option.id);
  }

  private isShopCardSelected(card: ShopCard) {
    if (card.kind === 'cat') return this.selectedCosmeticId === card.option.id;
    if (card.kind === 'accessory') return this.selectedAccessoryId === card.option.id;
    if (card.kind === 'trail') return this.selectedTrailId === card.option.id;
    return this.selectedMouseId === card.option.id;
  }

  private updateRunLoadoutUi() {
    for (const element of this.runUiElements) {
      const role = element.getData('role') as string | undefined;
      if (role === 'selectedCat') {
        this.setEyeTrackedCatTexture(element as Phaser.GameObjects.Container, this.getSelectedCosmetic());
      } else if (role === 'selectedRoomba') {
        element.setVisible(this.selectedAccessoryId === 'roomba' && this.overlayMode === 'run');
      } else if (role === 'loadoutText') {
        (element as Phaser.GameObjects.Text).setText(this.getSelectedCosmetic().name);
      }
    }
  }

  private showOverlayMode(mode: OverlayMode) {
    if (this.phase !== 'start') return;
    this.overlayMode = mode;
    this.setRunUiVisible(mode === 'run');
    this.setShopUiVisible(mode === 'shop');
    this.titleText.setText(mode === 'run' ? 'KITTY MILK RUN' : 'KITTY SHOP');
    this.instructionText.setText('');
    this.updateShopUi();
  }

  private drawShopCard(graphics: Phaser.GameObjects.Graphics, selected: boolean, unlocked: boolean, blocked = false) {
    graphics.clear();
    graphics.fillStyle(blocked ? 0x4c5b7a : selected ? 0x53d36d : unlocked ? 0x276fbf : 0x17347e, 0.96);
    graphics.fillRoundedRect(-SHOP_CARD.width / 2, -SHOP_CARD.height / 2, SHOP_CARD.width, SHOP_CARD.height, 14);
    graphics.lineStyle(selected ? 6 : 4, selected ? 0xfff06a : 0xffffff, selected ? 1 : 0.82);
    graphics.strokeRoundedRect(-SHOP_CARD.width / 2, -SHOP_CARD.height / 2, SHOP_CARD.width, SHOP_CARD.height, 14);
    graphics.fillStyle(0xffffff, 0.16);
    graphics.fillRoundedRect(-SHOP_CARD.width / 2 + 10, -SHOP_CARD.height / 2 + 8, SHOP_CARD.width - 20, 72, 12);
  }

  private createSpeedSelector() {
    const speedTitle = this.add
      .text(0, 16, 'How Bad Do You Want It?', this.textStyle(20, '#fffad0'))
      .setOrigin(0.5)
      .setStroke('#17347e', 5);
    this.overlay.add(speedTitle);
    this.runUiElements.push(speedTitle);

    this.speedButtons = [];
    SPEED_OPTIONS.forEach((option, index) => {
      const button = this.add.container(-210 + index * 140, 58);
      const background = this.add.graphics();
      const yarn = this.add.image(-43, 0, Phaser.Math.RND.pick([ASSETS.yarnPink, ASSETS.yarnBlue, ASSETS.yarnPurple])).setScale(0.36);
      const labelText = this.add
        .text(14, 0, option.label, { ...this.textStyle(12, '#ffffff'), align: 'center', lineSpacing: -3 })
        .setOrigin(0.5);
      const clickZone = this.add.zone(0, 0, 126, 50).setInteractive();
      button.add([background, yarn, labelText, clickZone]);
      clickZone.on('pointerup', () => {
        this.shopPointerHandled = true;
        this.setSpeedMultiplier(option.multiplier);
      });
      clickZone.on('pointerover', () => {
        this.tweens.add({ targets: button, y: 52, duration: 90, ease: 'Sine.easeOut' });
      });
      clickZone.on('pointerout', () => {
        this.tweens.add({ targets: button, y: 58, duration: 90, ease: 'Sine.easeOut' });
      });
      this.overlay.add(button);
      this.runUiElements.push(button);
      this.speedButtons.push({ option, container: button, background, yarn, labelText });
    });

    this.updateSpeedUi();
  }

  private setSpeedMultiplier(multiplier: number) {
    if (this.phase !== 'start') return;
    this.speedMultiplier = multiplier;
    this.speed = this.getStartingSpeed();
    playBasketSound('equip');
    this.saveShopState();
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
    this.runUiElements.push(button);
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
    this.runUiElements.push(slider);
    return { container: slider, track, fill, knob, labelText };
  }

  private toggleAudioSetting(id: AudioToggleId) {
    if (id === 'sound-fx') {
      this.soundFxEnabled = !this.soundFxEnabled;
    } else {
      this.musicEnabled = !this.musicEnabled;
    }
    this.applyAudioSettings();
    this.saveShopState();
    this.updateAudioUi();
    playBasketSound('equip');
  }

  private setAudioVolume(value: number) {
    this.audioVolume = Phaser.Math.Clamp(value, 0, 1);
    this.applyAudioSettings();
    this.saveShopState();
    this.updateAudioUi();
  }

  private applyAudioSettings() {
    setAudioSettings({
      soundFxEnabled: this.soundFxEnabled,
      musicEnabled: this.musicEnabled,
      volume: this.audioVolume
    });
  }

  private updateAudioUi() {
    this.audioToggleButtons.forEach((button) => this.drawAudioToggleButton(button));
    this.drawAudioVolumeSlider();
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
      const selected = button.option.multiplier === this.speedMultiplier;
      this.drawSpeedButton(button.background, selected, button.option.tint);
      button.labelText.setColor('#ffffff');
      button.yarn.setScale(selected ? 0.54 : 0.42);
      button.yarn.setTint(selected ? 0xffffff : button.option.tint);
      const spinDuration = Math.round(1800 / button.option.multiplier);
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
    graphics.fillRoundedRect(-62, -25, 124, 50, 16);
    graphics.lineStyle(selected ? 5 : 3, selected ? 0xfff06a : 0xffffff, selected ? 1 : 0.72);
    graphics.strokeRoundedRect(-62, -25, 124, 50, 16);
    graphics.fillStyle(0xffffff, selected ? 0.34 : 0.12);
    graphics.fillCircle(-43, 0, 16);
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
        this.scrollShopBy(deltaY * 0.72);
      }
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.laneSwipeStart = new Phaser.Math.Vector2(pointer.x, pointer.y);
      if (this.phase === 'start' && this.overlayMode === 'shop' && pointer.x >= GAME_WIDTH / 2 + SHOP_VIEWPORT.left && pointer.x <= GAME_WIDTH / 2 + SHOP_VIEWPORT.left + SHOP_VIEWPORT.width) {
        this.shopDragStartY = pointer.y;
        this.shopDragStartScroll = this.shopScrollTarget;
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.phase === 'start' && this.overlayMode === 'shop' && this.shopDragStartY !== undefined) {
        this.snapShopScrollTarget();
      }
      this.shopDragStartY = undefined;
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
      if (this.phase !== 'start' || this.overlayMode !== 'shop' || this.shopDragStartY === undefined || !pointer.isDown) return;
      this.setShopScrollTarget(this.shopDragStartScroll + (this.shopDragStartY - pointer.y) * 1.25);
    });
  }

  private resetRunState() {
    this.phase = 'start';
    this.currentLane = 1;
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
    this.overlayMode = 'run';
  }

  private loadShopState() {
    try {
      const storedBasket = localStorage.getItem(STORAGE_KEYS.basket) ?? localStorage.getItem('kitty-milk-run:yarn-wallet');
      this.yarnBasket = Number.parseInt(storedBasket ?? '0', 10) || 0;
      const unlocked = JSON.parse(localStorage.getItem(STORAGE_KEYS.unlocked) ?? '["tabby"]') as string[];
      this.unlockedCosmetics = new Set(['tabby', ...unlocked.filter((id) => ALL_COSMETICS.some((option) => option.id === id))]);
      const selected = localStorage.getItem(STORAGE_KEYS.selected) ?? 'tabby';
      this.selectedCosmeticId = this.unlockedCosmetics.has(selected) ? selected : 'tabby';
      const unlockedAccessories = JSON.parse(localStorage.getItem(STORAGE_KEYS.unlockedAccessories) ?? '[]') as string[];
      this.unlockedAccessories = new Set(unlockedAccessories.filter((id) => ACCESSORIES.some((option) => option.id === id)));
      const selectedAccessory = localStorage.getItem(STORAGE_KEYS.selectedAccessory) ?? 'none';
      this.selectedAccessoryId = this.unlockedAccessories.has(selectedAccessory) ? selectedAccessory : 'none';
      const hadLegacyRainbowTrail = selectedAccessory === 'nyan-cat' || unlockedAccessories.includes('nyan-cat');
      const unlockedTrails = JSON.parse(localStorage.getItem(STORAGE_KEYS.unlockedTrails) ?? '["muddy-feet"]') as string[];
      this.unlockedTrails = new Set([
        'muddy-feet',
        ...unlockedTrails.filter((id) => TRAILS.some((option) => option.id === id)),
        ...(hadLegacyRainbowTrail ? ['nyan-cat'] : [])
      ]);
      const selectedTrail = localStorage.getItem(STORAGE_KEYS.selectedTrail) ?? (selectedAccessory === 'nyan-cat' ? 'nyan-cat' : 'muddy-feet');
      this.selectedTrailId = this.unlockedTrails.has(selectedTrail) ? selectedTrail : 'muddy-feet';
      const unlockedMouse = JSON.parse(localStorage.getItem(STORAGE_KEYS.unlockedMouse) ?? '["classic-mouse"]') as string[];
      this.unlockedMouseOptions = new Set([
        'classic-mouse',
        ...unlockedMouse.filter((id) => ALL_MOUSE_OPTIONS.some((option) => option.id === id))
      ]);
      const selectedMouse = localStorage.getItem(STORAGE_KEYS.selectedMouse) ?? 'classic-mouse';
      this.selectedMouseId = this.unlockedMouseOptions.has(selectedMouse) ? selectedMouse : 'classic-mouse';
      const storedSpeed = Number.parseFloat(localStorage.getItem(STORAGE_KEYS.speed) ?? '1');
      this.speedMultiplier = SPEED_OPTIONS.some((option) => option.multiplier === storedSpeed) ? storedSpeed : 1;
      const storedLevel = localStorage.getItem(STORAGE_KEYS.level) as LevelId | null;
      this.selectedLevelId = LEVELS.some((level) => level.id === storedLevel) ? storedLevel : 'meadow';
      const storedMode = localStorage.getItem(STORAGE_KEYS.mode) as RunMode | null;
      this.runMode = storedMode === 'farm-for-yarn' ? 'farm-for-yarn' : 'milk-run';
      this.soundFxEnabled = localStorage.getItem(STORAGE_KEYS.soundFx) !== 'false';
      this.musicEnabled = localStorage.getItem(STORAGE_KEYS.music) !== 'false';
      const storedVolume = Number.parseFloat(localStorage.getItem(STORAGE_KEYS.audioVolume) ?? '0.8');
      this.audioVolume = Number.isFinite(storedVolume) ? Phaser.Math.Clamp(storedVolume, 0, 1) : 0.8;
      this.speed = this.getStartingSpeed();
    } catch {
      this.yarnBasket = 0;
      this.selectedCosmeticId = 'tabby';
      this.selectedAccessoryId = 'none';
      this.selectedTrailId = 'muddy-feet';
      this.selectedMouseId = 'classic-mouse';
      this.unlockedCosmetics = new Set(['tabby']);
      this.unlockedAccessories = new Set();
      this.unlockedTrails = new Set(['muddy-feet']);
      this.unlockedMouseOptions = new Set(['classic-mouse']);
      this.speedMultiplier = 1;
      this.selectedLevelId = 'meadow';
      this.runMode = 'milk-run';
      this.soundFxEnabled = true;
      this.musicEnabled = true;
      this.audioVolume = 0.8;
      this.speed = this.getStartingSpeed();
    }
  }

  private saveShopState() {
    try {
      localStorage.setItem(STORAGE_KEYS.basket, String(this.yarnBasket));
      localStorage.setItem(STORAGE_KEYS.selected, this.selectedCosmeticId);
      localStorage.setItem(STORAGE_KEYS.unlocked, JSON.stringify([...this.unlockedCosmetics]));
      localStorage.setItem(STORAGE_KEYS.selectedAccessory, this.selectedAccessoryId);
      localStorage.setItem(STORAGE_KEYS.unlockedAccessories, JSON.stringify([...this.unlockedAccessories]));
      localStorage.setItem(STORAGE_KEYS.selectedTrail, this.selectedTrailId);
      localStorage.setItem(STORAGE_KEYS.unlockedTrails, JSON.stringify([...this.unlockedTrails]));
      localStorage.setItem(STORAGE_KEYS.selectedMouse, this.selectedMouseId);
      localStorage.setItem(STORAGE_KEYS.unlockedMouse, JSON.stringify([...this.unlockedMouseOptions]));
      localStorage.setItem(STORAGE_KEYS.speed, String(this.speedMultiplier));
      localStorage.setItem(STORAGE_KEYS.level, this.selectedLevelId);
      localStorage.setItem(STORAGE_KEYS.mode, this.runMode);
      localStorage.setItem(STORAGE_KEYS.soundFx, String(this.soundFxEnabled));
      localStorage.setItem(STORAGE_KEYS.music, String(this.musicEnabled));
      localStorage.setItem(STORAGE_KEYS.audioVolume, String(this.audioVolume));
    } catch {
      // Local storage is a convenience for the shop loop; the game remains playable without it.
    }
  }

  private handleSpace() {
    if (this.phase === 'start') {
      if (this.overlayMode === 'shop') {
        this.showOverlayMode('run');
      } else {
        this.startGame();
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
    const button = this.add.container(x, y).setDepth(DEPTHS.overlay + 4);
    const background = this.add.graphics();
    const labelText = this.add.text(0, 0, label, this.textStyle(17, '#ffffff')).setOrigin(0.5).setStroke('#17347e', 5);
    const clickZone = this.add.zone(0, 0, width, height).setInteractive();
    button.add([background, labelText, clickZone]);
    const draw = (hovered = false) => {
      background.clear();
      background.fillStyle(color, hovered ? 1 : 0.95);
      background.fillRoundedRect(-width / 2, -height / 2, width, height, 15);
      background.lineStyle(hovered ? 5 : 4, 0xffffff, 0.86);
      background.strokeRoundedRect(-width / 2, -height / 2, width, height, 15);
    };
    draw();
    clickZone.on('pointerup', onClick);
    clickZone.on('pointerover', () => draw(true));
    clickZone.on('pointerout', () => draw(false));
    return button;
  }

  private restartGame() {
    if (this.phase !== 'won' && this.phase !== 'lost') return;
    this.resetToStartScreen();
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
    this.cat.setPosition(LANES[this.currentLane], CAT_Y).setScale(0.95).setAlpha(1).setAngle(0).setVisible(true);
    this.cat.setTexture(this.getSelectedCosmetic().run1);
    this.roombaMount.setVisible(false).setAngle(0);
    this.crazyHair.setVisible(false);
    this.finishLine.setVisible(true).setPosition(GAME_WIDTH / 2, CAT_Y - FINISH_DISTANCE);
    this.milkBottle.setVisible(true).setPosition(GAME_WIDTH / 2, CAT_Y - FINISH_DISTANCE - 120);
    this.overlay.setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2).setAlpha(1).setVisible(true);
    this.pauseButton.setVisible(false);
    this.startCatBob();
    this.startRunAnimationTimer();
    this.showOverlayMode('run');
    this.updateHud();
  }

  private startGame() {
    if (this.phase !== 'start') return;
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
    if (this.distance > FINISH_DISTANCE - 1150) return;
    const lane = this.pickSafeLane(this.obstacles, this.yarns, -70, true);
    if (lane === undefined) return;
    const kind = this.pickObstacleType();
    const texture = this.getObstacleTexture(kind);
    const obstacle = this.add.image(LANES[lane], -70, texture) as RunnerSprite;
    obstacle.laneIndex = lane;
    obstacle.kind = kind;
    obstacle.setDepth(DEPTHS.obstacles);
    obstacle.setScale(kind === 'dog' ? 0.88 : kind === 'vacuum' ? 0.78 : 0.92);
    obstacle.setData('hitRadiusX', kind === 'dog' ? 55 : kind === 'vacuum' ? 62 : 48);
    obstacle.setData('hitRadiusY', kind === 'dog' ? 45 : kind === 'vacuum' ? 48 : 38);
    this.obstacles.add(obstacle);
    this.nextBlockedLane = lane;

    this.tweens.add({
      targets: obstacle,
      angle: kind === 'cucumber' || kind === 'foil' ? 6 : 3,
      duration: kind === 'cucumber' || kind === 'foil' ? 150 : 220,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private pickObstacleType(): ObstacleType {
    const roll = Math.random();
    if (this.distance > 2800 && roll < 0.16) return 'vacuum';
    if (this.distance > 1500 && roll < 0.34) return 'foil';
    return Phaser.Math.RND.pick(['dog', 'cucumber']);
  }

  private getObstacleTexture(kind: ObstacleType) {
    if (kind === 'dog') return ASSETS.dog;
    if (kind === 'cucumber') return ASSETS.cucumber;
    if (kind === 'vacuum') return ASSETS.vacuum;
    return ASSETS.foil;
  }

  private spawnDueYarn() {
    const level = this.getSelectedLevel();
    while (this.yarnSpawnIndex < level.maxYarn && this.distance >= this.getYarnSpawnDistance(this.yarnSpawnIndex, level.maxYarn)) {
      if (!this.spawnYarn()) return;
      this.yarnSpawnIndex += 1;
    }
  }

  private spawnFarmYarnRows() {
    while (this.yarnScore < FARM_YARN_GOAL && this.distance >= FARM_YARN_FIRST_ROW_DISTANCE + this.farmYarnRowIndex * FARM_YARN_ROW_SPACING) {
      LANES.forEach((_x, lane) => this.spawnYarnInLane(lane, -50));
      this.farmYarnRowIndex += 1;
    }
  }

  private getYarnSpawnDistance(index: number, maxYarn: number) {
    const usableDistance = FINISH_DISTANCE - YARN_START_DISTANCE - YARN_FINISH_PADDING;
    if (maxYarn <= 1) return YARN_START_DISTANCE;
    return YARN_START_DISTANCE + (usableDistance * index) / (maxYarn - 1);
  }

  private spawnYarn() {
    if (this.distance > FINISH_DISTANCE - YARN_FINISH_PADDING) return false;
    const lane = this.pickSafeLane(this.yarns, this.obstacles, -50, false);
    if (lane === undefined) return false;
    this.spawnYarnInLane(lane, -50);
    return true;
  }

  private spawnYarnInLane(lane: number, y: number) {
    const texture = Phaser.Math.RND.pick([ASSETS.yarnPink, ASSETS.yarnBlue, ASSETS.yarnPurple]);
    const yarn = this.add.image(LANES[lane], y, texture) as RunnerSprite;
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
    let lanes = [0, 1, 2];
    if (avoidLastObstacle && this.nextBlockedLane !== undefined) {
      Phaser.Utils.Array.Remove(lanes, this.nextBlockedLane);
    }

    lanes = lanes.filter((lane) => {
      return (
        !this.hasNearbyRunnerInLane(blockingGroup, lane, spawnY, SPAWN_CLEARANCE_Y) &&
        !this.hasNearbyRunnerInLane(sameKindGroup, lane, spawnY, SPAWN_CLEARANCE_Y * 0.6)
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
        this.cat.x = LANES[this.currentLane];
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
    const possibleLanes = [0, 1, 2].filter((lane) => lane !== this.currentLane);
    this.currentLane = Phaser.Math.RND.pick(possibleLanes);
    const targetX = LANES[this.currentLane];
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
        const possibleLanes = [0, 1, 2].filter((lane) => lane !== this.currentLane);
        this.currentLane = Phaser.Math.RND.pick(possibleLanes);
        this.cat.setPosition(LANES[this.currentLane], CAT_Y - 70).setScale(1.25).setAlpha(1).setAngle(-18);
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
    this.yarnBasket += yarnValue;
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
    const nextLane = Phaser.Math.Clamp(this.currentLane + direction, 0, LANES.length - 1);
    if (nextLane === this.currentLane) return;
    this.currentLane = nextLane;
    this.tweens.add({
      targets: this.cat,
      x: LANES[this.currentLane],
      duration: 130,
      ease: 'Back.easeOut'
    });
  }

  private updateRoombaMount() {
    if (!this.roombaMount) return;
    const ridingRoomba = this.selectedAccessoryId === 'roomba' && this.phase === 'playing' && !this.controlsLocked;
    this.roombaMount.setVisible(ridingRoomba);
    if (!ridingRoomba) return;
    this.roombaMount.setPosition(this.cat.x, this.cat.y + 36);
    this.roombaMount.setAngle(Math.sin(this.time.now / 90) * 3);
  }

  private updatePawTrail(delta: number) {
    if (this.controlsLocked) return;
    this.pawTrailTimer += delta;
    if (this.selectedTrailId === 'nyan-cat') {
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
    const finishY = CAT_Y - (FINISH_DISTANCE - this.distance);
    this.finishLine.y = finishY;
    this.milkBottle.y = finishY - 120;
  }

  private winGame() {
    if (this.phase !== 'playing') return;
    this.phase = 'won';
    this.pauseButton.setVisible(false);
    const farmRun = this.isFarmForYarn();
    const perfectRun = !farmRun && this.obstacleHits === 0 && this.hearts === INITIAL_HEARTS;
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
      'Press Space to play again.',
      perfectRun
    );
    this.overlay.setY(GAME_HEIGHT / 2).setAlpha(1).setVisible(true);
    this.tweens.add({ targets: farmRun ? [this.cat, bowl] : [this.cat, bowl, this.milkBottle], y: '+=8', duration: 260, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.time.addEvent({
      delay: 180,
      repeat: 18,
      callback: () => this.emitter.explode(7, Phaser.Math.Between(330, 625), Phaser.Math.Between(175, 360))
    });
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
    this.showEndOverlay('OH NO!', 'The kitty got spooked.', 'Press Space to retry.', false);
    this.overlay.setY(GAME_HEIGHT / 2).setAlpha(1).setVisible(true);
  }

  private showEndOverlay(title: string, message: string, prompt: string, perfectRun: boolean) {
    this.clearEndUi();
    this.showOverlay(title, '');
    this.titleText.setPosition(0, -176).setFontSize(perfectRun ? 58 : 54).setScale(1);
    this.instructionText.setPosition(0, 176).setFontSize(20).setText(prompt);

    const scoreLabel = this.add
      .text(0, -76, 'Yarn Collected', this.textStyle(22, '#fffad0'))
      .setOrigin(0.5)
      .setStroke('#17347e', 5);
    const scoreValue = this.add
      .text(0, -6, '0', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '78px',
        color: '#ffffff',
        align: 'center'
      })
      .setOrigin(0.5)
      .setStroke('#17347e', 9);
    const messageText = this.add
      .text(0, 82, message, this.textStyle(26, '#dff7ff'))
      .setOrigin(0.5)
      .setStroke('#17347e', 5);
    this.overlay.add([scoreLabel, scoreValue, messageText]);
    this.endUiElements.push(scoreLabel, scoreValue, messageText);

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

  private setRunUiVisible(visible: boolean) {
    this.runUiElements.forEach((element) => element.setVisible(visible));
  }

  private updateHud() {
    this.heartIcons.forEach((heart, index) => heart.setTexture(index < this.hearts ? ASSETS.heartFull : ASSETS.heartBroken));
    this.scoreText.setText(this.isFarmForYarn() ? `Farm yarn: ${this.yarnScore}/${FARM_YARN_GOAL}` : `Run yarn: ${this.yarnScore}`);
    this.basketText.setText(`Yarn basket: ${this.yarnBasket}`);
    this.distanceText.setText(
      this.isFarmForYarn()
        ? `Farm for Yarn: ${this.getSelectedLevel().name}`
        : `World ${this.getSelectedLevel().order}: ${this.getSelectedLevel().name}`
    );
    const progress = this.isFarmForYarn()
      ? Phaser.Math.Clamp(this.yarnScore / FARM_YARN_GOAL, 0, 1)
      : Phaser.Math.Clamp(this.distance / FINISH_DISTANCE, 0, 1);
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

  private floatText(text: string, x: number, y: number, color: string) {
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
    return ALL_COSMETICS.find((option) => option.id === this.selectedCosmeticId) ?? COSMETICS[0];
  }

  private getSelectedAccessory() {
    return ACCESSORIES.find((option) => option.id === this.selectedAccessoryId);
  }

  private getSelectedMouseOption() {
    return ALL_MOUSE_OPTIONS.find((option) => option.id === this.selectedMouseId) ?? DEFAULT_MOUSE_OPTION;
  }

  private updateMouseCursor() {
    const mouse = this.getSelectedMouseOption();
    this.input.setDefaultCursor(`url(${mouse.cursorUrl}) ${mouse.hotSpot.x} ${mouse.hotSpot.y}, pointer`);
  }

  private getSelectedLevel() {
    return LEVELS.find((level) => level.id === this.selectedLevelId) ?? LEVELS[0];
  }

  private isFarmForYarn() {
    return this.runMode === 'farm-for-yarn';
  }

  private getStartingSpeed() {
    return INITIAL_SPEED * this.speedMultiplier;
  }

  private getMaxSpeed() {
    return MAX_SPEED * this.speedMultiplier;
  }

  private textStyle(fontSize: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: `${fontSize}px`,
      color,
      stroke: '#183f33',
      strokeThickness: 5
    };
  }
}
