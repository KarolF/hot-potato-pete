import { Card } from "../../model/interfaces";
import { CardView } from "./CardView";
import { HandCardFactory } from "./HandCardFactory";
import { HandLayoutHelper } from "./HandLayoutHelper";
import type { CardLayout, HandRenderOptions, HandTransitionOptions } from "./HandTypes";
import type { HandView } from "./HandView";

export class HandRenderer {
  constructor(private readonly hand: HandView) {}

  public render(cards: Card[], options: HandRenderOptions): void {
    this.hand.beginAnimationTransition();
    this.hand.scene.tweens.killTweensOf(this.hand.getAnimationCardViews());
    this.clearCards();
    this.hand.resetHoverIndex();
    this.hand.setAnimationAvailableWidth(options.availableWidth);
    const count = cards.length;
    if (count === 0) return;

    const layouts = HandLayoutHelper.computeFanLayout(
      this.hand.getAnimationOrientation(),
      count,
      options.availableWidth
    );
    const cardViews = cards.map((card, index) => {
      const cardView = HandCardFactory.create(this.hand.scene, layouts[index], card, options.faceUp);
      cardView.setSelectable(options.selectable);
      return cardView;
    });

    this.hand.replaceHandState(cardViews, cards.slice(), layouts);
  }

  public async transitionTo(
    cards: Card[],
    options: HandRenderOptions,
    duration: number,
    transitionOptions: HandTransitionOptions = {}
  ): Promise<boolean> {
    const token = this.hand.beginAnimationTransition();
    this.hand.setAnimationAvailableWidth(options.availableWidth);
    this.hand.resetHoverIndex();
    const instantCardIds = new Set(transitionOptions.instantCardIds ?? []);

    const nextLayouts = HandLayoutHelper.computeFanLayout(
      this.hand.getAnimationOrientation(),
      cards.length,
      options.availableWidth
    );
    const currentViews = this.hand.getAnimationCardViews().slice();
    const viewById = new Map(currentViews.map((cardView) => [cardView.cardId, cardView]));
    const nextViews: CardView[] = [];
    const createdViews: CardView[] = [];
    const obsoleteViews = currentViews.filter(
      (cardView) => !cards.some((card) => card.id === cardView.cardId)
    );

    cards.forEach((card, index) => {
      const layout = nextLayouts[index];
      let cardView = viewById.get(card.id);

      if (!cardView) {
        cardView = HandCardFactory.create(
          this.hand.scene,
          layout,
          card,
          options.faceUp,
          instantCardIds.has(card.id) ? 1 : 0
        );
        this.hand.add(cardView);
        createdViews.push(cardView);
      } else {
        cardView.setCard(card, options.faceUp);
        cardView.setVisible(true);
      }

      cardView.setSelectable(false);
      nextViews.push(cardView);
    });

    this.hand.scene.tweens.killTweensOf([...nextViews, ...obsoleteViews]);

    if (cards.length === 0) {
      await this.fadeOutObsoleteViews(obsoleteViews, duration, token);
    } else {
      await Promise.all([
        this.tweenViewsToLayouts(nextViews, nextLayouts, duration, token),
        this.fadeOutObsoleteViews(obsoleteViews, Math.min(180, duration), token)
      ]);
    }

    if (!this.hand.isAnimationTransitionCurrent(token)) {
      createdViews.forEach((cardView) => cardView.destroy());
      return false;
    }

    obsoleteViews.forEach((cardView) => cardView.destroy());
    this.hand.replaceHandState(nextViews, cards.slice(), nextLayouts);
    nextViews.forEach((cardView, index) => {
      const layout = nextLayouts[index];
      cardView.setAlpha(1);
      cardView.setVisible(true);
      cardView.setRestPose(layout.x, layout.y, layout.scale, layout.rotation);
      cardView.setSelectable(options.selectable);
    });
    return true;
  }

  private clearCards(): void {
    for (const card of this.hand.getAnimationCardViews()) {
      card.destroy();
    }
    this.hand.replaceHandState([], [], []);
  }

  private tweenViewsToLayouts(
    cardViews: CardView[],
    layouts: CardLayout[],
    duration: number,
    token: number
  ): Promise<void> {
    if (cardViews.length === 0 || !this.hand.isAnimationTransitionCurrent(token)) {
      return Promise.resolve();
    }

    cardViews.forEach((cardView, index) => {
      const layout = layouts[index];
      this.hand.startSkippableTween({
        targets: cardView,
        x: layout.x,
        y: layout.y,
        scale: layout.scale,
        rotation: layout.rotation,
        alpha: 1,
        duration,
        ease: "Sine.easeInOut"
      }, () => {
        cardView.setPosition(layout.x, layout.y);
        cardView.setScale(layout.scale);
        cardView.setRotation(layout.rotation);
        cardView.setAlpha(1);
      });
    });
    return this.hand.waitForMs(duration);
  }

  private fadeOutObsoleteViews(
    cardViews: CardView[],
    duration: number,
    token: number
  ): Promise<void> {
    if (cardViews.length === 0 || !this.hand.isAnimationTransitionCurrent(token)) {
      return Promise.resolve();
    }

    this.hand.startSkippableTween({
      targets: cardViews,
      alpha: 0,
      duration,
      ease: "Sine.easeOut"
    }, () => {
      cardViews.forEach((cardView) => cardView.setAlpha(0));
    });
    return this.hand.waitForMs(duration);
  }
}
