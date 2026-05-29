import type { MechanicFlags } from '../worldMap';

export const MECHANIC_IDS = [
  'jump',
  'extra_lanes',
  'moving_hazards',
  'timed_switches',
  'darkness',
  'wind_push',
  'slippery_floor',
  'chaser',
  'bonus_objective'
] as const;

export type MechanicId = (typeof MECHANIC_IDS)[number];

export type RunMechanic = {
  id: MechanicId;
  label: string;
  status: 'implemented' | 'planned';
};

export const RUN_MECHANICS: Record<MechanicId, RunMechanic> = {
  jump: { id: 'jump', label: 'Jump', status: 'planned' },
  extra_lanes: { id: 'extra_lanes', label: 'Extra lanes', status: 'implemented' },
  moving_hazards: { id: 'moving_hazards', label: 'Moving hazards', status: 'planned' },
  timed_switches: { id: 'timed_switches', label: 'Timed switches', status: 'planned' },
  darkness: { id: 'darkness', label: 'Darkness', status: 'planned' },
  wind_push: { id: 'wind_push', label: 'Wind push', status: 'planned' },
  slippery_floor: { id: 'slippery_floor', label: 'Slippery floor', status: 'planned' },
  chaser: { id: 'chaser', label: 'Chaser', status: 'planned' },
  bonus_objective: { id: 'bonus_objective', label: 'Bonus objective', status: 'implemented' }
};

export function mechanicIdsFromFlags(flags: MechanicFlags): MechanicId[] {
  const ids: MechanicId[] = [];
  if (flags.jumpEnabled) ids.push('jump');
  if (flags.extraLanesEnabled) ids.push('extra_lanes');
  if (flags.movingHazardsEnabled) ids.push('moving_hazards');
  if (flags.timedSwitchesEnabled) ids.push('timed_switches');
  if (flags.darknessEnabled) ids.push('darkness');
  if (flags.windPushEnabled) ids.push('wind_push');
  if (flags.slipperyFloorEnabled) ids.push('slippery_floor');
  if (flags.chaserEnabled) ids.push('chaser');
  if (flags.bonusObjectiveEnabled) ids.push('bonus_objective');
  return ids;
}

export function isKnownMechanicId(id: string): id is MechanicId {
  return (MECHANIC_IDS as readonly string[]).includes(id);
}
