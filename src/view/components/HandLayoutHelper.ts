import { CardView } from "./CardView";
import { CardLayout, HandOrientation } from "./HandTypes";

export class HandLayoutHelper {
  private static readonly gameplayCardScaleMultiplier = 1.5;

  public static computeFanLayout(
    orientation: HandOrientation,
    count: number,
    availableWidth: number
  ): CardLayout[] {
    if (count === 0) return [];

    const baseScale = orientation === "opponent" ? 0.86 : 0.94;
    const minScale = orientation === "opponent" ? 0.62 : 0.66;
    const targetStep = orientation === "opponent" ? 43 : 46;
    const rawScale = Phaser.Math.Clamp(
      (availableWidth - CardView.WIDTH * baseScale) / Math.max(1, count - 1) / targetStep,
      minScale,
      baseScale
    );
    const scale = Phaser.Math.Clamp(
      rawScale * HandLayoutHelper.gameplayCardScaleMultiplier,
      minScale * HandLayoutHelper.gameplayCardScaleMultiplier,
      baseScale * HandLayoutHelper.gameplayCardScaleMultiplier
    );
    const displayWidth = CardView.WIDTH * scale;
    const displayHeight = CardView.HEIGHT * scale;
    const step = count === 1 ? 0 : Math.min(targetStep, (availableWidth - displayWidth) / (count - 1));
    const center = (count - 1) / 2;
    const denominator = Math.max(1, center);
    const maxRotation = Phaser.Math.DegToRad(orientation === "opponent" ? 23 : 18);

    return Array.from({ length: count }, (_, index) => {
      const t = (index - center) / denominator;
      const x = (index - center) * step;
      const curve = Math.abs(t);
      const y = orientation === "opponent" ? curve * 28 : (count > 1 ? -14 : 0) + curve * 30;
      const rotation = t * maxRotation;
      const halfBounds = HandLayoutHelper.getRotatedBounds(displayWidth, displayHeight, rotation);

      return {
        x,
        y,
        scale,
        rotation,
        width: displayWidth,
        height: displayHeight,
        left: x - halfBounds.width,
        right: x + halfBounds.width,
        top: y - halfBounds.height,
        bottom: y + halfBounds.height
      };
    });
  }

  private static getRotatedBounds(
    width: number,
    height: number,
    rotation: number
  ): { width: number; height: number } {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const cos = Math.abs(Math.cos(rotation));
    const sin = Math.abs(Math.sin(rotation));

    return {
      width: halfWidth * cos + halfHeight * sin,
      height: halfWidth * sin + halfHeight * cos
    };
  }
}
