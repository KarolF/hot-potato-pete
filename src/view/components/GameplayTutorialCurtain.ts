export class GameplayTutorialCurtain {
  private static readonly alpha = 0.58;
  private static readonly color = 0x000000;
  private static readonly holeLeft = -300;
  private static readonly holeRight = 300;
  private static readonly holeTop = -470;
  private static readonly holeBottom = -80;
  private static readonly span = 2000;

  public static create(scene: Phaser.Scene): Phaser.GameObjects.Rectangle[] {
    const span = GameplayTutorialCurtain.span;
    const holeLeft = GameplayTutorialCurtain.holeLeft;
    const holeRight = GameplayTutorialCurtain.holeRight;
    const holeTop = GameplayTutorialCurtain.holeTop;
    const holeBottom = GameplayTutorialCurtain.holeBottom;
    const topHeight = span / 2 + holeTop;
    const bottomHeight = span / 2 - holeBottom;
    const sideHeight = holeBottom - holeTop;
    const sideY = holeTop + sideHeight / 2;
    const sideWidth = (span - (holeRight - holeLeft)) / 2;

    return [
      GameplayTutorialCurtain.createRectangle(scene, 0, -span / 2 + topHeight / 2, span, topHeight),
      GameplayTutorialCurtain.createRectangle(scene, 0, holeBottom + bottomHeight / 2, span, bottomHeight),
      GameplayTutorialCurtain.createRectangle(
        scene,
        -span / 2 + sideWidth / 2,
        sideY,
        sideWidth,
        sideHeight
      ),
      GameplayTutorialCurtain.createRectangle(
        scene,
        holeRight + sideWidth / 2,
        sideY,
        sideWidth,
        sideHeight
      )
    ];
  }

  private static createRectangle(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number
  ): Phaser.GameObjects.Rectangle {
    return new Phaser.GameObjects.Rectangle(
      scene,
      x,
      y,
      width,
      height,
      GameplayTutorialCurtain.color,
      GameplayTutorialCurtain.alpha
    ).setInteractive();
  }
}
