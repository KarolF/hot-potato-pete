import { CST } from "../../CST";
import { GameController } from "../../model/GameController";
import { GameSnapshot } from "../../model/interfaces";
import { RunModel } from "../../model/RunModel";
import { PokiBridge } from "../../utils/PokiBridge";
import { CustomButton } from "../components/CustomButton";
import { SoundPlayer } from "../SoundPlayer";
import { GameplayScreenFactory } from "./GameplayScreenFactory";
import type { GameplayScreen } from "./GameplayScreen";

export class GameplayResultPresenter {
  private startingNextMatch = false;

  constructor(private readonly screen: GameplayScreen) {}

  public showGameOver(snapshot: GameSnapshot): void {
    PokiBridge.gameplayStop(this.screen);
    this.screen.setWaitingForAnimation(true);
    this.screen.peterFace.stopScanning();
    this.screen.clearCardHover();
    this.screen.game.canvas.style.cursor = "default";
    this.screen.renderSnapshot(snapshot);
    if (this.shouldPlayOpponentHotPotatoPeteReveal(snapshot)) {
      SoundPlayer.getInstance().play(CST.AUDIO.SND_HOT_POTATO_PETE);
    }
    void this.showGameOverAfterPeterReaction(snapshot).catch(this.screen.handleAnimationError);
  }

  private async showGameOverAfterPeterReaction(snapshot: GameSnapshot): Promise<void> {
    const generation = this.screen.sceneGeneration;
    const playerWon = snapshot.winner === "player";
    if (playerWon) {
      await this.screen.peterFace.playAngry(true);
    } else {
      await this.screen.peterFace.playHappy(true);
    }

    if (!this.isCurrentResult(snapshot, generation)) return;
    const modal = GameplayScreenFactory.createGameOverModal(this.screen, snapshot);

    this.screen.m_layer_cover22Top.add(modal);
    this.screen.tweens.add({
      targets: [this.screen.botHand, this.screen.playerHand],
      y: "+=8",
      duration: 160,
      yoyo: true,
      ease: "Sine.easeInOut"
    });
    this.screen.time.delayedCall(260, () => {
      if (!this.isCurrentResult(snapshot, generation)) { modal.destroy(); return; }
      modal.setActive(true);
      CustomButton.setInputBlocker(modal, true);
      SoundPlayer.getInstance().play(playerWon ? CST.AUDIO.SND_WIN : CST.AUDIO.SND_LOSE);
      if (playerWon) {
        this.screen.animationMediator.playMatchWinConfetti();
        this.screen.hud.moveToFront();
      }
      this.screen.tweens.add({
        targets: modal,
        alpha: 1,
        scale: 1,
        duration: 260,
        ease: "Back.easeOut",
        onComplete: () => {
          if (!this.isCurrentResult(snapshot, generation)) return;
          modal.playWinProgressAnimation(this.screen.getScoreHudStarTarget());
        }
      });
    });
  }

  public async playNextMatch(): Promise<void> {
    if (this.startingNextMatch) return;
    this.startingNextMatch = true;
    const generation = this.screen.sceneGeneration;
    CustomButton.setSceneInputLocked(this.screen, true);
    try {
      await PokiBridge.commercialBreak(this.screen);
    } catch (error) {
      if (!this.screen.isSceneCurrent(generation)) return;
      console.error("Commercial break failed", error);
      this.startingNextMatch = false;
      CustomButton.setSceneInputLocked(this.screen, false);
      return;
    }
    if (!this.screen.isSceneCurrent(generation)) return;
    if (this.screen.getCurrentSnapshot()?.winner === "player") {
      RunModel.getInstance().continueRun();
    } else {
      RunModel.getInstance().startNewRun();
    }
    this.screen.renderRunState(RunModel.getInstance().getState());
    GameController.startNewGame(Date.now());
    this.screen.scene.restart();
  }

  private shouldPlayOpponentHotPotatoPeteReveal(snapshot: GameSnapshot): boolean {
    return snapshot.winner === "player" && snapshot.players.bot.hand.some((card) => card.isHotPotatoPete);
  }

  private isCurrentResult(snapshot: GameSnapshot, generation: number): boolean {
    return this.screen.isSceneCurrent(generation) && this.screen.getCurrentSnapshot() === snapshot;
  }
}
