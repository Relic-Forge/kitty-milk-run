# Kitty Milk Run — MVP Build Spec

## Recommended Stack

- Vite
- TypeScript
- Phaser 3
- Placeholder vector/block art drawn in Phaser
- No external assets required for V1

## Build Principle

Keep the first version playable before making it beautiful. Do not add inventory, multiplayer, account systems, shop systems, or level editors until the core race feels good.

## Required V1 Screens

### Start Screen

Elements:

- Game title: Kitty Milk Run
- Short instructions
- Start prompt

### Game Screen

Elements:

- Grassland background
- Three-lane dirt track
- Cat player
- Dog obstacles
- Cucumber obstacles
- Yarn collectibles
- Hearts counter
- Yarn score counter

### Win Screen / Cutscene

Elements:

- “Milk Found!” message
- Cat near milk bowl or bottle
- Simple animation implying the cat drinks milk
- Press Space to replay

### Lose Screen

Elements:

- “Oh No!” message
- Retry prompt

## Core Objects

### Cat

Properties:

- Lane index: 0, 1, 2
- Position: fixed near bottom of screen
- Moves between lanes with a short tween
- Has hit reaction animation

### Track

Properties:

- Three lanes
- Scrolling grass/track illusion
- Finish line appears near end of race

### Obstacle

Types:

- Dog
- Cucumber

Properties:

- Lane index
- Moves down screen
- Collision with cat removes one heart
- Destroyed on collision or off-screen

### Yarn

Properties:

- Lane index
- Moves down screen
- Collision increases score
- Destroyed on collection or off-screen

### Milk

Properties:

- Appears at finish
- Triggers win state when reached

## Tuning Defaults

- Screen size: 960x540
- Lanes: left, center, right
- Hearts: 3
- Initial speed: 235
- Max speed: 330
- Finish distance: 3600
- Obstacle spawn: about every 950ms
- Yarn spawn: about every 700ms

## V1 Acceptance Tests

- Game loads in browser with `npm run dev`
- Start screen appears
- Space starts game
- Left/right movement works
- Dog collision removes heart
- Cucumber collision removes heart
- Yarn collection increments score
- Losing all hearts shows lose screen
- Reaching finish shows win cutscene
- Space restarts after win/loss
- Browser page does not scroll

## Out of Scope for V1

- User accounts
- Saved progress
- Mobile polish
- Real asset pipeline
- Multiple levels
- Character selection
- Shop
- Multiplayer
- Online leaderboard
