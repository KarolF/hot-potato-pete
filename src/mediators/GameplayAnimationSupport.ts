import { CST } from "../CST";
import { Card, DrawResult, GameSnapshot, PairDiscard } from "../model/interfaces";
import { CardStarAnimator } from "../view/components/CardStarAnimator";
import { CardView } from "../view/components/CardView";
import type { GameplayScreen } from "../view/scenes/GameplayScreen";
import { SoundPlayer } from "../view/SoundPlayer";
import { CardPose, CardTransferAnimator } from "./CardTransferAnimator";

export class GameplayAnimationSupport {
  constructor(
    private readonly screen: GameplayScreen,
    private readonly transferAnimator: CardTransferAnimator
  ) {}

  public async animatePairToTable(
    pair: PairDiscard,
    drawnCardView: CardView
  ): Promise<void> {
    const otherCard = pair.cards.find((card) => card.id !== drawnCardView.cardId);
    if (!otherCard) {
      drawnCardView.destroy();
      return;
    }

    const ownerHand = pair.owner === "player" ? this.screen.playerHand : this.screen.botHand;
    const otherPose = ownerHand.getCardPoseById(otherCard.id);
    if (!otherPose) {
      drawnCardView.destroy();
      return;
    }

    ownerHand.setCardVisibleById(otherCard.id, false);
    const otherCardView = this.transferAnimator.create(otherCard, true, otherPose);
    drawnCardView.setFaceUp(true);

    this.transferAnimator.playMoveSound();
    await Promise.all([
      this.transferAnimator.tween(drawnCardView, {
        x: -28,
        y: 92,
        scale: 0.58,
        rotation: Phaser.Math.DegToRad(-8),
        duration: 360
      }),
      this.transferAnimator.tween(otherCardView, {
        x: 28,
        y: 92,
        scale: 0.58,
        rotation: Phaser.Math.DegToRad(8),
        duration: 360
      })
    ]);

    this.screen.discardPile.setCount(this.screen.getCurrentSnapshot()?.discardPile.length ?? 0);
    SoundPlayer.getInstance().play(CST.AUDIO.SND_PAIR_MATCH);

    await this.transferAnimator.waitForTween({
      targets: [drawnCardView, otherCardView],
      alpha: 0,
      scale: 0.35,
      duration: 220,
      ease: "Sine.easeIn"
    }, () => {
      [drawnCardView, otherCardView].forEach((cardView) => {
        cardView.setAlpha(0);
        cardView.setScale(0.35);
      });
    });

    drawnCardView.destroy();
    otherCardView.destroy();
  }

  public async shuffleOpponentAfterReceive(
    result: DrawResult,
    transferCard?: CardView
  ): Promise<void> {
    const shuffle = result.shuffle;
    if (!shuffle || shuffle.owner !== "bot" || result.gameOver) {
      await this.settleSnapshot(result.snapshot, 260, [result.drawnCard.id]);
      transferCard?.destroy();
      return;
    }

    const beforeBotHand = this.orderCardsByIds(result.snapshot.players.bot.hand, shuffle.beforeCardIds);
    if (!beforeBotHand) {
      await this.settleSnapshot(result.snapshot, 260, [result.drawnCard.id]);
      transferCard?.destroy();
      return;
    }

    this.screen.setCurrentSnapshot(result.snapshot);
    this.screen.discardPile.setCount(result.snapshot.discardPile.length);
    this.screen.turnBanner.setText(result.snapshot.lastEvent);

    await Promise.all([
      this.screen.playerHand.transitionTo(result.snapshot.players.player.hand, {
        faceUp: true,
        selectable: false,
        availableWidth: 540
      }, 220),
      this.screen.botHand.transitionTo(beforeBotHand, {
        faceUp: false,
        selectable: false,
        availableWidth: 520
      }, 220, { instantCardIds: [result.drawnCard.id] })
    ]);
    transferCard?.destroy();
    if (shuffle.bonusCardId) {
      await CardStarAnimator.play(
        this.screen.botHand,
        shuffle.bonusCardId,
        CST.GAMEPLAY.SHUFFLE_BONUS_STAR_DURATION_MS
      );
    }
    await this.screen.botHand.animateOrderSequence(
      shuffle.steps,
      shuffle.stepDurationMs,
      shuffle.shuffleStyle,
      shuffle.shuffleSequenceCount,
      shuffle.focusCardId
    );
    this.screen.updatePeterScan(result.snapshot);
    this.screen.refreshInput();
  }

  public getBotReceivePose(result: DrawResult): CardPose {
    const shuffle = result.shuffle;
    const targetCards =
      shuffle && shuffle.owner === "bot"
        ? this.orderCardsByIds(result.snapshot.players.bot.hand, shuffle.beforeCardIds)
        : result.snapshot.players.bot.hand;

    return (
      (targetCards &&
        this.screen.botHand.getCardPoseForCards(targetCards, result.drawnCard.id, 520)) ??
      this.screen.botHand.getIncomingPose()
    );
  }

  public orderCardsByIds(cards: Card[], cardIds: string[]): Card[] | null {
    const cardsById = new Map(cards.map((card) => [card.id, card]));
    const orderedCards: Card[] = [];

    for (const cardId of cardIds) {
      const card = cardsById.get(cardId);
      if (!card) return null;
      orderedCards.push(card);
    }

    return orderedCards;
  }

  public getDrawnCardPair(result: DrawResult): PairDiscard | undefined {
    return result.removedPairs.find((pair) =>
      pair.cards.some((card) => card.id === result.drawnCard.id)
    );
  }

  public async settleSnapshot(
    snapshot: GameSnapshot,
    duration: number = 260,
    instantBotCardIds: string[] = []
  ): Promise<void> {
    this.screen.setCurrentSnapshot(snapshot);
    this.screen.discardPile.setCount(snapshot.discardPile.length);
    this.screen.turnBanner.setText(snapshot.lastEvent);

    await Promise.all([
      this.screen.botHand.transitionTo(snapshot.players.bot.hand, {
        faceUp: snapshot.phase === CST.GAME_PHASE.GAME_OVER,
        selectable: false,
        availableWidth: 520
      }, duration, { instantCardIds: instantBotCardIds }),
      this.screen.playerHand.transitionTo(snapshot.players.player.hand, {
        faceUp: true,
        selectable: false,
        availableWidth: 540
      }, duration)
    ]);
    this.screen.updatePeterScan(snapshot);
  }
}
