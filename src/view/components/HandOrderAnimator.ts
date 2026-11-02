import { Card, OpponentShuffleStyle } from "../../model/interfaces";
import { HandAnimationTimings } from "./HandAnimationTimings";
import { HandLayoutHelper } from "./HandLayoutHelper";
import { HandOrderPlanner } from "./HandOrderPlanner";
import { HandShufflePoseFactory } from "./HandShufflePoseFactory";
import { HandShuffleSequenceAnimator } from "./HandShuffleSequenceAnimator";
import type { CardView } from "./CardView";
import type { HandView } from "./HandView";

export class HandOrderAnimator {
  private readonly shuffleSequences: HandShuffleSequenceAnimator;

  constructor(private readonly hand: HandView) {
    this.shuffleSequences = new HandShuffleSequenceAnimator(hand);
  }

  public async shuffleCardToIndex(
    fromIndex: number,
    toIndex: number,
    duration: number
  ): Promise<void> {
    const cardViews = this.hand.getAnimationCardViews();
    if (cardViews.length < 2 || fromIndex === toIndex) return;

    const count = cardViews.length;
    const clampedFrom = Phaser.Math.Clamp(fromIndex, 0, count - 1);
    const clampedTo = Phaser.Math.Clamp(toIndex, 0, count - 1);
    const nextCardIds = this.hand.getAnimationCards().map((card) => card.id);
    const [movingCardId] = nextCardIds.splice(clampedFrom, 1);
    nextCardIds.splice(clampedTo, 0, movingCardId);

    await this.animateOrderTo(nextCardIds, duration, [movingCardId]);
  }

  public async animateOrderSequence(
    targetOrders: string[][],
    stepDurationMs: number,
    shuffleStyle: OpponentShuffleStyle = "peeky",
    shuffleSequenceCount: number = 1,
    focusCardId?: string
  ): Promise<void> {
    if (targetOrders.length <= 1) {
      for (const targetOrder of targetOrders) {
        await this.animateOrderTo(targetOrder, stepDurationMs);
      }
      return;
    }

    if (shuffleStyle === "sleeves") {
      await this.shuffleSequences.animateSleevesOrderSequence(
        targetOrders,
        stepDurationMs,
        shuffleSequenceCount
      );
      return;
    }

    if (shuffleStyle === "circle") {
      await this.shuffleSequences.animateCircleOrderSequence(targetOrders, stepDurationMs);
      return;
    }

    await this.shuffleSequences.animateContinuousOrderSequence(
      targetOrders,
      stepDurationMs,
      focusCardId
    );
  }

  public async animateOrderTo(
    targetCardIds: string[],
    duration: number,
    movedCardIds: string[] = []
  ): Promise<void> {
    const cardViews = this.hand.getAnimationCardViews();
    if (cardViews.length < 2 || targetCardIds.length !== cardViews.length) return;

    const token = this.hand.beginAnimationTransition();
    const count = cardViews.length;
    const cards = this.hand.getAnimationCards();
    const currentCardIds = cards.map((card) => card.id);
    if (currentCardIds.every((cardId, index) => cardId === targetCardIds[index])) return;

    const viewById = new Map(cardViews.map((cardView) => [cardView.cardId, cardView]));
    const cardById = new Map(cards.map((card) => [card.id, card]));
    const nextViews: CardView[] = [];
    const nextCards: Card[] = [];

    for (const cardId of targetCardIds) {
      const view = viewById.get(cardId);
      const card = cardById.get(cardId);
      if (!view || !card) return;
      nextViews.push(view);
      nextCards.push(card);
    }

    const changedCardIds =
      movedCardIds.length > 0
        ? movedCardIds
        : HandOrderPlanner.getChangedCardIds(currentCardIds, targetCardIds);
    const movingViews = changedCardIds
      .map((cardId) => viewById.get(cardId))
      .filter((view): view is CardView => Boolean(view));
    if (movingViews.length === 0) return;

    const orientation = this.hand.getAnimationOrientation();
    const nextLayouts = HandLayoutHelper.computeFanLayout(
      orientation,
      count,
      this.hand.getAnimationAvailableWidth()
    );
    const durations = HandAnimationTimings.getOrderMoveDurations(duration);
    this.hand.scene.tweens.killTweensOf(cardViews);

    const liftedYByView = new Map(movingViews.map((card) => [card, card.y - 16]));
    this.hand.startSkippableTween({
      targets: movingViews,
      y: "-=16",
      duration: durations.lift,
      ease: "Sine.easeOut"
    }, () => {
      movingViews.forEach((card) => {
        card.y = liftedYByView.get(card) ?? card.y;
      });
    });
    await this.hand.waitForMs(durations.lift);
    if (!this.hand.isAnimationTransitionCurrent(token)) return;

    const movingViewSet = new Set(movingViews);
    nextViews.forEach((card, index) => {
      const layout = nextLayouts[index];
      const travelYOffset = movingViewSet.has(card)
        ? HandShufflePoseFactory.getShuffleTravelYOffset(card, layout, orientation, -12)
        : 0;
      const targetY = layout.y + travelYOffset;
      this.hand.startSkippableTween({
        targets: card,
        x: layout.x,
        y: targetY,
        scale: layout.scale,
        rotation: layout.rotation,
        duration: durations.move,
        ease: "Sine.easeInOut"
      }, () => {
        card.setPosition(layout.x, targetY);
        card.setScale(layout.scale);
        card.setRotation(layout.rotation);
      });
    });
    await this.hand.waitForMs(durations.move);
    if (!this.hand.isAnimationTransitionCurrent(token)) return;

    movingViews.forEach((card) => {
      const layout = nextLayouts[nextViews.indexOf(card)];
      const targetY = layout?.y ?? card.y;
      this.hand.startSkippableTween({
        targets: card,
        y: targetY,
        duration: durations.settle,
        ease: "Sine.easeIn"
      }, () => {
        card.y = targetY;
      });
    });
    await this.hand.waitForMs(durations.settle);
    if (!this.hand.isAnimationTransitionCurrent(token)) return;

    this.hand.commitOrderAnimation({ views: nextViews, cards: nextCards, layouts: nextLayouts });
  }
}
