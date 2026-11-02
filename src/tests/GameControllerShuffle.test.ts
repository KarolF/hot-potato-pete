import { beforeEach, describe, expect, it } from "vitest";
import { GameController } from "../model/GameController";
import { CST } from "../CST";
import { CardFactory } from "../model/CardFactory";
import { GameStateModel } from "../model/GameStateModel";
import { setSnapshot } from "./GameControllerFixtures";

describe("GameControllerShuffle", () => {
  beforeEach(() => GameController.resetForTests());

  it("stores Peter's multi-step receive shuffle in the model snapshot", () => {
    setSnapshot({
      seed: 1,
      phase: CST.GAME_PHASE.BOT_DRAW,
      players: {
        player: {
          id: "player",
          name: "You",
          hand: [CardFactory.createHotPotatoPete(), CardFactory.createCard("4", "clubs")]
        },
        bot: {
          id: "bot",
          name: "Peter",
          hand: [CardFactory.createCard("2", "clubs"), CardFactory.createCard("3", "clubs")]
        }
      },
      discardPile: [],
      turn: "bot",
      winner: null,
      loser: null,
      lastEvent: ""
    });

    const result = GameController.draw("bot", "player", 0);
    const storedSnapshot = GameStateModel.getInstance().requireSnapshot();
    const shuffle = result.shuffle;

    expect(shuffle).toBeDefined();
    expect(shuffle?.owner).toBe("bot");
    expect(shuffle?.shuffleNumber).toBe(1);
    expect(shuffle?.stepCount).toBeGreaterThanOrEqual(3);
    expect(shuffle?.stepCount).toBeLessThanOrEqual(8);
    expect(shuffle?.stepDurationMs).toBe(250);
    expect(shuffle?.steps).toHaveLength(shuffle?.stepCount ?? 0);
    expect(shuffle?.beforeCardIds.slice().sort()).toEqual(
      ["2_clubs", "3_clubs", "hot-potato-pete"].sort()
    );
    expect(shuffle?.beforeCardIds.indexOf("hot-potato-pete")).not.toBe(2);
    expect(shuffle?.afterCardIds).toEqual(shuffle?.steps[(shuffle?.steps.length ?? 1) - 1]);
    expect(shuffle?.bonusCardId).toBe("2_clubs");
    expect(shuffle?.focusCardId).toBe("hot-potato-pete");
    expect(shuffle?.movedCardIds).toContain("hot-potato-pete");
    expect(shuffle?.movedCardIds.length).toBeGreaterThan(1);
    expect(result.snapshot.players.bot.hand.map((card) => card.id)).toEqual(shuffle?.afterCardIds);
    expect(storedSnapshot.players.bot.hand.map((card) => card.id)).toEqual(shuffle?.afterCardIds);
    expect(storedSnapshot.shuffleBonusCardId).toBe("2_clubs");
    expect(storedSnapshot.peterShuffle).toEqual({
      count: 1,
      lastStepCount: shuffle?.stepCount,
      lastStepDurationMs: shuffle?.stepDurationMs
    });
  });

  it("moves Peter's original rightmost card during receive shuffles", () => {
    for (let seed = 1; seed <= 12; seed++) {
      setSnapshot({
        seed,
        phase: CST.GAME_PHASE.BOT_DRAW,
        players: {
          player: {
            id: "player",
            name: "You",
            hand: [CardFactory.createHotPotatoPete(), CardFactory.createCard("7", "clubs")]
          },
          bot: {
            id: "bot",
            name: "Peter",
            hand: [
              CardFactory.createCard("2", "clubs"),
              CardFactory.createCard("3", "clubs"),
              CardFactory.createCard("4", "clubs"),
              CardFactory.createCard("5", "clubs")
            ]
          }
        },
        discardPile: [],
        turn: "bot",
        winner: null,
        loser: null,
        lastEvent: ""
      });

      const result = GameController.draw("bot", "player", 0);
      const shuffle = result.shuffle;
      const rightmostCardId = shuffle?.beforeCardIds[shuffle.beforeCardIds.length - 1];

      expect(shuffle).toBeDefined();
      expect(shuffle?.movedCardIds).toContain(rightmostCardId);
    }
  });

  it("adds three steps and increases speed on Peter's later shuffles", () => {
    setSnapshot({
      seed: 9,
      phase: CST.GAME_PHASE.BOT_DRAW,
      players: {
        player: {
          id: "player",
          name: "You",
          hand: [CardFactory.createHotPotatoPete(), CardFactory.createCard("6", "clubs")]
        },
        bot: {
          id: "bot",
          name: "Peter",
          hand: [
            CardFactory.createCard("2", "clubs"),
            CardFactory.createCard("3", "clubs"),
            CardFactory.createCard("4", "clubs"),
            CardFactory.createCard("5", "clubs")
          ]
        }
      },
      discardPile: [],
      turn: "bot",
      winner: null,
      loser: null,
      lastEvent: ""
    });

    const firstResult = GameController.draw("bot", "player", 0);
    const firstShuffle = firstResult.shuffle;
    expect(firstShuffle).toBeDefined();

    setSnapshot({
      ...firstResult.snapshot,
      phase: CST.GAME_PHASE.BOT_DRAW,
      turn: "bot",
      players: {
        player: {
          ...firstResult.snapshot.players.player,
          hand: [CardFactory.createCard("7", "clubs")]
        },
        bot: firstResult.snapshot.players.bot
      },
      lastEvent: ""
    });

    const secondResult = GameController.draw("bot", "player", 0);
    const secondShuffle = secondResult.shuffle;

    expect(secondShuffle).toBeDefined();
    expect(secondShuffle?.shuffleNumber).toBe(2);
    expect(secondShuffle?.stepCount).toBe((firstShuffle?.stepCount ?? 0) + 3);
    expect(secondShuffle?.stepDurationMs).toBeLessThan(firstShuffle?.stepDurationMs ?? 0);
    expect(secondResult.snapshot.peterShuffle).toEqual({
      count: 2,
      lastStepCount: secondShuffle?.stepCount,
      lastStepDurationMs: secondShuffle?.stepDurationMs
    });
  });

  it("shuffles even when Peter has only two cards", () => {
    setSnapshot({
      seed: 3,
      phase: CST.GAME_PHASE.BOT_DRAW,
      players: {
        player: {
          id: "player",
          name: "You",
          hand: [CardFactory.createHotPotatoPete(), CardFactory.createCard("4", "clubs")]
        },
        bot: {
          id: "bot",
          name: "Peter",
          hand: [CardFactory.createCard("2", "clubs")]
        }
      },
      discardPile: [],
      turn: "bot",
      winner: null,
      loser: null,
      lastEvent: ""
    });

    const result = GameController.draw("bot", "player", 0);
    const shuffle = result.shuffle;
    const uniqueStepOrders = new Set(shuffle?.steps.map((step) => step.join(",")));

    expect(shuffle).toBeDefined();
    expect(shuffle?.steps.length).toBeGreaterThanOrEqual(3);
    expect(shuffle?.steps.every((step) => step.length === 2)).toBe(true);
    expect(uniqueStepOrders.size).toBeGreaterThan(1);
    expect(shuffle?.movedCardIds.sort()).toEqual(["2_clubs", "hot-potato-pete"].sort());
  });

  it("slows Peeky Pete's two-card shuffle below easy pace", () => {
    const match = GameController.startNewGame(912, 12);
    setSnapshot({
      seed: 912,
      phase: CST.GAME_PHASE.BOT_DRAW,
      players: {
        player: {
          id: "player",
          name: "You",
          hand: [CardFactory.createHotPotatoPete(), CardFactory.createCard("4", "clubs")]
        },
        bot: {
          id: "bot",
          name: match.players.bot.name,
          hand: [CardFactory.createCard("2", "clubs")]
        }
      },
      discardPile: [],
      turn: "bot",
      winner: null,
      loser: null,
      lastEvent: "",
      opponent: match.opponent,
      peterShuffle: {
        count: 5,
        lastStepCount: 8,
        lastStepDurationMs: 118,
        shuffleDurationMultiplier: match.peterShuffle?.shuffleDurationMultiplier
      }
    });

    const result = GameController.draw("bot", "player", 0);

    expect(match.opponent?.id).toBe("peeky_pete");
    expect(result.shuffle?.stepDurationMs).toBe(350);
    expect(result.snapshot.peterShuffle?.lastStepDurationMs).toBe(350);
  });
});
