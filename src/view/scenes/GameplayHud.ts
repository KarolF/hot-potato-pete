import { CST } from "../../CST";
import { Point } from "../../model/interfaces";
import type { GameplayScreen } from "./GameplayScreen";
import type { GameplayScreenParts } from "./GameplayScreenFactory";

export class GameplayHud {
  constructor(private readonly screen: GameplayScreen, private readonly parts: GameplayScreenParts) {}

  public playEntranceAnimations(): void {
    this.screen.tweens.add({
      targets: this.screen.peterFace,
      alpha: 1,
      scaleX: this.parts.peterFaceScaleX,
      scaleY: this.parts.peterFaceScaleY,
      duration: 260,
      ease: "Back.easeOut"
    });
    this.screen.tweens.add({
      targets: [this.screen.turnBanner, this.screen.discardPile, this.parts.scoreHud],
      alpha: 1,
      duration: 230,
      delay: 120,
      ease: "Sine.easeOut"
    });
    this.screen.tweens.add({
      targets: this.screen.botHand,
      alpha: 1,
      y: this.screen.screenLayout.botHandRestY,
      duration: 300,
      delay: 210,
      ease: "Back.easeOut"
    });
    this.screen.tweens.add({
      targets: this.screen.playerHand,
      alpha: 1,
      y: this.screen.screenLayout.playerHandRestY,
      duration: 300,
      delay: 290,
      ease: "Back.easeOut"
    });

    this.animateButtons();
    const generation = this.screen.sceneGeneration;
    this.screen.time.delayedCall(620, () => {
      if (this.screen.isSceneCurrent(generation)) this.screen.handleEntranceComplete();
    });
  }

  public updateScoreHud(): void {
    if (!this.parts.scoreHudText || !this.parts.scoreHudPanel) return;

    const state = this.screen.runState;
    this.parts.scoreHudText.setText(`${state.currentScore}`);
    this.parts.scoreHudPanel.clear();
    this.parts.scoreHudPanel.fillStyle(CST.COLORS.PANEL_DARK, 0.82);
    this.parts.scoreHudPanel.lineStyle(2, CST.COLORS.GOLD, 0.95);
    this.parts.scoreHudPanel.fillRoundedRect(-12, -23, 128, 46, 8);
    this.parts.scoreHudPanel.strokeRoundedRect(-12, -23, 128, 46, 8);

    this.screen.tweens.killTweensOf(this.parts.scoreHud);
    this.screen.tweens.add({
      targets: this.parts.scoreHud,
      scale: 1.04,
      duration: 90,
      yoyo: true,
      ease: "Sine.easeOut"
    });
  }

  public moveToFront(): void {
    this.parts.scoreHud.parentContainer?.remove(this.parts.scoreHud, false);
    this.screen.m_layer_cover22Top.add(this.parts.scoreHud);
    this.parts.scoreHud.setAlpha(1);
  }

  public getScoreHudStarTarget(): Point {
    return {
      x: this.parts.scoreHud.x + 66,
      y: this.parts.scoreHud.y
    };
  }

  private animateButtons(): void {
    this.parts.gameplayButtons.forEach((button, index) => {
      this.screen.tweens.add({
        targets: button,
        alpha: 1,
        y: button.y - 22,
        duration: 220,
        delay: 420 + index * 60,
        ease: "Back.easeOut",
        onComplete: () => button.setActive(true)
      });
    });
  }
}
