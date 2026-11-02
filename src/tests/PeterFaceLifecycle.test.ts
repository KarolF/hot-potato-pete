import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { AnimationCancelledError } from "../utils/AnimationCancelledError";
import { createLifecycleScene, installLifecycleVisuals } from "./PhaserLifecycleFixture";

let PeterFaceView: typeof import("../view/components/PeterFaceView").PeterFaceView;

beforeAll(async () => {
  installLifecycleVisuals();
  ({ PeterFaceView } = await import("../view/components/PeterFaceView"));
});

afterEach(() => vi.clearAllMocks());
afterAll(() => vi.unstubAllGlobals());

describe("PeterFaceView lifecycle", () => {
  it("allows Phaser display-list shutdown to finish after destroying the face", () => {
    const fake = createLifecycleScene();
    const face = new PeterFaceView(fake.scene, 0, 0);
    fake.display.list.push(face);
    const laterShutdown = vi.fn();
    fake.events.once("shutdown", laterShutdown);

    expect(() => fake.events.emit("shutdown")).not.toThrow();
    expect(face.scene).toBeUndefined();
    expect(laterShutdown).toHaveBeenCalledOnce();
  });

  it("cancels pending waits and ignores stale eye callbacks during shutdown", async () => {
    const fake = createLifecycleScene();
    const face = new PeterFaceView(fake.scene, 0, 0);
    fake.display.list.push(face);
    face.focusOn({ cardId: "card", x: 20, y: 30 });
    const completeFocus = fake.tweenConfigs[1].onComplete as () => void;
    const wait = face.animationSkipController.waitForMs(fake.scene, 100);
    const finalState = vi.fn();
    const tween = face.animationSkipController.waitForTween(fake.scene, { targets: face }, finalState);

    fake.events.emit("shutdown");
    await Promise.all([
      expect(wait).rejects.toBeInstanceOf(AnimationCancelledError),
      expect(tween).rejects.toBeInstanceOf(AnimationCancelledError)
    ]);
    expect(finalState).not.toHaveBeenCalled();
    expect(fake.timer.remove).toHaveBeenCalledOnce();
    expect(() => completeFocus()).not.toThrow();
    expect(fake.time.delayedCall).toHaveBeenCalledTimes(1);
  });

  it("can be explicitly destroyed twice before scene shutdown", () => {
    const fake = createLifecycleScene();
    const face = new PeterFaceView(fake.scene, 0, 0);
    face.destroy();
    expect(() => face.destroy()).not.toThrow();
    expect(() => fake.events.emit("shutdown")).not.toThrow();
    expect(fake.tweens.killTweensOf).toHaveBeenCalledOnce();
  });
});
