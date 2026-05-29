import Phaser from 'phaser';
import { UiPanel } from './UiPanel';

export class UiCard {
  readonly container: Phaser.GameObjects.Container;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    state: { selected?: boolean; locked?: boolean; completed?: boolean } = {}
  ) {
    this.container = scene.add.container(x, y);
    const fill = state.locked ? 0x52607e : state.selected ? 0xff7aa8 : state.completed ? 0x53d36d : 0x17347e;
    this.container.add(new UiPanel({ scene, x: -width / 2, y: -height / 2, width, height, fill, radius: 16, highlight: true }).graphics);
  }
}
