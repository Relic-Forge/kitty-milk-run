# Magical Milk Kingdom Asset Style Contract

## Intent

Magical Milk Kingdom is the next high-fantasy world for Kitty Milk Run: a safe, bright storybook kingdom built from milk glass, star lanterns, crystal mushrooms, frosting rooftops, and moon-milk props.

## Visual Rules

- Camera: orthographic game-sprite view for props; 16:9 gameplay-canvas view for backdrop.
- Silhouette: chunky, readable forms that still scan at small Phaser sprite sizes.
- Palette: milk white, lavender, butter yellow, strawberry pink, mint, cyan, and deep blue-purple outlines.
- Edges: crisp pixel-art clusters with no painterly blur, no soft vector gradients, and no tiny noisy detail.
- Lighting: bright magical morning; highlights are baked into the pixel clusters.
- Materials: milk glass, frosting, cereal cobblestones, jelly, crystals, and soft star glows.
- Avoid: scary fantasy creatures, weapons, dark castles, muddy palettes, photorealism, logos, text, and watermarks.

## Runtime Acceptance

- Prop sprites must have alpha channels and transparent corners.
- Runtime assets should be small enough for Phaser to load cheaply.
- Decorative sprites must not compete with the player, yarn, heart HUD, or lane markers.
- Obstacles must look silly and friendly while remaining visually distinct from collectibles.
