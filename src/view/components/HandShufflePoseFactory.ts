import { CardView } from "./CardView";
import { CardLayout, CardTweenPose, HandOrientation } from "./HandTypes";

export class HandShufflePoseFactory {
  public static createCirclePoses(
    views: CardView[],
    orientation: HandOrientation,
    rotationOffset: number
  ): CardTweenPose[] {
    const radius = 86;
    const centerY = orientation === "opponent" ? -96 : 0;
    const count = views.length;

    return views.map((view, index) => {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / count + rotationOffset;
      return {
        x: Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        scale: view.scale,
        rotation: 0
      };
    });
  }

  public static createSleevesSpreadPoses(
    views: CardView[],
    orientation: HandOrientation,
    yOffsetByView: Map<CardView, number> = new Map()
  ): CardTweenPose[] {
    const count = views.length;
    if (count === 0) return [];

    const spreadScale = Math.min(
      Math.max(...views.map((view) => view.scaleX)),
      orientation === "opponent" ? 0.98 : 1.08
    );
    const stepX = CardView.WIDTH * spreadScale + 14;
    const stepY = CardView.HEIGHT * spreadScale + 16;
    const columns = Math.max(1, Math.min(count, Math.floor(600 / stepX)));
    const rows = Math.ceil(count / columns);
    const centerY = orientation === "opponent" ? 40 : 0;

    return views.map((view, index) => {
      const row = Math.floor(index / columns);
      const column = index % columns;
      const columnsInRow = Math.min(columns, count - row * columns);

      return {
        x: (column - (columnsInRow - 1) / 2) * stepX,
        y: centerY + (row - (rows - 1) / 2) * stepY + (yOffsetByView.get(view) ?? 0),
        scale: spreadScale,
        rotation: 0
      };
    });
  }

  public static getShuffleTravelYOffset(
    view: CardView,
    layout: CardLayout,
    orientation: HandOrientation,
    baseOffset: number
  ): number {
    if (baseOffset >= 0) return baseOffset;
    if (orientation === "opponent" && layout.x > view.x + 2) {
      return baseOffset - 24;
    }
    return baseOffset;
  }
}
