# Codex Build Prompt — Kitty Milk Run V1

You are working in an existing Vite + TypeScript + Phaser project called Kitty Milk Run.

Your job is to improve and stabilize the V1 MVP without expanding scope.

## Product

Kitty Milk Run is a cute blocky retro-style kids game. A cat races through grasslands to reach milk at the finish line. The player dodges dogs and cucumbers, collects yarn, and gets a cute milk-drinking cutscene when they win.

## Current MVP Requirements

Keep the game simple and browser-based.

Required features:

- Start screen
- Three-lane race track
- Cat player
- Left/right lane movement
- Dogs as obstacles
- Cucumbers as obstacles
- Yarn collectibles
- Hearts counter
- Yarn score counter
- Milk finish line
- Win cutscene
- Lose/retry state
- No scrolling web page
- No external assets required

## Rules

Do not add unnecessary systems.

Avoid:

- Login/auth
- Backend
- Multiplayer
- Shop
- Level editor
- Complex inventory
- Real-money mechanics
- Huge asset libraries

## Implementation Priorities

1. Make the game run cleanly with `npm install` and `npm run dev`.
2. Keep the code readable for a beginner/intermediate developer.
3. Preserve the current MVP game loop.
4. Improve feel with small touches: better lane movement, clearer collisions, simple animations, better spacing.
5. Keep art placeholder-friendly and drawn in Phaser shapes unless explicitly asked to add assets.
6. Make the UI kid-readable and parent-friendly.

## Acceptance Criteria

- The game starts from a visible start screen.
- Space begins the race.
- Cat moves left/right between exactly three lanes.
- Dog and cucumber collisions reduce hearts.
- Yarn increases score.
- Reaching milk triggers a win scene/cutscene.
- Losing all hearts triggers a retry screen.
- Space restarts after win or loss.
- Code passes TypeScript build.
- Page does not scroll.

## Nice-to-Have Polish

Only after the core works:

- Tiny cat bounce while running
- Obstacle warning spacing so impossible patterns do not happen too often
- Better cutscene animation
- Simple sound placeholders if easy
- Mobile swipe/tap controls if low-risk

## Delivery

After changes, summarize:

- Files changed
- What was improved
- How to run it
- Any remaining issues
