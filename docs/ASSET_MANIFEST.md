# Kitty Milk Run Asset Manifest

## Concept

- `docs/visual-concept.png` - generated concept reference for the sunny grassland track, HUD, yarn, dog, cucumber, cat racer, finish line, and milk goal.

## Runtime Assets

All runtime art is generated local SVG under `public/assets/` and loaded by `src/game/assets.ts`.

- `cat-run-1.svg`, `cat-run-2.svg`, `cat-hit.svg` - player states for run bobbing and hit reaction.
- `dog.svg` - friendly dog obstacle.
- `cucumber.svg` - silly cucumber obstacle.
- `foil.svg` - late-run surprise obstacle.
- `yarn-pink.svg`, `yarn-blue.svg`, `yarn-purple.svg` - collectible yarn variants.
- `milk-bottle.svg`, `milk-bowl.svg` - finish goal and win cutscene props.
- `finish-flag.svg` - finish line marker.
- `sparkle.svg` - particle effect.
- `flower.svg`, `grass-tuft.svg`, `paw-print.svg` - scrolling grassland decoration.

## Code-Native Elements

- Track, lane markers, finish stripe, HUD panel, overlay panels, scoring text, progress text, collision boxes, and game state remain code-native in Phaser.
