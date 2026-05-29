# Kitty Milk Run Roadmap

This roadmap tracks the broad product direction. Pack-level expansion planning lives in `docs/PACK_ROADMAP.md`.

## Current Foundation

The game now has the core runner, map progression, cosmetics/shop surfaces, reusable run recipes, and validation scripts needed to scale content safely.

Built foundation:

- Data-driven world map and playable nodes.
- Generated run recipes for playable nodes.
- Runtime themes for kitchen, living room, backyard, and Magical Milk Kingdom routes.
- Implemented `extra_lanes` and `bonus_objective` mechanic registry entries.
- Validation gates for game data, run architecture, pack readiness, TypeScript, and production build.

## Near-Term Work

1. Build Pack 2 as a reskin-only house pack: living room, bedroom, and hallway.
2. Add room-specific art, palette treatment, obstacle skins, finish skins, and map polish without adding new mechanics.
3. Browser-smoke one representative level from each Pack 2 world.
4. Keep planned mechanics out of Pack 2 recipes unless a separate implementation pass lands first.

## Later Work

- Yard and porch pack.
- Sidewalk and neighborhood pack.
- New mechanic passes for moving hazards, slippery floors, wind push, chasers, darkness, timed switches, and jump.
- Dream, holiday, or fantasy packs after the close-to-home arc has enough variety.
- Optional level-builder tooling once the recipe pipeline is stable enough to expose safely.
