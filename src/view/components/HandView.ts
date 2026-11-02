import { Card, OpponentShuffleStyle, Point } from "../../model/interfaces";
import { AnimationSkipController } from "../../utils/AnimationSkipController";
import { CardView } from "./CardView";
import { HandHitResolver } from "./HandHitResolver";
import { HandLayoutHelper } from "./HandLayoutHelper";
import { HandOrderAnimator } from "./HandOrderAnimator";
import { HandRenderer } from "./HandRenderer";
import type {
  CardHit,
  CardLayout,
  CardPose,
  CardScanTarget,
  HandOrientation,
  HandRenderOptions,
  HandTransitionOptions,
  OrderAnimationStep
} from "./HandTypes";

export type {
  CardHit,
  CardPose,
  CardScanTarget,
  HandRenderOptions,
  HandTransitionOptions
} from "./HandTypes";

type SkippableTweenConfig = Phaser.Types.Tweens.TweenBuilderConfig;

export class HandView extends Phaser.GameObjects.Container {
  private readonly renderer: HandRenderer;
  private readonly orderAnimator: HandOrderAnimator;
  private readonly hitResolver: HandHitResolver;
  private skipController?: AnimationSkipController;
  private cardViews: CardView[] = [];
  private cards: Card[] = [];
  private layouts: CardLayout[] = [];
  private hoverIndex = -1;
  private lastAvailableWidth = 520;
  private transitionToken = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly orientation: HandOrientation = "player"
  ) {
    super(scene, x, y);
    this.renderer = new HandRenderer(this);
    this.orderAnimator = new HandOrderAnimator(this);
    this.hitResolver = new HandHitResolver(this);
  }

  public setAnimationSkipController(skipController: AnimationSkipController): void {
    this.skipController = skipController;
  }

  public render(cards: Card[], options: HandRenderOptions): void {
    this.renderer.render(cards, options);
  }

  public async transitionTo(
    cards: Card[],
    options: HandRenderOptions,
    duration: number,
    transitionOptions: HandTransitionOptions = {}
  ): Promise<boolean> {
    return this.renderer.transitionTo(cards, options, duration, transitionOptions);
  }

  public pulseSelectable(): void {
    for (const card of this.cardViews) {
      card.pulseSelectable();
    }
  }

  public setSelectable(selectable: boolean): void {
    if (!selectable) {
      this.setHoverIndex(-1);
    }
    this.cardViews.forEach((card) => card.setSelectable(selectable));
  }

  public setHoverIndex(index: number): void {
    if (this.hoverIndex === index) return;
    this.hoverIndex = index;
    this.cardViews.forEach((card, cardIndex) => card.setHovered(cardIndex === index));
  }

  public setCardVisible(index: number, visible: boolean): void {
    this.cardViews[index]?.setVisible(visible);
  }

  public setCardVisibleById(cardId: string, visible: boolean): void {
    const index = this.cards.findIndex((card) => card.id === cardId);
    if (index >= 0) {
      this.setCardVisible(index, visible);
    }
  }

  public getCardPose(index: number): CardPose | undefined {
    const layout = this.layouts[index];
    if (!layout) return undefined;

    return {
      x: this.x + layout.x,
      y: this.y + layout.y,
      scale: layout.scale,
      rotation: layout.rotation
    };
  }

  public getCardPoseById(cardId: string): CardPose | undefined {
    const index = this.cards.findIndex((card) => card.id === cardId);
    return index >= 0 ? this.getCardPose(index) : undefined;
  }

  public getIncomingPose(): CardPose {
    const layout = HandLayoutHelper.computeFanLayout(
      this.orientation,
      this.cardViews.length + 1,
      this.lastAvailableWidth
    )[this.cardViews.length];

    return {
      x: this.x + layout.x,
      y: this.y + layout.y,
      scale: layout.scale,
      rotation: layout.rotation
    };
  }

  public getCardPoseForCards(
    cards: Card[],
    cardId: string,
    availableWidth: number = this.lastAvailableWidth
  ): CardPose | undefined {
    const index = cards.findIndex((card) => card.id === cardId);
    if (index < 0) return undefined;

    const layout = HandLayoutHelper.computeFanLayout(
      this.orientation,
      cards.length,
      availableWidth
    )[index];
    if (!layout) return undefined;

    return {
      x: this.x + layout.x,
      y: this.y + layout.y,
      scale: layout.scale,
      rotation: layout.rotation
    };
  }

  public async shuffleCardToIndex(fromIndex: number, toIndex: number, duration: number): Promise<void> {
    await this.orderAnimator.shuffleCardToIndex(fromIndex, toIndex, duration);
  }

  public async animateOrderSequence(
    targetOrders: string[][],
    stepDurationMs: number,
    shuffleStyle: OpponentShuffleStyle = "peeky",
    shuffleSequenceCount: number = 1,
    focusCardId?: string
  ): Promise<void> {
    await this.orderAnimator.animateOrderSequence(
      targetOrders,
      stepDurationMs,
      shuffleStyle,
      shuffleSequenceCount,
      focusCardId
    );
  }

  public async animateOrderTo(
    targetCardIds: string[],
    duration: number,
    movedCardIds: string[] = []
  ): Promise<void> {
    await this.orderAnimator.animateOrderTo(targetCardIds, duration, movedCardIds);
  }

  public getCardHitCenters(): { x: number; y: number }[] {
    return this.hitResolver.getCardHitCenters();
  }

  public getCardScanTargets(): CardScanTarget[] {
    return this.hitResolver.getCardScanTargets();
  }

  public getCardHitRects(): { left: number; right: number; top: number; bottom: number }[] {
    return this.hitResolver.getCardHitRects();
  }

  public getCardHitPoints(index: number, localPoints: Point[]): Point[] {
    return this.hitResolver.getCardHitPoints(index, localPoints);
  }

  public getCardIndexAt(localX: number, localY: number): number {
    return this.hitResolver.getCardIndexAt(localX, localY);
  }

  public getCardAt(localX: number, localY: number): CardHit | null {
    return this.hitResolver.getCardAt(localX, localY);
  }

  public getAnimationCardViews(): CardView[] {
    return this.cardViews;
  }

  public getAnimationCards(): Card[] {
    return this.cards;
  }

  public getAnimationLayouts(): CardLayout[] {
    return this.layouts;
  }

  public getAnimationOrientation(): HandOrientation {
    return this.orientation;
  }

  public getAnimationAvailableWidth(): number {
    return this.lastAvailableWidth;
  }

  public setAnimationAvailableWidth(availableWidth: number): void {
    this.lastAvailableWidth = availableWidth;
  }

  public beginAnimationTransition(): number {
    return ++this.transitionToken;
  }

  public isAnimationTransitionCurrent(token: number): boolean {
    return token === this.transitionToken;
  }

  public resetHoverIndex(): void {
    this.hoverIndex = -1;
  }

  public replaceHandState(cardViews: CardView[], cards: Card[], layouts: CardLayout[]): void {
    this.cardViews = cardViews;
    this.cards = cards;
    this.layouts = layouts;
    this.removeAll(false);
    if (cardViews.length > 0) {
      this.add(cardViews);
    }
  }

  public commitOrderAnimation(step: OrderAnimationStep): void {
    this.replaceHandState(step.views, step.cards, step.layouts);
    this.cardViews.forEach((card, index) => {
      const layout = this.layouts[index];
      card.setRestPose(layout.x, layout.y, layout.scale, layout.rotation);
    });
    this.hoverIndex = -1;
  }

  public waitForMs(ms: number): Promise<void> {
    if (this.skipController) {
      return this.skipController.waitForMs(this.scene, ms);
    }

    return new Promise((resolve) => {
      this.scene.time.delayedCall(ms, () => resolve());
    });
  }

  public startSkippableTween(config: SkippableTweenConfig, applyFinalState: () => void): void {
    if (this.skipController) {
      this.skipController.startTween(this.scene, config, applyFinalState);
      return;
    }

    this.scene.tweens.add(config);
  }

  public waitForSkippableTween(
    config: SkippableTweenConfig,
    applyFinalState: () => void
  ): Promise<void> {
    if (this.skipController) {
      return this.skipController.waitForTween(this.scene, config, applyFinalState);
    }

    return new Promise((resolve) => {
      this.scene.tweens.add({
        ...config,
        onComplete: () => resolve()
      });
    });
  }

}
