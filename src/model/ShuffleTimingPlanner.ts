import { CST } from "../CST";
import { OpponentState, PeterShuffleProgress } from "./interfaces";

export class ShuffleTimingPlanner {
  public static createInitialPeterShuffleProgress(
    shuffleDurationMultiplier: number = 1
  ): PeterShuffleProgress {
    return {
      count: 0,
      lastStepCount: 0,
      lastStepDurationMs: ShuffleTimingPlanner.getPeterShuffleStepDuration(
        1,
        shuffleDurationMultiplier
      ),
      shuffleDurationMultiplier
    };
  }

  public static getOpponentShuffleDurationMultiplier(opponent: OpponentState): number {
    let multiplier =
      opponent.shuffleStyle === "sleeves" || opponent.shuffleStyle === "circle"
        ? CST.GAMEPLAY.ADVANCED_SHUFFLE_DURATION_MULTIPLIERS[opponent.difficulty]
        : 1;

    if (
      opponent.difficulty === "normal" &&
      (opponent.shuffleStyle === "peeky" || opponent.shuffleStyle === "sleeves")
    ) {
      multiplier *= CST.GAMEPLAY.NORMAL_PEEKY_OR_SLEEVES_DURATION_MULTIPLIER;
    }

    if (opponent.difficulty === "hard") {
      multiplier *= CST.GAMEPLAY.HARD_DURATION_MULTIPLIER;
    }

    if (opponent.id === "slim_mcsleeves" && opponent.difficulty === "hard") {
      multiplier *= CST.GAMEPLAY.SLIM_HARD_DURATION_MULTIPLIER;
    }

    return multiplier;
  }

  public static getStepDurationForOpponent(
    shuffleNumber: number,
    opponent: OpponentState,
    handSize: number,
    shuffleDurationMultiplier: number
  ): number {
    const stepDurationMs = ShuffleTimingPlanner.getPeterShuffleStepDuration(
      shuffleNumber,
      shuffleDurationMultiplier,
      ShuffleTimingPlanner.shouldAcceleratePeterShuffle(opponent)
    );

    if (handSize === 2 && opponent.id === "peeky_pete") {
      return Math.max(
        stepDurationMs,
        Math.round(
          CST.GAMEPLAY.PETER_SHUFFLE_BASE_STEP_DURATION_MS *
            CST.GAMEPLAY.PEEKY_TWO_CARD_SHUFFLE_DURATION_MULTIPLIER
        )
      );
    }

    if (handSize === 2 && opponent.id === "slim_mcsleeves") {
      return Math.max(
        1,
        Math.round(stepDurationMs / CST.GAMEPLAY.SLIM_TWO_CARD_SHUFFLE_DURATION_DIVISOR)
      );
    }

    return stepDurationMs;
  }

  private static shouldAcceleratePeterShuffle(opponent: OpponentState): boolean {
    return !(opponent.id === "slim_mcsleeves" && opponent.difficulty === "hard");
  }

  private static getPeterShuffleStepDuration(
    shuffleNumber: number,
    shuffleDurationMultiplier: number = 1,
    accelerates: boolean = true
  ): number {
    const multiplier = accelerates
      ? Math.pow(CST.GAMEPLAY.PETER_SHUFFLE_SPEED_MULTIPLIER, Math.max(0, shuffleNumber - 1))
      : 1;

    const normalDuration = Math.max(
      CST.GAMEPLAY.PETER_SHUFFLE_MIN_STEP_DURATION_MS,
      Math.round(CST.GAMEPLAY.PETER_SHUFFLE_BASE_STEP_DURATION_MS * multiplier)
    );

    return Math.round(normalDuration * shuffleDurationMultiplier);
  }
}
