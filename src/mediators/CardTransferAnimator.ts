import { CST } from "../CST";
import { Card } from "../model/interfaces";
import { AnimationSkipController } from "../utils/AnimationSkipController";
import { CardView } from "../view/components/CardView";
import { SoundPlayer } from "../view/SoundPlayer";

export type CardPose = { x: number; y: number; scale: number; rotation: number };
type SkippableTweenConfig = Phaser.Types.Tweens.TweenBuilderConfig;

export class CardTransferAnimator {
  constructor(
    private readonly scene: Phaser.Scene & {
      m_layer_cover22Top: Phaser.GameObjects.Container;
    },
    private readonly skipController: AnimationSkipController
  ) {}

  public create(card: Card, faceUp: boolean, pose: CardPose): CardView {
    const cardView = new CardView(this.scene, pose.x, pose.y, card, faceUp);
    cardView.setScale(pose.scale);
    cardView.setRotation(pose.rotation);
    this.scene.m_layer_cover22Top.add(cardView);
    return cardView;
  }

  public tween(card: CardView, config: CardPose & { duration: number }): Promise<void> {
    return this.skipController.waitForTween(this.scene, {
      targets: card,
      x: config.x,
      y: config.y,
      scale: config.scale,
      rotation: config.rotation,
      duration: config.duration,
      ease: "Sine.easeInOut"
    }, () => {
      card.setPosition(config.x, config.y);
      card.setScale(config.scale);
      card.setRotation(config.rotation);
    });
  }

  public async flip(card: CardView, faceUp: boolean): Promise<void> {
    const targetScaleX = card.scaleX;
    await this.skipController.waitForTween(this.scene, {
      targets: card,
      scaleX: 0.05,
      duration: 90,
      ease: "Sine.easeIn"
    }, () => {
      card.scaleX = 0.05;
    });
    card.setFaceUp(faceUp);
    await this.skipController.waitForTween(this.scene, {
      targets: card,
      scaleX: targetScaleX,
      duration: 110,
      ease: "Sine.easeOut"
    }, () => {
      card.scaleX = targetScaleX;
    });
  }

  public waitForTween(
    config: SkippableTweenConfig,
    applyFinalState: () => void
  ): Promise<void> {
    return this.skipController.waitForTween(this.scene, config, applyFinalState);
  }

  public playMoveSound(): void {
    SoundPlayer.getInstance().play(CST.AUDIO.SND_CARD_CLICK);
  }
}
