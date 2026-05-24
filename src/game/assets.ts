export const ASSETS = {
  catRun1: 'cat-run-1',
  catRun2: 'cat-run-2',
  catHit: 'cat-hit',
  dog: 'dog',
  cucumber: 'cucumber',
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

export type AssetKey = (typeof ASSETS)[keyof typeof ASSETS];

export function loadGameAssets(scene: Phaser.Scene) {
  scene.load.svg(ASSETS.catRun1, '/assets/cat-run-1.svg', { width: 96, height: 88 });
  scene.load.svg(ASSETS.catRun2, '/assets/cat-run-2.svg', { width: 96, height: 88 });
  scene.load.svg(ASSETS.catHit, '/assets/cat-hit.svg', { width: 96, height: 88 });
  scene.load.svg(ASSETS.dog, '/assets/dog.svg', { width: 112, height: 82 });
  scene.load.svg(ASSETS.cucumber, '/assets/cucumber.svg', { width: 110, height: 58 });
  scene.load.svg(ASSETS.foil, '/assets/foil.svg', { width: 96, height: 72 });
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
}

