import { CST } from "../../CST";
import { CustomButton } from "./CustomButton";

export interface ConfirmationModalActions {
  onConfirm: () => void;
  onCancel?: () => void;
}

export class ConfirmationModal extends Phaser.GameObjects.Container {
  private readonly titleText: Phaser.GameObjects.Text;
  private readonly bodyText: Phaser.GameObjects.Text;
  private readonly confirmButton: CustomButton;
  private readonly cancelButton: CustomButton;
  private actions: ConfirmationModalActions = {
    onConfirm: () => undefined
  };

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    const overlay = new Phaser.GameObjects.Rectangle(scene, 0, 0, 2000, 2000, 0x000000, 0.62);
    overlay.setInteractive();
    const panel = this.createPanel(scene);
    this.titleText = new Phaser.GameObjects.Text(scene, 0, -92, "", {
      fontFamily: CST.FONT.MAIN,
      fontSize: "32px",
      color: "#fff2d5",
      align: "center"
    }).setOrigin(0.5);
    this.bodyText = new Phaser.GameObjects.Text(scene, 0, -28, "", {
      fontFamily: CST.FONT.MAIN,
      fontSize: "23px",
      color: "#fff2d5",
      align: "center",
      wordWrap: { width: 330 }
    }).setOrigin(0.5);
    this.confirmButton = new CustomButton(
      scene,
      -92,
      88,
      CST.STRINGS.YES,
      () => this.confirm(),
      145,
      56,
      CST.COLORS.RED
    );
    this.cancelButton = new CustomButton(
      scene,
      92,
      88,
      CST.STRINGS.CANCEL,
      () => this.cancel(),
      145,
      56,
      CST.COLORS.BLUE
    );

    this.add([overlay, panel, this.titleText, this.bodyText, this.confirmButton, this.cancelButton]);
    this.hide();
  }

  public show(title: string, body: string, actions: ConfirmationModalActions): void {
    this.actions = actions;
    this.titleText.setText(title);
    this.bodyText.setText(body);
    this.setVisible(true);
    this.setActive(true);
    this.parentContainer?.bringToTop(this);
    CustomButton.setInputBlocker(this, true);
    this.setScale(0.9);
    this.scene.tweens.add({
      targets: this,
      scale: 1,
      duration: 200,
      ease: "Back.easeOut"
    });
  }

  public hide(): void {
    CustomButton.setInputBlocker(this, false);
    this.setVisible(false);
    this.setActive(false);
  }

  private confirm(): void {
    const onConfirm = this.actions.onConfirm;
    this.hide();
    onConfirm();
  }

  private cancel(): void {
    const onCancel = this.actions.onCancel;
    this.hide();
    onCancel?.();
  }

  private createPanel(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
    const graphics = new Phaser.GameObjects.Graphics(scene);
    graphics.fillStyle(CST.COLORS.PANEL_DARK, 1);
    graphics.lineStyle(4, CST.COLORS.GOLD, 1);
    graphics.fillRoundedRect(-190, -140, 380, 280, 18);
    graphics.strokeRoundedRect(-190, -140, 380, 280, 18);
    return graphics;
  }
}
