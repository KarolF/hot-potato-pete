import { ResizeManager } from "../view/ResizeManager";

export type ButtonInputTarget = Phaser.GameObjects.Container & {
  canReceiveInput(): boolean;
  containsGamePoint(gameX: number, gameY: number): boolean;
  setHovered(hovered: boolean): void;
  trigger(): void;
};

export class ButtonInputMediator {
  private static buttons: ButtonInputTarget[] = [];
  private static blockers: Phaser.GameObjects.Container[] = [];
  private static canvases = new WeakSet<HTMLCanvasElement>();
  private static hoveredByCanvas = new WeakMap<HTMLCanvasElement, ButtonInputTarget>();
  private static lockedScenes = new WeakSet<Phaser.Scene>();
  private static sceneShutdownHooks = new WeakSet<Phaser.Scene>();

  public static register(button: ButtonInputTarget): void {
    ButtonInputMediator.buttons.push(button);
    ButtonInputMediator.ensureSceneShutdownCleanup(button.scene);
    const canvas = button.scene.game.canvas;
    if (ButtonInputMediator.canvases.has(canvas)) return;

    canvas.addEventListener(
      "pointerdown",
      (event) => ButtonInputMediator.handleCanvasPointerDown(event, canvas),
      true
    );
    canvas.addEventListener(
      "pointermove",
      (event) => ButtonInputMediator.handleCanvasPointerMove(event, canvas),
      true
    );
    canvas.addEventListener(
      "pointerleave",
      () => ButtonInputMediator.handleCanvasPointerLeave(canvas),
      true
    );
    ButtonInputMediator.canvases.add(canvas);
  }

  public static unregister(button: ButtonInputTarget): void {
    ButtonInputMediator.buttons = ButtonInputMediator.buttons.filter((item) => item !== button);
    const canvas = button.scene?.game.canvas;
    if (canvas && ButtonInputMediator.hoveredByCanvas.get(canvas) === button) {
      ButtonInputMediator.hoveredByCanvas.delete(canvas);
      canvas.style.cursor = "default";
    }
  }

  public static setInputBlocker(blocker: Phaser.GameObjects.Container, active: boolean): void {
    ButtonInputMediator.blockers = ButtonInputMediator.blockers.filter((item) => item !== blocker);
    if (active) {
      ButtonInputMediator.blockers.push(blocker);
    }
  }

  public static setSceneInputLocked(scene: Phaser.Scene, locked: boolean): void {
    if (locked) {
      ButtonInputMediator.lockedScenes.add(scene);
      ButtonInputMediator.clearHoverForScene(scene);
    } else {
      ButtonInputMediator.lockedScenes.delete(scene);
    }
  }

  public static canButtonReceiveGlobalInput(button: ButtonInputTarget): boolean {
    if (!button.scene || !ButtonInputMediator.canSceneReceiveInput(button.scene)) return false;
    if (ButtonInputMediator.isBlockedByActiveContainer(button)) return false;

    return ButtonInputMediator.canContainerReceiveInput(button);
  }

  public static canSceneReceiveInput(scene: Phaser.Scene): boolean {
    return scene.scene.isActive() && !ButtonInputMediator.lockedScenes.has(scene);
  }

  private static ensureSceneShutdownCleanup(scene: Phaser.Scene): void {
    if (ButtonInputMediator.sceneShutdownHooks.has(scene)) return;
    scene.events.on("shutdown", () => ButtonInputMediator.cleanupScene(scene));
    ButtonInputMediator.sceneShutdownHooks.add(scene);
  }

  private static cleanupScene(scene: Phaser.Scene): void {
    ButtonInputMediator.buttons = ButtonInputMediator.buttons.filter((button) => button.scene !== scene);
    ButtonInputMediator.blockers = ButtonInputMediator.blockers.filter(
      (blocker) => blocker.scene !== scene
    );
    ButtonInputMediator.lockedScenes.delete(scene);
    ButtonInputMediator.clearHoverForScene(scene);
  }

  private static handleCanvasPointerDown(event: PointerEvent, canvas: HTMLCanvasElement): void {
    const point = ResizeManager.clientToGamePoint(event, canvas);

    for (let i = ButtonInputMediator.buttons.length - 1; i >= 0; i--) {
      const button = ButtonInputMediator.buttons[i];
      if (button.scene?.game.canvas !== canvas) continue;
      if (!button.canReceiveInput()) continue;
      if (!button.containsGamePoint(point.x, point.y)) continue;

      event.preventDefault();
      event.stopPropagation();
      button.trigger();
      return;
    }
  }

  private static handleCanvasPointerMove(event: PointerEvent, canvas: HTMLCanvasElement): void {
    const button = ButtonInputMediator.findButtonAt(event, canvas);
    const previous = ButtonInputMediator.hoveredByCanvas.get(canvas);

    if (previous && previous !== button) {
      previous.setHovered(false);
    }

    if (button) {
      button.setHovered(true);
      ButtonInputMediator.hoveredByCanvas.set(canvas, button);
      canvas.style.cursor = "pointer";
    } else {
      ButtonInputMediator.hoveredByCanvas.delete(canvas);
      canvas.style.cursor = "default";
    }
  }

  private static handleCanvasPointerLeave(canvas: HTMLCanvasElement): void {
    const previous = ButtonInputMediator.hoveredByCanvas.get(canvas);
    if (previous) {
      previous.setHovered(false);
      ButtonInputMediator.hoveredByCanvas.delete(canvas);
    }
    canvas.style.cursor = "default";
  }

  private static findButtonAt(
    event: PointerEvent,
    canvas: HTMLCanvasElement
  ): ButtonInputTarget | undefined {
    const point = ResizeManager.clientToGamePoint(event, canvas);

    for (let i = ButtonInputMediator.buttons.length - 1; i >= 0; i--) {
      const button = ButtonInputMediator.buttons[i];
      if (button.scene?.game.canvas !== canvas) continue;
      if (!button.canReceiveInput()) continue;
      if (button.containsGamePoint(point.x, point.y)) return button;
    }

    return undefined;
  }

  private static isBlockedByActiveContainer(button: ButtonInputTarget): boolean {
    const blocker = ButtonInputMediator.findTopActiveBlocker(button.scene);
    return Boolean(blocker && !ButtonInputMediator.isDescendantOf(button, blocker));
  }

  private static findTopActiveBlocker(scene: Phaser.Scene): Phaser.GameObjects.Container | undefined {
    for (let i = ButtonInputMediator.blockers.length - 1; i >= 0; i--) {
      const blocker = ButtonInputMediator.blockers[i];
      if (blocker.scene !== scene) continue;
      if (ButtonInputMediator.canContainerReceiveInput(blocker)) return blocker;
    }

    return undefined;
  }

  private static canContainerReceiveInput(container: Phaser.GameObjects.Container): boolean {
    if (!container.scene?.scene.isActive()) return false;

    let node: Phaser.GameObjects.Container | null = container;
    while (node) {
      if (!node.visible || !node.active) return false;
      node = node.parentContainer;
    }

    return true;
  }

  private static isDescendantOf(
    button: ButtonInputTarget,
    ancestor: Phaser.GameObjects.Container
  ): boolean {
    let node: Phaser.GameObjects.Container | null = button;
    while (node) {
      if (node === ancestor) return true;
      node = node.parentContainer;
    }

    return false;
  }

  private static clearHoverForScene(scene: Phaser.Scene): void {
    const canvas = scene.game.canvas;
    const previous = ButtonInputMediator.hoveredByCanvas.get(canvas);
    if (previous?.scene === scene) {
      previous.setHovered(false);
      ButtonInputMediator.hoveredByCanvas.delete(canvas);
      canvas.style.cursor = "default";
    }
  }
}
