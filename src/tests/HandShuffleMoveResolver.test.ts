import { describe, expect, it } from "vitest";
import { HandAnimationTimings } from "../view/components/HandAnimationTimings";
import { HandShuffleMoveResolver } from "../view/components/HandShuffleMoveResolver";

describe("HandShuffleMoveResolver", () => {
  it("infers a removed and reinserted card as the moved card", () => {
    expect(
      HandShuffleMoveResolver.findMovedCardId(
        ["a", "b", "c", "d"],
        ["a", "d", "b", "c"]
      )
    ).toBe("d");
  });

  it("uses the focus card to break two-card swap ambiguity", () => {
    expect(
      HandShuffleMoveResolver.findMovedCardId(
        ["hot-potato-pete", "2_clubs"],
        ["2_clubs", "hot-potato-pete"],
        "hot-potato-pete"
      )
    ).toBe("hot-potato-pete");
  });

  it("falls back to the first changed card when a move cannot be inferred", () => {
    expect(
      HandShuffleMoveResolver.findMovedCardId(
        ["a", "b", "c", "d"],
        ["b", "a", "d", "c"]
      )
    ).toBe("b");
  });
});

describe("HandAnimationTimings", () => {
  it("makes only the sleeves sort phase 50% faster", () => {
    const durations = HandAnimationTimings.getSleevesSequenceDurations(250, 3, 3);

    expect(durations.spreadOut).toBe(120);
    expect(durations.spread).toBe(420);
  });

  it("halves only Marked Martha circle travel phases", () => {
    const durations = HandAnimationTimings.getCircleSequenceDurations(250);

    expect(durations.enter).toBe(247.5);
    expect(durations.rotate).toBe(1080);
    expect(durations.spread).toBe(337.5);
  });

  it("halves circle travel minimum durations", () => {
    const durations = HandAnimationTimings.getCircleSequenceDurations(1);

    expect(durations.enter).toBe(70);
    expect(durations.spread).toBe(80);
  });
});
