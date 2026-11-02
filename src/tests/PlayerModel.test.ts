import { describe, expect, it } from "vitest";
import { CardFactory } from "../model/CardFactory";
import { PlayerModel } from "../model/PlayerModel";

describe("PlayerModel", () => {
  it.each([-1, 1, 0.5, NaN, Infinity])("rejects invalid draw index %s", (index) => {
    const hand = [CardFactory.createHotPotatoPete()];
    expect(() => PlayerModel.drawCard(hand, index)).toThrow();
    expect(hand).toHaveLength(1);
  });

  it("removes matching pairs while leaving Hot Potato Pete", () => {
    const hand = [
      CardFactory.createCard("2", "hearts"),
      CardFactory.createHotPotatoPete(),
      CardFactory.createCard("2", "diamonds"),
      CardFactory.createCard("3", "clubs")
    ];

    const result = PlayerModel.removePairs("player", hand);

    expect(result.pairs).toHaveLength(1);
    expect(result.pairs[0].pairId).toBe("2");
    expect(result.hand.map((card) => card.id)).toEqual(["hot-potato-pete", "3_clubs"]);
  });
});
