import { CST } from "../../CST";
import { OpponentModel } from "../../model/OpponentModel";
import { Point } from "../../model/interfaces";
import { MatchAwardParticleAnimator } from "./MatchAwardParticleAnimator";
import { MatchProgressSlot, MatchProgressState } from "./MatchProgressPlan";

interface IndicatorView {
  slotNumber: number;
  opponentMatchNumber: number;
  container: Phaser.GameObjects.Container;
  ring: Phaser.GameObjects.Graphics;
  stars: Phaser.GameObjects.Graphics[];
}

export class MatchProgressBar extends Phaser.GameObjects.Container {
  private static readonly slotXs = [-168, 0, 168];
  private static readonly slotGap = 168;
  private static readonly opponentY = 50;
  private static readonly playerY = -47;
  private static readonly starY = 112;
  private static readonly dimmedAlpha = 0.36;
  private static readonly advanceDelayMs = 170;
  private static readonly advanceDurationMs = 560;

  private readonly indicators: IndicatorView[] = [];
  private readonly playerIndicator: Phaser.GameObjects.Image;
  private progressState: MatchProgressState;

  constructor(scene: Phaser.Scene, x: number, y: number, state: MatchProgressState) {
    super(scene, x, y);
    this.progressState = state;

    const bar = new Phaser.GameObjects.Image(scene, 0, 2, CST.ASSETS.PROGRESS_BAR);
    bar.setDisplaySize(390, 12);
    this.add(bar);

    this.playerIndicator = new Phaser.GameObjects.Image(
      scene,
      0,
      MatchProgressBar.playerY,
      CST.ASSETS.PLAYER_PROGRESS_BAR
    );
    this.playerIndicator.setDisplaySize(48, 71);
    this.add(this.playerIndicator);

    this.render();
  }

  public setProgress(state: MatchProgressState): void {
    this.progressState = state;
    this.render();
  }

  public playWinAdvance(
    defeatedMatchNumber: number,
    nextMatchNumber: number,
    scoreTarget: Point
  ): void {
    this.createEnteringIndicator(nextMatchNumber + 1);
    this.fadeDefeatedOpponent(defeatedMatchNumber);
    MatchAwardParticleAnimator.play(
      this,
      this.getParticleStarts(defeatedMatchNumber),
      {
        x: scoreTarget.x - this.x,
        y: scoreTarget.y - this.y
      },
      (x, y, outerRadius) => this.createStar(x, y, outerRadius),
      0
    );
    this.animateOpponentsLeft(defeatedMatchNumber);

    const nextState = {
      ...this.progressState,
      defeatedThroughMatchNumber: defeatedMatchNumber,
      groupMatchNumber: nextMatchNumber,
      highlightedMatchNumber: nextMatchNumber,
      playerMatchNumber: nextMatchNumber
    };
    this.progressState = nextState;

    this.scene.time.delayedCall(MatchProgressBar.advanceDelayMs + MatchProgressBar.advanceDurationMs + 40, () => {
      if (!this.scene || !this.active) return;
      this.setProgress(nextState);
    });
  }

  private createIndicator(slot: MatchProgressSlot, x: number, alpha: number): IndicatorView {
    const container = new Phaser.GameObjects.Container(this.scene, x, 0);
    const image = new Phaser.GameObjects.Image(
      this.scene,
      0,
      MatchProgressBar.opponentY,
      CST.ASSETS.OPPONENT_PROGRESS_BAR[
        (slot.opponentMatchNumber - 1) % CST.ASSETS.OPPONENT_PROGRESS_BAR.length
      ]
    );
    image.setDisplaySize(62, 70);
    image.setScale(image.scaleX, Math.abs(image.scaleY));

    const ring = new Phaser.GameObjects.Graphics(this.scene);
    ring.setPosition(0, MatchProgressBar.opponentY);
    const stars = this.createDifficultyStars(slot.opponentMatchNumber);

    container.setAlpha(alpha);
    container.add([ring, image, ...stars]);
    this.add(container);
    return {
      slotNumber: slot.slotNumber,
      opponentMatchNumber: slot.opponentMatchNumber,
      container,
      ring,
      stars
    };
  }

  private render(): void {
    const centerMatchNumber = this.getCenterMatchNumber();
    this.clearIndicators();

    MatchProgressBar.slotXs.forEach((slotX, index) => {
      const matchNumber = centerMatchNumber + index - 1;
      if (matchNumber < 1) return;
      const slot = this.getSlot(matchNumber);

      const indicator = this.createIndicator(
        slot,
        slotX,
        this.getIndicatorAlpha(matchNumber)
      );
      this.renderRing(indicator, slot.slotNumber === this.progressState.highlightedMatchNumber);
      this.indicators.push(indicator);
    });

    this.playerIndicator.setPosition(0, MatchProgressBar.playerY);
    this.playerIndicator.setAlpha(1);
  }

  private renderRing(indicator: IndicatorView, highlighted: boolean): void {
    indicator.ring.clear();
    if (!highlighted) return;

    indicator.ring.lineStyle(3, CST.COLORS.GOLD, 0.92);
    indicator.ring.strokeCircle(0, 0, 39);
  }

  private createDifficultyStars(matchNumber: number): Phaser.GameObjects.Graphics[] {
    const count = CST.GAMEPLAY.DIFFICULTY_STARS[OpponentModel.getForMatch(matchNumber).difficulty];
    const startX = -((count - 1) * 14) / 2;
    const stars: Phaser.GameObjects.Graphics[] = [];

    for (let index = 0; index < count; index++) {
      const star = this.createStar(startX + index * 14, MatchProgressBar.starY, 6);
      stars.push(star);
    }
    return stars;
  }

  private fadeDefeatedOpponent(matchNumber: number): void {
    const indicator = this.indicators.find((item) => item.slotNumber === matchNumber);
    if (!indicator) return;

    indicator.ring.clear();
    this.scene.tweens.add({
      targets: indicator.container,
      alpha: MatchProgressBar.dimmedAlpha,
      duration: 220,
      ease: "Sine.easeOut"
    });
  }

  private createEnteringIndicator(matchNumber: number): void {
    const rightSlotX = MatchProgressBar.slotXs[MatchProgressBar.slotXs.length - 1];
    const indicator = this.createIndicator(
      this.getSlot(matchNumber),
      rightSlotX + MatchProgressBar.slotGap,
      0
    );
    this.renderRing(indicator, false);
    this.indicators.push(indicator);
  }

  private animateOpponentsLeft(defeatedThroughMatchNumber: number): void {
    const leftSlotX = MatchProgressBar.slotXs[0];

    this.indicators.forEach((indicator) => {
      const targetX = indicator.container.x - MatchProgressBar.slotGap;
      const isExiting = targetX < leftSlotX;
      this.scene.tweens.add({
        targets: indicator.container,
        x: targetX,
        alpha: isExiting ? 0 : this.getIndicatorAlpha(indicator.slotNumber, defeatedThroughMatchNumber),
        duration: MatchProgressBar.advanceDurationMs,
        delay: MatchProgressBar.advanceDelayMs,
        ease: "Cubic.easeInOut",
        onComplete: () => {
          if (isExiting) {
            this.removeIndicator(indicator);
          }
        }
      });
    });
  }

  private getParticleStarts(matchNumber: number): Point[] {
    const indicator = this.indicators.find((item) => item.slotNumber === matchNumber);
    if (!indicator) return [];

    return indicator.stars.map((star) => ({
      x: indicator.container.x + star.x,
      y: indicator.container.y + star.y
    }));
  }

  private createStar(x: number, y: number, outerRadius: number): Phaser.GameObjects.Graphics {
    const star = new Phaser.GameObjects.Graphics(this.scene);
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
    star.lineStyle(1, 0xfff2d5, 0.95);
    star.beginPath();
    star.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => star.lineTo(point.x, point.y));
    star.closePath();
    star.fillPath();
    star.strokePath();
    return star;
  }

  private getCenterMatchNumber(): number {
    return Math.max(1, Math.floor(this.progressState.playerMatchNumber || this.progressState.groupMatchNumber));
  }

  private getSlot(matchNumber: number): MatchProgressSlot {
    return this.progressState.slots?.find((slot) => slot.slotNumber === matchNumber) ?? {
      slotNumber: matchNumber,
      opponentMatchNumber: matchNumber
    };
  }

  private getIndicatorAlpha(
    matchNumber: number,
    defeatedThroughMatchNumber = this.progressState.defeatedThroughMatchNumber
  ): number {
    return matchNumber <= defeatedThroughMatchNumber ? MatchProgressBar.dimmedAlpha : 1;
  }

  private clearIndicators(): void {
    this.indicators.forEach((indicator) => indicator.container.destroy());
    this.indicators.length = 0;
  }

  private removeIndicator(indicator: IndicatorView): void {
    const index = this.indicators.indexOf(indicator);
    if (index >= 0) {
      this.indicators.splice(index, 1);
    }
    indicator.container.destroy();
  }
}
