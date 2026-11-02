import { ScaleScene } from "./ScaleScene";
import { CST } from "../../CST";
import { TweenUtils } from "../../utils/TweenUtils";
import { UIManager } from "../../utils/UIManager";
import { SoundPlayer } from "../SoundPlayer";
import { CustomButton } from "../components/CustomButton";

export abstract class BaseScreen extends ScaleScene {
  protected camera!: Phaser.Cameras.Scene2D.Camera;

  public screenLeftX = -CST.GAME.WIDTH / 2;
  public screenRightX = CST.GAME.WIDTH / 2;
  public screenTopY = -CST.GAME.HEIGHT / 2;

  constructor(id: string) {
    super(id);
  }

  public async create(): Promise<void> {
    super.create();
    const generation = this.sceneGeneration;
    this.initializeCamera();
    this.setupScene();
    await this.showIntro();
    if (this.isSceneCurrent(generation)) this.playEntranceAnimations();
  }

  protected initializeCamera(): void {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(CST.COLORS.TABLE_DARK);
  }

  protected setupScene(): void {
    SoundPlayer.getInstance().create(this);
    SoundPlayer.getInstance().playMapMusic();
    this.createGameObjects();
    this.setupButtonHandlers();
  }

  public async transitionToScene(nextScene: string, data?: object): Promise<void> {
    const generation = this.sceneGeneration;
    CustomButton.setSceneInputLocked(this, true);
    const curtain = new Phaser.GameObjects.Rectangle(
      this,
      0,
      0,
      2000,
      2000,
      CST.COLORS.TABLE_DARK,
      0
    );
    curtain.setInteractive();
    this.m_layer_cover33.add(curtain);

    TweenUtils.opacityTween(curtain, 1, 280);
    await UIManager.waitForMs(280);
    if (!this.isSceneCurrent(generation)) return;
    UIManager.getInstance().clearTweens();
    this.scene.start(nextScene, data);
  }

  protected abstract createGameObjects(): void;
  protected abstract setupButtonHandlers(): void;
  protected abstract playEntranceAnimations(): void;
}
