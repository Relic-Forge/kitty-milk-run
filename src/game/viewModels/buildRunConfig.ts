import { LEVELS } from '../data/runLevels';
import { getRequiredRunRecipeByNodeId } from '../data/runRecipes';
import { GameStateService } from '../services/GameStateService';
import { ProgressService } from '../services/ProgressService';
import { buildLaneLayout } from '../systems/laneLayout';
import { getRequiredMapNode, getRequiredWorld } from '../worldMap';

export function buildRunConfig(nodeId?: string) {
  const node = nodeId ? getRequiredMapNode(nodeId) : ProgressService.getCurrentRunNode();
  const world = getRequiredWorld(node.worldId);
  const theme = LEVELS.find((level) => level.id === world.themeKey) ?? LEVELS[0];
  const recipe = getRequiredRunRecipeByNodeId(node.id);
  const laneLayout = buildLaneLayout({ laneCount: recipe.laneCount });

  return {
    node,
    world,
    theme,
    recipe,
    laneLayout,
    speedMultiplier: GameStateService.getSpeedMultiplier(),
    mode: GameStateService.getRunMode(),
    scoreTargets: node.scoreTargets
  };
}
