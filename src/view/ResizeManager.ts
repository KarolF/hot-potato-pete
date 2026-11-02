import type { ScaleScene } from "./scenes/ScaleScene";
import { CST } from "../CST";

interface ScreenDimensions {
  w: number;
  h: number;
}

interface Point {
  x: number;
  y: number;
}

export class ResizeManager {
  public static instance: ResizeManager;
  private static game?: Phaser.Game;
  private currentScene?: ScaleScene;
  public static DESKTOPMODE = true;
  public static PhaserEngineConfig: Phaser.Types.Core.GameConfig;
  public static EngineValues = {
    display: {
      designWidth: CST.GAME.WIDTH,
      designHeight: CST.GAME.HEIGHT,
      responsiveWidth: CST.GAME.WIDTH,
      responsiveHeight: CST.GAME.HEIGHT,
      dpi: 1,
      lastWidth: 1,
      lastHeight: 1
    }
  };

  public static getInstance(): ResizeManager {
    if (!ResizeManager.instance) {
      ResizeManager.instance = new ResizeManager();
    }
    return ResizeManager.instance;
  }

  private static getRealScreenSize(): ScreenDimensions {
    const containerSize = ResizeManager.getGameContainerSize();
    if (containerSize) return containerSize;

    if (document.documentElement?.clientWidth) {
      return {
        w: document.documentElement.clientWidth,
        h: document.documentElement.clientHeight
      };
    }

    return {
      w: window.innerWidth,
      h: window.innerHeight
    };
  }

  private static getGameContainerSize(): ScreenDimensions | null {
    const container = document.getElementById("game-container");
    const rect = container?.getBoundingClientRect();

    if (!rect || rect.width <= 0 || rect.height <= 0) return null;

    return {
      w: rect.width,
      h: rect.height
    };
  }

  public static init(game?: Phaser.Game): void {
    if (game) ResizeManager.game = game;
    const engineValues = ResizeManager.EngineValues;
    const config = ResizeManager.PhaserEngineConfig;
    const scaleConfig = config.scale as Phaser.Types.Core.ScaleConfig;

    engineValues.display.designWidth = Number(scaleConfig.width || CST.GAME.WIDTH);
    engineValues.display.designHeight = Number(scaleConfig.height || CST.GAME.HEIGHT);
  }

  public static clientToDesignPoint(event: PointerEvent, canvas: HTMLCanvasElement): Point {
    const point = ResizeManager.clientToGamePoint(event, canvas);
    const offset = ResizeManager.getDesignOffset();

    return {
      x: point.x - offset.x,
      y: point.y - offset.y
    };
  }

  public static clientToGamePoint(event: PointerEvent, canvas: HTMLCanvasElement): Point {
    const rect = canvas.getBoundingClientRect();
    const display = ResizeManager.EngineValues.display;

    return {
      x: ((event.clientX - rect.left) / rect.width) * display.responsiveWidth,
      y: ((event.clientY - rect.top) / rect.height) * display.responsiveHeight
    };
  }

  public static designToCssPoint(canvas: HTMLCanvasElement, point: Point): Point {
    const rect = canvas.getBoundingClientRect();
    const offset = ResizeManager.getDesignOffset();
    const display = ResizeManager.EngineValues.display;

    return {
      x: rect.left + ((point.x + offset.x) / display.responsiveWidth) * rect.width,
      y: rect.top + ((point.y + offset.y) / display.responsiveHeight) * rect.height
    };
  }

  public update(): void {
    const engineValues = ResizeManager.EngineValues;
    const realSize = ResizeManager.getRealScreenSize();

    if (
      realSize.w !== engineValues.display.lastWidth ||
      realSize.h !== engineValues.display.lastHeight
    ) {
      engineValues.display.lastWidth = realSize.w;
      engineValues.display.lastHeight = realSize.h;
      this.resize2();
    }
  }

  public resize2(): void {
    const engineValues = ResizeManager.EngineValues;
    const responsiveSize = ResizeManager.getResponsiveGameSize();

    engineValues.display.responsiveWidth = responsiveSize.w;
    engineValues.display.responsiveHeight = responsiveSize.h;

    const game = ResizeManager.game;
    game?.scale.setGameSize(responsiveSize.w, responsiveSize.h);
    this.updateCurrentSceneLayout();
  }

  private static getResponsiveGameSize(): ScreenDimensions {
    const engineValues = ResizeManager.EngineValues;
    const realSize = ResizeManager.getRealScreenSize();

    if (realSize.w <= 0 || realSize.h <= 0) {
      return {
        w: engineValues.display.designWidth,
        h: engineValues.display.designHeight
      };
    }

    const ratioRealWH = realSize.w / realSize.h;
    const ratioDesignWH = engineValues.display.designWidth / engineValues.display.designHeight;
    const ratioRealHW = realSize.h / realSize.w;
    const ratioDesignHW = engineValues.display.designHeight / engineValues.display.designWidth;

    if (ratioRealWH > ratioDesignWH) {
      return {
        w: engineValues.display.designWidth * ratioDesignHW * ratioRealWH,
        h: engineValues.display.designHeight
      };
    }

    return {
      w: engineValues.display.designWidth,
      h: engineValues.display.designHeight * ratioDesignWH * ratioRealHW
    };
  }

  private static getDesignOffset(): Point {
    const display = ResizeManager.EngineValues.display;

    return {
      x: (display.responsiveWidth - display.designWidth) / 2,
      y: (display.responsiveHeight - display.designHeight) / 2
    };
  }

  private updateCurrentSceneLayout(): void {
    const scene = this.currentScene;

    if (!scene?.m_layer_basic) return;

    const display = ResizeManager.EngineValues.display;
    scene.m_layer_basic.setPosition(display.responsiveWidth / 2, display.responsiveHeight / 2);
  }

  public isCurrentScene(scene: Phaser.Scene): boolean {
    return this.currentScene === scene;
  }

  public initializeContainers(scene: ScaleScene): void {
    ResizeManager.game = scene.game;

    scene.m_layer_basic = scene.make.container({}, true);
    scene.m_layer_basic.x = CST.GAME.WIDTH / 2;
    scene.m_layer_basic.y = CST.GAME.HEIGHT / 2;

    scene.m_layer_cover00 = scene.make.container({}, false);
    scene.m_layer_cover22 = scene.make.container({}, false);
    scene.m_layer_cover22Top = scene.make.container({}, false);
    scene.m_layer_cover33 = scene.make.container({}, false);

    scene.m_layer_basic.add(scene.m_layer_cover00);
    scene.m_layer_basic.add(scene.m_layer_cover22);
    scene.m_layer_basic.add(scene.m_layer_cover22Top);
    scene.m_layer_basic.add(scene.m_layer_cover33);

    this.currentScene = scene;
    ResizeManager.init();
    this.resize2();
  }
}
