import { describe, expect, it } from "vitest";
import { DeckModel } from "../model/DeckModel";

describe("DeckModel", () => {
  it("creates 12 pairs and one Hot Potato Pete card", () => {
    const deck = DeckModel.createDeck();
    const hotPotatoPeteCards = deck.filter((card) => card.isHotPotatoPete);
    const pairIds = new Map<string, number>();

    for (const card of deck) {
      if (card.isHotPotatoPete) continue;
      pairIds.set(card.pairId, (pairIds.get(card.pairId) || 0) + 1);
    }

    expect(deck).toHaveLength(25);
    expect(hotPotatoPeteCards).toHaveLength(1);
    expect(pairIds.size).toBe(12);
    expect([...pairIds.values()].every((count) => count === 2)).toBe(true);
  });

  it("deals every card to one of two players", () => {
    const deck = DeckModel.createDeck();
    const [player, bot] = DeckModel.deal(deck);
    const allIds = new Set([...player, ...bot].map((card) => card.id));

    expect(player.length + bot.length).toBe(deck.length);
    expect(allIds.size).toBe(deck.length);
  });
});
