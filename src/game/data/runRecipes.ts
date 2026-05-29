import { type AssetKey, ASSETS } from '../assets';
import {
  FINISH_DISTANCE,
  INITIAL_SPEED,
  MAX_SPEED,
  OBSTACLE_SPAWN_MS,
  SPAWN_CLEARANCE_Y
} from '../constants';
import type { MechanicId } from '../systems/mechanics';
import { mechanicIdsFromFlags } from '../systems/mechanics';
import {
  MAP_NODES,
  getWorldForNode,
  type MapNode,
  type WorldConfig
} from '../worldMap';
import { getRunThemeByThemeKey } from './runLevels';

export type ObstacleId = 'dog' | 'cucumber' | 'foil' | 'vacuum' | 'jelly-crown';

export type ObstacleRecipe = {
  id: ObstacleId;
  asset: AssetKey;
  weight: number;
  minDistance: number;
  scale: number;
  hitRadiusX: number;
  hitRadiusY: number;
  wobbleAngle: number;
  wobbleDurationMs: number;
};

export type RunLevelRecipe = {
  id: string;
  nodeId: string;
  worldId: string;
  themeKey: WorldConfig['themeKey'];
  laneCount: number;
  finishDistance: number;
  spawnCadenceMs: number;
  spawnClearanceY: number;
  finishSpawnBuffer: number;
  baseSpeed: number;
  maxSpeed: number;
  speedMultiplier: number;
  maxYarn: number;
  yarnStartDistance: number;
  yarnFinishPadding: number;
  pickupAssets: AssetKey[];
  finishAsset: AssetKey;
  obstacles: ObstacleRecipe[];
  mechanicIds: MechanicId[];
};

const DEFAULT_YARN_START_DISTANCE = 480;
const DEFAULT_YARN_FINISH_PADDING = 980;

const BASE_OBSTACLES: ObstacleRecipe[] = [
  {
    id: 'dog',
    asset: ASSETS.dog,
    weight: 33,
    minDistance: 0,
    scale: 0.88,
    hitRadiusX: 55,
    hitRadiusY: 45,
    wobbleAngle: 3,
    wobbleDurationMs: 220
  },
  {
    id: 'cucumber',
    asset: ASSETS.cucumber,
    weight: 33,
    minDistance: 0,
    scale: 0.92,
    hitRadiusX: 48,
    hitRadiusY: 38,
    wobbleAngle: 6,
    wobbleDurationMs: 150
  },
  {
    id: 'foil',
    asset: ASSETS.foil,
    weight: 18,
    minDistance: 1500,
    scale: 0.92,
    hitRadiusX: 48,
    hitRadiusY: 38,
    wobbleAngle: 6,
    wobbleDurationMs: 150
  },
  {
    id: 'vacuum',
    asset: ASSETS.vacuum,
    weight: 16,
    minDistance: 2800,
    scale: 0.78,
    hitRadiusX: 62,
    hitRadiusY: 48,
    wobbleAngle: 3,
    wobbleDurationMs: 220
  }
];

const JELLY_CROWN: ObstacleRecipe = {
  id: 'jelly-crown',
  asset: ASSETS.magicKingdomJellyCrown,
  weight: 38,
  minDistance: 0,
  scale: 1,
  hitRadiusX: 46,
  hitRadiusY: 34,
  wobbleAngle: 6,
  wobbleDurationMs: 220
};

const NODE_RECIPE_OVERRIDES: Record<string, Partial<RunLevelRecipe>> = {
  world_09_magical_kingdom_level_04: {
    laneCount: 4,
    mechanicIds: ['extra_lanes', 'moving_hazards', 'timed_switches', 'bonus_objective']
  },
  world_09_magical_kingdom_bonus_01: {
    laneCount: 4,
    maxYarn: 48,
    mechanicIds: ['extra_lanes', 'moving_hazards', 'timed_switches', 'bonus_objective']
  }
};

export function getRunRecipeForNode(node: MapNode): RunLevelRecipe {
  const world = getWorldForNode(node);
  const theme = getRunThemeByThemeKey(world.themeKey);
  const obstacles = world.themeKey === 'magical-kingdom' ? [JELLY_CROWN, ...BASE_OBSTACLES] : BASE_OBSTACLES;
  const baseRecipe: RunLevelRecipe = {
    id: `recipe_${node.id}`,
    nodeId: node.id,
    worldId: world.id,
    themeKey: world.themeKey,
    laneCount: world.mechanicFlags.extraLanesEnabled ? 4 : 3,
    finishDistance: FINISH_DISTANCE,
    spawnCadenceMs: OBSTACLE_SPAWN_MS,
    spawnClearanceY: SPAWN_CLEARANCE_Y,
    finishSpawnBuffer: 1150,
    baseSpeed: INITIAL_SPEED,
    maxSpeed: MAX_SPEED,
    speedMultiplier: world.difficultyProfile.speedMultiplier,
    maxYarn: theme.maxYarn,
    yarnStartDistance: DEFAULT_YARN_START_DISTANCE,
    yarnFinishPadding: DEFAULT_YARN_FINISH_PADDING,
    pickupAssets: [ASSETS.yarnPink, ASSETS.yarnBlue, ASSETS.yarnPurple],
    finishAsset: world.gameplaySkin.finishAsset === 'finish_royal_milk_bottle' ? ASSETS.magicKingdomRoyalMilk : ASSETS.milkBottle,
    obstacles,
    mechanicIds: mechanicIdsFromFlags(world.mechanicFlags)
  };

  return {
    ...baseRecipe,
    ...NODE_RECIPE_OVERRIDES[node.id],
    obstacles: NODE_RECIPE_OVERRIDES[node.id]?.obstacles ?? baseRecipe.obstacles,
    pickupAssets: NODE_RECIPE_OVERRIDES[node.id]?.pickupAssets ?? baseRecipe.pickupAssets,
    mechanicIds: NODE_RECIPE_OVERRIDES[node.id]?.mechanicIds ?? baseRecipe.mechanicIds
  };
}

export const RUN_RECIPES: RunLevelRecipe[] = MAP_NODES.filter((node) => node.nodeType !== 'gate').map(getRunRecipeForNode);

export function getRunRecipeByNodeId(nodeId: string): RunLevelRecipe | undefined {
  return RUN_RECIPES.find((recipe) => recipe.nodeId === nodeId);
}

export function getRequiredRunRecipeByNodeId(nodeId: string): RunLevelRecipe {
  const recipe = getRunRecipeByNodeId(nodeId);
  if (!recipe) throw new Error(`Missing run recipe for node ${nodeId}`);
  return recipe;
}

export function pickWeightedObstacle(obstacles: ObstacleRecipe[], distance: number, randomValue = Math.random()) {
  const candidates = obstacles.filter((obstacle) => distance >= obstacle.minDistance && obstacle.weight > 0);
  if (candidates.length === 0) return undefined;
  const totalWeight = candidates.reduce((total, obstacle) => total + obstacle.weight, 0);
  let cursor = randomValue * totalWeight;
  for (const obstacle of candidates) {
    cursor -= obstacle.weight;
    if (cursor <= 0) return obstacle;
  }
  return candidates[candidates.length - 1];
}
