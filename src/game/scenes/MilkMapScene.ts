import { CosmeticService } from '../services/CosmeticService';
import { GameStateService } from '../services/GameStateService';
import { ProgressService } from '../services/ProgressService';
import { SceneRouter } from '../services/SceneRouter';
import { MilkMapRenderer } from '../ui/map/MilkMapRenderer';
import { buildMapViewModel } from '../viewModels/buildMapViewModel';
import { getWorldForNode } from '../worldMap';
import { BaseScene } from './BaseScene';

export class MilkMapScene extends BaseScene {
  private mapRenderer?: MilkMapRenderer;
  private mapInputReadyAt = 0;

  constructor() {
    super('MilkMapScene');
  }

  create() {
    this.applyMouseCursor();
    const overlay = this.createScreenOverlay(0x5e8be8);
    this.mapInputReadyAt = this.time.now + 180;
    this.mapRenderer = new MilkMapRenderer({
      scene: this,
      overlay,
      textStyle: (fontSize, color) => this.textStyle(fontSize, color),
      createEyeTrackedCat: (x, y, texture, scale, usesNyanArt) => this.createEyeTrackedCat(x, y, texture, scale, usesNyanArt).container,
      setEyeTrackedCatTexture: (container, cosmetic) => this.setEyeTrackedCatTexture(container, cosmetic),
      createOverlayButton: (x, y, width, height, label, color, onClick) => this.createUiButton(x, y, width, height, label, color, onClick),
      getSelectedCosmetic: () => CosmeticService.getSelectedCosmetic(),
      getSelectedMapNode: () => ProgressService.getSelectedNode(),
      getSelectedMapNodeId: () => ProgressService.getSelectedNodeId(),
      getCurrentMapCatNode: () => ProgressService.getCurrentMapCatNode(),
      getTotalMilk: () => ProgressService.getTotalMilk(),
      getMapMilkGoal: () => ProgressService.getMapMilkGoal(),
      getBottlesForNode: (nodeId) => ProgressService.getBottlesForNode(nodeId),
      getMapCardBody: (node) => ProgressService.getMapCardBody(node),
      isMapNodeUnlocked: (node) => ProgressService.isNodeUnlocked(node),
      isMapNodePlayable: (node) => ProgressService.isNodePlayable(node),
      getMapInputReadyAt: () => this.mapInputReadyAt,
      isPointerHandled: () => false,
      getOverlayMode: () => 'map',
      selectMapNode: (nodeId) => this.selectMapNode(nodeId),
      startGame: () => SceneRouter.run(this, ProgressService.getSelectedNodeId()),
      showShop: () => SceneRouter.shop(this, 'MilkMapScene'),
      showLaunch: () => SceneRouter.launch(this)
    });
    this.mapRenderer.create();
    this.mapRenderer.setPendingCelebration(ProgressService.consumePendingMapUnlock());
    this.mapRenderer.update();
    buildMapViewModel();
  }

  update() {
    this.updateBaseEyeTrackedCats();
  }

  private selectMapNode(nodeId: string) {
    ProgressService.setSelectedNode(nodeId);
    const node = ProgressService.getSelectedNode();
    GameStateService.setSelectedLevelId(getWorldForNode(node).themeKey);
    this.mapRenderer?.createAtlasPage();
    this.mapRenderer?.update();
    this.playUiSound(ProgressService.isNodePlayable(node) ? 'equip' : 'deny');
  }
}
