# Kitty Milk Run Asset Manifest

## Concept

- `docs/visual-concept.png` - generated concept reference for the sunny grassland track, HUD, yarn, dog, cucumber, cat racer, finish line, and milk goal.

## Runtime Assets

All runtime art is generated local SVG under `public/assets/` and loaded by `src/game/assets.ts`.

- `cat-run-1.svg`, `cat-run-2.svg`, `cat-hit.svg` - starter Sunny Tabby player states.
- `cat-gray-run-1.svg`, `cat-gray-run-2.svg`, `cat-gray-hit.svg` - Gray Moon shop cosmetic.
- `cat-pink-run-1.svg`, `cat-pink-run-2.svg`, `cat-pink-hit.svg` - Pink Sparkle shop cosmetic.
- `cat-tux-run-1.svg`, `cat-tux-run-2.svg`, `cat-tux-hit.svg` - Tuxedo Pop shop cosmetic.
- `cat-rainbow-run-1.svg`, `cat-rainbow-run-2.svg`, `cat-rainbow-hit.svg` - Rainbow Scarf shop cosmetic.
- `heart-full.svg`, `heart-broken.svg` - three-icon heart HUD and broken-heart damage state.
- `crazy-hair.svg` - persistent post-vacuum hair overlay.
- `dog.svg` - friendly dog obstacle.
- `cucumber.svg` - silly cucumber obstacle.
- `foil.svg` - tinfoil scare hazard.
- `vacuum.svg` - vacuum hazard.
- `yarn-pink.svg`, `yarn-blue.svg`, `yarn-purple.svg` - collectible yarn variants.
- `milk-bottle.svg`, `milk-bowl.svg` - finish goal and win cutscene props.
- `finish-flag.svg` - finish line marker.
- `sparkle.svg` - particle effect.
- `flower.svg`, `grass-tuft.svg`, `paw-print.svg` - scrolling grassland decoration.

## Code-Native Elements

- Track, lane markers, finish stripe, HUD panel, overlay panels, scoring text, progress text, collision boxes, and game state remain code-native in Phaser.
