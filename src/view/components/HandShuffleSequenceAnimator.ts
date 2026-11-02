import { CST } from "../../CST";
import { SoundPlayer } from "../SoundPlayer";
import { CardView } from "./CardView";
import { HandAnimationTimings } from "./HandAnimationTimings";
import { HandLayoutHelper } from "./HandLayoutHelper";
import { HandOrderPlanner } from "./HandOrderPlanner";
import { HandShufflePoseFactory } from "./HandShufflePoseFactory";
import { PeekyShuffleSequenceAnimator } from "./PeekyShuffleSequenceAnimator";
import type { CardLayout, CardTweenPose, OrderAnimationStep } from "./HandTypes";
import type { HandView } from "./HandView";

export class HandShuffleSequenceAnimator {
  private static readonly defaultTravelYOffset = -12;

  constructor(private readonly hand: HandView) {}

  public async animateContinuousOrderSequence(
    targetOrders: string[][],
    stepDurationMs: number,
    focusCardId?: string
  ): Promise<void> {
    const cardViews = this.hand.getAnimationCardViews();
    if (cardViews.length < 2) return;

    if (this.hand.getAnimationOrientation() === "opponent") {
      await new PeekyShuffleSequenceAnimator(this.hand).animateOrderSequence(
        targetOrders,
        stepDurationMs,
        focusCardId
      );
      return;
    }

    const token = this.hand.beginAnimationTransition();
    const layouts = this.getFanLayouts(cardViews);
    const steps = HandOrderPlanner.buildOrderAnimationSteps(
      targetOrders,
      cardViews,
      this.hand.getAnimationCards(),
      layouts
    );
    if (!steps || steps.length === 0) return;

    const durations = HandAnimationTimings.getOrderMoveDurations(stepDurationMs);
    this.hand.scene.tweens.killTweensOf(cardViews);

    const liftedYByView = new Map(cardViews.map((card) => [card, card.y - 16]));
    this.hand.startSkippableTween({
      targets: cardViews,
      y: "-=16",
      duration: durations.lift,
      ease: "Sine.easeOut"
    }, () => {
      cardViews.forEach((card) => {
        card.y = liftedYByView.get(card) ?? card.y;
      });
    });
    await this.hand.waitForMs(durations.lift);
    if (!this.hand.isAnimationTransitionCurrent(token)) return;

    let previousCardIds = this.hand.getAnimationCards().map((card) => card.id);
    for (const step of steps) {
      const movingViews = this.getChangedStepViews(previousCardIds, step);
      this.playOpponentShuffleMoveSound();
      this.animateOrderStep(
        step,
        durations.move,
        HandShuffleSequenceAnimator.defaultTravelYOffset,
        "Linear",
        movingViews
      );
      await this.hand.waitForMs(durations.move);
      if (!this.hand.isAnimationTransitionCurrent(token)) return;
      this.hand.removeAll(false);
      this.hand.add(step.views);
      previousCardIds = step.cards.map((card) => card.id);
    }

    const finalStep = steps[steps.length - 1];
    this.animateOrderStep(finalStep, durations.settle, 0, "Sine.easeIn");
    await this.hand.waitForMs(durations.settle);
    if (!this.hand.isAnimationTransitionCurrent(token)) return;

    this.hand.commitOrderAnimation(finalStep);
  }

  public async animateSleevesOrderSequence(
    targetOrders: string[][],
    stepDurationMs: number,
    shuffleSequenceCount: number
  ): Promise<void> {
    const cardViews = this.hand.getAnimationCardViews();
    if (cardViews.length < 2) return;

    const token = this.hand.beginAnimationTransition();
    const orientation = this.hand.getAnimationOrientation();
    const layouts = this.getFanLayouts(cardViews);
    const steps = HandOrderPlanner.buildSleevesAnimationSteps(
      targetOrders,
      shuffleSequenceCount,
      cardViews,
      this.hand.getAnimationCards(),
      layouts
    );
    if (!steps || steps.length === 0) return;

    const durations = HandAnimationTimings.getSleevesSequenceDurations(
      stepDurationMs,
      targetOrders.length,
      cardViews.length
    );
    let visibleViews = cardViews.slice();
    this.hand.scene.tweens.killTweensOf(cardViews);

    for (const step of steps) {
      const spreadPoses = HandShufflePoseFactory.createSleevesSpreadPoses(visibleViews, orientation);
      this.playOpponentShuffleMoveSound();
      await this.tweenViewsToPoses(visibleViews, spreadPoses, durations.spreadOut, "Sine.easeInOut");
      if (!this.hand.isAnimationTransitionCurrent(token)) return;

      this.hand.removeAll(false);
      this.hand.add(step.views);
      this.playOpponentShuffleMoveSound();
      await this.tweenViewsToPoses(
        step.views,
        step.layouts,
        durations.spread,
        "Sine.easeInOut"
      );
      if (!this.hand.isAnimationTransitionCurrent(token)) return;

      visibleViews = step.views;
    }

    this.hand.commitOrderAnimation(steps[steps.length - 1]);
  }

  public async animateCircleOrderSequence(
    targetOrders: string[][],
    stepDurationMs: number
  ): Promise<void> {
    const cardViews = this.hand.getAnimationCardViews();
    if (cardViews.length < 2) return;

    const token = this.hand.beginAnimationTransition();
    const orientation = this.hand.getAnimationOrientation();
    const layouts = this.getFanLayouts(cardViews);
    const finalStep = HandOrderPlanner.buildFinalOrderAnimationStep(
      targetOrders,
      cardViews,
      this.hand.getAnimationCards(),
      layouts
    );
    if (!finalStep) return;

    const durations = HandAnimationTimings.getCircleSequenceDurations(stepDurationMs);
    this.hand.scene.tweens.killTweensOf(cardViews);

    this.playOpponentShuffleMoveSound();
    await this.tweenViewsToPoses(
      cardViews,
      HandShufflePoseFactory.createCirclePoses(cardViews, orientation, 0),
      durations.enter,
      "Sine.easeInOut"
    );
    if (!this.hand.isAnimationTransitionCurrent(token)) return;

    await this.rotateViewsAroundCircle(cardViews, durations.rotate, token);
    if (!this.hand.isAnimationTransitionCurrent(token)) return;

    this.hand.removeAll(false);
    this.hand.add(finalStep.views);
    this.playOpponentShuffleMoveSound();
    await this.tweenViewsToPoses(
      finalStep.views,
      finalStep.layouts,
      durations.spread,
      "Sine.easeInOut"
    );
    if (!this.hand.isAnimationTransitionCurrent(token)) return;

    this.hand.commitOrderAnimation(finalStep);
  }

  private getFanLayouts(cardViews: CardView[]): CardLayout[] {
    return HandLayoutHelper.computeFanLayout(
      this.hand.getAnimationOrientation(),
      cardViews.length,
      this.hand.getAnimationAvailableWidth()
    );
  }

  private animateOrderStep(
    step: OrderAnimationStep,
    duration: number,
    yOffset: number,
    ease: string = "Linear",
    movingViews: Set<CardView> = new Set(step.views)
  ): void {
    const orientation = this.hand.getAnimationOrientation();

    step.views.forEach((card, index) => {
      const layout = step.layouts[index];
      const travelYOffset = movingViews.has(card)
        ? HandShufflePoseFactory.getShuffleTravelYOffset(card, layout, orientation, yOffset)
        : 0;
      const targetY = layout.y + travelYOffset;
      this.hand.startSkippableTween({
        targets: card,
        x: layout.x,
        y: targetY,
        scale: layout.scale,
        rotation: layout.rotation,
        duration,
        ease
      }, () => {
        card.setPosition(layout.x, targetY);
        card.setScale(layout.scale);
        card.setRotation(layout.rotation);
      });
    });
  }

  private getChangedStepViews(previousCardIds: string[], step: OrderAnimationStep): Set<CardView> {
    const nextCardIds = step.cards.map((card) => card.id);
    const changedCardIds = new Set(HandOrderPlanner.getChangedCardIds(previousCardIds, nextCardIds));
    return new Set(step.views.filter((view) => changedCardIds.has(view.cardId)));
  }

  private playOpponentShuffleMoveSound(): void {
    if (this.hand.getAnimationOrientation() !== "opponent") return;
    SoundPlayer.getInstance().play(CST.AUDIO.SND_CARD_CLICK);
  }

  private rotateViewsAroundCircle(
    views: CardView[],
    duration: number,
    token: number
  ): Promise<void> {
    const progress = { rotationOffset: 0 };
    const orientation = this.hand.getAnimationOrientation();

    const applyCirclePoses = () => {
      if (!this.hand.isAnimationTransitionCurrent(token)) return;
      const poses = HandShufflePoseFactory.createCirclePoses(
        views,
        orientation,
        progress.rotationOffset
      );
      views.forEach((view, index) => {
        const pose = poses[index];
        view.setPosition(pose.x, pose.y);
        view.setScale(pose.scale);
        view.setRotation(pose.rotation);
      });
    };

    return this.hand.waitForSkippableTween({
      targets: progress,
      rotationOffset: Math.PI * 2,
      duration,
      ease: "Linear",
      onUpdate: applyCirclePoses
    }, () => {
      progress.rotationOffset = Math.PI * 2;
      applyCirclePoses();
    });
  }

  private tweenViewsToPoses(
    views: CardView[],
    poses: CardTweenPose[],
    duration: number,
    ease: string
  ): Promise<void> {
    views.forEach((view, index) => {
      const pose = poses[index];
      this.hand.startSkippableTween({
        targets: view,
        x: pose.x,
        y: pose.y,
        scale: pose.scale,
        rotation: pose.rotation,
        duration,
        ease
      }, () => {
        view.setPosition(pose.x, pose.y);
        view.setScale(pose.scale);
        view.setRotation(pose.rotation);
      });
    });
    return this.hand.waitForMs(duration);
  }
}
