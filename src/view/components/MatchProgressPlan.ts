import { GameSnapshot } from "../../model/interfaces";
import { RunState } from "../../model/RunModel";

export interface MatchProgressSlot {
  slotNumber: number;
  opponentMatchNumber: number;
}

export interface MatchProgressState {
  defeatedThroughMatchNumber: number;
  groupMatchNumber: number;
  highlightedMatchNumber: number;
  playerMatchNumber: number;
  slots?: MatchProgressSlot[];
}

export interface MatchProgressPlan {
  defeatedMatchNumber: number;
  nextMatchNumber: number;
  initialState: MatchProgressState;
}

export class MatchProgressPlanFactory {
  public static createWinPlan(snapshot: GameSnapshot, runState: RunState): MatchProgressPlan {
    if (snapshot.firstGameplayTutorial) {
      return MatchProgressPlanFactory.createTutorialWinPlan();
    }

    const defeatedMatchNumber = snapshot.opponent?.matchNumber ?? Math.max(1, runState.matchNumber - 1);
    const nextMatchNumber = runState.matchNumber;

    return {
      defeatedMatchNumber,
      nextMatchNumber,
      initialState: {
        defeatedThroughMatchNumber: defeatedMatchNumber - 1,
        groupMatchNumber: defeatedMatchNumber,
        highlightedMatchNumber: defeatedMatchNumber,
        playerMatchNumber: defeatedMatchNumber
      }
    };
  }

  private static createTutorialWinPlan(): MatchProgressPlan {
    return {
      defeatedMatchNumber: 1,
      nextMatchNumber: 2,
      initialState: {
        defeatedThroughMatchNumber: 0,
        groupMatchNumber: 1,
        highlightedMatchNumber: 1,
        playerMatchNumber: 1,
        slots: [
          { slotNumber: 1, opponentMatchNumber: 1 },
          { slotNumber: 2, opponentMatchNumber: 1 },
          { slotNumber: 3, opponentMatchNumber: 2 }
        ]
      }
    };
  }
}
