import { describe, expect, it, vi } from "vitest";
import { ButtonInputMediator } from "../mediators/ButtonInputMediator";
import { GameplayInputMediator } from "../mediators/GameplayInputMediator";
import { GameController } from "../model/GameController";
import type { GameplayScreen } from "../view/scenes/GameplayScreen";

function fakeScreen() {
  const snapshot = GameController.startNewGame(42);
  let active = true;
  let shutdown = () => undefined as void;
  const canvas = { addEventListener: vi.fn(), removeEventListener: vi.fn(), style: { cursor: "pointer" } };
  const screen = {
    game: { canvas }, scene: { isActive: () => active },
    events: { once: (_event: string, callback: () => void) => { shutdown = callback; } },
    getCurrentSnapshot: () => snapshot,
    isWaitingForAnimation: false,
    settingsModal: { visible: false }, howToPlayModal: { visible: false },
    confirmationModal: { visible: false }, opponentHintOverlay: { visible: false },
    firstGameplayTutorial: { blocksCardSelection: () => false },
    animationMediator: { canSkipCurrentAnimation: () => true }
  };
  return {
    screen: screen as unknown as GameplayScreen, canvas,
    waitForAnimation: () => { screen.isWaitingForAnimation = true; },
    stop: () => { active = false; shutdown(); }
  };
}

describe("GameplayInputMediator", () => {
  it("uses the button scene lock for card selection and animation skipping", () => {
    const fake = fakeScreen();
    const input = new GameplayInputMediator(fake.screen);
    expect(input.canSelectOpponentCard()).toBe(true);
    ButtonInputMediator.setSceneInputLocked(fake.screen, true);
    expect(input.canSelectOpponentCard()).toBe(false);
    fake.waitForAnimation();
    expect(input.canSkipAnimation()).toBe(false);
    ButtonInputMediator.setSceneInputLocked(fake.screen, false);
    expect(input.canSkipAnimation()).toBe(true);
  });

  it("removes all canvas handlers and rejects input after shutdown", () => {
    const fake = fakeScreen();
    const input = new GameplayInputMediator(fake.screen);
    fake.stop();
    for (const args of fake.canvas.addEventListener.mock.calls) {
      expect(fake.canvas.removeEventListener).toHaveBeenCalledWith(...args);
    }
    expect(fake.canvas.removeEventListener).toHaveBeenCalledTimes(3);
    expect(fake.canvas.style.cursor).toBe("default");
    expect(input.canSelectOpponentCard()).toBe(false);
  });
});
