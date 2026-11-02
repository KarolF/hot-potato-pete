import { beforeEach, describe, expect, it } from "vitest";
import { CST } from "../CST";
import { StatsModel } from "../model/StatsModel";

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

describe("StatsModel", () => {
  beforeEach(() => {
    storage.clear();
    StatsModel.resetForTests();
  });

  it("retains defaults for invalid fields while restoring valid fields", () => {
    storage.setItem(CST.STORAGE.STATS, JSON.stringify({
      wins: "invalid", losses: -1, gamesStarted: 1.5,
      tutorialSeen: "false", musicEnabled: "false", soundEnabled: false,
      opponentHintsSeen: { peeky_pete: "false", slim_mcsleeves: true, unknown: true }
    }));
    StatsModel.resetForTests();
    const model = StatsModel.getInstance();
    expect(model.getStats()).toEqual({
      wins: 0, losses: 0, gamesStarted: 0, tutorialSeen: false,
      musicEnabled: true, soundEnabled: false,
      opponentHintsSeen: { slim_mcsleeves: true }
    });
    model.recordWin();
    expect(model.getStats().wins).toBe(1);
  });

  it.each(["null", "[]", "42", '"text"'])("ignores non-object saved stats %s", (raw) => {
    storage.setItem(CST.STORAGE.STATS, raw);
    StatsModel.resetForTests();
    expect(StatsModel.getInstance().getStats().wins).toBe(0);
    expect(StatsModel.getInstance().hasSeenTutorial()).toBe(false);
  });

  it("tracks seen opponent hints independently", () => {
    const model = StatsModel.getInstance();

    expect(model.hasSeenOpponentHint("peeky_pete")).toBe(false);
    expect(model.hasSeenOpponentHint("slim_mcsleeves")).toBe(false);

    model.markOpponentHintSeen("peeky_pete");

    expect(model.hasSeenOpponentHint("peeky_pete")).toBe(true);
    expect(model.hasSeenOpponentHint("slim_mcsleeves")).toBe(false);

    StatsModel.resetForTests();
    const restored = StatsModel.getInstance();

    expect(restored.hasSeenOpponentHint("peeky_pete")).toBe(true);
    expect(restored.hasSeenOpponentHint("marked_martha")).toBe(false);
    expect(JSON.parse(storage.getItem(CST.STORAGE.STATS) || "{}").opponentHintsSeen).toEqual({
      peeky_pete: true
    });
  });
});
