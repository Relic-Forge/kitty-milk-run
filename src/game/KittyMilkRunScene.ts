import Phaser from 'phaser';
import { ASSETS, loadGameAssets } from './assets';
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
  YARN_SPAWN_MS,
  type GamePhase,
  type ObstacleType
} from './constants';
import { playToneSet } from './sound';

type RunnerSprite = Phaser.GameObjects.Image & {
  laneIndex?: number;
  kind?: ObstacleType | 'yarn';
};

export class KittyMilkRunScene extends Phaser.Scene {
  private cat!: Phaser.GameObjects.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'left' | 'right', Phaser.Input.Keyboard.Key>;
  private phase: GamePhase = 'start';
  private currentLane = 1;
  private hearts = INITIAL_HEARTS;
  private yarnScore = 0;
  private speed = INITIAL_SPEED;
  private distance = 0;
  private spawnTimer = 0;
  private yarnTimer = 0;
  private nextBlockedLane: number | undefined;
  private invulnerableUntil = 0;
  private finishLine!: Phaser.GameObjects.Container;
  private milkBottle!: Phaser.GameObjects.Image;
  private overlay!: Phaser.GameObjects.Container;
  private titleText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private heartsText!: Phaser.GameObjects.Text;
  private distanceText!: Phaser.GameObjects.Text;
  private obstacles!: Phaser.GameObjects.Group;
  private yarns!: Phaser.GameObjects.Group;
  private scrollables!: Phaser.GameObjects.Group;
  private emitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private laneSwipeStart: Phaser.Math.Vector2 | undefined;

  constructor() {
    super('KittyMilkRunScene');
  }

  preload() {
    loadGameAssets(this);
  }

  create() {
    this.resetRunState();
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('A,D') as Record<'left' | 'right', Phaser.Input.Keyboard.Key>;
    this.obstacles = this.add.group();
    this.yarns = this.add.group();
    this.scrollables = this.add.group();

    this.createWorld();
    this.createHud();
    this.createPlayer();
    this.createFinishObjects();
    this.createOverlay();
    this.createParticles();
    this.bindInput();
  }

  update(time: number, delta: number) {
    if (this.phase !== 'playing') return;

    const dt = delta / 1000;
    this.distance += this.speed * dt;
    this.spawnTimer += delta;
    this.yarnTimer += delta;

    this.scrollWorld(dt);
    this.updateRunnerGroup(this.obstacles, dt, time, (item) => this.hitObstacle(item, time));
    this.updateRunnerGroup(this.yarns, dt, time, (item) => this.collectYarn(item));
    this.updateFinish();
    this.updateHud();

    if (this.spawnTimer >= OBSTACLE_SPAWN_MS) {
      this.spawnObstacle();
      this.spawnTimer = Phaser.Math.Between(-130, 120);
    }

    if (this.yarnTimer >= YARN_SPAWN_MS) {
      this.spawnYarn();
      this.yarnTimer = Phaser.Math.Between(-160, 110);
    }

    if (this.distance >= FINISH_DISTANCE) {
      this.winGame();
    }
  }

  private createWorld() {
    this.cameras.main.setBackgroundColor('#6fd660');

    for (let y = -70; y <= GAME_HEIGHT + 90; y += 70) {
      const stripe = this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH, 34, 0x92ee7d, 0.42).setDepth(DEPTHS.background);
      stripe.setData('scrollSpeed', 0.42);
      this.scrollables.add(stripe);
    }

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 548, GAME_HEIGHT + 30, 0xb9854e).setDepth(DEPTHS.track);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 496, GAME_HEIGHT + 30, 0xd1a06a).setDepth(DEPTHS.track);
    this.add.rectangle(220, GAME_HEIGHT / 2, 14, GAME_HEIGHT + 30, 0xfef2bd, 0.95).setDepth(DEPTHS.trackDecor);
    this.add.rectangle(740, GAME_HEIGHT / 2, 14, GAME_HEIGHT + 30, 0xfef2bd, 0.95).setDepth(DEPTHS.trackDecor);

    for (const x of [395, 565]) {
      for (let y = -30; y < GAME_HEIGHT + 60; y += 72) {
        const dash = this.add.rectangle(x, y, 7, 38, 0xfff7d8, 0.7).setDepth(DEPTHS.trackDecor);
        dash.setData('scrollSpeed', 1);
        this.scrollables.add(dash);
      }
    }

    for (let i = 0; i < 38; i += 1) {
      const x = Phaser.Math.RND.pick([Phaser.Math.Between(24, 170), Phaser.Math.Between(790, 936)]);
      const y = Phaser.Math.Between(-20, GAME_HEIGHT + 60);
      const key = Phaser.Math.RND.pick([ASSETS.flower, ASSETS.grassTuft, ASSETS.paw]);
      const decor = this.add.image(x, y, key).setDepth(DEPTHS.trackDecor).setScale(Phaser.Math.FloatBetween(0.62, 1.15));
      decor.setAngle(Phaser.Math.Between(-12, 12));
      decor.setData('scrollSpeed', Phaser.Math.FloatBetween(0.5, 0.74));
      this.scrollables.add(decor);
    }
  }

  private createHud() {
    const panel = this.add.graphics().setDepth(DEPTHS.hud);
    panel.fillStyle(0x285a3a, 0.82);
    panel.fillRoundedRect(18, 16, 250, 95, 18);
    panel.lineStyle(4, 0xffffff, 0.82);
    panel.strokeRoundedRect(18, 16, 250, 95, 18);

    this.heartsText = this.add.text(38, 30, '', this.textStyle(26, '#fff2f2')).setDepth(DEPTHS.hud);
    this.scoreText = this.add.text(38, 68, '', this.textStyle(23, '#fffad0')).setDepth(DEPTHS.hud);
    this.distanceText = this.add
      .text(GAME_WIDTH - 40, 28, '', { ...this.textStyle(20, '#ffffff'), align: 'right' })
      .setOrigin(1, 0)
      .setDepth(DEPTHS.hud);
    this.updateHud();
  }

  private createPlayer() {
    this.cat = this.add.image(LANES[this.currentLane], CAT_Y, ASSETS.catRun1).setDepth(DEPTHS.player).setScale(0.95);
    this.tweens.add({
      targets: this.cat,
      y: CAT_Y - 8,
      duration: 180,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.time.addEvent({
      delay: 160,
      loop: true,
      callback: () => {
        if (this.phase === 'playing') {
          this.cat.setTexture(this.cat.texture.key === ASSETS.catRun1 ? ASSETS.catRun2 : ASSETS.catRun1);
        }
      }
    });
  }

  private createFinishObjects() {
    this.finishLine = this.add.container(GAME_WIDTH / 2, -260).setDepth(DEPTHS.finish).setVisible(false);
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

    this.milkBottle = this.add.image(GAME_WIDTH / 2, -350, ASSETS.milkBottle).setDepth(DEPTHS.finish).setVisible(false);
  }

  private createOverlay() {
    this.overlay = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(DEPTHS.overlay);
    const panel = this.add.graphics();
    panel.fillStyle(0x2d5fbd, 0.82);
    panel.fillRoundedRect(-318, -154, 636, 292, 28);
    panel.lineStyle(6, 0xffffff, 0.9);
    panel.strokeRoundedRect(-318, -154, 636, 292, 28);

    this.titleText = this.add
      .text(0, -98, 'KITTY MILK RUN', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '56px',
        color: '#ffffff',
        align: 'center'
      })
      .setOrigin(0.5)
      .setStroke('#17347e', 8);

    this.instructionText = this.add
      .text(0, 6, 'Dodge dogs and cucumbers.\nCollect yarn. Reach the milk!\nSpace to start. Arrow keys or A/D to move.', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '25px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 8
      })
      .setOrigin(0.5)
      .setStroke('#17347e', 5);

    const catPreview = this.add.image(-210, 108, ASSETS.catRun1).setScale(0.68).setAngle(-5);
    const milkPreview = this.add.image(226, 102, ASSETS.milkBottle).setScale(0.48).setAngle(5);
    this.overlay.add([panel, catPreview, milkPreview, this.titleText, this.instructionText]);

    this.tweens.add({
      targets: [catPreview, milkPreview],
      y: '+=7',
      duration: 340,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
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
    this.input.keyboard!.on('keydown-SPACE', () => this.handleSpace());
    this.input.keyboard!.on('keydown-LEFT', () => this.moveLane(-1));
    this.input.keyboard!.on('keydown-RIGHT', () => this.moveLane(1));
    this.input.keyboard!.on('keydown-A', () => this.moveLane(-1));
    this.input.keyboard!.on('keydown-D', () => this.moveLane(1));

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.laneSwipeStart = new Phaser.Math.Vector2(pointer.x, pointer.y);
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.laneSwipeStart) return;
      const deltaX = pointer.x - this.laneSwipeStart.x;
      const deltaY = pointer.y - this.laneSwipeStart.y;
      this.laneSwipeStart = undefined;

      if (this.phase !== 'playing') {
        this.handleSpace();
        return;
      }

      if (Math.abs(deltaX) > 24 && Math.abs(deltaX) > Math.abs(deltaY)) {
        this.moveLane(deltaX > 0 ? 1 : -1);
      }
    });
  }

  private resetRunState() {
    this.phase = 'start';
    this.currentLane = 1;
    this.hearts = INITIAL_HEARTS;
    this.yarnScore = 0;
    this.speed = INITIAL_SPEED;
    this.distance = 0;
    this.spawnTimer = 0;
    this.yarnTimer = 0;
    this.nextBlockedLane = undefined;
    this.invulnerableUntil = 0;
    this.laneSwipeStart = undefined;
  }

  private handleSpace() {
    if (this.phase === 'start') {
      this.startGame();
    } else if (this.phase === 'won' || this.phase === 'lost') {
      this.scene.restart();
    }
  }

  private startGame() {
    this.phase = 'playing';
    playToneSet('start');
    this.tweens.add({
      targets: this.overlay,
      alpha: 0,
      y: GAME_HEIGHT / 2 - 30,
      duration: 260,
      ease: 'Sine.easeIn',
      onComplete: () => this.overlay.setVisible(false)
    });
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
    const lane = this.pickSpawnLane(true);
    const kind: ObstacleType = this.distance > 1850 && Math.random() < 0.15 ? 'foil' : Phaser.Math.RND.pick(['dog', 'cucumber']);
    const texture = kind === 'dog' ? ASSETS.dog : kind === 'cucumber' ? ASSETS.cucumber : ASSETS.foil;
    const obstacle = this.add.image(LANES[lane], -70, texture) as RunnerSprite;
    obstacle.laneIndex = lane;
    obstacle.kind = kind;
    obstacle.setDepth(DEPTHS.obstacles);
    obstacle.setScale(kind === 'dog' ? 0.88 : 0.92);
    obstacle.setData('hitRadiusX', kind === 'dog' ? 55 : 48);
    obstacle.setData('hitRadiusY', kind === 'dog' ? 45 : 38);
    this.obstacles.add(obstacle);
    this.nextBlockedLane = lane;

    this.tweens.add({
      targets: obstacle,
      angle: kind === 'cucumber' ? 6 : 3,
      duration: kind === 'cucumber' ? 150 : 220,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private spawnYarn() {
    const lane = this.pickSpawnLane(false);
    const texture = Phaser.Math.RND.pick([ASSETS.yarnPink, ASSETS.yarnBlue, ASSETS.yarnPurple]);
    const yarn = this.add.image(LANES[lane], -50, texture) as RunnerSprite;
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

  private pickSpawnLane(avoidLastObstacle: boolean) {
    const lanes = [0, 1, 2];
    if (avoidLastObstacle && this.nextBlockedLane !== undefined) {
      Phaser.Utils.Array.Remove(lanes, this.nextBlockedLane);
    }
    return Phaser.Math.RND.pick(lanes);
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
    this.invulnerableUntil = time + 700;
    item.destroy();
    this.hearts -= 1;
    playToneSet('bonk');
    this.updateHud();
    this.emitter.explode(12, this.cat.x, this.cat.y - 12);

    this.cat.setTexture(ASSETS.catHit);
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
        this.cat.setTexture(ASSETS.catRun1);
        if (this.phase === 'playing') {
          this.tweens.add({ targets: this.cat, y: CAT_Y - 8, duration: 180, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
      }
    });

    if (this.hearts <= 0) {
      this.loseGame();
    }
  }

  private collectYarn(item: RunnerSprite) {
    if (this.phase !== 'playing') return;
    const x = item.x;
    const y = item.y;
    item.destroy();
    this.yarnScore += 1;
    this.speed = Math.min(MAX_SPEED, this.speed + 5);
    playToneSet('yarn');
    this.emitter.explode(16, x, y);
    this.floatText('+1 yarn', x, y - 20, '#fff2a1');
    this.updateHud();
  }

  private moveLane(direction: number) {
    if (this.phase !== 'playing') return;
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

  private updateFinish() {
    const remaining = FINISH_DISTANCE - this.distance;
    if (remaining < 700) {
      this.finishLine.setVisible(true);
      this.milkBottle.setVisible(true);
      this.finishLine.y = remaining - 90;
      this.milkBottle.y = remaining - 210;
    }
  }

  private winGame() {
    if (this.phase !== 'playing') return;
    this.phase = 'won';
    this.obstacles.clear(true, true);
    this.yarns.clear(true, true);
    playToneSet('win');
    this.cameras.main.flash(250, 255, 255, 210);

    const bowl = this.add.image(GAME_WIDTH / 2, 332, ASSETS.milkBowl).setDepth(DEPTHS.effects);
    this.cat.setPosition(GAME_WIDTH / 2 - 95, 388).setAngle(-4).setTexture(ASSETS.catRun1);
    this.milkBottle.setPosition(GAME_WIDTH / 2 + 110, 292).setVisible(true);
    this.finishLine.setVisible(false);

    this.showOverlay('MILK FOUND!', `Yarn collected: ${this.yarnScore}\nKitty got the milk.\nPress Space to play again.`);
    this.overlay.setY(164).setAlpha(1).setVisible(true);
    this.tweens.add({ targets: [this.cat, bowl, this.milkBottle], y: '+=8', duration: 260, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.time.addEvent({
      delay: 180,
      repeat: 18,
      callback: () => this.emitter.explode(7, Phaser.Math.Between(330, 625), Phaser.Math.Between(175, 360))
    });
  }

  private loseGame() {
    if (this.phase === 'lost') return;
    this.phase = 'lost';
    this.obstacles.clear(true, true);
    this.yarns.clear(true, true);
    this.cat.setTexture(ASSETS.catHit).setAngle(0);
    this.showOverlay('OH NO!', `The kitty got spooked.\nYarn collected: ${this.yarnScore}\nPress Space to retry.`);
    this.overlay.setY(GAME_HEIGHT / 2).setAlpha(1).setVisible(true);
  }

  private showOverlay(title: string, instructions: string) {
    this.titleText.setText(title);
    this.instructionText.setText(instructions);
  }

  private updateHud() {
    this.heartsText.setText(`Hearts: ${this.hearts}/${INITIAL_HEARTS}`);
    this.scoreText.setText(`Yarn: ${this.yarnScore}`);
    const percent = Phaser.Math.Clamp(Math.round((this.distance / FINISH_DISTANCE) * 100), 0, 100);
    this.distanceText.setText(`Milk dash: ${percent}%`);
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
