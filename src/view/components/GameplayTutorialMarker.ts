import { CST } from "../../CST";
import { Point } from "../../model/interfaces";

export type GameplayTutorialMarkerKind = "ok" | "no";

export class GameplayTutorialMarker extends Phaser.GameObjects.Image {
  private static readonly size = 58;
  private static readonly offsetY = 54;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, CST.ASSETS.HTP_OK);
    this.setDisplaySize(GameplayTutorialMarker.size, GameplayTutorialMarker.size);
    this.setVisible(false);
  }

  public show(kind: GameplayTutorialMarkerKind, target: Point, tail: Point): void {
    this.setTexture(kind === "ok" ? CST.ASSETS.HTP_OK : CST.ASSETS.HTP_NO);
    this.setDisplaySize(GameplayTutorialMarker.size, GameplayTutorialMarker.size);
    this.setPosition(
      (target.x + tail.x) / 2,
      Math.min(target.y, tail.y) - GameplayTutorialMarker.offsetY
    );
    this.setVisible(true);
  }
}
