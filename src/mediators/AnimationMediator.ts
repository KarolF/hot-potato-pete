import { CST } from "../CST";
import {
  DrawResult,
  GameSnapshot,
  HandShuffle,
  PairDiscard,
  Point
} from "../model/interfaces";
import { AnimationSkipController } from "../utils/AnimationSkipController";
import { CardStarAnimator } from "../view/components/CardStarAnimator";
import { CardView } from "../view/components/CardView";
import { SoundPlayer } from "../view/SoundPlayer";
import type { GameplayScreen } from "../view/scenes/GameplayScreen";
import { CardTransferAnimator } from "./CardTransferAnimator";
import { ConfettiAnimator } from "./ConfettiAnimator";
import { GameplayAnimationSupport } from "./GameplayAnimationSupport";

export class AnimationMediator {
  private readonly transferAnimator: CardTransferAnimator;
  private readonly confettiAnimator: ConfettiAnimator;
  private readonly support: GameplayAnimationSupport;
  private destroyed = false;
  private readonly skipController = new AnimationSkipController();

  constructor(private readonly screen: GameplayScreen) {
    this.screen.playerHand.setAnimationSkipController(this.skipController);
    this.screen.botHand.setAnimationSkipController(this.skipController);
    this.screen.peterFace.setAnimationSkipController(this.skipController);
    this.transferAnimator = new CardTransferAnimator(screen, this.skipController);
    this.confettiAnimator = new ConfettiAnimator(screen);
    this.support = new GameplayAnimationSupport(screen, this.transferAnimator);
    screen.events.once("shutdown", () => this.destroy());
  }

  public async animatePlayerHandShuffle(
    snapshot: GameSnapshot,
    shuffle: HandShuffle,
    onComplete: () => void
  ): Promise<void> {
    this.beginAnimation();
    this.screen.botHand.setSelectable(false);
    this.screen.playerHand.setSelectable(false);

    const beforePlayerHand = this.support.orderCardsByIds(
      snapshot.players.player.hand,
      shuffle.beforeCardIds
    );
    if (!beforePlayerHand) {
      await this.support.settleSnapshot(snapshot);
      this.finishAnimation(snapshot, onComplete);
      return;
    }

    this.screen.setCurrentSnapshot(snapshot);
    this.screen.discardPile.setCount(snapshot.discardPile.length);
    this.screen.turnBanner.setText(snapshot.lastEvent);
    await this.screen.playerHand.transitionTo(beforePlayerHand, {
      faceUp: true,
      selectable: false,
      availableWidth: 540
    }, 90);
    this.transferAnimator.playMoveSound();
    await this.screen.playerHand.animateOrderSequence(
      shuffle.steps,
      shuffle.stepDurationMs,
      shuffle.shuffleStyle,
      shuffle.shuffleSequenceCount,
      shuffle.focusCardId
    );

    this.finishAnimation(snapshot, onComplete);
  }

  public async animatePlayerDraw(
    result: DrawResult,
    sourceIndex: number,
    onComplete: () => void
  ): Promise<void> {
    this.beginAnimation(result.snapshot);
    const sourcePose = this.screen.botHand.getCardPose(sourceIndex) ?? {
      x: 0,
      y: -265,
      scale: 0.86,
      rotation: 0
    };
    const targetPose = this.screen.playerHand.getIncomingPose();
    this.screen.botHand.setCardVisible(sourceIndex, false);
    const card = this.transferAnimator.create(result.drawnCard, false, sourcePose);
    this.transferAnimator.playMoveSound();
    await this.transferAnimator.tween(card, {
      x: targetPose.x,
      y: targetPose.y - 18,
      scale: targetPose.scale * 1.08,
      rotation: targetPose.rotation,
      duration: 420
    });
    if (result.drawnCard.isHotPotatoPete) {
      SoundPlayer.getInstance().play(CST.AUDIO.SND_HOT_POTATO_PETE);
    }
    await this.transferAnimator.flip(card, true);
    if (result.bonusScore) {
      await this.animateBonusScoreStars(card);
    }

    if (result.drawnCard.isHotPotatoPete) {
      await this.screen.peterFace.playHappy();
    }

    const pair = this.support.getDrawnCardPair(result);
    if (pair) {
      await this.animatePairToTable(pair, card);
    } else {
      await this.support.settleSnapshot(result.snapshot);
      card.destroy();
    }

    if (pair) {
      await this.support.settleSnapshot(result.snapshot);
    }

    this.finishAnimation(result.snapshot, onComplete);
  }

  public async animateBotDraw(
    result: DrawResult,
    sourceIndex: number,
    onComplete: () => void
  ): Promise<void> {
    this.beginAnimation(result.snapshot);
    const sourcePose = this.screen.playerHand.getCardPose(sourceIndex) ?? {
      x: 0,
      y: 275,
      scale: 0.92,
      rotation: 0
    };
    const pair = this.support.getDrawnCardPair(result);
    const targetPose = pair
      ? this.screen.botHand.getIncomingPose()
      : this.support.getBotReceivePose(result);
    this.screen.playerHand.setCardVisible(sourceIndex, false);
    const card = this.transferAnimator.create(result.drawnCard, true, sourcePose);
    this.transferAnimator.playMoveSound();
    await this.transferAnimator.tween(card, {
      x: (sourcePose.x + targetPose.x) / 2,
      y: Math.min(sourcePose.y, targetPose.y) - 52,
      scale: sourcePose.scale * 1.05,
      rotation: 0,
      duration: 260
    });
    await this.transferAnimator.flip(card, false);
    await this.transferAnimator.tween(card, {
      x: targetPose.x,
      y: targetPose.y,
      scale: targetPose.scale,
      rotation: targetPose.rotation,
      duration: 300
    });
    if (result.drawnCard.isHotPotatoPete) {
      SoundPlayer.getInstance().play(CST.AUDIO.SND_HOT_POTATO_PETE);
      await this.screen.peterFace.playAngry();
    }

    if (pair) {
      await this.transferAnimator.flip(card, true);
      await this.animatePairToTable(pair, card);
      await this.support.shuffleOpponentAfterReceive(result);
    } else {
      await this.support.shuffleOpponentAfterReceive(result, card);
    }

    this.finishAnimation(result.snapshot, onComplete);
  }

  public destroy(): void {
    this.destroyed = true;
    this.skipController.destroy();
  }

  public playMatchWinConfetti(): void {
    this.confettiAnimator.playMatchWinConfetti();
  }

  public canSkipCurrentAnimation(): boolean {
    return this.skipController.canSkipCurrentAnimation();
  }

  public skipCurrentAnimation(): boolean {
    return this.skipController.requestSkip();
  }

  public async animatePairToTable(
    pair: PairDiscard,
    drawnCardView: CardView
  ): Promise<void> {
    await this.support.animatePairToTable(pair, drawnCardView);
  }

  private async animateBonusScoreStars(card: CardView): Promise<void> {
    const source = {
      x: card.x,
      y: card.y - 24 * card.scaleY
    };
    const target = this.screen.getScoreHudStarTarget();
    const stars = this.createBonusScoreStars(source);

    await Promise.all(
      stars.map((star, index) => {
        const delay = index * CST.GAMEPLAY.SHUFFLE_BONUS_SCORE_STAR_DELAY_MS;
        return this.transferAnimator.waitForTween({
          targets: star,
          x: target.x,
          y: target.y,
          alpha: 0,
          scale: 0.3,
          rotation: Math.PI * 2,
          duration: CST.GAMEPLAY.SHUFFLE_BONUS_SCORE_STAR_DURATION_MS,
          delay,
          ease: "Cubic.easeIn"
        }, () => star.destroy());
      })
    );
    stars.forEach((star) => {
      if (star.active) {
        star.destroy();
      }
    });
  }

  private createBonusScoreStars(source: Point): Phaser.GameObjects.Graphics[] {
    const stars: Phaser.GameObjects.Graphics[] = [];

    for (let index = 0; index < CST.GAMEPLAY.SHUFFLE_BONUS_STAR_COUNT; index++) {
      const angle = -Math.PI / 2 + (index / CST.GAMEPLAY.SHUFFLE_BONUS_STAR_COUNT) * Math.PI * 2;
      const spread = CST.GAMEPLAY.SHUFFLE_BONUS_SCORE_STAR_SPREAD;
      const star = CardStarAnimator.createStar(
        this.screen,
        source.x + Math.cos(angle) * spread,
        source.y + Math.sin(angle) * spread,
        CST.GAMEPLAY.SHUFFLE_BONUS_STAR_RADIUS
      );
      this.screen.m_layer_cover22Top.add(star);
      stars.push(star);
    }

    return stars;
  }

  private beginAnimation(snapshot?: GameSnapshot): void {
    this.skipController.clear();
    this.screen.setWaitingForAnimation(true);
    this.screen.peterFace.stopScanning();
    this.screen.clearCardHover();
    this.screen.game.canvas.style.cursor = "default";
    if (snapshot) {
      this.screen.setCurrentSnapshot(snapshot);
    }
  }

  private finishAnimation(snapshot: GameSnapshot, onComplete: () => void): void {
    if (this.destroyed) return;
    this.skipController.clear();
    this.screen.setWaitingForAnimation(false);
    this.screen.updatePeterScan(snapshot);
    this.screen.refreshInput();
    onComplete();
  }

}
