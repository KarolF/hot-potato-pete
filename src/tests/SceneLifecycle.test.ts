import { afterEach, describe, expect, it, vi } from "vitest";
import { GameController } from "../model/GameController";
import { PokiBridge } from "../utils/PokiBridge";
import { CustomButton } from "../view/components/CustomButton";
import { CoverScreen } from "../view/scenes/CoverScreen";
import type { GameplayScreen } from "../view/scenes/GameplayScreen";
import { GameplayResultPresenter } from "../view/scenes/GameplayResultPresenter";
import { GameplayScreenFactory } from "../view/scenes/GameplayScreenFactory";

vi.mock("../view/scenes/BaseScreen", () => ({ BaseScreen: class {} }));
vi.mock("../view/components/CustomButton", () => ({
  CustomButton: { setSceneInputLocked: vi.fn(), setInputBlocker: vi.fn() }
}));
vi.mock("../view/scenes/GameplayScreenFactory", () => ({
  GameplayScreenFactory: { createGameOverModal: vi.fn() }
}));

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
}

function fakeScreen() {
  let generation = 1;
  let snapshot = GameController.startNewGame(1500);
  const reaction = deferred();
  const screen = {
    sceneGeneration: generation,
    isSceneCurrent: (expected: number) => expected === generation,
    getCurrentSnapshot: () => snapshot,
    renderSnapshot: vi.fn((value) => { snapshot = value; }),
    renderRunState: vi.fn(), setWaitingForAnimation: vi.fn(), clearCardHover: vi.fn(),
    peterFace: { stopScanning: vi.fn(), playAngry: () => reaction.promise, playHappy: () => reaction.promise },
    game: { canvas: { style: { cursor: "pointer" } } },
    scene: { restart: vi.fn() }, handleAnimationError: vi.fn()
  };
  return {
    screen: screen as unknown as GameplayScreen, reaction,
    stale: () => { generation++; }, replaceSnapshot: () => { snapshot = GameController.startNewGame(1501); }
  };
}

afterEach(() => vi.restoreAllMocks());

describe("scene lifecycle", () => {
  it("restores the result controls when an advertisement rejects", async () => {
    const fake = fakeScreen();
    vi.spyOn(PokiBridge, "commercialBreak").mockRejectedValue(new Error("ad unavailable"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await new GameplayResultPresenter(fake.screen).playNextMatch();
    expect(CustomButton.setSceneInputLocked).toHaveBeenLastCalledWith(fake.screen, false);
    expect(fake.screen.scene.restart).not.toHaveBeenCalled();
  });

  it("does not restart or unlock a replacement scene after a late advertisement", async () => {
    const fake = fakeScreen();
    const ad = deferred();
    vi.spyOn(PokiBridge, "commercialBreak").mockReturnValue(ad.promise);
    const play = new GameplayResultPresenter(fake.screen).playNextMatch();
    fake.stale();
    ad.resolve();
    await play;
    expect(fake.screen.scene.restart).not.toHaveBeenCalled();
    expect(fake.screen.renderRunState).not.toHaveBeenCalled();
  });

  it("starts only one next match when requested twice during an advertisement", async () => {
    const fake = fakeScreen();
    const ad = deferred();
    const commercialBreak = vi.spyOn(PokiBridge, "commercialBreak").mockReturnValue(ad.promise);
    const presenter = new GameplayResultPresenter(fake.screen);
    const first = presenter.playNextMatch();
    await presenter.playNextMatch();
    expect(commercialBreak).toHaveBeenCalledOnce();
    ad.resolve();
    await first;
    expect(fake.screen.scene.restart).toHaveBeenCalledOnce();
  });

  it.each(["shutdown", "replacement snapshot"])("ignores a result reaction after %s", async (reason) => {
    const fake = fakeScreen();
    const result = fake.screen.getCurrentSnapshot()!;
    result.winner = "bot";
    new GameplayResultPresenter(fake.screen).showGameOver(result);
    if (reason === "shutdown") fake.stale();
    else fake.replaceSnapshot();
    fake.reaction.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(GameplayScreenFactory.createGameOverModal).not.toHaveBeenCalled();
  });

  it("restores the cover button and leaving flag after an advertisement rejects", async () => {
    const button = { stopPulse: vi.fn(), setActive: vi.fn() };
    const cover = {
      isLeaving: false, coverButtons: [button], sceneGeneration: 1,
      isSceneCurrent: () => true
    };
    vi.spyOn(PokiBridge, "commercialBreak").mockRejectedValue(new Error("ad unavailable"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const start = Reflect.get(CoverScreen.prototype, "startGame") as (this: CoverScreen) => Promise<void>;
    await start.call(cover as unknown as CoverScreen);
    expect(cover.isLeaving).toBe(false);
    expect(button.setActive).toHaveBeenLastCalledWith(true);
    expect(CustomButton.setSceneInputLocked).toHaveBeenLastCalledWith(cover, false);
  });
});
