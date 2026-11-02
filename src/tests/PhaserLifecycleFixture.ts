import { createRequire } from "node:module";
import { EventEmitter } from "eventemitter3";
import { vi } from "vitest";

const require = createRequire(import.meta.url);
const devicePath = require.resolve("phaser/src/device");
const cachedDevice = require.cache[devicePath];
// DisplayList imports browser detection for sorting, which this teardown fixture never uses.
require.cache[devicePath] = { exports: {} } as NodeJS.Module;
const GameObject = require("phaser/src/gameobjects/GameObject") as typeof Phaser.GameObjects.GameObject;
const DisplayList = require("phaser/src/gameobjects/DisplayList") as typeof Phaser.GameObjects.DisplayList;
if (cachedDevice) require.cache[devicePath] = cachedDevice;
else delete require.cache[devicePath];

class LifecycleVisual extends GameObject {
  public x: number;
  public y: number;
  public scaleX = 1;
  public scaleY = 1;
  public visible = true;
  private children: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene, x = 0, y = 0) {
    super(scene, "lifecycle-fixture");
    this.x = x;
    this.y = y;
  }

  public setDisplaySize(): this { return this; }
  public setOrigin(): this { return this; }
  public setVisible(visible: boolean): this { this.visible = visible; return this; }
  public setPosition(x: number, y: number): this { this.x = x; this.y = y; return this; }
  public setScale(x: number, y = x): this { this.scaleX = x; this.scaleY = y; return this; }
  public add(children: Phaser.GameObjects.GameObject[]): this {
    this.children.push(...children);
    return this;
  }

  public preDestroy(): void {
    this.children.forEach((child) => child.destroy(true));
    this.children = [];
  }
}

interface DisplayListFixture {
  events: EventEmitter;
  list: Phaser.GameObjects.GameObject[];
  shutdown(): void;
}

interface DisplayListLifecycle {
  start(this: DisplayListFixture): void;
  shutdown(this: DisplayListFixture): void;
}

export function installLifecycleVisuals(): void {
  vi.stubGlobal("Phaser", {
    GameObjects: { Container: LifecycleVisual, Image: LifecycleVisual },
    Math: {
      Distance: { Between: (x: number, y: number, nextX: number, nextY: number) =>
        Math.hypot(nextX - x, nextY - y) },
      Clamp: (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
    }
  });
}

export function createLifecycleScene() {
  const events = new EventEmitter();
  const tweenConfigs: Phaser.Types.Tweens.TweenBuilderConfig[] = [];
  const timer = { remove: vi.fn() };
  const tweens = {
    killTweensOf: vi.fn(),
    add: vi.fn((config: Phaser.Types.Tweens.TweenBuilderConfig) => {
      tweenConfigs.push(config);
      return { stop: vi.fn(), remove: vi.fn() };
    })
  };
  const time = { delayedCall: vi.fn(() => timer) };
  const scene = {
    events, tweens, time,
    sys: { updateList: { remove: vi.fn() }, queueDepthSort: vi.fn() }
  } as unknown as Phaser.Scene;
  const lifecycle = DisplayList.prototype as unknown as DisplayListLifecycle;
  const display: DisplayListFixture = { events, list: [], shutdown: lifecycle.shutdown };
  lifecycle.start.call(display);
  return { scene, display, events, tweens, tweenConfigs, time, timer };
}
