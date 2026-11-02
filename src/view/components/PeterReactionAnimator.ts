import type { PeterFaceView } from "./PeterFaceView";

type ReactionTween = Omit<Phaser.Types.Tweens.TweenBuilderConfig, "targets" | "onComplete">;
type ReactionTarget = Phaser.GameObjects.GameObject & Partial<Record<"alpha" | "rotation" | "scaleX" | "scaleY" | "x" | "y", number>>;
const ANGRY_TINT = 0xff6b4a;
const HAPPY_TINT = 0xffd66b;

export class PeterReactionAnimator {
  constructor(private readonly owner: PeterFaceView) {}

  public async playAngry(long = false): Promise<void> {
    this.owner.stopScanning(false);
    this.owner.scene.tweens.killTweensOf([this.owner, ...this.owner.reactionEyes]);

    const restX = this.owner.x;
    const restY = this.owner.y;
    const restScaleX = this.owner.scaleX;
    const restScaleY = this.owner.scaleY;
    const angryEyeY = this.owner.reactionLeftRest.y + 4;

    this.owner.reactionFace.setTint(ANGRY_TINT);
    this.owner.reactionEyes[0].setTint(ANGRY_TINT);
    this.owner.reactionEyes[1].setTint(ANGRY_TINT);

    await this.angryPose(restScaleX, restScaleY, angryEyeY, long);

    await this.shakeFace(restX, restY, long);

    await this.restorePose(restX, restY, restScaleX, restScaleY, long);

    this.owner.reactionFace.clearTint();
    this.owner.reactionEyes[0].clearTint();
    this.owner.reactionEyes[1].clearTint();
    this.owner.setPosition(restX, restY);
    this.owner.setScale(restScaleX, restScaleY);
    this.owner.centerEyes();
  }

  public async playHappy(long = false): Promise<void> {
    this.owner.stopScanning(false);
    this.owner.scene.tweens.killTweensOf([this.owner, ...this.owner.reactionEyes]);

    const restX = this.owner.x;
    const restY = this.owner.y;
    const restScaleX = this.owner.scaleX;
    const restScaleY = this.owner.scaleY;

    this.owner.reactionFace.setTint(HAPPY_TINT);
    this.owner.reactionEyes[0].setTint(HAPPY_TINT);
    this.owner.reactionEyes[1].setTint(HAPPY_TINT);

    await Promise.all([
      this.tweenTo(this.owner.reactionEyes[0], {
        x: this.owner.reactionLeftRest.x - 5,
        y: this.owner.reactionLeftRest.y - 5,
        duration: long ? 120 : 90,
        ease: "Back.easeOut"
      }),
      this.tweenTo(this.owner.reactionEyes[1], {
        x: this.owner.reactionRightRest.x + 5,
        y: this.owner.reactionRightRest.y - 5,
        duration: long ? 120 : 90,
        ease: "Back.easeOut"
      })
    ]);

    await this.bounce(restY, restScaleX, restScaleY, long);

    await this.restorePose(restX, restY, restScaleX, restScaleY, long, true);

    this.owner.reactionFace.clearTint();
    this.owner.reactionEyes[0].clearTint();
    this.owner.reactionEyes[1].clearTint();
    this.owner.setPosition(restX, restY);
    this.owner.setScale(restScaleX, restScaleY);
    this.owner.centerEyes();
  }

  private angryPose(restScaleX: number, restScaleY: number, angryEyeY: number, long: boolean): Promise<void[]> {
    return Promise.all([
      this.tweenTo(this.owner.reactionEyes[0], {
        x: this.owner.reactionLeftRest.x + 6,
        y: angryEyeY,
        duration: long ? 110 : 80,
        ease: "Back.easeOut"
      }),
      this.tweenTo(this.owner.reactionEyes[1], {
        x: this.owner.reactionRightRest.x - 6,
        y: angryEyeY,
        duration: long ? 110 : 80,
        ease: "Back.easeOut"
      }),
      this.tweenTo(this.owner, {
        scaleX: restScaleX * (long ? 1.1 : 1.06),
        scaleY: restScaleY * (long ? 1.1 : 1.06),
        duration: long ? 130 : 90,
        ease: "Back.easeOut"
      })
    ]);
  }

  private restorePose(restX: number, restY: number, restScaleX: number, restScaleY: number, long: boolean, happy = false): Promise<void[]> {
    return Promise.all([
      this.tweenTo(this.owner.reactionEyes[0], {
        x: this.owner.reactionLeftRest.x,
        y: this.owner.reactionLeftRest.y,
        duration: long ? 180 : 120,
        ease: "Sine.easeOut"
      }),
      this.tweenTo(this.owner.reactionEyes[1], {
        x: this.owner.reactionRightRest.x,
        y: this.owner.reactionRightRest.y,
        duration: long ? 180 : 120,
        ease: "Sine.easeOut"
      }),
      this.tweenTo(this.owner, {
        x: restX,
        y: restY,
        scaleX: restScaleX,
        scaleY: restScaleY,
        duration: happy ? (long ? 170 : 120) : (long ? 190 : 130),
        ease: "Sine.easeOut"
      })
    ]);
  }

  private async bounce(restY: number, restScaleX: number, restScaleY: number, long: boolean): Promise<void> {
    for (let i = 0; i < (long ? 2 : 1); i++) {
      await this.tweenTo(this.owner, {
        y: restY - (long ? 18 : 12),
        scaleX: restScaleX * (long ? 1.09 : 1.05),
        scaleY: restScaleY * (long ? 0.96 : 0.98),
        duration: long ? 170 : 120,
        ease: "Sine.easeOut"
      });
      await this.tweenTo(this.owner, {
        y: restY,
        scaleX: restScaleX * (long ? 0.98 : 1),
        scaleY: restScaleY * (long ? 1.05 : 1.02),
        duration: long ? 150 : 110,
        ease: "Sine.easeIn"
      });
    }

  }

  private async shakeFace(restX: number, restY: number, long: boolean): Promise<void> {
    const offsets = long
      ? [-14, 13, -12, 11, -9, 8, -6, 5, -3, 0]
      : [-10, 9, -7, 6, -3, 0];

    for (const offset of offsets) {
      await this.tweenTo(this.owner, {
        x: restX + offset,
        y: restY + (offset === 0 ? 0 : Phaser.Math.Between(-2, 2)),
        duration: long ? 48 : 36,
        ease: "Sine.easeInOut"
      });
    }
  }

  private tweenTo(target: Phaser.GameObjects.GameObject, config: ReactionTween): Promise<void> {
    return this.owner.animationSkipController.waitForTween(this.owner.scene, {
      targets: target, ...config
    }, () => this.applyTweenFinalState(target, config));
  }

  private applyTweenFinalState(
    target: Phaser.GameObjects.GameObject,
    config: ReactionTween
  ): void {
    const tweenTarget = target as ReactionTarget;

    if (typeof config.x === "number") tweenTarget.x = config.x;
    if (typeof config.y === "number") tweenTarget.y = config.y;
    if (typeof config.scaleX === "number") tweenTarget.scaleX = config.scaleX;
    if (typeof config.scaleY === "number") tweenTarget.scaleY = config.scaleY;
    if (typeof config.scale === "number") {
      tweenTarget.scaleX = config.scale;
      tweenTarget.scaleY = config.scale;
    }
    if (typeof config.rotation === "number") tweenTarget.rotation = config.rotation;
    if (typeof config.alpha === "number") tweenTarget.alpha = config.alpha;
  }
}
