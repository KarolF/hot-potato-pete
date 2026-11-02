import { CST } from "../../CST";
import { Card, Point } from "../../model/interfaces";

export class CardView extends Phaser.GameObjects.Container {
  public static readonly WIDTH = 82;
  public static readonly HEIGHT = 149;

  private image: Phaser.GameObjects.Image;
  private selectable = false;
  private hovered = false;
  private restX: number;
  private restY: number;
  private restScale = 1;
  private restRotation = 0;
  private card: Card;
  private faceUp: boolean;
  private hitArea = new Phaser.Geom.Rectangle(
    -CardView.WIDTH / 2,
    -CardView.HEIGHT / 2,
    CardView.WIDTH,
    CardView.HEIGHT
  );

  constructor(scene: Phaser.Scene, x: number, y: number, card: Card, faceUp: boolean) {
    super(scene, x, y);
    this.card = card;
    this.faceUp = faceUp;
    this.restX = x;
    this.restY = y;

    this.image = new Phaser.GameObjects.Image(scene, 0, 0, this.getTextureKey());
    this.image.setOrigin(0.5);
    this.image.setDisplaySize(CardView.WIDTH, CardView.HEIGHT);

    this.add(this.image);
    this.setSize(CardView.WIDTH, CardView.HEIGHT);
    this.setInteractive(this.hitArea, Phaser.Geom.Rectangle.Contains);
  }

  public setCard(card: Card, faceUp: boolean): void {
    this.card = card;
    this.faceUp = faceUp;
    this.draw();
  }

  public get cardId(): string {
    return this.card.id;
  }

  public setFaceUp(faceUp: boolean): void {
    this.faceUp = faceUp;
    this.draw();
  }

  public setSelectable(selectable: boolean): void {
    this.selectable = selectable;
    this.alpha = 1;
    if (!selectable) {
      this.setHovered(false);
    }
  }

  public setRestPose(x: number, y: number, scale: number, rotation: number = 0): void {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.rotation = rotation;
    this.restX = x;
    this.restY = y;
    this.restScale = scale;
    this.restRotation = rotation;
  }

  public setHovered(hovered: boolean): void {
    if (hovered && !this.selectable) return;
    if (this.hovered === hovered) return;
    this.hovered = hovered;

    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      x: this.restX,
      y: hovered ? this.restY - 12 : this.restY,
      scale: hovered ? this.restScale * 1.05 : this.restScale,
      rotation: this.restRotation,
      duration: 120,
      ease: "Sine.easeOut"
    });
  }

  public pulseSelectable(): void {
    if (!this.selectable || this.hovered) return;
    this.scene.tweens.add({
      targets: this,
      y: this.restY - 8,
      duration: 250,
      yoyo: true,
      ease: "Sine.easeInOut",
      onComplete: () => {
        if (!this.hovered) {
          this.y = this.restY;
        }
      }
    });
  }

  public setHitSlice(localX: number, width: number): void {
    const minX = -CardView.WIDTH / 2;
    const maxX = CardView.WIDTH / 2;
    const clampedX = Phaser.Math.Clamp(localX, minX, maxX);
    const clampedWidth = Phaser.Math.Clamp(width, 1, maxX - clampedX);

    this.hitArea = new Phaser.Geom.Rectangle(
      clampedX,
      -CardView.HEIGHT / 2,
      clampedWidth,
      CardView.HEIGHT
    );

    if (this.input) {
      this.input.hitArea = this.hitArea;
      this.input.hitAreaCallback = Phaser.Geom.Rectangle.Contains;
    } else {
      this.setInteractive(this.hitArea, Phaser.Geom.Rectangle.Contains);
    }
  }

  public getHitCenterInParent(): { x: number; y: number } {
    return {
      x: this.x + (this.hitArea.x + this.hitArea.width / 2) * this.scaleX,
      y: this.y + (this.hitArea.y + this.hitArea.height / 2) * this.scaleY
    };
  }

  public getHitPointInParent(localPoint: Point): Point {
    const localX = this.hitArea.x + this.hitArea.width * localPoint.x;
    const localY = this.hitArea.y + this.hitArea.height * localPoint.y;
    const scaledX = localX * this.scaleX;
    const scaledY = localY * this.scaleY;
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);

    return {
      x: this.x + scaledX * cos - scaledY * sin,
      y: this.y + scaledX * sin + scaledY * cos
    };
  }

  public containsParentPoint(parentX: number, parentY: number): boolean {
    if (!this.visible || this.scaleX === 0 || this.scaleY === 0) return false;

    const dx = parentX - this.x;
    const dy = parentY - this.y;
    const cos = Math.cos(-this.rotation);
    const sin = Math.sin(-this.rotation);
    const localX = (dx * cos - dy * sin) / this.scaleX;
    const localY = (dx * sin + dy * cos) / this.scaleY;

    return Phaser.Geom.Rectangle.Contains(this.hitArea, localX, localY);
  }

  public bindClick(callback: () => void): void {
    this.off("pointerdown");
    this.off("pointerup");
    this.on("pointerdown", () => {
      if (!this.selectable) return;
      this.selectable = false;
      callback();
    });
  }

  public playFlip(): void {
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.08,
      duration: 90,
      yoyo: true,
      ease: "Sine.easeInOut"
    });
  }

  private draw(): void {
    this.image.setTexture(this.getTextureKey());
    this.image.setDisplaySize(CardView.WIDTH, CardView.HEIGHT);
  }

  private getTextureKey(): string {
    if (!this.faceUp) return CST.ASSETS.CARDS.BACK;
    if (this.card.isHotPotatoPete) return CST.ASSETS.CARDS.HOT_POTATO_PETE;

    const rankTextureKeys = CST.ASSETS.CARDS.RANKS as Record<string, string>;
    return rankTextureKeys[this.card.rank] || CST.ASSETS.CARDS.HOT_POTATO_PETE;
  }
}
