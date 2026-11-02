import { CST } from "../../CST";
import { GameController } from "../../model/GameController";
import { GameStateModel } from "../../model/GameStateModel";
import { GameSnapshot } from "../../model/interfaces";
import { StatsModel } from "../../model/StatsModel";
import { GameplayTutorialOverlay } from "../components/GameplayTutorialOverlay";
import type { CardScanTarget } from "../components/HandView";
import type { GameplayScreen } from "./GameplayScreen";
import { TutorialPeterCueController } from "./TutorialPeterCueController";

export type FirstGameplayTutorialStage =
  | "inactive"
  | "first_pick"
  | "waiting_for_turn"
  | "eye_intro"
  | "hot-potato-pete-intro"
  | "second_pick"
  | "complete";

export class FirstGameplayTutorial {
  private stage: FirstGameplayTutorialStage = "inactive";
  private targetCardId: string | null = null;
  private eyeIntroTimer?: Phaser.Time.TimerEvent;
  private readonly peterCue: TutorialPeterCueController;

  constructor(private readonly screen: GameplayScreen, private readonly overlay: GameplayTutorialOverlay) {
    this.peterCue = new TutorialPeterCueController(screen);
  }

  public tryStart(snapshot: GameSnapshot): boolean {
    if (!this.canStart(snapshot)) return false;

    const target = this.findNonHotPotatoPeteTarget();
    if (!target) return false;

    const opponent = GameController.getOpponent(snapshot);
    StatsModel.getInstance().markOpponentHintSeen(opponent.id);
    this.stage = "first_pick";
    this.targetCardId = target.cardId;
    this.overlay.showMovingCardTarget(target, "", "right");
    this.screen.refreshInput();
    return true;
  }

  public handleTurnReady(snapshot: GameSnapshot | null): void {
    if (!snapshot || this.stage !== "waiting_for_turn") return;
    if (snapshot.phase !== CST.GAME_PHASE.PLAYER_DRAW) return;
    this.startEyeIntro(snapshot);
  }

  public handleOpponentCardSelected(cardId: string, snapshot: GameSnapshot | null): boolean {
    if (this.stage === "inactive" || this.stage === "complete") return true;
    if (this.stage !== "first_pick" && this.stage !== "second_pick") return false;
    if (cardId !== this.targetCardId) return false;

    if (this.stage === "first_pick") {
      this.stage = "waiting_for_turn";
      this.targetCardId = null;
      this.overlay.hide();
      return true;
    }

    this.complete(snapshot);
    return true;
  }

  public allowsOpponentCard(cardId: string): boolean {
    if (this.stage === "inactive" || this.stage === "complete") return true;
    if (this.stage !== "first_pick" && this.stage !== "second_pick") return false;
    return cardId === this.targetCardId;
  }

  public blocksCardSelection(): boolean {
    return this.stage === "waiting_for_turn" ||
      this.stage === "eye_intro" ||
      this.stage === "hot-potato-pete-intro";
  }

  public controlsPeterFocus(): boolean {
    return this.stage === "eye_intro" ||
      this.stage === "hot-potato-pete-intro" ||
      this.stage === "second_pick";
  }

  public isRunning(): boolean {
    return this.stage !== "inactive" && this.stage !== "complete";
  }

  public getStage(): FirstGameplayTutorialStage {
    return this.stage;
  }

  public getTargetCardId(): string {
    return this.targetCardId ?? "";
  }

  public isVisible(): boolean {
    return this.overlay.visible;
  }

  public getTextContent(): string {
    return this.overlay.getTextContent();
  }

  public getArrowStates() {
    return this.overlay.getArrowStates();
  }

  public destroy(): void {
    this.clearTimer();
    this.peterCue.stop();
    this.overlay.hide();
  }

  private canStart(snapshot: GameSnapshot): boolean {
    const opponent = GameController.getOpponent(snapshot);

    return Boolean(
      snapshot.firstGameplayTutorial &&
        !StatsModel.getInstance().hasSeenTutorial() &&
        opponent.matchNumber === 1 &&
        snapshot.phase === CST.GAME_PHASE.PLAYER_DRAW &&
        snapshot.players.bot.hand.some((card) => card.isHotPotatoPete)
    );
  }

  private startEyeIntro(snapshot: GameSnapshot): void {
    const preparedSnapshot = this.prepareSecondTurnHand(snapshot);
    if (!preparedSnapshot) {
      this.complete(snapshot);
      return;
    }

    const hotPotatoPeteFocusTarget = this.findHotPotatoPeteCenterTarget();
    const secondTarget = this.findNonHotPotatoPeteTarget();
    if (!hotPotatoPeteFocusTarget || !secondTarget) {
      this.complete(preparedSnapshot);
      return;
    }

    this.stage = "eye_intro";
    this.targetCardId = secondTarget.cardId;
    this.overlay.showEyeTarget(
      this.screen.peterFace.getEyesCenterPoint(),
      this.getHintText(preparedSnapshot)
    );
    this.peterCue.start(hotPotatoPeteFocusTarget);
    this.screen.refreshInput();
    this.clearTimer();
    this.eyeIntroTimer = this.screen.time.delayedCall(
      CST.GAMEPLAY.FIRST_TUTORIAL_CUE_MS,
      () => this.startHotPotatoPeteIntro()
    );
  }

  private startHotPotatoPeteIntro(): void {
    if (this.stage !== "eye_intro") return;

    const target = this.findHotPotatoPeteEdgeTarget();
    const snapshot = this.screen.getCurrentSnapshot();
    if (!target || !snapshot) {
      this.complete(snapshot);
      return;
    }

    this.stage = "hot-potato-pete-intro";
    this.overlay.showWrongCardTarget(target, this.getHintText(snapshot), "left");
    this.screen.refreshInput();
    this.clearTimer();
    this.eyeIntroTimer = this.screen.time.delayedCall(
      CST.GAMEPLAY.FIRST_TUTORIAL_CUE_MS,
      () => this.startSecondPick()
    );
  }

  private startSecondPick(): void {
    if (this.stage !== "hot-potato-pete-intro") return;

    const target = this.findTargetById(this.targetCardId);
    const snapshot = this.screen.getCurrentSnapshot();
    if (!target || !snapshot) {
      this.complete(snapshot);
      return;
    }

    this.stage = "second_pick";
    this.peterCue.stop();
    this.screen.peterFace.stopScanning();
    this.overlay.showMovingCardTarget(target, CST.STRINGS.TUTORIAL_CLICK_THAT_CARD, "right");
    this.screen.refreshInput();
  }

  private complete(snapshot: GameSnapshot | null): void {
    this.clearTimer();
    this.peterCue.stop();
    this.stage = "complete";
    this.targetCardId = null;
    this.overlay.hide();
    StatsModel.getInstance().markTutorialSeen();
    if (snapshot) {
      this.screen.updatePeterScan(snapshot);
    }
    this.screen.refreshInput();
  }

  private findHotPotatoPeteEdgeTarget(): CardScanTarget | null {
    const snapshot = this.screen.getCurrentSnapshot();
    if (!snapshot) return null;

    const hotPotatoPeteIndex = snapshot.players.bot.hand.findIndex((card) => card.isHotPotatoPete);
    return hotPotatoPeteIndex >= 0
      ? this.getCardTarget(hotPotatoPeteIndex, "left")
      : null;
  }

  private findHotPotatoPeteCenterTarget(): CardScanTarget | null {
    return this.screen.botHand.getCardScanTargets().find(
      (target) => target.cardId === CST.CARD_RULES.HOT_POTATO_PETE.ID
    ) ?? null;
  }

  private findNonHotPotatoPeteTarget(): CardScanTarget | null {
    const snapshot = this.screen.getCurrentSnapshot();
    if (!snapshot) return null;

    for (let index = snapshot.players.bot.hand.length - 1; index >= 0; index--) {
      if (!snapshot.players.bot.hand[index].isHotPotatoPete) {
        return this.getCardTarget(index, "right");
      }
    }

    return null;
  }

  private findTargetById(cardId: string | null): CardScanTarget | null {
    if (!cardId) return null;
    const snapshot = this.screen.getCurrentSnapshot();
    const index = snapshot?.players.bot.hand.findIndex((card) => card.id === cardId) ?? -1;
    return index >= 0 ? this.getCardTarget(index, "right") : null;
  }

  private getCardTarget(index: number, edge: "left" | "right"): CardScanTarget | null {
    const snapshot = this.screen.getCurrentSnapshot();
    const card = snapshot?.players.bot.hand[index];
    if (!card) return null;

    const edgePoint = this.screen.botHand.getCardHitPoints(index, [
      {
        x: edge === "left" ? 0.02 : 0.98,
        y: 0.5
      }
    ])[0];
    const centerPoint = this.screen.botHand.getCardScanTargets()[index];
    const point = edgePoint ?? centerPoint;
    if (!point) return null;

    return {
      cardId: card.id,
      x: point.x,
      y: point.y
    };
  }

  private prepareSecondTurnHand(snapshot: GameSnapshot): GameSnapshot | null {
    const hotPotatoPete = snapshot.players.bot.hand.find((card) => card.isHotPotatoPete);
    const target = snapshot.players.bot.hand.slice().reverse().find((card) => !card.isHotPotatoPete);
    if (!hotPotatoPete || !target) return null;

    const middleCards = snapshot.players.bot.hand.filter(
      (card) => card.id !== hotPotatoPete.id && card.id !== target.id
    );
    const preparedSnapshot: GameSnapshot = {
      ...snapshot,
      players: {
        ...snapshot.players,
        bot: {
          ...snapshot.players.bot,
          hand: [hotPotatoPete, ...middleCards, target]
        }
      }
    };

    GameStateModel.getInstance().setSnapshot(preparedSnapshot);
    this.screen.renderSnapshot(preparedSnapshot);
    return preparedSnapshot;
  }

  private getHintText(snapshot: GameSnapshot): string {
    const opponent = GameController.getOpponent(snapshot);
    return `${opponent.name}: ${opponent.hintText}`;
  }

  private clearTimer(): void {
    this.eyeIntroTimer?.remove(false);
    this.eyeIntroTimer = undefined;
  }
}
