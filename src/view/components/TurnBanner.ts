import { CST } from "../../CST";

export class TurnBanner extends Phaser.GameObjects.Container {
  private graphics: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.graphics = new Phaser.GameObjects.Graphics(scene);
    this.text = new Phaser.GameObjects.Text(scene, 0, 0, "", {
      fontFamily: CST.FONT.MAIN,
      fontSize: "24px",
      color: "#fff2d5",
      align: "center",
      wordWrap: { width: 470 }
    }).setOrigin(0.5);

    this.add([this.graphics, this.text]);
    this.setText("");
  }

  public setText(text: string): void {
    this.graphics.clear();
    this.graphics.fillStyle(CST.COLORS.PANEL, 0.95);
    this.graphics.lineStyle(3, CST.COLORS.GOLD, 1);
    this.graphics.fillRoundedRect(-250, -34, 500, 68, 16);
    this.graphics.strokeRoundedRect(-250, -34, 500, 68, 16);
    this.text.setText(text);
  }
}
