import { CST } from "../CST";
import { ButtonInputMediator } from "./ButtonInputMediator";
import { GameplayMediator } from "./GameplayMediator";
import { PokiBridge } from "../utils/PokiBridge";
import { ResizeManager } from "../view/ResizeManager";
import type { GameplayScreen } from "../view/scenes/GameplayScreen";

export class GameplayInputMediator {
  private pokiGameplayStartPending = false;
  private readonly pointerDown = (event: PointerEvent) => this.handleDomPointerDown(event);
  private readonly pointerMove = (event: PointerEvent) => this.handleDomPointerMove(event);
  private readonly pointerLeave = () => this.clearCardHover();

  constructor(private readonly screen: GameplayScreen) {
    const canvas = screen.game.canvas;
    canvas.addEventListener("pointerdown", this.pointerDown, true);
    canvas.addEventListener("pointermove", this.pointerMove, true);
    canvas.addEventListener("pointerleave", this.pointerLeave, true);
    screen.events.once("shutdown", () => {
      canvas.removeEventListener("pointerdown", this.pointerDown, true);
      canvas.removeEventListener("pointermove", this.pointerMove, true);
      canvas.removeEventListener("pointerleave", this.pointerLeave, true);
      canvas.style.cursor = "default";
    });
  }

  private handleDomPointerDown(event: PointerEvent): void {
    const point = ResizeManager.clientToDesignPoint(event, this.screen.game.canvas);
    this.startPendingPokiGameplayFromPointer();
    this.handleLogicalPointerDown(point.x, point.y);
  }

  private handleDomPointerMove(event: PointerEvent): void {
    if (!this.canUseGameplayInput()) {
      this.clearCardHover();
      this.screen.game.canvas.style.cursor = "default";
      return;
    }

    const point = ResizeManager.clientToDesignPoint(event, this.screen.game.canvas);
    const botHandX = point.x - CST.GAME.WIDTH / 2 - this.screen.botHand.x;
    const botHandY = point.y - CST.GAME.HEIGHT / 2 - this.screen.botHand.y;
    const playerHandX = point.x - CST.GAME.WIDTH / 2 - this.screen.playerHand.x;
    const playerHandY = point.y - CST.GAME.HEIGHT / 2 - this.screen.playerHand.y;
    const rawBotCardHit = this.canSelectOpponentCard()
      ? this.screen.botHand.getCardAt(botHandX, botHandY)
      : null;
    const botCardHit =
      rawBotCardHit && this.screen.firstGameplayTutorial.allowsOpponentCard(rawBotCardHit.cardId)
        ? rawBotCardHit
        : null;
    const playerCardHit = this.canShufflePlayerHand()
      ? this.screen.playerHand.getCardAt(playerHandX, playerHandY)
      : null;

    this.screen.botHand.setHoverIndex(botCardHit?.index ?? -1);
    this.screen.playerHand.setHoverIndex(playerCardHit?.index ?? -1);
    if (botCardHit || playerCardHit) {
      this.screen.game.canvas.style.cursor = "pointer";
    } else {
      this.screen.game.canvas.style.cursor = "default";
    }
  }

  private handleLogicalPointerDown(x: number, y: number): void {
    const snapshot = this.screen.getCurrentSnapshot();
    const canSkipAtPointerStart = this.screen.animationMediator.canSkipCurrentAnimation();
    if (canSkipAtPointerStart && this.canUseAnimationSkipInput()) {
      this.screen.animationMediator.skipCurrentAnimation();
      return;
    }

    if (!this.canUseGameplayInput()) return;

    if (this.canShufflePlayerHand()) {
      const playerHandX = x - CST.GAME.WIDTH / 2 - this.screen.playerHand.x;
      const playerHandY = y - CST.GAME.HEIGHT / 2 - this.screen.playerHand.y;
      const playerCardHit = this.screen.playerHand.getCardAt(playerHandX, playerHandY);
      if (playerCardHit) {
        GameplayMediator.getInstance().onPlayerHandShuffleRequested();
        return;
      }
    }

    if (!this.canSelectOpponentCard()) return;

    const handX = x - CST.GAME.WIDTH / 2 - this.screen.botHand.x;
    const handY = y - CST.GAME.HEIGHT / 2 - this.screen.botHand.y;
    const cardHit = this.screen.botHand.getCardAt(handX, handY);

    if (cardHit) {
      if (!this.screen.firstGameplayTutorial.handleOpponentCardSelected(
        cardHit.cardId,
        snapshot
      )) {
        return;
      }
      GameplayMediator.getInstance().onOpponentCardSelected(cardHit.cardId, cardHit.index);
    }
  }

  public refreshInput(): void {
    const snapshot = this.screen.getCurrentSnapshot();
    if (snapshot) {
      this.screen.botHand.setSelectable(this.canSelectOpponentCard());
      this.screen.playerHand.setSelectable(this.canShufflePlayerHand());
    }
  }

  public canSkipAnimation(): boolean {
    return this.screen.animationMediator.canSkipCurrentAnimation() && this.canUseAnimationSkipInput();
  }

  public canSelectOpponentCard(): boolean {
    const snapshot = this.screen.getCurrentSnapshot();
    if (!snapshot || snapshot.phase !== CST.GAME_PHASE.PLAYER_DRAW) {
      return false;
    }
    if (this.screen.firstGameplayTutorial.blocksCardSelection()) return false;
    return this.canUseGameplayInput();
  }

  private canShufflePlayerHand(): boolean {
    const snapshot = this.screen.getCurrentSnapshot();
    if (!snapshot || snapshot.phase !== CST.GAME_PHASE.PLAYER_DRAW) {
      return false;
    }
    if (this.screen.firstGameplayTutorial.isRunning()) return false;
    if (snapshot.players.player.hand.length < 2) return false;
    return this.canUseGameplayInput();
  }

  private canUseGameplayInput(): boolean {
    return !this.screen.isWaitingForAnimation && this.canUseSceneInput();
  }

  private canUseAnimationSkipInput(): boolean {
    return this.screen.isWaitingForAnimation && this.canUseSceneInput();
  }

  private canUseSceneInput(): boolean {
    if (!ButtonInputMediator.canSceneReceiveInput(this.screen) || this.screen.curtain?.active) return false;
    if (this.screen.opponentHintOverlay?.visible) return false;
    if (
      this.screen.settingsModal.visible ||
      this.screen.howToPlayModal.visible ||
      this.screen.confirmationModal.visible
    ) return false;
    return true;
  }

  public clearCardHover(): void {
    this.screen.botHand?.setHoverIndex(-1);
    this.screen.playerHand?.setHoverIndex(-1);
  }

  public requestPokiGameplayStart(): void {
    this.pokiGameplayStartPending = true;
  }

  private startPendingPokiGameplayFromPointer(): void {
    if (!this.pokiGameplayStartPending) return;
    if (!this.canStartPokiGameplay()) return;

    PokiBridge.gameplayStart(this.screen);
    this.pokiGameplayStartPending = false;
  }

  private canStartPokiGameplay(): boolean {
    const snapshot = this.screen.getCurrentSnapshot();
    if (!snapshot || snapshot.phase === CST.GAME_PHASE.GAME_OVER) return false;
    return this.canUseGameplayInput();
  }
}
