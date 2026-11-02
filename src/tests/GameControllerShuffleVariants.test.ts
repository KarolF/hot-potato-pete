import { beforeEach, describe, expect, it } from "vitest";
import { GameController } from "../model/GameController";
import { CST } from "../CST";
import { CardFactory } from "../model/CardFactory";
import { setSnapshot } from "./GameControllerFixtures";

describe("GameControllerShuffleVariants", () => {
  beforeEach(() => GameController.resetForTests());

  it("speeds up Slim McSleeves two-card shuffles in every difficulty", () => {
    const drawAgainstMatch = (matchNumber: number) => {
      const match = GameController.startNewGame(940 + matchNumber, matchNumber);
      setSnapshot({
        seed: 940 + matchNumber,
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
        peterShuffle: match.peterShuffle
      });

      return GameController.draw("bot", "player", 0).shuffle?.stepDurationMs;
    };

    expect(drawAgainstMatch(2)).toBe(83);
    expect(drawAgainstMatch(5)).toBe(72);
    expect(drawAgainstMatch(8)).toBe(70);
    expect(drawAgainstMatch(11)).toBe(40);
    expect(drawAgainstMatch(14)).toBe(35);
  });

  it("shuffles after Peter places a pair when he still has Hot Potato Pete", () => {
    setSnapshot({
      seed: 4,
      phase: CST.GAME_PHASE.BOT_DRAW,
      players: {
        player: {
          id: "player",
          name: "You",
          hand: [CardFactory.createCard("4", "clubs")]
        },
        bot: {
          id: "bot",
          name: "Peter",
          hand: [
            CardFactory.createHotPotatoPete(),
            CardFactory.createCard("4", "hearts"),
            CardFactory.createCard("2", "clubs")
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

    expect(result.removedPairs).toHaveLength(1);
    expect(result.removedPairs[0].pairId).toBe("4");
    expect(shuffle).toBeDefined();
    expect(shuffle?.beforeCardIds.slice().sort()).toEqual(["hot-potato-pete", "2_clubs"].sort());
    expect(shuffle?.beforeCardIds).not.toContain("4_clubs");
    expect(shuffle?.beforeCardIds).not.toContain("4_hearts");
    expect(shuffle?.movedCardIds).toContain("hot-potato-pete");
    expect(result.snapshot.players.bot.hand.map((card) => card.id)).toEqual(shuffle?.afterCardIds);
  });

  it("does not shuffle after a pair if Peter has only Hot Potato Pete left", () => {
    setSnapshot({
      seed: 5,
      phase: CST.GAME_PHASE.BOT_DRAW,
      players: {
        player: {
          id: "player",
          name: "You",
          hand: [CardFactory.createCard("4", "clubs")]
        },
        bot: {
          id: "bot",
          name: "Peter",
          hand: [CardFactory.createHotPotatoPete(), CardFactory.createCard("4", "hearts")]
        }
      },
      discardPile: [],
      turn: "bot",
      winner: null,
      loser: null,
      lastEvent: ""
    });

    const result = GameController.draw("bot", "player", 0);

    expect(result.removedPairs).toHaveLength(1);
    expect(result.shuffle).toBeUndefined();
    expect(result.snapshot.players.bot.hand.map((card) => card.id)).toEqual(["hot-potato-pete"]);
  });
});
