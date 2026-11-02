import { GameSnapshot } from "../model/interfaces";
import { beforeEach, describe, expect, it } from "vitest";
import { GameController } from "../model/GameController";
import { CST } from "../CST";
import { CardFactory } from "../model/CardFactory";
import { GameStateModel } from "../model/GameStateModel";
import { setSnapshot } from "./GameControllerFixtures";

describe("GameControllerTells", () => {
  beforeEach(() => GameController.resetForTests());

  it("tracks player turns where the bot can show a Hot Potato Pete tell", () => {
    const match = GameController.startNewGame(260, 14);
    setSnapshot({
      seed: 260,
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
      hotPotatoPeteTell: { botHotPotatoPetePlayerTurnCount: 0 }
    });

    const firstResult = GameController.draw("bot", "player", 0);
    expect(firstResult.snapshot.hotPotatoPeteTell?.botHotPotatoPetePlayerTurnCount).toBe(1);

    setSnapshot({
      ...firstResult.snapshot,
      phase: CST.GAME_PHASE.BOT_DRAW,
      turn: "bot",
      players: {
        player: {
          ...firstResult.snapshot.players.player,
          hand: [CardFactory.createCard("5", "clubs"), CardFactory.createCard("6", "clubs")]
        },
        bot: firstResult.snapshot.players.bot
      },
      lastEvent: ""
    });

    const secondResult = GameController.draw("bot", "player", 0);
    expect(secondResult.snapshot.hotPotatoPeteTell?.botHotPotatoPetePlayerTurnCount).toBe(2);
  });

  it("applies superhard Hot Potato Pete tell rules", () => {
    const createSnapshot = (
      matchNumber: number,
      botHandLength: number,
      turnCount: number
    ): GameSnapshot => {
      const match = GameController.startNewGame(280 + matchNumber + turnCount, matchNumber);
      const botCards = [
        CardFactory.createHotPotatoPete(),
        CardFactory.createCard("2", "clubs"),
        CardFactory.createCard("3", "clubs")
      ].slice(0, botHandLength);

      return {
        seed: 280 + matchNumber + turnCount,
        phase: CST.GAME_PHASE.PLAYER_DRAW,
        players: {
          player: {
            id: "player",
            name: "You",
            hand: [CardFactory.createCard("4", "clubs")]
          },
          bot: {
            id: "bot",
            name: match.players.bot.name,
            hand: botCards
          }
        },
        discardPile: [],
        turn: "player",
        winner: null,
        loser: null,
        lastEvent: "",
        opponent: match.opponent,
        hotPotatoPeteTell: { botHotPotatoPetePlayerTurnCount: turnCount }
      };
    };

    expect(GameController.shouldShowHotPotatoPeteTell(createSnapshot(11, 2, 1))).toBe(false);
    expect(GameController.shouldShowHotPotatoPeteTell(createSnapshot(11, 3, 1))).toBe(true);

    expect(GameController.shouldShowHotPotatoPeteTell(createSnapshot(14, 2, 1))).toBe(true);
    expect(GameController.shouldShowHotPotatoPeteTell(createSnapshot(14, 2, 2))).toBe(false);
    expect(GameController.shouldShowHotPotatoPeteTell(createSnapshot(14, 3, 2))).toBe(false);
    expect(GameController.shouldShowHotPotatoPeteTell(createSnapshot(14, 3, 3))).toBe(false);
  });

  it("shuffles the player's hand without advancing the turn", () => {
    setSnapshot({
      seed: 901,
      phase: CST.GAME_PHASE.PLAYER_DRAW,
      players: {
        player: {
          id: "player",
          name: "You",
          hand: [
            CardFactory.createCard("2", "clubs"),
            CardFactory.createCard("3", "clubs"),
            CardFactory.createCard("4", "clubs")
          ]
        },
        bot: {
          id: "bot",
          name: "Peter",
          hand: [CardFactory.createHotPotatoPete(), CardFactory.createCard("5", "clubs")]
        }
      },
      discardPile: [],
      turn: "player",
      winner: null,
      loser: null,
      lastEvent: "Choose one of Peter's cards"
    });

    const beforeCardIds = GameStateModel.getInstance()
      .requireSnapshot()
      .players.player.hand.map((card) => card.id);
    const shuffle = GameController.shufflePlayerHand();
    const storedSnapshot = GameStateModel.getInstance().requireSnapshot();
    const afterCardIds = storedSnapshot.players.player.hand.map((card) => card.id);

    expect(shuffle).toMatchObject({
      owner: "player",
      beforeCardIds,
      afterCardIds,
      stepCount: 1,
      stepDurationMs: 220
    });
    expect(afterCardIds).not.toEqual(beforeCardIds);
    expect(afterCardIds.slice().sort()).toEqual(beforeCardIds.slice().sort());
    expect(storedSnapshot.phase).toBe(CST.GAME_PHASE.PLAYER_DRAW);
    expect(storedSnapshot.turn).toBe("player");
    expect(storedSnapshot.players.bot.hand.map((card) => card.id)).toEqual([
      "hot-potato-pete",
      "5_clubs"
    ]);
  });
});
