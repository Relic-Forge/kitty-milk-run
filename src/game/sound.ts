import type Phaser from 'phaser';
import { SOUNDS, type SoundKey } from './assets';

type ToneName = 'yarn' | 'bonk' | 'win' | 'start';
type GameSoundName = 'start' | 'yarn' | 'catHit' | 'foilScare' | 'vacuum' | 'win' | 'shopBuy' | 'shopEquip' | 'shopDeny';

type GameSoundConfig = {
  keys: SoundKey[];
  volume: number;
  rate: [number, number];
  fallback: ToneName;
};

const toneSets: Record<ToneName, Array<[number, number, OscillatorType]>> = {
  start: [
    [523, 0.08, 'square'],
    [659, 0.08, 'square'],
    [784, 0.11, 'square']
  ],
  yarn: [
    [880, 0.06, 'sine'],
    [1175, 0.08, 'sine']
  ],
  bonk: [
    [180, 0.08, 'sawtooth'],
    [115, 0.1, 'sawtooth']
  ],
  win: [
    [523, 0.09, 'triangle'],
    [659, 0.09, 'triangle'],
    [784, 0.1, 'triangle'],
    [1046, 0.16, 'triangle']
  ]
};

const gameSounds: Record<GameSoundName, GameSoundConfig> = {
  start: {
    keys: [SOUNDS.catPopMeow, SOUNDS.catSoftMew],
    volume: 0.42,
    rate: [1.08, 1.28],
    fallback: 'start'
  },
  yarn: {
    keys: [SOUNDS.catPopMeow],
    volume: 0.22,
    rate: [1.35, 1.65],
    fallback: 'yarn'
  },
  catHit: {
    keys: [SOUNDS.catMewFood, SOUNDS.catSoftMew, SOUNDS.catPopMeow],
    volume: 0.5,
    rate: [0.82, 1.18],
    fallback: 'bonk'
  },
  foilScare: {
    keys: [SOUNDS.catLabMeow, SOUNDS.catMewPurr2],
    volume: 0.56,
    rate: [1.22, 1.55],
    fallback: 'bonk'
  },
  vacuum: {
    keys: [SOUNDS.catMewPurr2, SOUNDS.catMewPurr],
    volume: 0.58,
    rate: [0.55, 0.72],
    fallback: 'bonk'
  },
  win: {
    keys: [SOUNDS.catMewPurr, SOUNDS.catSoftMew],
    volume: 0.46,
    rate: [0.92, 1.08],
    fallback: 'win'
  },
  shopBuy: {
    keys: [SOUNDS.catSoftMew, SOUNDS.catPopMeow],
    volume: 0.4,
    rate: [1.12, 1.34],
    fallback: 'yarn'
  },
  shopEquip: {
    keys: [SOUNDS.catPopMeow],
    volume: 0.32,
    rate: [1.0, 1.18],
    fallback: 'start'
  },
  shopDeny: {
    keys: [SOUNDS.catLabMeow],
    volume: 0.34,
    rate: [0.72, 0.86],
    fallback: 'bonk'
  }
};

let audioContext: AudioContext | undefined;

function getAudioContext() {
  audioContext ??= new AudioContext();
  if (audioContext.state === 'suspended') void audioContext.resume();
  return audioContext;
}

export function playToneSet(name: ToneName) {
  try {
    const ctx = getAudioContext();
    let offset = 0;

    for (const [frequency, duration, type] of toneSets[name]) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      gain.connect(ctx.destination);

      const start = ctx.currentTime + offset;
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.09, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
      offset += duration * 0.72;
    }
  } catch {
    // Audio is optional in the MVP and can be unavailable in locked-down browsers.
  }
}

export function playGameSound(scene: Phaser.Scene, name: GameSoundName) {
  const config = gameSounds[name];

  try {
    const key = config.keys[Math.floor(Math.random() * config.keys.length)];
    const rate = config.rate[0] + Math.random() * (config.rate[1] - config.rate[0]);
    scene.sound.play(key, {
      volume: config.volume,
      rate
    });
  } catch {
    playToneSet(config.fallback);
  }
}
