export type ThemeKey = 'kitchen' | 'living_room' | 'backyard';

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
    id: 'world_01_kitchen',
    displayName: 'Cozy Kitchen Counter',
    shortName: 'Kitchen',
    themeKey: 'kitchen',
    order: 1,
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
    id: 'world_03_backyard',
    displayName: 'Backyard Fence Club',
    shortName: 'Backyard',
    themeKey: 'backyard',
    order: 3,
    unlockMilkRequirement: 26,
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
  }
];

const LEVEL_NAMES = {
  world_01_kitchen: [
    ['First Sip', 'Clean intro.'],
    ['Counter Zoomies', 'Basic speed bump.'],
    ['Bowl Patrol', 'Simple collection pattern.'],
    ['Crumb Chase', 'Get the milk before the crumbs call backup.'],
    ['The Forbidden Cup', 'Avoid toppled-cup trouble.'],
    ['Spoon Slide', 'The spoon has opinions.'],
    ['Midnight Snack', 'Late-world pacing with tiny meows.'],
    ['The Great Spill', 'Kitchen finale chaos.']
  ],
  world_02_living_room: [
    ['Rug Sprint', 'A soft landing from the kitchen.'],
    ['Couch Gap', 'Tighter lane movement.'],
    ['Plant Crimes', 'The plant knows what it did.'],
    ['Remote Throne', 'Obstacle timing from the best seat.'],
    ['Laundry Cave', 'A dense blanket route.'],
    ['Ghost in the Hallway', 'Fake-out patterns in the dark corner.'],
    ['Midnight Zoom', 'Faster rhythm.'],
    ['The Vacuum Awakens', 'Finale pressure without losing the joke.']
  ],
  world_03_backyard: [
    ['Fence Walk', 'First outdoor run.'],
    ['Birdbath Watch', 'Soft distraction theme.'],
    ['Gnome Suspicion', 'The gnome is probably innocent.'],
    ['Hose Snake', 'A clear hazard reskin.'],
    ['Patio Patrol', 'Mid-world route control.'],
    ['Bug Hunt', 'Moving hazard flavor.'],
    ['Neighbor Cat Standoff', 'Higher pace.'],
    ['The Door Is Closed', 'Finale joke, naturally.']
  ]
} as const;

const BONUS_NAMES = {
  world_01_kitchen: ['Laser Pointer Incident', 'Catch the shimmer without blaming the wall.'],
  world_02_living_room: ['The Box Has Chosen You', 'A bonus branch with cardboard destiny.'],
  world_03_backyard: ['Catnip Fever Dream', 'A sparkly detour through the fence club.']
} as const;

export const MAP_NODES: MapNode[] = WORLDS.flatMap((world, worldIndex) => {
  const baseX = 122 + worldIndex * 286;
  const yRows = [178, 232, 286, 344, 400, 344, 286, 232];
  const xOffsets = [0, 60, 20, 86, 38, 126, 168, 218];
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
    y: 178,
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
