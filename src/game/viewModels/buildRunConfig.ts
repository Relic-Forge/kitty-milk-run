import { LEVELS } from '../data/runLevels';
import { GameStateService } from '../services/GameStateService';
import { ProgressService } from '../services/ProgressService';
import { getRequiredMapNode, getRequiredWorld } from '../worldMap';

export function buildRunConfig(nodeId?: string) {
  const node = nodeId ? getRequiredMapNode(nodeId) : ProgressService.getCurrentRunNode();
  const world = getRequiredWorld(node.worldId);
  const theme = LEVELS.find((level) => level.id === world.themeKey) ?? LEVELS[0];

  return {
    node,
    world,
    theme,
    speedMultiplier: GameStateService.getSpeedMultiplier(),
    mode: GameStateService.getRunMode(),
    scoreTargets: node.scoreTargets
  };
}
