# Kitty Milk Run — Product Requirements Document

## Product Summary

Kitty Milk Run is a cute, fast, blocky racing game for kids. The player controls a cat racing through grasslands to reach a giant milk bottle at the finish line.

The game should feel simple, funny, bright, and instantly understandable. The main joke is that the cat must dodge things cats hate: dogs, cucumbers, and tin foil-style surprises later.

## Target Player

- Kids ages 5–10
- Parents who want a simple browser game their child can help design
- Beginner-friendly family game project

## Core Fantasy

“I am a speedy little cat doing zoomies through grasslands so I can get my milk.”

## MVP Scope

The V1 build includes one short race:

- Start screen
- Cat racer
- Three-lane grassy track
- Dog obstacles
- Cucumber obstacles
- Yarn collectibles
- Milk finish line
- Victory cutscene of the cat drinking milk
- Retry loop

## Gameplay Loop

1. Player starts the race.
2. Cat runs forward automatically.
3. Player moves left and right between lanes.
4. Player dodges dogs and cucumbers.
5. Player collects yarn.
6. Player reaches milk at the finish line.
7. Win cutscene plays.
8. Player can replay.

## Player Controls

Desktop MVP:

- Left arrow / A: move left one lane
- Right arrow / D: move right one lane
- Space: start / restart

Touch controls can be added later.

## Win Condition

The cat reaches the milk bottle at the end of the track.

## Lose Condition

The cat loses all hearts after hitting obstacles.

## Obstacles

### Dogs

Dogs are the main danger. They should be obvious and funny, not scary.

Behavior:

- Appear in one of three lanes
- Move toward the player as the track scrolls
- Collision removes one heart

### Cucumbers

Cucumbers are silly cat-panic obstacles.

Behavior:

- Appear in one of three lanes
- Collision removes one heart and triggers a spin/shake effect

## Collectibles

### Yarn

Yarn is the main collectible.

V1 behavior:

- Adds to score
- Slightly increases speed for excitement

Future behavior:

- Fills boost meter
- Unlocks cats
- Purchases milk bowls, collars, hats, or track decorations

## Visual Direction

Style:

- Blocky
- Retro
- Bright
- Grasslands
- Kid-friendly
- Inspired by the simple internet-fun vibe of Nyan Cat, but not a copy

Avoid:

- Realistic violence
- Dark/scary dogs
- Over-complicated UI
- Asset-heavy scope creep

## Audio Direction

V1 can ship without custom audio, but the ideal direction is:

- Cute jumpy chiptune loop
- Pop sound for yarn
- Silly bonk/spin sound for obstacle hit
- Milk celebration sound at finish

## Accessibility

- Large readable text
- Simple controls
- No scrolling page
- High contrast player and obstacles
- Short rounds
- Replay button/state

## Success Criteria

V1 is successful when:

- A kid understands the goal in under 10 seconds
- The game can be played with only left/right/space
- The cat can win and lose
- Yarn scoring works
- The milk ending feels rewarding
- The codebase is simple enough for Codex to modify safely
