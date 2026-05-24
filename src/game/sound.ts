type ToneName = 'yarn' | 'bonk' | 'win' | 'start';

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

