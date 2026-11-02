import { beforeEach, describe, expect, it } from "vitest";
import { GameController } from "../model/GameController";
import { CST } from "../CST";
import { CardFactory } from "../model/CardFactory";
import { setSnapshot } from "./GameControllerFixtures";

describe("GameControllerOpponents", () => {
  beforeEach(() => GameController.resetForTests());

  it("makes Peter shuffles half-speed only during the first match of each run", () => {
    const firstMatch = GameController.startNewGame(101, 1);
    setSnapshot({
      seed: 101,
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
      lastEvent: "",
      peterShuffle: firstMatch.peterShuffle
    });

    const firstResult = GameController.draw("bot", "player", 0);

    const secondMatch = GameController.startNewGame(102, 2);
    setSnapshot({
      seed: 102,
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
      lastEvent: "",
      peterShuffle: secondMatch.peterShuffle
    });

    const secondResult = GameController.draw("bot", "player", 0);

    const newRunFirstMatch = GameController.startNewGame(103, 1);
    setSnapshot({
      seed: 103,
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
      lastEvent: "",
      peterShuffle: newRunFirstMatch.peterShuffle
    });

    const newRunFirstResult = GameController.draw("bot", "player", 0);

    expect(firstResult.shuffle?.stepDurationMs).toBe(500);
    expect(firstResult.snapshot.peterShuffle?.lastStepDurationMs).toBe(500);
    expect(secondResult.shuffle?.stepDurationMs).toBe(250);
    expect(secondResult.snapshot.peterShuffle?.lastStepDurationMs).toBe(250);
    expect(newRunFirstResult.shuffle?.stepDurationMs).toBe(500);
    expect(newRunFirstResult.snapshot.peterShuffle?.lastStepDurationMs).toBe(500);
  });

  it("assigns opponents and difficulty by run match number", () => {
    expect(GameController.startNewGame(201, 1).opponent).toMatchObject({
      id: "marked_martha",
      name: "Marked Martha",
      difficulty: "easy",
      shuffleStyle: "circle",
      eyeStyle: "retina",
      hintText: CST.STRINGS.HINT_MARKED_MARTHA
    });
    expect(GameController.startNewGame(202, 2).opponent).toMatchObject({
      id: "slim_mcsleeves",
      name: "Slim McSleeves",
      difficulty: "easy",
      shuffleStyle: "sleeves",
      eyeStyle: "blink",
      hintText: CST.STRINGS.HINT_SLIM_MCSLEEVES
    });
    expect(GameController.startNewGame(203, 3).opponent).toMatchObject({
      id: "peeky_pete",
      name: "Peeky Pete",
      difficulty: "easy",
      shuffleStyle: "peeky",
      eyeStyle: "hold",
      hintText: CST.STRINGS.HINT_PEEKY_PETE
    });
    expect(GameController.startNewGame(204, 4).opponent).toMatchObject({
      id: "marked_martha",
      difficulty: "normal"
    });
    expect(GameController.startNewGame(207, 7).opponent).toMatchObject({
      id: "marked_martha",
      difficulty: "hard"
    });
    expect(GameController.startNewGame(210, 10).opponent).toMatchObject({
      id: "marked_martha",
      difficulty: "superhard1"
    });
    expect(GameController.startNewGame(213, 13).opponent).toMatchObject({
      id: "marked_martha",
      difficulty: "superhard2"
    });
  });

  it("repeats Slim shuffle sequences by difficulty", () => {
    const drawAgainstMatch = (matchNumber: number) => {
      const match = GameController.startNewGame(220 + matchNumber, matchNumber);
      setSnapshot({
        seed: 220 + matchNumber,
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
            hand: [CardFactory.createCard("2", "clubs"), CardFactory.createCard("3", "clubs")]
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

      return GameController.draw("bot", "player", 0);
    };

    expect(drawAgainstMatch(2).shuffle?.shuffleSequenceCount).toBe(1);
    expect(drawAgainstMatch(5).shuffle?.shuffleSequenceCount).toBe(2);
    expect(drawAgainstMatch(8).shuffle?.shuffleSequenceCount).toBe(3);
    expect(drawAgainstMatch(11).shuffle?.shuffleSequenceCount).toBe(3);
    expect(drawAgainstMatch(14).shuffle?.shuffleSequenceCount).toBe(3);
  });

  it("applies shuffle duration multipliers by opponent and difficulty", () => {
    const drawAgainstMatch = (matchNumber: number) => {
      const match = GameController.startNewGame(240 + matchNumber, matchNumber);
      setSnapshot({
        seed: 240 + matchNumber,
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
            hand: [CardFactory.createCard("2", "clubs"), CardFactory.createCard("3", "clubs")]
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

    expect(drawAgainstMatch(2)).toBe(250);
    expect(drawAgainstMatch(3)).toBe(250);
    expect(drawAgainstMatch(4)).toBe(167);
    expect(drawAgainstMatch(5)).toBe(217);
    expect(drawAgainstMatch(6)).toBe(325);
    expect(drawAgainstMatch(7)).toBe(168);
    expect(drawAgainstMatch(8)).toBe(210);
    expect(drawAgainstMatch(9)).toBe(300);
    expect(drawAgainstMatch(11)).toBeLessThan(drawAgainstMatch(8) ?? 0);
    expect(drawAgainstMatch(14)).toBeLessThan(drawAgainstMatch(11) ?? 0);
  });

  it("keeps Slim hard shuffles from accelerating", () => {
    const drawAfterShuffleCount = (count: number) => {
      const match = GameController.startNewGame(820 + count, 8);
      setSnapshot({
        seed: 820 + count,
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
            hand: [CardFactory.createCard("2", "clubs"), CardFactory.createCard("3", "clubs")]
          }
        },
        discardPile: [],
        turn: "bot",
        winner: null,
        loser: null,
        lastEvent: "",
        opponent: match.opponent,
        peterShuffle: {
          count,
          lastStepCount: 3,
          lastStepDurationMs: 210,
          shuffleDurationMultiplier: match.peterShuffle?.shuffleDurationMultiplier
        }
      });

      return GameController.draw("bot", "player", 0).shuffle?.stepDurationMs;
    };

    expect(drawAfterShuffleCount(0)).toBe(210);
    expect(drawAfterShuffleCount(3)).toBe(210);
  });
});
