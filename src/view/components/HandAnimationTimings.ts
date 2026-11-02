export interface OrderMoveDurations {
  lift: number;
  move: number;
  settle: number;
}

interface SleevesSequenceDurations {
  spreadOut: number;
  spread: number;
}

interface CircleSequenceDurations {
  enter: number;
  rotate: number;
  spread: number;
}

export class HandAnimationTimings {
  private static readonly orderLiftMaxMs = 70;
  private static readonly orderLiftMinMs = 28;
  private static readonly orderLiftRatio = 0.22;
  private static readonly orderMoveMinMs = 36;
  private static readonly sleevesSpreadOutMinMs = 120;
  private static readonly sleevesSpreadOutRatio = 0.16;
  private static readonly sleevesSpreadMinMs = 140;
  private static readonly sleevesSortDurationMultiplier = 2 / 3;
  private static readonly circleVisualStepCount = 3;
  private static readonly circleDurationMultiplier = 3;
  private static readonly circleEnterMinMs = 140;
  private static readonly circleEnterRatio = 0.22;
  private static readonly circleRotateMinMs = 360;
  private static readonly circleRotateRatio = 0.48;
  private static readonly circleSpreadMinMs = 160;
  private static readonly circleSpreadRatio = 0.3;
  private static readonly circleTravelDurationDivisor = 2;

  public static getOrderMoveDurations(duration: number): OrderMoveDurations {
    const lift = Math.min(
      HandAnimationTimings.orderLiftMaxMs,
      Math.max(HandAnimationTimings.orderLiftMinMs, duration * HandAnimationTimings.orderLiftRatio)
    );
    const settle = lift;

    return {
      lift,
      move: Math.max(HandAnimationTimings.orderMoveMinMs, duration - lift - settle),
      settle
    };
  }

  public static getSleevesSequenceDurations(
    stepDurationMs: number,
    targetOrderCount: number,
    cardCount: number
  ): SleevesSequenceDurations {
    const sequenceDuration = stepDurationMs * targetOrderCount;
    const spreadOutMin = cardCount === 2 ? 1 : HandAnimationTimings.sleevesSpreadOutMinMs;
    const spreadMin =
      (cardCount === 2 ? 1 : HandAnimationTimings.sleevesSpreadMinMs) *
      HandAnimationTimings.sleevesSortDurationMultiplier;
    const spreadOut = Math.max(
      spreadOutMin,
      sequenceDuration * HandAnimationTimings.sleevesSpreadOutRatio
    );

    return {
      spreadOut,
      spread: Math.max(
        spreadMin,
        (sequenceDuration - spreadOut) * HandAnimationTimings.sleevesSortDurationMultiplier
      )
    };
  }

  public static getCircleSequenceDurations(stepDurationMs: number): CircleSequenceDurations {
    const totalDuration =
      stepDurationMs *
      HandAnimationTimings.circleVisualStepCount *
      HandAnimationTimings.circleDurationMultiplier;

    return {
      enter: Math.max(
        HandAnimationTimings.circleEnterMinMs / HandAnimationTimings.circleTravelDurationDivisor,
        (totalDuration * HandAnimationTimings.circleEnterRatio) /
          HandAnimationTimings.circleTravelDurationDivisor
      ),
      rotate: Math.max(
        HandAnimationTimings.circleRotateMinMs,
        totalDuration * HandAnimationTimings.circleRotateRatio
      ),
      spread: Math.max(
        HandAnimationTimings.circleSpreadMinMs / HandAnimationTimings.circleTravelDurationDivisor,
        (totalDuration * HandAnimationTimings.circleSpreadRatio) /
          HandAnimationTimings.circleTravelDurationDivisor
      )
    };
  }
}
