import { Scene } from "phaser";
import { CST } from "../../CST";
import { TweenUtils } from "../../utils/TweenUtils";
import { UIManager } from "../../utils/UIManager";
import { ResizeManager } from "../ResizeManager";

export class ScaleScene extends Scene {
  public m_layer_basic!: Phaser.GameObjects.Container;
  public m_layer_cover00!: Phaser.GameObjects.Container;
  public m_layer_cover22!: Phaser.GameObjects.Container;
  public m_layer_cover22Top!: Phaser.GameObjects.Container;
  public m_layer_cover33!: Phaser.GameObjects.Container;
  public sceneGeneration = 0;
  public curtain!: Phaser.GameObjects.Rectangle;

  public create(): void {
    this.sceneGeneration++;
    this.events.once("shutdown", () => { this.sceneGeneration++; });
    ResizeManager.getInstance().initializeContainers(this);
    TweenUtils.scene = this;
  }

  public update(_time: number, _delta: number): void {
    if (ResizeManager.getInstance().isCurrentScene(this)) {
      ResizeManager.getInstance().update();
    }
  }

  public async showIntro(): Promise<void> {
    const generation = this.sceneGeneration;
    this.curtain = new Phaser.GameObjects.Rectangle(
      this,
      0,
      0,
      2000,
      2000,
      CST.COLORS.TABLE_DARK,
      1
    );
    this.curtain.setInteractive();
    this.m_layer_cover33.add(this.curtain);

    TweenUtils.opacityTween(this.curtain, 0, 350);
    await UIManager.waitForMs(350);
    if (!this.isSceneCurrent(generation)) return;
    this.curtain.destroy();
    UIManager.getInstance().clearTweens();
  }

  public isSceneCurrent(generation: number): boolean {
    return generation === this.sceneGeneration && this.scene.isActive();
  }

  public createPanel(
    x: number,
    y: number,
    width: number,
    height: number,
    color: number = CST.COLORS.PANEL,
    alpha: number = 1
  ): Phaser.GameObjects.Graphics {
    const graphics = new Phaser.GameObjects.Graphics(this);
    graphics.fillStyle(color, alpha);
    graphics.lineStyle(3, CST.COLORS.GOLD, 1);
    graphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, 16);
    graphics.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 16);
    return graphics;
  }
}
