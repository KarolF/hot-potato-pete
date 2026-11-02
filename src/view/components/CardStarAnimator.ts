import { CST } from "../../CST";
import { Point } from "../../model/interfaces";
import { CardView } from "./CardView";
import { HandView } from "./HandView";

export class CardStarAnimator {
  public static async play(hand: HandView, cardId: string, duration: number): Promise<void> {
    const cardView = hand.getAnimationCardViews().find((view) => view.cardId === cardId);
    if (!cardView || !cardView.active || !cardView.visible) return;

    const stars = CardStarAnimator.createStars(cardView);
    await Promise.all(
      stars.map((star, index) => CardStarAnimator.tweenStar(hand, star, index, duration))
    );
    stars.forEach((star) => {
      if (star.active) {
        star.destroy();
      }
    });
  }

  private static tweenStar(
    hand: HandView,
    star: Phaser.GameObjects.Graphics,
    index: number,
    duration: number
  ): Promise<void> {
    const angle = -Math.PI / 2 + (index / CST.GAMEPLAY.SHUFFLE_BONUS_STAR_COUNT) * Math.PI * 2;
    const distance = 44 + (index % 3) * 14;
    const startY = -CardView.HEIGHT * 0.2;

    return hand.waitForSkippableTween({
      targets: star,
      x: Math.cos(angle) * distance,
      y: startY + Math.sin(angle) * distance,
      alpha: 0,
      scale: 0.35,
      rotation: angle + Math.PI,
      duration,
      ease: "Cubic.easeOut"
    }, () => star.destroy());
  }

  private static createStars(cardView: CardView): Phaser.GameObjects.Graphics[] {
    const stars: Phaser.GameObjects.Graphics[] = [];
    const startY = -CardView.HEIGHT * 0.2;

    for (let index = 0; index < CST.GAMEPLAY.SHUFFLE_BONUS_STAR_COUNT; index++) {
      const star = CardStarAnimator.createStar(
        cardView.scene,
        0,
        startY,
        CST.GAMEPLAY.SHUFFLE_BONUS_STAR_RADIUS
      );
      star.setScale(0.9);
      cardView.add(star);
      stars.push(star);
    }

    return stars;
  }

  public static createStar(
    scene: Phaser.Scene,
    x: number,
    y: number,
    outerRadius: number
  ): Phaser.GameObjects.Graphics {
    const star = new Phaser.GameObjects.Graphics(scene);
    const innerRadius = outerRadius * 0.48;
    const points: Point[] = [];

    for (let index = 0; index < 10; index++) {
      const radius = index % 2 === 0 ? outerRadius : innerRadius;
      const angle = -Math.PI / 2 + index * (Math.PI / 5);
      points.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      });
    }

    star.setPosition(x, y);
    star.fillStyle(CST.COLORS.GOLD, 1);
    star.lineStyle(1, CST.COLORS.CREAM, 0.95);
    star.beginPath();
    star.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => star.lineTo(point.x, point.y));
    star.closePath();
    star.fillPath();
    star.strokePath();
    return star;
  }
}
