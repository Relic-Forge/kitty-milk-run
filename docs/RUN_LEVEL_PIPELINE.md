# Run Level Pipeline

Kitty Milk Run levels should scale through data recipes first, with scene code added only when a mechanic needs new runtime behavior.

## Architecture

- `src/game/worldMap.ts` owns map progression, world fantasy, unlocks, broad difficulty, skins, and planned mechanic flags.
- `src/game/data/runLevels.ts` owns reusable visual run themes.
- `src/game/data/runRecipes.ts` turns each playable map node into a concrete runner recipe.
- `src/game/systems/laneLayout.ts` turns `laneCount` into lane positions, road width, and lane marker positions.
- `src/game/systems/mechanics.ts` is the registry for mechanic IDs and implementation status.
- `src/game/scenes/RunScene.ts` consumes the recipe and lane layout. It should not grow per-level special cases.

## Adding A Normal Level

1. Add or update the world and node copy in `worldMap.ts`.
2. Prefer existing visual themes from `runLevels.ts`; add a theme only when the world needs different runtime art/colors.
3. Let `runRecipes.ts` generate the default recipe from the map node.
4. If the level needs a tweak, add a small override in `NODE_RECIPE_OVERRIDES`.
5. Run:

```bash
npm run validate:game-data
npm run pack:readiness
npm run test:architecture
npm run typecheck
npm run build
```

## Adding A New Mechanic

1. Add the mechanic ID to `src/game/systems/mechanics.ts`.
2. Add the world flag or recipe override that enables it.
3. Add validation rules if the mechanic needs required fields, assets, or lane counts.
4. Implement the runtime behavior behind a small method or system module.
5. Keep the recipe as the activation point. Avoid `if levelId === ...` branches in `RunScene`.

## Recipe Invariants

- Every playable map node must have exactly one run recipe.
- Lane count must be 2 through 5.
- A recipe must have at least one pickup asset and one obstacle available at distance `0`.
- Yarn spawn distance must fit before the finish.
- All mechanic IDs must exist in the registry.
- Four-lane or five-lane levels should declare the `extra_lanes` mechanic.

## Pack Readiness

Run this before starting a new pack and after each batch of pack data changes:

```bash
npm run pack:readiness
```

The readiness pass reports the current world count, playable node count, runtime themes, progression rings, planned-mechanic usage, and remaining theme-specific `RunScene` branches. Warnings are allowed for later planned packs, but the active reskin-only pack should not introduce new warnings or planned-mechanic dependencies.

For Pack 2, the contract is reskin-only:

- Use house/room themes, palettes, copy, pickups, obstacles, finish assets, and map styling for variety.
- Do not require new runtime mechanics.
- Treat planned mechanic ideas as future notes unless a separate mechanic implementation pass lands first.
- Keep `RunScene` free of new level-specific branches.

## Current Status

- Data-driven lane counts are supported.
- The default three-lane layout preserves the original lane positions: `310`, `480`, `650`.
- Obstacle tables, hitboxes, pickup assets, finish distance, spawn cadence, and finish assets are recipe-driven.
- `extra_lanes` and `bonus_objective` are implemented registry entries.
- `moving_hazards`, `timed_switches`, `darkness`, `wind_push`, `slippery_floor`, `chaser`, and `jump` are registered as planned mechanics.
- Pack roadmap lives in `docs/PACK_ROADMAP.md`.
