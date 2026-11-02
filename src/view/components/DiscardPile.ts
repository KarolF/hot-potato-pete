import { CST } from "../../CST";

export class DiscardPile extends Phaser.GameObjects.Container {
  private graphics: Phaser.GameObjects.Graphics;
  private backCardLeft: Phaser.GameObjects.Image;
  private backCardRight: Phaser.GameObjects.Image;
  private text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.graphics = new Phaser.GameObjects.Graphics(scene);
    this.backCardLeft = new Phaser.GameObjects.Image(scene, -34, 2, CST.ASSETS.CARDS.BACK)
      .setDisplaySize(38, 69)
      .setRotation(-0.1);
    this.backCardRight = new Phaser.GameObjects.Image(scene, -14, -2, CST.ASSETS.CARDS.BACK)
      .setDisplaySize(38, 69)
      .setRotation(0.08);
    this.text = new Phaser.GameObjects.Text(scene, 42, 0, "", {
      fontFamily: CST.FONT.MAIN,
      fontSize: "19px",
      color: "#fff2d5",
      align: "center"
    }).setOrigin(0.5);

    this.add([this.graphics, this.backCardLeft, this.backCardRight, this.text]);
    this.setCount(0);
  }

  public setCount(count: number): void {
    this.graphics.clear();
    this.graphics.fillStyle(CST.COLORS.PANEL_DARK, 0.95);
    this.graphics.lineStyle(3, CST.COLORS.GOLD, 1);
    this.graphics.fillRoundedRect(-72, -42, 144, 84, 14);
    this.graphics.strokeRoundedRect(-72, -42, 144, 84, 14);
    this.text.setText(`${CST.STRINGS.PAIRS}\n${count}`);
  }
}
