import { Game, Types } from "phaser";
import { CST } from "./CST";
import { ResizeManager } from "./view/ResizeManager";
import { CoverScreen } from "./view/scenes/CoverScreen";
import { GameplayScreen } from "./view/scenes/GameplayScreen";
import { Preloader } from "./view/scenes/Preloader";

declare const POKI_SDK: boolean;

const config: Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  width: CST.GAME.WIDTH,
  height: CST.GAME.HEIGHT,
  parent: "game-container",
  backgroundColor: "#123823",
  roundPixels: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0, x: 0 },
      debug: false
    }
  },
  scale: {
    width: CST.GAME.WIDTH,
    height: CST.GAME.HEIGHT,
    min: {
      width: 240,
      height: 135
    },
    max: {
      width: 8000,
      height: 8000
    },
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  plugins: {
    global: createGlobalPlugins()
  },
  scene: [Preloader, CoverScreen, GameplayScreen]
};

ResizeManager.PhaserEngineConfig = config;

const game = new Game(config);
if (DEV_TOOLS) {
  void import("./debug/DebugBridge").then(({ installDebugBridge }) => installDebugBridge(game));
}

export default game;

function createGlobalPlugins(): Types.Core.PluginObjectItem[] {
  if (!POKI_SDK) return [];

  const { PokiPlugin } = require("@poki/phaser-3");
  return [
    {
      key: "poki",
      plugin: PokiPlugin,
      start: true,
      data: {
        loadingSceneKey: "Preloader",
        autoCommercialBreak: false
      }
    }
  ];
}
