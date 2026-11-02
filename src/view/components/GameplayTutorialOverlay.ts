import { CST } from "../../CST";
import { Point } from "../../model/interfaces";
import { CustomButton } from "./CustomButton";
import { GameplayTutorialCurtain } from "./GameplayTutorialCurtain";
import { GameplayTutorialMarker, GameplayTutorialMarkerKind } from "./GameplayTutorialMarker";

type TutorialArrowName = "primary" | "secondary";
type TutorialArrowSide = "bottom" | "left" | "right";

interface TutorialArrowConfig {
  name: TutorialArrowName;
  target: Point;
  side: TutorialArrowSide;
  pingPong?: boolean;
  marker?: GameplayTutorialMarkerKind;
}

export class GameplayTutorialOverlay extends Phaser.GameObjects.Container {
  private static readonly arrowHeightRatio = 140 / 460;
  private static readonly arrowMinWidth = 73;
  private static readonly arrowMaxWidth = 118;
  private static readonly arrowPingPongMs = 560;

  private readonly arrows: Record<TutorialArrowName, Phaser.GameObjects.Image>;
  private readonly marker: GameplayTutorialMarker;
  private readonly curtains: Phaser.GameObjects.Rectangle[];
  private readonly infoPanel: Phaser.GameObjects.Graphics;
  private readonly titleText: Phaser.GameObjects.Text;
  private readonly hintText: Phaser.GameObjects.Text;
  private arrowStates: {
    name: TutorialArrowName;
    side: TutorialArrowSide;
    target: Point;
    tail: Point;
  }[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.arrows = {
      primary: this.createArrow(),
      secondary: this.createArrow()
    };
    this.marker = new GameplayTutorialMarker(scene);
    this.curtains = GameplayTutorialCurtain.create(scene);
    this.infoPanel = new Phaser.GameObjects.Graphics(scene);
    this.titleText = new Phaser.GameObjects.Text(scene, 0, -139, CST.STRINGS.OPPONENT_HINT, {
      fontFamily: CST.FONT.MAIN,
      fontSize: "23px",
      color: "#f4c95d"
    }).setOrigin(0.5);
    this.hintText = new Phaser.GameObjects.Text(scene, 0, -101, "", {
      fontFamily: CST.FONT.MAIN,
      fontSize: "20px",
      color: "#fff2d5",
      align: "center",
      wordWrap: { width: 370 }
    }).setOrigin(0.5);

    this.add([
      ...this.curtains,
      this.arrows.primary,
      this.arrows.secondary,
      this.marker,
      this.infoPanel,
      this.titleText,
      this.hintText
    ]);
    this.hide();
  }

  public showCardTarget(target: Point, hintText = "", side: TutorialArrowSide = "right"): void {
    this.showCardTargetWithMotion(target, hintText, side, false, undefined);
  }

  public showMovingCardTarget(
    target: Point,
    hintText = "",
    side: TutorialArrowSide = "right"
  ): void {
    this.showCardTargetWithMotion(target, hintText, side, true, "ok");
  }

  public showWrongCardTarget(target: Point, hintText = "", side: TutorialArrowSide = "right"): void {
    this.showCardTargetWithMotion(target, hintText, side, false, "no");
  }

  private showCardTargetWithMotion(
    target: Point,
    hintText: string,
    side: TutorialArrowSide,
    pingPong: boolean,
    marker: GameplayTutorialMarkerKind | undefined
  ): void {
    this.setInfoText(hintText);
    this.showArrows([
      {
        name: "primary",
        target,
        side,
        pingPong,
        marker
      }
    ]);
  }

  public showEyeTarget(eyeTarget: Point, hintText: string): void {
    this.setInfoText(hintText);
    this.showArrows([
      {
        name: "primary",
        target: eyeTarget,
        side: "bottom"
      }
    ]);
  }

  public hide(): void {
    this.scene?.tweens?.killTweensOf([this.arrows.primary, this.arrows.secondary]);
    CustomButton.setInputBlocker(this, false);
    this.arrowStates = [];
    this.marker.setVisible(false);
    this.setVisible(false);
    this.setActive(false);
  }

  public getTextContent(): string {
    return this.hintText.text;
  }

  public getArrowStates(): {
    name: TutorialArrowName;
    side: TutorialArrowSide;
    target: Point;
    tail: Point;
  }[] {
    return this.arrowStates.map((state) => ({
      ...state,
      target: { ...state.target },
      tail: { ...state.tail }
    }));
  }

  private createArrow(): Phaser.GameObjects.Image {
    const arrow = new Phaser.GameObjects.Image(this.scene, 0, 0, CST.ASSETS.HTP_ARROW);
    arrow.setOrigin(1, 0.5);
    arrow.setVisible(false);
    return arrow;
  }

  private setInfoText(hintText: string): void {
    const hasHint = hintText.length > 0;

    this.infoPanel.clear();
    if (hasHint) {
      this.infoPanel.fillStyle(CST.COLORS.PANEL_DARK, 0.9);
      this.infoPanel.lineStyle(3, CST.COLORS.GOLD, 0.95);
      this.infoPanel.fillRoundedRect(-220, -165, 440, 94, 14);
      this.infoPanel.strokeRoundedRect(-220, -165, 440, 94, 14);
    }

    this.infoPanel.setVisible(hasHint);
    this.titleText.setVisible(hasHint);
    this.hintText.setVisible(hasHint);
    this.hintText.setText(hintText);
  }

  private showArrows(configs: TutorialArrowConfig[]): void {
    this.setVisible(true);
    this.setActive(true);
    CustomButton.setInputBlocker(this, true);
    this.scene.tweens.killTweensOf([this.arrows.primary, this.arrows.secondary]);
    this.arrows.primary.setVisible(false);
    this.arrows.secondary.setVisible(false);
    this.marker.setVisible(false);
    this.arrowStates = [];

    configs.forEach((config) => this.placeArrow(config));
  }

  private placeArrow(config: TutorialArrowConfig): void {
    const arrow = this.arrows[config.name];
    const tail = this.getTail(config.target, config.side);
    const size = this.getArrowSize(config.target, tail);

    arrow.setPosition(config.target.x, config.target.y);
    arrow.setRotation(this.getArrowRotation(config.side));
    arrow.setDisplaySize(size.width, size.height);
    arrow.setAlpha(1);
    arrow.setVisible(true);
    this.arrowStates.push({
      name: config.name,
      side: config.side,
      target: { ...config.target },
      tail
    });
    this.placeMarker(config.marker, config.target, tail);
    if (config.pingPong) {
      const start = this.getTail(config.target, config.side);
      arrow.setPosition(start.x, start.y);
      this.scene.tweens.add({
        targets: arrow,
        x: config.target.x,
        y: config.target.y,
        duration: GameplayTutorialOverlay.arrowPingPongMs,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
      return;
    }

    this.scene.tweens.add({
      targets: arrow,
      alpha: 0.72,
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }

  private placeMarker(
    marker: GameplayTutorialMarkerKind | undefined,
    target: Point,
    tail: Point
  ): void {
    if (!marker) return;
    this.marker.show(marker, target, tail);
  }

  private getTailOffset(side: TutorialArrowSide): Point {
    if (side === "bottom") {
      return {
        x: 0,
        y: 132
      };
    }

    return {
      x: side === "right" ? 132 : -132,
      y: 0
    };
  }

  private getTail(target: Point, side: TutorialArrowSide): Point {
    const tailOffset = this.getTailOffset(side);
    return {
      x: target.x + tailOffset.x,
      y: target.y + tailOffset.y
    };
  }

  private getArrowSize(target: Point, tail: Point): { width: number; height: number } {
    const distance = Phaser.Math.Distance.Between(tail.x, tail.y, target.x, target.y);
    const width = Phaser.Math.Clamp(
      distance,
      GameplayTutorialOverlay.arrowMinWidth,
      GameplayTutorialOverlay.arrowMaxWidth
    );

    return {
      width,
      height: width * GameplayTutorialOverlay.arrowHeightRatio
    };
  }

  private getArrowRotation(side: TutorialArrowSide): number {
    if (side === "right") return Math.PI;
    if (side === "bottom") return -Math.PI / 2;
    return 0;
  }
}
