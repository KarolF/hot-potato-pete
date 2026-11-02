import { beforeEach, describe, expect, it } from "vitest";
import { CST } from "../CST";
import { RunModel } from "../model/RunModel";

class MemoryStorage {
  private values = new Map<string, string>();

  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  public clear(): void {
    this.values.clear();
  }
}

const storage = new MemoryStorage();

Object.defineProperty(globalThis, "localStorage", {
  value: storage,
  configurable: true
});

describe("RunModel", () => {
  beforeEach(() => {
    storage.clear();
    RunModel.resetForTests();
  });

  it("adds the win bonus for the first win", () => {
    const model = RunModel.getInstance();

    model.startNewRun();
    const state = model.recordWin();

    expect(state.currentScore).toBe(1000);
    expect(state.bestScore).toBe(1000);
    expect(state.winStreak).toBe(1);
    expect(state.matchNumber).toBe(2);
    expect(state.lastAward).toEqual({ amount: 1000, label: "Win" });
    expect(storage.getItem(CST.STORAGE.RUN_HIGHSCORE)).toBe("1000");
  });

  it("adds a streak bonus after consecutive wins", () => {
    const model = RunModel.getInstance();

    model.startNewRun();
    model.recordWin();
    const state = model.recordWin();

    expect(state.currentScore).toBe(2250);
    expect(state.bestScore).toBe(2250);
    expect(state.winStreak).toBe(2);
    expect(state.matchNumber).toBe(3);
    expect(state.lastAward).toEqual({ amount: 1250, label: "Win streak" });
  });

  it("adds the marked card bonus", () => {
    const model = RunModel.getInstance();

    model.startNewRun();
    const state = model.recordMarkedCardBonus();

    expect(state.currentScore).toBe(250);
    expect(state.bestScore).toBe(250);
    expect(state.lastAward).toEqual({ amount: 250, label: "Marked card" });
    expect(storage.getItem(CST.STORAGE.RUN_HIGHSCORE)).toBe("250");
  });

  it("ends the run and resets streak on loss", () => {
    const model = RunModel.getInstance();

    model.startNewRun();
    model.recordWin();
    const state = model.recordLoss();

    expect(state.currentScore).toBe(1000);
    expect(state.bestScore).toBe(1000);
    expect(state.winStreak).toBe(0);
    expect(state.matchNumber).toBe(2);
    expect(state.runActive).toBe(false);
  });

  it("starts a new run without clearing best score", () => {
    const model = RunModel.getInstance();

    model.startNewRun();
    model.recordWin();
    model.recordLoss();
    const state = model.startNewRun();

    expect(state.currentScore).toBe(0);
    expect(state.bestScore).toBe(1000);
    expect(state.winStreak).toBe(0);
    expect(state.matchNumber).toBe(1);
    expect(state.runActive).toBe(true);
  });

  it("loads persisted best score", () => {
    storage.setItem(CST.STORAGE.RUN_HIGHSCORE, "4000");

    RunModel.resetForTests();
    const state = RunModel.getInstance().getState();

    expect(state.bestScore).toBe(4000);
  });
});
