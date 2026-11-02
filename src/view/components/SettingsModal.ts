import { CST } from "../../CST";
import { StatsModel } from "../../model/StatsModel";
import { SoundPlayer } from "../SoundPlayer";
import { CustomButton } from "./CustomButton";

export interface SettingsModalOptions {
  onHide?: () => void;
  onMain?: () => void;
}

export class SettingsModal extends Phaser.GameObjects.Container {
  private soundButton: CustomButton;
  private musicButton: CustomButton;
  private onHide?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number, options: SettingsModalOptions = {}) {
    super(scene, x, y);
    this.onHide = options.onHide;

    const overlay = new Phaser.GameObjects.Rectangle(scene, 0, 0, 2000, 2000, 0x000000, 0.55);
    overlay.setInteractive();
    const panel = this.createPanel(scene);
    const title = new Phaser.GameObjects.Text(scene, 0, -145, CST.STRINGS.SETTINGS, {
      fontFamily: CST.FONT.MAIN,
      fontSize: "34px",
      color: "#fff2d5"
    }).setOrigin(0.5);

    this.soundButton = new CustomButton(scene, 0, -76, "", () => this.toggleSound(), 250, 58, CST.COLORS.BLUE);
    this.musicButton = new CustomButton(scene, 0, -3, "", () => this.toggleMusic(), 250, 58, CST.COLORS.BLUE);
    const mainButton = options.onMain
      ? new CustomButton(
          scene,
          0,
          71,
          CST.STRINGS.MAIN,
          options.onMain,
          250,
          58,
          CST.COLORS.BLUE
        )
      : null;
    const closeButton = new CustomButton(
      scene,
      0,
      145,
      CST.STRINGS.CLOSE,
      () => this.hide(),
      190,
      54,
      CST.COLORS.RED
    );

    this.add([
      overlay,
      panel,
      title,
      this.soundButton,
      this.musicButton,
      ...(mainButton ? [mainButton] : []),
      closeButton
    ]);
    this.refreshLabels();
    this.hideWithoutCallback();
  }

  public show(): void {
    this.refreshLabels();
    this.setVisible(true);
    this.setActive(true);
    CustomButton.setInputBlocker(this, true);
    this.setScale(0.9);
    this.scene.tweens.add({
      targets: this,
      scale: 1,
      duration: 220,
      ease: "Back.easeOut"
    });
  }

  public hide(): void {
    const wasVisible = this.visible;
    this.hideWithoutCallback();
    if (wasVisible) {
      this.onHide?.();
    }
  }

  private hideWithoutCallback(): void {
    CustomButton.setInputBlocker(this, false);
    this.setVisible(false);
    this.setActive(false);
  }

  private toggleSound(): void {
    const next = !StatsModel.getInstance().getStats().soundEnabled;
    SoundPlayer.getInstance().setSoundEnabled(next);
    this.refreshLabels();
  }

  private toggleMusic(): void {
    const next = !StatsModel.getInstance().getStats().musicEnabled;
    SoundPlayer.getInstance().setMusicEnabled(next);
    this.refreshLabels();
  }

  private refreshLabels(): void {
    const stats = StatsModel.getInstance().getStats();
    this.soundButton.setLabel(stats.soundEnabled ? CST.STRINGS.SOUND_ON : CST.STRINGS.SOUND_OFF);
    this.musicButton.setLabel(stats.musicEnabled ? CST.STRINGS.MUSIC_ON : CST.STRINGS.MUSIC_OFF);
  }

  private createPanel(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
    const graphics = new Phaser.GameObjects.Graphics(scene);
    graphics.fillStyle(CST.COLORS.PANEL_DARK, 1);
    graphics.lineStyle(4, CST.COLORS.GOLD, 1);
    graphics.fillRoundedRect(-185, -190, 370, 380, 20);
    graphics.strokeRoundedRect(-185, -190, 370, 380, 20);
    return graphics;
  }
}
