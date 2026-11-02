import type { PokiPlugin } from "@poki/phaser-3";

declare const POKI_SDK: boolean;

export class PokiBridge {
  private static gameplayActive = false;
  private static breakActive = false;

  public static gameplayStart(scene: Phaser.Scene): void {
    const poki = PokiBridge.getPlugin(scene);
    if (!poki || PokiBridge.gameplayActive || PokiBridge.breakActive) return;

    poki.gameplayStart();
    PokiBridge.gameplayActive = true;
  }

  public static gameplayStop(scene: Phaser.Scene): void {
    const poki = PokiBridge.getPlugin(scene);
    if (!poki || !PokiBridge.gameplayActive) return;

    poki.gameplayStop();
    PokiBridge.gameplayActive = false;
  }

  public static async commercialBreak(scene: Phaser.Scene): Promise<void> {
    const poki = PokiBridge.getPlugin(scene);
    if (!poki || PokiBridge.breakActive) return;

    if (PokiBridge.gameplayActive) {
      poki.gameplayStop();
      PokiBridge.gameplayActive = false;
    }

    PokiBridge.breakActive = true;
    try {
      await poki.commercialBreak();
    } finally {
      PokiBridge.breakActive = false;
    }
  }

  private static getPlugin(scene: Phaser.Scene): PokiPlugin | null {
    if (typeof POKI_SDK === "undefined" || !POKI_SDK) return null;

    return scene.plugins.get("poki") as PokiPlugin | null;
  }
}
