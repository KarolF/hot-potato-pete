import { AnimationCancelledError } from "./AnimationCancelledError";

type SkippableTweenConfig = Phaser.Types.Tweens.TweenBuilderConfig;
interface SkipRegistration { skip: () => void; cancel: () => void; }

export class AnimationSkipController {
  private registrations = new Set<SkipRegistration>();
  private destroyed = false;
  private generation = 0;

  public canSkipCurrentAnimation(): boolean {
    return !this.destroyed && this.registrations.size > 0;
  }

  public requestSkip(): boolean {
    const registrations = [...this.registrations];
    this.registrations.clear();
    registrations.forEach((registration) => registration.skip());
    return registrations.length > 0;
  }

  public clear(): void {
    this.generation++;
    const registrations = [...this.registrations];
    this.registrations.clear();
    registrations.forEach((registration) => registration.cancel());
  }

  public destroy(): void {
    this.destroyed = true;
    this.clear();
  }

  public waitForMs(scene: Phaser.Scene, ms: number): Promise<void> {
    if (this.destroyed) return Promise.reject(new AnimationCancelledError());
    const generation = this.generation;
    return new Promise<void>((resolve, reject) => {
      const finish = () => { if (!unregister()) return; timer?.remove(false); resolve(); };
      const cancel = () => {
        timer?.remove(false);
        unregister();
        reject(new AnimationCancelledError());
      };
      const unregister = this.register(finish, cancel);
      const timer = scene.time.delayedCall(Math.max(0, ms), finish);
    }).then(() => this.assertActive(generation));
  }

  public waitForTween(
    scene: Phaser.Scene,
    config: SkippableTweenConfig,
    applyFinalState: () => void
  ): Promise<void> {
    if (this.destroyed) return Promise.reject(new AnimationCancelledError());
    const generation = this.generation;
    return new Promise<void>((resolve, reject) => {
      const stop = () => { tween?.stop(); tween?.remove(); unregister(); };
      const unregister = this.register(() => {
        stop();
        applyFinalState();
        resolve();
      }, () => {
        stop();
        reject(new AnimationCancelledError());
      });
      const tween = scene.tweens.add({ ...config, onComplete: () => { if (unregister()) resolve(); } });
    }).then(() => this.assertActive(generation));
  }

  public startTween(
    scene: Phaser.Scene,
    config: SkippableTweenConfig,
    applyFinalState: () => void
  ): void {
    if (this.destroyed) return;
    const stop = () => { tween?.stop(); tween?.remove(); unregister(); };
    const unregister = this.register(() => { stop(); applyFinalState(); }, stop);
    const tween = scene.tweens.add({ ...config, onComplete: () => unregister() });
  }

  private assertActive(generation: number): void {
    if (this.destroyed || generation !== this.generation) throw new AnimationCancelledError();
  }

  private register(skip: () => void, cancel: () => void): () => boolean {
    let active = true;
    const once = (callback: () => void) => () => {
      if (!active) return;
      callback();
    };
    const registration = { skip: once(skip), cancel: once(cancel) };
    this.registrations.add(registration);
    return () => {
      const wasActive = active;
      active = false;
      this.registrations.delete(registration);
      return wasActive;
    };
  }
}
