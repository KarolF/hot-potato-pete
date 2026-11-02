import { CST } from "../../CST";
import { SoundPlayer } from "../SoundPlayer";
import { CardView } from "./CardView";
import { HandAnimationTimings, type OrderMoveDurations } from "./HandAnimationTimings";
import { HandLayoutHelper } from "./HandLayoutHelper";
import { HandOrderPlanner } from "./HandOrderPlanner";
import { HandShuffleMoveResolver } from "./HandShuffleMoveResolver";
import type { CardLayout, OrderAnimationStep } from "./HandTypes";
import type { HandView } from "./HandView";

export class PeekyShuffleSequenceAnimator {
  private static readonly travelYOffset = -50;

  constructor(private readonly hand: HandView) {}

  public async animateOrderSequence(
    targetOrders: string[][],
    stepDurationMs: number,
    focusCardId?: string
  ): Promise<void> {
    const cardViews = this.hand.getAnimationCardViews();
    if (cardViews.length < 2) return;

    const token = this.hand.beginAnimationTransition();
    const layouts = HandLayoutHelper.computeFanLayout(
      this.hand.getAnimationOrientation(),
      cardViews.length,
      this.hand.getAnimationAvailableWidth()
    );
    const steps = HandOrderPlanner.buildOrderAnimationSteps(
      targetOrders,
      cardViews,
      this.hand.getAnimationCards(),
      layouts
    );
    if (!steps || steps.length === 0) return;

    const durations = HandAnimationTimings.getOrderMoveDurations(stepDurationMs);
    const changesZOrderAfterStep = cardViews.length === 2;
    let previousCardIds = this.hand.getAnimationCards().map((card) => card.id);
    this.hand.scene.tweens.killTweensOf(cardViews);

    for (const step of steps) {
      const completed = await this.animateStep(
        previousCardIds,
        step,
        durations,
        token,
        focusCardId,
        changesZOrderAfterStep
      );
      if (!completed) return;

      if (!changesZOrderAfterStep) {
        this.applyStepOrder(step);
      }
      previousCardIds = step.cards.map((card) => card.id);
    }

    this.hand.commitOrderAnimation(steps[steps.length - 1]);
  }

  private async animateStep(
    previousCardIds: string[],
    step: OrderAnimationStep,
    durations: OrderMoveDurations,
    token: number,
    focusCardId: string | undefined,
    changesZOrderAfterStep: boolean
  ): Promise<boolean> {
    const nextCardIds = step.cards.map((card) => card.id);
    const movedCardId = HandShuffleMoveResolver.findMovedCardId(
      previousCardIds,
      nextCardIds,
      focusCardId
    );
    const view = step.views.find((cardView) => cardView.cardId === movedCardId);
    const layout = view ? step.layouts[step.views.indexOf(view)] : undefined;
    if (!view || !layout) return true;

    this.playMoveSound();
    if (!changesZOrderAfterStep) {
      this.hand.remove(view, false);
      this.hand.add(view);
    }
    const completed = await this.animateCardToLayout(view, layout, step, durations, token);
    if (completed && changesZOrderAfterStep) {
      this.applyStepOrder(step);
    }
    return completed;
  }

  private async animateCardToLayout(
    view: CardView,
    layout: CardLayout,
    step: OrderAnimationStep,
    durations: OrderMoveDurations,
    token: number
  ): Promise<boolean> {
    const liftedY = view.y + PeekyShuffleSequenceAnimator.travelYOffset;
    await this.hand.waitForSkippableTween({
      targets: view,
      y: liftedY,
      duration: durations.lift,
      ease: "Sine.easeOut"
    }, () => {
      view.y = liftedY;
    });
    if (!this.hand.isAnimationTransitionCurrent(token)) return false;

    const travelY = layout.y + PeekyShuffleSequenceAnimator.travelYOffset;
    this.animateFanViewsToStep(step, view, durations.move);
    await this.hand.waitForSkippableTween({
      targets: view,
      x: layout.x,
      y: travelY,
      scale: layout.scale,
      rotation: layout.rotation,
      duration: durations.move,
      ease: "Sine.easeInOut"
    }, () => {
      view.setPosition(layout.x, travelY);
      view.setScale(layout.scale);
      view.setRotation(layout.rotation);
    });
    if (!this.hand.isAnimationTransitionCurrent(token)) return false;

    await this.hand.waitForSkippableTween({
      targets: view,
      y: layout.y,
      duration: durations.settle,
      ease: "Sine.easeIn"
    }, () => {
      view.y = layout.y;
    });
    return this.hand.isAnimationTransitionCurrent(token);
  }

  private animateFanViewsToStep(
    step: OrderAnimationStep,
    movingView: CardView,
    duration: number
  ): void {
    step.views.forEach((view, index) => {
      if (view === movingView) return;
      const layout = step.layouts[index];
      this.hand.startSkippableTween({
        targets: view,
        x: layout.x,
        y: layout.y,
        scale: layout.scale,
        rotation: layout.rotation,
        duration,
        ease: "Sine.easeInOut"
      }, () => {
        view.setPosition(layout.x, layout.y);
        view.setScale(layout.scale);
        view.setRotation(layout.rotation);
      });
    });
  }

  private applyStepOrder(step: OrderAnimationStep): void {
    this.hand.removeAll(false);
    this.hand.add(step.views);
  }

  private playMoveSound(): void {
    SoundPlayer.getInstance().play(CST.AUDIO.SND_CARD_CLICK);
  }
}
