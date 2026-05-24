export const ASSETS = {
  catRun1: 'cat-run-1',
  catRun2: 'cat-run-2',
  catHit: 'cat-hit',
  catGrayRun1: 'cat-gray-run-1',
  catGrayRun2: 'cat-gray-run-2',
  catGrayHit: 'cat-gray-hit',
  catPinkRun1: 'cat-pink-run-1',
  catPinkRun2: 'cat-pink-run-2',
  catPinkHit: 'cat-pink-hit',
  catTuxRun1: 'cat-tux-run-1',
  catTuxRun2: 'cat-tux-run-2',
  catTuxHit: 'cat-tux-hit',
  catRainbowRun1: 'cat-rainbow-run-1',
  catRainbowRun2: 'cat-rainbow-run-2',
  catRainbowHit: 'cat-rainbow-hit',
  heartFull: 'heart-full',
  heartBroken: 'heart-broken',
  crazyHair: 'crazy-hair',
  dog: 'dog',
  cucumber: 'cucumber',
  vacuum: 'vacuum',
  yarnPink: 'yarn-pink',
  yarnBlue: 'yarn-blue',
  yarnPurple: 'yarn-purple',
  milkBottle: 'milk-bottle',
  milkBowl: 'milk-bowl',
  paw: 'paw-print',
  flower: 'flower',
  grassTuft: 'grass-tuft',
  sparkle: 'sparkle',
  finishFlag: 'finish-flag',
  foil: 'foil'
} as const;

export const SOUNDS = {
  catMewFood: 'cat-mew-food',
  catMewPurr: 'cat-mew-purr',
  catMewPurr2: 'cat-mew-purr-2',
  catSoftMew: 'cat-soft-mew',
  catPopMeow: 'cat-pop-meow',
  catLabMeow: 'cat-lab-meow',
  catPurrActive: 'cat-purr-active'
} as const;

export type AssetKey = (typeof ASSETS)[keyof typeof ASSETS];
export type SoundKey = (typeof SOUNDS)[keyof typeof SOUNDS];

export function loadGameAssets(scene: Phaser.Scene) {
  scene.load.svg(ASSETS.catRun1, '/assets/cat-run-1.svg', { width: 96, height: 88 });
  scene.load.svg(ASSETS.catRun2, '/assets/cat-run-2.svg', { width: 96, height: 88 });
  scene.load.svg(ASSETS.catHit, '/assets/cat-hit.svg', { width: 96, height: 88 });
  scene.load.svg(ASSETS.catGrayRun1, '/assets/cat-gray-run-1.svg', { width: 96, height: 88 });
  scene.load.svg(ASSETS.catGrayRun2, '/assets/cat-gray-run-2.svg', { width: 96, height: 88 });
  scene.load.svg(ASSETS.catGrayHit, '/assets/cat-gray-hit.svg', { width: 96, height: 88 });
  scene.load.svg(ASSETS.catPinkRun1, '/assets/cat-pink-run-1.svg', { width: 96, height: 88 });
  scene.load.svg(ASSETS.catPinkRun2, '/assets/cat-pink-run-2.svg', { width: 96, height: 88 });
  scene.load.svg(ASSETS.catPinkHit, '/assets/cat-pink-hit.svg', { width: 96, height: 88 });
  scene.load.svg(ASSETS.catTuxRun1, '/assets/cat-tux-run-1.svg', { width: 96, height: 88 });
  scene.load.svg(ASSETS.catTuxRun2, '/assets/cat-tux-run-2.svg', { width: 96, height: 88 });
  scene.load.svg(ASSETS.catTuxHit, '/assets/cat-tux-hit.svg', { width: 96, height: 88 });
  scene.load.svg(ASSETS.catRainbowRun1, '/assets/cat-rainbow-run-1.svg', { width: 96, height: 88 });
  scene.load.svg(ASSETS.catRainbowRun2, '/assets/cat-rainbow-run-2.svg', { width: 96, height: 88 });
  scene.load.svg(ASSETS.catRainbowHit, '/assets/cat-rainbow-hit.svg', { width: 96, height: 88 });
  scene.load.svg(ASSETS.heartFull, '/assets/heart-full.svg', { width: 46, height: 42 });
  scene.load.svg(ASSETS.heartBroken, '/assets/heart-broken.svg', { width: 46, height: 42 });
  scene.load.svg(ASSETS.crazyHair, '/assets/crazy-hair.svg', { width: 76, height: 54 });
  scene.load.svg(ASSETS.dog, '/assets/dog.svg', { width: 112, height: 82 });
  scene.load.svg(ASSETS.cucumber, '/assets/cucumber.svg', { width: 110, height: 58 });
  scene.load.svg(ASSETS.foil, '/assets/foil.svg', { width: 96, height: 72 });
  scene.load.svg(ASSETS.vacuum, '/assets/vacuum.svg', { width: 130, height: 88 });
  scene.load.svg(ASSETS.yarnPink, '/assets/yarn-pink.svg', { width: 56, height: 56 });
  scene.load.svg(ASSETS.yarnBlue, '/assets/yarn-blue.svg', { width: 56, height: 56 });
  scene.load.svg(ASSETS.yarnPurple, '/assets/yarn-purple.svg', { width: 56, height: 56 });
  scene.load.svg(ASSETS.milkBottle, '/assets/milk-bottle.svg', { width: 116, height: 150 });
  scene.load.svg(ASSETS.milkBowl, '/assets/milk-bowl.svg', { width: 170, height: 88 });
  scene.load.svg(ASSETS.paw, '/assets/paw-print.svg', { width: 40, height: 36 });
  scene.load.svg(ASSETS.flower, '/assets/flower.svg', { width: 32, height: 32 });
  scene.load.svg(ASSETS.grassTuft, '/assets/grass-tuft.svg', { width: 54, height: 38 });
  scene.load.svg(ASSETS.sparkle, '/assets/sparkle.svg', { width: 44, height: 44 });
  scene.load.svg(ASSETS.finishFlag, '/assets/finish-flag.svg', { width: 76, height: 76 });
  scene.load.audio(SOUNDS.catMewFood, '/assets/audio/cat-mew-food.wav');
  scene.load.audio(SOUNDS.catMewPurr, '/assets/audio/cat-mew-purr.wav');
  scene.load.audio(SOUNDS.catMewPurr2, '/assets/audio/cat-mew-purr-2.wav');
  scene.load.audio(SOUNDS.catSoftMew, '/assets/audio/cat-soft-mew.wav');
  scene.load.audio(SOUNDS.catPopMeow, '/assets/audio/cat-pop-meow.ogg');
  scene.load.audio(SOUNDS.catLabMeow, '/assets/audio/cat-lab-meow.mp3');
  scene.load.audio(SOUNDS.catPurrActive, '/assets/audio/cat-purr-active.wav');
}
