import { CosmeticService } from '../services/CosmeticService';
import { GameStateService } from '../services/GameStateService';
import { ProgressService } from '../services/ProgressService';
import { SPEED_OPTIONS, optionLabelForMultiplier } from '../data/speedOptions';
import { getWorldForNode } from '../worldMap';

export function buildLaunchViewModel() {
  const currentNode = ProgressService.getCurrentRunNode();
  const world = getWorldForNode(currentNode);
  const bottles = ProgressService.getBottlesForNode(currentNode.id);
  const cosmetic = CosmeticService.getSelectedCosmetic();
  const speedMultiplier = GameStateService.getSpeedMultiplier();
  const speedOption = SPEED_OPTIONS.find((option) => option.multiplier === speedMultiplier) ?? SPEED_OPTIONS[1];

  return {
    currentNode,
    world,
    selectedCat: {
      texture: cosmetic.run1,
      usesNyanArt: cosmetic.style === 'nyan',
      name: cosmetic.name
    },
    totalMilk: ProgressService.getTotalMilk(),
    mapMilkGoal: ProgressService.getMapMilkGoal(),
    currentBottleRating: ProgressService.formatBottleRating(bottles),
    speedLabel: optionLabelForMultiplier(speedMultiplier),
    speedOption
  };
}
