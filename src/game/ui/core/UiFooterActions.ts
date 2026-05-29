import Phaser from 'phaser';
import { PixelButton } from '../components/PixelButton';

export type UiFooterAction = {
  label: string;
  color: number;
  onClick: () => void;
  disabled?: boolean;
};

export class UiFooterActions {
  readonly container: Phaser.GameObjects.Container;

  constructor(
    scene: Phaser.Scene,
    y: number,
    actions: UiFooterAction[],
    textStyle: (fontSize: number, color: string) => Phaser.Types.GameObjects.Text.TextStyle
  ) {
    this.container = scene.add.container(0, 0);
    const width = 164;
    const gap = 26;
    const startX = -((actions.length - 1) * (width + gap)) / 2;
    actions.forEach((action, index) => {
      const button = new PixelButton({
        scene,
        x: startX + index * (width + gap),
        y,
        width,
        height: 54,
        label: action.label,
        color: action.color,
        disabled: action.disabled,
        textStyle,
        onClick: action.onClick
      });
      this.container.add(button.container);
    });
  }
}
