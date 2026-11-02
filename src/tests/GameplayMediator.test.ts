import { beforeEach, describe, expect, it } from "vitest";
import { CST } from "../CST";
import { GameplayMediator, GameplayView } from "../mediators/GameplayMediator";
import { CardFactory } from "../model/CardFactory";
import { GameController } from "../model/GameController";
import { GameStateModel } from "../model/GameStateModel";
import { DrawResult, GameSnapshot, HandShuffle } from "../model/interfaces";
import { RunModel, RunState } from "../model/RunModel";
import { Utils } from "../utils/Utils";

class FakeGameplayView implements GameplayView {
  public runStates: RunState[] = [];
  public gameOverSnapshots: GameSnapshot[] = [];

  public renderSnapshot(): void {
    return;
  }

  public renderRunState(state: RunState): void {
    this.runStates.push(state);
  }

  public setStatus(): void {
    return;
  }

  public showPlayerDraw(_result: DrawResult, _sourceIndex: number, onComplete: () => void): void {
    onComplete();
  }

  public showBotDraw(_result: DrawResult, _sourceIndex: number, onComplete: () => void): void {
    onComplete();
  }

  public showPlayerHandShuffle(
    _snapshot: GameSnapshot,
    _shuffle: HandShuffle,
    onComplete: () => void
  ): void {
    onComplete();
  }

  public showGameOver(snapshot: GameSnapshot): void {
    this.gameOverSnapshots.push(snapshot);
  }

  public delay(_ms: number, callback: () => void): void {
    callback();
  }
}

class DeferredGameplayView extends FakeGameplayView {
  public finishDraw = () => undefined as void;
  public finishDelay = () => undefined as void;

  public override showPlayerDraw(_result: DrawResult, _index: number, onComplete: () => void): void {
    this.finishDraw = onComplete;
  }

  public override delay(_ms: number, callback: () => void): void {
    this.finishDelay = callback;
  }
}

function createWinningPlayerDrawSnapshot(firstGameplayTutorial: boolean): GameSnapshot {
  return {
    seed: firstGameplayTutorial ? 1101 : 1102,
    phase: CST.GAME_PHASE.PLAYER_DRAW,
    players: {
      player: {
        id: "player",
        name: CST.STRINGS.PLAYER,
        hand: [CardFactory.createCard("2", "diamonds")]
      },
      bot: {
        id: "bot",
        name: CST.STRINGS.BOT,
        hand: [CardFactory.createCard("2", "hearts")]
      }
    },
    discardPile: [],
    turn: "player",
    winner: null,
    loser: null,
    lastEvent: "",
    opponent: GameController.startNewGame(999, 1).opponent,
    firstGameplayTutorial
  };
}

describe("GameplayMediator", () => {
  beforeEach(() => {
    GameplayMediator.getInstance().destroy();
    GameController.resetForTests();
    RunModel.getInstance().startNewRun();
  });

  it("ignores a draw completion from a stopped view after reinitialization", () => {
    const mediator = GameplayMediator.getInstance();
    const oldView = new DeferredGameplayView();
    const first = GameController.startNewGame(42);
    mediator.init(oldView);
    mediator.onOpponentCardSelected(first.players.bot.hand[0].id, 0);
    mediator.destroy();
    const replacement = GameController.startNewGame(43);
    const newView = new DeferredGameplayView();
    mediator.init(newView);
    oldView.finishDraw();
    oldView.finishDelay();
    expect(GameStateModel.getInstance().requireSnapshot()).toEqual(replacement);
    expect(newView.gameOverSnapshots).toHaveLength(0);
  });

  it("ignores an old scheduled bot turn after a new match starts", () => {
    const mediator = GameplayMediator.getInstance();
    const oldView = new DeferredGameplayView();
    const first = GameController.startNewGame(42);
    mediator.init(oldView);
    mediator.onOpponentCardSelected(first.players.bot.hand[0].id, 0);
    oldView.finishDraw();
    expect(GameStateModel.getInstance().requireSnapshot().phase).toBe(CST.GAME_PHASE.BOT_DRAW);
    mediator.destroy();
    const replacement = GameController.startNewGame(44);
    mediator.init(new DeferredGameplayView());
    oldView.finishDelay();
    expect(GameStateModel.getInstance().requireSnapshot()).toEqual(replacement);
  });

  it("does not advance the run after the tutorial match is won", () => {
    const mediator = GameplayMediator.getInstance();
    const view = new FakeGameplayView();
    const tutorialSnapshot = createWinningPlayerDrawSnapshot(true);

    Utils.seed(tutorialSnapshot.seed, CST.GAMEPLAY.RNG_NAME);
    GameStateModel.getInstance().setSnapshot(tutorialSnapshot);
    mediator.init(view);
    mediator.onOpponentCardSelected("2_hearts", 0);

    const runState = RunModel.getInstance().getState();
    expect(view.gameOverSnapshots[view.gameOverSnapshots.length - 1]?.winner).toBe("player");
    expect(runState.matchNumber).toBe(1);
    expect(runState.currentScore).toBe(0);

    const nextSnapshot = GameController.startNewGame(1201, runState.matchNumber);
    expect(nextSnapshot.opponent).toMatchObject({
      id: "marked_martha",
      matchNumber: 1
    });
    expect(nextSnapshot.firstGameplayTutorial).toBe(false);
  });

  it("advances from Martha to Slim after a normal first match win", () => {
    const mediator = GameplayMediator.getInstance();
    const view = new FakeGameplayView();
    const normalSnapshot = createWinningPlayerDrawSnapshot(false);

    Utils.seed(normalSnapshot.seed, CST.GAMEPLAY.RNG_NAME);
    GameStateModel.getInstance().setSnapshot(normalSnapshot);
    mediator.init(view);
    mediator.onOpponentCardSelected("2_hearts", 0);

    const runState = RunModel.getInstance().getState();
    expect(view.gameOverSnapshots[view.gameOverSnapshots.length - 1]?.winner).toBe("player");
    expect(runState.matchNumber).toBe(2);
    expect(runState.currentScore).toBe(RunModel.WIN_BONUS);

    const nextSnapshot = GameController.startNewGame(1202, runState.matchNumber);
    expect(nextSnapshot.opponent).toMatchObject({
      id: "slim_mcsleeves",
      matchNumber: 2
    });
  });
});
