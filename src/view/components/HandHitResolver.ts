import { Point } from "../../model/interfaces";
import type { CardHit, CardScanTarget } from "./HandTypes";
import type { HandView } from "./HandView";

export class HandHitResolver {
  constructor(private readonly hand: HandView) {}

  public getCardHitCenters(): { x: number; y: number }[] {
    return this.hand.getAnimationLayouts().map((layout) => ({
      x: this.hand.x + layout.x,
      y: this.hand.y + layout.y
    }));
  }

  public getCardScanTargets(): CardScanTarget[] {
    const layouts = this.hand.getAnimationLayouts();

    return this.hand
      .getAnimationCards()
      .map((card, index) => {
        const layout = layouts[index];
        if (!layout) return null;

        return {
          cardId: card.id,
          x: this.hand.x + layout.x,
          y: this.hand.y + layout.y
        };
      })
      .filter((target): target is CardScanTarget => Boolean(target));
  }

  public getCardHitRects(): { left: number; right: number; top: number; bottom: number }[] {
    return this.hand.getAnimationLayouts().map((layout) => ({
      left: this.hand.x + layout.left,
      right: this.hand.x + layout.right,
      top: this.hand.y + layout.top,
      bottom: this.hand.y + layout.bottom
    }));
  }

  public getCardHitPoints(index: number, localPoints: Point[]): Point[] {
    const cardView = this.hand.getAnimationCardViews()[index];
    if (!cardView) return [];

    return localPoints.map((localPoint) => {
      const parentPoint = cardView.getHitPointInParent(localPoint);

      return {
        x: this.hand.x + parentPoint.x,
        y: this.hand.y + parentPoint.y
      };
    });
  }

  public getCardIndexAt(localX: number, localY: number): number {
    return this.getCardAt(localX, localY)?.index ?? -1;
  }

  public getCardAt(localX: number, localY: number): CardHit | null {
    const cardViews = this.hand.getAnimationCardViews();

    for (let index = cardViews.length - 1; index >= 0; index--) {
      const cardView = cardViews[index];
      if (cardView.containsParentPoint(localX, localY)) {
        return {
          index,
          cardId: cardView.cardId
        };
      }
    }

    return null;
  }
}
