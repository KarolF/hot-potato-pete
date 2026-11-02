import { describe, expect, it } from "vitest";
import { GameController } from "../model/GameController";
import { GameStateModel } from "../model/GameStateModel";
import { Card, GameSnapshot } from "../model/interfaces";

function allCards(snapshot: GameSnapshot): Card[] {
  return [
    ...snapshot.players.player.hand,
    ...snapshot.players.bot.hand,
    ...snapshot.discardPile.flatMap((pair) => pair.cards)
  ];
}

describe("game state integrity", () => {
  it("isolates stored and future opponent faces from a starting snapshot", () => {
    const original = GameController.startNewGame(42, 1);
    const state = GameStateModel.getInstance();
    const expected = state.requireSnapshot();
    original.opponent!.face.textureKey = "changed";
    original.opponent!.face.leftEyeCenter!.x = -999;
    original.opponent!.face.rightEyeCenter!.y = -999;

    expect(state.requireSnapshot()).toEqual(expected);
    expect(GameController.startNewGame(43, 1).opponent).toEqual(expected.opponent);
  });

  it("isolates stored cards from both input and returned snapshots", () => {
    const original = GameController.startNewGame(1234);
    const state = GameStateModel.getInstance();
    const expected = JSON.parse(JSON.stringify(state.requireSnapshot())) as GameSnapshot;
    original.players.player.hand[0].id = "changed input";
    const returned = state.requireSnapshot();
    returned.players.bot.hand[0].rank = "HPP";
    returned.discardPile[0].cards[0].pairId = "changed output";
    expect(state.requireSnapshot()).toEqual(expected);
  });

  it("rejects drawing from the same hand without changing state", () => {
    const before = GameController.startNewGame(1234);
    expect(() => GameController.draw("player", "player", 0)).toThrow();
    expect(() => GameController.drawByCardId("player", "player", before.players.player.hand[0].id))
      .toThrow();
    expect(GameStateModel.getInstance().requireSnapshot()).toEqual(before);
  });

  it("rejects a draw during the wrong turn without changing state", () => {
    const before = GameController.startNewGame(1234);
    expect(() => GameController.botDraw()).toThrow();
    expect(GameStateModel.getInstance().requireSnapshot()).toEqual(before);
  });

  it("preserves every unique card through complete seeded matches", () => {
    for (let seed = 1; seed <= 30; seed++) {
      let snapshot = GameController.startNewGame(seed, seed);
      let draws = 0;
      while (snapshot.phase !== "game_over" && draws < 500) {
        snapshot = snapshot.turn === "player"
          ? GameController.playerDraw(draws % snapshot.players.bot.hand.length).snapshot
          : GameController.botDraw().snapshot;
        const cards = allCards(snapshot);
        expect(cards).toHaveLength(25);
        expect(new Set(cards.map((card) => card.id)).size).toBe(25);
        expect(cards.filter((card) => card.isHotPotatoPete)).toHaveLength(1);
        draws++;
      }
      expect(snapshot.phase).toBe("game_over");
      expect(snapshot.winner).not.toBe(snapshot.loser);
    }
  });
});
