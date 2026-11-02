import { CST } from "../../CST";
import { Point } from "../../model/interfaces";

export class OpponentSunglassesView extends Phaser.GameObjects.Image {
  private static readonly sourceWidth = 401;
  private static readonly sourceHeight = 134;
  private static readonly widthPerEyeDistance = 1.9;
  private static readonly minWidth = 134;
  private static readonly maxWidth = 168;
  private static readonly yOffset = -2;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, CST.ASSETS.SUNGLASSES);
    this.setOrigin(0.5);
    this.setVisible(false);
  }

  public layout(leftEye: Point, rightEye: Point): void {
    const centerX = (leftEye.x + rightEye.x) / 2;
    const centerY = (leftEye.y + rightEye.y) / 2 + OpponentSunglassesView.yOffset;
    const eyeDistance = Phaser.Math.Distance.Between(leftEye.x, leftEye.y, rightEye.x, rightEye.y);
    const width = Phaser.Math.Clamp(
      eyeDistance * OpponentSunglassesView.widthPerEyeDistance,
      OpponentSunglassesView.minWidth,
      OpponentSunglassesView.maxWidth
    );

    this.setPosition(centerX, centerY);
    this.setDisplaySize(
      width,
      width * (OpponentSunglassesView.sourceHeight / OpponentSunglassesView.sourceWidth)
    );
  }
}
