import { CST } from "../../CST";
import { Point } from "../../model/interfaces";

type StarFactory = (x: number, y: number, outerRadius: number) => Phaser.GameObjects.Graphics;

export class MatchAwardParticleAnimator {
  private static readonly baseStarRadius = 7;
  private static readonly baseCoinRadius = 5;
  private static readonly starDelayStepMs = 35;
  private static readonly coinDelayStepMs = 120;
  private static readonly coinDelayOffsetMs = 80;
  private static readonly startSpread = 24;

  public static play(
    parent: Phaser.GameObjects.Container,
    starts: Point[],
    target: Point,
    createStar: StarFactory,
    delayMs: number
  ): void {
    starts.forEach((start, startIndex) => {
      MatchAwardParticleAnimator.createStars(parent, start, startIndex, target, createStar, delayMs);

      const coin = MatchAwardParticleAnimator.createCoin(
        parent.scene,
        start.x + 8,
        start.y + 4,
        MatchAwardParticleAnimator.baseCoinRadius
      );
      parent.add(coin);
      coin.setAlpha(0);
      MatchAwardParticleAnimator.tweenParticle(
        parent,
        coin,
        target,
        delayMs + MatchAwardParticleAnimator.coinDelayOffsetMs + startIndex * MatchAwardParticleAnimator.coinDelayStepMs
      );
    });
  }

  private static createStars(
    parent: Phaser.GameObjects.Container,
    start: Point,
    startIndex: number,
    target: Point,
    createStar: StarFactory,
    delayMs: number
  ): void {
    for (let starIndex = 0; starIndex < CST.GAMEPLAY.MATCH_AWARD_PARTICLE_MULTIPLIER; starIndex++) {
      const globalIndex = startIndex * CST.GAMEPLAY.MATCH_AWARD_PARTICLE_MULTIPLIER + starIndex;
      const angle = (starIndex / CST.GAMEPLAY.MATCH_AWARD_PARTICLE_MULTIPLIER) * Math.PI * 2;
      const spread = starIndex === 0 ? 0 : MatchAwardParticleAnimator.startSpread;
      const star = createStar(
        start.x + Math.cos(angle) * spread,
        start.y + Math.sin(angle) * spread,
        MatchAwardParticleAnimator.baseStarRadius * CST.GAMEPLAY.MATCH_AWARD_PARTICLE_SIZE_MULTIPLIER
      );
      parent.add(star);
      star.setAlpha(0);
      MatchAwardParticleAnimator.tweenParticle(
        parent,
        star,
        target,
        delayMs + globalIndex * MatchAwardParticleAnimator.starDelayStepMs
      );
    }
  }

  private static tweenParticle(
    parent: Phaser.GameObjects.Container,
    particle: Phaser.GameObjects.Graphics,
    target: Point,
    delay: number
  ): void {
    parent.scene.tweens.add({
      targets: particle,
      x: target.x,
      y: target.y,
      alpha: 0,
      scale: 0.45,
      duration: 610,
      delay,
      ease: "Cubic.easeIn",
      onStart: () => particle.setAlpha(1),
      onComplete: () => particle.destroy()
    });
  }

  private static createCoin(
    scene: Phaser.Scene,
    x: number,
    y: number,
    radius: number
  ): Phaser.GameObjects.Graphics {
    const coin = new Phaser.GameObjects.Graphics(scene);
    coin.setPosition(x, y);
    coin.fillStyle(CST.COLORS.GOLD, 1);
    coin.lineStyle(1, CST.COLORS.CREAM, 0.95);
    coin.fillCircle(0, 0, radius);
    coin.strokeCircle(0, 0, radius);
    return coin;
  }
}
