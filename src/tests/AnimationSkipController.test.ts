import { describe, expect, it, vi } from "vitest";
import { AnimationCancelledError } from "../utils/AnimationCancelledError";
import { AnimationSkipController } from "../utils/AnimationSkipController";

function fakeScene() {
  let complete = () => undefined as void;
  const timer = { remove: vi.fn() };
  const tween = { stop: vi.fn(), remove: vi.fn() };
  const scene = {
    time: { delayedCall: vi.fn((_ms: number, callback: () => void) => {
      complete = callback;
      return timer;
    }) },
    tweens: { add: vi.fn((config: Phaser.Types.Tweens.TweenBuilderConfig) => {
      complete = config.onComplete as () => void;
      return tween;
    }) }
  } as unknown as Phaser.Scene;
  return { scene, timer, tween, complete: () => complete() };
}

describe("AnimationSkipController", () => {
  it("settles a skipped wait once and ignores its late timer callback", async () => {
    const controller = new AnimationSkipController();
    const fake = fakeScene();
    const finished = vi.fn();
    const wait = controller.waitForMs(fake.scene, 100).then(finished);
    expect(controller.requestSkip()).toBe(true);
    fake.complete();
    await wait;
    expect(finished).toHaveBeenCalledTimes(1);
    expect(controller.requestSkip()).toBe(false);
    expect(fake.timer.remove).toHaveBeenCalledTimes(1);
  });

  it("applies a skipped tween's final state exactly once", async () => {
    const controller = new AnimationSkipController();
    const fake = fakeScene();
    const finalState = vi.fn();
    const wait = controller.waitForTween(fake.scene, { targets: {} }, finalState);
    controller.requestSkip();
    fake.complete();
    controller.destroy();
    await expect(wait).rejects.toBeInstanceOf(AnimationCancelledError);
    expect(finalState).toHaveBeenCalledTimes(1);
    expect(fake.tween.stop).toHaveBeenCalledTimes(1);
    expect(fake.tween.remove).toHaveBeenCalledTimes(1);
  });

  it("cancels without applying final state and rejects future waits after destroy", async () => {
    const controller = new AnimationSkipController();
    const fake = fakeScene();
    const finalState = vi.fn();
    const wait = controller.waitForTween(fake.scene, { targets: {} }, finalState);
    controller.destroy();
    fake.complete();
    await expect(wait).rejects.toBeInstanceOf(AnimationCancelledError);
    await expect(controller.waitForMs(fake.scene, 1)).rejects.toBeInstanceOf(AnimationCancelledError);
    expect(finalState).not.toHaveBeenCalled();
    expect(controller.canSkipCurrentAnimation()).toBe(false);
  });

  it("invalidates already resolved continuations on clear, and permits new waits", async () => {
    const controller = new AnimationSkipController();
    const fake = fakeScene();
    const oldWait = controller.waitForMs(fake.scene, 100);
    fake.complete();
    controller.clear();
    await expect(oldWait).rejects.toBeInstanceOf(AnimationCancelledError);
    const newWait = controller.waitForMs(fake.scene, 100);
    fake.complete();
    await expect(newWait).resolves.toBeUndefined();
  });

  it("cancels non-awaited tweens without applying their final state", () => {
    const controller = new AnimationSkipController();
    const fake = fakeScene();
    const finalState = vi.fn();
    controller.startTween(fake.scene, { targets: {} }, finalState);
    controller.destroy();
    fake.complete();
    expect(finalState).not.toHaveBeenCalled();
    expect(fake.tween.stop).toHaveBeenCalledOnce();
  });
});
