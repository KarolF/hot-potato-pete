import { GameplayOpponentPresenter } from "./GameplayOpponentPresenter";
import { GameplayHud } from "./GameplayHud";
import { GameplayResultPresenter } from "./GameplayResultPresenter";
import { GameplayInputMediator } from "../../mediators/GameplayInputMediator";
import { AnimationCancelledError } from "../../utils/AnimationCancelledError";
import { BaseScreen } from "./BaseScreen";
import { CST } from "../../CST";
import { AnimationMediator } from "../../mediators/AnimationMediator";
import { GameplayMediator, GameplayView } from "../../mediators/GameplayMediator";
import { GameController } from "../../model/GameController";
import {
  DrawResult,
  GameSnapshot,
  HandShuffle,
  Point
} from "../../model/interfaces";
import { RunModel, RunState } from "../../model/RunModel";
import { PokiBridge } from "../../utils/PokiBridge";
import { CustomButton } from "../components/CustomButton";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { DiscardPile } from "../components/DiscardPile";
import { GameplayTutorialOverlay } from "../components/GameplayTutorialOverlay";
import { HandView } from "../components/HandView";
import { HowToPlayModal } from "../components/HowToPlayModal";
import { OpponentHintOverlay } from "../components/OpponentHintOverlay";
import { PeterFaceView } from "../components/PeterFaceView";
import { SettingsModal } from "../components/SettingsModal";
import { TurnBanner } from "../components/TurnBanner";
import {
  GameplayScreenFactory,
  GameplayScreenLayout
} from "./GameplayScreenFactory";
import { FirstGameplayTutorial } from "./FirstGameplayTutorial";

export class GameplayScreen extends BaseScreen implements GameplayView {
  private static readonly layout: GameplayScreenLayout = {
    botHandRestY: -239,
    playerHandRestY: 281,
    opponentFaceRestY: -370,
    pairPanelRestY: 72
  };
  public hud!: GameplayHud;
  private opponentPresenter!: GameplayOpponentPresenter;
  private resultPresenter!: GameplayResultPresenter;
  private inputMediator!: GameplayInputMediator;
  private mediator = GameplayMediator.getInstance();
  public animationMediator!: AnimationMediator;
  public playerHand!: HandView;
  public botHand!: HandView;
  public discardPile!: DiscardPile;
  public turnBanner!: TurnBanner;
  public peterFace!: PeterFaceView;
  private gameplayButtons: CustomButton[] = [];
  public settingsModal!: SettingsModal;
  public confirmationModal!: ConfirmationModal;
  public howToPlayModal!: HowToPlayModal;
  public opponentHintOverlay!: OpponentHintOverlay;
  private gameplayTutorialOverlay!: GameplayTutorialOverlay;
  public firstGameplayTutorial!: FirstGameplayTutorial;
  private currentSnapshot: GameSnapshot | null = null;
  private currentRunState: RunState = RunModel.getInstance().getState();
  private waitingForAnimation = true;

  constructor() {
    super("GameplayScreen");
  }

  public get screenLayout(): GameplayScreenLayout {
    return GameplayScreen.layout;
  }

  public get runState(): RunState {
    return this.currentRunState;
  }

  protected createGameObjects(): void {
    this.currentSnapshot = null;
    this.waitingForAnimation = true;
    this.gameplayButtons = [];
    this.createScreenParts();
    this.firstGameplayTutorial = new FirstGameplayTutorial(this, this.gameplayTutorialOverlay);
    this.animationMediator = new AnimationMediator(this);
    this.inputMediator = new GameplayInputMediator(this);
    this.resultPresenter = new GameplayResultPresenter(this);
    this.opponentPresenter = new GameplayOpponentPresenter(this);
    this.events.once("shutdown", () => {
      this.firstGameplayTutorial.destroy();
      this.mediator.destroy();
    });
    this.mediator.init(this);
  }

  protected setupButtonHandlers(): void {
    return;
  }

  private createScreenParts(): void {
    const parts = GameplayScreenFactory.create(this);

    this.peterFace = parts.peterFace;
    this.turnBanner = parts.turnBanner;
    this.discardPile = parts.discardPile;
    this.gameplayButtons = parts.gameplayButtons;
    this.botHand = parts.botHand;
    this.playerHand = parts.playerHand;
    this.settingsModal = parts.settingsModal;
    this.confirmationModal = parts.confirmationModal;
    this.howToPlayModal = parts.howToPlayModal;
    this.opponentHintOverlay = parts.opponentHintOverlay;
    this.gameplayTutorialOverlay = parts.gameplayTutorialOverlay;
    this.hud = new GameplayHud(this, parts);
    this.hud.updateScoreHud();
  }

  public renderSnapshot(snapshot: GameSnapshot): void {
    this.currentSnapshot = snapshot;
    const botFaceUp = snapshot.phase === CST.GAME_PHASE.GAME_OVER;
    const botSelectable =
      snapshot.phase === CST.GAME_PHASE.PLAYER_DRAW && !this.waitingForAnimation;

    this.botHand.render(snapshot.players.bot.hand, {
      faceUp: botFaceUp,
      selectable: botSelectable,
      availableWidth: 520
    });

    this.playerHand.render(snapshot.players.player.hand, {
      faceUp: true,
      selectable: false,
      availableWidth: 540
    });

    this.discardPile.setCount(snapshot.discardPile.length);
    this.opponentPresenter.renderOpponent(snapshot);
    this.turnBanner.setText(snapshot.lastEvent);
  }

  public renderRunState(state: RunState): void {
    this.currentRunState = state;
    this.hud.updateScoreHud();
  }

  public setStatus(text: string): void {
    this.turnBanner.setText(text);
    if (this.currentSnapshot) {
      this.currentSnapshot.lastEvent = text;
    }
    this.refreshInput();
    this.firstGameplayTutorial.handleTurnReady(this.currentSnapshot);
  }

  public showPlayerDraw(result: DrawResult, sourceIndex: number, onComplete: () => void): void {
    void this.animationMediator.animatePlayerDraw(result, sourceIndex, onComplete).catch(this.handleAnimationError);
  }

  public showBotDraw(result: DrawResult, sourceIndex: number, onComplete: () => void): void {
    void this.animationMediator.animateBotDraw(result, sourceIndex, onComplete).catch(this.handleAnimationError);
  }

  public showPlayerHandShuffle(
    snapshot: GameSnapshot,
    shuffle: HandShuffle,
    onComplete: () => void
  ): void {
    void this.animationMediator.animatePlayerHandShuffle(snapshot, shuffle, onComplete).catch(this.handleAnimationError);
  }

  public handleAnimationError(error: unknown): void {
    if (!(error instanceof AnimationCancelledError)) console.error("Gameplay animation failed", error);
  }

  public setWaitingForAnimation(waiting: boolean): void {
    this.waitingForAnimation = waiting;
  }

  public setCurrentSnapshot(snapshot: GameSnapshot): void {
    this.currentSnapshot = snapshot;
  }

  public getCurrentSnapshot(): GameSnapshot | null {
    return this.currentSnapshot;
  }

  public showSettingsModal(): void {
    PokiBridge.gameplayStop(this);
    this.settingsModal.show();
  }

  public handleOpponentHintClosed(): void {
    this.inputMediator.requestPokiGameplayStart();
    this.refreshInput();
    if (this.inputMediator.canSelectOpponentCard()) {
      this.botHand.pulseSelectable();
    }
  }

  public transitionToMenu(): void {
    PokiBridge.gameplayStop(this);
    void this.transitionToScene("CoverScreen");
  }

  public requestTransitionToMenu(): void {
    if (!this.shouldConfirmMenuTransition()) {
      this.transitionToMenu();
      return;
    }

    this.confirmationModal.show(
      CST.STRINGS.ARE_YOU_SURE,
      CST.STRINGS.ABANDON_RUN_CONFIRM,
      {
        onConfirm: () => this.transitionToMenu()
      }
    );
  }

  public delay(ms: number, callback: () => void): void {
    this.time.delayedCall(ms, callback);
  }

  public isReadyForInput(): boolean {
    return this.inputMediator.canSelectOpponentCard();
  }

  public areGameplayButtonsReadyForInput(): boolean {
    return (
      this.gameplayButtons.length > 0 &&
      this.gameplayButtons.every((button) => button.canReceiveInput())
    );
  }

  public showHowToPlay(): void {
    const opponent = GameController.getOpponent(this.currentSnapshot);
    this.howToPlayModal.setOpponentHint(opponent.name, opponent.hintText);
    PokiBridge.gameplayStop(this);
    this.howToPlayModal.show();
  }

  public handleGameplayModalClosed(): void {
    this.inputMediator.requestPokiGameplayStart();
    this.refreshInput();
  }

  private shouldConfirmMenuTransition(): boolean {
    if (!this.currentSnapshot) return false;

    return (
      this.currentSnapshot.phase !== CST.GAME_PHASE.GAME_OVER ||
      this.currentSnapshot.winner === "player"
    );
  }

  public get isWaitingForAnimation(): boolean { return this.waitingForAnimation; }
  public refreshInput(): void { this.inputMediator.refreshInput(); }
  public clearCardHover(): void { this.inputMediator.clearCardHover(); }
  public canSkipAnimation(): boolean { return this.inputMediator.canSkipAnimation(); }

  protected playEntranceAnimations(): void { this.hud.playEntranceAnimations(); }

  public handleEntranceComplete(): void {
    this.waitingForAnimation = false;
    if (this.currentSnapshot) this.updatePeterScan(this.currentSnapshot);
    this.inputMediator.requestPokiGameplayStart();
    this.refreshInput();
    if (this.currentSnapshot && this.firstGameplayTutorial.tryStart(this.currentSnapshot)) return;
    if (!this.opponentPresenter.showFirstOpponentHintIfNeeded()) this.botHand.pulseSelectable();
  }

  public showGameOver(snapshot: GameSnapshot): void { this.resultPresenter.showGameOver(snapshot); }
  public playNextMatch(): Promise<void> { return this.resultPresenter.playNextMatch(); }
  public getScoreHudStarTarget(): Point { return this.hud.getScoreHudStarTarget(); }
  public updatePeterScan(snapshot: GameSnapshot): void { this.opponentPresenter.updatePeterScan(snapshot); }
}
