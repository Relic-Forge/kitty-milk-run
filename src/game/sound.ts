import type Phaser from 'phaser';
import { SOUNDS, type SoundKey } from './assets';

type ToneName = 'yarn' | 'bonk' | 'win' | 'start';
type GameSoundName = 'start' | 'catHit' | 'foilScare' | 'vacuum' | 'win';
type BasketSoundName = 'collect' | 'buy' | 'equip' | 'deny';

export type AudioSettings = {
  soundFxEnabled: boolean;
  musicEnabled: boolean;
  volume: number;
};

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
    keys: [SOUNDS.catPurrActive],
    volume: 0.38,
    rate: [0.92, 1.02],
    fallback: 'win'
  }
};

let audioContext: AudioContext | undefined;
let audioSettings: AudioSettings = {
  soundFxEnabled: true,
  musicEnabled: true,
  volume: 0.8
};

export function setAudioSettings(settings: AudioSettings) {
  audioSettings = {
    soundFxEnabled: settings.soundFxEnabled,
    musicEnabled: settings.musicEnabled,
    volume: Math.max(0, Math.min(1, settings.volume))
  };
}

export function getAudioSettings() {
  return { ...audioSettings };
}

export function getMusicVolume() {
  return audioSettings.musicEnabled ? audioSettings.volume : 0;
}

function getAudioContext() {
  audioContext ??= new AudioContext();
  if (audioContext.state === 'suspended') void audioContext.resume();
  return audioContext;
}

export function playToneSet(name: ToneName) {
  if (!audioSettings.soundFxEnabled || audioSettings.volume <= 0) return;
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
      gain.gain.exponentialRampToValueAtTime(0.09 * audioSettings.volume, start + 0.015);
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
  if (!audioSettings.soundFxEnabled || audioSettings.volume <= 0) return;
  const config = gameSounds[name];

  try {
    const key = config.keys[Math.floor(Math.random() * config.keys.length)];
    const rate = config.rate[0] + Math.random() * (config.rate[1] - config.rate[0]);
    scene.sound.play(key, {
      volume: config.volume * audioSettings.volume,
      rate
    });
  } catch {
    playToneSet(config.fallback);
  }
}

export function playBasketSound(name: BasketSoundName = 'collect') {
  if (!audioSettings.soundFxEnabled || audioSettings.volume <= 0) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const noiseGain = ctx.createGain();
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.12), ctx.sampleRate);
    const samples = buffer.getChannelData(0);

    for (let i = 0; i < samples.length; i += 1) {
      samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length);
    }

    noise.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = name === 'deny' ? 520 : 920;
    filter.Q.value = 1.3;
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.exponentialRampToValueAtTime((name === 'deny' ? 0.045 : 0.07) * audioSettings.volume, now + 0.012);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    noise.start(now);
    noise.stop(now + 0.13);

    playEnvelopeTone(ctx, name === 'deny' ? 140 : 196, 0.09, 'triangle', (name === 'deny' ? 0.06 : 0.085) * audioSettings.volume, now + 0.018);
    if (name !== 'deny') {
      playEnvelopeTone(ctx, name === 'collect' ? 740 : 660, 0.08, 'sine', 0.055 * audioSettings.volume, now + 0.07);
      playEnvelopeTone(ctx, name === 'collect' ? 988 : 880, 0.07, 'sine', 0.042 * audioSettings.volume, now + 0.125);
    }
  } catch {
    playToneSet(name === 'deny' ? 'bonk' : 'yarn');
  }
}

function playEnvelopeTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  start: number
) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}
