import Phaser from 'phaser';

export function getGridPosition(index: number, columns: number, startX: number, startY: number, columnWidth: number, rowHeight: number) {
  return new Phaser.Math.Vector2(startX + (index % columns) * columnWidth, startY + Math.floor(index / columns) * rowHeight);
}
