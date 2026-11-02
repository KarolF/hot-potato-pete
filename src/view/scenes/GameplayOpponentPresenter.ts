import { CST } from "../../CST";
import { GameController } from "../../model/GameController";
import { GameSnapshot } from "../../model/interfaces";
import { StatsModel } from "../../model/StatsModel";
import { PokiBridge } from "../../utils/PokiBridge";
import type { GameplayScreen } from "./GameplayScreen";

export class GameplayOpponentPresenter {
  private renderedMatchNumber: number | null = null;
  private sunglassesLockedForMatch = false;

  constructor(private readonly screen: GameplayScreen) {}

  public renderOpponent(snapshot: GameSnapshot): void {
    const opponent = GameController.getOpponent(snapshot);
    if (opponent.matchNumber !== this.renderedMatchNumber) {
      this.renderedMatchNumber = opponent.matchNumber;
      this.sunglassesLockedForMatch = false;
    }
    this.screen.peterFace.setOpponent(opponent);
    this.updatePeterScan(snapshot);
  }

  public showFirstOpponentHintIfNeeded(): boolean {
    const snapshot = this.screen.getCurrentSnapshot();
    if (!snapshot || snapshot.phase === CST.GAME_PHASE.GAME_OVER) {
      return false;
    }

    const opponent = GameController.getOpponent(snapshot);
    if (this.screen.firstGameplayTutorial.isRunning()) return false;
    if (snapshot.firstGameplayTutorial && !StatsModel.getInstance().hasSeenTutorial()) {
      return false;
    }
    if (StatsModel.getInstance().hasSeenOpponentHint(opponent.id)) return false;

    StatsModel.getInstance().markOpponentHintSeen(opponent.id);
    PokiBridge.gameplayStop(this.screen);
    this.screen.opponentHintOverlay.show(opponent.name, opponent.hintText, {
      x: 0,
      y: this.screen.screenLayout.opponentFaceRestY
    });
    this.screen.refreshInput();
    return true;
  }

  public updatePeterScan(snapshot: GameSnapshot): void {
    if (this.screen.isWaitingForAnimation || snapshot.phase === CST.GAME_PHASE.GAME_OVER) {
      this.screen.peterFace.stopScanning();
      this.screen.peterFace.setSunglassesVisible(this.sunglassesLockedForMatch);
      return;
    }
    if (this.screen.firstGameplayTutorial.controlsPeterFocus()) return;

    const showHotPotatoPeteTell = GameController.shouldShowHotPotatoPeteTell(snapshot);
    const shouldShowSunglasses =
      snapshot.players.bot.hand.some((card) => card.isHotPotatoPete) && !showHotPotatoPeteTell;
    if (shouldShowSunglasses) {
      this.sunglassesLockedForMatch = true;
    }
    const scanTargets = this.screen.botHand.getCardScanTargets().map((target) => ({
      ...target,
      showHotPotatoPeteTell: target.cardId !== CST.CARD_RULES.HOT_POTATO_PETE.ID || showHotPotatoPeteTell
    }));

    this.screen.peterFace.startScanning(scanTargets);
    this.screen.peterFace.setSunglassesVisible(this.sunglassesLockedForMatch);
  }

}
