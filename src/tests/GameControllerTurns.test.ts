import { beforeEach, describe, expect, it } from "vitest";
import { GameController } from "../model/GameController";
import { forcePlayerWin } from "../debug/DebugActions";
import { CST } from "../CST";
import { CardFactory } from "../model/CardFactory";
import { GameStateModel } from "../model/GameStateModel";
import { setSnapshot } from "./GameControllerFixtures";

describe("GameControllerTurns", () => {
  beforeEach(() => GameController.resetForTests());

  it("forces an active match into a player win for dev mode", () => {
    setSnapshot({
      seed: 301,
      phase: CST.GAME_PHASE.PLAYER_DRAW,
      players: {
        player: {
          id: "player",
          name: "You",
          hand: [CardFactory.createCard("4", "clubs")]
        },
        bot: {
          id: "bot",
          name: "Peter",
          hand: [CardFactory.createHotPotatoPete(), CardFactory.createCard("2", "clubs")]
        }
      },
      discardPile: [],
      turn: "player",
      winner: null,
      loser: null,
      lastEvent: ""
    });

    const forced = forcePlayerWin();
    const storedSnapshot = GameStateModel.getInstance().requireSnapshot();

    expect(forced).toMatchObject({
      phase: CST.GAME_PHASE.GAME_OVER,
      turn: "player",
      winner: "player",
      loser: "bot",
      lastEvent: CST.STRINGS.YOU_WIN
    });
    expect(storedSnapshot).toMatchObject({
      phase: CST.GAME_PHASE.GAME_OVER,
      winner: "player",
      loser: "bot"
    });
    expect(forcePlayerWin()).toBeNull();
  });

  it("allows a player draw and advances the turn", () => {
    let snapshot = GameController.startNewGame(7);

    if (snapshot.phase === CST.GAME_PHASE.GAME_OVER) {
      expect(snapshot.winner).not.toBeNull();
      return;
    }

    const result = GameController.playerDraw(0);
    snapshot = GameStateModel.getInstance().requireSnapshot();

    expect(result.drawnCard).toBeDefined();
    expect([CST.GAME_PHASE.BOT_DRAW, CST.GAME_PHASE.GAME_OVER]).toContain(snapshot.phase);
  });

  it("can execute a bot turn after a player draw", () => {
    let snapshot = GameController.startNewGame(99);

    if (snapshot.phase === CST.GAME_PHASE.GAME_OVER) {
      expect(snapshot.loser).not.toBeNull();
      return;
    }

    GameController.playerDraw(0);
    snapshot = GameStateModel.getInstance().requireSnapshot();

    if (snapshot.phase === CST.GAME_PHASE.GAME_OVER) {
      expect(snapshot.loser).not.toBeNull();
      return;
    }

    const result = GameController.botDraw();
    expect(result.drawnCard).toBeDefined();
    expect([CST.GAME_PHASE.PLAYER_DRAW, CST.GAME_PHASE.GAME_OVER]).toContain(result.snapshot.phase);
  });

  it("makes Peter take Hot Potato Pete from the player on the forced first draw when available", () => {
    setSnapshot({
      seed: 12,
      phase: CST.GAME_PHASE.BOT_DRAW,
      players: {
        player: {
          id: "player",
          name: "You",
          hand: [
            CardFactory.createCard("4", "clubs"),
            CardFactory.createHotPotatoPete(),
            CardFactory.createCard("5", "clubs")
          ]
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
      hotPotatoPeteBalance: {
        playerStartedWithHotPotatoPete: true,
        peterHasTakenHotPotatoPeteFromPlayer: false,
        peterDrawCount: 0,
        peterForceHotPotatoPeteDrawOnTurn: 1
      }
    });

    const snapshot = GameStateModel.getInstance().requireSnapshot();
    const forcedIndex = GameController.chooseBotCardIndex(snapshot.players.player.hand, snapshot);
    const result = GameController.draw("bot", "player", forcedIndex);

    expect(forcedIndex).toBe(1);
    expect(result.drawnCard.id).toBe("hot-potato-pete");
    expect(result.snapshot.hotPotatoPeteBalance?.peterHasTakenHotPotatoPeteFromPlayer).toBe(true);
    expect(result.snapshot.hotPotatoPeteBalance?.peterDrawCount).toBe(1);
    expect(result.snapshot.lastEvent).toBe(`Marked Martha ${CST.STRINGS.DREW_CARD}`);
  });

  it("can delay Peter taking Hot Potato Pete until the forced second draw", () => {
    setSnapshot({
      seed: 1,
      phase: CST.GAME_PHASE.BOT_DRAW,
      players: {
        player: {
          id: "player",
          name: "You",
          hand: [
            CardFactory.createCard("4", "clubs"),
            CardFactory.createHotPotatoPete(),
            CardFactory.createCard("5", "clubs")
          ]
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
      hotPotatoPeteBalance: {
        playerStartedWithHotPotatoPete: true,
        peterHasTakenHotPotatoPeteFromPlayer: false,
        peterDrawCount: 0,
        peterForceHotPotatoPeteDrawOnTurn: 2
      }
    });

    let snapshot = GameStateModel.getInstance().requireSnapshot();
    const firstIndex = GameController.chooseBotCardIndex(snapshot.players.player.hand, snapshot);
    expect(firstIndex).not.toBe(1);
    const firstResult = GameController.draw("bot", "player", firstIndex);
    expect(firstResult.drawnCard.id).not.toBe("hot-potato-pete");
    expect(firstResult.snapshot.hotPotatoPeteBalance?.peterDrawCount).toBe(1);
    expect(firstResult.snapshot.hotPotatoPeteBalance?.peterHasTakenHotPotatoPeteFromPlayer).toBe(false);

    setSnapshot({
      ...firstResult.snapshot,
      phase: CST.GAME_PHASE.BOT_DRAW,
      turn: "bot",
      lastEvent: ""
    });

    snapshot = GameStateModel.getInstance().requireSnapshot();
    const secondIndex = GameController.chooseBotCardIndex(snapshot.players.player.hand, snapshot);
    const secondResult = GameController.draw("bot", "player", secondIndex);

    expect(snapshot.players.player.hand[secondIndex].id).toBe("hot-potato-pete");
    expect(secondResult.drawnCard.id).toBe("hot-potato-pete");
    expect(secondResult.snapshot.hotPotatoPeteBalance?.peterDrawCount).toBe(2);
    expect(secondResult.snapshot.hotPotatoPeteBalance?.peterHasTakenHotPotatoPeteFromPlayer).toBe(true);
  });

  it("returns to normal bot choice after Peter already took Hot Potato Pete", () => {
    setSnapshot({
      seed: 15,
      phase: CST.GAME_PHASE.BOT_DRAW,
      players: {
        player: {
          id: "player",
          name: "You",
          hand: [CardFactory.createCard("4", "clubs"), CardFactory.createHotPotatoPete()]
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
      hotPotatoPeteBalance: {
        playerStartedWithHotPotatoPete: true,
        peterHasTakenHotPotatoPeteFromPlayer: true,
        peterDrawCount: 1,
        peterForceHotPotatoPeteDrawOnTurn: 1
      }
    });

    const snapshot = GameStateModel.getInstance().requireSnapshot();
    const index = GameController.chooseBotCardIndex(snapshot.players.player.hand, snapshot);

    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(snapshot.players.player.hand.length);
  });
});
