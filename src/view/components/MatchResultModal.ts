import { CST } from "../../CST";
import { GameSnapshot, Point } from "../../model/interfaces";
import { RunState } from "../../model/RunModel";
import { CustomButton } from "./CustomButton";
import { MatchProgressBar } from "./MatchProgressBar";
import { MatchProgressPlan, MatchProgressPlanFactory } from "./MatchProgressPlan";

export interface MatchResultModalActions {
  onMenu: () => void;
  onNextMatch: () => void;
}

export class MatchResultModal extends Phaser.GameObjects.Container {
  private static readonly wonMenuButtonWidth = 214;
  private static readonly wonMenuButtonHeight = 45;

  private readonly defeatedMatchNumber: number;
  private readonly nextMatchNumber: number;
  private readonly playerWon: boolean;
  private readonly progressPlan?: MatchProgressPlan;
  private nextMatchButton?: CustomButton;
  private progressBar?: MatchProgressBar;

  constructor(
    scene: Phaser.Scene,
    snapshot: GameSnapshot,
    runState: RunState,
    actions: MatchResultModalActions
  ) {
    super(scene, 0, 0);
    this.playerWon = snapshot.winner === "player";
    this.progressPlan = this.playerWon
      ? MatchProgressPlanFactory.createWinPlan(snapshot, runState)
      : undefined;
    this.defeatedMatchNumber = this.progressPlan?.defeatedMatchNumber
      ?? snapshot.opponent?.matchNumber
      ?? Math.max(1, runState.matchNumber - 1);
    this.nextMatchNumber = this.progressPlan?.nextMatchNumber ?? runState.matchNumber;

    this.setActive(false);
    this.createBackdrop();
    this.createContent(runState, actions);
    this.setScale(0.88);
    this.setAlpha(0);
  }

  public playWinProgressAnimation(scoreTarget: Point): void {
    if (!this.playerWon) return;
    this.startNextMatchButtonPulse();
    this.progressBar?.playWinAdvance(
      this.defeatedMatchNumber,
      this.nextMatchNumber,
      scoreTarget
    );
  }

  private createBackdrop(): void {
    const overlay = new Phaser.GameObjects.Rectangle(this.scene, 0, 0, 2000, 2000, 0x000000, 0.62);
    overlay.setInteractive();

    const panel = new Phaser.GameObjects.Image(this.scene, 0, 0, CST.ASSETS.GAME_WIN_MODAL);
    panel.setDisplaySize(500, 688);

    this.add([overlay, panel]);
  }

  private createContent(runState: RunState, actions: MatchResultModalActions): void {
    const title = this.playerWon ? CST.STRINGS.MATCH_WON : CST.STRINGS.RUN_OVER;
    const titleText = new Phaser.GameObjects.Text(this.scene, 0, -246, title, {
      fontFamily: CST.FONT.MAIN,
      fontSize: "42px",
      color: "#fff2d5",
      align: "center"
    }).setOrigin(0.5);

    if (this.playerWon) {
      this.progressBar = this.createWonProgressBar();
      this.add([titleText, this.progressBar, ...this.createWonButtons(actions)]);
      return;
    }

    this.add([
      titleText,
      this.createLostBody(runState),
      ...this.createLostButtons(actions)
    ]);
  }

  private createWonProgressBar(): MatchProgressBar {
    return new MatchProgressBar(
      this.scene,
      0,
      -44,
      this.progressPlan?.initialState ?? {
        defeatedThroughMatchNumber: this.defeatedMatchNumber - 1,
        groupMatchNumber: this.defeatedMatchNumber,
        highlightedMatchNumber: this.defeatedMatchNumber,
        playerMatchNumber: this.defeatedMatchNumber
      }
    );
  }

  private createWonButtons(actions: MatchResultModalActions): CustomButton[] {
    this.nextMatchButton = new CustomButton(
      this.scene,
      0,
      172,
      CST.STRINGS.NEXT_MATCH,
      actions.onNextMatch,
      326,
      80,
      CST.COLORS.RED,
      CST.ASSETS.BUTTON_NEXT
    );

    return [
      this.nextMatchButton,
      new CustomButton(
        this.scene,
        0,
        264,
        CST.STRINGS.MENU,
        actions.onMenu,
        MatchResultModal.wonMenuButtonWidth,
        MatchResultModal.wonMenuButtonHeight,
        CST.COLORS.BLUE,
        CST.ASSETS.BUTTON_MENU_1
      )
    ];
  }

  private startNextMatchButtonPulse(): void {
    const button = this.nextMatchButton;
    if (!button) return;

    button.startPulse(1.08, 520);
  }

  private createLostBody(runState: RunState): Phaser.GameObjects.Text {
    const bodyLines = [
      `${CST.STRINGS.FINAL_SCORE}: ${runState.currentScore}`,
      `${CST.STRINGS.BEST}: ${runState.bestScore}`,
      runState.isNewBest ? CST.STRINGS.NEW_BEST : ""
    ];

    return new Phaser.GameObjects.Text(this.scene, 0, -42, bodyLines.filter(Boolean).join("\n"), {
      fontFamily: CST.FONT.MAIN,
      fontSize: "25px",
      color: "#fff2d5",
      align: "center",
      lineSpacing: 12,
      wordWrap: { width: 340 }
    }).setOrigin(0.5);
  }

  private createLostButtons(actions: MatchResultModalActions): CustomButton[] {
    return [
      new CustomButton(
        this.scene,
        0,
        148,
        CST.STRINGS.NEW_RUN,
        actions.onNextMatch,
        245,
        58,
        CST.COLORS.RED
      ),
      new CustomButton(
        this.scene,
        0,
        225,
        CST.STRINGS.MENU,
        actions.onMenu,
        190,
        54,
        CST.COLORS.BLUE
      )
    ];
  }
}
