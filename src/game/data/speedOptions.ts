export type SpeedOption = {
  label: string;
  multiplier: number;
  tint: number;
};

export const SPEED_OPTIONS: SpeedOption[] = [
  { label: 'Loaf Mode\n0.5x', multiplier: 0.5, tint: 0x8fe8ff },
  { label: 'Purr Trot\n1x', multiplier: 1, tint: 0x7ef08d },
  { label: 'Zoomies\n1.5x', multiplier: 1.5, tint: 0xffd166 },
  { label: 'Turbo Floof\n2x', multiplier: 2, tint: 0xff7aa8 }
];

export function optionLabelForMultiplier(multiplier: number) {
  return SPEED_OPTIONS.find((option) => option.multiplier === multiplier)?.label.replace('\n', ' ') ?? `${multiplier}x speed`;
}
