import { Card } from "../../model/interfaces";
import { CardView } from "./CardView";
import { CardLayout, OrderAnimationStep } from "./HandTypes";

export class HandOrderPlanner {
  public static getChangedCardIds(currentCardIds: string[], targetCardIds: string[]): string[] {
    const changedCardIds = new Set<string>();

    targetCardIds.forEach((cardId, index) => {
      if (currentCardIds[index] !== cardId) {
        changedCardIds.add(cardId);
      }
    });
    currentCardIds.forEach((cardId, index) => {
      if (targetCardIds[index] !== cardId) {
        changedCardIds.add(cardId);
      }
    });

    return Array.from(changedCardIds);
  }

  public static buildOrderAnimationSteps(
    targetOrders: string[][],
    cardViews: CardView[],
    cards: Card[],
    layouts: CardLayout[]
  ): OrderAnimationStep[] | null {
    const count = cardViews.length;
    const viewById = new Map(cardViews.map((cardView) => [cardView.cardId, cardView]));
    const cardById = new Map(cards.map((card) => [card.id, card]));
    let previousCardIds = cards.map((card) => card.id);

    return targetOrders.reduce<OrderAnimationStep[] | null>((steps, targetCardIds) => {
      if (!steps || targetCardIds.length !== count) return null;
      if (previousCardIds.every((cardId, index) => cardId === targetCardIds[index])) return steps;

      const step = HandOrderPlanner.createOrderAnimationStep(targetCardIds, viewById, cardById, layouts);
      if (!step) return null;
      steps.push(step);
      previousCardIds = targetCardIds;
      return steps;
    }, []);
  }

  public static buildFinalOrderAnimationStep(
    targetOrders: string[][],
    cardViews: CardView[],
    cards: Card[],
    layouts: CardLayout[]
  ): OrderAnimationStep | null {
    const finalOrder = targetOrders[targetOrders.length - 1];
    if (!finalOrder || finalOrder.length !== cardViews.length) return null;

    const viewById = new Map(cardViews.map((cardView) => [cardView.cardId, cardView]));
    const cardById = new Map(cards.map((card) => [card.id, card]));
    return HandOrderPlanner.createOrderAnimationStep(finalOrder, viewById, cardById, layouts);
  }

  public static buildSleevesAnimationSteps(
    targetOrders: string[][],
    shuffleSequenceCount: number,
    cardViews: CardView[],
    cards: Card[],
    layouts: CardLayout[]
  ): OrderAnimationStep[] | null {
    const sequenceCount = Phaser.Math.Clamp(Math.floor(shuffleSequenceCount), 1, 3);
    const viewById = new Map(cardViews.map((cardView) => [cardView.cardId, cardView]));
    const cardById = new Map(cards.map((card) => [card.id, card]));
    const steps: OrderAnimationStep[] = [];

    for (let sequenceIndex = 0; sequenceIndex < sequenceCount; sequenceIndex++) {
      const orderIndex = Math.min(
        targetOrders.length - 1,
        Math.ceil(((sequenceIndex + 1) * targetOrders.length) / sequenceCount) - 1
      );
      const step = HandOrderPlanner.createOrderAnimationStep(
        targetOrders[orderIndex],
        viewById,
        cardById,
        layouts
      );
      if (!step) return null;
      steps.push(step);
    }

    return steps;
  }

  private static createOrderAnimationStep(
    targetCardIds: string[],
    viewById: Map<string, CardView>,
    cardById: Map<string, Card>,
    layouts: CardLayout[]
  ): OrderAnimationStep | null {
    const views: CardView[] = [];
    const cards: Card[] = [];

    for (const cardId of targetCardIds) {
      const view = viewById.get(cardId);
      const card = cardById.get(cardId);
      if (!view || !card) return null;
      views.push(view);
      cards.push(card);
    }

    return { views, cards, layouts };
  }
}
