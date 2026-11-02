import type { Game } from "phaser";
import { GameController } from "../model/GameController";
import { GameStateModel } from "../model/GameStateModel";
import { Point } from "../model/interfaces";
import { DevMode } from "../utils/DevMode";
import { ResizeManager } from "../view/ResizeManager";
import type { CoverScreen } from "../view/scenes/CoverScreen";
import type { GameplayScreen } from "../view/scenes/GameplayScreen";
import { winMatch } from "./DebugActions";
import { CardHitRect, DebugGeometry } from "./DebugGeometry";

function getGameplayScene(game: Game): GameplayScreen | undefined {
  const scene = game.scene.getScene("GameplayScreen") as GameplayScreen;
  return scene?.scene.isActive() ? scene : undefined;
}

function cssPoints(game: Game, points: Point[]): Point[] {
  return points.map((point) => ResizeManager.designToCssPoint(game.canvas, point));
}

function cssRects(game: Game, rects: CardHitRect[]): CardHitRect[] {
  return rects.map((rect) => {
    const [topLeft, bottomRight] = cssPoints(game, [
      { x: rect.left, y: rect.top }, { x: rect.right, y: rect.bottom }
    ]);
    return { left: topLeft.x, right: bottomRight.x, top: topLeft.y, bottom: bottomRight.y };
  });
}

function createGeometryApi(game: Game) {
  const geometry = () => {
    const scene = getGameplayScene(game);
    return scene ? new DebugGeometry(scene) : undefined;
  };
  return {
    botCardClickPoints: () => geometry()?.getBotCardClickPoints() ?? [],
    playerCardClickPoints: () => geometry()?.getPlayerCardClickPoints() ?? [],
    botCardCssClickPoints: () => cssPoints(game, geometry()?.getBotCardClickPoints() ?? []),
    playerCardCssClickPoints: () => cssPoints(game, geometry()?.getPlayerCardClickPoints() ?? []),
    botCardCssClickRects: () => cssRects(game, geometry()?.getBotCardClickRects() ?? []),
    playerCardCssClickRects: () => cssRects(game, geometry()?.getPlayerCardClickRects() ?? []),
    botCardCssHitPoints: (index: number, points: Point[]) =>
      cssPoints(game, geometry()?.getBotCardHitPoints(index, points) ?? []),
    logicalToCss: (point: Point) => ResizeManager.designToCssPoint(game.canvas, point)
  };
}

function createInspectionApi(game: Game) {
  const scene = () => getGameplayScene(game);
  return {
    snapshot: () => GameStateModel.getInstance().getSnapshot(),
    activeScenes: () => game.scene.getScenes(true).map((active) => active.scene.key),
    coverReadyForInput() {
      const cover = game.scene.getScene("CoverScreen") as CoverScreen | undefined;
      return Boolean(cover?.scene.isActive() && cover.isReadyForInput());
    },
    readyForInput: () => Boolean(scene()?.isReadyForInput()),
    gameplayButtonsReadyForInput: () => Boolean(scene()?.areGameplayButtonsReadyForInput()),
    animationSkippable: () => Boolean(scene()?.canSkipAnimation()),
    opponentHintVisible: () => Boolean(scene()?.opponentHintOverlay.visible),
    opponentHintText: () => scene()?.opponentHintOverlay.getTextContent() ?? "",
    opponentSunglassesVisible: () => Boolean(scene()?.peterFace.areSunglassesVisible()),
    gameplayTutorialVisible: () => Boolean(scene()?.firstGameplayTutorial.isVisible()),
    gameplayTutorialText: () => scene()?.firstGameplayTutorial.getTextContent() ?? "",
    gameplayTutorialStage: () => scene()?.firstGameplayTutorial.getStage() ?? "",
    gameplayTutorialTargetCardId: () => scene()?.firstGameplayTutorial.getTargetCardId() ?? "",
    gameplayTutorialArrows: () => scene()?.firstGameplayTutorial.getArrowStates() ?? [],
    howToPlayText: () => scene()?.howToPlayModal.getTextContent() ?? "",
    devMode: () => DevMode.isEnabled()
  };
}

function createActionApi(game: Game) {
  return {
    startGame(seed = 1001, matchNumber?: number) {
      GameController.startNewGame(seed, matchNumber);
      ["Preloader", "CoverScreen", "GameplayScreen"].forEach((key) => game.scene.stop(key));
      game.scene.start("GameplayScreen");
    },
    dismissOpponentHint() {
      const hint = getGameplayScene(game)?.opponentHintOverlay;
      if (hint?.visible) hint.hide();
    },
    winMatch() {
      if (!DevMode.isEnabled()) return null;
      const scene = getGameplayScene(game);
      return scene ? winMatch(scene) : null;
    },
    draw: (index: number) => GameController.playerDraw(index),
    drawById: (cardId: string) => GameController.playerDrawById(cardId)
  };
}

function createDebugApi(game: Game) {
  return { ...createGeometryApi(game), ...createInspectionApi(game), ...createActionApi(game) };
}

export type DebugApi = ReturnType<typeof createDebugApi>;

declare global {
  interface Window {
    game?: Game;
    hotPotatoPete?: DebugApi;
  }
}

export function installDebugBridge(game: Game): void {
  window.game = game;
  window.hotPotatoPete = createDebugApi(game);
}
