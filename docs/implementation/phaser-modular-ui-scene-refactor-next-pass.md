# Phaser Modular UI + Scene Refactor Next Pass

This pass exists to make Kitty Milk Run easier to improve visually without breaking gameplay.

The last refactor extracted useful data and service files, but most screen ownership still lives inside `RunScene`. `LaunchScene`, `MilkMapScene`, and `ShopScene` are currently thin subclasses of `RunScene`, which means the project has scene names but not clean scene responsibilities yet.

The goal of this pass is to split ownership correctly, introduce layout primitives, and create stable boundaries between game state, view models, and Phaser drawing code.

The core runner gameplay should remain behavior-preserving during this pass. No new mechanics. No major visual redesign. No premium Milk Map polish yet. This is the structural pass that makes those improvements safe.

---

## Current Problem

The code is improved, but it is still centered around one large scene.

Current shape:

```text
BootScene
LaunchScene extends RunScene
MilkMapScene extends RunScene
ShopScene extends RunScene
RunScene
```

This creates several practical problems:

- Non-run screens inherit runner setup, runner state, input handlers, HUD objects, player objects, and world creation.
- Home, map, shop, pause, audio controls, and gameplay UI still compete inside one class.
- UI layout is mostly hard-coded coordinates with no shared layout layer.
- Renderers still know too much about static services.
- Improving one screen risks regressions in unrelated screens.
- The Milk Map cannot become premium while it is still wired like an overlay inside the runner scene.

The next pass should change ownership, not just move code into more files.

---

## Desired End State

Target scene structure:

```text
src/game/scenes/BootScene.ts
src/game/scenes/BaseScene.ts
src/game/scenes/LaunchScene.ts
src/game/scenes/MilkMapScene.ts
src/game/scenes/ShopScene.ts
src/game/scenes/RunScene.ts
```

Target UI structure:

```text
src/game/ui/core/UiFrame.ts
src/game/ui/core/UiPanel.ts
src/game/ui/core/UiButton.ts
src/game/ui/core/UiBadge.ts
src/game/ui/core/UiIconButton.ts
src/game/ui/core/UiCard.ts
src/game/ui/core/UiCardGrid.ts
src/game/ui/core/UiScrollArea.ts
src/game/ui/core/UiHeaderBar.ts
src/game/ui/core/UiFooterActions.ts

src/game/ui/launch/LaunchScreenRenderer.ts
src/game/ui/map/MilkMapRenderer.ts
src/game/ui/shop/ShopRenderer.ts
src/game/ui/run/RunHudRenderer.ts
src/game/ui/run/PauseMenuRenderer.ts
```

Target state/view-model structure:

```text
src/game/viewModels/buildLaunchViewModel.ts
src/game/viewModels/buildMapViewModel.ts
src/game/viewModels/buildShopViewModel.ts
src/game/viewModels/buildRunConfig.ts
```

Target validation structure:

```text
scripts/validate-game-data.ts
```

---

## Refactor Rules

Preserve these rules through the pass:

1. Runner gameplay behavior stays the same.
2. Existing player progress and shop state must continue loading from current localStorage keys.
3. Existing map progress must continue working.
4. Existing assets should not be renamed unless absolutely required.
5. Scene split should be incremental and reversible.
6. Do not redesign the Milk Map visuals during this pass.
7. Do not add jump, extra lanes, new hazards, or new progression mechanics.
8. Add structure first, then polish.

---

## Architecture Principles

### Scenes own screens

Each scene should own its own screen lifecycle.

`LaunchScene` owns:

- Home/start screen layout
- Current run summary
- Start Run button
- Milk Map button
- Shop button
- Speed selector
- Audio shortcut if retained on home
- Selected cat preview
- Milk bottle counter badge

`MilkMapScene` owns:

- Milk Map layout
- World atlas display
- Node selection
- Current node preview card
- Play selected node action
- Shop/back navigation
- Map-specific input handling

`ShopScene` owns:

- Shop layout
- Shop section navigation
- Scroll behavior
- Buy/equip actions
- Cat God toggle if retained
- Yarn basket badge
- Back navigation

`RunScene` owns:

- Runner gameplay
- Player setup
- Obstacles
- Yarn collection
- Finish state
- Run HUD
- Pause menu
- Win/loss overlays

`BootScene` owns:

- Asset preload
- Service load
- Audio apply
- Initial scene launch

`BaseScene` owns shared helpers only:

- `textStyle()`
- `createUiButton()`
- `createPanel()`
- `playUiSound()`
- `updateMouseCursor()`
- simple navigation helpers

`BaseScene` must not own screen-specific UI.

---

## Critical Change: Stop Extending RunScene

The current subclass pattern should be removed.

Current anti-pattern:

```ts
export class LaunchScene extends RunScene {
  constructor() {
    super('LaunchScene', 'launch', true);
  }
}
```

Replace with real scene classes:

```ts
export class LaunchScene extends BaseScene {
  constructor() {
    super('LaunchScene');
  }

  create() {
    this.createScreenFrame();
    this.renderer = new LaunchScreenRenderer(...);
    this.renderer.create(buildLaunchViewModel());
  }
}
```

`RunScene` should no longer know about launch/map/shop overlay modes.

Remove or migrate these concepts out of `RunScene`:

- `OverlayMode`
- `InitialSceneMode`
- `launchUiElements`
- `shopUiElements`
- `runUiElements` when used for map/home screen UI
- `mapRenderer`
- `shopRenderer`
- `selectedMapNodeId` from runner UI concerns
- launch screen button creation
- shop card creation
- Milk Map screen creation
- audio settings UI if it belongs to a menu scene

Run-specific UI can remain in `RunScene` or move into `RunHudRenderer` and `PauseMenuRenderer`.

---

## View Model Boundary

Renderers should not reach directly into static services.

Bad pattern:

```ts
ShopRenderer imports CosmeticService
MilkMapRenderer imports ProgressService
```

Preferred pattern:

```ts
const viewModel = buildShopViewModel();
shopRenderer.update(viewModel);
```

Renderers receive plain data and callbacks:

```ts
type ShopViewModel = {
  yarnBasket: number;
  catGodMode: boolean;
  sections: ShopSectionViewModel[];
};

type ShopSectionViewModel = {
  id: string;
  label: string;
  cards: ShopCardViewModel[];
};

type ShopCardViewModel = {
  id: string;
  kind: 'cat' | 'accessory' | 'trail' | 'mouse';
  name: string;
  cost: number;
  asset?: string;
  runTexture?: string;
  usesNyanArt?: boolean;
  unlocked: boolean;
  selected: boolean;
  statusLabel: string;
};
```

Callbacks should be explicit:

```ts
type ShopRendererActions = {
  onSelectCard: (kind: ShopKind, id: string) => void;
  onToggleCatGodMode: () => void;
  onBack: () => void;
};
```

This keeps drawing code focused on drawing.

---

## Layout System

Before any premium UI pass, add a small layout layer.

This is not a React-like framework. It is a practical Phaser helper layer for predictable screen composition.

### Required primitives

#### `UiFrame`

Creates a full-screen frame shell with consistent safe margins.

Responsibilities:

- Full screen backdrop
- Primary panel bounds
- Header area
- Content area
- Footer/action area
- Shared screen padding constants

Suggested shape:

```ts
type UiFrameBounds = {
  screen: Phaser.Geom.Rectangle;
  panel: Phaser.Geom.Rectangle;
  header: Phaser.Geom.Rectangle;
  content: Phaser.Geom.Rectangle;
  footer: Phaser.Geom.Rectangle;
};
```

#### `UiPanel`

Replacement for repeated rounded-rect graphics.

Supports:

- fill
- alpha
- border
- radius
- shadow offset
- optional pixel highlight
- redraw on bounds change

#### `UiButton`

Upgrade or replace `PixelButton`.

Supports:

- fixed width/height
- disabled state
- selected state
- hover state
- optional icon
- optional subtitle
- uniform hit zone
- label updates

#### `UiBadge`

For milk bottle count, yarn count, current speed, or small state indicators.

Supports:

- icon texture or mini graphics callback
- count text
- label text
- compact/pill mode

#### `UiCard`

Reusable visual card shell for map node previews, shop cards, current run cards.

Supports:

- title
- body
- icon/preview area
- action slot
- selected/locked/completed states

#### `UiScrollArea`

Owns scroll math and clipping/visibility logic for shop and future lists.

Supports:

- viewport bounds
- content container
- wheel scrolling
- drag scrolling
- snap points
- section anchors
- scrollbar thumb
- item visibility gating

#### `UiHeaderBar`

Reusable header with title, subtitle, left action, right badges.

This directly addresses the recurring header/text overlap issues.

#### `UiFooterActions`

Reusable footer button row.

Supports:

- equal-width buttons
- fixed gap
- center/right/left alignment
- disabled states

---

## Scene Navigation Contract

Use one small routing helper. Avoid ad hoc `scene.start()` calls spread everywhere.

Suggested file:

```text
src/game/services/SceneRouter.ts
```

Suggested API:

```ts
export class SceneRouter {
  static launch(scene: Phaser.Scene) {
    scene.scene.start('LaunchScene');
  }

  static map(scene: Phaser.Scene) {
    scene.scene.start('MilkMapScene');
  }

  static shop(scene: Phaser.Scene, returnTo = 'LaunchScene') {
    scene.scene.start('ShopScene', { returnTo });
  }

  static run(scene: Phaser.Scene, nodeId: string) {
    scene.scene.start('RunScene', { nodeId });
  }
}
```

The important change: `RunScene` should receive a `nodeId`, not infer state from home/map overlays.

---

## Map Node to Run Config

The game should start a run from a selected map node.

Target flow:

```text
MilkMapScene
  selectedNodeId
  Play button
    -> SceneRouter.run(this, selectedNodeId)

RunScene.init({ nodeId })
  -> buildRunConfig(nodeId)
  -> create world/theme/player/HUD
```

Suggested run config:

```ts
type RunConfig = {
  node: MapNode;
  world: WorldConfig;
  theme: LevelOption;
  speedMultiplier: number;
  mode: RunMode;
  scoreTargets: {
    oneBottle: number;
    twoBottleScore: number;
    threeBottleScore: number;
  };
};
```

This is the bridge between the Milk Map and gameplay.

Do not let `RunScene` pick a level from a separate `selectedLevelId` if the run starts from the map. The selected map node should be the source of truth.

For temporary compatibility, `LaunchScene` can use:

```ts
const currentNode = ProgressService.getCurrentRunNode();
SceneRouter.run(this, currentNode.id);
```

---

## Data Cleanup Required

The current world/map data is useful but should be separated more cleanly.

Keep:

```text
worldMap.ts
```

But clarify responsibilities:

- `WorldConfig`: world identity, theme, map palette, audio skin, difficulty profile, future mechanic flags.
- `MapNode`: individual level node, unlock state, score targets, display copy, node position.
- `LevelOption` / run theme: actual runtime rendering skin.

Avoid brittle ID string logic.

Replace this style:

```ts
previousNodeId.includes('_gate')
```

With typed lookup:

```ts
const previousNode = getMapNodeById(previousNodeId);
if (previousNode?.nodeType === 'gate') {
  return isGateOpen(previousNode.id);
}
```

Add helpers:

```ts
export function getMapNodeById(nodeId: string): MapNode | undefined;
export function getRequiredMapNode(nodeId: string): MapNode;
export function getWorldById(worldId: string): WorldConfig | undefined;
export function getRequiredWorld(worldId: string): WorldConfig;
export function getRunThemeByThemeKey(themeKey: ThemeKey): LevelOption;
```

---

## Implementation Plan

### Pass 1: Add `BaseScene` and routing

Create:

```text
src/game/scenes/BaseScene.ts
src/game/services/SceneRouter.ts
```

Move shared helpers out of `RunScene` where safe:

- text style
- basic button creation
- mouse cursor application
- common float text helper if used outside gameplay
- UI sound helpers

Do not remove behavior yet. Make `RunScene` extend `BaseScene` first.

Acceptance criteria:

- Game still boots.
- `RunScene` still plays.
- Existing services still load.
- `main.ts` still registers all scenes.

---

### Pass 2: Extract LaunchScene for real

Create:

```text
src/game/ui/launch/LaunchScreenRenderer.ts
src/game/viewModels/buildLaunchViewModel.ts
```

Move launch/home UI out of `RunScene` into `LaunchScene`.

Launch screen should own:

- title/header
- selected/current run card
- selected cat preview
- milk bottle badge/count
- Start Run button
- Milk Map button
- Shop button
- speed selector/dropdown or compact selector
- run mode selector if retained on home

Recommended home button sizing:

```text
Start Run: 164x54
Milk Map: 164x54
Shop: 164x54
```

Start Run should use the latest/current playable node:

```ts
const currentNode = ProgressService.getCurrentRunNode();
SceneRouter.run(this, currentNode.id);
```

Acceptance criteria:

- `LaunchScene` no longer extends `RunScene`.
- Launch screen renders without creating runner world/player objects.
- Start Run starts `RunScene` with a node id.
- Milk Map opens `MilkMapScene`.
- Shop opens `ShopScene` and can return to Launch.
- Speed selection persists through `GameStateService`.

---

### Pass 3: Extract MilkMapScene for real

Create/update:

```text
src/game/viewModels/buildMapViewModel.ts
src/game/ui/map/MilkMapRenderer.ts
```

`MilkMapScene` should own selected map node state and call `ProgressService.setSelectedNode()`.

`MilkMapRenderer` should receive a `MapViewModel`, not import `ProgressService`.

Suggested model:

```ts
type MapViewModel = {
  totalMilk: number;
  mapMilkGoal: number;
  selectedNodeId: string;
  selectedNode: MapNodeViewModel;
  activeWorld: WorldViewModel;
  previousWorld?: WorldPeekViewModel;
  nextWorld?: WorldPeekViewModel;
  nodes: MapNodeViewModel[];
  connections: MapConnectionViewModel[];
  selectedCat: {
    texture: string;
    usesNyanArt: boolean;
  };
};
```

Acceptance criteria:

- `MilkMapScene` no longer extends `RunScene`.
- Map scene does not create runner player/world/HUD.
- Node selection updates card state.
- Play button starts `RunScene` with selected node id.
- Locked nodes remain locked.
- Gate behavior still works.
- Shop/back navigation works.

---

### Pass 4: Extract ShopScene for real

Create/update:

```text
src/game/viewModels/buildShopViewModel.ts
src/game/ui/shop/ShopRenderer.ts
```

Remove direct `CosmeticService` imports from `ShopRenderer`.

`ShopScene` should handle buy/equip actions:

```ts
const result = CosmeticService.buyOrEquip(kind, option);
this.renderer.update(buildShopViewModel());
```

Renderer should only draw the current model and emit selected card actions.

Acceptance criteria:

- `ShopScene` no longer extends `RunScene`.
- Shop renders without runner objects.
- Buy/equip still works.
- Yarn basket updates.
- Selected cat/accessory/trail/mouse persists.
- Cursor updates after mouse selection.
- Cat God mode still works if retained.
- Back navigation returns to the correct scene.

---

### Pass 5: Thin RunScene

After Launch, Map, and Shop are real scenes, remove screen overlay code from `RunScene`.

`RunScene` should keep:

- create world
- create player
- create HUD
- input handling for gameplay
- obstacle/yarn spawning
- collision handling
- win/loss handling
- pause handling

Create optional renderers:

```text
src/game/ui/run/RunHudRenderer.ts
src/game/ui/run/PauseMenuRenderer.ts
src/game/ui/run/RunResultRenderer.ts
```

RunScene should receive:

```ts
init(data: { nodeId?: string })
```

If no node id is provided, use:

```ts
ProgressService.getCurrentRunNode().id
```

Acceptance criteria:

- `RunScene` no longer contains launch/map/shop UI creation.
- `RunScene` no longer contains `OverlayMode`.
- Runner gameplay still plays correctly.
- Pause/win/loss still work.
- Completing a run awards bottles through `ProgressService.completeRun()`.
- Returning from a completed run goes to Milk Map or Launch intentionally.

---

### Pass 6: Add layout primitives and migrate screens onto them

Create the UI core folder:

```text
src/game/ui/core/
```

Minimum files:

```text
UiFrame.ts
UiPanel.ts
UiButton.ts
UiBadge.ts
UiCard.ts
UiScrollArea.ts
UiHeaderBar.ts
UiFooterActions.ts
```

Do not over-engineer. Each primitive should be small and Phaser-native.

Example usage in a scene:

```ts
const frame = new UiFrame(this, {
  title: 'THE MILK MAP',
  subtitle: 'Follow the pawprints farther from home.',
  rightBadges: [milkBadge]
});

const bounds = frame.getBounds();
```

Acceptance criteria:

- LaunchScene uses `UiFrame`, `UiHeaderBar`, `UiFooterActions`, and `UiBadge`.
- MilkMapScene uses `UiFrame`, `UiHeaderBar`, `UiCard`, and `UiBadge`.
- ShopScene uses `UiFrame`, `UiScrollArea`, `UiCard`, and `UiBadge`.
- Button sizes are consistent.
- Header/title text no longer overlaps content.
- Screen margins are controlled by shared constants.

---

### Pass 7: Add data validation

Create:

```text
scripts/validate-game-data.ts
```

Add package script:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "validate:game-data": "tsx scripts/validate-game-data.ts"
  }
}
```

If avoiding `tsx`, use a plain TypeScript-compatible approach already supported by the repo tooling. The exact runner can be adjusted, but the validation step should exist.

Validation checks:

- every map node id is unique
- every world id is unique
- every `previousNodeId` points to an existing node
- every node `worldId` points to an existing world
- every world `themeKey` has a matching runtime theme
- every shop item id is unique within its category
- every default selected cosmetic exists
- every score target is valid and ordered
- every gate points to a valid next world relationship

Acceptance criteria:

- `npm run typecheck` passes.
- `npm run validate:game-data` passes.
- Bad map data fails loudly.

---

## Suggested File Migration Map

### Move from `RunScene` into `BaseScene`

- shared text style helper
- common button factory
- cursor helper
- shared float text if used outside runner
- basic UI sound helpers

### Move from `RunScene` into `LaunchScene` / `LaunchScreenRenderer`

- `createLaunchScreen`
- selected cat preview UI
- launch milk bottle drawing
- start/map/shop home actions
- speed selector if kept on launch
- run mode selector if kept on launch
- launch loadout display

### Move from `RunScene` into `MilkMapScene` / `MilkMapRenderer`

- map selection state
- map renderer wiring
- map play action
- map node selected card update
- world peek navigation

### Move from `RunScene` into `ShopScene` / `ShopRenderer`

- shop renderer wiring
- buy/equip methods
- Cat God toggle
- shop basket updates
- shop scroll input
- shop back navigation

### Keep in `RunScene`

- `createWorld`
- `createPlayer`
- `createFinishObjects`
- obstacle/yarn groups
- gameplay input
- lane movement
- collision
- run animation
- HUD during gameplay
- pause/win/loss state

---

## Expected Code Smells to Remove

These are explicit cleanup targets:

- `LaunchScene extends RunScene`
- `MilkMapScene extends RunScene`
- `ShopScene extends RunScene`
- `overlayMode` inside `RunScene`
- launch UI arrays inside `RunScene`
- shop UI arrays inside `RunScene`
- map UI arrays inside `RunScene`
- renderers importing static services directly
- progression logic based on `id.includes('_gate')`
- repeated rounded rectangle drawing in every screen
- ad hoc footer button placement
- ad hoc header text placement
- screen-specific coordinate constants scattered across renderer methods

---

## Definition of Done

This pass is complete when:

1. `LaunchScene`, `MilkMapScene`, and `ShopScene` are real scenes and no longer extend `RunScene`.
2. `RunScene` only owns runner gameplay and run-specific UI.
3. Shared UI primitives exist and are used by at least Launch, Map, and Shop.
4. Renderers consume view models and emit callbacks instead of reading static services directly.
5. Starting a run passes a `nodeId` into `RunScene`.
6. Existing progress, shop purchases, speed settings, and audio settings continue to load.
7. `npm run typecheck` passes.
8. Game data validation exists and passes.
9. The game still boots to the home screen.
10. Milk Map, Shop, Start Run, Pause, Win, and Loss flows still work.

---

## Testing Checklist

Manual test after the pass:

```text
Boot
  - App loads to LaunchScene
  - Selected cat appears
  - Milk bottle badge appears
  - Yarn/milk values are correct

Launch
  - Start Run launches current playable node
  - Milk Map opens map scene
  - Shop opens shop scene
  - Speed selector persists
  - Run mode persists if retained

Milk Map
  - Current node is selected
  - Locked nodes are visually locked
  - Selecting unlocked nodes updates card
  - Selecting locked nodes does not start run
  - Play starts RunScene with selected node id
  - Shop opens and returns correctly

Shop
  - Cards render by section
  - Scroll works
  - Buy works with enough yarn
  - Deny works with not enough yarn
  - Equip works after purchase
  - Cat preview updates
  - Cursor selection applies
  - Back returns to previous scene

Run
  - Player moves lanes
  - Yarn collection works
  - Obstacles damage player
  - Pause works
  - Win awards bottles
  - Loss does not corrupt progress
  - Completion returns to the intended scene

Persistence
  - Refresh browser
  - Progress remains
  - Shop purchases remain
  - Selected cosmetics remain
  - Speed/audio settings remain
```

---

## Codex Implementation Prompt

Use this prompt when handing the pass to Codex:

```text
Refactor Kitty Milk Run so LaunchScene, MilkMapScene, and ShopScene become real Phaser scenes instead of extending RunScene. Preserve runner gameplay behavior. Do not redesign visuals yet.

Create BaseScene for shared scene helpers, SceneRouter for navigation, view model builders for launch/map/shop/run config, and a small Phaser-native UI core layer with frame, panel, button, badge, card, scroll area, header bar, and footer actions.

Move launch UI out of RunScene into LaunchScene/LaunchScreenRenderer. Move map UI ownership into MilkMapScene/MilkMapRenderer. Move shop ownership into ShopScene/ShopRenderer. Keep RunScene focused on runner gameplay, HUD, pause, win/loss, obstacles, yarn, collision, and run completion.

Renderers should consume plain view models and emit callbacks. They should not import CosmeticService or ProgressService directly.

Starting a run should pass a nodeId into RunScene. RunScene should build its runtime config from MapNode -> WorldConfig -> LevelOption. Preserve localStorage compatibility and existing progress/shop/audio/speed behavior.

Add typecheck and game-data validation scripts. Validate map nodes, world IDs, previousNodeIds, theme keys, score targets, and duplicate shop IDs.

Acceptance criteria: game boots to LaunchScene, Start Run works, Milk Map works, Shop works, Pause works, Win/Loss works, progress persists, npm run typecheck passes, validate-game-data passes.
```

---

## Follow-Up After This Pass

Only after this structural pass should the next visual pass begin.

Recommended next visual pass:

```text
Premium Milk Map visual upgrade
```

That pass should focus on:

- home-to-world progression feeling
- better world cards
- richer paths
- landmark art
- cat avatar movement
- milk bottle progress meter
- premium header/footer treatment
- polished locked/unlocked/completed states

Do not start that until the scene ownership and layout primitives are stable.
