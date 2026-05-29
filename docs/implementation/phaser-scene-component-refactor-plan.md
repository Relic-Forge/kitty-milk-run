# Kitty Milk Run Phaser Scene + UI Component Refactor Plan

## Purpose

Kitty Milk Run has grown past the original prototype shape. The game is still small enough to refactor safely, but the current scene file is carrying too many responsibilities: gameplay, launch screen, Milk Map, shop, progression, storage, cosmetics, audio settings, UI drawing, and state transitions.

This plan splits the project into scenes, data modules, UI primitives, and services without changing gameplay behavior. The goal is to make the game easier to edit, easier for Codex to reason about, and safer to scale into many worlds, levels, cultures, locations, cosmetics, and seasonal map expansions.

The core rule: **do not rewrite the runner gameplay during the first refactor pass. Extract around it. Preserve behavior first, improve visuals second.**

---

## Current State Summary

Current runtime stack:

- Vite
- Phaser
- TypeScript
- Browser canvas game
- Single primary Phaser scene: `KittyMilkRunScene`
- Fixed game size: `960x540`
- Phaser scale mode: `FIT`, centered
- Local browser storage for player/shop/map state

Current architectural issue:

```text
KittyMilkRunScene is both the game and the app shell.
```

That file currently owns:

- Phaser scene lifecycle
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
- pixel art helper drawing

This is workable for an MVP, but it makes UI changes feel like editing one giant blob. It also makes future world design risky because cosmetic, map, UI, and gameplay concerns are tangled together.

---

## Refactor Principles

### Preserve gameplay first

The existing run mechanics should not be changed during the structural refactor:

- lane movement
- obstacle types
- obstacle spawn timing
- yarn collection
- hearts/damage
- foil scare behavior
- vacuum behavior
- finish line/win flow
- loss/retry flow
- speed multiplier behavior
- map progress rewards
- shop purchases/equips

Refactor by moving code, not redesigning mechanics.

### Isolate screens as Phaser scenes

This is a Phaser game, not a DOM UI app. Use Phaser scenes as the main screen-level boundary.

Target screens:

- `LaunchScene`
- `MilkMapScene`
- `ShopScene`
- `RunScene`
- optional `BootScene`

### Move reusable UI into classes/functions

Buttons, panels, counters, cards, and map nodes should not be manually redrawn in every screen. They should have small, reusable modules.

### Data should describe the game

Worlds, levels, cosmetics, speed options, and shop items should live in data modules. Screens should render data; they should not define large data arrays inline.

### Services own persistence and cross-screen state

Local storage, progression, selected cosmetic, selected node, audio settings, and equipped items should be managed outside scene files.

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
      GameStateService.ts
      ProgressService.ts
      StorageService.ts
      CosmeticService.ts
      AudioSettingsService.ts

    ui/
      core/
        createTextStyle.ts
        layout.ts
        palette.ts
        depths.ts
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
        WorldViewport.ts
        WorldPeekCard.ts
        MapPathLayer.ts
        MapNodeView.ts
        MapHeader.ts
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

This does not need to happen in one PR. The extraction should happen in safe passes.

---

## Target Scene Responsibilities

## `BootScene`

Optional but recommended.

Purpose:

- preload shared assets
- initialize service defaults
- apply stored audio settings
- route to `LaunchScene`

Responsibilities:

- call `loadGameAssets(this)`
- initialize `GameStateService`
- initialize audio state
- start `LaunchScene`

Should not contain:

- gameplay logic
- shop drawing
- map drawing
- progression calculations

Example behavior:

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
    this.scene.start('LaunchScene');
  }
}
```

If `BootScene` feels like too much for the first pass, assets can remain loaded in each scene temporarily. Add `BootScene` after the first successful split.

---

## `LaunchScene`

Purpose:

The home/start screen. This should feel like the cat's home base.

Owns:

- selected cat preview
- current run summary
- Start Run button
- Milk Map button
- Shop button
- speed selector/dropdown
- milk bottle total badge
- sound/music controls if kept on home

Does not own:

- map node rendering
- shop card rendering
- gameplay runner loop
- obstacle spawning

Navigation:

```ts
Start Run -> RunScene with selected/current node
Milk Map  -> MilkMapScene
Shop      -> ShopScene
```

Key extraction from current file:

- `createLaunchScreen()`
- `updateLaunchUi()`
- `createSpeedSelector()`
- launch milk bottle UI
- home buttons
- cat preview

Target file:

```text
src/game/scenes/LaunchScene.ts
```

Launch scene should consume state through services:

```ts
const selectedNode = ProgressService.getCurrentRunNode();
const selectedCosmetic = CosmeticService.getSelectedCosmetic();
const totalMilk = ProgressService.getTotalMilk();
```

---

## `MilkMapScene`

Purpose:

The premium level-select map. This is where world progression lives visually.

Owns:

- Milk Map header
- active world viewport
- world preview peeks
- level nodes
- path connections
- selected level card
- Play button
- Back button
- Shop button
- map cat avatar

Does not own:

- gameplay runner mechanics
- shop purchase logic
- storage implementation details
- cosmetic purchase data

Key extraction from current file:

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

Rendering should be delegated to map UI modules:

```text
MilkMapScene
  -> MapHeader
  -> WorldViewport
  -> MapPathLayer
  -> MapNodeView[]
  -> WorldPeekCard[]
  -> SelectedLevelCard
```

The scene should orchestrate. It should not manually draw every shape inline.

---

## `ShopScene`

Purpose:

Custom Kitty Shop.

Owns:

- shop sections
- shop cards
- scroll mask
- scrollbar
- category buttons
- buy/equip interactions
- Cat God test toggle if still needed
- basket counter

Does not own:

- Milk Map rendering
- gameplay loop
- launch screen layout

Key extraction from current file:

- `createShopCards()`
- `createShopSection()`
- `createShopCard()`
- `createShopPreview()`
- `createShopSectionButton()`
- shop scroll state
- shop card state drawing
- purchase/equip UI updates

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

- launch screen
- Milk Map screen
- shop browsing screen
- shop item definitions
- world progression data definitions

Key extraction from current file:

- `createWorld()`
- `createHud()`
- `createPlayer()`
- `createFinishObjects()`
- `createParticles()`
- `bindInput()` gameplay subset
- `startGame()` adapted to `RunScene.create()`
- `startCountdownSequence()`
- `scrollWorld()`
- `spawnObstacle()`
- `pickObstacleType()`
- `spawnDueYarn()`
- `spawnFarmYarnRows()`
- `updateRunnerGroup()`
- `hitObstacle()`
- `collectYarn()`
- `winGame()`
- `loseGame()`
- `restartGame()` as scene navigation

Target file:

```text
src/game/scenes/RunScene.ts
```

Run scene should receive node/world selection through scene data:

```ts
this.scene.start('RunScene', {
  mapNodeId: ProgressService.getCurrentRunNode().id,
  runMode: GameStateService.getRunMode(),
  speedMultiplier: GameStateService.getSpeedMultiplier()
});
```

`RunScene` should not decide which node is next unless needed after win/loss. It should ask `ProgressService`.

---

# Data Module Split

## `worldMap.ts`

Current `worldMap.ts` is already a good foundation. Keep it, but move it under `src/game/data/worldMap.ts` later.

Keep these concepts:

- `WorldConfig`
- `MapNode`
- `MechanicFlags`
- `WORLDS`
- `MAP_NODES`
- `MAP_CONNECTIONS`
- `getWorldForNode()`

Add over time:

```ts
export type DistanceRing =
  | 'home'
  | 'around_house'
  | 'yard_and_street'
  | 'neighborhood'
  | 'town'
  | 'city'
  | 'state_region'
  | 'country'
  | 'global_special'
  | 'fantasy';
```

Add a future field to `WorldConfig`:

```ts
progressionScope: {
  ringId: DistanceRing;
  distanceFromHome: number;
  locationScale: 'room' | 'house' | 'yard' | 'street' | 'neighborhood' | 'city' | 'region' | 'country' | 'fantasy';
};
```

This supports the long-term idea: the cat starts at home and slowly travels farther away without jumping too fast to huge locations.

---

## `cosmetics.ts`

Move out of `KittyMilkRunScene`:

- `CosmeticOption`
- `NYAN_VARIATIONS`
- `ALL_COSMETICS`
- accessories
- trails
- mouse cursor options

Target:

```text
src/game/data/cosmetics.ts
```

Example:

```ts
export const COSMETICS: CosmeticOption[] = [...];
export const ACCESSORIES: AccessoryOption[] = [...];
export const TRAILS: TrailOption[] = [...];
export const MOUSE_OPTIONS: MouseOption[] = [...];
```

---

## `speedOptions.ts`

Move out:

- `SPEED_OPTIONS`
- speed label helper

Target:

```text
src/game/data/speedOptions.ts
```

Keep the current names:

- Loaf Mode
- Purr Trot
- Zoomies
- Turbo Floof

Future UI can render these as a dropdown without touching game state logic.

---

## `runLevels.ts`

Move current gameplay theme level data out of scene:

- `LEVELS`
- `LevelOption`
- selected level lookup

Target:

```text
src/game/data/runLevels.ts
```

This is separate from map progression. `worldMap.ts` describes progression. `runLevels.ts` describes how gameplay is skinned/tuned for each theme.

---

## `storageKeys.ts`

Move all local storage keys out of the scene:

```text
src/game/data/storageKeys.ts
```

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

# Services

## `StorageService`

Purpose:

Central wrapper around `localStorage`.

Responsibilities:

- safe JSON read/write
- fallback defaults
- typed helpers
- browser storage error handling

Target:

```text
src/game/services/StorageService.ts
```

Example:

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

## `GameStateService`

Purpose:

Small app-level state holder for current session.

Responsibilities:

- selected map node ID
- selected speed multiplier
- selected run mode
- yarn basket count
- current overlay/screen navigation assumptions if needed

Target:

```text
src/game/services/GameStateService.ts
```

This can be a simple singleton object. Phaser scenes can read/write it without passing everything through constructors.

---

## `ProgressService`

Purpose:

Own Milk Map progression logic.

Responsibilities:

- map progress record
- total milk calculation
- map milk goal calculation
- node locked/unlocked/playable status
- gate unlock logic
- current run node lookup
- selected node persistence
- post-run reward update

Target:

```text
src/game/services/ProgressService.ts
```

Move these methods out of the scene:

- `getTotalMilk()`
- `getMapMilkGoal()`
- `getNewestUnlockedNode()`
- `getSelectedMapNode()`
- `getCurrentRunNode()`
- `isMapNodeUnlocked()`
- `isMapGateOpen()`
- `isMapNodePlayable()`
- map progress read/write
- selected map node read/write

Example API:

```ts
export class ProgressService {
  static load(): void;
  static save(): void;
  static getSelectedNode(): MapNode;
  static setSelectedNode(nodeId: string): void;
  static getCurrentRunNode(): MapNode;
  static isNodeUnlocked(node: MapNode): boolean;
  static isNodePlayable(node: MapNode): boolean;
  static getTotalMilk(): number;
  static getMapMilkGoal(): number;
  static getBottlesForNode(nodeId: string): number;
  static completeRun(nodeId: string, score: number, yarn: number): number;
}
```

`completeRun()` should return bottles earned for the run and update progress only if the new rating is higher.

---

## `CosmeticService`

Purpose:

Own selected/unlocked cosmetics.

Responsibilities:

- selected cat
- selected accessory
- selected trail
- selected mouse cursor
- unlocked sets
- buy/equip methods
- basket spending
- selected texture helpers

Target:

```text
src/game/services/CosmeticService.ts
```

Move out of scene:

- `buyOrEquipCat()`
- `buyOrEquipMouse()`
- `buyOrEquipTrail()`
- `buyOrEquipAccessory()`
- cosmetic lookup helpers
- selected item persistence

---

## `AudioSettingsService`

Purpose:

Own audio settings, not sound playback internals.

Responsibilities:

- sound FX enabled
- music enabled
- volume
- apply settings to `sound.ts`
- persist settings

Target:

```text
src/game/services/AudioSettingsService.ts
```

`src/game/sound.ts` can remain the playback helper.

---

# UI Component Extraction

## `PixelButton`

Purpose:

One standard button system across Launch, Map, Shop, Pause, and End states.

Target:

```text
src/game/ui/components/PixelButton.ts
```

Constructor options:

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

- same height system
- same hover behavior
- same disabled behavior
- same text style
- same pressed state

This is a major fix for the current UI feeling inconsistent.

---

## `PixelPanel`

Purpose:

Reusable rounded pixel-style panel.

Target:

```text
src/game/ui/components/PixelPanel.ts
```

Supports:

- background color
- alpha
- border color
- border width
- radius
- optional shadow

Scenes should stop manually repeating `fillRoundedRect` / `strokeRoundedRect` everywhere.

---

## `MilkBottleCounter`

Purpose:

Reusable bottle icon + count UI.

Target:

```text
src/game/ui/components/MilkBottleCounter.ts
```

Used in:

- LaunchScene
- MilkMapScene
- maybe future end screen

States:

- total bottles / possible bottles
- optional animated fill
- compact HUD mode
- large reward mode

---

## `CatPreview`

Purpose:

Reusable selected-cat display with optional eye tracking.

Target:

```text
src/game/ui/components/CatPreview.ts
```

This should wrap the current eye-tracked cat behavior instead of keeping that logic in the main scene file.

---

## `SelectedRunCard`

Purpose:

Home screen current-run summary.

Target:

```text
src/game/ui/components/SelectedRunCard.ts
```

Shows:

- current level name
- world name
- level number
- bottle rating
- short flavor line

---

## `SelectedLevelCard`

Purpose:

Milk Map selected-level panel.

Target:

```text
src/game/ui/components/SelectedLevelCard.ts
```

Shows:

- selected node name
- world short name
- best milk rating
- flavor text
- lock requirement if locked
- Play button if playable

This card should be compact, stable, and not overlap the map.

---

## `SpeedSelector`

Purpose:

Turn current speed button group into one reusable control.

Target:

```text
src/game/ui/components/SpeedSelector.ts
```

Phase 1:

- preserve current visual behavior
- move code only

Phase 2:

- convert to compact dropdown
- keep animated selected option

---

# Milk Map UI Modules

## `MilkMapRenderer`

Purpose:

Top-level map renderer used by `MilkMapScene`.

Target:

```text
src/game/ui/map/MilkMapRenderer.ts
```

Owns:

- active world rendering
- path layer
- node layer
- world peeks
- selected node avatar position

Should expose:

```ts
render(worldId: string): void;
selectNode(nodeId: string): void;
refreshProgress(): void;
destroy(): void;
```

---

## `WorldViewport`

Purpose:

Render the active world as a premium focused board.

Target:

```text
src/game/ui/map/WorldViewport.ts
```

Owns:

- world background panel
- world title
- visual decorative bands
- future world art layers
- safe bounds for nodes/labels

Important: this should eventually replace plain colored cards with real pixel-art diorama composition.

---

## `MapPathLayer`

Purpose:

Draw node connections.

Target:

```text
src/game/ui/map/MapPathLayer.ts
```

Inputs:

- world node list
- palette
- unlocked/playable state if needed

Should not handle clicking or text.

---

## `MapNodeView`

Purpose:

Reusable visual for one map node.

Target:

```text
src/game/ui/map/MapNodeView.ts
```

Inputs:

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
- completed 1/2/3 bottles
- unlocked but unplayed
- locked
- bonus
- gate

The current `drawMapNodeButton()` should become this class.

---

## `WorldPeekCard`

Purpose:

Reusable previous/next world preview tab.

Target:

```text
src/game/ui/map/WorldPeekCard.ts
```

Shows:

- Previous / Next eyebrow
- world short name
- color theme
- click target

---

## `MapHeader`

Purpose:

Top Milk Map bar.

Target:

```text
src/game/ui/map/MapHeader.ts
```

Shows:

- cat icon or face
- title: `Milk Map`
- milk bottle counter
- optional back/shop buttons depending layout

---

# Safe Migration Plan

## Phase 0: Add guardrails before moving code

Create a baseline before refactoring.

Tasks:

- Run `npm run build`
- Capture screenshots of:
  - launch screen
  - Milk Map
  - shop
  - active run
  - win screen
  - lose screen
- Record a short gameplay checklist
- Confirm local storage still contains expected values

Add a temporary manual QA file:

```text
docs/qa/manual-regression-checklist.md
```

Minimum regression checklist:

```text
Launch
- Start screen loads
- Selected cat appears
- Current run card appears
- Start Run starts the newest playable level
- Milk Map opens
- Shop opens
- Speed selector changes speed and persists

Milk Map
- Map opens
- Current world renders
- Nodes render
- Locked nodes cannot play
- Playable nodes can be selected
- Play button starts selected playable node
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
- Selected cat updates home/run visuals
```

No refactor PR should merge unless this still passes.

---

## Phase 1: Extract data only

Risk level: low.

Move from `KittyMilkRunScene.ts` into data files:

```text
src/game/data/storageKeys.ts
src/game/data/cosmetics.ts
src/game/data/speedOptions.ts
src/game/data/runLevels.ts
```

Do not change behavior. Keep imports simple.

Acceptance criteria:

- `KittyMilkRunScene.ts` imports these constants/types
- no behavior changes
- build passes
- start screen still works
- shop still works
- run still works

This phase reduces file size without touching scene boundaries.

---

## Phase 2: Extract shared UI primitives

Risk level: low to medium.

Create:

```text
src/game/ui/components/PixelButton.ts
src/game/ui/components/PixelPanel.ts
src/game/ui/components/CatPreview.ts
src/game/ui/components/MilkBottleCounter.ts
src/game/ui/core/createTextStyle.ts
src/game/ui/core/palette.ts
```

Start with wrappers that mimic current visuals.

Important: do not redesign yet. Match current behavior first.

Acceptance criteria:

- existing buttons still behave the same
- hover/click still works
- text style remains close to current
- no missing hit zones
- no broken scene depth ordering

---

## Phase 3: Extract services

Risk level: medium.

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

- existing local storage keys remain unchanged
- existing player progress is not lost
- selected cat persists
- unlocked cosmetics persist
- milk map progress persists
- selected map node persists
- speed/audio settings persist

Critical rule:

```text
Do not rename localStorage keys during this refactor.
```

Renaming keys should be a separate migration later if needed.

---

## Phase 4: Split Milk Map into renderer modules while staying inside current scene

Risk level: medium.

Before creating multiple scenes, extract Milk Map rendering into modules that can still be used by `KittyMilkRunScene`.

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

Replace direct methods:

- `createMapWorldBands()` -> `WorldViewport`
- `createWorldPeek()` -> `WorldPeekCard`
- `createMapConnections()` -> `MapPathLayer`
- `createMapNodes()` + `drawMapNodeButton()` -> `MapNodeView`
- `createMapPreviewCard()` -> `SelectedLevelCard`

Keep `createMilkMapScreen()` as a thin coordinator until scene split.

Acceptance criteria:

- Milk Map still opens
- nodes still select
- selected cat avatar follows selected node
- locked/unlocked/playable states still match previous behavior
- Play still starts the correct run
- total milk display remains correct

---

## Phase 5: Split scenes

Risk level: medium to high.

Only start after Phases 1-4 are stable.

Create scene files:

```text
src/game/scenes/LaunchScene.ts
src/game/scenes/MilkMapScene.ts
src/game/scenes/ShopScene.ts
src/game/scenes/RunScene.ts
```

Update `src/main.ts` scene registration:

```ts
scene: [BootScene, LaunchScene, MilkMapScene, ShopScene, RunScene]
```

or without boot scene initially:

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

// RunScene after win/loss/retry/back
this.scene.start('LaunchScene');
```

Acceptance criteria:

- app boots to home
- home can start run
- home can open map
- home can open shop
- map can select/play level
- shop can return to previous screen
- run can return to home after win/loss
- no duplicate sounds/events after navigating between scenes
- no orphaned Phaser objects left visible

---

## Phase 6: Visual upgrade pass

Risk level: low once architecture is clean.

Now improve the Milk Map visually.

Do not start this until rendering is modular.

Focus:

- one active premium world viewport
- previous/next world peeks
- compact header
- compact selected-level card
- consistent button sizing
- reusable node states
- less text inside the map body
- environment-specific landmarks
- pixel-art diorama backgrounds
- normalized map coordinates later if needed

This phase should be mostly isolated to:

```text
src/game/ui/map/
src/game/ui/components/
src/game/data/worldMap.ts
public/assets/
```

Gameplay should not need to change.

---

# Critical No-Break Rules

## Do not change these during the refactor

- lane positions
- `GAME_WIDTH`
- `GAME_HEIGHT`
- physics settings
- obstacle spawn timing
- scoring thresholds unless intentionally changing level balance
- localStorage key names
- asset keys
- sound helper behavior
- map node IDs
- world IDs

Changing IDs or storage keys can silently wipe progress. Avoid that until a migration system exists.

---

## Avoid parallel rewrites

Do not ask Codex to split scenes, redesign the Milk Map, and change gameplay in the same task.

Bad task:

```text
Refactor scenes, redesign Milk Map, add new worlds, and improve gameplay difficulty.
```

Good task:

```text
Extract map data and cosmetic data from KittyMilkRunScene without changing behavior.
```

Good task:

```text
Create PixelButton and replace only the home screen action buttons with it.
```

Good task:

```text
Move Milk Map node rendering into MapNodeView while preserving current selected, locked, gate, bonus, and bottle states.
```

---

# Suggested PR Sequence

## PR 1: Data extraction

Title:

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

`KittyMilkRunScene.ts` gets smaller. No visual changes.

---

## PR 2: UI primitive extraction

Title:

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

Reusable UI pieces exist. Replace only a small number of buttons at first.

---

## PR 3: Progress and storage service extraction

Title:

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

## PR 4: Cosmetic and audio service extraction

Title:

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

Shop and home screens can read equipped items without owning storage logic.

---

## PR 5: Milk Map renderer extraction

Title:

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

Milk Map logic is easier to edit. No major visual redesign yet.

---

## PR 6: Shop UI extraction

Title:

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

Shop code is no longer embedded directly in the main scene.

---

## PR 7: Scene split

Title:

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
src/game/KittyMilkRunScene.ts
```

Expected outcome:

`KittyMilkRunScene.ts` is removed or converted into `RunScene.ts`.

---

## PR 8: Milk Map premium visual pass

Title:

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

# Future-Level Framework

The progression fantasy should be:

```text
Home -> Around the House -> Yard and Street -> Neighborhood -> Town -> City -> Region -> Country -> World -> Special/Fantasy
```

The cat should not leave home too quickly. The map should support lots of levels by gradually expanding the emotional radius.

## Progression rings

### Ring 0: Home Base

Scale: one room / safe nest

Examples:

- Home Bowl
- Nap Rug
- Toy Corner
- Pantry Peek

### Ring 1: Around the House

Scale: rooms inside the home

Examples:

- Cozy Kitchen Counter
- Living Room Zoomies
- Bedroom Blanket Kingdom
- Hallway Dash
- Laundry Mountain
- Bathroom Faucet Temple

### Ring 2: Yard and Street

Scale: still near home, but outside

Examples:

- Backyard Fence Club
- Porch Patrol
- Sidewalk Sniffers
- Mailbox Mile
- Garden Wall

### Ring 3: Neighborhood

Scale: first public-world feeling

Examples:

- Neighborhood Catwalk
- Alley Council
- Corner Store Crate Run
- Park Bench Patrol
- Cat Café Window

### Ring 4: Town / City

Scale: bigger movement, more visual density

Examples:

- Downtown Fish Market
- Subway Tile Dash
- Rooftop Antenna Run
- Night Market Noodles
- Apartment Balcony Circuit

### Ring 5: State / Region

Scale: recognizable landscapes

Examples:

- California Coast Milk Run
- Desert Porch Patrol
- Snow Cabin Sprint
- Forest Cabin Window
- Farm Barnyard Shortcut

### Ring 6: Countries / Cultures

Scale: respectful location-inspired worlds

Examples:

- Tokyo Alley Lanterns
- Paris Rooftop Prowl
- Mediterranean Harbor Cats
- London Rainy Windowsills
- Mexico City Market Cats

Important: world design should be affectionate and specific, not stereotype-driven. Use real visual research later before committing art.

### Ring 7: Fantasy / Event Worlds

Scale: unlockable, seasonal, or special

Examples:

- Moon Milk Station
- Catnip Dreamland
- Cardboard Kingdom
- Haunted Vacuum Manor
- Nyan Nebula

---

# Map Data Framework for Scaling

Each world should eventually support this structure:

```ts
export type WorldConfig = {
  id: string;
  displayName: string;
  shortName: string;
  order: number;
  ring: number;
  progressionScope: {
    ringId: DistanceRing;
    distanceFromHome: number;
    locationScale: LocationScale;
  };
  atlasLabel: string;
  locationFantasy: string;
  previewHint: string;
  unlockMilkRequirement: number;
  palette: WorldPalette;
  mapSkin: WorldMapSkin;
  gameplaySkin: WorldGameplaySkin;
  audioSkin: WorldAudioSkin;
  difficultyProfile: WorldDifficultyProfile;
  mechanicFlags: MechanicFlags;
  artDirection?: {
    backgroundAsset?: string;
    landmarkAssets?: string[];
    nodeSkin?: string;
    pathSkin?: string;
  };
};
```

Each level node should eventually support:

```ts
export type MapNode = {
  id: string;
  worldId: string;
  displayName: string;
  flavor: string;
  levelSceneKey: string;
  nodeType: 'main' | 'bonus' | 'gate' | 'challenge' | 'story';
  position: {
    x: number;
    y: number;
    coordinateMode: 'absolute' | 'normalized';
  };
  unlock: {
    previousNodeId?: string;
    requiredMilkBottles: number;
    requiredItemId?: string;
  };
  scoreTargets: {
    oneBottle: number;
    twoBottleScore: number;
    threeBottleScore: number;
  };
  art?: {
    nodeIcon?: string;
    labelOffsetX?: number;
    labelOffsetY?: number;
  };
};
```

Do not switch to normalized coordinates in the first refactor. Add support later when the map visuals are stable.

---

# Codex Prompt Templates

## PR 1 prompt

```text
Refactor KittyMilkRunScene by extracting static data only. Move storage keys, cosmetics/accessories/trails/mouse options, speed options, and run level theme options into separate files under src/game/data. Do not change gameplay behavior, map behavior, localStorage key names, IDs, UI layout, or asset keys. Update imports only. Run npm run build and fix TypeScript errors.
```

## PR 2 prompt

```text
Add reusable Phaser UI primitives without changing current visuals. Create PixelButton, PixelPanel, MilkBottleCounter, CatPreview, and shared text style helpers. Replace only the home screen Start Run, Milk Map, and Shop buttons with PixelButton. Preserve size, labels, hover behavior, click behavior, and visual style as closely as possible. Do not touch gameplay logic.
```

## PR 3 prompt

```text
Extract Milk Map progression and localStorage access into StorageService and ProgressService. Preserve all existing localStorage key names and map node IDs. Move getTotalMilk, getMapMilkGoal, getSelectedMapNode, getCurrentRunNode, isMapNodeUnlocked, isMapGateOpen, and isMapNodePlayable out of KittyMilkRunScene. Keep UI behavior unchanged. Run build and manually verify launch, map, and starting a run.
```

## PR 4 prompt

```text
Extract cosmetic purchase/equip state and audio setting state into CosmeticService and AudioSettingsService. Do not change shop prices, item IDs, unlocked defaults, selected defaults, sound behavior, or localStorage keys. Keep the current shop UI functional. Run build and verify buying/equipping cats, mouse cursors, trails, and accessories still works.
```

## PR 5 prompt

```text
Extract Milk Map rendering into dedicated modules under src/game/ui/map while keeping the current scene architecture intact. Create MilkMapRenderer, WorldViewport, MapPathLayer, MapNodeView, WorldPeekCard, and SelectedLevelCard. Move drawing code out of KittyMilkRunScene but preserve current layout and behavior. Do not redesign visuals yet. Verify node selection, locked states, gates, bonus nodes, bottle ratings, and Play button behavior.
```

## PR 6 prompt

```text
Extract shop UI into reusable modules under src/game/ui/shop. Preserve current shop layout, scrolling, masks, category buttons, purchase/equip behavior, and Cat God toggle. Do not modify item data or prices. Run build and verify shop scroll, category navigation, and item selection.
```

## PR 7 prompt

```text
Split the app into Phaser scenes: LaunchScene, MilkMapScene, ShopScene, and RunScene. Use services for shared state. Register scenes in main.ts. Preserve gameplay behavior and screen navigation. RunScene should contain the existing runner mechanics. LaunchScene should handle home UI. MilkMapScene should handle level selection. ShopScene should handle shop UI. Do not redesign visuals in this PR.
```

## PR 8 prompt

```text
Now that the Milk Map is modular, upgrade the Milk Map layout into a premium active-world viewport. Use one focused world map, previous/next world peeks, a compact header, a compact selected-level card, consistent buttons, and reusable node states. Keep gameplay untouched. Keep progression logic untouched unless needed for display only.
```

---

# Definition of Done

The refactor is successful when:

- `KittyMilkRunScene.ts` no longer contains every feature in the app
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

Do not start with the visual redesign. Start with extraction.

The current visual problems are symptoms of weak separation. Once the Milk Map has its own scene, renderer, node component, selected-level card, and shared button/panel primitives, the premium visual pass will be much easier and much safer.

The safest path is:

```text
Data extraction -> UI primitives -> services -> Milk Map renderer -> shop renderer -> scene split -> visual upgrade
```

That sequence protects the playable game while making the UI editable and scalable.
