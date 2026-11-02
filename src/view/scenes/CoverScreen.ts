import { BaseScreen } from "./BaseScreen";
import { CST } from "../../CST";
import { GameController } from "../../model/GameController";
import { RunModel } from "../../model/RunModel";
import { StatsModel } from "../../model/StatsModel";
import { PokiBridge } from "../../utils/PokiBridge";
import { CustomButton } from "../components/CustomButton";

export class CoverScreen extends BaseScreen {
  private static readonly playButtonY = 321;

  private titleImage!: Phaser.GameObjects.Text;
  private hotPotatoPeteImage!: Phaser.GameObjects.Image;
  private queenImage!: Phaser.GameObjects.Image;
  private statsText!: Phaser.GameObjects.Text;
  private coverButtons: CustomButton[] = [];
  private isLeaving = false;

  constructor() {
    super("CoverScreen");
  }

  protected createGameObjects(): void {
    this.isLeaving = false;
    this.coverButtons = [];
    this.createBackground();

    this.titleImage = new Phaser.GameObjects.Text(this, 0, -332, CST.STRINGS.TITLE.replace(" ", "\n"), {
      fontFamily: CST.FONT.MAIN, fontSize: "74px", fontStyle: "bold", align: "center",
      color: "#f4c95d", stroke: "#123823", strokeThickness: 8
    }).setOrigin(0.5).setShadow(0, 5, "#000000", 0, false, true);
    this.hotPotatoPeteImage = new Phaser.GameObjects.Image(
      this,
      -100,
      -48,
      CST.ASSETS.COVER_ILLUSTRATION_HOT_POTATO_PETE
    ).setScale(0.69);
    this.queenImage = new Phaser.GameObjects.Image(
      this,
      116,
      -40,
      CST.ASSETS.COVER_ILLUSTRATION_QUEEN
    ).setScale(0.64);
    this.m_layer_cover22.add([this.titleImage, this.hotPotatoPeteImage, this.queenImage]);

    const playButton = new CustomButton(
      this,
      0,
      CoverScreen.playButtonY,
      CST.STRINGS.PLAY,
      () => this.startGame(),
      340,
      84,
      CST.COLORS.RED,
      CST.ASSETS.BUTTON_PLAY
    );

    this.coverButtons = [playButton];
    this.m_layer_cover22.add(this.coverButtons);
    this.createStatsText();
    this.prepareBuildAnimation();
  }

  protected setupButtonHandlers(): void {
    return;
  }

  public isReadyForInput(): boolean {
    return (
      !this.isLeaving &&
      this.coverButtons.length > 0 &&
      this.coverButtons.every((button) => button.canReceiveInput())
    );
  }

  protected playEntranceAnimations(): void {
    this.tweens.add({
      targets: this.titleImage,
      alpha: 1,
      y: -332,
      duration: 430,
      ease: "Back.easeOut"
    });
    this.tweens.add({
      targets: this.hotPotatoPeteImage,
      alpha: 1,
      y: -48,
      scale: 0.69,
      duration: 360,
      delay: 140,
      ease: "Back.easeOut"
    });
    this.tweens.add({
      targets: this.queenImage,
      alpha: 1,
      y: -40,
      scale: 0.64,
      duration: 360,
      delay: 220,
      ease: "Back.easeOut"
    });

    this.animateButtons();

    this.tweens.add({
      targets: this.statsText,
      alpha: 1,
      duration: 220,
      delay: 650,
      ease: "Sine.easeOut"
    });
  }

  private async startGame(): Promise<void> {
    if (this.isLeaving) return;
    this.isLeaving = true;
    this.coverButtons.forEach((button) => button.stopPulse());
    this.coverButtons.forEach((button) => button.setActive(false));
    const generation = this.sceneGeneration;
    CustomButton.setSceneInputLocked(this, true);
    try {
      await PokiBridge.commercialBreak(this);
    } catch (error) {
      if (!this.isSceneCurrent(generation)) return;
      console.error("Commercial break failed", error);
      this.isLeaving = false;
      this.coverButtons.forEach((button) => button.setActive(true));
      CustomButton.setSceneInputLocked(this, false);
      return;
    }
    if (!this.isSceneCurrent(generation)) return;
    await this.playCoverOutro();
    if (!this.isSceneCurrent(generation)) return;
    RunModel.getInstance().startNewRun();
    GameController.startNewGame(Date.now(), undefined, {
      firstGameplayTutorial: !StatsModel.getInstance().hasSeenTutorial()
    });
    await this.transitionToScene("GameplayScreen");
  }

  private createBackground(): void {
    const bg = new Phaser.GameObjects.Image(this, 0, 0, CST.ASSETS.BACKGROUND);
    bg.setDisplaySize(CST.GAME.WIDTH, CST.GAME.HEIGHT);
    this.m_layer_cover00.add(bg);
  }

  private createStatsText(): void {
    const stats = StatsModel.getInstance().getStats();
    const runState = RunModel.getInstance().getState();
    this.statsText = new Phaser.GameObjects.Text(
      this,
      0,
      433,
      `Wins ${stats.wins}   Losses ${stats.losses}   Best ${runState.bestScore}`,
      {
        fontFamily: CST.FONT.MAIN,
        fontSize: "24px",
        color: "#fff2d5"
      }
    ).setOrigin(0.5);
    this.m_layer_cover22.add(this.statsText);
  }

  private prepareBuildAnimation(): void {
    this.titleImage.setAlpha(0);
    this.titleImage.y = -372;
    this.hotPotatoPeteImage.setAlpha(0);
    this.hotPotatoPeteImage.y = -18;
    this.hotPotatoPeteImage.setScale(0.55);
    this.queenImage.setAlpha(0);
    this.queenImage.y = -12;
    this.queenImage.setScale(0.5);
    this.statsText.setAlpha(0);

    for (const button of this.coverButtons) {
      button.setAlpha(0);
      button.y += 24;
      button.setScale(0.96);
      button.setActive(false);
    }
  }

  private async playCoverOutro(): Promise<void> {
    this.tweens.add({
      targets: this.m_layer_cover22,
      alpha: 0,
      y: this.m_layer_cover22.y - 22,
      duration: 230,
      ease: "Sine.easeIn"
    });

    await this.waitForMs(230);
  }

  private waitForMs(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.time.delayedCall(ms, () => resolve());
    });
  }

  private startPlayButtonPulse(button: CustomButton): void {
    button.startPulse(1.14, 480);
  }

  private animateButtons(): void {
    this.coverButtons.forEach((button, index) => {
      this.tweens.add({
        targets: button,
        alpha: 1,
        y: button.y - 24,
        scale: 1,
        duration: 260,
        delay: 360 + index * 85,
        ease: "Back.easeOut",
        onComplete: () => {
          button.setActive(true);
          this.startPlayButtonPulse(button);
        }
      });
    });
  }
}
