import { PeterReactionAnimator } from "./PeterReactionAnimator";
import { CST } from "../../CST";
import { OpponentEyeStyle, OpponentState, Point } from "../../model/interfaces";
import { AnimationSkipController } from "../../utils/AnimationSkipController";
import { OpponentSunglassesView } from "./OpponentSunglassesView";

export interface PeterEyeTarget {
  cardId: string;
  x: number;
  y: number;
  showHotPotatoPeteTell?: boolean;
}

export class PeterFaceView extends Phaser.GameObjects.Container {
  private static readonly faceWidth = 245;
  private static readonly faceHeight = 167;
  private static readonly eyeSize = 19;
  private static readonly eyeTravelX = 8;
  private static readonly eyeTravelY = 5;
  private static readonly moveDurationMs = 260;
  private static readonly normalHoldMs = 300;
  private static readonly hotPotatoPeteHoldMs = 500;

  private readonly face: Phaser.GameObjects.Image;
  private readonly leftEye: Phaser.GameObjects.Image;
  private readonly rightEye: Phaser.GameObjects.Image;
  private readonly sunglasses: OpponentSunglassesView;
  private readonly defaultLeftEyeRest = { x: -28, y: -17 };
  private readonly defaultRightEyeRest = { x: 31, y: -17 };
  private leftEyeRest = { ...this.defaultLeftEyeRest };
  private rightEyeRest = { ...this.defaultRightEyeRest };
  private eyeNeutralScale = { x: 1, y: 1 };
  private skipController = new AnimationSkipController();
  private readonly reactions = new PeterReactionAnimator(this);
  private scanToken = 0;
  private scanning = false;
  private eyeStyle: OpponentEyeStyle = "hold";

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.face = new Phaser.GameObjects.Image(scene, 0, 0, CST.ASSETS.PETER_FACE_2);
    this.face.setDisplaySize(PeterFaceView.faceWidth, PeterFaceView.faceHeight);

    this.leftEye = this.createEye(this.leftEyeRest.x, this.leftEyeRest.y);
    this.rightEye = this.createEye(this.rightEyeRest.x, this.rightEyeRest.y);
    this.eyeNeutralScale = { x: this.leftEye.scaleX, y: this.leftEye.scaleY };
    this.sunglasses = new OpponentSunglassesView(scene);
    this.sunglasses.layout(this.leftEyeRest, this.rightEyeRest);

    this.add([this.face, this.leftEye, this.rightEye, this.sunglasses]);
  }

  public destroy(fromScene?: boolean): void {
    if (!this.scene || this.ignoreDestroy) return;
    this.stopScanning(false);
    this.skipController.destroy();
    super.destroy(fromScene);
  }

  public startScanning(targets: PeterEyeTarget[]): void {
    this.stopScanning(false);

    if (targets.length === 0) {
      this.centerEyes();
      return;
    }

    this.scanning = true;
    this.scanTargets(this.shuffleTargets(targets), ++this.scanToken, 0);
  }

  public setEyeStyle(eyeStyle: OpponentEyeStyle): void {
    this.eyeStyle = eyeStyle;
  }

  public setAnimationSkipController(skipController: AnimationSkipController): void {
    this.skipController = skipController;
  }

  public setOpponent(opponent: OpponentState): void {
    this.face.setTexture(opponent.face.textureKey);
    this.face.setDisplaySize(PeterFaceView.faceWidth, PeterFaceView.faceHeight);
    this.eyeStyle = opponent.eyeStyle;
    this.leftEyeRest = this.getEyeRest(opponent.face.leftEyeCenter, opponent.face.sourceWidth, opponent.face.sourceHeight)
      ?? { ...this.defaultLeftEyeRest };
    this.rightEyeRest = this.getEyeRest(opponent.face.rightEyeCenter, opponent.face.sourceWidth, opponent.face.sourceHeight)
      ?? { ...this.defaultRightEyeRest };
    this.sunglasses.layout(this.leftEyeRest, this.rightEyeRest);
    this.centerEyes();
  }

  public setSunglassesVisible(visible: boolean): void {
    this.sunglasses.setVisible(visible);
    this.leftEye.setVisible(!visible);
    this.rightEye.setVisible(!visible);
  }

  public areSunglassesVisible(): boolean {
    return this.sunglasses.visible;
  }

  public stopScanning(centerEyes = true): void {
    this.scanning = false;
    this.scanToken += 1;
    this.scene.tweens.killTweensOf([this.leftEye, this.rightEye]);
    this.restoreEyeScale();
    if (centerEyes) {
      this.centerEyes();
    }
  }

  public centerEyes(): void {
    this.leftEye.setPosition(this.leftEyeRest.x, this.leftEyeRest.y);
    this.rightEye.setPosition(this.rightEyeRest.x, this.rightEyeRest.y);
    this.restoreEyeScale();
  }

  public getEyesCenterPoint(): Point {
    return {
      x: this.x + (this.leftEyeRest.x + this.rightEyeRest.x) / 2,
      y: this.y + (this.leftEyeRest.y + this.rightEyeRest.y) / 2
    };
  }

  public focusOn(target: PeterEyeTarget): void {
    this.stopScanning(false);
    this.scanning = true;
    const token = ++this.scanToken;

    this.lookAt(target.x, target.y, () => {
      if (!this.scanning || token !== this.scanToken) return;
      this.holdOnTarget(target, token, () => undefined);
    });
  }

  private createEye(x: number, y: number): Phaser.GameObjects.Image {
    const eye = new Phaser.GameObjects.Image(this.scene, x, y, CST.ASSETS.EYE);
    eye.setDisplaySize(PeterFaceView.eyeSize, PeterFaceView.eyeSize);
    eye.setOrigin(0.5);
    return eye;
  }

  private getEyeRest(
    sourceCenter: Point | undefined,
    sourceWidth: number | undefined,
    sourceHeight: number | undefined
  ): Point | null {
    if (!sourceCenter || !sourceWidth || !sourceHeight) return null;

    return {
      x: (sourceCenter.x / sourceWidth - 0.5) * PeterFaceView.faceWidth,
      y: (sourceCenter.y / sourceHeight - 0.5) * PeterFaceView.faceHeight
    };
  }

  private scanTargets(targets: PeterEyeTarget[], token: number, index: number): void {
    if (!this.scanning || token !== this.scanToken || targets.length === 0) return;

    const target = targets[index % targets.length];
    this.lookAt(target.x, target.y, () => {
      if (!this.scanning || token !== this.scanToken) return;

      this.holdOnTarget(target, token, () => {
        const nextIndex = index + 1;
        const nextTargets = nextIndex >= targets.length ? this.shuffleTargets(targets) : targets;
        this.scanTargets(nextTargets, token, nextIndex % targets.length);
      });
    });
  }

  private holdOnTarget(target: PeterEyeTarget, token: number, onComplete: () => void): void {
    const seesHotPotatoPete = target.cardId === CST.CARD_RULES.HOT_POTATO_PETE.ID;
    const showsHotPotatoPeteTell = seesHotPotatoPete && target.showHotPotatoPeteTell !== false;
    if (showsHotPotatoPeteTell && this.eyeStyle === "blink") {
      this.playBlinkTell(token, () => this.delayTarget(PeterFaceView.normalHoldMs, token, onComplete));
      return;
    }

    if (showsHotPotatoPeteTell && this.eyeStyle === "retina") {
      this.playRetinaTell(token, () => this.delayTarget(PeterFaceView.normalHoldMs, token, onComplete));
      return;
    }

    this.delayTarget(
      showsHotPotatoPeteTell ? PeterFaceView.hotPotatoPeteHoldMs : PeterFaceView.normalHoldMs,
      token,
      onComplete
    );
  }

  private delayTarget(baseMs: number, token: number, onComplete: () => void): void {
    this.scene.time.delayedCall(this.randomizeMs(baseMs), () => {
      if (!this.scanning || token !== this.scanToken) return;
      onComplete();
    });
  }

  private playBlinkTell(token: number, onComplete: () => void): void {
    this.scene.tweens.add({
      targets: [this.leftEye, this.rightEye],
      scaleY: this.eyeNeutralScale.y * 0.05,
      duration: 70,
      yoyo: true,
      ease: "Sine.easeInOut",
      onComplete: () => {
        if (!this.scanning || token !== this.scanToken) return;
        this.restoreEyeScale();
        onComplete();
      }
    });
  }

  private playRetinaTell(token: number, onComplete: () => void): void {
    this.scene.tweens.add({
      targets: [this.leftEye, this.rightEye],
      scaleX: this.eyeNeutralScale.x * 1.35,
      scaleY: this.eyeNeutralScale.y * 1.35,
      duration: 120,
      hold: 80,
      yoyo: true,
      ease: "Sine.easeInOut",
      onComplete: () => {
        if (!this.scanning || token !== this.scanToken) return;
        this.restoreEyeScale();
        onComplete();
      }
    });
  }

  private restoreEyeScale(): void {
    this.leftEye.setScale(this.eyeNeutralScale.x, this.eyeNeutralScale.y);
    this.rightEye.setScale(this.eyeNeutralScale.x, this.eyeNeutralScale.y);
  }

  private lookAt(parentX: number, parentY: number, onComplete?: () => void): void {
    const localTarget = {
      x: parentX - this.x,
      y: parentY - this.y
    };
    const leftOffset = this.getEyeOffset(localTarget, this.leftEyeRest);
    const rightOffset = this.getEyeOffset(localTarget, this.rightEyeRest);

    this.scene.tweens.killTweensOf([this.leftEye, this.rightEye]);
    this.scene.tweens.add({
      targets: this.leftEye,
      x: this.leftEyeRest.x + leftOffset.x,
      y: this.leftEyeRest.y + leftOffset.y,
      duration: PeterFaceView.moveDurationMs,
      ease: "Sine.easeInOut"
    });
    this.scene.tweens.add({
      targets: this.rightEye,
      x: this.rightEyeRest.x + rightOffset.x,
      y: this.rightEyeRest.y + rightOffset.y,
      duration: PeterFaceView.moveDurationMs,
      ease: "Sine.easeInOut",
      onComplete
    });
  }

  private getEyeOffset(
    target: Point,
    rest: Point
  ): Point {
    const dx = target.x - rest.x;
    const dy = target.y - rest.y;
    const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));

    return {
      x: Phaser.Math.Clamp((dx / distance) * PeterFaceView.eyeTravelX, -PeterFaceView.eyeTravelX, PeterFaceView.eyeTravelX),
      y: Phaser.Math.Clamp((dy / distance) * PeterFaceView.eyeTravelY, -PeterFaceView.eyeTravelY, PeterFaceView.eyeTravelY)
    };
  }

  private randomizeMs(baseMs: number): number {
    return Math.round(baseMs * Phaser.Math.FloatBetween(0.8, 1.2));
  }

  private shuffleTargets(targets: PeterEyeTarget[]): PeterEyeTarget[] {
    return Phaser.Utils.Array.Shuffle(targets.slice());
  }

  public get reactionFace(): Phaser.GameObjects.Image { return this.face; }
  public get reactionEyes(): readonly [Phaser.GameObjects.Image, Phaser.GameObjects.Image] {
    return [this.leftEye, this.rightEye];
  }
  public get reactionLeftRest(): Point { return this.leftEyeRest; }
  public get reactionRightRest(): Point { return this.rightEyeRest; }
  public get animationSkipController(): AnimationSkipController { return this.skipController; }
  public playAngry(long = false): Promise<void> { return this.reactions.playAngry(long); }
  public playHappy(long = false): Promise<void> { return this.reactions.playHappy(long); }
}
