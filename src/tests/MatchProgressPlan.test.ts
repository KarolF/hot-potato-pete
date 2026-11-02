import { describe, expect, it } from "vitest";
import { CST } from "../CST";
import { OpponentModel } from "../model/OpponentModel";
import { GameSnapshot } from "../model/interfaces";
import { RunState } from "../model/RunModel";
import { MatchProgressPlanFactory } from "../view/components/MatchProgressPlan";

function createWonSnapshot(firstGameplayTutorial: boolean, matchNumber: number): GameSnapshot {
  const opponent = OpponentModel.getForMatch(matchNumber);

  return {
    seed: 1,
    phase: CST.GAME_PHASE.GAME_OVER,
    players: {
      player: { id: "player", name: CST.STRINGS.PLAYER, hand: [] },
      bot: { id: "bot", name: opponent.name, hand: [] }
    },
    discardPile: [],
    turn: "player",
    winner: "player",
    loser: "bot",
    lastEvent: CST.STRINGS.YOU_WIN,
    opponent,
    firstGameplayTutorial
  };
}

function createRunState(matchNumber: number): RunState {
  return {
    currentScore: 0,
    bestScore: 0,
    winStreak: 0,
    matchNumber,
    runActive: true,
    lastAward: null,
    isNewBest: false
  };
}

describe("MatchProgressPlanFactory", () => {
  it("shows tutorial Martha complete, current Martha, then Slim after tutorial win", () => {
    const plan = MatchProgressPlanFactory.createWinPlan(
      createWonSnapshot(true, 1),
      createRunState(1)
    );

    expect(plan.defeatedMatchNumber).toBe(1);
    expect(plan.nextMatchNumber).toBe(2);
    expect(plan.initialState.slots).toEqual([
      { slotNumber: 1, opponentMatchNumber: 1 },
      { slotNumber: 2, opponentMatchNumber: 1 },
      { slotNumber: 3, opponentMatchNumber: 2 }
    ]);
  });

  it("uses normal run match numbers after a regular first win", () => {
    const plan = MatchProgressPlanFactory.createWinPlan(
      createWonSnapshot(false, 1),
      createRunState(2)
    );

    expect(plan.defeatedMatchNumber).toBe(1);
    expect(plan.nextMatchNumber).toBe(2);
    expect(plan.initialState.slots).toBeUndefined();
    expect(plan.initialState.playerMatchNumber).toBe(1);
  });
});
