# Kitty Milk Run Asset Manifest

## Concept

- `docs/visual-concept.png` - generated concept reference for the sunny grassland track, HUD, yarn, dog, cucumber, cat racer, finish line, and milk goal.

## Runtime Art Assets

All runtime art is generated local SVG under `public/assets/` and loaded by `src/game/assets.ts`.

- `cat-run-1.svg`, `cat-run-2.svg`, `cat-hit.svg` - starter Sunny Tabby player states.
- `cat-gray-run-1.svg`, `cat-gray-run-2.svg`, `cat-gray-hit.svg` - Gray Moon shop cosmetic.
- `cat-pink-run-1.svg`, `cat-pink-run-2.svg`, `cat-pink-hit.svg` - Pink Sparkle shop cosmetic.
- `cat-tux-run-1.svg`, `cat-tux-run-2.svg`, `cat-tux-hit.svg` - Tuxedo Pop shop cosmetic.
- `cat-rainbow-run-1.svg`, `cat-rainbow-run-2.svg`, `cat-rainbow-hit.svg` - Rainbow Scarf shop cosmetic.
- `cat-nyan-*.svg` - Pop-Tart Nyan Cat player cat family, including Classic Cherry plus directly purchasable flavor variants.
- `mouse-cursor.svg`, `mouse-rodent.svg`, `mouse-cat-toys.svg`, `mouse-cat-nip.svg`, `mouse-scratching-post.svg`, `mouse-laser-dot.svg` - mouse cursor cosmetics in the shop.
- `nyan-cat.svg` - expensive rainbow trail preview with a vertical rainbow trail orientation.
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
- `magical-kingdom/*.png` - generated high-quality pixel art runtime assets for the Magical Milk Kingdom world: gameplay backdrop, milk-glass tower, star lantern, royal moon milk bottle, wobble jelly crown obstacle, and crystal mushroom cluster.
- `generated/magical-kingdom/*.png` - full-resolution generated source assets used to create the runtime Magical Milk Kingdom PNGs.

## Generated Asset Pipelines

- `docs/art/magical-kingdom-asset-style-contract.md` - style contract for Magical Milk Kingdom.
- `docs/art/magical-kingdom-asset-generation-manifest.json` - prompt matrix, source paths, runtime outputs, and QA checks for the generated Magical Milk Kingdom asset batch.

## Runtime Audio Assets

All runtime audio is vendored under `public/assets/audio/`, loaded by `src/game/assets.ts`, and selected by `src/game/sound.ts` with small randomized pitch changes. Sound FX, Music, and volume settings are persisted for current effects and future background music.

- `cat-mew-food.wav`, `cat-mew-purr.wav`, `cat-mew-purr-2.wav`, `cat-soft-mew.wav`, `cat-purr-active.wav` - cat mews and purr from OpenGameArt `Cat Purr & Meow` by Kerzoven, licensed CC0. Source: https://opengameart.org/content/cat-purr-meow
- `cat-pop-meow.ogg` - `Meow` from OpenGameArt / Liberated Pixel Cup by IgnasD, licensed CC0. Source: https://lpc.opengameart.org/content/meow
- `cat-lab-meow.mp3` - `Meowing Cat Made in LabChirp` by Traceletz, licensed CC0. Source: https://opengameart.org/content/meowing-cat-made-in-labchirp

## Code-Native Elements

- Track, lane markers, finish stripe, HUD panel, overlay panels, scoring text, progress text, collision boxes, speed selector UI, synthesized basket-pack sounds, fallback tones, and game state remain code-native in Phaser.
