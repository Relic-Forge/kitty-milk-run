# Kitty Milk Run

A bright, blocky browser game where a speedy cat dodges silly obstacles, collects yarn, and races through grasslands to reach the milk.

## Run locally

```bash
npm install
npm run dev
```

Open the local Vite URL.

## Controls

- Left / Right arrows: move lanes
- A / D: move lanes
- Space: start or restart
- Touch/click: tap to start/restart, swipe left/right while playing
- Shop: click a cat card on the start screen to buy or equip

## MVP Contents

- Phaser + Vite + TypeScript project
- One playable grassland race level
- Generated local SVG art assets for the cat, dog, cucumber, yarn, milk, finish flags, sparkles, and grassland props
- Animated cat racer with lane tweening and hit reactions
- Dog and cucumber damage obstacles
- Tinfoil scare hazard that makes the cat leap to another lane and lose progress
- Vacuum hazard that sucks the cat in, pops it out, and leaves it with crazy hair for the rest of the run
- Yarn collectibles with score, pop effects, and speed ramp
- Three icon hearts with animated broken-heart damage reactions
- Yarn basket for cosmetic purchases
- Custom Kitty Shop with five cat options
- Milk dash progress HUD
- Milk finish line and replayable win cutscene
- Lose/retry state
- Tiny Web Audio sound effects for start, yarn, bonk, and win
- Product docs for Codex handoff

## Repo Structure

- `src/main.ts` boots Phaser.
- `src/game/KittyMilkRunScene.ts` contains the playable race.
- `src/game/assets.ts` loads the SVG asset catalog.
- `src/game/constants.ts` keeps game tuning values together.
- `src/game/sound.ts` provides optional browser-native sound effects.
- `public/assets/` contains generated game artwork.
- `docs/` contains PRD, art direction, build spec, and roadmap.
