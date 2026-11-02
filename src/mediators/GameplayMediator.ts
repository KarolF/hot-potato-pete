import { CST } from "../CST";
import { GameController } from "../model/GameController";
import { GameStateModel } from "../model/GameStateModel";
import { DrawResult, GameSnapshot, HandShuffle } from "../model/interfaces";
import { RunModel, RunState } from "../model/RunModel";
import { SoundPlayer } from "../view/SoundPlayer";

export interface GameplayView {
  renderSnapshot(snapshot: GameSnapshot): void;
  renderRunState(state: RunState): void;
  setStatus(text: string): void;
  showPlayerDraw(result: DrawResult, sourceIndex: number, onComplete: () => void): void;
  showBotDraw(result: DrawResult, sourceIndex: number, onComplete: () => void): void;
  showPlayerHandShuffle(snapshot: GameSnapshot, shuffle: HandShuffle, onComplete: () => void): void;
  showGameOver(snapshot: GameSnapshot): void;
  delay(ms: number, callback: () => void): void;
}

export class GameplayMediator {
  private static instance: GameplayMediator;
  private view?: GameplayView;
  private destroyed = false;
  private botThinking = false;
  private botTurnToken = 0;

  private constructor() {}

  public static getInstance(): GameplayMediator {
    if (!GameplayMediator.instance) {
      GameplayMediator.instance = new GameplayMediator();
    }
    return GameplayMediator.instance;
  }

  public init(view: GameplayView): void {
    const gameState = GameStateModel.getInstance();
    const runModel = RunModel.getInstance();

    this.view = view;
    this.destroyed = false;
    this.botThinking = false;
    this.botTurnToken += 1;

    let snapshot = gameState.getSnapshot();
    if (!snapshot) {
      runModel.startNewRun();
      snapshot = GameController.startNewGame();
    } else if (!runModel.getState().runActive && snapshot.phase !== CST.GAME_PHASE.GAME_OVER) {
      runModel.continueRun();
    }

    view.renderRunState(runModel.getState());
    view.renderSnapshot(snapshot);
    if (snapshot.phase === CST.GAME_PHASE.GAME_OVER) {
      view.showGameOver(snapshot);
    } else {
      const opponent = GameController.getOpponent(snapshot);
      const statusText = GameController.getYourTurnText(opponent.name);
      view.setStatus(statusText);
    }
  }

  public onOpponentCardSelected(cardId: string, sourceIndex: number): void {
    const view = this.view;
    if (this.destroyed || !view || this.botThinking) return;

    const gameState = GameStateModel.getInstance();
    const snapshot = gameState.getSnapshot();
    if (!snapshot || snapshot.phase !== CST.GAME_PHASE.PLAYER_DRAW) return;
    if (!snapshot.players.bot.hand.some((card) => card.id === cardId)) {
      view.renderSnapshot(snapshot);
      return;
    }

    const result = GameController.playerDrawById(cardId);
    const turnToken = this.botTurnToken;
    const soundPlayer = SoundPlayer.getInstance();
    if (result.bonusScore) {
      view.renderRunState(RunModel.getInstance().getState());
    }
    soundPlayer.play(CST.AUDIO.SND_CARD_CLICK);
    soundPlayer.play(CST.AUDIO.SND_CARD_PASS);
    view.showPlayerDraw(result, sourceIndex, () => {
      if (this.destroyed || !this.view || turnToken !== this.botTurnToken) return;
      this.afterDraw(result);
    });
  }

  public onPlayerHandShuffleRequested(): void {
    const view = this.view;
    if (this.destroyed || !view || this.botThinking) return;

    const gameState = GameStateModel.getInstance();
    const snapshot = gameState.getSnapshot();
    if (!snapshot || snapshot.phase !== CST.GAME_PHASE.PLAYER_DRAW) return;

    const shuffle = GameController.shufflePlayerHand();
    if (!shuffle) return;

    const shuffledSnapshot = gameState.requireSnapshot();
    view.showPlayerHandShuffle(shuffledSnapshot, shuffle, () => undefined);
  }

  public destroy(): void {
    this.destroyed = true;
    this.botTurnToken += 1;
    this.view = undefined;
  }

  private afterDraw(result: DrawResult): void {
    const view = this.view;
    if (!view) return;

    if (result.gameOver) {
      this.finishGame(result.snapshot);
      return;
    }

    if (result.snapshot.phase === CST.GAME_PHASE.BOT_DRAW) {
      this.scheduleBotTurn();
    } else {
      const opponent = GameController.getOpponent(result.snapshot);
      const statusText = GameController.getYourTurnText(opponent.name);
      view.setStatus(statusText);
    }
  }

  private scheduleBotTurn(): void {
    const view = this.view;
    if (!view) return;

    const gameState = GameStateModel.getInstance();
    const soundPlayer = SoundPlayer.getInstance();
    const turnToken = ++this.botTurnToken;

    this.botThinking = true;
    const currentSnapshot = gameState.getSnapshot();
    const opponent = GameController.getOpponent(currentSnapshot);
    const statusText = GameController.getBotTurnText(opponent.name);
    view.setStatus(statusText);

    view.delay(CST.GAMEPLAY.BOT_THINK_DELAY_MS, () => {
      if (this.destroyed || !this.view || turnToken !== this.botTurnToken) return;
      const snapshot = gameState.getSnapshot();
      if (!snapshot || snapshot.phase !== CST.GAME_PHASE.BOT_DRAW) {
        this.botThinking = false;
        return;
      }

      const index = GameController.chooseBotCardIndex(snapshot.players.player.hand, snapshot);
      const result = GameController.draw("bot", "player", index);
      this.botThinking = false;
      soundPlayer.play(CST.AUDIO.SND_CARD_PASS);
      this.view.showBotDraw(result, index, () => {
        if (this.destroyed || !this.view || turnToken !== this.botTurnToken) return;
        this.afterDraw(result);
      });
    });
  }

  private finishGame(snapshot: GameSnapshot): void {
    const view = this.view;
    if (!view) return;

    const runModel = RunModel.getInstance();
    if (snapshot.firstGameplayTutorial) {
      view.renderRunState(runModel.getState());
      view.showGameOver(snapshot);
      return;
    }

    if (snapshot.winner === "player") {
      view.renderRunState(runModel.recordWin());
    } else {
      view.renderRunState(runModel.recordLoss());
    }
    view.showGameOver(snapshot);
  }
}
