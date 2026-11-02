import { CST } from "../CST";

export class ConfettiAnimator {
  constructor(
    private readonly scene: Phaser.Scene & {
      m_layer_cover22Top: Phaser.GameObjects.Container;
    }
  ) {}

  public playMatchWinConfetti(): void {
    const colors = [
      CST.COLORS.GOLD,
      CST.COLORS.CREAM,
      CST.COLORS.RED,
      CST.COLORS.BLUE,
      0x5fd487
    ];
    const confetti = new Phaser.GameObjects.Container(this.scene, 0, 0);
    this.scene.m_layer_cover22Top.add(confetti);

    for (let index = 0; index < 116; index++) {
      const piece = new Phaser.GameObjects.Rectangle(
        this.scene,
        Phaser.Math.Between(-270, 270),
        Phaser.Math.Between(-520, -390),
        Phaser.Math.Between(12, 24),
        Phaser.Math.Between(20, 36),
        colors[index % colors.length],
        1
      );
      piece.setRotation(Phaser.Math.FloatBetween(0, Math.PI));
      confetti.add(piece);

      this.scene.tweens.add({
        targets: piece,
        x: piece.x + Phaser.Math.Between(-85, 85),
        y: Phaser.Math.Between(260, 520),
        rotation: piece.rotation + Phaser.Math.FloatBetween(5, 10),
        alpha: 0,
        duration: Phaser.Math.Between(1150, 1750),
        delay: Phaser.Math.Between(0, 220),
        ease: "Sine.easeIn",
        onComplete: () => piece.destroy()
      });
    }

    this.scene.time.delayedCall(2100, () => confetti.destroy());
  }
}
