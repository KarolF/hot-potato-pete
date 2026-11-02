import { CST } from "../../CST";
import { Point } from "../../model/interfaces";
import { CustomButton } from "./CustomButton";

export class OpponentHintOverlay extends Phaser.GameObjects.Container {
  private static readonly arrowHeightRatio = 140 / 460;
  private static readonly arrowWidth = 118;

  private arrow: Phaser.GameObjects.Image;
  private hintText: Phaser.GameObjects.Text;
  private opponentName: Phaser.GameObjects.Text;
  private onClose: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number, onClose: () => void) {
    super(scene, x, y);
    this.onClose = onClose;

    const overlay = new Phaser.GameObjects.Rectangle(scene, 0, 0, 2000, 2000, 0x000000, 0.46);
    overlay.setInteractive();
    this.arrow = new Phaser.GameObjects.Image(scene, 0, 0, CST.ASSETS.HTP_ARROW);
    this.arrow.setOrigin(1, 0.5);

    const panel = new Phaser.GameObjects.Graphics(scene);
    panel.fillStyle(CST.COLORS.PANEL_DARK, 1);
    panel.lineStyle(4, CST.COLORS.GOLD, 1);
    panel.fillRoundedRect(-220, -170, 440, 260, 18);
    panel.strokeRoundedRect(-220, -170, 440, 260, 18);

    const title = new Phaser.GameObjects.Text(scene, 0, -134, CST.STRINGS.OPPONENT_HINT, {
      fontFamily: CST.FONT.MAIN,
      fontSize: "28px",
      color: "#f4c95d"
    }).setOrigin(0.5);
    this.opponentName = new Phaser.GameObjects.Text(scene, 0, -93, "", {
      fontFamily: CST.FONT.MAIN,
      fontSize: "24px",
      color: "#fff2d5"
    }).setOrigin(0.5);
    this.hintText = new Phaser.GameObjects.Text(scene, 0, -38, "", {
      fontFamily: CST.FONT.MAIN,
      fontSize: "23px",
      color: "#fff2d5",
      align: "center",
      wordWrap: { width: 360 }
    }).setOrigin(0.5);
    const closeButton = new CustomButton(scene, 0, 58, CST.STRINGS.CLOSE, () => this.hide(), 170, 50, CST.COLORS.RED);

    this.add([overlay, this.arrow, panel, title, this.opponentName, this.hintText, closeButton]);
    this.setVisible(false);
    this.setActive(false);
  }

  public show(opponentName: string, hintText: string, target: Point): void {
    this.opponentName.setText(opponentName);
    this.hintText.setText(hintText);
    this.drawArrow(target);
    this.setVisible(true);
    this.setActive(true);
    CustomButton.setInputBlocker(this, true);
    this.setScale(0.92);
    this.scene.tweens.add({
      targets: this,
      scale: 1,
      duration: 220,
      ease: "Back.easeOut"
    });
  }

  public hide(): void {
    CustomButton.setInputBlocker(this, false);
    this.setVisible(false);
    this.setActive(false);
    this.onClose();
  }

  public getTextContent(): string {
    return `${this.opponentName.text}: ${this.hintText.text}`;
  }

  private drawArrow(target: Point): void {
    const start = { x: 0, y: -170 };
    const end = { x: target.x, y: target.y + 32 };
    const angle = Phaser.Math.Angle.Between(start.x, start.y, end.x, end.y);

    this.arrow.setPosition(end.x, end.y);
    this.arrow.setRotation(angle);
    this.arrow.setDisplaySize(
      OpponentHintOverlay.arrowWidth,
      OpponentHintOverlay.arrowWidth * OpponentHintOverlay.arrowHeightRatio
    );
  }
}
