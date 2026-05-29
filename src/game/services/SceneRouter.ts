import type Phaser from 'phaser';

export class SceneRouter {
  static launch(scene: Phaser.Scene) {
    scene.scene.start('LaunchScene');
  }

  static map(scene: Phaser.Scene) {
    scene.scene.start('MilkMapScene');
  }

  static shop(scene: Phaser.Scene, returnTo = 'LaunchScene') {
    scene.scene.start('ShopScene', { returnTo });
  }

  static run(scene: Phaser.Scene, nodeId: string) {
    scene.scene.start('RunScene', { nodeId });
  }
}
