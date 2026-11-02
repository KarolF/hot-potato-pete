export class UIManager {
  public static instance: UIManager;
  private tweenArr: Phaser.Tweens.Tween[] = [];

  public static getInstance(): UIManager {
    if (!UIManager.instance) {
      UIManager.instance = new UIManager();
    }
    return UIManager.instance;
  }

  public registerTween(tween: Phaser.Tweens.Tween): void {
    this.tweenArr.push(tween);
  }

  public clearTweens(): void {
    for (const tween of this.tweenArr) {
      tween.stop();
      tween.remove();
    }
    this.tweenArr.length = 0;
  }

  public safeDestroy(go?: Phaser.GameObjects.GameObject): void {
    if (!go || !go.scene) return;
    go.removeAllListeners();
    go.destroy();
  }

  public static waitForMs(ms: number): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }
}
