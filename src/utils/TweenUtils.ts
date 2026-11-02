import { UIManager } from "./UIManager";

export class TweenUtils {
  public static scene: Phaser.Scene;

  public static opacityTween(
    target: Phaser.GameObjects.GameObject,
    alpha: number,
    duration: number,
    delay: number = 0
  ): Phaser.Tweens.Tween {
    const tween = TweenUtils.scene.tweens.add({
      targets: target,
      alpha,
      duration,
      delay,
      ease: "Cubic.easeOut"
    });
    UIManager.getInstance().registerTween(tween);
    return tween;
  }

  public static moveTween(
    target: Phaser.GameObjects.GameObject,
    x: number,
    y: number,
    duration: number,
    delay: number = 0
  ): Phaser.Tweens.Tween {
    const tween = TweenUtils.scene.tweens.add({
      targets: target,
      x,
      y,
      duration,
      delay,
      ease: "Back.easeOut"
    });
    UIManager.getInstance().registerTween(tween);
    return tween;
  }
}
