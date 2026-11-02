import { CST } from "../CST";
import { Point } from "../model/interfaces";
import type { GameplayScreen } from "../view/scenes/GameplayScreen";

export interface CardHitRect { left: number; right: number; top: number; bottom: number; }

export class DebugGeometry {
  constructor(private readonly screen: GameplayScreen) {}

  public getBotCardClickPoints(): Point[] {
    return this.screen.botHand.getCardHitCenters().map((point) => ({
      x: CST.GAME.WIDTH / 2 + point.x,
      y: CST.GAME.HEIGHT / 2 + point.y
    }));
  }

  public getBotCardClickRects(): CardHitRect[] {
    return this.screen.botHand.getCardHitRects().map((rect) => ({
      left: CST.GAME.WIDTH / 2 + rect.left,
      right: CST.GAME.WIDTH / 2 + rect.right,
      top: CST.GAME.HEIGHT / 2 + rect.top,
      bottom: CST.GAME.HEIGHT / 2 + rect.bottom
    }));
  }

  public getBotCardHitPoints(index: number, localPoints: Point[]): Point[] {
    return this.screen.botHand.getCardHitPoints(index, localPoints).map((point) => ({
      x: CST.GAME.WIDTH / 2 + point.x,
      y: CST.GAME.HEIGHT / 2 + point.y
    }));
  }

  public getPlayerCardClickPoints(): Point[] {
    return this.screen.playerHand.getCardHitCenters().map((point) => ({
      x: CST.GAME.WIDTH / 2 + point.x,
      y: CST.GAME.HEIGHT / 2 + point.y
    }));
  }

  public getPlayerCardClickRects(): CardHitRect[] {
    return this.screen.playerHand.getCardHitRects().map((rect) => ({
      left: CST.GAME.WIDTH / 2 + rect.left,
      right: CST.GAME.WIDTH / 2 + rect.right,
      top: CST.GAME.HEIGHT / 2 + rect.top,
      bottom: CST.GAME.HEIGHT / 2 + rect.bottom
    }));
  }
}
