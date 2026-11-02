import { Card } from "../../model/interfaces";
import { CardView } from "./CardView";
import { CardLayout } from "./HandTypes";

export class HandCardFactory {
  public static create(
    scene: Phaser.Scene,
    layout: CardLayout,
    card: Card,
    faceUp: boolean,
    alpha: number = 1
  ): CardView {
    const cardView = new CardView(scene, layout.x, layout.y, card, faceUp);
    cardView.setRestPose(layout.x, layout.y, layout.scale, layout.rotation);
    cardView.setAlpha(alpha);
    cardView.disableInteractive();
    return cardView;
  }
}
