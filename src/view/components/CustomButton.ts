import { CST } from "../../CST";
import { ButtonInputMediator } from "../../mediators/ButtonInputMediator";
import { SoundPlayer } from "../SoundPlayer";

export class CustomButton extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;
  private label: Phaser.GameObjects.Text;
  private callback: () => void;
  private enabled = true;
  private hovered = false;
  private pressed = false;
  private hitArea: Phaser.Geom.Rectangle;
  private pulseBaseScaleX = 1;
  private pulseBaseScaleY = 1;
  private pulseTween?: Phaser.Tweens.Tween;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    callback: () => void,
    width: number = 210,
    height: number = 58,
    fillColor: number = CST.COLORS.BLUE,
    imageKey?: string
  ) {
    super(scene, x, y);
    this.callback = callback;
    this.hitArea = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);

    if (imageKey) {
      this.bg = new Phaser.GameObjects.Image(scene, 0, 0, imageKey);
      this.bg.setOrigin(0.5);
      this.bg.setDisplaySize(width, height);
    } else {
      this.bg = new Phaser.GameObjects.Rectangle(scene, 0, 0, width, height, fillColor, 1);
      this.bg.setOrigin(0.5);
      this.bg.setStrokeStyle(3, CST.COLORS.GOLD, 1);
    }

    this.label = new Phaser.GameObjects.Text(scene, 0, 0, text, {
      fontFamily: CST.FONT.MAIN,
      fontSize: "24px",
      color: "#fff2d5",
      align: "center"
    }).setOrigin(0.5);
    this.label.setVisible(!imageKey);

    this.add([this.bg, this.label]);
    this.setSize(width, height);

    ButtonInputMediator.register(this);
  }

  public setLabel(text: string): void {
    this.label.setText(text);
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.alpha = enabled ? 1 : 0.45;
    if (!enabled) {
      this.setHovered(false);
    }
  }

  public destroy(fromScene?: boolean): void {
    this.stopPulse();
    ButtonInputMediator.unregister(this);
    super.destroy(fromScene);
  }

  public static setInputBlocker(blocker: Phaser.GameObjects.Container, active: boolean): void {
    ButtonInputMediator.setInputBlocker(blocker, active);
  }

  public static setSceneInputLocked(scene: Phaser.Scene, locked: boolean): void {
    ButtonInputMediator.setSceneInputLocked(scene, locked);
  }

  public trigger(): void {
    if (!this.enabled || this.pressed) return;
    this.pressed = true;
    SoundPlayer.getInstance().play(CST.AUDIO.SND_CARD_FLIP);
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      scale: 0.94,
      duration: 55,
      ease: "Sine.easeOut",
      yoyo: true,
      onComplete: () => {
        this.pressed = false;
        this.animateScale(this.hovered ? 1.04 : 1);
      }
    });
    this.scene.time.delayedCall(90, () => {
      if (!this.scene || !this.active) return;
      this.callback();
    });
  }

  public containsGamePoint(gameX: number, gameY: number): boolean {
    const local = this.getWorldTransformMatrix().applyInverse(gameX, gameY);
    return Phaser.Geom.Rectangle.Contains(this.hitArea, local.x, local.y);
  }

  public canReceiveInput(): boolean {
    return this.enabled && ButtonInputMediator.canButtonReceiveGlobalInput(this);
  }

  public startPulse(scaleMultiplier: number = 1.08, duration: number = 520): void {
    this.stopPulse(false);
    this.pulseBaseScaleX = this.bg.scaleX;
    this.pulseBaseScaleY = this.bg.scaleY;
    this.pulseTween = this.scene.tweens.add({
      targets: this.bg,
      scaleX: this.pulseBaseScaleX * scaleMultiplier,
      scaleY: this.pulseBaseScaleY * scaleMultiplier,
      duration,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }

  public stopPulse(resetScale = true): void {
    this.pulseTween?.remove();
    this.pulseTween = undefined;
    this.scene?.tweens?.killTweensOf(this.bg);
    if (resetScale) {
      this.bg.setScale(this.pulseBaseScaleX, this.pulseBaseScaleY);
    }
  }

  public setHovered(hovered: boolean): void {
    if (this.hovered === hovered) return;
    this.hovered = hovered;

    if (this.bg instanceof Phaser.GameObjects.Image) {
      if (hovered) {
        this.bg.setTint(0xfff0d0);
      } else {
        this.bg.clearTint();
      }
    } else {
      this.bg.setAlpha(hovered ? 0.94 : 1);
    }

    if (!this.pressed) {
      this.animateScale(hovered ? 1.04 : 1);
    }
  }

  private animateScale(scale: number): void {
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      scale,
      duration: 120,
      ease: "Sine.easeOut"
    });
  }

}
