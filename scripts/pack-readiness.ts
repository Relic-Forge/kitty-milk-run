import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { LEVELS } from '../src/game/data/runLevels';
import { RUN_RECIPES } from '../src/game/data/runRecipes';
import { RUN_MECHANICS } from '../src/game/systems/mechanics';
import { MAP_NODES, WORLDS } from '../src/game/worldMap';

const warnings: string[] = [];
const errors: string[] = [];
const packTwoWorldIds = new Set(['world_02_living_room', 'world_03_bedroom', 'world_04_hallway']);

const playableNodes = MAP_NODES.filter((node) => node.nodeType !== 'gate');
const recipeNodeIds = new Set(RUN_RECIPES.map((recipe) => recipe.nodeId));
const themeIds = new Set(LEVELS.map((theme) => theme.id));

for (const node of playableNodes) {
  if (!recipeNodeIds.has(node.id)) errors.push(`${node.id} has no generated run recipe`);
}

for (const world of WORLDS) {
  if (!themeIds.has(world.themeKey)) errors.push(`${world.id} uses missing theme ${world.themeKey}`);
}

const recipePlannedMechanicRefs = RUN_RECIPES.flatMap((recipe) =>
  recipe.mechanicIds
    .filter((mechanicId) => RUN_MECHANICS[mechanicId].status === 'planned')
    .map((mechanicId) => `${recipe.nodeId}:${mechanicId}`)
);
const recipesUsingPlannedMechanics = new Set(recipePlannedMechanicRefs.map((ref) => ref.split(':')[0]));

if (recipePlannedMechanicRefs.length > 0) {
  warnings.push(
    `${recipesUsingPlannedMechanics.size} recipes contain ${recipePlannedMechanicRefs.length} planned mechanic reference(s). Keep reskin-only packs on implemented mechanics only.`
  );
}

for (const recipe of RUN_RECIPES) {
  if (!packTwoWorldIds.has(recipe.worldId)) continue;
  const plannedMechanics = recipe.mechanicIds.filter((mechanicId) => RUN_MECHANICS[mechanicId].status === 'planned');
  if (plannedMechanics.length > 0) {
    errors.push(`${recipe.nodeId} is in Pack 2 but references planned mechanic(s): ${plannedMechanics.join(', ')}`);
  }
}

const runSceneSource = readFileSync(resolve(process.cwd(), 'src/game/scenes/RunScene.ts'), 'utf8');
const themeSpecificBranches = [...runSceneSource.matchAll(/levelId === ['"]([^'"]+)['"]/g)].map((match) => match[1]);
const uniqueThemeBranches = [...new Set(themeSpecificBranches)];

if (uniqueThemeBranches.length > 0) {
  warnings.push(
    `RunScene has theme-specific visual branches for ${uniqueThemeBranches.join(', ')}. Prefer theme data before adding another themed pack.`
  );
}

const worldsByRing = new Map<number, typeof WORLDS>();
for (const world of WORLDS) {
  const group = worldsByRing.get(world.ring) ?? [];
  group.push(world);
  worldsByRing.set(world.ring, group);
}

console.log('Pack readiness pass');
console.log(`- Worlds: ${WORLDS.length}`);
console.log(`- Playable nodes: ${playableNodes.length}`);
console.log(`- Run recipes: ${RUN_RECIPES.length}`);
console.log(`- Runtime themes: ${LEVELS.map((theme) => theme.id).join(', ')}`);
console.log('- Rings:');

for (const [ring, worlds] of [...worldsByRing.entries()].sort(([left], [right]) => left - right)) {
  console.log(`  - Ring ${ring}: ${worlds.map((world) => world.shortName).join(', ')}`);
}

if (warnings.length > 0) {
  console.log('\nWarnings:');
  for (const warning of warnings) console.log(`- ${warning}`);
}

if (errors.length > 0) {
  console.error('\nErrors:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('\nPack readiness passed with no hard blockers.');
