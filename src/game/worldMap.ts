export type ThemeKey = 'kitchen' | 'living_room' | 'backyard' | 'magical-kingdom';

export type MechanicFlags = {
  jumpEnabled: boolean;
  extraLanesEnabled: boolean;
  movingHazardsEnabled: boolean;
  timedSwitchesEnabled: boolean;
  darknessEnabled: boolean;
  windPushEnabled: boolean;
  slipperyFloorEnabled: boolean;
  chaserEnabled: boolean;
  bonusObjectiveEnabled: boolean;
};

export type WorldConfig = {
  id: string;
  displayName: string;
  shortName: string;
  themeKey: ThemeKey;
  order: number;
  ring: number;
  atlasLabel: string;
  locationFantasy: string;
  previewHint: string;
  unlockMilkRequirement: number;
  palette: {
    background: string;
    band: number;
    path: number;
    pathEdge: number;
    node: number;
    accent: number;
    hudTint: number;
  };
  mapSkin: {
    pathName: string;
    gateName: string;
    bannerName: string;
  };
  gameplaySkin: {
    collectibleSkin: string;
    hazardSet: string;
    obstacleSet: string;
    finishAsset: string;
  };
  audioSkin: {
    mapMusic: string;
    gameplayMusic: string;
    ambientLoop: string;
    uiSelect: string;
    gateUnlock: string;
  };
  difficultyProfile: {
    speedMultiplier: number;
    hazardDensity: 'low' | 'medium' | 'high';
    visualComplexity: 'low' | 'medium' | 'high';
  };
  mechanicFlags: MechanicFlags;
};

export type MapNodeType = 'main' | 'bonus' | 'gate';

export type MapNode = {
  id: string;
  worldId: string;
  displayName: string;
  flavor: string;
  levelSceneKey: string;
  nodeType: MapNodeType;
  x: number;
  y: number;
  unlock: {
    previousNodeId?: string;
    requiredMilkBottles: number;
  };
  scoreTargets: {
    oneBottle: number;
    twoBottleScore: number;
    threeBottleScore: number;
  };
};

const DEFAULT_FLAGS: MechanicFlags = {
  jumpEnabled: false,
  extraLanesEnabled: false,
  movingHazardsEnabled: false,
  timedSwitchesEnabled: false,
  darknessEnabled: false,
  windPushEnabled: false,
  slipperyFloorEnabled: false,
  chaserEnabled: false,
  bonusObjectiveEnabled: true
};

export const WORLDS: WorldConfig[] = [
  {
    id: 'world_00_home',
    displayName: 'Home Bowl',
    shortName: 'Home',
    themeKey: 'kitchen',
    order: 0,
    ring: 0,
    atlasLabel: 'Ring 0 - Home Base',
    locationFantasy: 'The cat starts safe at home, with one tiny milk run waiting by the bowl.',
    previewHint: 'Wake up, stretch, and follow the first pawprints.',
    unlockMilkRequirement: 0,
    palette: { background: '#f8c7d8', band: 0xfff1b8, path: 0xffffff, pathEdge: 0xb76f8d, node: 0xffffff, accent: 0xff7aa8, hudTint: 0x8c4f68 },
    mapSkin: { pathName: 'blanket paw path', gateName: 'Pantry Door', bannerName: 'Milk Nest banner' },
    gameplaySkin: {
      collectibleSkin: 'milk_bottle_classic',
      hazardSet: 'soft_home_hazards',
      obstacleSet: 'pillows_and_toys',
      finishAsset: 'finish_milk_bowl'
    },
    audioSkin: {
      mapMusic: 'music_map_home',
      gameplayMusic: 'music_run_home',
      ambientLoop: 'amb_home_purr',
      uiSelect: 'sfx_paw_tap_soft',
      gateUnlock: 'sfx_milk_clink_trill'
    },
    difficultyProfile: { speedMultiplier: 0.94, hazardDensity: 'low', visualComplexity: 'low' },
    mechanicFlags: { ...DEFAULT_FLAGS }
  },
  {
    id: 'world_01_kitchen',
    displayName: 'Cozy Kitchen Counter',
    shortName: 'Kitchen',
    themeKey: 'kitchen',
    order: 1,
    ring: 1,
    atlasLabel: 'Ring 1 - Around the House',
    locationFantasy: 'Warm morning counters, cereal crumbs, and one suspicious spoon bridge.',
    previewHint: 'The adventure moves from the bowl to the breakfast counter.',
    unlockMilkRequirement: 0,
    palette: { background: '#f6d98f', band: 0xffefba, path: 0xfff7dc, pathEdge: 0xc98248, node: 0xffffff, accent: 0xffcf5a, hudTint: 0x9b5734 },
    mapSkin: { pathName: 'flour paw path', gateName: 'Cat Flap Gate', bannerName: 'Sunbeam pantry banner' },
    gameplaySkin: {
      collectibleSkin: 'milk_bottle_classic',
      hazardSet: 'kitchen_hazards',
      obstacleSet: 'rolling_spoons_and_spills',
      finishAsset: 'finish_milk_bowl'
    },
    audioSkin: {
      mapMusic: 'music_map_kitchen',
      gameplayMusic: 'music_run_kitchen',
      ambientLoop: 'amb_kitchen_fridge_hum',
      uiSelect: 'sfx_paw_tap_soft',
      gateUnlock: 'sfx_milk_clink_trill'
    },
    difficultyProfile: { speedMultiplier: 1, hazardDensity: 'low', visualComplexity: 'low' },
    mechanicFlags: { ...DEFAULT_FLAGS }
  },
  {
    id: 'world_02_living_room',
    displayName: 'Living Room Zoomies',
    shortName: 'Living Room',
    themeKey: 'living_room',
    order: 2,
    ring: 1,
    atlasLabel: 'Ring 1 - Around the House',
    locationFantasy: 'Couch cushions, rug trails, and the sacred law of sudden zoomies.',
    previewHint: 'A bigger room with more toys and more questionable decisions.',
    unlockMilkRequirement: 12,
    palette: { background: '#6fb68a', band: 0xf06d5f, path: 0xff8ec7, pathEdge: 0x5d3b8c, node: 0xfff2bd, accent: 0xff6fae, hudTint: 0x306955 },
    mapSkin: { pathName: 'yarn trail', gateName: 'Couch Tunnel', bannerName: 'Blanket fort banner' },
    gameplaySkin: {
      collectibleSkin: 'milk_bowl_living_room',
      hazardSet: 'vacuum_trails',
      obstacleSet: 'toy_mice_and_yarn',
      finishAsset: 'finish_cat_bed'
    },
    audioSkin: {
      mapMusic: 'music_map_living_room',
      gameplayMusic: 'music_run_living_room',
      ambientLoop: 'amb_tv_couch_rustle',
      uiSelect: 'sfx_paw_tap_soft',
      gateUnlock: 'sfx_yarn_pop'
    },
    difficultyProfile: { speedMultiplier: 1.08, hazardDensity: 'medium', visualComplexity: 'medium' },
    mechanicFlags: { ...DEFAULT_FLAGS, movingHazardsEnabled: true }
  },
  {
    id: 'world_03_bedroom',
    displayName: 'Bedroom Blanket Kingdom',
    shortName: 'Bedroom',
    themeKey: 'living_room',
    order: 3,
    ring: 1,
    atlasLabel: 'Ring 1 - Around the House',
    locationFantasy: 'Blanket hills, pillow forts, sock slides, and moonbeam naps.',
    previewHint: 'The cat discovers that laundry piles are basically mountains.',
    unlockMilkRequirement: 26,
    palette: { background: '#8ea4df', band: 0xffc6de, path: 0xf4f0ff, pathEdge: 0x5b5f9f, node: 0xffffff, accent: 0xffd166, hudTint: 0x4f558a },
    mapSkin: { pathName: 'blanket tunnel trail', gateName: 'Door Crack Gate', bannerName: 'Pillow fort banner' },
    gameplaySkin: {
      collectibleSkin: 'milk_bowl_bedroom',
      hazardSet: 'sock_piles_and_slippers',
      obstacleSet: 'pillows_laundry_nightstand',
      finishAsset: 'finish_cat_bed'
    },
    audioSkin: {
      mapMusic: 'music_map_bedroom',
      gameplayMusic: 'music_run_bedroom',
      ambientLoop: 'amb_soft_room',
      uiSelect: 'sfx_paw_tap_soft',
      gateUnlock: 'sfx_blanket_pop'
    },
    difficultyProfile: { speedMultiplier: 1.1, hazardDensity: 'medium', visualComplexity: 'medium' },
    mechanicFlags: { ...DEFAULT_FLAGS, movingHazardsEnabled: true }
  },
  {
    id: 'world_04_hallway',
    displayName: 'Hallway Dash',
    shortName: 'Hallway',
    themeKey: 'kitchen',
    order: 4,
    ring: 1,
    atlasLabel: 'Ring 1 - Around the House',
    locationFantasy: 'A long runner rug, door cracks, dust bunnies, and high-speed bravery.',
    previewHint: 'The house turns into a runway.',
    unlockMilkRequirement: 40,
    palette: { background: '#f3b36d', band: 0xf7e3a4, path: 0xfff6df, pathEdge: 0x9f643c, node: 0xffffff, accent: 0x53d36d, hudTint: 0x7c4d2f },
    mapSkin: { pathName: 'runner rug route', gateName: 'Back Door Gate', bannerName: 'Hallway photo banner' },
    gameplaySkin: {
      collectibleSkin: 'milk_bottle_classic',
      hazardSet: 'dust_bunny_sneaks',
      obstacleSet: 'doorways_and_baseboards',
      finishAsset: 'finish_milk_bowl'
    },
    audioSkin: {
      mapMusic: 'music_map_hallway',
      gameplayMusic: 'music_run_hallway',
      ambientLoop: 'amb_floor_creak',
      uiSelect: 'sfx_paw_tap_soft',
      gateUnlock: 'sfx_door_click'
    },
    difficultyProfile: { speedMultiplier: 1.14, hazardDensity: 'medium', visualComplexity: 'low' },
    mechanicFlags: { ...DEFAULT_FLAGS, slipperyFloorEnabled: true }
  },
  {
    id: 'world_05_backyard',
    displayName: 'Backyard Fence Club',
    shortName: 'Backyard',
    themeKey: 'backyard',
    order: 5,
    ring: 2,
    atlasLabel: 'Ring 2 - Yard and Street',
    locationFantasy: 'Fence posts, grass tunnels, and the first secret outdoor cat society.',
    previewHint: 'The cat leaves the house but keeps home in sight.',
    unlockMilkRequirement: 54,
    palette: { background: '#77c765', band: 0xa7e870, path: 0xd8b176, pathEdge: 0x6e9b49, node: 0xf6ffe7, accent: 0x7ed7ff, hudTint: 0x3f7b45 },
    mapSkin: { pathName: 'stepping stones', gateName: 'Garden Gate', bannerName: 'Fence-club banner' },
    gameplaySkin: {
      collectibleSkin: 'milk_carton_backyard',
      hazardSet: 'garden_hoses_and_bugs',
      obstacleSet: 'gnomes_leaves_tools',
      finishAsset: 'finish_fence_perch'
    },
    audioSkin: {
      mapMusic: 'music_map_backyard',
      gameplayMusic: 'music_run_backyard',
      ambientLoop: 'amb_birds_breeze_bugs',
      uiSelect: 'sfx_paw_tap_soft',
      gateUnlock: 'sfx_gate_creak_happy'
    },
    difficultyProfile: { speedMultiplier: 1.16, hazardDensity: 'medium', visualComplexity: 'medium' },
    mechanicFlags: { ...DEFAULT_FLAGS, movingHazardsEnabled: true, windPushEnabled: false }
  },
  {
    id: 'world_06_porch',
    displayName: 'Porch Patrol',
    shortName: 'Porch',
    themeKey: 'backyard',
    order: 6,
    ring: 2,
    atlasLabel: 'Ring 2 - Yard and Street',
    locationFantasy: 'Welcome mats, package boxes, porch lights, and one very important inspection.',
    previewHint: 'The doorway becomes a launchpad.',
    unlockMilkRequirement: 68,
    palette: { background: '#8cc4be', band: 0xffd166, path: 0xf7e1b4, pathEdge: 0x5b7c73, node: 0xf8fff4, accent: 0xff7aa8, hudTint: 0x41675f },
    mapSkin: { pathName: 'welcome mat trail', gateName: 'Sidewalk Gap', bannerName: 'Porch light banner' },
    gameplaySkin: {
      collectibleSkin: 'milk_carton_porch',
      hazardSet: 'doorbell_drama',
      obstacleSet: 'packages_and_pots',
      finishAsset: 'finish_fence_perch'
    },
    audioSkin: {
      mapMusic: 'music_map_porch',
      gameplayMusic: 'music_run_porch',
      ambientLoop: 'amb_porch_breeze',
      uiSelect: 'sfx_paw_tap_soft',
      gateUnlock: 'sfx_mat_swish'
    },
    difficultyProfile: { speedMultiplier: 1.18, hazardDensity: 'medium', visualComplexity: 'medium' },
    mechanicFlags: { ...DEFAULT_FLAGS, movingHazardsEnabled: true }
  },
  {
    id: 'world_07_sidewalk',
    displayName: 'Sidewalk Sniffers',
    shortName: 'Sidewalk',
    themeKey: 'backyard',
    order: 7,
    ring: 2,
    atlasLabel: 'Ring 2 - Yard and Street',
    locationFantasy: 'Sidewalk cracks, chalk paw paths, leaf chases, and storm drain staring.',
    previewHint: 'A public adventure, one sidewalk square at a time.',
    unlockMilkRequirement: 82,
    palette: { background: '#a9c4d8', band: 0x8fe8ff, path: 0xe7e4d5, pathEdge: 0x6f7f8e, node: 0xffffff, accent: 0xffcf5a, hudTint: 0x4d6275 },
    mapSkin: { pathName: 'chalk paw path', gateName: 'Corner Crossing', bannerName: 'Mailbox mile banner' },
    gameplaySkin: {
      collectibleSkin: 'milk_carton_sidewalk',
      hazardSet: 'passing_shoes',
      obstacleSet: 'leaves_mailboxes_cracks',
      finishAsset: 'finish_fence_perch'
    },
    audioSkin: {
      mapMusic: 'music_map_sidewalk',
      gameplayMusic: 'music_run_sidewalk',
      ambientLoop: 'amb_sidewalk',
      uiSelect: 'sfx_paw_tap_soft',
      gateUnlock: 'sfx_chalk_spark'
    },
    difficultyProfile: { speedMultiplier: 1.22, hazardDensity: 'medium', visualComplexity: 'medium' },
    mechanicFlags: { ...DEFAULT_FLAGS, movingHazardsEnabled: true, windPushEnabled: true }
  },
  {
    id: 'world_08_neighborhood',
    displayName: 'Neighborhood Catwalk',
    shortName: 'Neighborhood',
    themeKey: 'backyard',
    order: 8,
    ring: 3,
    atlasLabel: 'Ring 3 - Neighborhood',
    locationFantasy: 'Other animals, corner signs, park smells, and the first big-world feeling.',
    previewHint: 'The world is populated now.',
    unlockMilkRequirement: 96,
    palette: { background: '#78b7d4', band: 0xf06d5f, path: 0xf9d895, pathEdge: 0x496f95, node: 0xffffff, accent: 0x7ef08d, hudTint: 0x365d78 },
    mapSkin: { pathName: 'neighborhood loop', gateName: 'Town Road', bannerName: 'Alley council banner' },
    gameplaySkin: {
      collectibleSkin: 'milk_carton_neighborhood',
      hazardSet: 'alley_cat_academy',
      obstacleSet: 'benches_boxes_signs',
      finishAsset: 'finish_fence_perch'
    },
    audioSkin: {
      mapMusic: 'music_map_neighborhood',
      gameplayMusic: 'music_run_neighborhood',
      ambientLoop: 'amb_neighborhood',
      uiSelect: 'sfx_paw_tap_soft',
      gateUnlock: 'sfx_gate_creak_happy'
    },
    difficultyProfile: { speedMultiplier: 1.26, hazardDensity: 'high', visualComplexity: 'medium' },
    mechanicFlags: { ...DEFAULT_FLAGS, movingHazardsEnabled: true, chaserEnabled: true }
  },
  {
    id: 'world_09_magical_kingdom',
    displayName: 'Magical Milk Kingdom',
    shortName: 'Milk Kingdom',
    themeKey: 'magical-kingdom',
    order: 9,
    ring: 4,
    atlasLabel: 'Ring 4 - Dream Routes',
    locationFantasy: 'Milk-glass towers, star lanterns, crystal mushrooms, and royal moon-milk deliveries.',
    previewHint: 'The neighborhood path opens into a storybook kingdom made for brave little paws.',
    unlockMilkRequirement: 112,
    palette: { background: '#7d8fe8', band: 0xf8d7ff, path: 0xfff7ef, pathEdge: 0x6e58b8, node: 0xffffff, accent: 0xffd166, hudTint: 0x56479a },
    mapSkin: { pathName: 'moon-milk cobblestones', gateName: 'Star Lantern Gate', bannerName: 'Royal milk banner' },
    gameplaySkin: {
      collectibleSkin: 'royal_moon_milk',
      hazardSet: 'jelly_crowns_and_sparkles',
      obstacleSet: 'wobble_jelly_royal_props',
      finishAsset: 'finish_royal_milk_bottle'
    },
    audioSkin: {
      mapMusic: 'music_map_magical_kingdom',
      gameplayMusic: 'music_run_magical_kingdom',
      ambientLoop: 'amb_star_lantern_chime',
      uiSelect: 'sfx_paw_tap_soft',
      gateUnlock: 'sfx_star_chime'
    },
    difficultyProfile: { speedMultiplier: 1.3, hazardDensity: 'high', visualComplexity: 'high' },
    mechanicFlags: { ...DEFAULT_FLAGS, movingHazardsEnabled: true, timedSwitchesEnabled: true }
  }
];

const LEVEL_NAMES = {
  world_00_home: [
    ['Wake Up Wiggle', 'Stretch, blink, and find the first bottle.'],
    ['Bowl Check', 'The milk bowl requires a formal inspection.'],
    ['Sunbeam Scoot', 'Follow the warm patch across the floor.'],
    ['Toy Mouse Treaty', 'Negotiate with the toy mouse by running past it.'],
    ['Blanket Loaf', 'A soft little route through the nap zone.'],
    ['Pantry Peek', 'The kitchen is calling from the next room.'],
    ['Tiny Victory Lap', 'One more loop before the big counter adventure.'],
    ['Home Bowl Hero', 'Home base sends the cat onward.']
  ],
  world_01_kitchen: [
    ['First Sip', 'Clean counter intro.'],
    ['Counter Cruiser', 'A beginner-friendly sprint by the cereal crumbs.'],
    ['Crumb Trail', 'Get the milk before the crumbs call backup.'],
    ['Spoon Slide', 'The spoon has opinions.'],
    ['Mug Hop', 'A careful hop around forbidden cup territory.'],
    ['Milk Puddle Path', 'Follow the tiny spill without making it worse.'],
    ['Cabinet Climber', 'Late-world pacing with cabinet-door drama.'],
    ['Breakfast Dash', 'Kitchen finale chaos with warm morning energy.']
  ],
  world_02_living_room: [
    ['Zoomie Starter', 'A soft landing from the kitchen.'],
    ['Rug Rush', 'Tighter lane movement on the rug trail.'],
    ['Couch Canyon', 'The couch gap is a geographic feature now.'],
    ['Yarn Spiral', 'A very serious yarn-based navigation problem.'],
    ['Blanket Tunnel', 'A dense blanket route.'],
    ['Plant Crimes', 'The plant knows what it did.'],
    ['Remote Control Run', 'Obstacle timing from the best seat.'],
    ['Midnight Sprint', 'Finale pressure without losing the joke.']
  ],
  world_03_bedroom: [
    ['Pillow Patrol', 'The pillow fort accepts one brave visitor.'],
    ['Sock Slide', 'Sock physics are not peer reviewed.'],
    ['Blanket Burrow', 'A cozy tunnel with sneaky turns.'],
    ['Laundry Loaf', 'The laundry pile is legally a mountain.'],
    ['Nightstand Sneak', 'Tiptoe past forbidden tabletop energy.'],
    ['Moonbeam Nap', 'Collect milk without falling asleep.'],
    ['Underbed Mystery', 'Something under there probably has whiskers.'],
    ['Dream Dash', 'A soft finale with sleepy speed.']
  ],
  world_04_hallway: [
    ['Tiny Sprint', 'First hallway burst.'],
    ['Rug Runner', 'Runner rug lanes with extra slide.'],
    ['Dust Bunny Dodge', 'Dust bunnies are innocent but in the way.'],
    ['Door Crack Dash', 'A precise route past cracked doors.'],
    ['Baseboard Bounce', 'Follow the baseboard like a tiny rail.'],
    ['Family Photo Flash', 'Everyone saw that jump.'],
    ['Sneaky Shadow', 'Fake-out patterns near the corner.'],
    ['Hallway Hero', 'The back door is finally in sight.']
  ],
  world_05_backyard: [
    ['Fence Rookie', 'First outdoor run.'],
    ['Grass Wiggle', 'The grass is taller than expected.'],
    ['Pot Patrol', 'Flower pots form a tiny obstacle course.'],
    ['Birdbath Bluff', 'Soft distraction theme.'],
    ['Garden Sneak', 'Mid-world route control.'],
    ['Porch Pounce', 'Moving hazard flavor near the steps.'],
    ['Fence Line Dash', 'Higher pace along the fence.'],
    ['Clubhouse Gate', 'Finale joke, naturally.']
  ],
  world_06_porch: [
    ['Welcome Mat Wiggle', 'The porch mat has seen things.'],
    ['Package Inspector', 'Every box must be investigated.'],
    ['Porch Light Panic', 'A dramatic sprint under the light.'],
    ['Box Fort Run', 'Cardboard destiny returns.'],
    ['Doorbell Drama', 'The sound is suspiciously powerful.'],
    ['Plant Pot Parade', 'Potted plants line the route.'],
    ['Step Sneak', 'One careful paw at a time.'],
    ['Threshold Triumph', 'The sidewalk is next.']
  ],
  world_07_sidewalk: [
    ['Crack Patrol', 'Survey every sidewalk crack.'],
    ['Leaf Chase', 'The leaf started it.'],
    ['Chalk Paw Path', 'Follow the chalk marks like a legend.'],
    ['Mailbox Mile', 'Mailbox shadows and tiny turns.'],
    ['Storm Drain Stare', 'Do not blink first.'],
    ['Passing Shoes', 'Careful timing in public.'],
    ['Curb Scout', 'The curb is a frontier.'],
    ['Corner Crossing', 'Neighborhood smells unlocked.']
  ],
  world_08_neighborhood: [
    ['Trash Lid Tap', 'Street-smart rhythm without getting too scrappy.'],
    ['Fishbone Alley', 'A suspiciously themed shortcut.'],
    ['Cardboard Shortcut', 'The box network expands.'],
    ['Bench Bandit', 'Park bench routes enter the atlas.'],
    ['Picnic Patrol', 'Blanket paths, outdoor edition.'],
    ['Squirrel Suspicion', 'Nobody is accusing anyone yet.'],
    ['Fountain Flicker', 'A brighter, busier route.'],
    ['Alley Council', 'The neighborhood officially notices the cat.']
  ],
  world_09_magical_kingdom: [
    ['Lantern Landing', 'First steps under the royal star lanterns.'],
    ['Moon-Milk Road', 'Follow the bright cobblestones without drifting.'],
    ['Crystal Capers', 'Sparkly mushrooms mark the safer route.'],
    ['Jelly Crown Jive', 'The royal dessert wobble begins.'],
    ['Cloud Bridge Scoot', 'A dreamy path through floating cream clouds.'],
    ['Tower Twinkle', 'Milk-glass towers glitter at the lane edges.'],
    ['Royal Bottle Rush', 'The finish bottle is watching with tiny cheeks.'],
    ['Kingdom Milk Run', 'A full-speed dash through the storybook gates.']
  ]
} as const;

const BONUS_NAMES = {
  world_00_home: ['Secret Sunbeam', 'A bonus nap path with maximum comfort.'],
  world_01_kitchen: ['Laser Pointer Incident', 'Catch the shimmer without blaming the wall.'],
  world_02_living_room: ['The Box Has Chosen You', 'A bonus branch with cardboard destiny.'],
  world_03_bedroom: ['Sock Portal', 'A laundry detour of unknown origin.'],
  world_04_hallway: ['Dust Bunny Summit', 'A bonus meeting at floor level.'],
  world_05_backyard: ['Catnip Fever Dream', 'A sparkly detour through the fence club.'],
  world_06_porch: ['Package Kingdom', 'A cardboard throne appears.'],
  world_07_sidewalk: ['Leaf Tornado', 'A crunchy detour with wind drama.'],
  world_08_neighborhood: ['Alley Whisper', 'A hidden route for serious little cats.'],
  world_09_magical_kingdom: ['Crown Jelly Waltz', 'A hidden royal detour with wobbling dessert drama.']
} as const;

export const MAP_NODES: MapNode[] = WORLDS.flatMap((world, worldIndex) => {
  const baseX = 310;
  const yRows = [196, 240, 284, 328, 372, 336, 292, 248];
  const xOffsets = [0, 58, 18, 92, 42, 130, 172, 222];
  const nodes = LEVEL_NAMES[world.id as keyof typeof LEVEL_NAMES].map(([name, flavor], index) => {
    const number = index + 1;
    const previousNodeId =
      index === 0
        ? worldIndex === 0
          ? undefined
          : `world_${String(worldIndex).padStart(2, '0')}_gate`
        : `${world.id}_level_${String(index).padStart(2, '0')}`;
    return {
      id: `${world.id}_level_${String(number).padStart(2, '0')}`,
      worldId: world.id,
      displayName: name,
      flavor,
      levelSceneKey: `run_${world.themeKey}_${String(number).padStart(2, '0')}`,
      nodeType: 'main' as const,
      x: baseX + xOffsets[index],
      y: yRows[index],
      unlock: { previousNodeId, requiredMilkBottles: index === 0 ? world.unlockMilkRequirement : 0 },
      scoreTargets: {
        oneBottle: 1,
        twoBottleScore: 160 + world.order * 20 + index * 18,
        threeBottleScore: 260 + world.order * 30 + index * 24
      }
    };
  });

  const bonus = BONUS_NAMES[world.id as keyof typeof BONUS_NAMES];
  const bonusNode: MapNode = {
    id: `${world.id}_bonus_01`,
    worldId: world.id,
    displayName: bonus[0],
    flavor: bonus[1],
    levelSceneKey: `run_${world.themeKey}_bonus_01`,
    nodeType: 'bonus',
    x: baseX + 132,
    y: 194,
    unlock: { previousNodeId: `${world.id}_level_04`, requiredMilkBottles: world.order * 3 },
    scoreTargets: { oneBottle: 1, twoBottleScore: 220 + world.order * 35, threeBottleScore: 360 + world.order * 42 }
  };

  const gate: MapNode | undefined =
    worldIndex < WORLDS.length - 1
      ? {
          id: `world_${String(worldIndex + 1).padStart(2, '0')}_gate`,
          worldId: world.id,
          displayName: WORLDS[worldIndex + 1].mapSkin.gateName,
          flavor: `Need ${WORLDS[worldIndex + 1].unlockMilkRequirement} milk bottles to squeeze through.`,
          levelSceneKey: `gate_to_${WORLDS[worldIndex + 1].themeKey}`,
          nodeType: 'gate',
          x: baseX + 258,
          y: 344,
          unlock: { previousNodeId: `${world.id}_level_08`, requiredMilkBottles: WORLDS[worldIndex + 1].unlockMilkRequirement },
          scoreTargets: { oneBottle: 1, twoBottleScore: 1, threeBottleScore: 1 }
        }
      : undefined;

  return gate ? [...nodes, bonusNode, gate] : [...nodes, bonusNode];
});

export const MAP_CONNECTIONS = MAP_NODES.flatMap((node) => {
  const previousNodeId = node.unlock.previousNodeId;
  return previousNodeId ? [{ from: previousNodeId, to: node.id }] : [];
});

export function getWorldForNode(node: MapNode) {
  return WORLDS.find((world) => world.id === node.worldId) ?? WORLDS[0];
}

export function getMapNodeById(nodeId: string): MapNode | undefined {
  return MAP_NODES.find((node) => node.id === nodeId);
}

export function getRequiredMapNode(nodeId: string): MapNode {
  const node = getMapNodeById(nodeId);
  if (!node) throw new Error(`Unknown map node: ${nodeId}`);
  return node;
}

export function getWorldById(worldId: string): WorldConfig | undefined {
  return WORLDS.find((world) => world.id === worldId);
}

export function getRequiredWorld(worldId: string): WorldConfig {
  const world = getWorldById(worldId);
  if (!world) throw new Error(`Unknown world: ${worldId}`);
  return world;
}
