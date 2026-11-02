import { Scene } from "phaser";
import { CST } from "../../CST";
import { ResizeManager } from "../ResizeManager";

const BAR_WIDTH = 360;
const BAR_HEIGHT = 18;
const BAR_RADIUS = 9;

export class Preloader extends Scene {
  private loadingBarFill?: Phaser.GameObjects.Graphics;
  private loadingPercentText?: Phaser.GameObjects.Text;

  constructor() {
    super("Preloader");
  }

  public init(): void {
    this.cameras.main.setBackgroundColor(CST.COLORS.TABLE_DARK);
    ResizeManager.init(this.game);
    ResizeManager.getInstance().resize2();

    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    this.add.text(cx, cy - 20, CST.STRINGS.TITLE, {
      fontFamily: CST.FONT.MAIN,
      fontSize: "42px",
      color: "#fff2d5"
    }).setOrigin(0.5);
    this.add.text(cx, cy + 34, "Loading...", {
      fontFamily: CST.FONT.MAIN,
      fontSize: "22px",
      color: "#f4c95d"
    }).setOrigin(0.5);

    this.add.graphics()
      .fillStyle(CST.COLORS.PANEL_DARK, 1)
      .fillRoundedRect(
        cx - BAR_WIDTH / 2,
        cy + 72,
        BAR_WIDTH,
        BAR_HEIGHT,
        BAR_RADIUS
      )
      .lineStyle(2, CST.COLORS.CREAM, 0.75)
      .strokeRoundedRect(
        cx - BAR_WIDTH / 2,
        cy + 72,
        BAR_WIDTH,
        BAR_HEIGHT,
        BAR_RADIUS
      );

    this.loadingBarFill = this.add.graphics();
    this.loadingPercentText = this.add.text(cx, cy + 118, "0%", {
      fontFamily: CST.FONT.MAIN,
      fontSize: "24px",
      color: "#fff2d5"
    }).setOrigin(0.5);

    this.updateProgress(0);
    this.load.on("progress", this.updateProgress, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.removeLoaderListeners, this);
  }

  public preload(): void {
    this.load.setPath("assets");
    this.load.pack(CST.ASSETS.PACK, "asset-pack.json");
  }

  public create(): void {
    this.updateProgress(1);
    this.scene.start("CoverScreen");
  }

  private updateProgress(value: number): void {
    const progress = Phaser.Math.Clamp(value, 0, 1);
    const percent = Math.round(progress * 100);
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.loadingBarFill?.clear()
      .fillStyle(CST.COLORS.GOLD, 1)
      .fillRoundedRect(
        cx - BAR_WIDTH / 2 + 3,
        cy + 75,
        (BAR_WIDTH - 6) * progress,
        BAR_HEIGHT - 6,
        BAR_RADIUS - 3
      );
    this.loadingPercentText?.setText(`${percent}%`);
  }

  private removeLoaderListeners(): void {
    this.load.off("progress", this.updateProgress, this);
  }
}
