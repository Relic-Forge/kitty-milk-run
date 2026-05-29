# Pack Roadmap

Kitty Milk Run should expand from familiar, close-to-home spaces before it moves into bigger outdoor or fantasy routes. Each pack should be shippable as data and reskins first; new mechanics get their own implementation pass before a pack depends on them.

## Pack Status

| Pack | Status | Scope | Worlds | Runtime Intent |
| --- | --- | --- | --- | --- |
| Pack 1 - Home Starter | Built | The first safe milk runs around the bowl and kitchen. | `world_00_home`, `world_01_kitchen` | Existing runner behavior, three lanes, current obstacles and pickups. |
| Pack 2 - House Variations | Next | More rooms inside the house before the cat goes outside. | `world_02_living_room`, `world_03_bedroom`, `world_04_hallway` | Reskin-only. No new mechanics. New value should come from room art, palettes, copy, map treatment, and obstacle/finish skins. |
| Pack 3 - Yard And Porch | Planned | The first outside-but-near-home routes. | `world_05_backyard`, `world_06_porch` | Reskin-first. Moving hazard language can stay flavor until the mechanic is implemented. |
| Pack 4 - Street Edge | Planned | Sidewalk and close neighborhood routes. | `world_07_sidewalk`, `world_08_neighborhood` | Requires a separate mechanic decision before relying on wind, chaser, or traffic-like behavior. |
| Pack 5 - Dream Routes | Planned | Bigger imaginative routes after the grounded home arc works. | `world_09_magical_kingdom` | Premium reskin plus later optional mechanics. Keep fantasy assets isolated from house-pack needs. |

## Expansion Order

1. Home base and kitchen.
2. Nearby rooms: living room, bedroom, hallway.
3. Utility/house-adjacent rooms if needed: bathroom, laundry room, home office, garage, basement.
4. Yard, porch, garden, driveway.
5. Sidewalk, street corner, neighborhood.
6. Parks, town routes, and other public spaces.
7. Dream, holiday, or fantasy routes once the grounded arc has enough variety.

## Pack 2 Contract

Pack 2 is a reskin pack. It should not add or require any new runtime mechanics.

- Keep lane count at the current supported default unless a level intentionally uses the already-implemented `extra_lanes` path.
- Do not depend on `moving_hazards`, `timed_switches`, `wind_push`, `slippery_floor`, `chaser`, `darkness`, or `jump`.
- Treat moving hazards, slippery floors, and other house-room mechanic ideas as future design notes, not Pack 2 acceptance criteria.
- Add value through room-specific assets, palette changes, level names, map copy, obstacle skins, finish skins, and audio labels.
- Run the pack readiness command before content work and after each batch.
- The readiness command must fail if Pack 2 recipes reference planned mechanics.

## Definition Of Ready

A pack is ready to build when:

- The pack scope names the worlds included and excluded.
- Each world has eight main level names and one bonus name.
- New art needs are listed before implementation starts.
- Runtime mechanics are either already implemented or explicitly out of scope.
- `npm run validate:game-data`, `npm run pack:readiness`, `npm run test:architecture`, `npm run typecheck`, and `npm run build` pass.

## Definition Of Built

A pack is built when:

- Every included playable node has a generated run recipe.
- The map shows the pack in the intended progression order.
- The runner uses the intended theme, palette, pickups, obstacles, and finish asset.
- At least one representative level from the pack has been browser-smoked.
- No Pack 2 content introduces a new `RunScene` level-specific branch.
