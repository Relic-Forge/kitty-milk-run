import {
  MAP_NODES,
  WORLDS,
  getMapNodeById,
  getWorldById,
  type MapNode
} from '../src/game/worldMap';
import { LEVELS } from '../src/game/data/runLevels';
import { RUN_RECIPES, pickWeightedObstacle } from '../src/game/data/runRecipes';
import { ACCESSORIES, ALL_COSMETICS, ALL_MOUSE_OPTIONS, TRAILS } from '../src/game/data/cosmetics';
import { buildLaneLayout } from '../src/game/systems/laneLayout';
import { isKnownMechanicId } from '../src/game/systems/mechanics';

const errors: string[] = [];

function requireUnique(label: string, ids: string[]) {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) errors.push(`Duplicate ${label} id: ${id}`);
    seen.add(id);
  }
}

function validateScoreTargets(node: MapNode) {
  const { oneBottle, twoBottleScore, threeBottleScore } = node.scoreTargets;
  if (oneBottle < 1) errors.push(`${node.id} oneBottle must be at least 1`);
  if (twoBottleScore <= oneBottle) errors.push(`${node.id} twoBottleScore must exceed oneBottle`);
  if (threeBottleScore <= twoBottleScore) errors.push(`${node.id} threeBottleScore must exceed twoBottleScore`);
}

requireUnique('map node', MAP_NODES.map((node) => node.id));
requireUnique('world', WORLDS.map((world) => world.id));

for (const node of MAP_NODES) {
  if (!getWorldById(node.worldId)) errors.push(`${node.id} references missing world ${node.worldId}`);
  if (node.unlock.previousNodeId && !getMapNodeById(node.unlock.previousNodeId)) {
    errors.push(`${node.id} previousNodeId missing: ${node.unlock.previousNodeId}`);
  }
  if (node.nodeType !== 'gate') validateScoreTargets(node);
  if (node.nodeType === 'gate') {
    const world = getWorldById(node.worldId);
    const nextWorld = WORLDS.find((candidate) => candidate.order === (world?.order ?? -1) + 1);
    if (!world || !nextWorld || nextWorld.order <= world.order) {
      errors.push(`${node.id} gate does not point toward a later world unlock`);
    }
  }
}

for (const world of WORLDS) {
  if (!LEVELS.some((level) => level.id === world.themeKey)) {
    errors.push(`${world.id} themeKey has no runtime theme: ${world.themeKey}`);
  }
}

requireUnique('cat cosmetic', ALL_COSMETICS.map((option) => option.id));
requireUnique('accessory', ACCESSORIES.map((option) => option.id));
requireUnique('trail', TRAILS.map((option) => option.id));
requireUnique('mouse option', ALL_MOUSE_OPTIONS.map((option) => option.id));
requireUnique('run recipe', RUN_RECIPES.map((recipe) => recipe.id));

for (const node of MAP_NODES.filter((candidate) => candidate.nodeType !== 'gate')) {
  if (!RUN_RECIPES.some((recipe) => recipe.nodeId === node.id)) {
    errors.push(`${node.id} has no run recipe`);
  }
}

for (const recipe of RUN_RECIPES) {
  if (!getMapNodeById(recipe.nodeId)) errors.push(`${recipe.id} references missing node ${recipe.nodeId}`);
  try {
    buildLaneLayout({ laneCount: recipe.laneCount });
  } catch (error) {
    errors.push(`${recipe.id} has invalid laneCount ${recipe.laneCount}: ${(error as Error).message}`);
  }
  if (recipe.finishDistance <= recipe.yarnStartDistance + recipe.yarnFinishPadding) {
    errors.push(`${recipe.id} yarn spawn window does not fit inside finishDistance`);
  }
  if (recipe.spawnCadenceMs < 400) errors.push(`${recipe.id} spawnCadenceMs is too low`);
  if (recipe.spawnClearanceY < 80) errors.push(`${recipe.id} spawnClearanceY is too low`);
  if (recipe.pickupAssets.length === 0) errors.push(`${recipe.id} has no pickup assets`);
  if (recipe.obstacles.length === 0) errors.push(`${recipe.id} has no obstacles`);
  if (!pickWeightedObstacle(recipe.obstacles, 0, 0)) errors.push(`${recipe.id} has no obstacle available at run start`);
  for (const mechanicId of recipe.mechanicIds) {
    if (!isKnownMechanicId(mechanicId)) errors.push(`${recipe.id} references unknown mechanic ${mechanicId}`);
  }
  for (const obstacle of recipe.obstacles) {
    if (obstacle.weight <= 0) errors.push(`${recipe.id}/${obstacle.id} obstacle weight must be positive`);
    if (obstacle.hitRadiusX <= 0 || obstacle.hitRadiusY <= 0) errors.push(`${recipe.id}/${obstacle.id} hit radius must be positive`);
  }
}

if (!ALL_COSMETICS.some((option) => option.id === 'tabby')) errors.push('Default selected cat tabby is missing');
if (!TRAILS.some((option) => option.id === 'muddy-feet')) errors.push('Default selected trail muddy-feet is missing');
if (!ALL_MOUSE_OPTIONS.some((option) => option.id === 'classic-mouse')) errors.push('Default selected mouse classic-mouse is missing');

if (errors.length > 0) {
  console.error(`Game data validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Game data validation passed: ${MAP_NODES.length} nodes, ${WORLDS.length} worlds, ${RUN_RECIPES.length} run recipes.`);
