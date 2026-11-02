import { CST } from "../../CST";
import { StatsModel } from "../../model/StatsModel";
import { CustomButton } from "./CustomButton";

export class HowToPlayModal extends Phaser.GameObjects.Container {
  private bodyText: Phaser.GameObjects.Text;
  private opponentHintTitle: Phaser.GameObjects.Text;
  private opponentHintBody: Phaser.GameObjects.Text;
  private onHide?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number, onHide?: () => void) {
    super(scene, x, y);
    this.onHide = onHide;

    const overlay = new Phaser.GameObjects.Rectangle(scene, 0, 0, 2000, 2000, 0x000000, 0.55);
    overlay.setInteractive();
    const panel = new Phaser.GameObjects.Graphics(scene);
    panel.fillStyle(CST.COLORS.PANEL_DARK, 1);
    panel.lineStyle(4, CST.COLORS.GOLD, 1);
    panel.fillRoundedRect(-220, -250, 440, 500, 20);
    panel.strokeRoundedRect(-220, -250, 440, 500, 20);

    const title = new Phaser.GameObjects.Text(scene, 0, -190, CST.STRINGS.HOW_TO_PLAY, {
      fontFamily: CST.FONT.MAIN,
      fontSize: "32px",
      color: "#fff2d5"
    }).setOrigin(0.5);
    this.bodyText = new Phaser.GameObjects.Text(scene, 0, -64, CST.STRINGS.HOW_TO_PLAY_BODY, {
      fontFamily: CST.FONT.MAIN,
      fontSize: "23px",
      color: "#fff2d5",
      align: "center",
      wordWrap: { width: 360 }
    }).setOrigin(0.5);
    this.opponentHintTitle = new Phaser.GameObjects.Text(scene, 0, 53, CST.STRINGS.OPPONENT_HINT, {
      fontFamily: CST.FONT.MAIN,
      fontSize: "23px",
      color: "#f4c95d"
    }).setOrigin(0.5);
    this.opponentHintBody = new Phaser.GameObjects.Text(scene, 0, 98, "", {
      fontFamily: CST.FONT.MAIN,
      fontSize: "21px",
      color: "#fff2d5",
      align: "center",
      wordWrap: { width: 360 }
    }).setOrigin(0.5);
    const closeButton = new CustomButton(scene, 0, 197, CST.STRINGS.CLOSE, () => this.hide(), 190, 54, CST.COLORS.RED);

    this.add([overlay, panel, title, this.bodyText, this.opponentHintTitle, this.opponentHintBody, closeButton]);
    this.setOpponentHint();
    this.hideWithoutCallback();
  }

  public setOpponentHint(opponentName?: string, hintText?: string): void {
    const hasHint = Boolean(opponentName && hintText);
    this.opponentHintTitle.setVisible(hasHint);
    this.opponentHintBody.setVisible(hasHint);
    this.opponentHintBody.setText(hasHint ? `${opponentName}: ${hintText}` : "");
    this.bodyText.setY(hasHint ? -64 : -20);
  }

  public getTextContent(): string {
    return [
      CST.STRINGS.HOW_TO_PLAY,
      this.bodyText.text,
      this.opponentHintTitle.visible ? this.opponentHintTitle.text : "",
      this.opponentHintBody.visible ? this.opponentHintBody.text : ""
    ].filter(Boolean).join("\n");
  }

  public show(): void {
    StatsModel.getInstance().markTutorialSeen();
    this.setVisible(true);
    this.setActive(true);
    CustomButton.setInputBlocker(this, true);
    this.setScale(0.9);
    this.scene.tweens.add({
      targets: this,
      scale: 1,
      duration: 220,
      ease: "Back.easeOut"
    });
  }

  public hide(): void {
    const wasVisible = this.visible;
    this.hideWithoutCallback();
    if (wasVisible) {
      this.onHide?.();
    }
  }

  private hideWithoutCallback(): void {
    CustomButton.setInputBlocker(this, false);
    this.setVisible(false);
    this.setActive(false);
  }
}
