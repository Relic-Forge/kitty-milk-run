# Kitty Milk Run Phaser Scene + UI Component Refactor Plan

## Purpose

Kitty Milk Run has grown past the original prototype shape. The current game works, but the code is carrying too many responsibilities in one place: gameplay, launch screen, Milk Map, shop, progression, storage, cosmetics, audio settings, UI drawing, and state transitions.

This plan splits the project into scenes, data modules, reusable UI components, and services without changing gameplay behavior. The goal is to make the game easier to edit, easier for Codex to reason about, and safe to scale into many worlds, levels, locations, cultures, cosmetics, seasonal events, and future mechanics.

The main rule for this refactor:

> Preserve the runner gameplay first. Extract around it. Improve visuals after the structure is stable.

## Implementation Status

Completed extraction passes:

- `storageKeys.ts` now owns persisted storage key names.
- `cosmetics.ts` now owns cat, Nyan, accessory, trail, and mouse cursor definitions.
- `speedOptions.ts` now owns speed option data and speed label formatting.
- `runLevels.ts` now owns runner theme/level tuning data.
- `StorageService.ts` now wraps `localStorage` access with safe string, number, and JSON helpers.
- `ProgressService.ts` now owns Milk Map progress, node selection, unlock checks, milk totals, map card copy, and post-run bottle awards.
- `CosmeticService.ts` now owns the yarn basket, selected cosmetics, unlocked item sets, buy/equip behavior, cursor selection, and Cat God fallback cleanup.
- `AudioSettingsService.ts` now owns sound/music/volume persistence and applies settings to `sound.ts`.
- `GameStateService.ts` now owns selected run mode, selected speed multiplier, and selected level persistence.
- `PixelButton.ts` and `PixelPanel.ts` establish reusable pixel UI primitives, with overlay and pause buttons already routed through `PixelButton`.
- `MilkMapRenderer.ts` owns Milk Map drawing, atlas paging, node buttons, world peeks, selected-card rendering, and map cat avatar updates.
- `ShopRenderer.ts` owns shop cards, section nav, scrollbar/drag state, Cat God button drawing, and shop card update/draw behavior.
- `BootScene.ts`, `LaunchScene.ts`, `MilkMapScene.ts`, `ShopScene.ts`, and `RunScene.ts` are registered in `main.ts`.
- `RunScene.ts` now contains the converted runner scene implementation.
- `LaunchScene.ts`, `MilkMapScene.ts`, and `ShopScene.ts` are Phaser scene entrypoints with their own scene keys and initial modes.
- `KittyMilkRunScene.ts` has been removed as a runtime file.

Current phase status:

- Phase 6 is complete. The app boots through Phaser scene registration and navigates between launch, Milk Map, shop, and run scenes.
- The next planned work is Phase 7: the premium Milk Map visual pass.

---

## Current Runtime

The game currently runs as a Phaser browser game through Vite and TypeScript.

Current stack:

- Vite
- Phaser
- TypeScript
- Browser canvas rendering
- Fixed game size: `960x540`
- Phaser scale mode: `FIT`, centered
- Phaser scenes: `BootScene`, `LaunchScene`, `MilkMapScene`, `ShopScene`, and `RunScene`
- Browser `localStorage` for player state, shop state, map progress, speed, and audio settings

Current architecture note:

```text
RunScene owns the runner implementation and remains the behavior-preserving host for shared screen setup during this refactor pass.
```

The broad implementation still owns several responsibilities that later phases can make thinner:

- scene lifecycle
- start/home overlay
- Milk Map overlay
- shop overlay
- gameplay loop
- obstacle spawning
- collision handling
- player movement
- HUD
- progression state
- storage keys
- cosmetics data
- shop cards
- audio settings
- map node rendering
- map node unlocking
- launch screen rendering
- button creation
- text styling
- pixel-art helper drawing

This is normal for a prototype, but it is now blocking clean UI work.

---

## Refactor Strategy

Do not start with a visual redesign. Start by separating responsibilities.

Safe sequence:

```text
Data extraction
→ UI primitives
→ storage/progression/cosmetic services
→ Milk Map renderer extraction
→ shop renderer extraction
→ scene split
→ premium visual pass
```

The Milk Map should not become prettier while still living as hand-drawn UI inside the same giant scene. That will only make the blob larger.

---

## Target Folder Structure

```text
src/
  main.ts
  style.css

  game/
    constants.ts
    assets.ts
    sound.ts

    scenes/
      BootScene.ts
      LaunchScene.ts
      MilkMapScene.ts
      ShopScene.ts
      RunScene.ts

    data/
      cosmetics.ts
      shop.ts
      speedOptions.ts
      runLevels.ts
      worldMap.ts
      storageKeys.ts

    services/
      StorageService.ts
      GameStateService.ts
      ProgressService.ts
      CosmeticService.ts
      AudioSettingsService.ts

    ui/
      core/
        createTextStyle.ts
        palette.ts
        layout.ts
        types.ts

      components/
        PixelButton.ts
        PixelPanel.ts
        MilkBottleCounter.ts
        CatPreview.ts
        AudioToggle.ts
        VolumeSlider.ts
        SpeedSelector.ts
        SelectedRunCard.ts
        SelectedLevelCard.ts

      map/
        MilkMapRenderer.ts
        MapHeader.ts
        WorldViewport.ts
        WorldPeekCard.ts
        MapPathLayer.ts
        MapNodeView.ts
        MapProgressCard.ts

      shop/
        ShopCard.ts
        ShopSection.ts
        ShopScrollbar.ts
        ShopNavButton.ts

      effects/
        FloatingText.ts
        PixelCharms.ts
        CatEyeTracker.ts
```

This is the target shape, not a single giant PR. Each piece should be moved in controlled passes.

---

## Scene Responsibilities

## `BootScene`

Optional, but recommended after the first extraction pass.

Purpose:

- preload shared assets
- initialize persisted game state
- apply stored audio settings
- route to the launch screen

Responsibilities:

- call `loadGameAssets(this)`
- call service load methods
- start `LaunchScene`

Should not contain:

- gameplay logic
- shop rendering
- Milk Map rendering
- progression rules

Example:

```ts
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    loadGameAssets(this);
  }

  create() {
    GameStateService.load();
    ProgressService.load();
    CosmeticService.load();
    AudioSettingsService.loadAndApply();
    this.scene.start('LaunchScene');
  }
}
```

---

## `LaunchScene`

Purpose:

The home/start screen. This is the cat's home base.

Owns:

- selected cat preview
- current run summary
- Start Run button
- Milk Map button
- Shop button
- speed selector/dropdown
- milk bottle total badge
- sound/music controls if they remain on home

Does not own:

- Milk Map node rendering
- shop card rendering
- obstacle spawning
- collision handling
- map unlock rules

Navigation:

```text
Start Run -> RunScene
Milk Map  -> MilkMapScene
Shop      -> ShopScene
```

Current code to extract:

- `createLaunchScreen()`
- `updateLaunchUi()`
- `createSpeedSelector()`
- home action buttons
- selected cat preview
- home milk bottle badge

Target file:

```text
src/game/scenes/LaunchScene.ts
```

Launch should consume state through services:

```ts
const selectedNode = ProgressService.getCurrentRunNode();
const selectedCosmetic = CosmeticService.getSelectedCosmetic();
const totalMilk = ProgressService.getTotalMilk();
```

---

## `MilkMapScene`

Purpose:

The premium level-select map. This scene owns the world progression UI.

Owns:

- Milk Map header
- active world viewport
- previous/next world preview cards
- map paths
- map nodes
- selected-level card
- Play button
- Back button
- Shop button
- map cat avatar

Does not own:

- runner gameplay
- shop purchase rules
- localStorage implementation
- cosmetic item definitions

Current code to extract:

- `createMilkMapScreen()`
- `createMapAtlasPage()`
- `createMapWorldBands()`
- `createWorldPeek()`
- `createMapConnections()`
- `createMapNodes()`
- `createMapPreviewCard()`
- `selectMapNode()`
- `updateMapUi()`
- `drawMapNodeButton()`
- map card body helpers

Target file:

```text
src/game/scenes/MilkMapScene.ts
```

Milk Map scene should orchestrate these renderer modules:

```text
MilkMapScene
  -> MapHeader
  -> MilkMapRenderer
       -> WorldViewport
       -> MapPathLayer
       -> MapNodeView[]
       -> WorldPeekCard[]
  -> SelectedLevelCard
```

The scene should not manually draw every shape inline.

---

## `ShopScene`

Purpose:

The Custom Kitty Shop.

Owns:

- shop sections
- shop cards
- scroll mask
- scrollbar
- category buttons
- buy/equip interactions
- Cat God test toggle if kept
- basket counter

Does not own:

- Milk Map rendering
- gameplay loop
- home layout
- world unlock logic

Current code to extract:

- `createShopCards()`
- `createShopSection()`
- `createShopCard()`
- `createShopPreview()`
- `createShopSectionButton()`
- shop scrolling state
- shop card state drawing
- buy/equip UI updates

Target file:

```text
src/game/scenes/ShopScene.ts
```

Data should come from:

```text
src/game/data/cosmetics.ts
src/game/data/shop.ts
```

State should come from:

```text
CosmeticService
GameStateService
StorageService
```

---

## `RunScene`

Purpose:

The playable runner game.

Owns:

- player creation
- lane movement
- obstacle spawning
- yarn spawning
- collision handling
- run HUD
- pause state
- countdown
- finish line
- win/loss screen
- progress reward calculation

Does not own:

- launch screen rendering
- Milk Map rendering
- shop browsing
- cosmetic data arrays
- speed option data arrays
- localStorage implementation details

Current code to preserve and move:

- `createWorld()`
- `createHud()`
- `createPlayer()`
- `createFinishObjects()`
- `createParticles()`
- gameplay input binding
- countdown sequence
- `scrollWorld()`
- obstacle spawning
- yarn spawning
- collision handling
- foil behavior
- vacuum behavior
- win/loss handling

Target file:

```text
src/game/scenes/RunScene.ts
```

Run scene should receive its launch data:

```ts
this.scene.start('RunScene', {
  mapNodeId: ProgressService.getCurrentRunNode().id,
  runMode: GameStateService.getRunMode(),
  speedMultiplier: GameStateService.getSpeedMultiplier()
});
```

`RunScene` should ask `ProgressService` to update map progress after a win.

---

# Data Module Split

## `storageKeys.ts`

Move all storage keys out of the scene.

Target:

```text
src/game/data/storageKeys.ts
```

Do not rename any keys during the refactor. Existing player progress must survive.

Example:

```ts
export const STORAGE_KEYS = {
  basket: 'kitty-milk-run:yarn-basket',
  selected: 'kitty-milk-run:selected-cat',
  unlocked: 'kitty-milk-run:unlocked-cats',
  selectedAccessory: 'kitty-milk-run:selected-accessory',
  unlockedAccessories: 'kitty-milk-run:unlocked-accessories',
  selectedTrail: 'kitty-milk-run:selected-trail',
  unlockedTrails: 'kitty-milk-run:unlocked-trails',
  selectedMouse: 'kitty-milk-run:selected-mouse',
  unlockedMouse: 'kitty-milk-run:unlocked-mouse',
  speed: 'kitty-milk-run:milk-speed',
  level: 'kitty-milk-run:selected-level',
  mode: 'kitty-milk-run:selected-mode',
  soundFx: 'kitty-milk-run:sound-fx-enabled',
  music: 'kitty-milk-run:music-enabled',
  audioVolume: 'kitty-milk-run:audio-volume',
  mapProgress: 'kitty-milk-run:milk-map-progress',
  selectedMapNode: 'kitty-milk-run:selected-map-node'
} as const;
```

---

## `cosmetics.ts`

Move static cosmetic definitions out of the scene.

Target:

```text
src/game/data/cosmetics.ts
```

Move:

- `CosmeticOption`
- Nyan variations
- accessories
- trails
- mouse cursor options
- default selected IDs

The shop and launch screen should import this data, not define it.

---

## `speedOptions.ts`

Move speed option definitions out of the scene.

Target:

```text
src/game/data/speedOptions.ts
```

Keep current option names:

- Loaf Mode
- Purr Trot
- Zoomies
- Turbo Floof

Future UI can render the same data as a dropdown without touching gameplay.

---

## `runLevels.ts`

Move gameplay theme data out of the scene.

Target:

```text
src/game/data/runLevels.ts
```

This is separate from `worldMap.ts`.

- `worldMap.ts` describes progression and map structure.
- `runLevels.ts` describes the runner gameplay skin/tuning for a theme.

---

## `worldMap.ts`

The current `worldMap.ts` is a good foundation. Keep it and eventually move it under `src/game/data/worldMap.ts` if needed.

Keep:

- `WorldConfig`
- `MapNode`
- `MechanicFlags`
- `WORLDS`
- `MAP_NODES`
- `MAP_CONNECTIONS`
- `getWorldForNode()`

Recommended future additions:

```ts
export type DistanceRing =
  | 'home'
  | 'around_house'
  | 'yard_and_street'
  | 'neighborhood'
  | 'town'
  | 'city'
  | 'region'
  | 'country'
  | 'global_special'
  | 'fantasy';
```

Add this later to `WorldConfig`:

```ts
progressionScope: {
  ringId: DistanceRing;
  distanceFromHome: number;
  locationScale: 'room' | 'house' | 'yard' | 'street' | 'neighborhood' | 'city' | 'region' | 'country' | 'fantasy';
};
```

This supports slow expansion from home to bigger places without jumping too quickly.

---

# Services

## `StorageService`

Purpose:

A typed wrapper around `localStorage`.

Target:

```text
src/game/services/StorageService.ts
```

Responsibilities:

- safe string read/write
- safe number read/write
- safe JSON read/write
- fallback defaults
- error handling for storage failures

Example API:

```ts
export class StorageService {
  static getString(key: string, fallback: string): string;
  static setString(key: string, value: string): void;
  static getNumber(key: string, fallback: number): number;
  static setNumber(key: string, value: number): void;
  static getJson<T>(key: string, fallback: T): T;
  static setJson<T>(key: string, value: T): void;
}
```

No scene should call `localStorage` directly after this extraction.

---

## `ProgressService`

Purpose:

Own Milk Map progression logic.

Target:

```text
src/game/services/ProgressService.ts
```

Move out of scene:

- selected map node
- map progress record
- total milk calculation
- map milk goal calculation
- node unlocked/playable checks
- gate logic
- newest playable/current run selection
- post-run bottle updates

Example API:

```ts
export class ProgressService {
  static load(): void;
  static save(): void;
  static getSelectedNode(): MapNode;
  static setSelectedNode(nodeId: string): void;
  static getCurrentRunNode(): MapNode;
  static getNewestUnlockedNode(): MapNode;
  static isNodeUnlocked(node: MapNode): boolean;
  static isNodePlayable(node: MapNode): boolean;
  static getBottlesForNode(nodeId: string): number;
  static getTotalMilk(): number;
  static getMapMilkGoal(): number;
  static completeRun(nodeId: string, score: number, yarn: number): number;
}
```

`completeRun()` should only increase the stored bottle rating if the new rating beats the old rating.

---

## `CosmeticService`

Purpose:

Own selected and unlocked cosmetics.

Target:

```text
src/game/services/CosmeticService.ts
```

Responsibilities:

- selected cat
- selected accessory
- selected trail
- selected mouse cursor
- unlocked cosmetic sets
- buy/equip methods
- yarn basket spending
- selected texture helpers

Move out of the scene:

- buy/equip cat logic
- buy/equip mouse logic
- buy/equip trail logic
- buy/equip accessory logic
- selected cosmetic lookup
- unlocked item persistence

---

## `AudioSettingsService`

Purpose:

Own audio settings, not necessarily sound playback.

Target:

```text
src/game/services/AudioSettingsService.ts
```

Responsibilities:

- sound FX enabled
- music enabled
- volume
- persistence
- apply settings to existing `sound.ts`

`src/game/sound.ts` can remain the playback helper.

---

## `GameStateService`

Purpose:

Small in-memory holder for current session choices.

Target:

```text
src/game/services/GameStateService.ts
```

Responsibilities:

- selected run mode
- selected speed multiplier
- transient return scene for shop
- any temporary scene navigation state

Keep this small. Do not turn it into another blob.

---

# Reusable UI Components

## `PixelButton`

Target:

```text
src/game/ui/components/PixelButton.ts
```

Purpose:

One standard button system across Launch, Map, Shop, Pause, Win/Loss.

Config:

```ts
type PixelButtonConfig = {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  color: number;
  disabled?: boolean;
  onClick: () => void;
};
```

Methods:

```ts
setLabel(label: string): void;
setDisabled(disabled: boolean): void;
setVisible(visible: boolean): void;
destroy(): void;
```

Visual rules:

- consistent height
- consistent border
- consistent hover
- consistent disabled state
- consistent text stroke
- consistent pressed state

This is one of the fastest ways to make the UI feel less primitive.

---

## `PixelPanel`

Target:

```text
src/game/ui/components/PixelPanel.ts
```

Purpose:

Reusable rounded panel with fill, border, radius, alpha, and optional shadow.

Use it instead of repeating `fillRoundedRect` and `strokeRoundedRect` all over the scene.

---

## `MilkBottleCounter`

Target:

```text
src/game/ui/components/MilkBottleCounter.ts
```

Purpose:

Reusable bottle icon + count UI.

Used in:

- LaunchScene
- MilkMapScene
- future win/reward screens

Modes:

- compact HUD
- large reward
- map header

---

## `CatPreview`

Target:

```text
src/game/ui/components/CatPreview.ts
```

Purpose:

Reusable selected-cat display with optional eye tracking.

This should wrap the current eye-tracked cat behavior instead of keeping that logic in the main scene file.

---

## `SelectedRunCard`

Target:

```text
src/game/ui/components/SelectedRunCard.ts
```

Purpose:

Home screen current-run summary.

Shows:

- current level name
- world name
- level number
- bottle rating
- short flavor line

---

## `SelectedLevelCard`

Target:

```text
src/game/ui/components/SelectedLevelCard.ts
```

Purpose:

Milk Map selected-level panel.

Shows:

- selected node name
- world short name
- best milk rating
- flavor text
- lock requirement if locked
- Play button when playable

This should be compact and stable. It should never overlap the map body.

---

## `SpeedSelector`

Target:

```text
src/game/ui/components/SpeedSelector.ts
```

Purpose:

Reusable speed selector.

Phase 1:

- preserve current visual behavior
- move code only

Phase 2:

- convert to compact dropdown
- keep animated selected option

---

# Milk Map Components

## `MilkMapRenderer`

Target:

```text
src/game/ui/map/MilkMapRenderer.ts
```

Purpose:

Top-level map renderer used by `MilkMapScene`.

Owns:

- active world rendering
- path layer
- node layer
- world peeks
- selected cat avatar placement

API:

```ts
render(worldId: string): void;
selectNode(nodeId: string): void;
refreshProgress(): void;
destroy(): void;
```

---

## `WorldViewport`

Target:

```text
src/game/ui/map/WorldViewport.ts
```

Purpose:

Render the active world as a focused board.

Owns:

- active world background panel
- world title
- decorative bands
- future pixel-art diorama layers
- safe bounds for map labels/nodes

This is where the premium map art direction should eventually live.

---

## `MapPathLayer`

Target:

```text
src/game/ui/map/MapPathLayer.ts
```

Purpose:

Draw node connections only.

Inputs:

- world node list
- palette
- selected/unlocked state if needed

Should not contain text, click handlers, or progression rules.

---

## `MapNodeView`

Target:

```text
src/game/ui/map/MapNodeView.ts
```

Purpose:

Reusable visual for one map node.

Config:

```ts
type MapNodeViewConfig = {
  scene: Phaser.Scene;
  node: MapNode;
  world: WorldConfig;
  state: {
    selected: boolean;
    unlocked: boolean;
    playable: boolean;
    bottles: number;
  };
  onSelect: (nodeId: string) => void;
};
```

States:

- selected
- completed with 1/2/3 bottles
- unlocked but unplayed
- locked
- bonus
- gate

The current `drawMapNodeButton()` logic should become this class.

---

## `WorldPeekCard`

Target:

```text
src/game/ui/map/WorldPeekCard.ts
```

Purpose:

Reusable previous/next world preview tab.

Shows:

- Previous / Next eyebrow
- world short name
- theme color
- click target

---

## `MapHeader`

Target:

```text
src/game/ui/map/MapHeader.ts
```

Purpose:

Milk Map top bar.

Shows:

- cat icon or face
- `Milk Map`
- milk bottle counter
- optional Back/Shop buttons depending final layout

---

# Shop Components

## `ShopCard`

Target:

```text
src/game/ui/shop/ShopCard.ts
```

Purpose:

Reusable shop item card.

Owns:

- preview
- item name
- price
- owned/equipped state
- click zone
- hover tween

Does not own purchase rules. It calls `onSelect(itemId)`.

---

## `ShopSection`

Target:

```text
src/game/ui/shop/ShopSection.ts
```

Purpose:

A labeled section containing multiple shop cards.

Examples:

- Cats
- Mouse
- Trails
- Accessories

---

## `ShopScrollbar`

Target:

```text
src/game/ui/shop/ShopScrollbar.ts
```

Purpose:

Reusable scrollbar drawing and thumb update.

---

## `ShopNavButton`

Target:

```text
src/game/ui/shop/ShopNavButton.ts
```

Purpose:

Category jump buttons.

---

# Migration Plan

## Phase 0: Add regression guardrails

Before moving code:

- run `npm run build`
- capture screenshots of launch, Milk Map, shop, gameplay, win, and lose states
- create a manual QA checklist

Suggested file:

```text
docs/qa/manual-regression-checklist.md
```

Checklist:

```text
Launch
- Start screen loads
- Selected cat appears
- Current run card appears
- Start Run starts newest playable level
- Milk Map opens
- Shop opens
- Speed selector changes and persists

Milk Map
- Map opens
- Active world renders
- Nodes render
- Locked nodes cannot play
- Playable nodes can be selected
- Play starts selected playable node
- Back returns home
- Shop opens shop

Run
- Countdown appears
- Cat moves left/right
- Yarn can be collected
- Obstacles damage cat
- Foil scare works
- Vacuum works
- Hearts update
- Finish line win works
- Losing works
- Retry works

Shop
- Shop opens
- Scroll works
- Category buttons work
- Buy/equip works
- Basket updates
- Selected cat updates on home/run
```

---

## Phase 1: Extract static data

Risk: low.

Create:

```text
src/game/data/storageKeys.ts
src/game/data/cosmetics.ts
src/game/data/speedOptions.ts
src/game/data/runLevels.ts
```

Move static arrays/types only. Do not change behavior.

Acceptance criteria:

- build passes
- visuals unchanged
- shop still works
- map still works
- run still works

---

## Phase 2: Extract UI primitives

Risk: low to medium.

Create:

```text
src/game/ui/components/PixelButton.ts
src/game/ui/components/PixelPanel.ts
src/game/ui/components/CatPreview.ts
src/game/ui/components/MilkBottleCounter.ts
src/game/ui/core/createTextStyle.ts
src/game/ui/core/palette.ts
```

Start by replacing only a few buttons. Match current visuals before improving them.

Acceptance criteria:

- click zones still work
- hover still works
- depth ordering still works
- no visual regressions beyond minor differences

---

## Phase 3: Extract services

Risk: medium.

Create:

```text
src/game/services/StorageService.ts
src/game/services/ProgressService.ts
src/game/services/CosmeticService.ts
src/game/services/AudioSettingsService.ts
src/game/services/GameStateService.ts
```

Move logic gradually:

1. `StorageService`
2. `ProgressService`
3. `CosmeticService`
4. `AudioSettingsService`
5. `GameStateService`

Acceptance criteria:

- existing localStorage keys unchanged
- existing player progress remains readable
- selected cat persists
- unlocked cosmetics persist
- map progress persists
- selected map node persists
- speed/audio settings persist

---

## Phase 4: Extract Milk Map renderer while keeping current scene

Risk: medium.

Create:

```text
src/game/ui/map/MilkMapRenderer.ts
src/game/ui/map/WorldViewport.ts
src/game/ui/map/MapPathLayer.ts
src/game/ui/map/MapNodeView.ts
src/game/ui/map/WorldPeekCard.ts
src/game/ui/map/MapHeader.ts
src/game/ui/components/SelectedLevelCard.ts
```

Move map drawing out of `KittyMilkRunScene` while still letting the current scene call the renderer.

Acceptance criteria:

- Milk Map still opens
- nodes still select
- selected avatar follows selected node
- locked states still match
- gates still work
- bonus nodes still work
- bottle ratings still show
- Play starts the correct run

---

## Phase 5: Extract shop renderer while keeping current scene

Risk: medium.

Create:

```text
src/game/ui/shop/ShopCard.ts
src/game/ui/shop/ShopSection.ts
src/game/ui/shop/ShopScrollbar.ts
src/game/ui/shop/ShopNavButton.ts
```

Acceptance criteria:

- shop opens
- scrolling works
- category jumps work
- buy/equip works
- basket updates
- selected cosmetic updates elsewhere

---

## Phase 6: Split Phaser scenes

Risk: medium to high.

Create:

```text
src/game/scenes/LaunchScene.ts
src/game/scenes/MilkMapScene.ts
src/game/scenes/ShopScene.ts
src/game/scenes/RunScene.ts
```

Update `src/main.ts`:

```ts
scene: [BootScene, LaunchScene, MilkMapScene, ShopScene, RunScene]
```

or initially:

```ts
scene: [LaunchScene, MilkMapScene, ShopScene, RunScene]
```

Scene navigation:

```ts
// LaunchScene
this.scene.start('RunScene', { mapNodeId });
this.scene.start('MilkMapScene');
this.scene.start('ShopScene', { returnTo: 'LaunchScene' });

// MilkMapScene
this.scene.start('RunScene', { mapNodeId: selectedNode.id });
this.scene.start('LaunchScene');
this.scene.start('ShopScene', { returnTo: 'MilkMapScene' });

// ShopScene
this.scene.start(returnTo ?? 'LaunchScene');

// RunScene
this.scene.start('LaunchScene');
```

Acceptance criteria:

- app boots to home
- home starts run
- home opens map
- home opens shop
- map can select/play level
- shop returns to previous screen
- run returns to home after win/loss
- no duplicate input handlers
- no duplicate sounds
- no orphaned visible objects

---

## Phase 7: Premium Milk Map visual pass

Risk: low after architecture is clean.

Improve:

- one active world viewport
- previous/next world peeks
- compact header
- compact selected-level card
- consistent buttons
- reusable node states
- fewer labels inside the map body
- environment landmarks
- pixel-art diorama backgrounds

This phase should mostly touch:

```text
src/game/scenes/MilkMapScene.ts
src/game/ui/map/*
src/game/ui/components/SelectedLevelCard.ts
src/game/data/worldMap.ts
public/assets/*
```

Gameplay should remain untouched.

---

# No-Break Rules

Do not change these during structural refactor:

- `GAME_WIDTH`
- `GAME_HEIGHT`
- lane positions
- physics settings
- obstacle spawn timing
- scoring thresholds
- localStorage key names
- map node IDs
- world IDs
- asset keys
- sound helper behavior

Changing IDs or storage keys can silently wipe player progress. Treat that as a separate migration later.

---

# Suggested PR Sequence

## PR 1: Data extraction

```text
Extract game data from KittyMilkRunScene
```

Files:

```text
src/game/data/storageKeys.ts
src/game/data/cosmetics.ts
src/game/data/speedOptions.ts
src/game/data/runLevels.ts
src/game/KittyMilkRunScene.ts
```

Expected outcome:

Scene file is smaller. No behavior changes.

---

## PR 2: UI primitives

```text
Add reusable Phaser UI primitives
```

Files:

```text
src/game/ui/components/PixelButton.ts
src/game/ui/components/PixelPanel.ts
src/game/ui/components/CatPreview.ts
src/game/ui/components/MilkBottleCounter.ts
src/game/ui/core/createTextStyle.ts
src/game/ui/core/palette.ts
```

Expected outcome:

Reusable UI pieces exist. Replace only a small set of buttons at first.

---

## PR 3: Progress and storage services

```text
Move progression and local storage logic into services
```

Files:

```text
src/game/services/StorageService.ts
src/game/services/ProgressService.ts
src/game/services/GameStateService.ts
src/game/KittyMilkRunScene.ts
```

Expected outcome:

Map unlock logic no longer lives directly in the scene.

---

## PR 4: Cosmetic and audio services

```text
Move cosmetics and audio settings into services
```

Files:

```text
src/game/services/CosmeticService.ts
src/game/services/AudioSettingsService.ts
src/game/KittyMilkRunScene.ts
```

Expected outcome:

Shop and home read equipped items without owning persistence logic.

---

## PR 5: Milk Map renderer extraction

```text
Extract Milk Map renderer and map UI components
```

Files:

```text
src/game/ui/map/MilkMapRenderer.ts
src/game/ui/map/WorldViewport.ts
src/game/ui/map/MapPathLayer.ts
src/game/ui/map/MapNodeView.ts
src/game/ui/map/WorldPeekCard.ts
src/game/ui/components/SelectedLevelCard.ts
src/game/KittyMilkRunScene.ts
```

Expected outcome:

Milk Map is easier to edit. No visual redesign yet.

---

## PR 6: Shop UI extraction

```text
Extract shop UI components
```

Files:

```text
src/game/ui/shop/ShopCard.ts
src/game/ui/shop/ShopSection.ts
src/game/ui/shop/ShopScrollbar.ts
src/game/ui/shop/ShopNavButton.ts
src/game/KittyMilkRunScene.ts
```

Expected outcome:

Shop code no longer lives directly in the main scene.

---

## PR 7: Scene split

```text
Split launch, map, shop, and run into Phaser scenes
```

Files:

```text
src/main.ts
src/game/scenes/LaunchScene.ts
src/game/scenes/MilkMapScene.ts
src/game/scenes/ShopScene.ts
src/game/scenes/RunScene.ts
```

Expected outcome:

`KittyMilkRunScene.ts` is removed or converted into `RunScene.ts`.

Status: complete.

---

## PR 8: Milk Map premium visual pass

```text
Upgrade Milk Map layout and world viewport visuals
```

Files:

```text
src/game/scenes/MilkMapScene.ts
src/game/ui/map/*
src/game/ui/components/SelectedLevelCard.ts
src/game/data/worldMap.ts
public/assets/*
```

Expected outcome:

The map begins to feel like a premium cat adventure atlas instead of a prototype overlay.

---

# Codex Prompt Templates

## Prompt 1

```text
Refactor KittyMilkRunScene by extracting static data only. Move storage keys, cosmetics/accessories/trails/mouse options, speed options, and run level theme options into separate files under src/game/data. Do not change gameplay behavior, map behavior, localStorage key names, IDs, UI layout, or asset keys. Update imports only. Run npm run build and fix TypeScript errors.
```

## Prompt 2

```text
Add reusable Phaser UI primitives without changing current visuals. Create PixelButton, PixelPanel, MilkBottleCounter, CatPreview, and shared text style helpers. Replace only the home screen Start Run, Milk Map, and Shop buttons with PixelButton. Preserve size, labels, hover behavior, click behavior, and visual style as closely as possible. Do not touch gameplay logic.
```

## Prompt 3

```text
Extract Milk Map progression and localStorage access into StorageService and ProgressService. Preserve all existing localStorage key names and map node IDs. Move getTotalMilk, getMapMilkGoal, getSelectedMapNode, getCurrentRunNode, isMapNodeUnlocked, isMapGateOpen, and isMapNodePlayable out of KittyMilkRunScene. Keep UI behavior unchanged. Run build and manually verify launch, map, and starting a run.
```

## Prompt 4

```text
Extract cosmetic purchase/equip state and audio setting state into CosmeticService and AudioSettingsService. Do not change shop prices, item IDs, unlocked defaults, selected defaults, sound behavior, or localStorage keys. Keep the current shop UI functional. Run build and verify buying/equipping cats, mouse cursors, trails, and accessories still works.
```

## Prompt 5

```text
Extract Milk Map rendering into dedicated modules under src/game/ui/map while keeping the current scene architecture intact. Create MilkMapRenderer, WorldViewport, MapPathLayer, MapNodeView, WorldPeekCard, and SelectedLevelCard. Move drawing code out of KittyMilkRunScene but preserve current layout and behavior. Do not redesign visuals yet. Verify node selection, locked states, gates, bonus nodes, bottle ratings, and Play button behavior.
```

## Prompt 6

```text
Extract shop UI into reusable modules under src/game/ui/shop. Preserve current shop layout, scrolling, masks, category buttons, purchase/equip behavior, and Cat God toggle. Do not modify item data or prices. Run build and verify shop scroll, category navigation, and item selection.
```

## Prompt 7

```text
Split the app into Phaser scenes: LaunchScene, MilkMapScene, ShopScene, and RunScene. Use services for shared state. Register scenes in main.ts. Preserve gameplay behavior and screen navigation. RunScene should contain the existing runner mechanics. LaunchScene should handle home UI. MilkMapScene should handle level selection. ShopScene should handle shop UI. Do not redesign visuals in this PR.
```

## Prompt 8

```text
Now that the Milk Map is modular, upgrade the Milk Map layout into a premium active-world viewport. Use one focused world map, previous/next world peeks, a compact header, a compact selected-level card, consistent buttons, and reusable node states. Keep gameplay untouched. Keep progression logic untouched unless needed for display only.
```

---

# Future Level Framework

The world progression fantasy should be:

```text
Home
→ Around the House
→ Yard and Street
→ Neighborhood
→ Town
→ City
→ Region
→ Country
→ Global Special
→ Fantasy/Event Worlds
```

The cat should not leave home too quickly. The game can support many levels by expanding the emotional radius slowly.

## Ring 0: Home Base

Scale: safe nest / one room.

Examples:

- Home Bowl
- Nap Rug
- Toy Corner
- Pantry Peek

## Ring 1: Around the House

Scale: rooms inside the home.

Examples:

- Cozy Kitchen Counter
- Living Room Zoomies
- Bedroom Blanket Kingdom
- Hallway Dash
- Laundry Mountain
- Bathroom Faucet Temple

## Ring 2: Yard and Street

Scale: still near home, but outside.

Examples:

- Backyard Fence Club
- Porch Patrol
- Sidewalk Sniffers
- Mailbox Mile
- Garden Wall

## Ring 3: Neighborhood

Scale: first public-world feeling.

Examples:

- Neighborhood Catwalk
- Alley Council
- Corner Store Crate Run
- Park Bench Patrol
- Cat Cafe Window

## Ring 4: Town / City

Scale: bigger movement, more visual density.

Examples:

- Downtown Fish Market
- Subway Tile Dash
- Rooftop Antenna Run
- Night Market Noodles
- Apartment Balcony Circuit

## Ring 5: State / Region

Scale: recognizable landscapes.

Examples:

- California Coast Milk Run
- Desert Porch Patrol
- Snow Cabin Sprint
- Forest Cabin Window
- Farm Barnyard Shortcut

## Ring 6: Countries / Cultures

Scale: respectful location-inspired worlds.

Examples:

- Tokyo Alley Lanterns
- Paris Rooftop Prowl
- Mediterranean Harbor Cats
- London Rainy Windowsills
- Mexico City Market Cats

Use specific, researched visual details later. Avoid generic stereotypes.

## Ring 7: Fantasy / Event Worlds

Scale: unlockable, seasonal, or special.

Examples:

- Moon Milk Station
- Catnip Dreamland
- Cardboard Kingdom
- Haunted Vacuum Manor
- Nyan Nebula

---

# Definition of Done

The refactor is successful when:

- gameplay is isolated in `RunScene`
- home, map, and shop are separate scenes
- world/map data is separate from rendering code
- shop/cosmetic data is separate from shop rendering
- local storage is accessed through services
- common UI pieces are reusable
- Milk Map nodes are reusable components
- Codex can modify the Milk Map without touching runner gameplay
- Codex can modify shop cards without touching map rendering
- future worlds can be added mostly through data and art assets
- the game still boots, runs, wins, loses, saves progress, and loads progress correctly

---

# Final Recommendation

Do not let Codex redesign the Milk Map inside the current blob. Extract first.

The current game has charm and the world data model is already headed in the right direction. The structural problem is that UI, progression, shop, and gameplay are sharing one scene. Once those boundaries are separated, visual upgrades will be safer, faster, and much easier to annotate.
