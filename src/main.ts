import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './game/constants';
import { BootScene } from './game/scenes/BootScene';
import { LaunchScene } from './game/scenes/LaunchScene';
import { MilkMapScene } from './game/scenes/MilkMapScene';
import { RunScene } from './game/scenes/RunScene';
import { ShopScene } from './game/scenes/ShopScene';
import './style.css';

let game: Phaser.Game | undefined;

const syncVisibleViewport = () => {
  const viewport = window.visualViewport;
  const root = document.documentElement;

  root.style.setProperty('--viewport-width', `${viewport?.width ?? window.innerWidth}px`);
  root.style.setProperty('--viewport-height', `${viewport?.height ?? window.innerHeight}px`);
  root.style.setProperty('--viewport-left', `${viewport?.offsetLeft ?? 0}px`);
  root.style.setProperty('--viewport-top', `${viewport?.offsetTop ?? 0}px`);
  game?.scale.refresh();
};

syncVisibleViewport();
window.addEventListener('resize', syncVisibleViewport);
window.addEventListener('orientationchange', syncVisibleViewport);
window.visualViewport?.addEventListener('resize', syncVisibleViewport);
window.visualViewport?.addEventListener('scroll', syncVisibleViewport);

game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#73d36a',
  scene: [BootScene, LaunchScene, MilkMapScene, ShopScene, RunScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade'
  }
});

// Browsers require a user gesture before entering fullscreen. In landscape,
// use the first game tap after rotation to enter it when the API is available.
const requestLandscapeFullscreen = () => {
  if (!window.matchMedia('(orientation: landscape)').matches || document.fullscreenElement) return;
  if (!document.fullscreenEnabled || !navigator.userActivation?.isActive) return;

  void document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {
    // iPhone Safari may keep browser chrome visible; visualViewport still
    // ensures the complete game is fitted inside the actually visible area.
  });
};

document.addEventListener('pointerup', requestLandscapeFullscreen, { capture: true });

if (import.meta.env.DEV) {
  window.__KITTY_MILK_RUN__ = game;
}
