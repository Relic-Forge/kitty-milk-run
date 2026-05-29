import { SPEED_OPTIONS } from '../data/speedOptions';
import { GameStateService } from '../services/GameStateService';
import { ProgressService } from '../services/ProgressService';
import { SceneRouter } from '../services/SceneRouter';
import { LaunchScreenRenderer } from '../ui/launch/LaunchScreenRenderer';
import { buildLaunchViewModel } from '../viewModels/buildLaunchViewModel';
import { BaseScene } from './BaseScene';

export class LaunchScene extends BaseScene {
  private launchRenderer?: LaunchScreenRenderer;

  constructor() {
    super('LaunchScene');
  }

  create() {
    this.applyMouseCursor();
    this.launchRenderer = new LaunchScreenRenderer(
      {
        scene: this,
        textStyle: (fontSize, color) => this.textStyle(fontSize, color),
        createEyeTrackedCat: (x, y, texture, scale, usesNyanArt) => this.createEyeTrackedCat(x, y, texture, scale, usesNyanArt).container
      },
      {
        onStartRun: () => SceneRouter.run(this, ProgressService.getCurrentRunNode().id),
        onOpenMap: () => SceneRouter.map(this),
        onOpenShop: () => SceneRouter.shop(this, 'LaunchScene'),
        onCycleSpeed: () => this.cycleSpeed()
      }
    );
    this.launchRenderer.create(buildLaunchViewModel());
  }

  update() {
    this.updateBaseEyeTrackedCats();
  }

  private cycleSpeed() {
    const current = GameStateService.getSpeedMultiplier();
    const index = SPEED_OPTIONS.findIndex((option) => option.multiplier === current);
    const next = SPEED_OPTIONS[(index + 1) % SPEED_OPTIONS.length] ?? SPEED_OPTIONS[0];
    GameStateService.setSpeedMultiplier(next.multiplier);
    this.playUiSound('equip');
    this.launchRenderer?.update(buildLaunchViewModel());
  }
}
