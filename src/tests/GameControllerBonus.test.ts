import { beforeEach, describe, expect, it } from "vitest";
import { GameController } from "../model/GameController";
import { CST } from "../CST";
import { CardFactory } from "../model/CardFactory";
import { GameStateModel } from "../model/GameStateModel";
import { RunModel } from "../model/RunModel";
import { setSnapshot } from "./GameControllerFixtures";

describe("GameControllerBonus", () => {
  beforeEach(() => GameController.resetForTests());

  it("draws the exact opponent card selected by id after a shuffle", () => {
    setSnapshot({
      seed: 1,
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
          hand: [
            CardFactory.createCard("2", "clubs"),
            CardFactory.createHotPotatoPete(),
            CardFactory.createCard("3", "clubs")
          ]
        }
      },
      discardPile: [],
      turn: "player",
      winner: null,
      loser: null,
      lastEvent: ""
    });

    const result = GameController.playerDrawById("hot-potato-pete");
    const storedSnapshot = GameStateModel.getInstance().requireSnapshot();

    expect(result.drawnCard.id).toBe("hot-potato-pete");
    expect(storedSnapshot.players.player.hand.map((card) => card.id)).toEqual([
      "4_clubs",
      "hot-potato-pete"
    ]);
    expect(storedSnapshot.players.bot.hand.map((card) => card.id)).toEqual([
      "2_clubs",
      "3_clubs"
    ]);
  });

  it("awards and clears the marked shuffle card bonus on the next player draw", () => {
    RunModel.getInstance().startNewRun();
    setSnapshot({
      seed: 1,
      phase: CST.GAME_PHASE.PLAYER_DRAW,
      players: {
        player: {
          id: "player",
          name: "You",
          hand: [CardFactory.createCard("7", "hearts")]
        },
        bot: {
          id: "bot",
          name: "Peter",
          hand: [
            CardFactory.createCard("2", "clubs"),
            CardFactory.createHotPotatoPete(),
            CardFactory.createCard("4", "clubs")
          ]
        }
      },
      discardPile: [],
      turn: "player",
      winner: null,
      loser: null,
      lastEvent: "",
      shuffleBonusCardId: "2_clubs"
    });

    const result = GameController.playerDrawById("2_clubs");
    const storedSnapshot = GameStateModel.getInstance().requireSnapshot();

    expect(result.bonusScore).toBe(RunModel.MARKED_CARD_BONUS);
    expect(RunModel.getInstance().getState().currentScore).toBe(RunModel.MARKED_CARD_BONUS);
    expect(result.snapshot.shuffleBonusCardId).toBeUndefined();
    expect(storedSnapshot.shuffleBonusCardId).toBeUndefined();
  });

  it("clears the marked shuffle card bonus when another card is drawn", () => {
    RunModel.getInstance().startNewRun();
    setSnapshot({
      seed: 1,
      phase: CST.GAME_PHASE.PLAYER_DRAW,
      players: {
        player: {
          id: "player",
          name: "You",
          hand: [CardFactory.createCard("7", "hearts")]
        },
        bot: {
          id: "bot",
          name: "Peter",
          hand: [
            CardFactory.createCard("2", "clubs"),
            CardFactory.createHotPotatoPete(),
            CardFactory.createCard("4", "clubs")
          ]
        }
      },
      discardPile: [],
      turn: "player",
      winner: null,
      loser: null,
      lastEvent: "",
      shuffleBonusCardId: "2_clubs"
    });

    const result = GameController.playerDrawById("4_clubs");
    const storedSnapshot = GameStateModel.getInstance().requireSnapshot();

    expect(result.bonusScore).toBeUndefined();
    expect(RunModel.getInstance().getState().currentScore).toBe(0);
    expect(storedSnapshot.shuffleBonusCardId).toBeUndefined();
  });
});
