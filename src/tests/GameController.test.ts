import { beforeEach, describe, expect, it } from "vitest";
import { GameController } from "../model/GameController";


describe("GameController", () => {
  beforeEach(() => GameController.resetForTests());

  it("starts a deterministic game with all cards accounted for", () => {
    const snapshot = GameController.startNewGame(42);
    const handCount = snapshot.players.player.hand.length + snapshot.players.bot.hand.length;
    const discardCount = snapshot.discardPile.length * 2;
    const hotPotatoPeteCount = [...snapshot.players.player.hand, ...snapshot.players.bot.hand].filter(
      (card) => card.isHotPotatoPete
    ).length;

    expect(handCount + discardCount).toBe(25);
    expect(hotPotatoPeteCount).toBe(1);
    const playerHasHotPotatoPete = snapshot.players.player.hand.some((card) => card.isHotPotatoPete);
    expect(snapshot.hotPotatoPeteBalance).toEqual({
      playerStartedWithHotPotatoPete: playerHasHotPotatoPete,
      peterHasTakenHotPotatoPeteFromPlayer: false,
      peterDrawCount: 0,
      peterForceHotPotatoPeteDrawOnTurn: playerHasHotPotatoPete ? expect.any(Number) : null
    });
    if (playerHasHotPotatoPete) {
      expect([1, 2]).toContain(snapshot.hotPotatoPeteBalance?.peterForceHotPotatoPeteDrawOnTurn);
    }
  });

  it("starts the first gameplay tutorial with Hot Potato Pete in the opponent hand", () => {
    const snapshot = GameController.startNewGame(42, 1, {
      firstGameplayTutorial: true
    });
    const playerNonBlackPairIds = snapshot.players.player.hand
      .filter((card) => !card.isHotPotatoPete)
      .map((card) => card.pairId);
    const botNonBlackPairIds = snapshot.players.bot.hand
      .filter((card) => !card.isHotPotatoPete)
      .map((card) => card.pairId);
    const handCount = snapshot.players.player.hand.length + snapshot.players.bot.hand.length;
    const discardCount = snapshot.discardPile.length * 2;

    expect(snapshot.firstGameplayTutorial).toBe(true);
    expect(handCount + discardCount).toBe(25);
    expect(snapshot.players.bot.hand[0].isHotPotatoPete).toBe(true);
    expect(snapshot.players.bot.hand[snapshot.players.bot.hand.length - 1].isHotPotatoPete).toBe(false);
    expect(snapshot.players.bot.hand.some((card) => card.isHotPotatoPete)).toBe(true);
    expect(snapshot.players.player.hand.some((card) => card.isHotPotatoPete)).toBe(false);
    expect(new Set(playerNonBlackPairIds).size).toBe(playerNonBlackPairIds.length);
    expect(new Set(botNonBlackPairIds).size).toBe(botNonBlackPairIds.length);
    expect(playerNonBlackPairIds.sort()).toEqual(botNonBlackPairIds.sort());
  });

  it("does not always deal Hot Potato Pete to the player", () => {
    const owners = new Set<string>();

    for (let seed = 1; seed <= 30; seed++) {
      const snapshot = GameController.startNewGame(seed);
      const playerHasHotPotatoPete = snapshot.players.player.hand.some((card) => card.isHotPotatoPete);
      const botHasHotPotatoPete = snapshot.players.bot.hand.some((card) => card.isHotPotatoPete);

      owners.add(playerHasHotPotatoPete ? "player" : "bot");
      expect(snapshot.hotPotatoPeteBalance?.playerStartedWithHotPotatoPete).toBe(playerHasHotPotatoPete);
      expect(snapshot.hotPotatoPeteBalance?.peterDrawCount).toBe(0);
      expect(snapshot.hotPotatoPeteBalance?.peterHasTakenHotPotatoPeteFromPlayer).toBe(false);
      if (playerHasHotPotatoPete) {
        expect([1, 2]).toContain(snapshot.hotPotatoPeteBalance?.peterForceHotPotatoPeteDrawOnTurn);
      } else {
        expect(snapshot.hotPotatoPeteBalance?.peterForceHotPotatoPeteDrawOnTurn).toBeNull();
      }

      if (botHasHotPotatoPete) {
        const hotPotatoPeteIndex = snapshot.players.bot.hand.findIndex((card) => card.isHotPotatoPete);
        expect(hotPotatoPeteIndex).toBeGreaterThanOrEqual(0);
        expect(hotPotatoPeteIndex).toBeLessThanOrEqual(1);
      }
    }

    expect(owners).toEqual(new Set(["player", "bot"]));
  });

  it("starts each match with more than three cards in each hand", () => {
    for (let seed = 1; seed <= 80; seed++) {
      const matchNumber = ((seed - 1) % 15) + 1;
      const snapshot = GameController.startNewGame(seed, matchNumber);

      expect(snapshot.players.player.hand.length).toBeGreaterThan(3);
      expect(snapshot.players.bot.hand.length).toBeGreaterThan(3);
    }
  });
});
