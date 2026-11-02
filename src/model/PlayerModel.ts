import { Card, CardDraw, IndexedCardDraw, PairDiscard, PairRemovalResult, PlayerId } from "./interfaces";

export class PlayerModel {
  public static removePairs(owner: PlayerId, hand: Card[]): PairRemovalResult {
    const remaining = hand.slice();
    const pairs: PairDiscard[] = [];
    let changed = true;

    while (changed) {
      changed = false;
      const pairMap = new Map<string, Card[]>();

      for (const card of remaining) {
        if (card.isHotPotatoPete) continue;
        const cards = pairMap.get(card.pairId) || [];
        cards.push(card);
        pairMap.set(card.pairId, cards);
      }

      for (const [pairId, cards] of pairMap) {
        if (cards.length >= 2) {
          const first = cards[0];
          const second = cards[1];
          PlayerModel.removeCard(remaining, first.id);
          PlayerModel.removeCard(remaining, second.id);
          pairs.push({
            owner,
            pairId,
            cards: [first, second]
          });
          changed = true;
          break;
        }
      }
    }

    return { hand: remaining, pairs };
  }

  public static drawCard(fromHand: Card[], index: number): CardDraw {
    if (!Number.isInteger(index) || index < 0 || index >= fromHand.length) {
      throw new Error(`Card index ${index} is out of range`);
    }

    const hand = fromHand.slice();
    const card = hand.splice(index, 1)[0];
    return { card, hand };
  }

  public static drawCardById(fromHand: Card[], cardId: string): IndexedCardDraw {
    const index = fromHand.findIndex((card) => card.id === cardId);
    if (index < 0) {
      throw new Error(`Card ${cardId} is not in hand`);
    }

    return {
      ...PlayerModel.drawCard(fromHand, index),
      index
    };
  }

  private static removeCard(hand: Card[], cardId: string): void {
    const index = hand.findIndex((card) => card.id === cardId);
    if (index >= 0) {
      hand.splice(index, 1);
    }
  }
}
