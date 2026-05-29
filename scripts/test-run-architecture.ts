import assert from 'node:assert/strict';
import { RUN_RECIPES, pickWeightedObstacle } from '../src/game/data/runRecipes';
import { buildLaneLayout } from '../src/game/systems/laneLayout';
import { RUN_MECHANICS, isKnownMechanicId } from '../src/game/systems/mechanics';
import { MAP_NODES } from '../src/game/worldMap';

const playableNodes = MAP_NODES.filter((node) => node.nodeType !== 'gate');

assert.equal(RUN_RECIPES.length, playableNodes.length, 'every playable map node should have one run recipe');

for (const recipe of RUN_RECIPES) {
  const node = playableNodes.find((candidate) => candidate.id === recipe.nodeId);
  assert.ok(node, `${recipe.id} references a playable map node`);
  assert.equal(recipe.worldId, node.worldId, `${recipe.id} worldId should match its map node`);
  assert.ok(recipe.finishDistance >= 3000, `${recipe.id} finishDistance should leave room for pacing`);
  assert.ok(recipe.spawnCadenceMs >= 400, `${recipe.id} spawnCadenceMs is too aggressive`);
  assert.ok(recipe.spawnClearanceY >= 80, `${recipe.id} spawnClearanceY is too small`);
  assert.ok(recipe.yarnStartDistance < recipe.finishDistance, `${recipe.id} yarnStartDistance must be before finish`);
  assert.ok(recipe.yarnFinishPadding < recipe.finishDistance, `${recipe.id} yarnFinishPadding must leave playable space`);
  assert.ok(recipe.pickupAssets.length > 0, `${recipe.id} needs at least one pickup asset`);
  assert.ok(recipe.obstacles.length > 0, `${recipe.id} needs at least one obstacle`);

  const layout = buildLaneLayout({ laneCount: recipe.laneCount });
  assert.equal(layout.lanes.length, recipe.laneCount, `${recipe.id} lane layout count should match recipe`);
  assert.ok(layout.lanes.every((laneX) => laneX > 0 && laneX < 960), `${recipe.id} lanes should stay inside the canvas`);

  for (const mechanicId of recipe.mechanicIds) {
    assert.ok(isKnownMechanicId(mechanicId), `${recipe.id} references unknown mechanic ${mechanicId}`);
    assert.ok(RUN_MECHANICS[mechanicId], `${recipe.id} mechanic ${mechanicId} is missing from registry`);
  }

  for (const obstacle of recipe.obstacles) {
    assert.ok(obstacle.weight > 0, `${recipe.id}/${obstacle.id} needs positive spawn weight`);
    assert.ok(obstacle.hitRadiusX > 0 && obstacle.hitRadiusY > 0, `${recipe.id}/${obstacle.id} needs hit radii`);
    assert.ok(obstacle.scale > 0, `${recipe.id}/${obstacle.id} needs positive scale`);
  }

  const firstObstacle = pickWeightedObstacle(recipe.obstacles, 0, 0);
  assert.ok(firstObstacle, `${recipe.id} should have an obstacle available at run start`);
}

const threeLaneLayout = buildLaneLayout({ laneCount: 3 });
assert.deepEqual(threeLaneLayout.lanes, [310, 480, 650], 'default 3-lane layout should preserve current lane positions');
assert.deepEqual(threeLaneLayout.laneMarkerXs, [395, 565], 'default 3-lane markers should preserve current divider positions');

const fourLaneRecipe = RUN_RECIPES.find((recipe) => recipe.laneCount === 4);
assert.ok(fourLaneRecipe, 'at least one recipe should exercise the future extra-lane path');
assert.equal(fourLaneRecipe.mechanicIds.includes('extra_lanes'), true, '4-lane recipes should declare the extra_lanes mechanic');

console.log(`Run architecture tests passed: ${RUN_RECIPES.length} recipes, ${Object.keys(RUN_MECHANICS).length} mechanics.`);
